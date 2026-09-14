import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { dadosCapProcessados } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const recordId = parseInt(id, 10);

    if (isNaN(recordId)) {
      return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
    }

    const record = await db.query.dadosCapProcessados.findFirst({
      where: eq(dadosCapProcessados.id, recordId),
    });

    if (!record) {
      return NextResponse.json({ error: 'Registro não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, record });
  } catch (error: any) {
    console.error('Erro ao buscar registro de dados CAP:', error);
    return NextResponse.json({ error: 'Falha ao buscar dados.' }, { status: 500 });
  }
}
