export interface FetchResult {
  html: string;
  finalUrl: string;
  status: number;
  loadTimeMs: number;
}

export function normalizeUrl(input: string): string {
  let url = input.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return url;
}

export async function fetchHtml(rawUrl: string, timeoutMs = 12000): Promise<FetchResult> {
  const url = normalizeUrl(rawUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; LemonSEOBot/1.0; +https://lemonseo.example/bot)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    const loadTimeMs = Date.now() - start;
    const html = await res.text();
    return {
      html,
      finalUrl: res.url || url,
      status: res.status,
      loadTimeMs,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    throw new Error(
      message.includes("abort")
        ? `Tempo limite excedido ao tentar acessar ${url}`
        : `Não foi possível acessar ${url}: ${message}`
    );
  } finally {
    clearTimeout(timer);
  }
}
