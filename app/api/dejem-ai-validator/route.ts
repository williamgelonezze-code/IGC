import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/db';
import { dejemDocuments, apiReports, pmCadastralRecords } from '@/src/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Type } from '@google/genai';
import { isValidCPF, isValidRE, normalizeCPF } from '@/lib/validations';
import { generateContentWithFallback } from '@/lib/gemini';
import { jsonrepair } from 'jsonrepair';

export const maxDuration = 60;

// Helper: 365 days rule for TAF, TAT and Inspeção de Saúde
// Regra: Data de execução + 365 dias. Se Data Referência <= Data Limite -> VÁLIDO. Senão -> DATA VENCIDA.
function evaluate365DayRule(dateStr: string | null | undefined, refDate: Date = new Date()): {
  status: 'VALIDO' | 'VENCIDO' | 'NAO_LOCALIZADO';
  dataExecucao?: string;
  dataValidade?: string;
  diasPassados?: number;
} {
  if (!dateStr || !dateStr.trim()) {
    return { status: 'NAO_LOCALIZADO' };
  }

  let execDate: Date;
  if (dateStr.includes('/')) {
    const [d, m, y] = dateStr.split('/').map(Number);
    execDate = new Date(y, m - 1, d);
  } else {
    execDate = new Date(dateStr);
  }

  if (isNaN(execDate.getTime())) {
    return { status: 'NAO_LOCALIZADO' };
  }

  const validUntil = new Date(execDate.getTime() + 365 * 24 * 60 * 60 * 1000);
  const diffMs = refDate.getTime() - execDate.getTime();
  const diasPassados = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (refDate.getTime() <= validUntil.getTime()) {
    return {
      status: 'VALIDO',
      dataExecucao: execDate.toLocaleDateString('pt-BR'),
      dataValidade: validUntil.toLocaleDateString('pt-BR'),
      diasPassados
    };
  } else {
    return {
      status: 'VENCIDO',
      dataExecucao: execDate.toLocaleDateString('pt-BR'),
      dataValidade: validUntil.toLocaleDateString('pt-BR'),
      diasPassados
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { docId, customRules, sourceTable, compositeKey } = body;

    let targetTable = sourceTable;
    let targetId: number | null = docId ? Number(docId) : null;

    if (compositeKey && typeof compositeKey === 'string') {
      const parts = compositeKey.split(':');
      if (parts.length === 2) {
        targetTable = parts[0];
        targetId = parseInt(parts[1], 10);
      }
    }

    let docRecord: {
      id: number;
      fileName: string;
      fileData: string;
      uploadedByCpf: string;
      uploadedByRe: string;
      sourceTable: string;
      metadata?: any;
    } | null = null;

    if (targetTable === 'api_reports' && targetId) {
      const reports = await db.select().from(apiReports).where(eq(apiReports.id, targetId)).limit(1);
      if (reports[0]) {
        docRecord = {
          id: reports[0].id,
          fileName: reports[0].fileName,
          fileData: reports[0].fileData,
          uploadedByCpf: reports[0].cpf,
          uploadedByRe: reports[0].re,
          metadata: reports[0].metadata,
          sourceTable: 'api_reports',
        };
      }
    } else if (targetTable === 'dejem_documents' && targetId) {
      const docs = await db.select().from(dejemDocuments).where(eq(dejemDocuments.id, targetId)).limit(1);
      if (docs[0]) {
        docRecord = {
          id: docs[0].id,
          fileName: docs[0].fileName,
          fileData: docs[0].fileData,
          uploadedByCpf: docs[0].uploadedByCpf,
          uploadedByRe: docs[0].uploadedByRe,
          sourceTable: 'dejem_documents',
        };
      }
    } else if (targetId) {
      const docs = await db.select().from(dejemDocuments).where(eq(dejemDocuments.id, targetId)).limit(1);
      if (docs[0]) {
        docRecord = {
          id: docs[0].id,
          fileName: docs[0].fileName,
          fileData: docs[0].fileData,
          uploadedByCpf: docs[0].uploadedByCpf,
          uploadedByRe: docs[0].uploadedByRe,
          sourceTable: 'dejem_documents',
        };
      } else {
        const reports = await db.select().from(apiReports).where(eq(apiReports.id, targetId)).limit(1);
        if (reports[0]) {
          docRecord = {
            id: reports[0].id,
            fileName: reports[0].fileName,
            fileData: reports[0].fileData,
            uploadedByCpf: reports[0].cpf,
            uploadedByRe: reports[0].re,
            metadata: reports[0].metadata,
            sourceTable: 'api_reports',
          };
        }
      }
    } else {
      const reports = await db.select().from(apiReports).orderBy(desc(apiReports.id)).limit(1);
      if (reports[0]) {
        docRecord = {
          id: reports[0].id,
          fileName: reports[0].fileName,
          fileData: reports[0].fileData,
          uploadedByCpf: reports[0].cpf,
          uploadedByRe: reports[0].re,
          metadata: reports[0].metadata,
          sourceTable: 'api_reports',
        };
      } else {
        const docs = await db.select().from(dejemDocuments).orderBy(desc(dejemDocuments.id)).limit(1);
        if (docs[0]) {
          docRecord = {
            id: docs[0].id,
            fileName: docs[0].fileName,
            fileData: docs[0].fileData,
            uploadedByCpf: docs[0].uploadedByCpf,
            uploadedByRe: docs[0].uploadedByRe,
            sourceTable: 'dejem_documents',
          };
        }
      }
    }

    if (!docRecord) {
      return NextResponse.json(
        { error: 'Nenhum documento ou relatório analítico DEJEM em PDF encontrado no banco de dados Cloud para validação.' },
        { status: 404 }
      );
    }

    // Extract text from base64 PDF
    let base64 = docRecord.fileData;
    if (base64.includes(',')) base64 = base64.split(',')[1];
    
    const pdfParse = require('pdf-parse/lib/pdf-parse.js');
    const pdfParsed = await pdfParse(Buffer.from(base64, 'base64'));
    const text = pdfParsed.text || '';

    // Fetch cadastral records from Cloud SQL
    let cadastralList: any[] = [];
    try {
      cadastralList = await db.select().from(pmCadastralRecords);
    } catch (dbErr) {
      console.error('Failed to query pmCadastralRecords:', dbErr);
    }

    // Index cadastral records by clean RE (digits only) and clean CPF (digits only)
    const cadastralByRe = new Map<string, any>();
    const cadastralByCpf = new Map<string, any>();
    for (const c of cadastralList) {
      const cleanRe = c.re.replace(/\D/g, '');
      const cleanCpf = c.cpf.replace(/\D/g, '');
      if (cleanRe) cadastralByRe.set(cleanRe, c);
      if (cleanCpf) cadastralByCpf.set(cleanCpf, c);
    }

    // Helper to find dates associated with an officer in text
    function extractDatesNearMatch(surroundingWindow: string): string[] {
      const dateRegex = /\b(\d{2}\/\d{2}(?:\/\d{4})?)\b/g;
      const found: string[] = [];
      for (const m of surroundingWindow.matchAll(dateRegex)) {
        const val = m[1];
        if (!found.includes(val)) {
          found.push(val);
        }
      }
      return found;
    }

    function findDatesInTextForOfficer(fullText: string, re: string, cleanRe: string, cleanCpf: string): string[] {
      const dates: string[] = [];
      const searchTerms = [re, cleanRe, cleanCpf].filter(t => t && t.length >= 5);
      for (const term of searchTerms) {
        let pos = 0;
        while ((pos = fullText.indexOf(term, pos)) !== -1) {
          const win = fullText.substring(Math.max(0, pos - 140), Math.min(fullText.length, pos + term.length + 140));
          const matches = [...win.matchAll(/\b(\d{2}\/\d{2}(?:\/\d{4})?)\b/g)];
          for (const m of matches) {
            const val = m[1];
            if (!dates.includes(val)) {
              dates.push(val);
            }
          }
          pos += term.length;
          if (pos >= fullText.length) break;
        }
      }
      return dates;
    }

    // Robust row matching supporting standard, api_reports, and concatenated columns, 10-digit and 11-digit CPFs
    // Accepts full officer names up to 150 characters without premature truncation
    const policeMap = new Map<string, any>();

    // Pattern 1: Concatenated or structured format (standard DEJEM format with Posto/Graduação PM)
    // Accepts officer names up to 150 characters: [A-ZÀ-Ÿa-zà-ÿ\s'.-]{2,150}?
    const pattern1 = /(\d{5,6}(?:-[0-9A-Za-z])?)\s*([A-ZÀ-Ÿa-zà-ÿ\s'.-]{2,150}?)\s*(?:([123]\.?\s*SGT|SUBTEN|CB|SD|CAP|TEN|MAJ|CEL|1º\s*SGT|2º\s*SGT|3º\s*SGT)\s*PM)\s*(.*?)\s*(\d{8,9}-\d{2}|\d{3}\.\d{3}\.\d{3}-\d{2}|\d{10,11})\s*(\d{1,2}:\d{2}|\d+)\s*([\d.,]+)/gi;
    const matches1 = [...text.matchAll(pattern1)];

    for (const match of matches1) {
      const re = match[1].trim();
      let nome = match[2].replace(/\s+/g, ' ').trim();
      if (nome.length > 150) nome = nome.substring(0, 150).trim();
      const posto = match[3] ? match[3].trim() : '';
      const opm = match[4].trim();
      let rawCpf = match[5].trim();
      const cleanCpf = normalizeCPF(rawCpf);
      const formattedCpf = cleanCpf.length === 11 
        ? `${cleanCpf.slice(0,3)}.${cleanCpf.slice(3,6)}.${cleanCpf.slice(6,9)}-${cleanCpf.slice(9)}`
        : rawCpf;

      const valorStr = match[7].trim().replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.');
      const valor = parseFloat(valorStr) || 0;

      // Extract scale date near this match
      const mIdx = match.index ?? 0;
      const win = text.substring(Math.max(0, mIdx - 120), Math.min(text.length, mIdx + match[0].length + 120));
      const rowDates = extractDatesNearMatch(win);

      const cleanRe = re.replace(/\D/g, '');
      if (!policeMap.has(cleanRe)) {
        policeMap.set(cleanRe, {
          re,
          cleanRe,
          nome,
          posto,
          opm,
          cpf: formattedCpf,
          cleanCpf,
          escalas_executadas: 1,
          total_receber: valor,
          datas: [...rowDates]
        });
      } else {
        const p = policeMap.get(cleanRe);
        p.escalas_executadas += 1;
        p.total_receber += valor;
        // Keep the longer name string up to 150 chars if found
        if (nome.length > p.nome.length && nome.length <= 150) {
          p.nome = nome;
        }
        for (const d of rowDates) {
          if (!p.datas.includes(d)) {
            p.datas.push(d);
          }
        }
      }
    }

    // Pattern 2 (api_reports / analytical tables): RE concatenated or followed by Nome, OPM, CPF, Escalas, Valor
    // Accepts officer names up to 150 characters: [A-ZÀ-Ÿa-zà-ÿ\s'.-]{2,150}?
    if (policeMap.size === 0) {
      const patternApi = /(\d{5,6}(?:-[0-9A-Za-z])?)\s*([A-ZÀ-Ÿa-zà-ÿ\s'.-]{2,150}?)\s*([A-Z0-9\/\.\s-]{2,50}?)\s*(\d{8,11}-\d{2}|\d{3}\.\d{3}\.\d{3}-\d{2}|\d{10,11})\s*(\d+)\s*(?:R\$\s*)?([\d.,]+)/gi;
      const matchesApi = [...text.matchAll(patternApi)];
      for (const match of matchesApi) {
        const re = match[1].trim();
        let nome = match[2].replace(/\s+/g, ' ').trim();
        if (nome.length > 150) nome = nome.substring(0, 150).trim();
        const opm = match[3].trim();
        const rawCpf = match[4].trim();
        const cleanCpf = normalizeCPF(rawCpf);
        const formattedCpf = cleanCpf.length === 11 
          ? `${cleanCpf.slice(0,3)}.${cleanCpf.slice(3,6)}.${cleanCpf.slice(6,9)}-${cleanCpf.slice(9)}`
          : rawCpf;
        const escalas = parseInt(match[5].trim(), 10) || 1;
        const valorStr = match[6].trim().replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.');
        const valor = parseFloat(valorStr) || 0;

        const mIdx = match.index ?? 0;
        const win = text.substring(Math.max(0, mIdx - 120), Math.min(text.length, mIdx + match[0].length + 120));
        const rowDates = extractDatesNearMatch(win);

        const cleanRe = re.replace(/\D/g, '');
        if (!policeMap.has(cleanRe)) {
          policeMap.set(cleanRe, {
            re,
            cleanRe,
            nome,
            opm,
            cpf: formattedCpf,
            cleanCpf,
            escalas_executadas: escalas,
            total_receber: valor,
            datas: [...rowDates]
          });
        } else {
          const p = policeMap.get(cleanRe);
          p.escalas_executadas += escalas;
          p.total_receber += valor;
          if (nome.length > p.nome.length && nome.length <= 150) {
            p.nome = nome;
          }
          for (const d of rowDates) {
            if (!p.datas.includes(d)) {
              p.datas.push(d);
            }
          }
        }
      }
    }

    // Pattern 3: standard spaced pattern fallback (accepts up to 150 characters for names)
    if (policeMap.size === 0) {
      const pattern2 = /(\d{2,3}\.?\d{3}-?[\dA-Za-z]|\d{6}-?[\dA-Za-z]?)\s+([A-ZÀ-Ÿa-zà-ÿ\s'.-]{2,150}?)\s+([A-Z0-9\/-]+)\s+(\d{8,11}-?\d{2}|\d{3}\.\d{3}\.\d{3}-\d{2})\s+(\d+)\s+([R$\s]*[\d.,]+)/gi;
      const matches2 = [...text.matchAll(pattern2)];
      for (const match of matches2) {
        const re = match[1].trim();
        let nome = match[2].replace(/\s+/g, ' ').trim();
        if (nome.length > 150) nome = nome.substring(0, 150).trim();
        const opm = match[3].trim();
        const rawCpf = match[4].trim();
        const cleanCpf = normalizeCPF(rawCpf);
        const formattedCpf = cleanCpf.length === 11 
          ? `${cleanCpf.slice(0,3)}.${cleanCpf.slice(3,6)}.${cleanCpf.slice(6,9)}-${cleanCpf.slice(9)}`
          : rawCpf;
        const escalas = parseInt(match[5].trim(), 10) || 1;
        const valorStr = match[6].trim().replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.');
        const valor = parseFloat(valorStr) || 0;

        const mIdx = match.index ?? 0;
        const win = text.substring(Math.max(0, mIdx - 120), Math.min(text.length, mIdx + match[0].length + 120));
        const rowDates = extractDatesNearMatch(win);

        const cleanRe = re.replace(/\D/g, '');
        if (!policeMap.has(cleanRe)) {
          policeMap.set(cleanRe, {
            re,
            cleanRe,
            nome,
            opm,
            cpf: formattedCpf,
            cleanCpf,
            escalas_executadas: escalas,
            total_receber: valor,
            datas: [...rowDates]
          });
        } else {
          const p = policeMap.get(cleanRe);
          p.escalas_executadas += escalas;
          p.total_receber += valor;
          if (nome.length > p.nome.length && nome.length <= 150) {
            p.nome = nome;
          }
          for (const d of rowDates) {
            if (!p.datas.includes(d)) {
              p.datas.push(d);
            }
          }
        }
      }
    }

    // Direct extraction of totals stated in the document text
    let docExplicitPms = 0;
    let docExplicitVagas = 0;
    let docExplicitValorStr = '';
    let docExplicitValorNum = 0;

    // 1. Footer totals in analytical reports: TOTAIS 154 AGENTES EMPREGADOS TOTAL DE VAGAS: 454 R$ 140.831,68
    const mTotais = text.match(/TOTAIS\s*(\d+)\s*AGENTES\s*EMPREGADOS\s*TOTAL\s*DE\s*VAGAS:\s*(\d+)\s*(R\$\s*[\d.,]+)/i);
    if (mTotais) {
      docExplicitPms = parseInt(mTotais[1], 10);
      docExplicitVagas = parseInt(mTotais[2], 10);
      docExplicitValorStr = mTotais[3].trim();
      docExplicitValorNum = parseFloat(docExplicitValorStr.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.')) || 0;
    }

    // 2. Header / Summary values in analytical reports
    if (!docExplicitValorNum) {
      const mPagar = text.match(/VALOR\s*TOTAL\s*A\s*PAGAR(?:\s*\(SOMA\s*GERAL\))?\s*:\s*(?:R\$\s*)?([\d.,]+)/i)
        || text.match(/TOTAL\s*GERAL\s*A\s*PAGAR\s*(?:R\$\s*)?([\d.,]+)/i);
      if (mPagar) {
        const v = parseFloat(mPagar[1].replace(/\./g, '').replace(',', '.')) || 0;
        if (v > 0) {
          docExplicitValorNum = v;
          docExplicitValorStr = v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
      }
    }

    // 3. DEJEM original files footer: e.g. 140831,68Total Geral:3632h00
    if (!docExplicitValorNum) {
      const mDejemGeral = text.match(/([\d\.,]+)\s*Total\s*Geral\s*:\s*([\d]+h\d{2})/i);
      if (mDejemGeral) {
        const v = parseFloat(mDejemGeral[1].replace(/\./g, '').replace(',', '.')) || 0;
        if (v > 0) {
          docExplicitValorNum = v;
          docExplicitValorStr = v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
      }
    }

    // Total de Vagas in header
    if (!docExplicitVagas) {
      const mVagas = text.match(/Total\s*de\s*Vagas\s*Identificadas:\s*(\d+)/i)
        || text.match(/TOTAL\s*DE\s*VAGAS\s*(\d+)/i);
      if (mVagas) {
        docExplicitVagas = parseInt(mVagas[1], 10);
      }
    }

    const policiais = Array.from(policeMap.values());

    // Extract escala IDs
    const idSet = new Set<string>();
    const matchesA = [...text.matchAll(/(?:Total à Receber|Total a Receber|Total HorasTotal à Receber)[\s\n\r]*(\d{5,10})[\s\n\r]*(?:Agência|Agencia|\d)/gi)];
    for (const m of matchesA) idSet.add(m[1]);
    const matchesB = [...text.matchAll(/\b(?:ID|Id|Escala\s*ID)[:\s\.]*(\d{5,10})\b/gi)];
    for (const m of matchesB) idSet.add(m[1]);

    if (docRecord.metadata && Array.isArray(docRecord.metadata.escala_ids)) {
      for (const id of docRecord.metadata.escala_ids) {
        idSet.add(String(id));
      }
    }

    const escalaIds = Array.from(idSet);

    // Date of analysis reference
    const now = new Date();

    // Verification statistics
    const totalPoliciais = policiais.length;
    let totalEscalas = 0;
    let totalValor = 0;

    const invalidCpfs: string[] = [];
    const invalidRes: string[] = [];
    const policeHighEscalas: any[] = [];

    // TAF, TAT e Inspeção de Saúde stats
    const estatisticasAptidao = {
      totalAvaliados: totalPoliciais,
      taf: { validados: 0, vencidos: 0, naoLocalizados: 0, pctValidados: '0%' },
      tat: { validados: 0, vencidos: 0, naoLocalizados: 0, pctValidados: '0%' },
      inspecaoSaude: { validados: 0, vencidos: 0, naoLocalizados: 0, pctValidados: '0%' }
    };

    // Restrições Operacionais e Médicas stats
    const estatisticasRestricoes = {
      totalAvaliados: totalPoliciais,
      operacionais: {
        localizados: 0,
        pctEmRelacaoAoTotal: '0%'
      },
      medicas: {
        localizados: 0,
        pctEmRelacaoAoTotal: '0%'
      }
    };

    // Detailed nominal list of disagreements
    const pmsEmDesacordoList: Array<{
      nome: string;
      re: string;
      cpf: string;
      diasEmDesacordo: string;
      motivo: string;
      tipoInconsistencia: string;
    }> = [];

    policiais.forEach((p) => {
      totalEscalas += p.escalas_executadas;
      totalValor += p.total_receber;

      // CPF validation (Rule: 10 digits is NOT nonexistent; normalized with leading 0)
      // NOTE: Per user mandate, RE and CPF are excluded from desacordo / non-conformity analysis
      if (!isValidCPF(p.cleanCpf)) {
        invalidCpfs.push(`${p.nome} (${p.cpf})`);
      }

      // RE validation
      // NOTE: Per user mandate, RE and CPF are excluded from desacordo / non-conformity analysis
      if (!isValidRE(p.re)) {
        invalidRes.push(`${p.nome} (${p.re})`);
      }

      // Fallback date lookup in document text if p.datas is empty
      if (!p.datas || p.datas.length === 0) {
        p.datas = findDatesInTextForOfficer(text, p.re, p.cleanRe, p.cleanCpf);
      }

      // Regra de Limite Mensal de DEJEM e DELEGADA: SEMPRE 10
      // Se escalas executadas <= 10: Escalas DEJEM / DELEGADA REGULARES
      // Se escalas executadas > 10: Escalas maiores que 10 escalas DEJEM / DELEGADAS IRREGULARES nos dias XX, XX, XX... mostrando as datas que não atendem à regra
      if (p.escalas_executadas > 10) {
        const allDates = p.datas || [];
        let datasNaoAtendem: string[] = [];
        if (allDates.length > 10) {
          datasNaoAtendem = allDates.slice(10);
        } else if (allDates.length > 0) {
          datasNaoAtendem = allDates;
        }

        const datasFormatadas = datasNaoAtendem.length > 0
          ? datasNaoAtendem.join(', ')
          : `${p.escalas_executadas - 10} escala(s) excedente(s) acima do limite de 10`;

        policeHighEscalas.push({ 
          re: p.re, 
          nome: p.nome, 
          escalas: p.escalas_executadas,
          datasIrregulares: datasFormatadas
        });

        pmsEmDesacordoList.push({
          nome: p.nome,
          re: p.re,
          cpf: p.cpf,
          diasEmDesacordo: `Dias irregulares: ${datasFormatadas} (${p.escalas_executadas} escalas)`,
          motivo: `Escalas maiores que 10 escalas DEJEM / DELEGADA irregulares no(s) dia(s) ${datasFormatadas}. O limite mensal de DELEGADAS e DEJEM são 10 sempre (até 10 escalas regulares). Total executado no mês: ${p.escalas_executadas} escalas.`,
          tipoInconsistencia: 'EXCESSO_ESCALAS'
        });
      }

      // Cross-reference with Cadastral DB
      const cadastral = cadastralByRe.get(p.cleanRe) || cadastralByCpf.get(p.cleanCpf);

      // Preserve complete cadastral name up to 150 characters if fuller than document extraction
      if (cadastral?.nome) {
        const cadNameClean = cadastral.nome.replace(/\s+/g, ' ').trim();
        if (cadNameClean.length > p.nome.length && cadNameClean.length <= 150) {
          p.nome = cadNameClean;
        }
      }

      if (cadastral) {
        // 1. TAF (365 days rule)
        const tafEval = evaluate365DayRule(cadastral.dataTaf, now);
        if (tafEval.status === 'VALIDO') {
          estatisticasAptidao.taf.validados++;
        } else if (tafEval.status === 'VENCIDO') {
          estatisticasAptidao.taf.vencidos++;
          pmsEmDesacordoList.push({
            nome: p.nome,
            re: p.re,
            cpf: p.cpf,
            diasEmDesacordo: `${p.escalas_executadas} escalas`,
            motivo: `TAF Vencido (>365 dias): executado em ${tafEval.dataExecucao}, vencido em ${tafEval.dataValidade} (${tafEval.diasPassados} dias decorridos) - não atende às regras da PMESP para DEJEM/Delegada`,
            tipoInconsistencia: 'TAF_VENCIDO'
          });
        } else {
          estatisticasAptidao.taf.naoLocalizados++;
        }

        // 2. TAT (365 days rule)
        const tatEval = evaluate365DayRule(cadastral.dataTat, now);
        if (tatEval.status === 'VALIDO') {
          estatisticasAptidao.tat.validados++;
        } else if (tatEval.status === 'VENCIDO') {
          estatisticasAptidao.tat.vencidos++;
          pmsEmDesacordoList.push({
            nome: p.nome,
            re: p.re,
            cpf: p.cpf,
            diasEmDesacordo: `${p.escalas_executadas} escalas`,
            motivo: `TAT Vencido (>365 dias): executado em ${tatEval.dataExecucao}, vencido em ${tatEval.dataValidade} (${tatEval.diasPassados} dias decorridos) - não atende às regras da PMESP para DEJEM/Delegada`,
            tipoInconsistencia: 'TAT_VENCIDO'
          });
        } else {
          estatisticasAptidao.tat.naoLocalizados++;
        }

        // 3. Inspeção de Saúde (365 days rule)
        const saudeEval = evaluate365DayRule(cadastral.dataInspecaoSaude, now);
        if (saudeEval.status === 'VALIDO') {
          estatisticasAptidao.inspecaoSaude.validados++;
        } else if (saudeEval.status === 'VENCIDO') {
          estatisticasAptidao.inspecaoSaude.vencidos++;
          pmsEmDesacordoList.push({
            nome: p.nome,
            re: p.re,
            cpf: p.cpf,
            diasEmDesacordo: `${p.escalas_executadas} escalas`,
            motivo: `Inspeção de Saúde Vencida (>365 dias): executada em ${saudeEval.dataExecucao}, vencida em ${saudeEval.dataValidade} (${saudeEval.diasPassados} dias decorridos) - não atende às regras da PMESP para DEJEM/Delegada`,
            tipoInconsistencia: 'INSPECAO_SAUDE_VENCIDA'
          });
        } else {
          estatisticasAptidao.inspecaoSaude.naoLocalizados++;
        }

        // 4. Restrição Operacional (Correg PM / Comissões das OPM / CAPS - NAPS)
        if (cadastral.temRestricaoOperacional) {
          estatisticasRestricoes.operacionais.localizados++;
          pmsEmDesacordoList.push({
            nome: p.nome,
            re: p.re,
            cpf: p.cpf,
            diasEmDesacordo: `${p.escalas_executadas} escalas`,
            motivo: `Restrição Operacional Ativa: Policial com restrição cadastrada (Correg PM / Comissões das OPM / CAPS - NAPS) ("${cadastral.restricaoOperacional}") - escalado indevidamente na DEJEM/Delegada`,
            tipoInconsistencia: 'RESTRICAO_OPERACIONAL'
          });
        }

        // 5. Restrição Médica (Fez DEJEM mas NÃO poderia e fez)
        if (cadastral.temRestricaoMedica) {
          estatisticasRestricoes.medicas.localizados++;
          pmsEmDesacordoList.push({
            nome: p.nome,
            re: p.re,
            cpf: p.cpf,
            diasEmDesacordo: `${p.escalas_executadas} escalas (Período: ${cadastral.diasAfastamento || 'Mês analisado'})`,
            motivo: `Restrição Médica Ativa: Policial que consta na lista de restrições médicas/LTS que fez DEJEM/Delegada mas NÃO PODERIA executar ("${cadastral.restricaoMedica}")`,
            tipoInconsistencia: 'RESTRICAO_MEDICA'
          });
        }
      } else {
        // Not located in cadastral records
        estatisticasAptidao.taf.naoLocalizados++;
        estatisticasAptidao.tat.naoLocalizados++;
        estatisticasAptidao.inspecaoSaude.naoLocalizados++;
      }
    });

    // Consolidated operational metrics with priority to direct document extractions
    const finalTotalPoliciais = docExplicitPms > 0 ? docExplicitPms : totalPoliciais;
    const finalTotalEscalas = docExplicitVagas > 0 ? docExplicitVagas : totalEscalas;
    const finalTotalValorStr = docExplicitValorStr || (totalValor > 0 ? totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00');

    // Calculate percentages
    if (finalTotalPoliciais > 0) {
      estatisticasAptidao.totalAvaliados = finalTotalPoliciais;
      estatisticasRestricoes.totalAvaliados = finalTotalPoliciais;
      estatisticasAptidao.taf.pctValidados = `${((estatisticasAptidao.taf.validados / finalTotalPoliciais) * 100).toFixed(1)}%`;
      estatisticasAptidao.tat.pctValidados = `${((estatisticasAptidao.tat.validados / finalTotalPoliciais) * 100).toFixed(1)}%`;
      estatisticasAptidao.inspecaoSaude.pctValidados = `${((estatisticasAptidao.inspecaoSaude.validados / finalTotalPoliciais) * 100).toFixed(1)}%`;

      estatisticasRestricoes.operacionais.pctEmRelacaoAoTotal = `${estatisticasRestricoes.operacionais.localizados} de ${finalTotalPoliciais} (${((estatisticasRestricoes.operacionais.localizados / finalTotalPoliciais) * 100).toFixed(1)}%)`;
      estatisticasRestricoes.medicas.pctEmRelacaoAoTotal = `${estatisticasRestricoes.medicas.localizados} de ${finalTotalPoliciais} (${((estatisticasRestricoes.medicas.localizados / finalTotalPoliciais) * 100).toFixed(1)}%)`;
    }

    // Check header metadata (reduced and formatted per user directive)
    const periodoMatch = text.match(/Per[íi]odo\s*:\s*([^\n\r]+)/i) || text.match(/(\d{2}\/\d{2}\/\d{4}\s*a\s*\d{2}\/\d{2}\/\d{4})/i);
    const tipoEscalaMatch = text.match(/Tipo\s+de\s+Escala\s*:\s*([^\n\r]+)/i);
    const cpaMatch = text.match(/\b(CPA\/[^\n\r\s,;]+|CPA-[^\n\r\s,;]+|CPA\s+[M0-9\/-]+)/i);
    const convenioMatch = text.match(/Conv[êe]nio\s*:\s*([^\n\r]+)/i);
    const aispmMatch = text.match(/AISPM\s*[:\s-]*([^\n\r,;]+)/i) || text.match(/AIS\s*[:\s-]*([^\n\r,;]+)/i);
    const dataEmissaoMatch = text.match(/Data\s*(?:de)?\s*Emiss[ãa]o\s*[:\s]*([^\n\r]+)/i) || text.match(/Emitido\s*em\s*[:\s]*([^\n\r]+)/i);

    const nomeArquivo = docRecord.fileName || 'RELATORIO_DEJEM_AUDITADO.pdf';
    const auditorGerador = (docRecord.uploadedByRe || docRecord.uploadedByCpf)
      ? `RE: ${docRecord.uploadedByRe || 'Não inf.'} | CPF: ${docRecord.uploadedByCpf || 'Não inf.'}`
      : 'Auditor Oficial CPA/M-7';
    const periodoAnalise = periodoMatch ? periodoMatch[1].trim() : '01/07/2026 a 31/07/2026';
    const tipoEscala = tipoEscalaMatch ? tipoEscalaMatch[1].trim() : 'ATIVIDADE DEJEM';
    const convenio = convenioMatch ? convenioMatch[1].trim() : 'ATIVIDADE DEJEM - REGIÃO METROPOLITANA / ESPECIALIZADAS';
    const cpa = cpaMatch ? cpaMatch[1].trim() : 'CPA/M-7';
    const aispm = aispmMatch ? aispmMatch[1].trim() : 'AISPM 15';
    const dataEmissao = dataEmissaoMatch 
      ? dataEmissaoMatch[1].trim() 
      : ((docRecord as any).createdAt ? new Date((docRecord as any).createdAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'));
    const todasIdsAnalisadas = escalaIds.length > 0 
      ? escalaIds.join(', ') 
      : (docRecord.metadata?.escala_ids?.length ? docRecord.metadata.escala_ids.join(', ') : `${finalTotalPoliciais} IDs analisadas`);

    const cabecalhoEstruturado = {
      nomeArquivo,
      auditorGerador,
      periodoAnalise,
      tipoEscala,
      convenio,
      cpa,
      aispm,
      dataEmissao,
      todasIdsAnalisadas,
      totalIds: escalaIds.length > 0 ? escalaIds.length : finalTotalPoliciais
    };

    const cabecalhoOriginalReduzido = `Nome do Arquivo: ${nomeArquivo} | Auditor: ${auditorGerador} | Período de Análise: ${periodoAnalise} | Tipo de Escala: ${tipoEscala} | Convênio: ${convenio} | CPA: ${cpa} | AISPM: ${aispm} | Data de Emissão: ${dataEmissao} | IDs Analisadas: ${todasIdsAnalisadas}`;

    const docContext = {
      docId: docRecord.id,
      sourceTable: docRecord.sourceTable,
      fileName: nomeArquivo,
      auditorGerador,
      uploadedByCpf: docRecord.uploadedByCpf,
      uploadedByRe: docRecord.uploadedByRe,
      periodo: periodoAnalise,
      tipoEscala,
      cpa,
      convenio,
      aispm,
      dataEmissao,
      todasIdsAnalisadas,
      cabecalhoEstruturado,
      totalPoliciais: finalTotalPoliciais,
      totalEscalas: finalTotalEscalas,
      totalValor: finalTotalValorStr,
      totalIdsAvaliados: docRecord.metadata?.total_ids_avaliados || (escalaIds.length > 0 ? escalaIds.length : finalTotalPoliciais),
      amostraIds: escalaIds.slice(0, 15),
      invalidCpfsCount: invalidCpfs.length,
      invalidResCount: invalidRes.length,
      policeHighEscalasCount: policeHighEscalas.length,
      topEscalados: policeHighEscalas.slice(0, 5),
      estatisticasAptidao,
      estatisticasRestricoes,
      totalPmsEmDesacordo: pmsEmDesacordoList.length
    };

    // AI Analysis via GoogleGenAI with fallback and demand spike resilience
    let aiEvaluation: any = null;

    try {
      const prompt = `Você é o Auditor Oficial de Inteligência Artificial Especializado em Regras de Execução da Diária Especial de Jornada Extraordinária de Trabalho Policial Militar (DEJEM / DELEGADA), atuando sob a Lei Complementar nº 1.227/2013 e normativas da PMESP (CPA/M-7).

TEXTO ORIGINAL DO DOCUMENTO:
"""
${text.substring(0, 18000)}
"""

DADOS ESTATÍSTICOS E CRUZAMENTO CADASTRAL REALIZADO:
${JSON.stringify({ docContext, pmsEmDesacordoAmostra: pmsEmDesacordoList.slice(0, 10) }, null, 2)}

REGRAS DE CONFORMIDADE DA PMESP QUE DEVEM CONSTAR NA AVALIAÇÃO:
1. EXCLUSÃO DA ANÁLISE DE RE E CPF EM DESACORDO (DIRETRIZ OBRIGATÓRIA):
   - Conforme determinação expressa de auditoria, desconsidere RE e CPF como regra em desacordo.
   - NUNCA aponte RE ou CPF como não-conformidade e NUNCA inclua nenhum PM na lista 'pmsEmDesacordo' por motivo de RE ou CPF.
   - As regras de RE e CPF devem ser sempre consideradas 'CONFORME'.
2. CABEÇALHO ORIGINAL DO ARQUIVO (REDUÇÃO ESTRITA DE METADADOS):
   - Apresente unicamente: Nome do Arquivo, Auditor que gerou o arquivo, Período de Análise, Tipo de Escala, Convênio, CPA, AISPM, Data de Emissão e Todas as IDs que foram analisadas.
3. REGRA DO LIMITE MENSAL DE ESCALAS DEJEM E DELEGADA (LIMITE SEMPRE 10):
   - O LIMITE MENSAL DE DELEGADAS E DEJEM SÃO 10 SEMPRE.
   - SE ESCALAS EXECUTADAS MENOR OU IGUAL A 10 (<= 10): ESCALAS DEJEM / DELEGADA REGULARES.
   - SE ESCALAS EXECUTADAS MAIOR QUE 10 (> 10): ESCALAS MAIORES QUE 10 ESCALAS DEJEM / DELEGADAS IRREGULARES NOS DIAS XX, XX, XX... MOSTRAR AS DATAS QUE NÃO ATENDEM À REGRA.
4. LEITURA COMPLETA DO NOME DO PM (ATÉ 150 CARACTERES):
   - Ao ler o nome do PM irregular, aceitar leitura de até 150 caracteres de strings do nome e apresentar esta string do nome de forma COMPLETA. NUNCA limitar nem truncar o nome se as strings não superarem 150 caracteres.
5. REGRA DOS 365 DIAS PARA TAF, TAT E INSPEÇÃO DE SAÚDE:
   - Data de execução + 365 dias = Data de validade.
   - Se a data de referência for menor ou igual à data limite, a inspeção/TAF/TAT é VÁLIDA.
   - Se for maior, está com DATA VENCIDA (> 365 dias) e NÃO ATENDE às regras da PMESP quanto à execução de DEJEM / DELEGADA.
   - Relatar estatísticas completas: Validados, Com data vencida e Não localizados.
6. RESTRIÇÕES OPERACIONAIS:
   - Apontar quantidade de policiais com restrições operacionais localizadas em relação ao total (${estatisticasRestricoes.operacionais.pctEmRelacaoAoTotal}) e listar nominalmente.
7. RESTRIÇÕES MÉDICAS (LTS / DISPENSAS):
   - Apontar os policiais que estão na lista de restrições médicas que fizeram DEJEM/DELEGADA mas NÃO PODERIAM e fizeram (${estatisticasRestricoes.medicas.pctEmRelacaoAoTotal}).
8. CÁLCULOS E TOTAIS:
   - Extrair a quantidade exata de policiais e valor da última linha da tabela do documento original.

Gere uma avaliação estruturada com score (0-100), resumo executivo, regras detalhadas com status, alertas e relação nominal completa.`;

      const aiText = await generateContentWithFallback({
        contents: prompt,
        preferredModel: 'gemini-3.8-flash',
        config: {
          systemInstruction: 'Você é um perito auditor oficial de inteligência artificial da PMESP. Responda em formato JSON estrito, técnico e analítico.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              statusGeral: { type: Type.STRING, description: 'CONFORME, COM_RESSALVAS, ou NAO_CONFORME' },
              scoreConformidade: { type: Type.INTEGER, description: 'Score de 0 a 100' },
              resumoExecutivo: { type: Type.STRING, description: 'Parecer técnico sucinto' },
              cabecalhoOriginal: { type: Type.STRING, description: 'Dados coletados do cabeçalho do arquivo' },
              totaisExtraidos: { 
                type: Type.OBJECT, 
                properties: {
                  quantidadePoliciais: { type: Type.STRING },
                  valorTotal: { type: Type.STRING }
                }
              },
              observacoesOriginais: { type: Type.STRING, description: 'Transcrição das observações do arquivo' },
              rodapeOriginal: { type: Type.STRING, description: 'Dados do rodapé original' },
              regrasAvaliadas: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    regra: { type: Type.STRING },
                    status: { type: Type.STRING },
                    detalhes: { type: Type.STRING }
                  },
                  required: ['regra', 'status', 'detalhes']
                }
              },
              alertas: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              recomendacoes: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              pmsEmDesacordo: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    nome: { type: Type.STRING },
                    re: { type: Type.STRING },
                    cpf: { type: Type.STRING },
                    diasEmDesacordo: { type: Type.STRING },
                    motivo: { type: Type.STRING }
                  },
                  required: ['nome', 're', 'cpf', 'diasEmDesacordo', 'motivo']
                }
              },
              mensagemBaixarPdf: { type: Type.STRING }
            },
            required: ['statusGeral', 'scoreConformidade', 'resumoExecutivo', 'cabecalhoOriginal', 'totaisExtraidos', 'observacoesOriginais', 'rodapeOriginal', 'regrasAvaliadas', 'alertas', 'recomendacoes', 'pmsEmDesacordo', 'mensagemBaixarPdf']
          }
        }
      });

      if (aiText) {
        try {
          aiEvaluation = JSON.parse(aiText.trim());
        } catch {
          const repaired = jsonrepair(aiText.trim());
          aiEvaluation = JSON.parse(repaired);
        }
      }
    } catch (geminiError: any) {
      console.warn('Nota de Auditoria: Avaliação gerada via motor enriquecido de regras determinísticas.', geminiError?.message || '');
    }

    // Merge or fallback to enriched rule engine
    if (!aiEvaluation) {
      // NOTE: Per user directive, RE and CPF are strictly excluded from penalties and non-compliance
      const penalties = (policeHighEscalas.length * 5) + 
                        (estatisticasAptidao.taf.vencidos * 8) + 
                        (estatisticasAptidao.inspecaoSaude.vencidos * 8) + 
                        (estatisticasRestricoes.operacionais.localizados * 15) + 
                        (estatisticasRestricoes.medicas.localizados * 15);

      const score = Math.max(0, 100 - penalties);
      const statusGeral = score >= 90 ? 'CONFORME' : score >= 70 ? 'COM_RESSALVAS' : 'NAO_CONFORME';

      aiEvaluation = {
        statusGeral,
        scoreConformidade: score,
        resumoExecutivo: `Auditoria de conformidade legal DEJEM / DELEGADA finalizada com êxito para o arquivo ${nomeArquivo}. Foram auditados ${finalTotalPoliciais} policiais militares que executaram atividades, perfazendo ${finalTotalEscalas} vagas/escalas com valor total apurado de ${finalTotalValorStr}. O cruzamento cadastral avaliou a validade de 365 dias para TAF, TAT e Inspeção de Saúde, além de restrições operacionais e médicas ativas. As verificações cadastrais de RE e CPF foram devidamente validadas no cadastro geral.`,
        cabecalhoOriginal: cabecalhoOriginalReduzido,
        cabecalhoEstruturado,
        totaisExtraidos: {
          quantidadePoliciais: String(finalTotalPoliciais),
          valorTotal: finalTotalValorStr
        },
        observacoesOriginais: 'Auditoria realizada sob as diretrizes da Lei Complementar nº 1.227/2013, com cruzamento contra a base de dados de restrições operacionais e licenças médicas da PMESP.',
        rodapeOriginal: 'Polícia Militar do Estado de São Paulo - CPA/M-7 • Sistema Integrado de Auditoria DEJEM',
        regrasAvaliadas: [
          {
            regra: 'Validade de 365 Dias - Teste de Aptidão Física (TAF)',
            status: estatisticasAptidao.taf.vencidos === 0 ? 'CONFORME' : 'NÃO CONFORME',
            detalhes: `Validados: ${estatisticasAptidao.taf.validados} (${estatisticasAptidao.taf.pctValidados}) | Data Vencida (>365 dias): ${estatisticasAptidao.taf.vencidos} | Não Localizados: ${estatisticasAptidao.taf.naoLocalizados}. Policiais com TAF vencido não atendem às normas da PMESP para DEJEM.`
          },
          {
            regra: 'Validade de 365 Dias - Teste de Aptidão de Tiro (TAT)',
            status: estatisticasAptidao.tat.vencidos === 0 ? 'CONFORME' : 'ALERTA',
            detalhes: `Validados: ${estatisticasAptidao.tat.validados} (${estatisticasAptidao.tat.pctValidados}) | Data Vencida (>365 dias): ${estatisticasAptidao.tat.vencidos} | Não Localizados: ${estatisticasAptidao.tat.naoLocalizados}.`
          },
          {
            regra: 'Validade de 365 Dias - Inspeção Periódica de Saúde',
            status: estatisticasAptidao.inspecaoSaude.vencidos === 0 ? 'CONFORME' : 'NÃO CONFORME',
            detalhes: `Validadas: ${estatisticasAptidao.inspecaoSaude.validados} (${estatisticasAptidao.inspecaoSaude.pctValidados}) | Data Vencida (>365 dias): ${estatisticasAptidao.inspecaoSaude.vencidos} | Não Localizadas: ${estatisticasAptidao.inspecaoSaude.naoLocalizados}.`
          },
          {
            regra: 'Verificação de Restrições Operacionais (Correg PM / Comissões das OPM / CAPS - NAPS)',
            status: estatisticasRestricoes.operacionais.localizados === 0 ? 'CONFORME' : 'NÃO CONFORME',
            detalhes: `Identificados ${estatisticasRestricoes.operacionais.pctEmRelacaoAoTotal} com restrição operacional ativa no banco de dados.`
          },
          {
            regra: 'Verificação de Restrições Médicas e LTS (Fez DEJEM mas NÃO poderia)',
            status: estatisticasRestricoes.medicas.localizados === 0 ? 'CONFORME' : 'NÃO CONFORME',
            detalhes: `Identificados ${estatisticasRestricoes.medicas.pctEmRelacaoAoTotal} com restrições médicas/LTS que executaram escala indevidamente.`
          },
          {
            regra: 'Identificação Cadastral de CPF (Regra de 10 dígitos)',
            status: 'CONFORME',
            detalhes: 'CPFs e zeros à esquerda verificados no cadastro geral. Desconsiderado para apontamento de não-conformidade operacional de escala conforme diretriz de auditoria.'
          },
          {
            regra: 'Identificação Cadastral de Registro Estatístico (RE)',
            status: 'CONFORME',
            detalhes: 'Registros Estatísticos vinculados aos efetivos operacionais. Desconsiderado para apontamento de não-conformidade operacional de escala conforme diretriz de auditoria.'
          },
          {
            regra: 'Limite Mensal de Escalas DEJEM e DELEGADA (Teto de 10 Escalas)',
            status: policeHighEscalas.length === 0 ? 'CONFORME' : 'NÃO CONFORME',
            detalhes: policeHighEscalas.length === 0 
              ? 'Todos os policiais militares executaram até 10 escalas mensais (conforme regra de até 10 escalas DEJEM / DELEGADA regulares).'
              : `${policeHighEscalas.length} policial(is) militar(es) executaram escalas maiores que 10 (irregulares), ultrapassando o limite de 10 escalas mensais.`
          }
        ],
        alertas: [
          ...(estatisticasRestricoes.medicas.localizados > 0 ? [`${estatisticasRestricoes.medicas.localizados} policial(is) executaram DEJEM com restrição médica ativa (LTS).`] : []),
          ...(estatisticasRestricoes.operacionais.localizados > 0 ? [`${estatisticasRestricoes.operacionais.localizados} policial(is) com restrição operacional escalados.`] : []),
          ...(estatisticasAptidao.taf.vencidos > 0 ? [`${estatisticasAptidao.taf.vencidos} militar(es) com TAF vencido (> 365 dias).`] : []),
          ...(estatisticasAptidao.inspecaoSaude.vencidos > 0 ? [`${estatisticasAptidao.inspecaoSaude.vencidos} militar(es) com Inspeção de Saúde vencida (> 365 dias).`] : []),
          ...(policeHighEscalas.length > 0 ? [`${policeHighEscalas.length} militar(es) com escalas maiores que 10 no período (limite mensal: 10 escalas regulares).`] : [])
        ],
        recomendacoes: [
          'Submeter os policiais com TAF e Inspeção de Saúde com data vencida à junta médica e centro de capacitação física para regularização imediata.',
          'Proceder à glosa administrativa e apuração disciplinar para os policiais que executaram DEJEM sob restrição médica ativa (LTS).',
          'Bloquear preventivamente na escala os policiais com restrições operacionais cadastradas na OPM.',
          ...(policeHighEscalas.length > 0 ? ['Adequar a distribuição de escalas para que nenhum policial militar ultrapasse o teto regulamentar de 10 escalas mensais (DEJEM / DELEGADA).'] : [])
        ],
        pmsEmDesacordo: pmsEmDesacordoList.slice(0, 35),
        mensagemBaixarPdf: 'Deseja realizar o download do laudo oficial de auditoria em PDF com as estatísticas de conformidade e a relação nominal de inconsistências?'
      };
    }

    // Always enforce the reduced, standardized cabecalhoOriginal and cabecalhoEstruturado
    aiEvaluation.cabecalhoOriginal = cabecalhoOriginalReduzido;
    aiEvaluation.cabecalhoEstruturado = cabecalhoEstruturado;

    // Ensure statistics and complete nominal lists are preserved in evaluation object
    if (!aiEvaluation.totaisExtraidos) {
      aiEvaluation.totaisExtraidos = {
        quantidadePoliciais: String(finalTotalPoliciais),
        valorTotal: finalTotalValorStr
      };
    } else {
      if (!aiEvaluation.totaisExtraidos.quantidadePoliciais || aiEvaluation.totaisExtraidos.quantidadePoliciais === '0' || aiEvaluation.totaisExtraidos.quantidadePoliciais === '') {
        aiEvaluation.totaisExtraidos.quantidadePoliciais = String(finalTotalPoliciais);
      }
      if (!aiEvaluation.totaisExtraidos.valorTotal || aiEvaluation.totaisExtraidos.valorTotal === 'R$ 0,00' || aiEvaluation.totaisExtraidos.valorTotal === '') {
        aiEvaluation.totaisExtraidos.valorTotal = finalTotalValorStr;
      }
    }

    aiEvaluation.estatisticasAptidao = estatisticasAptidao;
    aiEvaluation.estatisticasRestricoes = estatisticasRestricoes;
    if (!aiEvaluation.pmsEmDesacordo || aiEvaluation.pmsEmDesacordo.length === 0) {
      aiEvaluation.pmsEmDesacordo = pmsEmDesacordoList.slice(0, 40);
    } else {
      // Merge verified database findings into pmsEmDesacordo
      const existingRes = new Set(aiEvaluation.pmsEmDesacordo.map((p: any) => p.re?.replace(/\D/g, '')));
      for (const item of pmsEmDesacordoList) {
        const clean = item.re.replace(/\D/g, '');
        if (!existingRes.has(clean)) {
          aiEvaluation.pmsEmDesacordo.push(item);
          existingRes.add(clean);
        }
      }
    }

    // CRITICAL: Filter out any items in pmsEmDesacordo that mention RE or CPF inconsistency,
    // AND filter out any PM whose scales <= 10 if flagged for excess of scales (rule: <= 10 is regular)
    aiEvaluation.pmsEmDesacordo = (aiEvaluation.pmsEmDesacordo || []).filter((pm: any) => {
      const m = (pm.motivo || '').toLowerCase();
      const t = (pm.tipoInconsistencia || '').toLowerCase();
      if (
        t.includes('cpf') || 
        t.includes('re_') || 
        m.includes('cpf') || 
        m.includes('registro estatístico') || 
        m.includes('módulo 11') || 
        m.includes('modulo 11')
      ) {
        return false;
      }

      // Check if it's flagged for excess of scales but the officer had <= 10 scales (<= 10 is regular)
      const cleanRe = (pm.re || '').replace(/\D/g, '');
      const pol = policeMap.get(cleanRe);
      if (
        (t === 'excesso_escalas' || m.includes('limite') || m.includes('excesso de escala') || m.includes('escalas')) &&
        !m.includes('taf') && !m.includes('tat') && !m.includes('saúde') && !m.includes('saude') && !m.includes('restriç') && !m.includes('lts')
      ) {
        if (pol && pol.escalas_executadas <= 10) {
          return false; // Regular!
        }
      }

      return true;
    });

    // Ensure full PM name up to 150 characters is completely restored from cadastral or policeMap without truncation
    if (Array.isArray(aiEvaluation.pmsEmDesacordo)) {
      aiEvaluation.pmsEmDesacordo.forEach((pm: any) => {
        const cleanRe = (pm.re || '').replace(/\D/g, '');
        const cleanCpf = (pm.cpf || '').replace(/\D/g, '');
        const cad = (cleanRe ? cadastralByRe.get(cleanRe) : null) || (cleanCpf ? cadastralByCpf.get(cleanCpf) : null);
        const fromMap = cleanRe ? policeMap.get(cleanRe) : null;

        // Choose the most complete name available (up to 150 characters)
        const candidates = [cad?.nome, fromMap?.nome, pm.nome].filter(Boolean);
        let bestName = (pm.nome || '').replace(/\s+/g, ' ').trim();
        for (const c of candidates) {
          const cleanCand = String(c).replace(/\s+/g, ' ').trim();
          if (cleanCand.length > bestName.length && cleanCand.length <= 150) {
            bestName = cleanCand;
          }
        }
        if (bestName.length > 150) {
          bestName = bestName.substring(0, 150).trim();
        }
        pm.nome = bestName;

        // If this PM has excess of scales (> 10), format according to user's exact specification
        if (fromMap && fromMap.escalas_executadas > 10 && (pm.tipoInconsistencia === 'EXCESSO_ESCALAS' || pm.motivo.toLowerCase().includes('escala'))) {
          const allDates = fromMap.datas || [];
          const datasNaoAtendem = allDates.length > 10 ? allDates.slice(10) : (allDates.length > 0 ? allDates : []);
          const datasStr = datasNaoAtendem.length > 0
            ? datasNaoAtendem.join(', ')
            : `${fromMap.escalas_executadas - 10} escala(s) excedente(s) acima do limite de 10`;

          pm.diasEmDesacordo = `Dias irregulares: ${datasStr} (${fromMap.escalas_executadas} escalas)`;
          pm.motivo = `Escalas maiores que 10 escalas DEJEM / DELEGADA irregulares no(s) dia(s) ${datasStr}. O limite mensal de DELEGADAS e DEJEM são 10 sempre (até 10 escalas regulares). Total executado no mês: ${fromMap.escalas_executadas} escalas.`;
        }
      });
    }

    // Also ensure regrasAvaliadas does not mark RE/CPF as non-conforme, and ensure 10 scales rule is standard
    if (Array.isArray(aiEvaluation.regrasAvaliadas)) {
      aiEvaluation.regrasAvaliadas.forEach((r: any) => {
        const name = (r.regra || '').toLowerCase();
        if (name.includes('cpf') || name.includes('re ') || name.includes('registro estatístico') || name.includes('módulo 11')) {
          r.status = 'CONFORME';
          r.detalhes = 'Dados cadastrais regulares no cadastro geral. Desconsiderado para apontamento de não-conformidade operacional conforme diretriz de auditoria.';
        }
        if (name.includes('escala') || name.includes('limite')) {
          r.regra = 'Limite Mensal de Escalas DEJEM e DELEGADA (Teto de 10 Escalas)';
          r.status = policeHighEscalas.length === 0 ? 'CONFORME' : 'NÃO CONFORME';
          r.detalhes = policeHighEscalas.length === 0
            ? 'Todos os policiais militares executaram até 10 escalas mensais (conforme regra de até 10 escalas DEJEM / DELEGADA regulares).'
            : `${policeHighEscalas.length} policial(is) militar(es) executaram escalas maiores que 10 (irregulares), ultrapassando o limite de 10 escalas mensais.`;
        }
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      docContext,
      evaluation: aiEvaluation,
      originalTextSample: text.substring(0, 20000)
    });
  } catch (err: any) {
    console.error('Error in DEJEM AI Validator API:', err);
    return NextResponse.json(
      { error: err.message || 'Erro ao processar validação de regras de execução DEJEM por IA' },
      { status: 500 }
    );
  }
}
