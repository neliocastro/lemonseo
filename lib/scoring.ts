import type {
  AnalysisReport,
  AnalyticsResult,
  CategoryScore,
  EeatData,
  GeoData,
  KeywordResult,
  Problem,
} from "./types";

function clamp10(n: number): number {
  return Math.max(0, Math.min(10, Math.round(n * 10) / 10));
}

export function classifySpeed(loadTimeMs: number): "Excelente" | "Bom" | "Regular" | "Lento" {
  const s = loadTimeMs / 1000;
  if (s < 1.5) return "Excelente";
  if (s < 2.5) return "Bom";
  if (s < 4.5) return "Regular";
  return "Lento";
}

interface ScoringInput {
  seo: AnalysisReport["seo"];
  images: AnalysisReport["images"];
  mobile: AnalysisReport["mobile"];
  speed: AnalysisReport["speed"];
  subpages: AnalysisReport["subpages"];
  analytics: AnalyticsResult;
  keywordResult: KeywordResult | null;
  geo: GeoData;
  eeat: EeatData;
}

function scoreSpeed(speed: ScoringInput["speed"]): { score: number; detail: string } {
  if (speed.source === "pagespeed" && speed.performanceScore != null) {
    return {
      score: clamp10(speed.performanceScore / 10),
      detail: `${(speed.lcp ? speed.lcp / 1000 : 0).toFixed(1)}s (LCP)`,
    };
  }
  const seconds = speed.loadTimeMs / 1000;
  let score = 10;
  if (seconds > 1) score = 9;
  if (seconds > 2) score = 7;
  if (seconds > 2.5) score = 5.5;
  if (seconds > 4) score = 3.5;
  if (seconds > 6) score = 2;
  return { score: clamp10(score), detail: `${seconds.toFixed(1)}s para responder` };
}

function scoreSeo(seo: ScoringInput["seo"]): { score: number; detail: string } {
  let score = 10;
  if (!seo.title) score -= 3;
  else if (seo.titleLength < 30 || seo.titleLength > 65) score -= 1.5;
  if (!seo.metaDescription) score -= 2.5;
  else if (seo.metaDescriptionLength < 70 || seo.metaDescriptionLength > 160) score -= 1;
  if (seo.h1Count === 0) score -= 2;
  if (seo.h1Count > 1) score -= 0.5;
  if (!seo.canonical) score -= 0.5;
  if (!seo.hasOpenGraph) score -= 0.5;
  return { score: clamp10(score), detail: seo.title ? "Meta tags verificadas" : "Sem título definido" };
}

function scoreImages(images: ScoringInput["images"]): { score: number; detail: string } {
  if (images.total === 0) return { score: 10, detail: "Nenhuma imagem encontrada" };
  const altRatio = 1 - images.withoutAlt / images.total;
  const modernRatio =
    images.modernFormat + images.legacyFormat > 0
      ? images.modernFormat / (images.modernFormat + images.legacyFormat)
      : 1;
  const score = altRatio * 6 + modernRatio * 4;
  return { score: clamp10(score), detail: `${images.total} imagem(ns)` };
}

function scoreMobile(mobile: ScoringInput["mobile"]): { score: number; detail: string } {
  return {
    score: mobile.hasViewport ? 10 : 3,
    detail: mobile.hasViewport ? "Viewport responsivo configurado" : "Sem meta viewport",
  };
}

function scoreSubpages(subpages: ScoringInput["subpages"]): { score: number; detail: string } {
  if (subpages.length === 0) return { score: 6, detail: "Nenhuma subpágina encontrada" };
  const okRatio = subpages.filter((p) => p.ok).length / subpages.length;
  return { score: clamp10(okRatio * 10), detail: `${subpages.length} subpágina(s) verificada(s)` };
}

function scoreAnalytics(analytics: AnalyticsResult): { score: number; detail: string } {
  const count = analytics.detected.length;
  const score = count === 0 ? 2 : Math.min(10, 6 + count * 2);
  return {
    score: clamp10(score),
    detail: count > 0 ? analytics.detected.join(", ") : "Nenhum tracker detectado",
  };
}

