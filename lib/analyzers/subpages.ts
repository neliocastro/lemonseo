import * as cheerio from "cheerio";
import type { SubpageResult } from "../types";
import { analyzeSeo } from "./seo";
import { analyzeImages } from "./images";
import { analyzeMobile } from "./mobile";

const MAX_SUBPAGES = 10;
const PER_REQUEST_TIMEOUT = 6000;

function sameHost(a: string, b: string): boolean {
  try {
    return new URL(a).host === new URL(b).host;
  } catch {
    return false;
  }
}

function labelFromUrl(url: string): string {
  try {
    const { pathname } = new URL(url);
    const segments = pathname.split("/").filter(Boolean);
    return segments.length > 0 ? segments[segments.length - 1] : "home";
  } catch {
    return "página";
  }
}

async function analyzeSubpage(url: string): Promise<SubpageResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PER_REQUEST_TIMEOUT);
  const label = labelFromUrl(url);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LemonSEOBot/1.0)" },
    });

    let title: string | null = null;
    let seo: SubpageResult["seo"];

    if (res.ok && res.headers.get("content-type")?.includes("text/html")) {
      const html = await res.text();
      const $ = cheerio.load(html);
      const pageSeo = analyzeSeo($, url);
      const pageImages = analyzeImages($, url);
      const pageMobile = analyzeMobile($, html);

      title = pageSeo.title;
      seo = {
        titleLength: pageSeo.titleLength,
        metaDescription: pageSeo.metaDescription,
        metaDescriptionLength: pageSeo.metaDescriptionLength,
        h1Count: pageSeo.h1Count,
        hasViewport: pageMobile.hasViewport,
        imagesTotal: pageImages.total,
        imagesWithoutAlt: pageImages.withoutAlt,
      };
    }

    return {
      url,
      status: res.status,
      title,
      ok: res.status >= 200 && res.status < 400,
      label,
      seo,
    };
  } catch {
    return { url, status: null, title: null, ok: false, label };
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

  return Promise.all(candidates.map(analyzeSubpage));
}
