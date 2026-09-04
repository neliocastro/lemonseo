import type { AnalyticsResult } from "../types";

const SIGNATURES: { key: keyof Omit<AnalyticsResult, "detected">; label: string; test: RegExp }[] = [
  { key: "ga4", label: "Google Analytics 4", test: /gtag\(['"]config['"],\s*['"]G-/i },
  { key: "gtm", label: "Google Tag Manager", test: /googletagmanager\.com\/gtm\.js|GTM-[A-Z0-9]+/i },
  { key: "metaPixel", label: "Meta Pixel (Facebook)", test: /fbq\(['"]init['"]/i },
  { key: "hotjar", label: "Hotjar", test: /static\.hotjar\.com/i },
  { key: "clarity", label: "Microsoft Clarity", test: /clarity\.ms\/tag/i },
];

export function analyzeAnalytics(html: string): AnalyticsResult {
  const result: AnalyticsResult = {
    ga4: false,
    gtm: false,
    metaPixel: false,
    hotjar: false,
    clarity: false,
    detected: [],
  };

  for (const sig of SIGNATURES) {
    if (sig.test.test(html)) {
      result[sig.key] = true;
      result.detected.push(sig.label);
    }
  }

  return result;
}
