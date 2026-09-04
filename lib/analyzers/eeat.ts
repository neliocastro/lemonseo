import type * as cheerio from "cheerio";

export interface EeatResult {
  cnpjFound: boolean;
  cnpjValue: string | null;
  faqFound: boolean;
  testimonialsFound: boolean;
  aboutPageFound: boolean;
  aboutPageUrl: string | null;
  privacyPolicyFound: boolean;
  privacyPolicyUrl: string | null;
  contactFound: boolean;
}

const CNPJ_REGEX = /\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/;

function findLinkByKeywords($: cheerio.CheerioAPI, keywords: string[]): string | null {
  let found: string | null = null;
  $("a[href]").each((_, el) => {
    if (found) return;
    const text = $(el).text().toLowerCase();
    const href = ($(el).attr("href") || "").toLowerCase();
    if (keywords.some((kw) => text.includes(kw) || href.includes(kw))) {
      found = $(el).attr("href") || null;
    }
  });
  return found;
}

export function analyzeEeat($: cheerio.CheerioAPI, bodyText: string): EeatResult {
  const cnpjMatch = bodyText.match(CNPJ_REGEX);

  const faqFound =
    /perguntas frequentes|faq/i.test(bodyText) ||
    $('[itemtype*="FAQPage"]').length > 0 ||
    $("script").filter((_, el) => /FAQPage/.test($(el).text())).length > 0;

  const testimonialsFound = /depoimento|avaliaç(ã|a)o de client|o que dizem/i.test(bodyText);

  const aboutPageUrl = findLinkByKeywords($, ["sobre", "quem somos", "about"]);
  const privacyPolicyUrl = findLinkByKeywords($, ["política de privacidade", "privacidade", "privacy"]);
  const contactFound =
    findLinkByKeywords($, ["contato", "fale conosco", "contact"]) !== null ||
    /tel:|mailto:/.test($.html());

  return {
    cnpjFound: Boolean(cnpjMatch),
    cnpjValue: cnpjMatch ? cnpjMatch[0] : null,
    faqFound,
    testimonialsFound,
    aboutPageFound: aboutPageUrl !== null,
    aboutPageUrl,
    privacyPolicyFound: privacyPolicyUrl !== null,
    privacyPolicyUrl,
    contactFound,
  };
}
