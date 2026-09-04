import * as cheerio from "cheerio";

const MODERN_FORMATS = [".webp", ".avif"];

export function analyzeImages($: cheerio.CheerioAPI) {
  const imgs = $("img");
  let withoutAlt = 0;
  let modernFormat = 0;
  let legacyFormat = 0;

  imgs.each((_, el) => {
    const alt = $(el).attr("alt");
    if (!alt || !alt.trim()) withoutAlt += 1;

    const src = ($(el).attr("src") || $(el).attr("data-src") || "").toLowerCase();
    if (!src) return;
    if (MODERN_FORMATS.some((ext) => src.includes(ext))) {
      modernFormat += 1;
    } else if (/\.(jpg|jpeg|png|gif|bmp)(\?|$)/.test(src)) {
      legacyFormat += 1;
    }
  });

  return {
    total: imgs.length,
    withoutAlt,
    modernFormat,
    legacyFormat,
  };
}
