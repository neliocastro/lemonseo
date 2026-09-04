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
  /** Rótulo curto derivado da URL, usado para identificar a página nos problemas (ex: "rede-vida"). */
  label: string;
  seo?: {
    titleLength: number;
    metaDescription: string | null;
    metaDescriptionLength: number;
    h1Count: number;
    hasViewport: boolean;
    imagesTotal: number;
    imagesWithoutAlt: number;
  };
}

export interface AnalyticsResult {
  ga4: boolean;
  ga4Id: string | null;
  universalAnalytics: boolean;
  gtm: boolean;
  gtmId: string | null;
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
  density: number;
  inFirstParagraph: boolean;
  inSubheadings: boolean;
}

export interface GeoData {
  crawlersOpen: boolean;
  llmsTxtFound: boolean;
  llmsFullTxtFound: boolean;
  schemaTypes: string[];
  hasSemanticHtml: boolean;
  semanticTagsFound: string[];
  hasDirectAnswerPatterns: boolean;
  listCount: number;
  tableCount: number;
  sitemapReferencedInRobots: boolean;
}

export interface EeatData {
  cnpjFound: boolean;
  cnpjValue: string | null;
  faqFound: boolean;
  testimonialsFound: boolean;
  aboutPageFound: boolean;
  aboutPageUrl: string | null;
  privacyPolicyFound: boolean;
  privacyPolicyUrl: string | null;
  contactFound: boolean;
}

export interface SemanticsData {
  totalWords: number;
  paragraphCount: number;
  avgCharsPerParagraph: number;
  readability: "Boa" | "Média" | "Difícil";
  topWords: { word: string; count: number; pct: number }[];
}

export interface ImageEntryResult {
  src: string;
  alt: string | null;
  format: string;
  hasAlt: boolean;
  weightBytes: number | null;
  ok: boolean;
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
    h2Count: number;
    h3Count: number;
    h1Text: string | null;
    canonical: string | null;
    robotsMeta: string | null;
    lang: string | null;
    hasOpenGraph: boolean;
    internalLinks: number;
    externalLinks: number;
    genericAnchors: number;
    sitemapFound: boolean;
    robotsFound: boolean;
  };
  images: {
    total: number;
    withoutAlt: number;
    modernFormat: number;
    legacyFormat: number;
    entries: ImageEntryResult[];
  };
  mobile: {
    hasViewport: boolean;
    viewportContent: string | null;
    zoomAllowed: boolean;
    mediaQueriesCount: number;
    frameworkDetected: string | null;
    responsiveImagesPct: number;
    lazyImagesCount: number;
    totalImages: number;
  };
  speed: {
    loadTimeMs: number;
    ttfbMs: number;
    pageSizeBytes: number;
    gzipEnabled: boolean;
    server: string | null;
    classification: "Excelente" | "Bom" | "Regular" | "Lento";
    source: "pagespeed" | "fetch-timing";
    lcp?: number;
    cls?: number;
    performanceScore?: number;
  };
  subpages: SubpageResult[];
  analytics: AnalyticsResult;
  keywordResult: KeywordResult | null;
  geo: GeoData;
  eeat: EeatData;
  semantics: SemanticsData;
  error?: string;
}
