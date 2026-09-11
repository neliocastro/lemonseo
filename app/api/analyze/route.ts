import { NextRequest, NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import { runAnalysis } from "@/lib/analyze";
import { saveLead, saveReport } from "@/lib/store";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 10);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = typeof body.url === "string" ? body.url.trim() : "";
    const keyword = typeof body.keyword === "string" && body.keyword.trim() ? body.keyword.trim() : null;

    if (!url) {
      return NextResponse.json({ error: "Informe a URL do site." }, { status: 400 });
    }

    const report = await runAnalysis(url, keyword);
    await saveReport(report);

    // Toda consulta pública alimenta a base histórica de leads do mini-CRM,
    // mesmo sem contato fornecido. Se o usuário der contato depois (modal de
    // e-mail / WhatsApp), o POST /api/lead atualiza este mesmo registro.
    await saveLead({
      id: nanoid(),
      reportSlug: report.slug,
      url: report.finalUrl,
      canal: "auto",
      createdAt: new Date().toISOString(),
      status: "novo",
      interactions: [
        {
          type: "status_change",
          message: "Lead criado automaticamente a partir da consulta pública",
          createdAt: new Date().toISOString(),
        },
      ],
    });

    return NextResponse.json({ slug: report.slug });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido ao analisar o site.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
