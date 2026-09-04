import * as cheerio from "cheerio";

const MODERN_FORMATS = [".webp", ".avif"];

export interface ImageEntry {
  src: string;
  alt: string | null;
  format: string;
  hasAlt: boolean;
}

function formatFromSrc(src: string): string {
  const match = src.split("?")[0].match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toUpperCase() : "—";
}

export function analyzeImages($: cheerio.CheerioAPI, baseUrl?: string) {
  const imgs = $("img");
  let withoutAlt = 0;
  let modernFormat = 0;
  let legacyFormat = 0;
  const entries: ImageEntry[] = [];

  imgs.each((_, el) => {
    const alt = $(el).attr("alt") || null;
    const hasAlt = Boolean(alt && alt.trim());
    if (!hasAlt) withoutAlt += 1;

    const rawSrc = $(el).attr("src") || $(el).attr("data-src") || "";
    if (!rawSrc) return;

    let absSrc = rawSrc;
    if (baseUrl) {
      try {
        absSrc = new URL(rawSrc, baseUrl).toString();
      } catch {
        absSrc = rawSrc;
      }
    }

    const lower = rawSrc.toLowerCase();
    if (MODERN_FORMATS.some((ext) => lower.includes(ext))) {
      modernFormat += 1;
    } else if (/\.(jpg|jpeg|png|gif|bmp)(\?|$)/.test(lower)) {
      legacyFormat += 1;
    }

    entries.push({ src: absSrc, alt, format: formatFromSrc(rawSrc), hasAlt });
  });

  return {
    total: imgs.length,
    withoutAlt,
    modernFormat,
    legacyFormat,
    entries,
  };
}