function scoreGeo(geo: GeoData): { score: number; detail: string } {
  const checks = [
    geo.crawlersOpen,
    geo.llmsTxtFound,
    geo.llmsFullTxtFound,
    geo.hasSemanticHtml,
    geo.hasDirectAnswerPatterns,
    geo.sitemapReferencedInRobots,
  ];
  const passed = checks.filter(Boolean).length;
  return {
    score: clamp10((passed / checks.length) * 10),
    detail: geo.crawlersOpen ? `${passed}/${checks.length} sinais de IA ok` : "Crawlers de IA bloqueados",
  };
}

function scoreEeat(eeat: EeatData): { score: number; detail: string } {
  const checks = [
    eeat.cnpjFound,
    eeat.faqFound,
    eeat.testimonialsFound,
    eeat.aboutPageFound,
    eeat.privacyPolicyFound,
    eeat.contactFound,
  ];
  const passed = checks.filter(Boolean).length;
  return {
    score: clamp10((passed / checks.length) * 10),
    detail: `${passed}/${checks.length} sinais de confiança`,
  };
}

export function buildCategories(input: ScoringInput): CategoryScore[] {
  const speed = scoreSpeed(input.speed);
  const seo = scoreSeo(input.seo);
  const images = scoreImages(input.images);
  const mobile = scoreMobile(input.mobile);
  const subpages = scoreSubpages(input.subpages);
  const analytics = scoreAnalytics(input.analytics);
  const geo = scoreGeo(input.geo);
  const eeat = scoreEeat(input.eeat);

  return [
    { key: "velocidade", label: "Velocidade", icon: "⚡", score: speed.score, detail: speed.detail },
    { key: "seo", label: "SEO", icon: "🔍", score: seo.score, detail: seo.detail },
    { key: "mobile", label: "Mobile", icon: "📱", score: mobile.score, detail: mobile.detail },
    { key: "imagens", label: "Imagens", icon: "🖼️", score: images.score, detail: images.detail },
    { key: "geo", label: "GEO", icon: "🤖", score: geo.score, detail: geo.detail },
    { key: "eeat", label: "E-E-A-T", icon: "⭐", score: eeat.score, detail: eeat.detail },
    { key: "subpaginas", label: "Subpáginas", icon: "📑", score: subpages.score, detail: subpages.detail },
    { key: "analytics", label: "Analytics", icon: "📊", score: analytics.score, detail: analytics.detail },
  ];
}

const WEIGHTS: Record<string, number> = {
  velocidade: 0.2,
  seo: 0.2,
  mobile: 0.1,
  imagens: 0.1,
  geo: 0.1,
  eeat: 0.1,
  subpaginas: 0.1,
  analytics: 0.1,
};

export function buildOverallScore(categories: CategoryScore[]): number {
  const total = categories.reduce((sum, c) => sum + c.score * (WEIGHTS[c.key] ?? 0), 0);
  return clamp10(total);
}

