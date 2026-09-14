import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/db';
import { auditReports } from '@/src/db/schema';

export async function GET() {
  try {
    const reports = await db.query.auditReports.findMany({
      columns: {
        id: true,
        fileName: true,
        validatorCpf: true,
        validatorRe: true,
        ipAddress: true,
        metadata: true,
        createdAt: true,
      },
      orderBy: (auditReports, { desc }) => [desc(auditReports.createdAt)],
    });
    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Error fetching audit reports:', error);
    return NextResponse.json({ error: 'Failed to fetch audit reports' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName, fileData, validatorCpf, validatorRe, metadata } = body;

    if (!fileName || !fileData || !validatorCpf || !validatorRe) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const rawIp = req.headers.get('x-forwarded-for') || '0.0.0.0';
    const ipAddress = rawIp.split(',')[0].trim().substring(0, 45);

    const [newReport] = await db.insert(auditReports).values({
      fileName: fileName.substring(0, 255),
      fileData,
      validatorCpf: validatorCpf.substring(0, 50),
      validatorRe: validatorRe.substring(0, 20),
      ipAddress,
      metadata: metadata || {},
    }).returning({ id: auditReports.id });

    return NextResponse.json({ success: true, id: newReport.id });
  } catch (error) {
    console.error('Error creating audit report:', error);
    return NextResponse.json({ error: 'Failed to create audit report' }, { status: 500 });
  }
}
