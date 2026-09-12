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
  const host = new URL(baseUrl).host;
  let found: string | null = null;
  $("a[href]").each((_, el) => {
    if (found) return;
    const text = $(el).text().toLowerCase();
    const href = ($(el).attr("href") || "").toLowerCase();
    if (keywords.some((kw) => text.includes(kw) || href.includes(kw))) {
      const raw = $(el).attr("href");
      if (!raw) return;
      try {
        const absolute = new URL(raw, baseUrl);
        // Só seguimos links do próprio site — um link "sobre"/"contato" para
        // outro domínio (ex: rede de anúncios, terceiro linkado no rodapé)
        // não deve nos levar a extrair e-mails que não são do site analisado.
        if (absolute.host === host) found = absolute.toString();
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

export interface ExtractedEmail {
  email: string;
  sources: ScrapeSource[];
  occurrences: number;
}

const EMAIL_REGEX =
  /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+/g;

// Prefixos que quase sempre indicam caixa automática/não-institucional, não um
// contato real a ser abordado.
const GENERIC_LOCAL_PREFIXES = [
  "noreply",
  "no-reply",
  "donotreply",
  "do-not-reply",
  "example",
  "test",
  "webmaster",
  "postmaster",
  "mailer-daemon",
];

// Domínios de terceiros (analytics, error tracking, placeholders de template)
// que aparecem no HTML/JS mas não são e-mails institucionais do site.
const IGNORED_DOMAINS = [
  "sentry.io",
  "sentry-cdn.com",
  "example.com",
  "example.org",
  "example.net",
  "wixpress.com",
  "godaddy.com",
  "domain.com",
  "yourdomain.com",
  "w3.org",
  "schema.org",
];

// Extensões de arquivo (imagens @2x, CSS, JS) que acidentalmente têm o
// formato "algo@versao.ext" e batem com a regex de e-mail.
const FILE_EXTENSION_DOMAIN = /\.(png|jpe?g|gif|webp|svg|avif|ico|css|js|json|woff2?|ttf)$/i;

function isGenericOrIrrelevant(email: string): boolean {
  const [localPart, domain] = email.split("@");
  if (!domain) return true;
  if (FILE_EXTENSION_DOMAIN.test(domain)) return true;
  if (GENERIC_LOCAL_PREFIXES.some((prefix) => localPart === prefix || localPart.startsWith(prefix))) {
    return true;
  }
  if (IGNORED_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`))) return true;
  return false;
}

/**
 * Extrai e-mails do HTML de cada página varrida, filtra genéricos/de
 * terceiros irrelevantes (no-reply, Sentry, placeholders de template) e
 * deduplica, agregando as páginas onde cada e-mail foi encontrado.
 */
export function extractEmails(pages: ScrapedPage[]): ExtractedEmail[] {
  const found = new Map<string, ExtractedEmail>();

  for (const page of pages) {
    const matches = page.html.match(EMAIL_REGEX) ?? [];
    for (const raw of matches) {
      const email = raw.toLowerCase();
      if (isGenericOrIrrelevant(email)) continue;

      const existing = found.get(email);
      if (existing) {
        existing.occurrences += 1;
        if (!existing.sources.includes(page.source)) existing.sources.push(page.source);
      } else {
        found.set(email, { email, sources: [page.source], occurrences: 1 });
      }
    }
  }

  return Array.from(found.values()).sort((a, b) => b.occurrences - a.occurrences);
}
