import * as cheerio from "cheerio";
import type { SubpageResult } from "../types";

const MAX_SUBPAGES = 10;
const PER_REQUEST_TIMEOUT = 6000;

function sameHost(a: string, b: string): boolean {
  try {
    return new URL(a).host === new URL(b).host;
  } catch {
    return false;
  }
}

async function tryFetchStatus(url: string): Promise<{ status: number | null; title: string | null }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PER_REQUEST_TIMEOUT);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LemonSEOBot/1.0)" },
    });
    let title: string | null = null;
    if (res.ok && res.headers.get("content-type")?.includes("text/html")) {
      const html = await res.text();
      const $ = cheerio.load(html);
      title = $("title").first().text().trim() || null;
    }
    return { status: res.status, title };
  } catch {
    return { status: null, title: null };
  } finally {
    clearTimeout(timer);
  }
}

async function fromSitemap(baseUrl: string): Promise<string[]> {
  try {
    const sitemapUrl = new URL("/sitemap.xml", baseUrl).toString();
    const res = await fetch(sitemapUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LemonSEOBot/1.0)" },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const $ = cheerio.load(xml, { xmlMode: true });
    const urls: string[] = [];
    $("loc").each((_, el) => {
      const loc = $(el).text().trim();
      if (loc) urls.push(loc);
    });
    return urls;
  } catch {
    return [];
  }
}

function fromHomeLinks($: cheerio.CheerioAPI, baseUrl: string): string[] {
  const links = new Set<string>();
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    try {
      const abs = new URL(href, baseUrl).toString().split("#")[0];
      if (sameHost(abs, baseUrl) && abs !== baseUrl) {
        links.add(abs);
      }
    } catch {
      // ignore invalid URLs
    }
  });
  return Array.from(links);
}

export async function analyzeSubpages(
  $: cheerio.CheerioAPI,
  baseUrl: string
): Promise<SubpageResult[]> {
  let candidates = (await fromSitemap(baseUrl)).filter((u) => sameHost(u, baseUrl));
  if (candidates.length === 0) {
    candidates = fromHomeLinks($, baseUrl);
  }
  candidates = candidates.slice(0, MAX_SUBPAGES);

  const results = await Promise.all(
    candidates.map(async (url) => {
      const { status, title } = await tryFetchStatus(url);
      return {
        url,
        status,
        title,
        ok: status !== null && status >= 200 && status < 400,
      } satisfies SubpageResult;
    })
  );

  return results;
}
