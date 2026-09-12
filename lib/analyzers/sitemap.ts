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
