import { NextRequest, NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';

export async function POST(req: NextRequest) {
  try {
    const { fileInfo, metrics, analysis, auditedBy } = await req.json();

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 35, bottom: 95, left: 40, right: 40 },
        bufferPages: true
      });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const startX = 40;
      const pageWidth = 515;
      const endX = startX + pageWidth; // 555
      const maxContentY = 720; // Safe distance before footer at 754

      // Helper: Running Header for Page 2+
      const drawRunningHeader = () => {
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#1e293b').text('LAUDO TÉCNICO DE ANÁLISE CRIMINAL E INTELIGÊNCIA OPERACIONAL • CONTINUAÇÃO', startX, 26, { width: 360, lineBreak: false });
        doc.font('Helvetica').fontSize(7.5).fillColor('#64748b').text('CPA/M-7 • SEGURANÇA ORGÂNICA', startX + 360, 26, { width: 155, align: 'right', lineBreak: false });
        doc.moveTo(startX, 36).lineTo(endX, 36).strokeColor('#cbd5e1').lineWidth(0.75).stroke();
        doc.y = 44;
      };

      // Helper: Ensure Space before content block
      const ensureSpace = (neededHeight: number) => {
        if (doc.y + neededHeight > maxContentY) {
          doc.addPage();
          drawRunningHeader();
        }
      };

      // Page 1 Header Banner
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#475569').text('POLÍCIA MILITAR DO ESTADO DE SÃO PAULO', startX, 30, { width: pageWidth, align: 'center' });
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#64748b').text('COMANDO DE POLICIAMENTO DE ÁREA METROPOLITANA SETE - CPA/M-7', startX, 42, { width: pageWidth, align: 'center' });
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f172a').text('LAUDO TÉCNICO DE ANÁLISE CRIMINAL E INTELIGÊNCIA OPERACIONAL (API AI)', startX, 55, { width: pageWidth, align: 'center' });
      doc.moveTo(startX, 71).lineTo(endX, 71).strokeColor('#0284c7').lineWidth(1.5).stroke();
      doc.y = 78;

      // General Identification Box
      ensureSpace(64);
      const boxY = doc.y;
      doc.rect(startX, boxY, pageWidth, 56).fillAndStroke('#f8fafc', '#cbd5e1');
      doc.fillColor('#0f172a');

      doc.font('Helvetica-Bold').fontSize(8).fillColor('#0369a1').text('IDENTIFICAÇÃO DO DOCUMENTO AUDITADO E CHANCELA', startX + 10, boxY + 7);

      const col1X = startX + 10;
      const col2X = startX + 270;

      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#334155');
      doc.text('Arquivo Auditado: ', col1X, boxY + 23, { continued: true, width: 250 })
         .font('Helvetica').text(fileInfo?.fileName || 'N/A', { ellipsis: true });
      doc.font('Helvetica-Bold').text('Data da Análise: ', col1X, boxY + 37, { continued: true, width: 250 })
         .font('Helvetica').text(new Date().toLocaleString('pt-BR'));

      doc.font('Helvetica-Bold').text('Validador: ', col2X, boxY + 23, { continued: true, width: 230 })
         .font('Helvetica').text(`CPF: ${auditedBy?.cpf || 'N/A'} • RE: ${auditedBy?.re || 'N/A'}`);
      doc.font('Helvetica-Bold').text('Chancela: ', col2X, boxY + 37, { continued: true, width: 230 })
         .font('Helvetica').text('Segurança Orgânica IGC/PM - Cloud SQL');

      doc.y = boxY + 64;

      // 1. EFICÁCIA OPERACIONAL CONSOLIDADA
      ensureSpace(95);
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#0369a1').text('1. EFICÁCIA OPERACIONAL CONSOLIDADA', startX, doc.y);
      doc.y += 4;

      const scoreBoxY = doc.y;
      doc.rect(startX, scoreBoxY, pageWidth, 24).fillAndStroke('#f0fdf4', '#86efac');
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#166534')
         .text(`SCORE GERAL: ${analysis?.scoreEficacia || 85}/100 • CLASSIFICAÇÃO: ${analysis?.classificacao || 'Excelente'}`, startX + 10, scoreBoxY + 7, { width: pageWidth - 20 });
      
      doc.y = scoreBoxY + 30;

      // Grid of Operational Metrics (2 rows x 3 columns)
      const metricBoxY = doc.y;
      const mColW = pageWidth / 3;
      const mRowH = 26;
      doc.rect(startX, metricBoxY, pageWidth, mRowH * 2).fillAndStroke('#ffffff', '#e2e8f0');

      const metricsList = [
        { label: 'EFETIVO EMPREGADO', value: `${metrics?.totalEfetivo || 0} PMs` },
        { label: 'VIATURAS EMPREGADAS', value: `${metrics?.totalViaturas || 0}` },
        { label: 'PESSOAS ABORDADAS', value: `${metrics?.totalAbordagens || 0}` },
        { label: 'VEÍCULOS FISCALIZADOS', value: `${metrics?.totalVeiculosFiscalizados || 0}` },
        { label: 'FLAGRANTES DELITO', value: `${metrics?.totalFlagrantes || 0}` },
        { label: 'PROCURADOS CAPTURADOS', value: `${metrics?.totalProcurados || 0}` }
      ];

      metricsList.forEach((m, idx) => {
        const c = idx % 3;
        const r = Math.floor(idx / 3);
        const cellX = startX + (c * mColW);
        const cellY = metricBoxY + (r * mRowH);

        doc.font('Helvetica').fontSize(6.5).fillColor('#64748b').text(m.label, cellX + 4, cellY + 4, { width: mColW - 8, align: 'center' });
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#0f172a').text(m.value, cellX + 4, cellY + 14, { width: mColW - 8, align: 'center' });
      });

      doc.y = metricBoxY + (mRowH * 2) + 10;

      // 2. RESUMO EXECUTIVO DO COMANDO
      if (analysis?.resumoExecutivo) {
        doc.font('Helvetica').fontSize(8);
        const resH = doc.heightOfString(analysis.resumoExecutivo, { width: pageWidth, lineGap: 2 });
        ensureSpace(resH + 24);

        doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#0369a1').text('2. RESUMO EXECUTIVO DO COMANDO', startX, doc.y);
        doc.y += 4;
        doc.font('Helvetica').fontSize(8).fillColor('#1e293b').text(analysis.resumoExecutivo, startX, doc.y, {
          width: pageWidth,
          align: 'justify',
          lineGap: 2
        });
        doc.y += 10;
      }

      // 3. DIAGNÓSTICO OPERACIONAL POR BATALHÃO
      if (analysis?.diagnosticoBatalhoes && analysis.diagnosticoBatalhoes.length > 0) {
        ensureSpace(34);
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#0369a1').text('3. DIAGNÓSTICO OPERACIONAL POR BATALHÃO', startX, doc.y);
        doc.y += 4;

        analysis.diagnosticoBatalhoes.forEach((b: any) => {
          doc.font('Helvetica').fontSize(7.5);
          const avaliacaoText = b.avaliacao ? `Avaliação Tática: ${b.avaliacao}` : '';
          const avaliacaoH = avaliacaoText ? doc.heightOfString(avaliacaoText, { width: pageWidth - 20, lineGap: 1.5 }) : 0;
          const cardHeight = 28 + (avaliacaoH > 0 ? avaliacaoH + 6 : 0);

          ensureSpace(cardHeight + 6);
          const batY = doc.y;
          doc.rect(startX, batY, pageWidth, cardHeight).fillAndStroke('#f8fafc', '#cbd5e1');

          doc.font('Helvetica-Bold').fontSize(8).fillColor('#0f172a')
             .text(`• ${b.batalhao} [Status: ${b.status || 'Ativo'}]`, startX + 10, batY + 5, { width: pageWidth - 20, lineBreak: false });
          
          doc.font('Helvetica').fontSize(7).fillColor('#334155')
             .text(`Efetivo: ${b.efetivo} PMs | Viaturas: ${b.viaturas} | Abordagens: ${b.abordagens} | Flagrantes: ${b.flagrantes} | Procurados: ${b.procurados}`, startX + 10, batY + 16, { width: pageWidth - 20, lineBreak: false });

          if (avaliacaoText) {
            doc.font('Helvetica-Oblique').fontSize(7).fillColor('#475569')
               .text(avaliacaoText, startX + 10, batY + 27, { width: pageWidth - 20, align: 'justify', lineGap: 1.5 });
          }

          doc.y = batY + cardHeight + 6;
        });
        doc.y += 4;
      }

      // 4. PADRÕES E TENDÊNCIAS DELITIVAS
      if (analysis?.padroesETendencias && analysis.padroesETendencias.length > 0) {
        ensureSpace(28);
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#0369a1').text('4. PADRÕES E TENDÊNCIAS DELITIVAS IDENTIFICADAS', startX, doc.y);
        doc.y += 4;

        analysis.padroesETendencias.forEach((p: string) => {
          doc.font('Helvetica').fontSize(7.5);
          const itemH = doc.heightOfString(`• ${p}`, { width: pageWidth - 12, lineGap: 1.5 });
          ensureSpace(itemH + 6);
          doc.fillColor('#1e293b').text(`• ${p}`, startX + 6, doc.y, { width: pageWidth - 12, align: 'justify', lineGap: 1.5 });
          doc.y += 4;
        });
        doc.y += 6;
      }

      // 5. DIRETRIZES E RECOMENDAÇÕES TÁTICAS
      if (analysis?.recomendacoesTaticas && analysis.recomendacoesTaticas.length > 0) {
        ensureSpace(28);
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#0369a1').text('5. DIRETRIZES E RECOMENDAÇÕES TÁTICAS DO COMANDO', startX, doc.y);
        doc.y += 4;

        analysis.recomendacoesTaticas.forEach((r: string) => {
          doc.font('Helvetica').fontSize(7.5);
          const itemH = doc.heightOfString(`✔ ${r}`, { width: pageWidth - 12, lineGap: 1.5 });
          ensureSpace(itemH + 6);
          doc.fillColor('#1e293b').text(`✔ ${r}`, startX + 6, doc.y, { width: pageWidth - 12, align: 'justify', lineGap: 1.5 });
          doc.y += 4;
        });
        doc.y += 8;
      }

      // FOOTER BUFFERED ACROSS ALL PAGES - Spacious, non-overlapping, CPF first then RE
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        const oldBottomMargin = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;

        // Divider Line at 754
        doc.moveTo(startX, 754).lineTo(endX, 754).strokeColor('#cbd5e1').lineWidth(0.75).stroke();

        // Footer Line 1: Title & Page
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0369a1');
        doc.text('Laudo Técnico de Análise Criminal e Inteligência Operacional (API AI)', startX, 762, { width: 340, lineBreak: false });
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#334155');
        doc.text(`Página ${i + 1} de ${pages.count}`, startX + 340, 762, { width: 175, align: 'right', lineBreak: false });

        // Footer Line 2: Validator Credentials (CPF first, then RE) & File
        doc.font('Helvetica').fontSize(6.5).fillColor('#475569');
        doc.text(`Validador: CPF: ${auditedBy?.cpf || 'N/A'} • RE: ${auditedBy?.re || 'N/A'}   |   Arquivo: ${fileInfo?.fileName || 'N/A'}`, startX, 776, { width: 340, lineBreak: false, ellipsis: true });
        doc.text(`Data: ${new Date().toLocaleString('pt-BR')}`, startX + 340, 776, { width: 175, align: 'right', lineBreak: false });

        // Footer Line 3: Institutional PMESP
        doc.font('Helvetica').fontSize(6.5).fillColor('#64748b');
        doc.text('Polícia Militar do Estado de São Paulo • CPA/M-7 • Divisão Operacional e Segurança Orgânica IGC/PM', startX, 790, { width: pageWidth, align: 'center', lineBreak: false });

        // Footer Line 4: Security Stamp
        doc.font('Helvetica-Oblique').fontSize(6).fillColor('#94a3b8');
        doc.text('Chancela Eletrônica de Inteligência Artificial • Documento com Certificação Digital Operacional em Banco Cloud SQL', startX, 802, { width: pageWidth, align: 'center', lineBreak: false });

        doc.page.margins.bottom = oldBottomMargin;
      }

      doc.end();
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="LAUDO_ANALISE_CRIMINAL_AI_${fileInfo?.fileName?.replace(/\.[^/.]+$/, '') || 'OPERACIONAL'}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating criminal analysis PDF:', error);
    return NextResponse.json({ error: 'Erro ao gerar PDF da Análise Criminal' }, { status: 500 });
  }
}
