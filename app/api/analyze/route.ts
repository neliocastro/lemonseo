import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { customAlphabet } from "nanoid";
import { runAnalysis } from "@/lib/analyze";
import { attachScrapedEmails, saveLead, saveReport } from "@/lib/store";
import { extractEmails, scrapeContactPages } from "@/lib/analyzers/emailScraper";

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
    const leadId = nanoid();
    await saveLead({
      id: leadId,
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

    // Lead automático nunca tem e-mail espontâneo — aciona o scraper para
    // tentar achar um contato institucional no próprio site analisado.
    // Roda depois da resposta (after()) para não atrasar o usuário esperando
    // a análise.
    after(async () => {
      try {
        const pages = await scrapeContactPages(report.finalUrl);
        const emails = extractEmails(pages);
        await attachScrapedEmails(leadId, emails);
      } catch {
        // scraper é best-effort — falha aqui não deve afetar o lead já salvo
      }
    });

    return NextResponse.json({ slug: report.slug });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido ao analisar o site.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
