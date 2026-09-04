export type Severity = "alto" | "medio" | "baixo";

export interface Problem {
  categoria: string;
  titulo: string;
  impacto: string;
  severidade: Severity;
}

export interface CategoryScore {
  key: string;
  label: string;
  icon: string;
  score: number; // 0-10
  detail: string;
}

export interface SubpageResult {
  url: string;
  status: number | null;
  title: string | null;
  ok: boolean;
}

export interface AnalyticsResult {
  ga4: boolean;
  gtm: boolean;
  metaPixel: boolean;
  hotjar: boolean;
  clarity: boolean;
  detected: string[];
}

export interface KeywordResult {
  keyword: string;
  inTitle: boolean;
  inH1: boolean;
  inMetaDescription: boolean;
  inUrl: boolean;
  occurrences: number;
}

export interface AnalysisReport {
  slug: string;
  url: string;
  finalUrl: string;
  keyword: string | null;
  createdAt: string;
  overallScore: number;
  categories: CategoryScore[];
  problems: Problem[];
  seo: {
    title: string | null;
    titleLength: number;
    metaDescription: string | null;
    metaDescriptionLength: number;
    h1Count: number;
    h1Text: string | null;
    canonical: string | null;
    robotsMeta: string | null;
    lang: string | null;
    hasOpenGraph: boolean;
  };
  images: {
    total: number;
    withoutAlt: number;
    modernFormat: number;
    legacyFormat: number;
  };
  mobile: {
    hasViewport: boolean;
    viewportContent: string | null;
  };
  speed: {
    loadTimeMs: number;
    source: "pagespeed" | "fetch-timing";
    lcp?: number;
    cls?: number;
  };
  subpages: SubpageResult[];
  analytics: AnalyticsResult;
  keywordResult: KeywordResult | null;
  error?: string;
}
