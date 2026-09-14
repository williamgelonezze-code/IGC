import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { igcPmReports } from "@/src/db/schema";
import { desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const reports = await db
      .select()
      .from(igcPmReports)
      .orderBy(desc(igcPmReports.createdAt));
    
    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Error fetching IGC-PM reports:", error);
    return NextResponse.json({ error: "Erro ao buscar relatórios" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName, fileData, uploadedByCpf, uploadedByRe, metadata } = body;

    if (!fileName || !fileData) {
      return NextResponse.json({ error: "Arquivo inválido" }, { status: 400 });
    }

    const report = await db.insert(igcPmReports).values({
      fileName,
      fileData,
      uploadedByCpf: uploadedByCpf || "Sistema",
      uploadedByRe: uploadedByRe || "Sistema",
      metadata: metadata || {},
    }).returning();

    return NextResponse.json({ success: true, report: report[0] });
  } catch (error) {
    console.error("Error saving IGC-PM report:", error);
    return NextResponse.json({ error: "Erro ao salvar relatório" }, { status: 500 });
  }
}
