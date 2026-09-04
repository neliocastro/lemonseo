import * as cheerio from "cheerio";

export function analyzeSeo($: cheerio.CheerioAPI) {
  const title = $("title").first().text().trim() || null;
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() || null;
  const h1s = $("h1");
  const h1Text = h1s.first().text().trim() || null;
  const canonical = $('link[rel="canonical"]').attr("href") || null;
  const robotsMeta = $('meta[name="robots"]').attr("content") || null;
  const lang = $("html").attr("lang") || null;
  const hasOpenGraph = $('meta[property^="og:"]').length > 0;

  return {
    title,
    titleLength: title?.length ?? 0,
    metaDescription,
    metaDescriptionLength: metaDescription?.length ?? 0,
    h1Count: h1s.length,
    h1Text,
    canonical,
    robotsMeta,
    lang,
    hasOpenGraph,
  };
}
