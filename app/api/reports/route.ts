import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { apiReports } from '@/src/db/schema';

// GET list of reports (metadata only, without fileData to save bandwidth)
export async function GET() {
  try {
    const reports = await db.query.apiReports.findMany({
      columns: {
        id: true,
        fileName: true,
        cpf: true,
        re: true,
        metadata: true,
        createdAt: true,
      },
      orderBy: (apiReports, { desc }) => [desc(apiReports.createdAt)],
    });
    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

// POST a new report (mocking API behavior)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fileName, fileData, cpf, re, metadata } = body;

    if (!fileName || !fileData || !cpf || !re) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [newReport] = await db.insert(apiReports).values({
      fileName,
      fileData,
      cpf,
      re,
      metadata: metadata || {},
    }).returning({ id: apiReports.id });

    return NextResponse.json({ success: true, id: newReport.id });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}
