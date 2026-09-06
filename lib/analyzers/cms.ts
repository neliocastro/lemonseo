const CACHE_PLUGIN_SIGNATURES = [
  /wp-rocket/i,
  /w3-total-cache|w3tc/i,
  /wp-super-cache/i,
  /wp-fastest-cache/i,
  /litespeed cache/i,
  /cached on \d/i, // comentário comum de plugins de cache no fim do HTML
];

export interface CmsResult {
  cms: "WordPress" | null;
  cacheDetected: boolean;
}

export function analyzeCms(html: string, headers: Headers): CmsResult {
  const isWordPress =
    /<meta name="generator" content="WordPress/i.test(html) ||
    /wp-content\/|wp-includes\//i.test(html) ||
    /\/wp-json\//i.test(html);

  if (!isWordPress) return { cms: null, cacheDetected: false };

  const cacheHeader = headers.get("x-cache") || headers.get("x-cache-enabled") || headers.get("cf-cache-status");
  const cacheDetected = Boolean(cacheHeader) || CACHE_PLUGIN_SIGNATURES.some((re) => re.test(html));

  return { cms: "WordPress", cacheDetected };
}
