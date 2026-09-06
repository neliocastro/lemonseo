import type * as cheerio from "cheerio";

export interface HeadResourcesResult {
  renderBlockingScripts: number;
  renderBlockingStyles: number;
  rssFeedFound: boolean;
}

export function analyzeHeadResources($: cheerio.CheerioAPI): HeadResourcesResult {
  const head = $("head");

  let renderBlockingScripts = 0;
  head.find("script[src]").each((_, el) => {
    const $el = $(el);
    const hasDefer = $el.attr("defer") !== undefined;
    const hasAsync = $el.attr("async") !== undefined;
    const isModule = $el.attr("type") === "module";
    if (!hasDefer && !hasAsync && !isModule) renderBlockingScripts += 1;
  });

  let renderBlockingStyles = 0;
  head.find('link[rel="stylesheet"]').each((_, el) => {
    const media = $(el).attr("media");
    if (!media || media === "all" || media === "screen") renderBlockingStyles += 1;
  });

  const rssFeedFound =
    head.find('link[type="application/rss+xml"], link[type="application/atom+xml"]').length > 0;

  return { renderBlockingScripts, renderBlockingStyles, rssFeedFound };
}
