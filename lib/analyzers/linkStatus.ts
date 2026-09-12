import { mapWithConcurrency } from "../concurrency";
import type { CrawledLink } from "./linkCrawler";

export type LinkStatusCategory =
  | "ok"
  | "redirect"
  | "not_found"
  | "server_error"
  | "timeout"
  | "other_error";

export interface CheckedLink extends CrawledLink {
  statusCode: number | null;
  category: LinkStatusCategory;
  errorMessage?: string;
}

const PER_REQUEST_TIMEOUT = 6000;
// Mesmo cuidado do rastreador de subpáginas: não disparar tudo de uma vez.
const CONCURRENCY = 6;
const REQUEST_HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; LemonSEOBot/1.0)" };

function categorize(status: number | null): LinkStatusCategory {
  if (status === null) return "other_error";
  if (status === 404) return "not_found";
  if (status >= 500) return "server_error";
  if (status >= 300 && status < 400) return "redirect";
  if (status >= 200 && status < 300) return "ok";
  return "other_error";
}

async function fetchStatus(
  url: string,
  method: "HEAD" | "GET"
): Promise<{ status: number } | { status: null; timedOut: boolean; errorMessage: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PER_REQUEST_TIMEOUT);
  try {
    const res = await fetch(url, {
      method,
      // Manual (não "follow") para conseguir observar o status 3xx real e
      // classificar como "redirecionamento" em vez de mascará-lo com o
      // status final da cadeia de redirects.
      redirect: "manual",
      signal: controller.signal,
      headers: REQUEST_HEADERS,
    });
    return { status: res.status };
  } catch (err) {
    const timedOut = err instanceof Error && err.name === "AbortError";
    return {
      status: null,
      timedOut,
      errorMessage: err instanceof Error ? err.message : "Erro desconhecido",
    };
  } finally {
    clearTimeout(timer);
  }
}

async function checkOneLink(link: CrawledLink): Promise<CheckedLink> {
  // Alguns servidores recusam HEAD (405/501); nesse caso tentamos GET.
  let result = await fetchStatus(link.href, "HEAD");
  if (result.status === null || result.status === 405 || result.status === 501) {
    result = await fetchStatus(link.href, "GET");
  }

  if (result.status !== null) {
    return { ...link, statusCode: result.status, category: categorize(result.status) };
  }

  return {
    ...link,
    statusCode: null,
    category: result.timedOut ? "timeout" : "other_error",
    errorMessage: result.errorMessage,
  };
}

/**
 * Faz HEAD (com fallback para GET) em cada link mapeado pelo crawler e
 * classifica por código de resposta — base para o relatório de links
 * quebrados no painel admin.
 */
export async function checkLinksStatus(links: CrawledLink[]): Promise<CheckedLink[]> {
  return mapWithConcurrency(links, CONCURRENCY, checkOneLink);
}
