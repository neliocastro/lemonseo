import * as cheerio from "cheerio";
import { fetchHtml } from "./fetchHtml";

export type ScrapeSource = "homepage" | "contact" | "about" | "privacy";

export interface ScrapedPage {
  source: ScrapeSource;
  url: string;
  html: string;
}

const CONTACT_KEYWORDS = ["contato", "fale conosco", "contact"];
const ABOUT_KEYWORDS = ["sobre", "quem somos", "about"];
const PRIVACY_KEYWORDS = ["política de privacidade", "termos de privacidade", "privacidade", "privacy"];

function findLinkByKeywords($: cheerio.CheerioAPI, baseUrl: string, keywords: string[]): string | null {
  let found: string | null = null;
  $("a[href]").each((_, el) => {
    if (found) return;
    const text = $(el).text().toLowerCase();
    const href = ($(el).attr("href") || "").toLowerCase();
    if (keywords.some((kw) => text.includes(kw) || href.includes(kw))) {
      const raw = $(el).attr("href");
      if (!raw) return;
      try {
        found = new URL(raw, baseUrl).toString();
      } catch {
        // ignora hrefs inválidos (mailto:, tel:, javascript:, etc. sem base válida)
      }
    }
  });
  return found;
}

/**
 * Varre a home (que já inclui o rodapé), a página de contato/formulário e a
 * política de privacidade do site em busca de e-mails institucionais
 * expostos. Não extrai os e-mails em si — isso é feito na etapa seguinte
 * (checkLeadEmails / extractEmails).
 */
export async function scrapeContactPages(rawUrl: string): Promise<ScrapedPage[]> {
  const homepage = await fetchHtml(rawUrl);
  const $ = cheerio.load(homepage.html);

  const candidates: { source: ScrapeSource; url: string | null }[] = [
    { source: "contact", url: findLinkByKeywords($, homepage.finalUrl, CONTACT_KEYWORDS) },
    { source: "privacy", url: findLinkByKeywords($, homepage.finalUrl, PRIVACY_KEYWORDS) },
    { source: "about", url: findLinkByKeywords($, homepage.finalUrl, ABOUT_KEYWORDS) },
  ];

  const pages: ScrapedPage[] = [{ source: "homepage", url: homepage.finalUrl, html: homepage.html }];
  const visited = new Set([homepage.finalUrl]);

  const results = await Promise.all(
    candidates
      .filter((c): c is { source: ScrapeSource; url: string } => c.url !== null && !visited.has(c.url))
      .map(async (c) => {
        visited.add(c.url);
        try {
          const res = await fetchHtml(c.url);
          return { source: c.source, url: res.finalUrl, html: res.html };
        } catch {
          return null;
        }
      })
  );

  for (const page of results) {
    if (page) pages.push(page);
  }

  return pages;
}
