import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, isValidAdminCookie } from "@/lib/adminAuth";
import {
  checkSitemapBestPractices,
  checkSitemapCoherence,
  validateSitemapSyntax,
} from "@/lib/analyzers/sitemap";

export async function POST(req: NextRequest) {
  if (!isValidAdminCookie(req.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!url) {
    return NextResponse.json({ error: "Informe a URL do site." }, { status: 400 });
  }

  try {
    const syntax = await validateSitemapSyntax(url);
    const hasValidSitemap = syntax.some((s) => s.valid);

    const [bestPractices, coherence] = hasValidSitemap
      ? await Promise.all([checkSitemapBestPractices(url), checkSitemapCoherence(url)])
      : [[], { totalUrlsListed: 0, totalUrlsChecked: 0, issues: [] }];

    return NextResponse.json({ syntax, bestPractices, coherence });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido ao checar o sitemap.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
