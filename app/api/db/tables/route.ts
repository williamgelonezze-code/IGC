import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { dadosCapProcessados } from '@/src/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const physicalTables = result.rows.map((row: any) => String(row.table_name));
    const allTablesSet = new Set(physicalTables);

    // Also include standardized tables registered in dados_cap_processados
    try {
      const procTables = await db
        .select({ nomeTabela: dadosCapProcessados.nomeTabela })
        .from(dadosCapProcessados);

      for (const pt of procTables) {
        if (pt.nomeTabela) {
          allTablesSet.add(pt.nomeTabela);
        }
      }
    } catch {
      // If table doesn't exist yet or query fails, keep physical tables
    }
    
    return NextResponse.json({ tables: Array.from(allTablesSet).sort() });
  } catch (error) {
    console.error('Error fetching tables:', error);
    return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 });
  }
}
