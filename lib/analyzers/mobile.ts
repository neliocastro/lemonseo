import * as cheerio from "cheerio";

export function analyzeMobile($: cheerio.CheerioAPI) {
  const viewport = $('meta[name="viewport"]').attr("content") || null;
  const hasViewport = Boolean(viewport && viewport.includes("width=device-width"));

  return {
    hasViewport,
    viewportContent: viewport,
  };
}
