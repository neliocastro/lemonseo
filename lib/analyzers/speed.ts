interface SpeedResult {
  loadTimeMs: number;
  source: "pagespeed" | "fetch-timing";
  lcp?: number;
  cls?: number;
  performanceScore?: number; // 0-100 from PSI's lighthouse score, if available
}

interface PsiLighthouseAudit {
  numericValue?: number;
}

interface PsiResponse {
  lighthouseResult?: {
    categories?: { performance?: { score?: number } };
    audits?: Record<string, PsiLighthouseAudit>;
  };
}

export async function analyzeSpeed(url: string, fallbackLoadTimeMs: number): Promise<SpeedResult> {
  const apiKey = process.env.PAGESPEED_API_KEY;
  if (!apiKey) {
    return { loadTimeMs: fallbackLoadTimeMs, source: "fetch-timing" };
  }

  try {
    const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
    endpoint.searchParams.set("url", url);
    endpoint.searchParams.set("key", apiKey);
    endpoint.searchParams.set("strategy", "mobile");
    endpoint.searchParams.set("category", "performance");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(endpoint.toString(), { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) {
      const body = await res.text();
      console.error("[speed] PageSpeed API error", res.status, body.slice(0, 500));
      return { loadTimeMs: fallbackLoadTimeMs, source: "fetch-timing" };
    }

    const data: PsiResponse = await res.json();
    const perfScore = data.lighthouseResult?.categories?.performance?.score;
    const lcp = data.lighthouseResult?.audits?.["largest-contentful-paint"]?.numericValue;
    const cls = data.lighthouseResult?.audits?.["cumulative-layout-shift"]?.numericValue;

    return {
      loadTimeMs: lcp ?? fallbackLoadTimeMs,
      source: "pagespeed",
      lcp,
      cls,
      performanceScore: perfScore != null ? Math.round(perfScore * 100) : undefined,
    };
  } catch (err) {
    console.error("[speed] PageSpeed fetch failed", err);
    return { loadTimeMs: fallbackLoadTimeMs, source: "fetch-timing" };
  }
}
