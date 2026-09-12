import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, isValidAdminCookie } from "@/lib/adminAuth";
import { crawlPageLinks } from "@/lib/analyzers/linkCrawler";
import { checkLinksStatus } from "@/lib/analyzers/linkStatus";

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
    const { pageUrl, links } = await crawlPageLinks(url);
    const checked = await checkLinksStatus(links);
    const broken = checked.filter((l) => l.category !== "ok");

    return NextResponse.json({
      pageUrl,
      totalLinks: checked.length,
      brokenCount: broken.length,
      broken,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido ao checar os links.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