export function buildProblems(input: ScoringInput): Problem[] {
  const problems: Problem[] = [];
  const { seo, images, mobile, speed, analytics, subpages, keywordResult, geo, eeat } = input;

  const seconds = speed.loadTimeMs / 1000;
  if (seconds > 2.5) {
    problems.push({
      categoria: "Velocidade",
      titulo: `Tempo de carregamento lento (${seconds.toFixed(1)}s)`,
      impacto:
        "Sites que demoram mais de 2,5s tendem a perder posições no Google e visitantes desistem de esperar.",
      severidade: seconds > 4 ? "alto" : "medio",
    });
  }

  if (!seo.title) {
    problems.push({
      categoria: "SEO",
      titulo: "Página sem meta title",
      impacto: "Sem título, o Google decide sozinho o que mostrar no resultado de busca — geralmente pior que um título bem escrito.",
      severidade: "alto",
    });
  } else if (seo.titleLength < 30 || seo.titleLength > 65) {
    problems.push({
      categoria: "SEO",
      titulo: `Meta title com tamanho inadequado (${seo.titleLength} caracteres — ideal entre 50 e 60)`,
      impacto: "Títulos fora da medida ideal são cortados no Google, escondendo parte da mensagem.",
      severidade: "medio",
    });
  }

  if (!seo.metaDescription) {
    problems.push({
      categoria: "SEO",
      titulo: "Página sem meta description",
      impacto: "Sem descrição, o Google exibe um trecho aleatório da página, reduzindo a taxa de cliques.",
      severidade: "alto",
    });
  }

  if (seo.h1Count === 0) {
    problems.push({
      categoria: "SEO",
      titulo: "Página sem H1",
      impacto: "O H1 ajuda o Google a entender o assunto principal da página. Sem ele, a relevância cai.",
      severidade: "alto",
    });
  } else if (seo.h1Count > 1) {
    problems.push({
      categoria: "SEO",
      titulo: `Mais de um H1 na página (${seo.h1Count})`,
      impacto: "Vários H1 confundem a hierarquia de conteúdo para buscadores.",
      severidade: "baixo",
    });
  }

  if (!mobile.hasViewport) {
    problems.push({
      categoria: "Mobile",
      titulo: "Sem meta viewport configurada",
      impacto: "Sem essa tag, o site pode aparecer quebrado ou minúsculo em celulares — maioria do tráfego hoje.",
      severidade: "alto",
    });
  }

  if (images.total > 0 && images.withoutAlt > 0) {
    problems.push({
      categoria: "Imagens",
      titulo: `${images.withoutAlt} imagem(ns) sem texto alternativo (alt)`,
      impacto: "O atributo alt ajuda o Google e leitores de tela a entender o conteúdo visual — impacta SEO e acessibilidade.",
      severidade: images.withoutAlt / images.total > 0.5 ? "alto" : "medio",
    });
  }

  if (images.legacyFormat > images.modernFormat && images.legacyFormat > 2) {
    problems.push({
      categoria: "Imagens",
      titulo: `${images.legacyFormat} imagem(ns) em formato antigo (JPG/PNG)`,
      impacto: "Formatos modernos como WebP/AVIF pesam bem menos e aceleram o carregamento da página.",
      severidade: "medio",
    });
  }

  if (analytics.detected.length === 0) {
    problems.push({
      categoria: "Analytics",
      titulo: "Nenhuma ferramenta de analytics detectada",
      impacto: "Sem Google Analytics ou tag manager instalado, não é possível medir tráfego, origem de visitas nem conversões.",
      severidade: "medio",
    });
  }

  const brokenSubpages = subpages.filter((p) => !p.ok);
  if (brokenSubpages.length > 0) {
    problems.push({
      categoria: "Subpáginas",
      titulo: `${brokenSubpages.length} subpágina(s) com problema de acesso`,
      impacto: "Links quebrados prejudicam a experiência do usuário e a forma como o Google rastreia o site.",
      severidade: brokenSubpages.length > 2 ? "alto" : "medio",
    });
  }

  for (const page of subpages) {
    if (!page.ok || !page.seo) continue;
    const s = page.seo;

    if (!page.title) {
      problems.push({
        categoria: "SEO",
        titulo: `Página sem meta title (na página: ${page.label})`,
        impacto: "Sem título, o Google decide sozinho o que mostrar no resultado de busca dessa página.",
        severidade: "alto",
      });
    } else if (s.titleLength < 30 || s.titleLength > 65) {
      problems.push({
        categoria: "SEO",
        titulo: `Título com tamanho inadequado (${s.titleLength} caracteres) na página: ${page.label}`,
        impacto: "Títulos fora da medida ideal são cortados nos resultados de busca do Google.",
        severidade: "medio",
      });
    }

    if (!s.metaDescription) {
      problems.push({
        categoria: "SEO",
        titulo: `Sem meta description (na página: ${page.label})`,
        impacto: "Sem descrição, o Google exibe um trecho aleatório da página, reduzindo a taxa de cliques.",
        severidade: "medio",
      });
    } else if (s.metaDescriptionLength < 70 || s.metaDescriptionLength > 160) {
      problems.push({
        categoria: "SEO",
        titulo: `Meta description com tamanho inadequado (${s.metaDescriptionLength} caracteres) na página: ${page.label}`,
        impacto: "Descrições fora da medida ideal são cortadas ou desperdiçam espaço no resultado de busca.",
        severidade: "baixo",
      });
    }

    if (s.h1Count === 0) {
      problems.push({
        categoria: "SEO",
        titulo: `Página sem H1 (na página: ${page.label})`,
        impacto: "O H1 ajuda o Google a entender o assunto principal dessa página.",
        severidade: "medio",
      });
    } else if (s.h1Count > 1) {
      problems.push({
        categoria: "SEO",
        titulo: `Múltiplos H1 (${s.h1Count}) na página: ${page.label}`,
        impacto: "Vários H1 confundem a hierarquia de conteúdo para os buscadores nessa página.",
        severidade: "baixo",
      });
    }

    if (!s.hasViewport) {
      problems.push({
        categoria: "Mobile",
        titulo: `Sem meta viewport (na página: ${page.label})`,
        impacto: "Essa página pode aparecer quebrada ou minúscula em celulares.",
        severidade: "medio",
      });
    }

    if (s.imagesTotal > 0 && s.imagesWithoutAlt > 0) {
      problems.push({
        categoria: "Imagens",
        titulo: `${s.imagesWithoutAlt} imagem(ns) sem atributo ALT (na página: ${page.label})`,
        impacto: "Imagens sem alt prejudicam SEO e acessibilidade nessa página.",
        severidade: s.imagesWithoutAlt >= 5 ? "medio" : "baixo",
      });
    }
  }

  if (!geo.crawlersOpen) {
    problems.push({
      categoria: "GEO",
      titulo: "Crawlers de IA bloqueados no robots.txt",
      impacto: "Bots como GPTBot e Google-Extended não conseguem ler o site — sua marca não aparece em respostas de ChatGPT/Gemini.",
      severidade: "alto",
    });
  }
  if (!geo.llmsTxtFound) {
    problems.push({
      categoria: "GEO",
      titulo: "Arquivo /llms.txt ausente",
      impacto: "Sem esse arquivo, robôs de IA não têm um resumo estruturado do seu negócio para citar.",
      severidade: "medio",
    });
  }
  if (!geo.llmsFullTxtFound) {
    problems.push({
      categoria: "GEO",
      titulo: "Arquivo /llms-full.txt ausente",
      impacto: "Modelos de linguagem ficam sem acesso a informações mais completas sobre a empresa.",
      severidade: "baixo",
    });
  }
  if (!geo.hasSemanticHtml) {
    problems.push({
      categoria: "GEO",
      titulo: "Estrutura semântica HTML5 inadequada",
      impacto: "Poucas tags como <main>, <article>, <section> dificultam a leitura do conteúdo por IAs.",
      severidade: "medio",
    });
  }

  if (!eeat.cnpjFound) {
    problems.push({
      categoria: "E-E-A-T",
      titulo: "CNPJ da empresa não detectado no site",
      impacto: "A falta de CNPJ visível reduz a credibilidade do site perante o Google e visitantes.",
      severidade: "medio",
    });
  }
  if (!eeat.privacyPolicyFound) {
    problems.push({
      categoria: "E-E-A-T",
      titulo: "Política de privacidade não encontrada",
      impacto: "Ausência de política de privacidade pode gerar bloqueios em anúncios e desconfiança dos visitantes.",
      severidade: "medio",
    });
  }
  if (!eeat.contactFound) {
    problems.push({
      categoria: "E-E-A-T",
      titulo: "Informações de contato não encontradas",
      impacto: "Dificulta a conversão direta de usuários e reduz a confiabilidade percebida do domínio.",
      severidade: "medio",
    });
  }
  if (!eeat.testimonialsFound) {
    problems.push({
      categoria: "E-E-A-T",
      titulo: "Depoimentos ou avaliações de clientes não encontrados",
      impacto: "A ausência de prova social dificulta a construção de confiança com novos visitantes.",
      severidade: "baixo",
    });
  }
  if (!eeat.faqFound) {
    problems.push({
      categoria: "E-E-A-T",
      titulo: "Seção de perguntas frequentes (FAQ) não encontrada",
      impacto: "FAQs ajudam a esclarecer dúvidas e qualificam o conteúdo para buscas por voz e IA.",
      severidade: "baixo",
    });
  }

  if (keywordResult) {
    const misses: string[] = [];
    if (!keywordResult.inTitle) misses.push("título");
    if (!keywordResult.inH1) misses.push("H1");
    if (!keywordResult.inMetaDescription) misses.push("meta description");
    if (misses.length > 0) {
      problems.push({
        categoria: "Palavra-chave",
        titulo: `Palavra-chave "${keywordResult.keyword}" ausente em: ${misses.join(", ")}`,
        impacto: "Incluir a palavra-chave nos campos principais aumenta a chance de ranquear para esse termo.",
        severidade: misses.length >= 2 ? "alto" : "medio",
      });
    }
  }

  const order: Record<Problem["severidade"], number> = { alto: 0, medio: 1, baixo: 2 };
  return problems.sort((a, b) => order[a.severidade] - order[b.severidade]);
}
