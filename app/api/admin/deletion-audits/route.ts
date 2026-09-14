import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { deletedFilesAudit } from '@/src/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const audits = await db.query.deletedFilesAudit.findMany({
      orderBy: [desc(deletedFilesAudit.deletedAt)],
    });

    return NextResponse.json({ audits });
  } catch (error: any) {
    console.error('Error fetching deletion audits:', error);
    return NextResponse.json(
      { error: error?.message || 'Falha ao buscar auditoria de arquivos apagados' },
      { status: 500 }
    );
  }
}
