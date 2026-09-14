import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { dejemDocuments } from '@/src/db/schema';

// GET all documents metadata
export async function GET() {
  try {
    const docs = await db.query.dejemDocuments.findMany({
      columns: {
        id: true,
        fileName: true,
        uploadedByCpf: true,
        uploadedByRe: true,
        createdAt: true,
      },
      orderBy: (dejemDocuments, { desc }) => [desc(dejemDocuments.createdAt)],
    });
    return NextResponse.json({ docs });
  } catch (error) {
    console.error('Error fetching dejem docs:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

// POST new document
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fileName, fileData, uploadedByCpf, uploadedByRe } = body;

    if (!fileName || !fileData || !uploadedByCpf || !uploadedByRe) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await db.insert(dejemDocuments).values({
      fileName,
      fileData,
      uploadedByCpf,
      uploadedByRe,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error uploading dejem doc:', error);
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}
