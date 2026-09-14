import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { operationalDocuments, operationalDownloads, accessLogs } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { isValidCPF, isValidRE } from '@/lib/validations';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const docId = parseInt(id, 10);
    
    if (isNaN(docId)) {
      return NextResponse.json({ error: 'ID de documento inválido' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { downloadedByCpf, downloadedByRe, ipAddress, locationData, metadata } = body;

    if (!downloadedByCpf || !downloadedByRe) {
      return NextResponse.json({ error: 'Identificação com CPF e RE é obrigatória para autorizar o download' }, { status: 400 });
    }

    if (!isValidCPF(downloadedByCpf)) {
      return NextResponse.json({ error: 'CPF fornecido para download é inválido' }, { status: 400 });
    }

    if (!isValidRE(downloadedByRe)) {
      return NextResponse.json({ error: 'RE fornecido para download é inválido (falha no Módulo 11)' }, { status: 400 });
    }

    const doc = await db.query.operationalDocuments.findFirst({
      where: eq(operationalDocuments.id, docId),
    });

    if (!doc) {
      return NextResponse.json({ error: 'Planilha operacional não encontrada' }, { status: 404 });
    }

    // 1. Register in operational_downloads table
    const [downloadRecord] = await db.insert(operationalDownloads).values({
      documentId: docId,
      fileName: doc.fileName,
      downloadedByCpf,
      downloadedByRe,
      ipAddress: ipAddress || null,
      locationData: locationData || null,
      metadata: metadata || null,
    }).returning({ id: operationalDownloads.id });

    // 2. Register in access_logs table for unified security auditing
    try {
      await db.insert(accessLogs).values({
        cpf: `${downloadedByCpf} (DOWNLOAD XLS - ${doc.fileName})`,
        re: downloadedByRe,
        ipAddress: ipAddress || 'unknown',
        locationData: locationData || null,
      });
    } catch (logErr) {
      console.error('Error logging download event in access_logs:', logErr);
    }

    return NextResponse.json({
      success: true,
      downloadId: downloadRecord.id,
      fileName: doc.fileName,
      fileData: doc.fileData,
      fileType: doc.fileType,
    });
  } catch (error) {
    console.error('Error in authorized download of operational doc:', error);
    return NextResponse.json({ error: 'Falha ao autorizar e processar download da planilha' }, { status: 500 });
  }
}
