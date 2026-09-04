import * as cheerio from "cheerio";

const GENERIC_ANCHORS = ["clique aqui", "saiba mais", "leia mais", "aqui", "link", "veja mais", "click here"];

export function analyzeSeo($: cheerio.CheerioAPI, baseUrl?: string) {
  const title = $("title").first().text().trim() || null;
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() || null;
  const h1s = $("h1");
  const h1Text = h1s.first().text().trim() || null;
  const canonical = $('link[rel="canonical"]').attr("href") || null;
  const robotsMeta = $('meta[name="robots"]').attr("content") || null;
  const lang = $("html").attr("lang") || null;
  const hasOpenGraph = $('meta[property^="og:"]').length > 0;

  let internalLinks = 0;
  let externalLinks = 0;
  let genericAnchors = 0;

  if (baseUrl) {
    let host: string | null = null;
    try {
      host = new URL(baseUrl).host;
    } catch {
      host = null;
    }

    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      try {
        const abs = new URL(href, baseUrl);
        if (host && abs.host === host) internalLinks += 1;
        else externalLinks += 1;
      } catch {
        // ignora hrefs inválidos
      }

      const text = $(el).text().trim().toLowerCase();
      if (GENERIC_ANCHORS.includes(text)) genericAnchors += 1;
    });
  }

  return {
    title,
    titleLength: title?.length ?? 0,
    metaDescription,
    metaDescriptionLength: metaDescription?.length ?? 0,
    h1Count: h1s.length,
    h2Count: $("h2").length,
    h3Count: $("h3").length,
    h1Text,
    canonical,
    robotsMeta,
    lang,
    hasOpenGraph,
    internalLinks,
    externalLinks,
    genericAnchors,
  };
}
