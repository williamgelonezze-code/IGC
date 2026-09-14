import { NextRequest, NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import { db } from '@/src/db';
import { pmCadastralRecords } from '@/src/db/schema';

export async function POST(req: NextRequest) {
  try {
    const { result, docContext, validatorCpf, validatorRe, userIp } = await req.json();

    // 1. Metadados do IP do Solicitante capturados do request
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const cfIp = req.headers.get('cf-connecting-ip');
    const rawIp = forwarded ? forwarded.split(',')[0].trim() : (realIp || cfIp || userIp || '127.0.0.1');
    const ipSolicitante = rawIp.replace(/^::ffff:/, '');

    // Consolidated cabecalho metadata (reduced per user directive)
    const cab = result.cabecalhoEstruturado || docContext?.cabecalhoEstruturado || {};
    const nomeArquivo = cab.nomeArquivo || docContext?.fileName || 'RELATORIO_DEJEM_AUDITADO.pdf';

    // 2. Consulta no sistema para obter dados do auditor que solicitou a impressão
    const cleanValidatorRe = (validatorRe || '').replace(/\D/g, '');
    const cleanValidatorCpf = (validatorCpf || '').replace(/\D/g, '');
    const reExibicao = validatorRe || (cleanValidatorRe ? cleanValidatorRe : 'Não informado');
    const cpfExibicao = validatorCpf || (cleanValidatorCpf ? cleanValidatorCpf : 'Não informado');
    const dadosAuditor = `RE: ${reExibicao} | CPF: ${cpfExibicao}`;

    // 3. Formatação da Data e Hora da Impressão observando a máscara sugerida: DATA DE IMPRESSÃO: XX/XX/XX  HORA: XX:XX H
    const printNow = new Date();
    const pad2 = (n: number) => String(n).padStart(2, '0');
    const printDia = pad2(printNow.getDate());
    const printMes = pad2(printNow.getMonth() + 1);
    const printAno2 = String(printNow.getFullYear()).slice(-2);
    const printHora = pad2(printNow.getHours());
    const printMin = pad2(printNow.getMinutes());
    const textoDataHoraImpressao = `DATA DE IMPRESSÃO: ${printDia}/${printMes}/${printAno2}  HORA: ${printHora}:${printMin} H`;

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 35, bottom: 45, left: 40, right: 40 },
        bufferPages: true
      });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const startX = 40;
      const pageWidth = 515;
      const endX = startX + pageWidth; // 555
      const maxContentY = 765; // Margem de segurança confortável antes do rodapé (inicia em 792pt)

      // Consolidated cabecalho metadata (reduced per user directive)
      const cab = result.cabecalhoEstruturado || docContext?.cabecalhoEstruturado || {};
      const nomeArquivo = cab.nomeArquivo || docContext?.fileName || 'RELATORIO_DEJEM_AUDITADO.pdf';
      const auditorGerador = cab.auditorGerador || docContext?.auditorGerador || (validatorRe ? `RE: ${validatorRe} | CPF: ${validatorCpf || 'Não inf.'}` : 'Auditor Oficial CPA/M-7');
      const periodoAnalise = cab.periodoAnalise || docContext?.periodo || '01/07/2026 a 31/07/2026';
      const tipoEscala = cab.tipoEscala || docContext?.tipoEscala || 'ATIVIDADE DEJEM';
      const convenio = cab.convenio || docContext?.convenio || 'ATIVIDADE DEJEM - REGIÃO METROPOLITANA / ESPECIALIZADAS';
      const cpa = cab.cpa || docContext?.cpa || 'CPA/M-7';
      const aispm = cab.aispm || docContext?.aispm || 'AISPM 15';
      const dataEmissao = cab.dataEmissao || docContext?.dataEmissao || new Date().toLocaleDateString('pt-BR');
      const todasIds = cab.todasIdsAnalisadas || docContext?.todasIdsAnalisadas || 'IDs analisadas no documento';

      // Helper for running header on page 2+
      const drawRunningHeader = () => {
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#1e293b').text('AUDITORIA ELETRÔNICA DEJEM / DELEGADA • PARECER DE IA', startX, 22, { width: 340, lineBreak: false });
        doc.font('Helvetica').fontSize(7.5).fillColor('#64748b').text(`Doc: ${nomeArquivo}`, startX + 340, 22, { width: 175, align: 'right', lineBreak: false, ellipsis: true });
        doc.moveTo(startX, 32).lineTo(endX, 32).strokeColor('#cbd5e1').lineWidth(0.75).stroke();
        doc.y = 44;
      };

      // Helper to ensure enough space before rendering a section block without spawning blank pages
      const ensureSpace = (neededHeight: number) => {
        if (doc.y + neededHeight > maxContentY) {
          doc.addPage();
          drawRunningHeader();
        }
      };

      // Page 1 Header Banner
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#475569').text('POLÍCIA MILITAR DO ESTADO DE SÃO PAULO', startX, 28, { width: pageWidth, align: 'center' });
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#64748b').text('COMANDO DE POLICIAMENTO DE ÁREA METROPOLITANA SETE - CPA/M-7', startX, 41, { width: pageWidth, align: 'center' });
      doc.font('Helvetica-Bold').fontSize(11.5).fillColor('#0f172a').text('LAUDO DE AUDITORIA DEJEM / DELEGADA - PARECER DE IA', startX, 55, { width: pageWidth, align: 'center' });
      doc.moveTo(startX, 72).lineTo(endX, 72).strokeColor('#0284c7').lineWidth(1.5).stroke();
      doc.y = 90;

      // 1. INFORMAÇÕES GERAIS DA AUDITORIA
      ensureSpace(70);
      const infoBoxY = doc.y;
      const infoBoxH = 62;
      doc.rect(startX, infoBoxY, pageWidth, infoBoxH).fillAndStroke('#f8fafc', '#cbd5e1');
      doc.fillColor('#0f172a');

      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#0369a1').text('INFORMAÇÕES GERAIS DA AUDITORIA', startX + 10, infoBoxY + 8);
      
      const col1X = startX + 10;
      const col2X = startX + 260;

      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#334155');
      doc.text('Documento Auditado: ', col1X, infoBoxY + 24, { lineBreak: false });
      doc.font('Helvetica').text(nomeArquivo, col1X + 90, infoBoxY + 24, { width: 155, ellipsis: true, lineBreak: false });

      doc.font('Helvetica-Bold').text('Data da Auditoria: ', col1X, infoBoxY + 41, { lineBreak: false });
      doc.font('Helvetica').text(new Date().toLocaleString('pt-BR'), col1X + 90, infoBoxY + 41, { width: 155, lineBreak: false });

      // Solicitante: CPF first, then RE
      doc.font('Helvetica-Bold').text('Solicitante (CPF): ', col2X, infoBoxY + 24, { lineBreak: false });
      doc.font('Helvetica').text(validatorCpf || 'Não informado', col2X + 75, infoBoxY + 24, { width: 165, lineBreak: false });

      doc.font('Helvetica-Bold').text('Solicitante (RE): ', col2X, infoBoxY + 41, { lineBreak: false });
      doc.font('Helvetica').text(validatorRe || 'Não informado', col2X + 75, infoBoxY + 41, { width: 165, lineBreak: false });

      doc.y = infoBoxY + infoBoxH + 12;

      // Cabeçalho Original (Reduzido e Estruturado: Nome do arquivo, Auditor, Período, Tipo Escala, Convênio, CPA, AISPM, Data Emissão e IDs)
      doc.font('Helvetica').fontSize(7);
      const idsWrappedH = doc.heightOfString(`IDs Analisadas: ${todasIds}`, { width: pageWidth - 20, lineGap: 1.2 });
      const origBoxH = 20 + (4 * 13) + 8 + idsWrappedH + 10;
      ensureSpace(origBoxH + 10);

      const origBoxY = doc.y;
      doc.rect(startX, origBoxY, pageWidth, origBoxH).fillAndStroke('#f1f5f9', '#cbd5e1');
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#334155').text('CABEÇALHO ORIGINAL DO ARQUIVO (METADADOS CONSOLIDADOS)', startX + 10, origBoxY + 7);

      const headCol1X = startX + 10;
      const headCol2X = startX + 260;

      // Line 1: Nome do Arquivo / Convênio
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#475569').text('Nome do Arquivo: ', headCol1X, origBoxY + 21, { lineBreak: false });
      doc.font('Helvetica').fillColor('#0f172a').text(nomeArquivo, headCol1X + 75, origBoxY + 21, { width: 170, ellipsis: true, lineBreak: false });

      doc.font('Helvetica-Bold').fillColor('#475569').text('Convênio: ', headCol2X, origBoxY + 21, { lineBreak: false });
      doc.font('Helvetica').fillColor('#0f172a').text(convenio, headCol2X + 50, origBoxY + 21, { width: 195, ellipsis: true, lineBreak: false });

      // Line 2: Auditor que Gerou / CPA
      doc.font('Helvetica-Bold').fillColor('#475569').text('Auditor que Gerou: ', headCol1X, origBoxY + 34, { lineBreak: false });
      doc.font('Helvetica').fillColor('#0f172a').text(auditorGerador, headCol1X + 75, origBoxY + 34, { width: 170, ellipsis: true, lineBreak: false });

      doc.font('Helvetica-Bold').fillColor('#475569').text('CPA: ', headCol2X, origBoxY + 34, { lineBreak: false });
      doc.font('Helvetica').fillColor('#0f172a').text(cpa, headCol2X + 50, origBoxY + 34, { width: 195, lineBreak: false });

      // Line 3: Período de Análise / AISPM
      doc.font('Helvetica-Bold').fillColor('#475569').text('Período de Análise: ', headCol1X, origBoxY + 47, { lineBreak: false });
      doc.font('Helvetica').fillColor('#0f172a').text(periodoAnalise, headCol1X + 75, origBoxY + 47, { width: 170, lineBreak: false });

      doc.font('Helvetica-Bold').fillColor('#475569').text('AISPM: ', headCol2X, origBoxY + 47, { lineBreak: false });
      doc.font('Helvetica').fillColor('#0f172a').text(aispm, headCol2X + 50, origBoxY + 47, { width: 195, lineBreak: false });

      // Line 4: Tipo de Escala / Data de Emissão
      doc.font('Helvetica-Bold').fillColor('#475569').text('Tipo de Escala: ', headCol1X, origBoxY + 60, { lineBreak: false });
      doc.font('Helvetica').fillColor('#0f172a').text(tipoEscala, headCol1X + 75, origBoxY + 60, { width: 170, lineBreak: false });

      doc.font('Helvetica-Bold').fillColor('#475569').text('Data de Emissão: ', headCol2X, origBoxY + 60, { lineBreak: false });
      doc.font('Helvetica').fillColor('#0f172a').text(dataEmissao, headCol2X + 75, origBoxY + 60, { width: 170, lineBreak: false });

      // Divider inside box
      doc.moveTo(headCol1X, origBoxY + 74).lineTo(endX - 10, origBoxY + 74).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

      // Line 5: IDs Analisadas (wrap justified)
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#475569').text('Todas as IDs Analisadas: ', headCol1X, origBoxY + 78, { lineBreak: false });
      doc.font('Helvetica').fontSize(6.5).fillColor('#1e293b').text(todasIds, headCol1X, origBoxY + 89, {
        width: pageWidth - 20,
        align: 'justify',
        lineGap: 1.2
      });

      doc.y = origBoxY + origBoxH + 12;

      // 2. DADOS E MÉTRICAS OPERACIONAIS COLETADAS
      ensureSpace(58);
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#0f172a').text('DADOS E MÉTRICAS OPERACIONAIS COLETADAS', startX, doc.y);
      doc.y += 4;

      const metricBoxY = doc.y;
      doc.rect(startX, metricBoxY, pageWidth, 42).fillAndStroke('#ffffff', '#cbd5e1');
      const mColW = pageWidth / 4;

      // Extract accurate PMs count and total value
      let qtePoliciais = 0;
      if (docContext?.totalPoliciais && docContext.totalPoliciais > 0) {
        qtePoliciais = docContext.totalPoliciais;
      } else if (result.totaisExtraidos?.quantidadePoliciais) {
        qtePoliciais = parseInt(String(result.totaisExtraidos.quantidadePoliciais).replace(/\D/g, ''), 10) || 0;
      }

      let valorTotal = result.totaisExtraidos?.valorTotal || docContext?.totalValor || 'R$ 0,00';
      if (typeof valorTotal === 'number') {
        valorTotal = (valorTotal as number).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      } else if (typeof valorTotal === 'string') {
        if (!valorTotal.includes('R$')) {
          const parsedNum = parseFloat(valorTotal.replace(/\./g, '').replace(',', '.'));
          if (!isNaN(parsedNum) && parsedNum > 0) {
            valorTotal = parsedNum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          }
        }
      }

      const totalIds = docContext?.totalIdsAvaliados || (qtePoliciais > 0 ? qtePoliciais : 0);
      const escalasSuspeitas = result.pmsEmDesacordo ? result.pmsEmDesacordo.length : 0;

      // Metric 1: IDs
      doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#64748b').text('TOTAL DE IDS AUDITADAS', startX + 4, metricBoxY + 6, { width: mColW - 8, align: 'center', lineBreak: false });
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a').text(String(totalIds), startX + 4, metricBoxY + 20, { width: mColW - 8, align: 'center', lineBreak: false });

      // Metric 2: Policiais que Executaram as Atividades
      doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#64748b').text('PMs EXECUTARAM ATIVIDADES', startX + mColW + 4, metricBoxY + 6, { width: mColW - 8, align: 'center', lineBreak: false });
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#0284c7').text(String(qtePoliciais), startX + mColW + 4, metricBoxY + 20, { width: mColW - 8, align: 'center', lineBreak: false });

      // Metric 3: Total R$
      doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#64748b').text('VALOR TOTAL A PAGAR', startX + (mColW * 2) + 4, metricBoxY + 6, { width: mColW - 8, align: 'center', lineBreak: false });
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#16a34a').text(String(valorTotal), startX + (mColW * 2) + 4, metricBoxY + 20, { width: mColW - 8, align: 'center', lineBreak: false });

      // Metric 4: Suspeição
      doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#64748b').text('PMs EM DESACORDO', startX + (mColW * 3) + 4, metricBoxY + 6, { width: mColW - 8, align: 'center', lineBreak: false });
      doc.font('Helvetica-Bold').fontSize(10).fillColor(escalasSuspeitas > 0 ? '#e11d48' : '#16a34a').text(String(escalasSuspeitas), startX + (mColW * 3) + 4, metricBoxY + 20, { width: mColW - 8, align: 'center', lineBreak: false });

      doc.y = metricBoxY + 52;

      // 3. ESTATÍSTICAS DE CONFORMIDADE: TAF, TAT E INSPEÇÃO DE SAÚDE (REGRA DE 365 DIAS)
      const apt = result.estatisticasAptidao || docContext?.estatisticasAptidao;
      if (apt) {
        ensureSpace(74);
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#0369a1').text('ESTATÍSTICAS DE REGULARIDADE FÍSICA E SAÚDE (REGRA DE 365 DIAS)', startX, doc.y);
        doc.y += 4;

        const aptBoxY = doc.y;
        doc.rect(startX, aptBoxY, pageWidth, 52).fillAndStroke('#f0f9ff', '#bae6fd');
        const colW3 = pageWidth / 3;

        // Col 1: TAF
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#0369a1').text('TAF (Aptidão Física)', startX + 6, aptBoxY + 6, { width: colW3 - 12, align: 'center' });
        doc.font('Helvetica').fontSize(7).fillColor('#334155');
        doc.text(`Validados (<=365d): ${apt.taf?.validados || 0}`, startX + 12, aptBoxY + 18);
        doc.text(`Vencidos (>365d): ${apt.taf?.vencidos || 0}`, startX + 12, aptBoxY + 28);
        doc.text(`Não Localizados: ${apt.taf?.naoLocalizados || 0}`, startX + 12, aptBoxY + 38);

        // Col 2: TAT
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#0369a1').text('TAT (Aptidão de Tiro)', startX + colW3 + 6, aptBoxY + 6, { width: colW3 - 12, align: 'center' });
        doc.font('Helvetica').fontSize(7).fillColor('#334155');
        doc.text(`Validados (<=365d): ${apt.tat?.validados || 0}`, startX + colW3 + 12, aptBoxY + 18);
        doc.text(`Vencidos (>365d): ${apt.tat?.vencidos || 0}`, startX + colW3 + 12, aptBoxY + 28);
        doc.text(`Não Localizados: ${apt.tat?.naoLocalizados || 0}`, startX + colW3 + 12, aptBoxY + 38);

        // Col 3: Inspeção de Saúde
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#0369a1').text('Inspeção de Saúde', startX + (colW3 * 2) + 6, aptBoxY + 6, { width: colW3 - 12, align: 'center' });
        doc.font('Helvetica').fontSize(7).fillColor('#334155');
        doc.text(`Validadas (<=365d): ${apt.inspecaoSaude?.validados || 0}`, startX + (colW3 * 2) + 12, aptBoxY + 18);
        doc.text(`Vencidas (>365d): ${apt.inspecaoSaude?.vencidos || 0}`, startX + (colW3 * 2) + 12, aptBoxY + 28);
        doc.text(`Não Localizadas: ${apt.inspecaoSaude?.naoLocalizados || 0}`, startX + (colW3 * 2) + 12, aptBoxY + 38);

        doc.y = aptBoxY + 60;
      }

      // 4. ESTATÍSTICAS DE RESTRIÇÕES OPERACIONAIS E MÉDICAS (Correg PM / Comissões das OPM / CAPS - NAPS)
      const restr = result.estatisticasRestricoes || docContext?.estatisticasRestricoes;
      if (restr) {
        ensureSpace(62);
        const restrBoxY = doc.y;
        doc.rect(startX, restrBoxY, pageWidth, 52).fillAndStroke('#fff7ed', '#ffedd5');
        const halfW = pageWidth / 2;

        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#c2410c')
           .text('RESTRIÇÕES OPERACIONAIS', startX + 10, restrBoxY + 6, { width: halfW - 20 });
        doc.font('Helvetica').fontSize(6.5).fillColor('#9a3412')
           .text('(Correg PM / Comissões das OPM / CAPS - NAPS)', startX + 10, restrBoxY + 17, { width: halfW - 20 });
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#7c2d12')
           .text(`Localizados: ${restr.operacionais?.pctEmRelacaoAoTotal || '0 de 0 (0.0%)'}`, startX + 10, restrBoxY + 33, { width: halfW - 20 });

        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#c2410c')
           .text('RESTRIÇÕES MÉDICAS / LTS', startX + halfW + 10, restrBoxY + 6, { width: halfW - 20 });
        doc.font('Helvetica').fontSize(6.5).fillColor('#9a3412')
           .text('(Fizeram DEJEM mas NÃO poderiam executar)', startX + halfW + 10, restrBoxY + 17, { width: halfW - 20 });
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#7c2d12')
           .text(`Localizados: ${restr.medicas?.pctEmRelacaoAoTotal || '0 de 0 (0.0%)'}`, startX + halfW + 10, restrBoxY + 33, { width: halfW - 20 });

        doc.y = restrBoxY + 60;
      }

      // 5. RESULTADO DA VALIDAÇÃO (Score e Status)
      ensureSpace(34);
      const resBoxY = doc.y;
      doc.rect(startX, resBoxY, pageWidth, 26).fillAndStroke('#f8fafc', '#cbd5e1');
      
      const statusText = `STATUS: ${result.statusGeral || 'Concluído'}`;
      const scoreText = `SCORE DE CONFORMIDADE: ${result.scoreConformidade || 0}/100`;

      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(result.statusGeral?.toLowerCase().includes('incon') ? '#dc2626' : '#15803d');
      doc.text(statusText, startX + 12, resBoxY + 8, { lineBreak: false });

      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#0f172a');
      doc.text(scoreText, startX + 280, resBoxY + 8, { width: pageWidth - 290, align: 'right', lineBreak: false });

      doc.y = resBoxY + 34;

      // 6. RESUMO EXECUTIVO - Justified, dynamic height
      if (result.resumoExecutivo) {
        doc.font('Helvetica').fontSize(8);
        const resumoH = doc.heightOfString(result.resumoExecutivo, { width: pageWidth, lineGap: 2 });
        ensureSpace(resumoH + 20);

        doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#0369a1').text('RESUMO EXECUTIVO DO PARECER', startX, doc.y);
        doc.y += 4;
        doc.font('Helvetica').fontSize(8).fillColor('#1e293b').text(result.resumoExecutivo, startX, doc.y, {
          width: pageWidth,
          align: 'justify',
          lineGap: 2
        });
        doc.y += 10;
      }

      // 7. REGRAS AVALIADAS - Non-overlapping layout with measured heights
      if (result.regrasAvaliadas && result.regrasAvaliadas.length > 0) {
        ensureSpace(30);
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#0369a1').text('REGRAS LEGAIS E REGULAMENTARES AVALIADAS', startX, doc.y);
        doc.y += 4;

        result.regrasAvaliadas.forEach((r: any) => {
          doc.font('Helvetica-Bold').fontSize(8);
          const ruleTitle = `• ${r.regra} [${r.status || 'Avaliado'}]`;
          const titleH = doc.heightOfString(ruleTitle, { width: pageWidth - 8, lineGap: 1.2 });

          doc.font('Helvetica').fontSize(7.5);
          const detalheText = r.detalhes || 'Sem apontamentos adicionais.';
          const detalheH = doc.heightOfString(detalheText, { width: pageWidth - 16, lineGap: 1.5 });
          ensureSpace(titleH + detalheH + 12);

          const isOk = r.status?.toLowerCase().includes('conform') || r.status?.toLowerCase().includes('aprov') || r.status?.toLowerCase().includes('regular');
          const currentRuleY = doc.y;
          
          doc.font('Helvetica-Bold').fontSize(8).fillColor(isOk ? '#15803d' : '#b91c1c')
             .text(ruleTitle, startX + 4, currentRuleY, { width: pageWidth - 8, lineGap: 1.2 });
          
          doc.y = currentRuleY + titleH + 3;
          doc.font('Helvetica').fontSize(7.5).fillColor('#334155')
             .text(detalheText, startX + 12, doc.y, { width: pageWidth - 16, align: 'justify', lineGap: 1.5 });
          
          doc.y += 8;
        });
        doc.y += 4;
      }

      // 8. RELAÇÃO NOMINAL DE POLICIAIS MILITARES EM DESACORDO - Layout sem corte com nome completo e texto justificado
      ensureSpace(32);
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#0369a1').text('RELAÇÃO NOMINAL DE POLICIAIS MILITARES EM DESACORDO (APONTAMENTO DE ERROS)', startX, doc.y);
      doc.y += 5;

      if (result.pmsEmDesacordo && result.pmsEmDesacordo.length > 0) {
        result.pmsEmDesacordo.forEach((pm: any) => {
          doc.font('Helvetica-Bold').fontSize(8.5);
          const pmHeader = `Policial Militar: ${pm.nome || '-'}`;
          const headerH = doc.heightOfString(pmHeader, { width: pageWidth - 20, lineGap: 1.2 });

          doc.font('Helvetica-Bold').fontSize(7.5);
          const credsText = `RE: ${pm.re || '-'}  •  CPF: ${pm.cpf || '-'}`;
          const credsH = doc.heightOfString(credsText, { width: pageWidth - 20, lineGap: 1.2 });

          const periodText = `Datas / Período Identificados: ${pm.diasEmDesacordo || '-'}`;
          const periodH = doc.heightOfString(periodText, { width: pageWidth - 20, lineGap: 1.2 });

          doc.font('Helvetica').fontSize(7.5);
          const motivoText = `Motivo do Apontamento: ${pm.motivo || '-'}`;
          const motivoH = doc.heightOfString(motivoText, { width: pageWidth - 20, align: 'justify', lineGap: 1.5 });

          const cardInnerH = headerH + credsH + periodH + motivoH + 24;
          ensureSpace(cardInnerH + 10);

          const pmBoxY = doc.y;
          doc.rect(startX, pmBoxY, pageWidth, cardInnerH).fillAndStroke('#fff1f2', '#fecdd3');
          
          let currentInnerY = pmBoxY + 7;

          // 1. Nome Completo do PM
          doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#881337')
             .text(pmHeader, startX + 10, currentInnerY, { width: pageWidth - 20, lineGap: 1.2 });
          currentInnerY += headerH + 3;

          // 2. RE e CPF
          doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#9f1239')
             .text(credsText, startX + 10, currentInnerY, { width: pageWidth - 20, lineGap: 1.2 });
          currentInnerY += credsH + 3;

          // 3. Datas / Período
          doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#b91c1c')
             .text(periodText, startX + 10, currentInnerY, { width: pageWidth - 20, lineGap: 1.2 });
          currentInnerY += periodH + 3;
          
          // 4. Motivo / Apontamento com parágrafo justificado
          doc.font('Helvetica').fontSize(7.5).fillColor('#4c0519')
             .text(motivoText, startX + 10, currentInnerY, { width: pageWidth - 20, align: 'justify', lineGap: 1.5 });
          
          doc.y = pmBoxY + cardInnerH + 10;
        });
      } else {
        ensureSpace(24);
        doc.rect(startX, doc.y, pageWidth, 22).fillAndStroke('#f0fdf4', '#bbf7d0');
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#15803d').text('Nenhum policial militar em desacordo com as normas foi identificado.', startX + 10, doc.y + 6, { width: pageWidth - 20 });
        doc.y += 28;
      }

      // 9. OBSERVAÇÕES DO ARQUIVO ORIGINAL - Dynamic box, justified
      if (result.observacoesOriginais) {
        doc.font('Helvetica').fontSize(7.5);
        const obsH = doc.heightOfString(result.observacoesOriginais, { width: pageWidth - 20, lineGap: 1.5 });
        const boxH = obsH + 28;
        ensureSpace(boxH + 12);

        const obsBoxY = doc.y;
        doc.rect(startX, obsBoxY, pageWidth, boxH).fillAndStroke('#f8fafc', '#cbd5e1');
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#0369a1').text('OBSERVAÇÕES DO ARQUIVO ORIGINAL', startX + 10, obsBoxY + 8);
        doc.font('Helvetica').fontSize(7.5).fillColor('#334155').text(result.observacoesOriginais, startX + 10, obsBoxY + 22, {
          width: pageWidth - 20,
          align: 'justify',
          lineGap: 1.5
        });
        doc.y = obsBoxY + boxH + 12;
      }

      // APLICAÇÃO DO RODAPÉ ESTRUTURADO EM DUAS LINHAS PADRONIZADAS
      // Linha 1: SOMENTE o dado ARQUIVO: e o nome do arquivo
      // Linha 2: IMPRESSO POR: RE: XXXX | CPF: XXXXX • METADADOS DO IP DO SOLICITANTE: XXXX • DATA DE IMPRESSÃO: XX/XX/XX  HORA: XX:XX H • PÁGINA: XX/XX
      const range = doc.bufferedPageRange();
      const totalPages = range.count;

      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        const currentPageNum = i + 1;
        const mascaraPagina = `PÁGINA: ${pad2(currentPageNum)}/${pad2(totalPages)}`;

        // Desativa temporariamente a margem inferior para impedir quebra automática no rodapé
        doc.page.margins.bottom = 0;

        const footerY = 788;
        // Linha divisória horizontal sutil do rodapé
        doc.moveTo(startX, footerY).lineTo(endX, footerY).strokeColor('#cbd5e1').lineWidth(0.6).stroke();

        // 1. LINHA 1 DO RODAPÉ: Exclusiva para o nome do arquivo, garantindo visualização integral sem cortes
        doc.font('Helvetica-Bold').fontSize(7.0).fillColor('#334155');
        doc.text('ARQUIVO: ', startX, footerY + 4, { lineBreak: false });
        const arqLabelWidth = doc.widthOfString('ARQUIVO: ');
        doc.font('Helvetica').fontSize(7.0).fillColor('#0f172a');
        doc.text(nomeArquivo, startX + arqLabelWidth, footerY + 4, {
          width: pageWidth - arqLabelWidth,
          lineBreak: false,
          ellipsis: true
        });

        // 2. LINHA 2 DO RODAPÉ: Demais dados em linha única com espaçamento natural entre as palavras
        const linha2Texto = `IMPRESSO POR: ${dadosAuditor}  •  METADADOS DO IP DO SOLICITANTE: ${ipSolicitante}  •  ${textoDataHoraImpressao}  •  ${mascaraPagina}`;

        // Cálculo de tamanho de fonte para garantir legibilidade máxima e ausência total de sobreposição
        doc.font('Helvetica-Bold');
        let currentFontSize = 6.8;
        let textWidth = doc.fontSize(currentFontSize).widthOfString(linha2Texto);

        while (textWidth > pageWidth && currentFontSize > 5.2) {
          currentFontSize -= 0.1;
          textWidth = doc.fontSize(currentFontSize).widthOfString(linha2Texto);
        }

        doc.font('Helvetica-Bold')
          .fontSize(currentFontSize)
          .fillColor('#475569');

        // Renderização com alinhamento justificado suave e espaçamento regular das palavras
        doc.text(linha2Texto, startX, footerY + 15, {
          width: pageWidth,
          align: 'justify',
          lineBreak: false
        });
      }

      doc.end();
    });

    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=Auditoria_DEJEM_IA.pdf'
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
