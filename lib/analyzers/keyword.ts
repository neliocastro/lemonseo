import type * as cheerio from "cheerio";
import type { KeywordResult } from "../types";

export function analyzeKeyword(
  $: cheerio.CheerioAPI,
  finalUrl: string,
  keyword: string | null
): KeywordResult | null {
  if (!keyword || !keyword.trim()) return null;

  const kw = keyword.trim().toLowerCase();
  const title = $("title").first().text().toLowerCase();
  const h1 = $("h1").first().text().toLowerCase();
  const metaDescription = ($('meta[name="description"]').attr("content") || "").toLowerCase();
  const bodyText = $("body").text().toLowerCase();
  const url = finalUrl.toLowerCase();

  const occurrences = bodyText.split(kw).length - 1;

  return {
    keyword,
    inTitle: title.includes(kw),
    inH1: h1.includes(kw),
    inMetaDescription: metaDescription.includes(kw),
    inUrl: url.includes(kw.replace(/\s+/g, "-")),
    occurrences: Math.max(occurrences, 0),
  };
}
