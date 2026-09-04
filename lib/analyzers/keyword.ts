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
  const firstParagraph = ($("p").first().text() || "").toLowerCase();
  const subheadings = $("h2, h3").text().toLowerCase();

  const occurrences = bodyText.split(kw).length - 1;
  const totalWords = bodyText.split(/\s+/).filter(Boolean).length;
  const kwWordCount = kw.split(/\s+/).filter(Boolean).length;
  const density = totalWords > 0 ? Math.round(((occurrences * kwWordCount) / totalWords) * 10000) / 100 : 0;

  return {
    keyword,
    inTitle: title.includes(kw),
    inH1: h1.includes(kw),
    inMetaDescription: metaDescription.includes(kw),
    inUrl: url.includes(kw.replace(/\s+/g, "-")),
    occurrences: Math.max(occurrences, 0),
    density,
    inFirstParagraph: firstParagraph.includes(kw),
    inSubheadings: subheadings.includes(kw),
  };
}
