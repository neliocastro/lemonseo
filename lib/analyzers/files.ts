const REQUEST_TIMEOUT = 6000;

async function checkFile(baseUrl: string, path: string): Promise<{ found: boolean; content: string | null }> {
  try {
    const url = new URL(path, baseUrl).toString();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LemonSEOBot/1.0)" },
    });
    clearTimeout(timer);
    if (!res.ok) return { found: false, content: null };
    const content = await res.text();
    return { found: true, content };
  } catch {
    return { found: false, content: null };
  }
}

export interface SiteFilesResult {
  sitemapFound: boolean;
  robotsFound: boolean;
  robotsContent: string | null;
  llmsTxtFound: boolean;
  llmsFullTxtFound: boolean;
  /** robots.txt bloqueia explicitamente crawlers de IA (GPTBot, Google-Extended, CCBot etc.) */
  aiCrawlersBlocked: boolean;
  /** robots.txt referencia um sitemap via "Sitemap:" */
  sitemapReferencedInRobots: boolean;
}

const AI_BOT_NAMES = ["GPTBot", "Google-Extended", "CCBot", "ClaudeBot", "anthropic-ai", "PerplexityBot"];

export async function analyzeSiteFiles(baseUrl: string): Promise<SiteFilesResult> {
  const [sitemap, robots, llms, llmsFull] = await Promise.all([
    checkFile(baseUrl, "/sitemap.xml"),
    checkFile(baseUrl, "/robots.txt"),
    checkFile(baseUrl, "/llms.txt"),
    checkFile(baseUrl, "/llms-full.txt"),
  ]);

  let aiCrawlersBlocked = false;
  let sitemapReferencedInRobots = false;

  if (robots.content) {
    const lines = robots.content.split("\n").map((l) => l.trim());
    let currentAgentIsAiBot = false;
    for (const line of lines) {
      const uaMatch = line.match(/^user-agent:\s*(.+)$/i);
      if (uaMatch) {
        currentAgentIsAiBot = AI_BOT_NAMES.some((bot) => bot.toLowerCase() === uaMatch[1].trim().toLowerCase());
        continue;
      }
      if (currentAgentIsAiBot && /^disallow:\s*\/\s*$/i.test(line)) {
        aiCrawlersBlocked = true;
      }
      if (/^sitemap:/i.test(line)) {
        sitemapReferencedInRobots = true;
      }
    }
  }

  return {
    sitemapFound: sitemap.found,
    robotsFound: robots.found,
    robotsContent: robots.content,
    llmsTxtFound: llms.found,
    llmsFullTxtFound: llmsFull.found,
    aiCrawlersBlocked,
    sitemapReferencedInRobots,
  };
}
