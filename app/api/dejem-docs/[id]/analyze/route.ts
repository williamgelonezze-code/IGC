import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { dejemDocuments, apiReports } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import PDFDocument from 'pdfkit';

// Remove top-level pdfParse import to avoid build errors with test files
// import pdfParse from 'pdf-parse';

function createPDF(data: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 35, bottom: 65, left: 35, right: 35 },
      bufferPages: true
    });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(`data:application/pdf;base64,${pdfData.toString('base64')}`);
    });
    doc.on('error', reject);

    // Geometry constants (A4 is 595.28 x 841.89)
    const startX = 35;
    const pageWidth = 525;
    const endX = startX + pageWidth; // 560
    const maxContentY = 720; // Safe ceiling ensuring plenty of space before footer at 754

    // Header on Page 1
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#475569').text('POLÍCIA MILITAR DO ESTADO DE SÃO PAULO', startX, 32, { width: pageWidth, align: 'center' });
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#64748b').text('COMANDO DE POLICIAMENTO DE ÁREA METROPOLITANA SETE - CPA/M-7', startX, 44, { width: pageWidth, align: 'center' });
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#0f172a').text('RELATÓRIO DEJEM ANALÍTICO AUTOMATIZADO', startX, 58, { width: pageWidth, align: 'center' });
    
    // Dividing rule
    doc.moveTo(startX, 74).lineTo(endX, 74).strokeColor('#cbd5e1').lineWidth(1).stroke();
    doc.strokeColor('black');
    doc.y = 80;

    // Metadata Card Box
    const metaBoxY = doc.y;
    doc.rect(startX, metaBoxY, pageWidth, 54).fillAndStroke('#f8fafc', '#e2e8f0');
    doc.fillColor('#0f172a');
    
    const col1X = startX + 12;
    const col2X = startX + 275;
    const lineSpacing = 14;

    doc.fontSize(8);
    // Col 1
    doc.font('Helvetica-Bold').text('Período de Análise: ', col1X, metaBoxY + 8, { continued: true, width: 255 })
       .font('Helvetica').text(data.periodo || 'N/A');
    doc.font('Helvetica-Bold').text('Tipo de Escala: ', col1X, metaBoxY + 8 + lineSpacing, { continued: true, width: 255 })
       .font('Helvetica').text(data.tipo_escala || 'N/A');
    doc.font('Helvetica-Bold').text('Convênio: ', col1X, metaBoxY + 8 + (lineSpacing * 2), { continued: true, width: 255 })
       .font('Helvetica').text(data.convenio || 'N/A');

    // Col 2
    doc.font('Helvetica-Bold').text('CPA: ', col2X, metaBoxY + 8, { continued: true, width: 235 })
       .font('Helvetica').text(data.cpa || 'N/A');
    doc.font('Helvetica-Bold').text('AISP: ', col2X, metaBoxY + 8 + lineSpacing, { continued: true, width: 235 })
       .font('Helvetica').text(data.aisp || 'N/A');
    doc.font('Helvetica-Bold').text('Data Emissão: ', col2X, metaBoxY + 8 + (lineSpacing * 2), { continued: true, width: 235 })
       .font('Helvetica').text(data.emissao || new Date().toLocaleString('pt-BR'));

    doc.y = metaBoxY + 62;

    // Estatísticas Gerais Header
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#1e40af').text('ESTATÍSTICAS GERAIS CONSOLIDADAS', startX, doc.y);
    doc.y += 4;
    
    const statBoxY = doc.y;
    doc.rect(startX, statBoxY, pageWidth, 38).fillAndStroke('#ffffff', '#e2e8f0');
    doc.fillColor('#0f172a');

    const statColW = pageWidth / 4;
    const globalFormatado = Number(data.total_geral || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Stat 1: Vagas
    doc.font('Helvetica').fontSize(7).fillColor('#64748b').text('TOTAL DE VAGAS', startX + 6, statBoxY + 7, { width: statColW - 12, align: 'center' });
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a').text(String(data.total_vagas || 0), startX + 6, statBoxY + 19, { width: statColW - 12, align: 'center' });

    // Stat 2: CPA
    doc.font('Helvetica').fontSize(7).fillColor('#64748b').text(`EFETIVO ${data.cpa || 'CPA'}`, startX + statColW + 6, statBoxY + 7, { width: statColW - 12, align: 'center' });
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a').text(String(data.qtd_cpam7 || 0), startX + statColW + 6, statBoxY + 19, { width: statColW - 12, align: 'center' });

    // Stat 3: Taxa de Adesão
    doc.font('Helvetica').fontSize(7).fillColor('#64748b').text('TAXA DE ADESÃO', startX + (statColW * 2) + 6, statBoxY + 7, { width: statColW - 12, align: 'center' });
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a').text(data.taxa_adesao_em_cpa || '0%', startX + (statColW * 2) + 6, statBoxY + 19, { width: statColW - 12, align: 'center' });

    // Stat 4: Valor Total
    doc.font('Helvetica').fontSize(7).fillColor('#64748b').text('TOTAL GERAL A PAGAR', startX + (statColW * 3) + 6, statBoxY + 7, { width: statColW - 12, align: 'center' });
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#16a34a').text(globalFormatado, startX + (statColW * 3) + 6, statBoxY + 19, { width: statColW - 12, align: 'center' });

    doc.y = statBoxY + 46;

    // Strict column geometry: sum matches exactly 525pt
    // 55 + 165 + 95 + 80 + 50 + 80 = 525
    const colConfig = [
      { x: startX, width: 55, align: 'left' as const, title: 'RE' },
      { x: startX + 55, width: 165, align: 'left' as const, title: 'NOME DO POLICIAL MILITAR' },
      { x: startX + 220, width: 95, align: 'left' as const, title: 'OPM' },
      { x: startX + 315, width: 80, align: 'center' as const, title: 'CPF' },
      { x: startX + 395, width: 50, align: 'center' as const, title: 'ESCALAS' },
      { x: startX + 445, width: 80, align: 'right' as const, title: 'TOTAL (R$)' }
    ];

    // Helper: Draw running header on page 2 and beyond
    const drawRunningHeader = () => {
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#1e293b').text('RELATÓRIO DEJEM ANALÍTICO AUTOMATIZADO • CONTINUAÇÃO', startX, 26, { width: 340, lineBreak: false });
      doc.font('Helvetica').fontSize(7.5).fillColor('#64748b').text(`CPA: ${data.cpa || 'N/A'} | AISP: ${data.aisp || 'N/A'}`, startX + 340, 26, { width: 185, align: 'right', lineBreak: false });
      doc.moveTo(startX, 36).lineTo(endX, 36).strokeColor('#cbd5e1').lineWidth(0.75).stroke();
      doc.y = 44;
    };

    // Helper: Draw table header
    const drawTableHeader = (startY: number) => {
      doc.rect(startX, startY, pageWidth, 16).fillAndStroke('#f1f5f9', '#cbd5e1');
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0f172a');
      
      colConfig.forEach(col => {
        doc.text(col.title, col.x + 3, startY + 4, {
          width: col.width - 6,
          align: col.align,
          ellipsis: true,
          lineBreak: false
        });
      });

      doc.y = startY + 18;
    };

    // Draw Initial Table Header
    drawTableHeader(doc.y);

    // Render Table Rows
    if (data.policiais && Array.isArray(data.policiais)) {
      let totalEscalas = 0;
      let totalValor = 0;

      data.policiais.forEach((p: any) => {
        totalEscalas += (p.escalas_executadas || 0);
        totalValor += (p.total_receber || 0);

        // Break page if row exceeds safe content height
        if (doc.y > maxContentY - 16) {
          doc.addPage();
          drawRunningHeader();
          drawTableHeader(doc.y);
        }

        const rowY = doc.y;
        const rowHeight = 15;

        doc.font('Helvetica').fontSize(7.5).fillColor('#334155');

        // RE
        doc.text(p.re || '-', colConfig[0].x + 3, rowY + 3.5, {
          width: colConfig[0].width - 6,
          align: colConfig[0].align,
          ellipsis: true,
          lineBreak: false
        });

        // NOME
        doc.text(p.nome || '-', colConfig[1].x + 3, rowY + 3.5, {
          width: colConfig[1].width - 6,
          align: colConfig[1].align,
          ellipsis: true,
          lineBreak: false
        });

        // OPM
        doc.text(p.opm || '-', colConfig[2].x + 3, rowY + 3.5, {
          width: colConfig[2].width - 6,
          align: colConfig[2].align,
          ellipsis: true,
          lineBreak: false
        });

        // CPF
        doc.text(p.cpf || '-', colConfig[3].x + 3, rowY + 3.5, {
          width: colConfig[3].width - 6,
          align: colConfig[3].align,
          ellipsis: true,
          lineBreak: false
        });

        // ESCALAS
        doc.text(String(p.escalas_executadas || 0), colConfig[4].x + 3, rowY + 3.5, {
          width: colConfig[4].width - 6,
          align: colConfig[4].align,
          ellipsis: true,
          lineBreak: false
        });

        // TOTAL (R$)
        const valorFormatado = Number(p.total_receber || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        doc.text(valorFormatado, colConfig[5].x + 3, rowY + 3.5, {
          width: colConfig[5].width - 6,
          align: colConfig[5].align,
          ellipsis: true,
          lineBreak: false
        });

        // Row bottom separator line
        doc.moveTo(startX, rowY + rowHeight).lineTo(endX, rowY + rowHeight).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
        doc.y = rowY + rowHeight + 1;
      });

      // Render Totals Row with safety check
      if (doc.y > maxContentY - 22) {
        doc.addPage();
        drawRunningHeader();
        drawTableHeader(doc.y);
      }

      const tStartY = doc.y + 2;
      const totalAgentes = data.policiais.length;
      
      doc.rect(startX, tStartY, pageWidth, 18).fillAndStroke('#f8fafc', '#94a3b8');
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0f172a');
      
      doc.text('TOTAIS', colConfig[0].x + 3, tStartY + 5, {
        width: colConfig[0].width - 6,
        align: 'left',
        lineBreak: false
      });
      
      doc.text(`${totalAgentes} AGENTE${totalAgentes !== 1 ? 'S' : ''} EMPREGADO${totalAgentes !== 1 ? 'S' : ''}`, colConfig[1].x + 3, tStartY + 5, {
        width: colConfig[1].width - 6,
        align: 'left',
        lineBreak: false
      });
      
      doc.text('TOTAL DE VAGAS:', colConfig[2].x + 3, tStartY + 5, {
        width: (colConfig[2].width + colConfig[3].width) - 6,
        align: 'right',
        lineBreak: false
      });

      doc.text(String(totalEscalas), colConfig[4].x + 3, tStartY + 5, {
        width: colConfig[4].width - 6,
        align: 'center',
        lineBreak: false
      });

      const tValorFormatado = Number(totalValor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      doc.text(tValorFormatado, colConfig[5].x + 3, tStartY + 5, {
        width: colConfig[5].width - 6,
        align: 'right',
        lineBreak: false
      });

      doc.y = tStartY + 24;

      // Render Observation Block & Audit Info
      const hasObs = data.observacao || (data.escala_ids && data.escala_ids.length > 0);
      const hasAudit = data.fileName || data.cpf || data.re;

      if (hasObs || hasAudit) {
        const boxPadding = 10;
        const textWidth = pageWidth - (boxPadding * 2);

        let idsText = '';
        let totalIds = 0;
        let obsTextHeight = 0;

        if (hasObs) {
          totalIds = data.total_ids_avaliados ?? (data.escala_ids?.length || 0);
          const idsString = data.escala_ids ? data.escala_ids.join(', ') : '';
          idsText = `OS DADOS COMPILADOS REFEREM-SE ÀS ESCALAS DE ID: ${idsString}`;
          
          doc.font('Helvetica').fontSize(7.5);
          obsTextHeight = doc.heightOfString(`OBSERVAÇÃO: ${idsText}`, { width: textWidth, lineGap: 2 }) + 22; // +22 for total IDs line and spacing
        }

        const auditLead = 'RELATÓRIO ELETRÔNICO AUDITADO POR IA COM AUTORIZAÇÃO LIBERADA POR:';
        const prodReport = data.fileName || 'RELATORIO_DEJEM_ANALITICO_AUTO.pdf';
        const validadorCpf = data.cpf || 'N/A';
        const validadorRe = data.re || 'N/A';
        const dataEmissao = data.emissao || new Date().toLocaleString('pt-BR');

        const auditLine1 = `PRODUÇÃO: ${prodReport}   |   VALIDADOR DE AUTENTICIDADE: CPF: ${validadorCpf}   |   RE: ${validadorRe}`;
        const auditLine2 = `METADADOS DE AUTENTICIDADE: REGISTRO AUDITADO POR INTELIGÊNCIA ARTIFICIAL   |   AUTORIZADOR / VALIDADOR HOMOLOGADO   |   EMISSÃO: ${dataEmissao}`;

        doc.font('Helvetica').fontSize(7);
        const auditHeight = hasAudit ? (
          doc.heightOfString(auditLead, { width: textWidth }) +
          doc.heightOfString(auditLine1, { width: textWidth }) +
          doc.heightOfString(auditLine2, { width: textWidth }) + 18
        ) : 0;

        const totalBlockHeight = (hasObs ? obsTextHeight + (boxPadding * 2) : 0) + (hasAudit ? auditHeight + 16 : 0);

        // Verify if observation and audit fit before safe content ceiling (720)
        if (doc.y + totalBlockHeight > maxContentY) {
          doc.addPage();
          drawRunningHeader();
        }

        if (hasObs) {
          const boxY = doc.y;
          const boxHeight = obsTextHeight + (boxPadding * 2);
          doc.rect(startX, boxY, pageWidth, boxHeight).fillAndStroke('#f8fafc', '#cbd5e1');

          // Text with all IDs - Justified with full room for all text
          doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0f172a');
          doc.text('OBSERVAÇÃO: ', startX + boxPadding, boxY + boxPadding, {
            continued: true,
            width: textWidth
          });
          doc.font('Helvetica').fontSize(7.5).fillColor('#334155');
          doc.text(idsText, {
            width: textWidth,
            align: 'justify',
            lineGap: 2
          });

          // Isolated line for Total IDs
          doc.y += 6;
          doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0f172a');
          doc.text('TOTAL DE ID AVALIADOS: ', startX + boxPadding, doc.y, {
            continued: true,
            width: textWidth
          });
          doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#1e40af');
          doc.text(totalIds.toString(), {
            width: textWidth
          });
          doc.fillColor('black');

          doc.y = boxY + boxHeight + 10;
        }

        if (hasAudit) {
          // Separator line between Observação and Audit info
          doc.moveTo(startX, doc.y).lineTo(endX, doc.y).strokeColor('#cbd5e1').lineWidth(0.75).stroke();
          doc.y += 6;

          doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0f172a');
          doc.text(auditLead, startX, doc.y, { width: pageWidth });
          
          doc.y += 3;
          doc.font('Helvetica').fontSize(7).fillColor('#475569');
          doc.text('PRODUÇÃO: ', startX, doc.y, { continued: true });
          doc.font('Helvetica-Bold').fontSize(7).fillColor('#0f172a');
          doc.text(prodReport, { continued: true });
          doc.font('Helvetica').fontSize(7).fillColor('#475569');
          doc.text('   |   VALIDADOR DE AUTENTICIDADE: ', { continued: true });
          doc.font('Helvetica-Bold').fontSize(7).fillColor('#0f172a');
          doc.text(`CPF: ${validadorCpf}`, { continued: true });
          doc.font('Helvetica').fontSize(7).fillColor('#475569');
          doc.text('   |   ', { continued: true });
          doc.font('Helvetica-Bold').fontSize(7).fillColor('#0f172a');
          doc.text(`RE: ${validadorRe}`, { width: pageWidth });

          doc.y += 3;
          doc.font('Helvetica').fontSize(6.5).fillColor('#64748b');
          doc.text(auditLine2, startX, doc.y, { width: pageWidth, align: 'justify' });
          doc.fillColor('black');
        }
      }
    }

    // Add safe, non-overlapping footer with generous spacing to all generated pages
    const range = doc.bufferedPageRange();
    const totalPages = range.count;

    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      
      const oldBottomMargin = doc.page.margins.bottom;
      doc.page.margins.bottom = 0; // Prevent PDFKit from auto-adding blank pages when rendering footer
      
      // Footer dividing line at 754 (plenty of room before bottom margin)
      doc.moveTo(startX, 754).lineTo(endX, 754).strokeColor('#cbd5e1').lineWidth(0.75).stroke();
      doc.strokeColor('black');
      
      const currentPageStr = String(i + 1).padStart(2, '0');
      const totalPagesStr = String(totalPages).padStart(2, '0');
      const pageMaskStr = `Página ${currentPageStr}/${totalPagesStr}`;
      
      // Line 1: Title (left) and Page counter (right) at y = 762
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#1e293b');
      doc.text('RELATÓRIO DEJEM ANALÍTICO AUTOMATIZADO', startX, 762, { width: 340, align: 'left', lineBreak: false });
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#475569');
      doc.text(pageMaskStr, startX + 340, 762, { width: 185, align: 'right', lineBreak: false });

      // Line 2: Convênio/AISP and Validator Credentials (CPF first, then RE) at y = 776
      const convenioAispStr = `Convênio: ${data.convenio || 'N/A'} • AISP: ${data.aisp || 'N/A'} • CPA: ${data.cpa || 'N/A'}`;
      doc.font('Helvetica').fontSize(6.5).fillColor('#64748b');
      doc.text(convenioAispStr, startX, 776, { width: 320, align: 'left', lineBreak: false });
      
      const validatorCredStr = `Validador: CPF: ${data.cpf || 'N/A'} • RE: ${data.re || 'N/A'}`;
      doc.text(validatorCredStr, startX + 320, 776, { width: 205, align: 'right', lineBreak: false });

      // Line 3: Institutional PMESP line at y = 790
      doc.font('Helvetica').fontSize(6.5).fillColor('#64748b');
      doc.text('Polícia Militar do Estado de São Paulo • Sistema de Gestão DEJEM / DELEGADA • Documento Auditado Eletronicamente', startX, 790, { width: pageWidth, align: 'center', lineBreak: false });

      // Line 4: Electronic certification notice at y = 802
      doc.font('Helvetica-Oblique').fontSize(6).fillColor('#94a3b8');
      doc.text('Chancela Digital de Inteligência Artificial • Registro Gravado com Metadados em Banco Cloud SQL', startX, 802, { width: pageWidth, align: 'center', lineBreak: false });
      doc.fillColor('black');

      doc.page.margins.bottom = oldBottomMargin;
    }

    doc.end();
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const docId = parseInt(id, 10);
    
    if (isNaN(docId)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    let geoData = { latitude: null, longitude: null };
    try {
      const body = await req.json();
      if (body.latitude !== undefined) geoData.latitude = body.latitude;
      if (body.longitude !== undefined) geoData.longitude = body.longitude;
    } catch (e) {
      // Ignore if no body or invalid JSON
    }

    // 1. Fetch the original document
    const originalDoc = await db.query.dejemDocuments.findFirst({
      where: eq(dejemDocuments.id, docId),
    });

    if (!originalDoc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Prepare Base64 (remove data uri prefix if present)
    let base64Data = originalDoc.fileData;
    if (base64Data.includes(',')) {
      base64Data = base64Data.split(',')[1];
    }
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Parse PDF directly via Node process
    const pdfParse = require('pdf-parse/lib/pdf-parse.js');
    const pdfParsed = await pdfParse(buffer);
    const text = pdfParsed.text;
    
    // Improved Regex to correctly capture names with accents, different spacing, and varied structures
    // 1. RE (5 to 7 digits, optional dash, optional alphanumeric digit)
    // 2. Name (Uppercase letters, spaces, apostrophes, and accents)
    // 3. Rank
    // 4. OPM
    // 5. CPF
    const regex = /(\d{5,7}(?:-[0-9A-Z])?|\d{5,7}X?)([A-ZÀ-Ÿ][A-ZÀ-Ÿ\s']+?)(CEL PM|COR PM|MAJ PM|CAP PM|1\.?\s?TEN PM|2\.?\s?TEN PM|TEN PM|ASP OF PM|SUBTEN PM|1\.?\s?SGT PM|2\.?\s?SGT PM|3\.?\s?SGT PM|SGT PM|CB PM|SD PM|AL PM|1SGT PM|2SGT PM|3SGT PM|1TEN PM|2TEN PM)(.*?)(\d{3}\.?\d{3}\.?\d{3}-?\d{2}|\d{8,11}-?\d{2})/g;
    
    const matches = [...text.matchAll(regex)];
    
    
    // 1. Dynamic Extraction of CPA
    let cpaStr = "Não identificado";
    let targetCpaLetter = "";
    let targetCpaNumber = "";
    const cpaHeaderMatch = text.match(/Período de:[\s\S]*?([A-Z0-9\/\-\s]+?)\s*AISP:/i);
    if (cpaHeaderMatch) {
      cpaStr = cpaHeaderMatch[1].replace(/[\n\r]+/g, ' ').trim();
      const matchDetails = cpaStr.match(/CPA[\/\s\-]*(M|I)[\/\s\-]*(\d+)/i);
      if (matchDetails) {
        targetCpaLetter = matchDetails[1].toUpperCase();
        targetCpaNumber = matchDetails[2];
      }
    } else {
      const cpaMatch = text.match(/CPA[\/\s\-]*(M|I)[\/\s\-]*(\d+)(?:\s*-\s*[A-Za-zÀ-ÿ]+)?/i);
      if (cpaMatch) {
        targetCpaLetter = cpaMatch[1].toUpperCase();
        targetCpaNumber = cpaMatch[2];
        cpaStr = `CPA/${targetCpaLetter}-${targetCpaNumber}`;
      }
    }

    let totalVagas = matches.length;

    let qtdCpaM7 = 0;
    
    const policiaisMap = new Map<string, any>();
    
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const re = match[1];
      const nome = match[2].trim();
      const posto = match[3];
      const opm = match[4].trim();
      const cpf = match[5];
      
      // Count occurrences of the dynamically identified CPA in the OPM column
      let cpaFound = false;
      if (targetCpaLetter && targetCpaNumber) {
        const opmUpper = opm.toUpperCase().replace(/[\s\/\-]/g, '');
        const targetCompact = `CPA${targetCpaLetter}${targetCpaNumber}`;
        if (opmUpper.includes(targetCompact)) {
          cpaFound = true;
        }
      } else if (opm.includes('CPA/M-7') || opm.includes('CPAM-7') || opm.includes('CPA M-7')) {
        cpaFound = true;
      }
      if (cpaFound) {
        qtdCpaM7++;
      }
      
      // Extract the values from the block of text corresponding to this row
      const startIndex = match.index + match[0].length;
      const endIndex = i + 1 < matches.length ? matches[i + 1].index : text.length;
      const chunk = text.substring(startIndex, endIndex);
      
      const valueMatch = chunk.match(/(\d{1,3}(?:\.\d{3})*,\d{2})/);
      let valor = 0;
      if (valueMatch) {
        valor = parseFloat(valueMatch[1].replace(/\./g, '').replace(',', '.'));
      }
      
      if (policiaisMap.has(re)) {
        const p = policiaisMap.get(re);
        p.escalas_executadas += 1;
        p.total_receber += valor;
      } else {
        policiaisMap.set(re, {
          re,
          nome,
          opm,
          cpf,
          escalas_executadas: 1,
          total_receber: valor
        });
      }
    }
    
    const policiais = Array.from(policiaisMap.values());
    policiais.sort((a, b) => a.nome.localeCompare(b.nome));
    
    // 2. Dynamic Extraction of Período
    let periodoStr = "Não identificado";
    const dateMatch = text.match(/Até[\s\S]*?(\d{2}\/\d{2}\/\d{4})[\s\S]*?(\d{2}\/\d{2}\/\d{4})[\s\S]*?Período de:/i);
    if (dateMatch) {
      periodoStr = `${dateMatch[1]} até ${dateMatch[2]}`;
    } else {
      const dateRegex = /(\d{2}\/\d{2}\/\d{4})/g;
      const dates = [...text.matchAll(dateRegex)].map(m => m[1]);
      if (dates.length >= 2) {
        periodoStr = `${dates[0]} até ${dates[dates.length-1]}`;
      }
    }

    // 3. Dynamic Extraction of Tipo de Escala
    let tipoEscalaStr = "Não identificado";
    const tipoEscalaMatch = text.match(/(?:TODOS|RE:)?\s*([A-ZÀ-Ÿ\s\-\/]{3,}?)\s*Tipo de Escala/i) || text.match(/Tipo de Escala:?\s*([^\n\r]+)/i);
    if (tipoEscalaMatch) {
      tipoEscalaStr = tipoEscalaMatch[1].replace(/^TODOS/i, '').replace(/[\n\r]+/g, ' ').trim();
    }
    
    // 4. Dynamic Extraction of AISP
    let aispStr = "Não identificado";
    const aispMatch = text.match(/AISP:[\s\S]*?(?:CPA:)?\s*(\d{5,})/i) || text.match(/(?:AISP|ISP)[\s\S]*?(\d{5,})/i);
    if (aispMatch) {
      aispStr = aispMatch[1].trim();
    }

    // 5. Dynamic Extraction of Convênio
    let convenioStr = "Não identificado";
    const convenioSubMatch = text.match(/([A-ZÀ-Ÿ\s\-\/]{4,}?)\s*S?AISP:\s*Data Início:/i);
    const convenioHeaderMatch = text.match(/RE:\s*([A-ZÀ-Ÿ0-9\s\-\/]+?)\s*Convênio:/i) || text.match(/Convênio:?\s*([^\n\r]+)/i);
    if (convenioSubMatch && convenioSubMatch[1].trim().length > 3) {
      convenioStr = convenioSubMatch[1].replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();
    } else if (convenioHeaderMatch) {
      convenioStr = convenioHeaderMatch[1].replace(/[\n\r]+/g, ' ').trim();
    }
    
    // 6. Dynamic Extraction of Escala IDs
    const idSet = new Set<string>();
    const matchesA = [...text.matchAll(/(?:Total à Receber|Total a Receber|Total HorasTotal à Receber)[\s\n\r]*(\d{5,10})[\s\n\r]*(?:Agência|Agencia|\d)/gi)];
    for (const m of matchesA) {
      idSet.add(m[1]);
    }
    const matchesB = [...text.matchAll(/\b(?:ID|Id|Escala\s*ID)[:\s\.]*(\d{5,10})\b/gi)];
    for (const m of matchesB) {
      idSet.add(m[1]);
    }
    const escalaIds = Array.from(idSet);
    const totalIdsAvaliados = escalaIds.length;
    const observacaoStr = escalaIds.length > 0 
      ? `OS DADOS COMPILADOS REFEREM-SE ÀS ESCALAS DE ID: ${escalaIds.join(', ')} (TOTAL DE ID AVALIADOS: ${totalIdsAvaliados})`
      : '';

    const taxaAdesao = totalVagas > 0 ? ((qtdCpaM7 / totalVagas) * 100).toFixed(1) + '%' : '0%';
    
    let totalGeral = 0;
    policiais.forEach(p => totalGeral += p.total_receber);
    
    // 3. Calculate sequential name based on latest ID
    const latestReport = await db.query.apiReports.findFirst({
      orderBy: (apiReports, { desc }) => [desc(apiReports.id)],
      columns: { id: true }
    });
    const sequenceNumber = (latestReport?.id || 0) + 1;
    const fileName = `RELATORIO_DEJEM_ANALITICO_AUTO_${sequenceNumber.toString().padStart(3, '0')}.pdf`;

    const nowBrasilia = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    const parsedData = {
      periodo: periodoStr,
      tipo_escala: tipoEscalaStr,
      cpa: cpaStr,
      aisp: aispStr,
      convenio: convenioStr,
      total_vagas: totalVagas,
      qtd_cpam7: qtdCpaM7,
      taxa_adesao_em_cpa: taxaAdesao,
      total_geral: totalGeral,
      policiais: policiais,
      escala_ids: escalaIds,
      total_ids_avaliados: totalIdsAvaliados,
      observacao: observacaoStr,
      fileName: fileName,
      cpf: originalDoc.uploadedByCpf,
      re: originalDoc.uploadedByRe,
      emissao: nowBrasilia
    };
    
    console.log("Parsed matches:", matches.length, "Unique police:", policiais.length, "IDs count:", totalIdsAvaliados);
    require('fs').writeFileSync('/tmp/parse-stats.txt', `Parsed matches: ${matches.length}, Unique: ${policiais.length}, IDs: ${totalIdsAvaliados}`);

    // 4. Generate PDF Table
    const generatedPdfBase64 = await createPDF(parsedData);

    // 5. Save to database
    const [newReport] = await db.insert(apiReports).values({
      fileName,
      fileData: generatedPdfBase64,
      cpf: originalDoc.uploadedByCpf,
      re: originalDoc.uploadedByRe,
      metadata: {
        generatedByAi: true,
        sourceDocId: docId,
        sourceDocName: originalDoc.fileName,
        latitude: geoData.latitude,
        longitude: geoData.longitude,
        escala_ids: escalaIds,
        total_ids_avaliados: totalIdsAvaliados,
        observacao: observacaoStr,
        validador_autenticidade: {
          cpf: originalDoc.uploadedByCpf,
          re: originalDoc.uploadedByRe,
          emissao: nowBrasilia,
          status: 'HOMOLOGADO_AUDITADO_AI'
        }
      },
    }).returning({ id: apiReports.id });

    return NextResponse.json({ success: true, reportId: newReport.id });

  } catch (error: any) {
    console.error('Error analyzing document:', error);
    return NextResponse.json({ error: error.message || 'Failed to analyze document' }, { status: 500 });
  }
}
