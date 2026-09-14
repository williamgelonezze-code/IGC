import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { operationalDocuments, operationalDownloads } from '@/src/db/schema';
import { eq, desc, count } from 'drizzle-orm';
import { isValidCPF, isValidRE } from '@/lib/validations';
import { generateSampleOperationalXls, generateSampleCapOperationalXlsWithBO } from '@/lib/operationalSpreadsheetGenerator';

// GET all operational documents metadata with download count
export async function GET() {
  try {
    let docs = await db.query.operationalDocuments.findMany({
      columns: {
        id: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        description: true,
        uploadedByCpf: true,
        uploadedByRe: true,
        metadata: true,
        createdAt: true,
      },
      orderBy: (operationalDocuments, { desc }) => [desc(operationalDocuments.createdAt)],
    });

    // Check if CAP operational spreadsheet with NumeroBO exists, otherwise insert it
    const hasCapSheet = docs.some(d => d.fileName.includes('CAP') && d.fileName.includes('OCORRENCIAS'));
    if (!hasCapSheet) {
      try {
        const capSample = generateSampleCapOperationalXlsWithBO();
        await db.insert(operationalDocuments).values({
          fileName: "DADOS_OPERACIONAIS_CAP_OCORRENCIAS_2026.xls",
          fileData: capSample,
          fileType: "xls",
          fileSize: "34.2 KB",
          description: "Planilha Operacional CAP contendo registros de ocorrências policiais, Boletins de Ocorrência (NumeroBO) e Históricos para padronização",
          uploadedByCpf: "111.222.333-44",
          uploadedByRe: "123.456-7",
          metadata: {
            tipo: "CAP_OCORRENCIAS",
            ano: "2026",
            colunasChave: ["NumeroBO", "Historico", "Data", "Unidade", "Modalidade"],
            totalRegistros: 7,
            duplicidadesEsperadas: 3,
            status: "Pronto para Padronização",
          },
        });

        // Re-fetch docs
        docs = await db.query.operationalDocuments.findMany({
          columns: {
            id: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            description: true,
            uploadedByCpf: true,
            uploadedByRe: true,
            metadata: true,
            createdAt: true,
          },
          orderBy: (operationalDocuments, { desc }) => [desc(operationalDocuments.createdAt)],
        });
      } catch (capErr) {
        console.warn('Erro ao semear planilha CAP:', capErr);
      }
    }

    // Auto-seed initial operational spreadsheets if empty
    if (docs.length === 0) {
      try {
        const sample1 = generateSampleOperationalXls("Consolidado Geral de Efetivo e Produtividade", "JUNHO/2026");
        const sample2 = generateSampleOperationalXls("RAC Mensal II e Operações Adaga / Visibilidade", "JULHO/2026");
        const sample3 = generateSampleCapOperationalXlsWithBO();
        
        await db.insert(operationalDocuments).values([
          {
            fileName: "DADOS_OPERACIONAIS_CAP_OCORRENCIAS_2026.xls",
            fileData: sample3,
            fileType: "xls",
            fileSize: "34.2 KB",
            description: "Planilha Operacional CAP contendo registros de ocorrências policiais, Boletins de Ocorrência (NumeroBO) e Históricos para padronização",
            uploadedByCpf: "111.222.333-44",
            uploadedByRe: "123.456-7",
            metadata: {
              tipo: "CAP_OCORRENCIAS",
              ano: "2026",
              colunasChave: ["NumeroBO", "Historico", "Data", "Unidade"],
              status: "Pronto para Padronização",
            },
          },
          {
            fileName: "DADOS_OPERACIONAIS_CPAM7_JUNHO_2026.xls",
            fileData: sample1,
            fileType: "xls",
            fileSize: "28.5 KB",
            description: "Planilha consolidada de dados operacionais, efetivo, viaturas e prisões do CPA/M-7 - Mês Junho/2026",
            uploadedByCpf: "111.222.333-44",
            uploadedByRe: "123.456-7",
            metadata: {
              mes: "Junho",
              ano: "2026",
              unidades: ["15º BPM/M", "26º BPM/M", "31º BPM/M", "44º BPM/M"],
              totalRegistros: 176,
              status: "Auditado",
            },
          },
          {
            fileName: "RAC_MENSAL_INDICADORES_CONSOLIDADOS_2026.xls",
            fileData: sample2,
            fileType: "xls",
            fileSize: "32.0 KB",
            description: "Relatório de Avaliação de Comando (RAC) e Indicadores de Produtividade Operacional das Companhias",
            uploadedByCpf: "222.333.444-55",
            uploadedByRe: "987.654-3",
            metadata: {
              mes: "Julho",
              ano: "2026",
              unidades: ["CPA/M-7 Geral"],
              totalRegistros: 210,
              status: "Auditado",
            },
          }
        ]);


        docs = await db.query.operationalDocuments.findMany({
          columns: {
            id: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            description: true,
            uploadedByCpf: true,
            uploadedByRe: true,
            metadata: true,
            createdAt: true,
          },
          orderBy: (operationalDocuments, { desc }) => [desc(operationalDocuments.createdAt)],
        });
      } catch (seedErr) {
        console.error('Error auto-seeding operational docs:', seedErr);
      }
    }

    // Get download counts per document
    const downloads = await db.select({
      documentId: operationalDownloads.documentId,
      count: count(operationalDownloads.id),
    }).from(operationalDownloads).groupBy(operationalDownloads.documentId);

    const downloadCountMap = new Map<number, number>();
    downloads.forEach(d => {
      downloadCountMap.set(d.documentId, Number(d.count));
    });

    const docsWithCounts = docs.map(doc => ({
      ...doc,
      downloadCount: downloadCountMap.get(doc.id) || 0,
    }));

    return NextResponse.json({ docs: docsWithCounts });
  } catch (error) {
    console.error('Error fetching operational docs:', error);
    return NextResponse.json({ error: 'Falha ao buscar planilhas operacionais' }, { status: 500 });
  }
}

// POST new operational document
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fileName, fileData, fileType = 'xls', fileSize, description, uploadedByCpf, uploadedByRe, metadata } = body;

    if (!fileName || !fileData || !uploadedByCpf || !uploadedByRe) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    if (!isValidCPF(uploadedByCpf)) {
      return NextResponse.json({ error: 'CPF do responsável inválido' }, { status: 400 });
    }

    if (!isValidRE(uploadedByRe)) {
      return NextResponse.json({ error: 'RE do responsável inválido (falha no Módulo 11)' }, { status: 400 });
    }

    const [newDoc] = await db.insert(operationalDocuments).values({
      fileName,
      fileData,
      fileType: fileType.toLowerCase(),
      fileSize: fileSize || null,
      description: description || null,
      uploadedByCpf,
      uploadedByRe,
      metadata: metadata || null,
    }).returning({ id: operationalDocuments.id });

    return NextResponse.json({ success: true, docId: newDoc.id });
  } catch (error) {
    console.error('Error uploading operational doc:', error);
    return NextResponse.json({ error: 'Falha ao realizar upload da planilha de dados operacionais' }, { status: 500 });
  }
}
