import { XMLParser, XMLValidator } from "fast-xml-parser";

const REQUEST_TIMEOUT = 8000;
const REQUEST_HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; LemonSEOBot/1.0)" };

export interface SitemapLocation {
  url: string;
  source: "robots" | "default";
}

export interface SitemapSyntaxResult {
  url: string;
  source: "robots" | "default";
  found: boolean;
  valid: boolean;
  errorMessage?: string;
  rootTag: "urlset" | "sitemapindex" | null;
  entryCount: number;
}

async function fetchText(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: REQUEST_HEADERS });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Localiza o(s) sitemap(s) do site: primeiro via diretivas "Sitemap:" no
 * robots.txt (pode haver mais de uma), e só cai para o path padrão
 * /sitemap.xml se o robots.txt não referenciar nenhum.
 */
export async function findSitemapUrls(baseUrl: string): Promise<SitemapLocation[]> {
  const robotsUrl = new URL("/robots.txt", baseUrl).toString();
  const robotsTxt = await fetchText(robotsUrl);

  const fromRobots: string[] = [];
  if (robotsTxt) {
    for (const line of robotsTxt.split("\n")) {
      const match = line.trim().match(/^sitemap:\s*(\S+)/i);
      if (match) fromRobots.push(match[1]);
    }
  }

  if (fromRobots.length > 0) {
    return fromRobots.map((url) => ({ url, source: "robots" as const }));
  }

  return [{ url: new URL("/sitemap.xml", baseUrl).toString(), source: "default" as const }];
}

function countEntries(xml: string, rootTag: "urlset" | "sitemapindex" | null): number {
  if (!rootTag) return 0;
  const parser = new XMLParser({ ignoreAttributes: false });
  try {
    const parsed = parser.parse(xml);
    const root = parsed[rootTag];
    const childTag = rootTag === "urlset" ? "url" : "sitemap";
    const children = root?.[childTag];
    if (!children) return 0;
    return Array.isArray(children) ? children.length : 1;
  } catch {
    return 0;
  }
}

function detectRootTag(xml: string): "urlset" | "sitemapindex" | null {
  if (/<sitemapindex[\s>]/i.test(xml)) return "sitemapindex";
  if (/<urlset[\s>]/i.test(xml)) return "urlset";
  return null;
}

/**
 * Busca cada sitemap localizado e valida a sintaxe XML (bem-formação,
 * conforme o protocolo sitemaps.org — elemento raiz <urlset> ou
 * <sitemapindex>).
 */
export async function validateSitemapSyntax(baseUrl: string): Promise<SitemapSyntaxResult[]> {
  const locations = await findSitemapUrls(baseUrl);

  return Promise.all(
    locations.map(async ({ url, source }): Promise<SitemapSyntaxResult> => {
      const xml = await fetchText(url);
      if (xml === null) {
        return { url, source, found: false, valid: false, rootTag: null, entryCount: 0 };
      }

      const validation = XMLValidator.validate(xml);
      if (validation !== true) {
        return {
          url,
          source,
          found: true,
          valid: false,
          errorMessage: `${validation.err.msg} (linha ${validation.err.line})`,
          rootTag: null,
          entryCount: 0,
        };
      }

      const rootTag = detectRootTag(xml);
      if (!rootTag) {
        return {
          url,
          source,
          found: true,
          valid: false,
          errorMessage: "XML bem-formado, mas sem elemento raiz <urlset> ou <sitemapindex>.",
          rootTag: null,
          entryCount: 0,
        };
      }

      return {
        url,
        source,
        found: true,
        valid: true,
        rootTag,
        entryCount: countEntries(xml, rootTag),
      };
    })
  );
}

export interface SitemapBestPracticesResult {
  url: string;
  /** true quando este sitemap é um sub-sitemap referenciado por um sitemapindex */
  partOfIndex: boolean;
  urlCount: number;
  exceedsUrlLimit: boolean;
  lastmodCoveragePercent: number;
  hasLowLastmodCoverage: boolean;
}

const URL_LIMIT = 50000;
const LASTMOD_COVERAGE_THRESHOLD = 50;
// Sites grandes podem ter dezenas de sub-sitemaps; checar só os primeiros
// evita uma varredura muito longa numa ferramenta de diagnóstico sob demanda.
const MAX_SUB_SITEMAPS_TO_CHECK = 10;

function extractUrlEntries(xml: string): { hasLastmod: boolean }[] {
  const parser = new XMLParser({ ignoreAttributes: false });
  try {
    const parsed = parser.parse(xml);
    const children = parsed.urlset?.url;
    if (!children) return [];
    const list = Array.isArray(children) ? children : [children];
    return list.map((entry) => ({ hasLastmod: typeof entry === "object" && entry.lastmod != null }));
  } catch {
    return [];
  }
}

function extractSubSitemapUrls(xml: string): string[] {
  const parser = new XMLParser({ ignoreAttributes: false });
  try {
    const parsed = parser.parse(xml);
    const children = parsed.sitemapindex?.sitemap;
    if (!children) return [];
    const list = Array.isArray(children) ? children : [children];
    return list
      .map((entry) => (typeof entry === "object" ? entry.loc : String(entry)))
      .filter((loc): loc is string => typeof loc === "string" && loc.length > 0);
  } catch {
    return [];
  }
}

async function checkUrlsetBestPractices(
  url: string,
  partOfIndex: boolean
): Promise<SitemapBestPracticesResult | null> {
  const xml = await fetchText(url);
  if (!xml) return null;

  const entries = extractUrlEntries(xml);
  if (entries.length === 0) return null;

  const withLastmod = entries.filter((e) => e.hasLastmod).length;
  const coverage = Math.round((withLastmod / entries.length) * 100);

  return {
    url,
    partOfIndex,
    urlCount: entries.length,
    exceedsUrlLimit: entries.length > URL_LIMIT,
    lastmodCoveragePercent: coverage,
    hasLowLastmodCoverage: coverage < LASTMOD_COVERAGE_THRESHOLD,
  };
}

/**
 * Checa boas práticas recomendadas pelos buscadores em cada sitemap
 * localizado: limite de 50.000 URLs por arquivo (sinalizando quando um
 * sitemap index deveria ter sido usado), e cobertura de <lastmod> entre
 * as URLs listadas.
 */
export async function checkSitemapBestPractices(baseUrl: string): Promise<SitemapBestPracticesResult[]> {
  const syntaxResults = await validateSitemapSyntax(baseUrl);
  const results: SitemapBestPracticesResult[] = [];

  for (const s of syntaxResults) {
    if (!s.valid) continue;

    if (s.rootTag === "urlset") {
      const result = await checkUrlsetBestPractices(s.url, false);
      if (result) results.push(result);
      continue;
    }

    if (s.rootTag === "sitemapindex") {
      const xml = await fetchText(s.url);
      if (!xml) continue;
      const subUrls = extractSubSitemapUrls(xml).slice(0, MAX_SUB_SITEMAPS_TO_CHECK);
      const subResults = await Promise.all(subUrls.map((subUrl) => checkUrlsetBestPractices(subUrl, true)));
      results.push(...subResults.filter((r): r is SitemapBestPracticesResult => r !== null));
    }
  }

  return results;
}
