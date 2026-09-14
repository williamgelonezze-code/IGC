import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { operationalDocuments, dadosCapProcessados } from '@/src/db/schema';
import { eq, count, desc, sql } from 'drizzle-orm';
import { isValidCPF, isValidRE } from '@/lib/validations';
import { standardizeOperationalData } from '@/lib/capDataProcessor';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const docId = parseInt(id, 10);

    if (isNaN(docId)) {
      return NextResponse.json({ error: 'ID do documento operacional inválido.' }, { status: 400 });
    }

    const body = await req.json();
    const { validatorRe, validatorCpf, latitude, longitude, locationData } = body;

    // Validate Military Credentials
    if (!validatorRe || !isValidRE(validatorRe)) {
      return NextResponse.json({ error: 'RE inválido. Falha no Módulo 11 da PMESP (Formato: XXXXXX-X).' }, { status: 400 });
    }

    if (!validatorCpf || !isValidCPF(validatorCpf)) {
      return NextResponse.json({ error: 'CPF inválido pelo algoritmo da Receita Federal (Formato: XXX.XXX.XXX-XX).' }, { status: 400 });
    }

    // Retrieve original document
    const doc = await db.query.operationalDocuments.findFirst({
      where: eq(operationalDocuments.id, docId),
    });

    if (!doc) {
      return NextResponse.json({ error: 'Documento operacional não encontrado no banco de dados.' }, { status: 404 });
    }

    // Extract IP
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    let clientIp = body.ipAddress || (forwardedFor ? forwardedFor.split(',')[0].trim() : (realIp || '127.0.0.1'));
    if (clientIp.startsWith('::ffff:')) {
      clientIp = clientIp.substring(7);
    }

    // Determine sequential numerator (DADOS_CAP_PROCESSADOS_XXX)
    const countRes = await db.select({ total: count() }).from(dadosCapProcessados);
    const nextSeqNumber = Number(countRes[0]?.total || 0) + 1;
    const seqPadded = String(nextSeqNumber).padStart(3, '0');
    const seqCode = `DADOS_CAP_PROCESSADOS_${seqPadded}`;
    const tableName = `dados_cap_processados_${seqPadded}`;
    const newFileName = `${seqCode}.xls`;

    // Process spreadsheet data according to business rules:
    // - Check NumeroBO column.
    // - If identical NumeroBO exist: keep LAST line.
    // - Consolidate Historico from all other lines.
    // - Backfill any column data from earlier lines into the final line.
    // - Delete earlier duplicate lines.
    const result = standardizeOperationalData(doc.fileData, doc.fileName, seqCode);

    // 1. Save master catalog entry in dados_cap_processados
    const [insertedRecord] = await db.insert(dadosCapProcessados).values({
      codigoProcessamento: seqCode,
      nomeTabela: tableName,
      documentoOrigemId: doc.id,
      nomeArquivoOrigem: doc.fileName,
      nomeNovoArquivo: newFileName,
      novoArquivoXls: result.newXlsBase64,
      reValidador: validatorRe,
      cpfValidador: validatorCpf,
      ipAddress: clientIp,
      latitude: latitude ? String(latitude) : null,
      longitude: longitude ? String(longitude) : null,
      locationData: locationData || null,
      metadata: {
        dataProcessamento: new Date().toISOString(),
        totalLinhasOriginais: result.totalOriginalRows,
        totalLinhasProcessadas: result.totalProcessedRows,
        totalBoDuplicados: result.totalDuplicateBoCount,
        duplicidadesDetalhadas: result.duplicateDetails,
        headers: result.headers,
      },
      totalLinhasOriginais: result.totalOriginalRows,
      totalLinhasProcessadas: result.totalProcessedRows,
      totalBoDuplicados: result.totalDuplicateBoCount,
      dadosProcessados: result.processedRows,
    }).returning();

    return NextResponse.json({
      success: true,
      message: `Padronização de dados concluída com sucesso. Tabela ${seqCode} arquivada no Cloud SQL SGBD.`,
      processed: {
        id: insertedRecord.id,
        codigoProcessamento: seqCode,
        nomeTabela: tableName,
        nomeNovoArquivo: newFileName,
        fileData: result.newXlsBase64,
        totalOriginalRows: result.totalOriginalRows,
        totalProcessedRows: result.totalProcessedRows,
        totalDuplicateBoCount: result.totalDuplicateBoCount,
        duplicateDetails: result.duplicateDetails,
        createdAt: insertedRecord.createdAt,
        reValidador: validatorRe,
        cpfValidador: validatorCpf,
        ipAddress: clientIp,
        latitude,
        longitude,
      }
    });
  } catch (error: any) {
    console.error('Erro na padronização de dados operacionais:', error);
    return NextResponse.json({ error: error.message || 'Erro interno ao processar e padronizar planilha.' }, { status: 500 });
  }
}
