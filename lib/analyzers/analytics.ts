import type { AnalyticsResult } from "../types";

export function analyzeAnalytics(html: string): AnalyticsResult {
  const ga4Match = html.match(/gtag\(['"]config['"],\s*['"](G-[A-Z0-9]+)['"]/i);
  const gtmMatch = html.match(/(GTM-[A-Z0-9]+)/i);
  const universalAnalytics = /gtag\(['"]config['"],\s*['"]UA-[0-9-]+['"]/i.test(html) || /ga\('create'/i.test(html);

  const ga4 = Boolean(ga4Match);
  const gtm = Boolean(gtmMatch) || /googletagmanager\.com\/gtm\.js/i.test(html);
  const metaPixel = /fbq\(['"]init['"]/i.test(html);
  const hotjar = /static\.hotjar\.com/i.test(html);
  const clarity = /clarity\.ms\/tag/i.test(html);

  const detected: string[] = [];
  if (ga4) detected.push("Google Analytics 4");
  if (universalAnalytics) detected.push("Universal Analytics (legado)");
  if (gtm) detected.push("Google Tag Manager");
  if (metaPixel) detected.push("Meta Pixel (Facebook)");
  if (hotjar) detected.push("Hotjar");
  if (clarity) detected.push("Microsoft Clarity");

  return {
    ga4,
    ga4Id: ga4Match?.[1] || null,
    universalAnalytics,
    gtm,
    gtmId: gtmMatch?.[1] || null,
    metaPixel,
    hotjar,
    clarity,
    detected,
  };
}
