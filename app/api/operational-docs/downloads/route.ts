import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { operationalDownloads } from '@/src/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const downloads = await db.query.operationalDownloads.findMany({
      orderBy: (operationalDownloads, { desc }) => [desc(operationalDownloads.downloadedAt)],
      limit: 200,
    });

    return NextResponse.json({ downloads });
  } catch (error) {
    console.error('Error fetching operational downloads:', error);
    return NextResponse.json({ error: 'Falha ao buscar histórico de downloads de planilhas' }, { status: 500 });
  }
}
