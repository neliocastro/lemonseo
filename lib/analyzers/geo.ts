import type * as cheerio from "cheerio";
import type { SiteFilesResult } from "./files";

export interface GeoResult {
  crawlersOpen: boolean;
  llmsTxtFound: boolean;
  llmsFullTxtFound: boolean;
  schemaTypes: string[];
  hasSemanticHtml: boolean;
  semanticTagsFound: string[];
  hasDirectAnswerPatterns: boolean;
  listCount: number;
  tableCount: number;
  sitemapReferencedInRobots: boolean;
}

const SEMANTIC_TAGS = ["main", "article", "section", "nav", "header", "footer", "aside"];

export function analyzeGeo($: cheerio.CheerioAPI, files: SiteFilesResult): GeoResult {
  const schemaTypes = new Set<string>();
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).text());
      const items = Array.isArray(json) ? json : [json];
      for (const item of items) {
        const type = item?.["@type"];
        if (typeof type === "string") schemaTypes.add(type);
        else if (Array.isArray(type)) type.forEach((t) => typeof t === "string" && schemaTypes.add(t));
      }
    } catch {
      // JSON-LD inválido, ignora
    }
  });

  const semanticTagsFound = SEMANTIC_TAGS.filter((tag) => $(tag).length > 0);
  const listCount = $("ul, ol").length;
  const tableCount = $("table").length;

  return {
    crawlersOpen: !files.aiCrawlersBlocked,
    llmsTxtFound: files.llmsTxtFound,
    llmsFullTxtFound: files.llmsFullTxtFound,
    schemaTypes: Array.from(schemaTypes),
    hasSemanticHtml: semanticTagsFound.length >= 2,
    semanticTagsFound,
    hasDirectAnswerPatterns: listCount + tableCount >= 2,
    listCount,
    tableCount,
    sitemapReferencedInRobots: files.sitemapReferencedInRobots,
  };
}
