import * as cheerio from "cheerio";
import { customAlphabet } from "nanoid";
import { fetchHtml, normalizeUrl } from "./analyzers/fetchHtml";
import { analyzeSeo } from "./analyzers/seo";
import { analyzeImages } from "./analyzers/images";
import { fetchImageWeights } from "./analyzers/imageWeights";
import { analyzeMobile } from "./analyzers/mobile";
import { analyzeAnalytics } from "./analyzers/analytics";
import { analyzeKeyword } from "./analyzers/keyword";
import { analyzeSubpages } from "./analyzers/subpages";
import { analyzeSpeed } from "./analyzers/speed";
import { analyzeSiteFiles } from "./analyzers/files";
import { analyzeGeo } from "./analyzers/geo";
import { analyzeEeat } from "./analyzers/eeat";
import { analyzeSemantics } from "./analyzers/semantics";
import { analyzeHeadResources } from "./analyzers/headResources";
import { analyzeCms } from "./analyzers/cms";
import { buildCategories, buildOverallScore, buildProblems, classifySpeed } from "./scoring";
import type { AnalysisReport } from "./types";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);

export async function runAnalysis(rawUrl: string, rawKeyword: string | null): Promise<AnalysisReport> {
  const url = normalizeUrl(rawUrl);
  const fetchResult = await fetchHtml(url);
  const { html, finalUrl, loadTimeMs, ttfbMs, pageSizeBytes, gzipEnabled, server, headers } = fetchResult;
  const $ = cheerio.load(html);

  const seoRaw = analyzeSeo($, finalUrl);
  const imagesRaw = analyzeImages($, finalUrl);
  const mobile = analyzeMobile($, html);
  const analytics = analyzeAnalytics(html);
  const keywordResult = analyzeKeyword($, finalUrl, rawKeyword);
  const bodyText = $("body").text();
  const eeat = analyzeEeat($, bodyText);
  const semantics = analyzeSemantics($);
  const headResources = analyzeHeadResources($);
  const cms = analyzeCms(html, headers);

  const [subpages, speedInfo, files, imagesWithWeights] = await Promise.all([
    analyzeSubpages($, finalUrl),
    analyzeSpeed(finalUrl, loadTimeMs),
    analyzeSiteFiles(finalUrl),
    fetchImageWeights(imagesRaw.entries),
  ]);

  const geo = analyzeGeo($, files);

  const seo = {
    ...seoRaw,
    sitemapFound: files.sitemapFound,
    robotsFound: files.robotsFound,
    rssFeedFound: headResources.rssFeedFound,
  };

  const images = { ...imagesRaw, entries: imagesWithWeights };

  const speed = {
    ttfbMs,
    pageSizeBytes,
    gzipEnabled,
    server,
    classification: classifySpeed(loadTimeMs),
    renderBlockingScripts: headResources.renderBlockingScripts,
    renderBlockingStyles: headResources.renderBlockingStyles,
    ...speedInfo,
  };

  const categories = buildCategories({ seo, images, mobile, speed, subpages, analytics, keywordResult, geo, eeat });
  const overallScore = buildOverallScore(categories);
  const problems = buildProblems({ seo, images, mobile, speed, subpages, analytics, keywordResult, geo, eeat, cms });

  const slug = nanoid();

  return {
    slug,
    url,
    finalUrl,
    keyword: rawKeyword,
    createdAt: new Date().toISOString(),
    overallScore,
    categories,
    problems,
    seo,
    images,
    mobile,
    speed,
    subpages,
    analytics,
    keywordResult,
    geo,
    eeat,
    semantics,
    cms,
  };
}
