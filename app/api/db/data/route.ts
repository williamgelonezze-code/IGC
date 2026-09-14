import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { dadosCapProcessados } from '@/src/db/schema';
import { sql, eq } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const table = searchParams.get('table');

    if (!table) {
      return NextResponse.json({ error: 'Table parameter is required' }, { status: 400 });
    }

    // 1. Check if it's a physical PostgreSQL table
    const validTables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const isPhysicalTable = validTables.rows.some((row: any) => row.table_name === table);
    if (isPhysicalTable) {
      const result = await db.execute(sql.raw(`SELECT * FROM "${table}" LIMIT 1000`));
      return NextResponse.json({ data: result.rows });
    }

    // 2. Check if it's a standardized table recorded in dados_cap_processados
    const capRecord = await db.query.dadosCapProcessados.findFirst({
      where: eq(dadosCapProcessados.nomeTabela, table),
    });

    if (capRecord && Array.isArray(capRecord.dadosProcessados)) {
      const formattedRows = capRecord.dadosProcessados.map((row: any, idx: number) => ({
        id: idx + 1,
        numero_bo: row.numeroBo || row.NumeroBO || row.NUMERO_BO || '',
        historico: row.historico || row.Historico || row.HISTORICO || '',
        delito: row.Delito_Padronizado || row.delito || '',
        municipio: row.Municipio_CPAM7 || row.municipio || '',
        re_validador: capRecord.reValidador,
        cpf_validador: capRecord.cpfValidador,
        ip_address: capRecord.ipAddress,
        codigo_processamento: capRecord.codigoProcessamento,
        data_processamento: capRecord.createdAt,
        ...row,
      }));
      return NextResponse.json({ data: formattedRows });
    }

    return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching table data:', error);
    return NextResponse.json({ error: 'Failed to fetch table data' }, { status: 500 });
  }
}
