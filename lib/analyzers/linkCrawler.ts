import * as cheerio from "cheerio";
import { fetchHtml } from "./fetchHtml";

export interface CrawledLink {
  href: string;
  type: "internal" | "external";
  anchorText: string;
  foundOn: string;
}

export interface CrawlResult {
  pageUrl: string;
  links: CrawledLink[];
}

const SKIP_SCHEMES = /^(mailto:|tel:|javascript:|#)/i;

/**
 * Varre a página em `rawUrl` e monta o grafo de links internos/externos
 * encontrados nela — base para a checagem de status code (404/5xx) na
 * etapa seguinte do rastreador.
 */
export async function crawlPageLinks(rawUrl: string): Promise<CrawlResult> {
  const { html, finalUrl } = await fetchHtml(rawUrl);
  const $ = cheerio.load(html);
  const host = new URL(finalUrl).host;

  const seen = new Set<string>();
  const links: CrawledLink[] = [];

  $("a[href]").each((_, el) => {
    const hrefRaw = $(el).attr("href")?.trim() || "";
    if (!hrefRaw || SKIP_SCHEMES.test(hrefRaw)) return;

    let absolute: URL;
    try {
      absolute = new URL(hrefRaw, finalUrl);
    } catch {
      return;
    }
    absolute.hash = "";
    const normalized = absolute.toString();
    if (seen.has(normalized)) return;
    seen.add(normalized);

    links.push({
      href: normalized,
      type: absolute.host === host ? "internal" : "external",
      anchorText: $(el).text().trim().slice(0, 140),
      foundOn: finalUrl,
    });
  });

  return { pageUrl: finalUrl, links };
}
