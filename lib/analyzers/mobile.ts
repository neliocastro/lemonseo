import * as cheerio from "cheerio";

const FRAMEWORK_SIGNATURES: { name: string; test: RegExp }[] = [
  { name: "Bootstrap", test: /bootstrap(\.min)?\.css|class="[^"]*\bcontainer(-fluid)?\b[^"]*\brow\b/i },
  { name: "Tailwind CSS", test: /tailwind|class="[^"]*\b(flex|grid)\b[^"]*\b(sm:|md:|lg:)/i },
  { name: "Bulma", test: /bulma(\.min)?\.css/i },
  { name: "Foundation", test: /foundation(\.min)?\.css/i },
];

export function analyzeMobile($: cheerio.CheerioAPI, html: string) {
  const viewport = $('meta[name="viewport"]').attr("content") || null;
  const hasViewport = Boolean(viewport && viewport.includes("width=device-width"));
  const zoomAllowed = !viewport || !/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(\.0)?(?!\d)/i.test(viewport);

  let mediaQueriesCount = 0;
  $("style").each((_, el) => {
    const css = $(el).html() || "";
    mediaQueriesCount += (css.match(/@media/gi) || []).length;
  });

  const framework = FRAMEWORK_SIGNATURES.find((f) => f.test.test(html))?.name || null;

  const images = $("img");
  let responsiveImages = 0;
  let lazyImages = 0;
  images.each((_, el) => {
    if ($(el).attr("srcset")) responsiveImages += 1;
    if ($(el).attr("loading") === "lazy") lazyImages += 1;
  });

  return {
    hasViewport,
    viewportContent: viewport,
    zoomAllowed,
    mediaQueriesCount,
    frameworkDetected: framework,
    responsiveImagesPct: images.length > 0 ? Math.round((responsiveImages / images.length) * 100) : 0,
    lazyImagesCount: lazyImages,
    totalImages: images.length,
  };
}
