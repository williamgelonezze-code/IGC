import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { apiReports, dejemDocuments } from '@/src/db/schema';
import { desc } from 'drizzle-orm';

export interface ArchivedCloudPdf {
  id: number;
  sourceTable: 'api_reports' | 'dejem_documents';
  compositeKey: string;
  fileName: string;
  category: string;
  cpf: string;
  re: string;
  createdAt: string;
  sourceDocName?: string;
  totalIds?: number;
  badge: string;
}

export async function GET() {
  try {
    // 1. Fetch Automated Analytical Reports from api_reports
    const autoReports = await db.query.apiReports.findMany({
      columns: {
        id: true,
        fileName: true,
        cpf: true,
        re: true,
        createdAt: true,
        metadata: true,
      },
      orderBy: [desc(apiReports.id)],
    });

    // 2. Fetch Archived Operational DEJEM documents from dejem_documents
    const dejemDocs = await db.query.dejemDocuments.findMany({
      columns: {
        id: true,
        fileName: true,
        uploadedByCpf: true,
        uploadedByRe: true,
        createdAt: true,
      },
      orderBy: [desc(dejemDocuments.id)],
    });

    const mappedAutoReports: ArchivedCloudPdf[] = autoReports.map(r => ({
      id: r.id,
      sourceTable: 'api_reports',
      compositeKey: `api_reports:${r.id}`,
      fileName: r.fileName,
      category: 'Relatório Analítico Automatizado',
      cpf: r.cpf,
      re: r.re,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : '',
      sourceDocName: (r.metadata as any)?.sourceDocName,
      totalIds: (r.metadata as any)?.total_ids_avaliados || (Array.isArray((r.metadata as any)?.escala_ids) ? (r.metadata as any).escala_ids.length : undefined),
      badge: 'Relatório Analítico (PDF)',
    }));

    const mappedDejemDocs: ArchivedCloudPdf[] = dejemDocs.map(d => ({
      id: d.id,
      sourceTable: 'dejem_documents',
      compositeKey: `dejem_documents:${d.id}`,
      fileName: d.fileName,
      category: 'Documento Operacional DEJEM',
      cpf: d.uploadedByCpf,
      re: d.uploadedByRe,
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : '',
      badge: 'Documento DEJEM (PDF)',
    }));

    // Combined list, prioritising automated analytical reports
    const allFiles: ArchivedCloudPdf[] = [...mappedAutoReports, ...mappedDejemDocs];

    return NextResponse.json({
      files: allFiles,
      autoReports: mappedAutoReports,
      dejemDocs: mappedDejemDocs,
      totalCount: allFiles.length,
    });
  } catch (error: any) {
    console.error('Error fetching archived cloud PDF reports:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar relatórios arquivados no banco de dados Cloud.' },
      { status: 500 }
    );
  }
}
