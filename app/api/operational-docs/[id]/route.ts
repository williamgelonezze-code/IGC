import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { operationalDocuments, operationalDownloads } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const docId = parseInt(id, 10);
    
    if (isNaN(docId)) {
      return NextResponse.json({ error: 'ID de documento inválido' }, { status: 400 });
    }

    const doc = await db.query.operationalDocuments.findFirst({
      where: eq(operationalDocuments.id, docId),
    });

    if (!doc) {
      return NextResponse.json({ error: 'Planilha de dados operacionais não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ doc });
  } catch (error) {
    console.error('Error fetching operational doc:', error);
    return NextResponse.json({ error: 'Falha ao buscar documento operacional' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const docId = parseInt(id, 10);
    
    if (isNaN(docId)) {
      return NextResponse.json({ error: 'ID de documento inválido' }, { status: 400 });
    }

    // Also delete associated downloads audit
    await db.delete(operationalDownloads).where(eq(operationalDownloads.documentId, docId));
    await db.delete(operationalDocuments).where(eq(operationalDocuments.id, docId));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting operational document:', error);
    return NextResponse.json({ error: 'Falha ao excluir planilha operacional' }, { status: 500 });
  }
}
