import { NextRequest, NextResponse } from "next/server";
import { runAnalysis } from "@/lib/analyze";
import { saveReport } from "@/lib/store";

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

    return NextResponse.json({ slug: report.slug });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido ao analisar o site.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
