import * as cheerio from "cheerio";
import { customAlphabet } from "nanoid";
import { fetchHtml, normalizeUrl } from "./analyzers/fetchHtml";
import { analyzeSeo } from "./analyzers/seo";
import { analyzeImages } from "./analyzers/images";
import { analyzeMobile } from "./analyzers/mobile";
import { analyzeAnalytics } from "./analyzers/analytics";
import { analyzeKeyword } from "./analyzers/keyword";
import { analyzeSubpages } from "./analyzers/subpages";
import { analyzeSpeed } from "./analyzers/speed";
import { buildCategories, buildOverallScore, buildProblems } from "./scoring";
import type { AnalysisReport } from "./types";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);

export async function runAnalysis(rawUrl: string, rawKeyword: string | null): Promise<AnalysisReport> {
  const url = normalizeUrl(rawUrl);
  const { html, finalUrl, loadTimeMs } = await fetchHtml(url);
  const $ = cheerio.load(html);

  const seo = analyzeSeo($);
  const images = analyzeImages($);
  const mobile = analyzeMobile($);
  const analytics = analyzeAnalytics(html);
  const keywordResult = analyzeKeyword($, finalUrl, rawKeyword);
  const [subpages, speed] = await Promise.all([
    analyzeSubpages($, finalUrl),
    analyzeSpeed(finalUrl, loadTimeMs),
  ]);

  const categories = buildCategories({ seo, images, mobile, speed, subpages, analytics, keywordResult });
  const overallScore = buildOverallScore(categories);
  const problems = buildProblems({ seo, images, mobile, speed, subpages, analytics, keywordResult });

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
  };
}
