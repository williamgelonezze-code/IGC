import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { dadosCapProcessados } from '@/src/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const list = await db.query.dadosCapProcessados.findMany({
      columns: {
        id: true,
        codigoProcessamento: true,
        nomeTabela: true,
        documentoOrigemId: true,
        nomeArquivoOrigem: true,
        nomeNovoArquivo: true,
        reValidador: true,
        cpfValidador: true,
        ipAddress: true,
        latitude: true,
        longitude: true,
        locationData: true,
        metadata: true,
        totalLinhasOriginais: true,
        totalLinhasProcessadas: true,
        totalBoDuplicados: true,
        createdAt: true,
      },
      orderBy: (dadosCapProcessados, { desc }) => [desc(dadosCapProcessados.createdAt)],
    });

    return NextResponse.json({ success: true, records: list });
  } catch (error: any) {
    console.error('Erro ao listar dados CAP processados:', error);
    return NextResponse.json({ error: 'Falha ao buscar registros de dados CAP processados.' }, { status: 500 });
  }
}
