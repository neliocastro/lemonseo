import * as cheerio from "cheerio";
import type { SubpageResult } from "../types";
import { analyzeSeo } from "./seo";
import { analyzeImages } from "./images";
import { analyzeMobile } from "./mobile";

const MAX_PAGES = 15;
const MAX_POSTS = 5;
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

async function analyzeSubpage(url: string, type: SubpageResult["type"]): Promise<SubpageResult> {
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
      type,
      seo,
    };
  } catch {
    return { url, status: null, title: null, ok: false, label, type };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchXml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LemonSEOBot/1.0)" },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function extractLocs($: cheerio.CheerioAPI, selector: string): string[] {
  const urls: string[] = [];
  $(selector).each((_, el) => {
    const loc = $(el).text().trim();
    if (loc) urls.push(loc);
  });
  return urls;
}

interface SitemapCandidates {
  pages: string[];
  posts: string[];
}

async function fetchSitemapUrls(sitemapUrl: string): Promise<string[]> {
  const xml = await fetchXml(sitemapUrl);
  if (!xml) return [];
  const $ = cheerio.load(xml, { xmlMode: true });
  return extractLocs($, "url > loc");
}

/**
 * Sitemaps de WordPress costumam expor um índice (sitemap_index.xml) que lista
 * sub-sitemaps como post-sitemap.xml, page-sitemap.xml, category-sitemap.xml, etc.
 * Esses XMLs não são páginas navegáveis — precisamos abrir o page-sitemap.xml e o
 * post-sitemap.xml e extrair as <url><loc> reais listadas dentro deles.
 */
async function fromSitemap(baseUrl: string): Promise<SitemapCandidates> {
  const sitemapUrl = new URL("/sitemap.xml", baseUrl).toString();
  const xml = await fetchXml(sitemapUrl);
  if (!xml) return { pages: [], posts: [] };

  const $ = cheerio.load(xml, { xmlMode: true });

  if ($("sitemapindex").length === 0) {
    return { pages: extractLocs($, "url > loc"), posts: [] };
  }

  const subSitemaps = extractLocs($, "sitemap > loc");
  // Sites com muitos posts/páginas (Rank Math, Yoast) paginam em post-sitemap1.xml,
  // post-sitemap2.xml, etc. — o número é opcional.
  const pageSitemapUrl = subSitemaps.find((loc) => /page-sitemap\d*\.xml/i.test(loc)) ?? subSitemaps[0];
  const postSitemapUrl = subSitemaps.find((loc) => /post-sitemap\d*\.xml/i.test(loc));

  const [pages, posts] = await Promise.all([
    pageSitemapUrl ? fetchSitemapUrls(pageSitemapUrl) : Promise.resolve([]),
    postSitemapUrl ? fetchSitemapUrls(postSitemapUrl) : Promise.resolve([]),
  ]);

  return { pages, posts };
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

export interface SubpagesAnalysis {
  items: SubpageResult[];
  totalFound: number;
}

export async function analyzeSubpages(
  $: cheerio.CheerioAPI,
  baseUrl: string
): Promise<SubpagesAnalysis> {
  const sitemapCandidates = await fromSitemap(baseUrl);
  let pages = sitemapCandidates.pages.filter((u) => sameHost(u, baseUrl));
  let posts = sitemapCandidates.posts.filter((u) => sameHost(u, baseUrl));

  if (pages.length === 0 && posts.length === 0) {
    pages = fromHomeLinks($, baseUrl);
  }

  const totalFound = pages.length + posts.length;
  pages = pages.slice(0, MAX_PAGES);
  posts = posts.slice(0, MAX_POSTS);

  const items = await Promise.all([
    ...pages.map((url) => analyzeSubpage(url, "page")),
    ...posts.map((url) => analyzeSubpage(url, "post")),
  ]);
  return { items, totalFound };
}
