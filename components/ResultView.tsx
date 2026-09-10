"use client";

import { useState } from "react";
import Link from "next/link";
import type { AnalysisReport, Problem, Severity, SubpageResult } from "@/lib/types";
import { ScoreRing } from "./ScoreRing";
import { ScoreBar } from "./ScoreBar";
import { StatusCard } from "./StatusCard";
import { EmailModal } from "./EmailModal";
import { WhatsAppCtaButton } from "./WhatsAppButton";
import {
  BoltIcon,
  BrainIcon,
  CalendarIcon,
  ChartIcon,
  CheckCircleIcon,
  CloseCircleIcon,
  CpuBoltIcon,
  DangerCircleIcon,
  DocumentsIcon,
  GalleryIcon,
  HashtagIcon,
  KeyIcon,
  LetterIcon,
  LightbulbIcon,
  LinkIcon,
  ListIcon,
  PrinterIcon,
  RocketIcon,
  SearchIcon,
  SmartphoneIcon,
  StarIcon,
  WarningTriangleIcon,
} from "./icons";

const SEVERITY_LABEL: Record<Severity, { icon: typeof CheckCircleIcon; color: string; label: string }> = {
  alto: { icon: DangerCircleIcon, color: "var(--lt-red)", label: "Alto impacto" },
  medio: { icon: WarningTriangleIcon, color: "var(--lt-muted)", label: "Médio impacto" },
  baixo: { icon: CheckCircleIcon, color: "var(--lt-lime)", label: "Baixo impacto" },
};

const CATEGORY_ICONS: Record<string, typeof CheckCircleIcon> = {
  velocidade: BoltIcon,
  seo: SearchIcon,
  mobile: SmartphoneIcon,
  imagens: GalleryIcon,
  geo: CpuBoltIcon,
  eeat: StarIcon,
  subpaginas: DocumentsIcon,
  analytics: ChartIcon,
};

function heroMessage(score: number): string {
  if (score >= 8) return "Muito bom! Seu site está com uma base técnica sólida.";
  if (score >= 6) return "No caminho certo, mas há pontos importantes para corrigir.";
  if (score >= 4) return "Seu site tem problemas que provavelmente afetam seu tráfego orgânico.";
  return "Seu site tem problemas críticos que estão custando visitas e clientes.";
}

function formatReportDate(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("pt-BR");
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${date} às ${time}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ProblemGroup({ severity, problems }: { severity: Severity; problems: Problem[] }) {
  if (problems.length === 0) return null;
  const meta = SEVERITY_LABEL[severity];
  return (
    <div>
      <div className="ls-problem-group-title" style={{ color: meta.color }}>
        <meta.icon size={16} style={{ verticalAlign: "-3px", marginRight: ".4rem" }} />
        {meta.label} <span style={{ opacity: 0.6, fontWeight: 400, fontSize: ".8rem" }}>({problems.length})</span>
      </div>
      {problems.map((p, i) => (
        <div className="ls-problem-item" key={i}>
          <div className="ls-problem-icon">
            <CloseCircleIcon size={16} />
          </div>
          <div>
            <div className="ls-problem-cat">{p.categoria}</div>
            <div className="ls-problem-title">{p.titulo}</div>
            <div className="ls-problem-impact">
              <LightbulbIcon size={13} style={{ verticalAlign: "-2px", marginRight: ".3rem" }} />
              {p.impacto}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Lista de problemas específicos de uma subpágina, no mesmo padrão usado em scoring.ts. */
function subpageIssues(page: SubpageResult): string[] {
  if (!page.ok) return ["Página inacessível"];
  if (!page.seo) return [];
  const s = page.seo;
  const issues: string[] = [];
  if (!page.title) issues.push("Sem meta title");
  else if (s.titleLength < 30 || s.titleLength > 65) issues.push(`Título com tamanho inadequado (${s.titleLength}c)`);
  if (!s.metaDescription) issues.push("Sem meta description");
  if (s.h1Count === 0) issues.push("Sem H1");
  else if (s.h1Count > 1) issues.push(`Múltiplos H1 (${s.h1Count})`);
  if (!s.hasViewport) issues.push("Sem meta viewport");
  if (s.imagesWithoutAlt > 0) issues.push(`${s.imagesWithoutAlt} imagem(ns) sem ALT`);
  return issues;
}

function subpageScore(page: SubpageResult): number {
  if (!page.ok) return 0;
  const issues = subpageIssues(page).length;
  return Math.max(0, 10 - issues * 1.8);
}

const TABS = [
  { key: "problemas", label: "Problemas", icon: DangerCircleIcon },
  { key: "velocidade", label: "Velocidade", icon: BoltIcon },
  { key: "seo", label: "SEO", icon: SearchIcon },
  { key: "geo", label: "GEO", icon: CpuBoltIcon },
  { key: "eeat", label: "E-E-A-T", icon: StarIcon },
  { key: "imagens", label: "Imagens", icon: GalleryIcon },
  { key: "mobile", label: "Mobile", icon: SmartphoneIcon },
  { key: "analytics", label: "Analytics", icon: ChartIcon },
  { key: "subpaginas", label: "Subpáginas", icon: DocumentsIcon },
  { key: "keyword", label: "Palavra-chave", icon: KeyIcon },
  { key: "semantica", label: "Semântica", icon: BrainIcon },
] as const;

export function ResultView({ report }: { report: AnalysisReport }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("problemas");
  const [showEmailModal, setShowEmailModal] = useState(false);

  const visibleTabs = TABS.filter((t) => t.key !== "keyword" || report.keywordResult);
  const alto = report.problems.filter((p) => p.severidade === "alto");
  const medio = report.problems.filter((p) => p.severidade === "medio");
  const baixo = report.problems.filter((p) => p.severidade === "baixo");

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(
      () => alert("Link copiado!"),
      () => prompt("Copie o link:", window.location.href)
    );
  }

  const { seo, images, mobile, speed, analytics, subpages, subpagesTotalFound, geo, eeat, semantics, keywordResult } = report;

  // Decomposição indicativa das notas exibidas nas barras de "pontuação detalhada".
  const metaTagsScore = Math.max(
    0,
    10 -
      (seo.title ? 0 : 4) -
      (seo.title && (seo.titleLength < 30 || seo.titleLength > 65) ? 1.5 : 0) -
      (seo.metaDescription ? 0 : 3) -
      (seo.metaDescription && (seo.metaDescriptionLength < 70 || seo.metaDescriptionLength > 160) ? 1 : 0) -
      (seo.hasOpenGraph ? 0 : 0.5)
  );
  const headingsScore = Math.max(0, 10 - (seo.h1Count === 0 ? 5 : seo.h1Count > 1 ? 2 : 0) - (seo.h2Count === 0 ? 2 : 0));
  const filesScore = (seo.sitemapFound ? 5 : 0) + (seo.robotsFound ? 5 : 0);
  const linksScore = Math.max(0, 10 - (seo.internalLinks === 0 ? 5 : 0) - Math.min(4, seo.genericAnchors));

  const imagesFormatScore =
    images.modernFormat + images.legacyFormat > 0
      ? (images.modernFormat / (images.modernFormat + images.legacyFormat)) * 10
      : 10;
  const imagesAltScore = images.total > 0 ? ((images.total - images.withoutAlt) / images.total) * 10 : 10;
  const weighedImages = images.entries.filter((e) => e.weightBytes != null);
  const avgImageWeight =
    weighedImages.length > 0
      ? weighedImages.reduce((s, e) => s + (e.weightBytes || 0), 0) / weighedImages.length
      : 0;
  const imagesWeightScore = avgImageWeight === 0 ? 10 : avgImageWeight < 100_000 ? 10 : avgImageWeight < 300_000 ? 6 : 3;

  return (
    <div className="ls-result-wrap" style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem" }}>
      <div className="lt-card ls-hero-card" style={{ marginBottom: "1.5rem" }}>
        <div className="ls-hero-grid">
          <ScoreRing score={report.overallScore} size={130} />

          <div className="ls-hero-main">
            <div className="ls-result-url">{report.finalUrl}</div>
            <h2 className="lt-title-sm ls-hero-headline" style={{ marginTop: ".4rem" }}>
              {alto.length > 0 && (
                <DangerCircleIcon size={22} style={{ color: "var(--lt-red)", verticalAlign: "-4px", marginRight: ".4rem" }} />
              )}
              {alto.length > 0
                ? "Atenção: identificamos falhas que podem prejudicar seu tráfego no Google e a citação do site por IAs como ChatGPT, Gemini e Copilot."
                : heroMessage(report.overallScore)}
            </h2>

            {report.problems.length > 0 && (
              <>
                <hr className="ls-hero-divider" />
                <div className="ls-hero-failures-title">Principais falhas no site</div>
                <ul className="ls-hero-failures-list">
                  {report.problems.slice(0, 6).map((p, i) => {
                    const meta = SEVERITY_LABEL[p.severidade];
                    return (
                      <li key={i}>
                        <span style={{ color: meta.color }}>
                          <meta.icon size={16} />
                        </span>
                        <span>
                          <strong>{p.categoria}:</strong> {p.titulo}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            <div className="ls-hero-meta-badges">
              <span className="ls-meta-pill">
                <CalendarIcon size={13} style={{ verticalAlign: "-2px", marginRight: ".3rem" }} />
                {formatReportDate(report.createdAt)}
              </span>
              <span className="ls-meta-pill">
                <DocumentsIcon size={13} style={{ verticalAlign: "-2px", marginRight: ".3rem" }} />
                {report.subpages.length} subpágina(s)
              </span>
              {report.keyword && (
                <span className="ls-meta-pill">
                  <KeyIcon size={13} style={{ verticalAlign: "-2px", marginRight: ".3rem" }} />
                  {report.keyword}
                </span>
              )}
            </div>

            <a href="#analise-completa" className="ls-hero-footnote ls-hero-footnote-link">
              A nota geral representa uma média dos principais fatores analisados no site. Ela
              considera, de forma conjunta, Velocidade, SEO, Mobile, Imagens, GEO, E-E-A-T,
              Subpáginas e Analytics.
            </a>
          </div>

          <div className="ls-hero-wpp-card">
            <span className="lt-eyebrow">
              <BoltIcon size={13} style={{ verticalAlign: "-2px", marginRight: ".3rem" }} />
              Diagnóstico WhatsApp
            </span>
            <h3 className="lt-title-sm" style={{ fontSize: "1.15rem", marginTop: ".5rem" }}>
              {alto.length > 0 ? "Corrija as falhas e atinja nota 10" : "Quer chegar à nota 10?"}
            </h3>
            <p className="lt-body" style={{ fontSize: ".82rem", margin: ".6rem 0 1.1rem" }}>
              Fale com nossos especialistas e solicite um orçamento sem compromisso para que
              nossa equipe realize todas as correções necessárias no seu site.
            </p>
            <WhatsAppCtaButton site={report.finalUrl} slug={report.slug} label="Falar no WhatsApp" />
          </div>
        </div>
      </div>

      <div className="ls-actions">
        <button className="lt-btn lt-btn-ghost" onClick={() => window.print()}>
          <PrinterIcon size={16} />
          Exportar PDF
        </button>
        <button className="lt-btn lt-btn-ghost" onClick={() => setShowEmailModal(true)}>
          <LetterIcon size={16} />
          Receber por e-mail
        </button>
        <button className="lt-btn lt-btn-ghost" onClick={copyLink}>
          <LinkIcon size={16} />
          Compartilhar
        </button>
        <Link href="/" className="lt-btn lt-btn-ghost">
          <SearchIcon size={16} />
          Analisar outro site
        </Link>
      </div>

      <div className="ls-metric-grid">
        {report.categories.map((c) => {
          const CategoryIcon = CATEGORY_ICONS[c.key] ?? ChartIcon;
          return (
            <div className="lt-card ls-metric-card" key={c.key}>
              <div className="ls-metric-icon">
                <CategoryIcon size={22} />
              </div>
              <div className="ls-metric-label">{c.label}</div>
              <ScoreRing score={c.score} size={68} />
              <div className="ls-metric-detail">{c.detail}</div>
            </div>
          );
        })}
      </div>

      <nav className="ls-tabs-nav">
        {visibleTabs.map((t) => (
          <button
            key={t.key}
            className={`ls-tab-btn ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "problemas" && (
        <div>
          <p className="lt-body" style={{ marginBottom: "1rem" }}>
            <ListIcon size={14} style={{ verticalAlign: "-2px", marginRight: ".3rem" }} />
            Listamos todos os problemas encontrados, do mais crítico ao menos urgente. Os de{" "}
            <strong style={{ color: "var(--lt-text)" }}>alto impacto</strong> afetam diretamente o
            Google — comece por eles.
          </p>
          <div className="ls-problem-counters">
            <span className="lt-badge alert">
              <DangerCircleIcon size={13} style={{ verticalAlign: "-2px", marginRight: ".3rem" }} />
              {alto.length} alto impacto
            </span>
            <span className="lt-badge">
              <WarningTriangleIcon size={13} style={{ verticalAlign: "-2px", marginRight: ".3rem" }} />
              {medio.length} médio impacto
            </span>
            <span className="lt-badge">
              <CheckCircleIcon size={13} style={{ verticalAlign: "-2px", marginRight: ".3rem" }} />
              {baixo.length} baixo impacto
            </span>
          </div>
          {report.problems.length === 0 ? (
            <p className="lt-body">
              <CheckCircleIcon size={16} style={{ color: "var(--lt-lime)", verticalAlign: "-3px", marginRight: ".4rem" }} />
              Nenhum problema relevante encontrado.
            </p>
          ) : (
            <>
              <ProblemGroup severity="alto" problems={alto} />
              <ProblemGroup severity="medio" problems={medio} />
              <ProblemGroup severity="baixo" problems={baixo} />
            </>
          )}

          {report.problems.length > 0 && (
            <div className="lt-card accent" style={{ marginTop: "2rem" }}>
              <h3>
                <CheckCircleIcon size={18} style={{ verticalAlign: "-3px", marginRight: ".4rem" }} />
                Benefícios de resolver as correções
              </h3>
              <div className="lt-blist" style={{ marginTop: ".5rem" }}>
                <div className="ls-benefit-row">
                  <span className="lt-bdot" />
                  <p className="lt-body">Mais chances de aparecer bem posicionado no Google para buscas relevantes.</p>
                </div>
                <div className="ls-benefit-row">
                  <span className="lt-bdot" />
                  <p className="lt-body">Visitantes permanecem mais tempo no site em vez de desistir por lentidão ou erros.</p>
                </div>
                <div className="ls-benefit-row">
                  <span className="lt-bdot" />
                  <p className="lt-body">Mais dados de tráfego e comportamento para decisões de marketing.</p>
                </div>
                <div className="ls-benefit-row">
                  <span className="lt-bdot" />
                  <p className="lt-body">Experiência melhor para quem acessa pelo celular — maioria dos visitantes hoje.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "velocidade" && (
        <div className="lt-card">
          <h3>
            <BoltIcon size={18} style={{ verticalAlign: "-3px", marginRight: ".4rem" }} />
            Análise de Velocidade
          </h3>
          <p className="lt-body">
            Fonte dos dados:{" "}
            {speed.source === "pagespeed"
              ? "Google PageSpeed Insights"
              : "Tempo de resposta do servidor"}
          </p>

          <div className="ls-check-grid">
            <StatusCard
              label="Carregamento completo"
              value={`${(speed.loadTimeMs / 1000).toFixed(1)}s`}
              status={speed.classification === "Excelente" || speed.classification === "Bom" ? "ok" : speed.classification === "Regular" ? "warn" : "critical"}
            />
            <StatusCard label="Resposta do servidor (TTFB)" value={`${speed.ttfbMs}ms`} status={speed.ttfbMs < 800 ? "ok" : "warn"} />
            <StatusCard label="Tamanho da página" value={formatBytes(speed.pageSizeBytes)} status="neutral" />
            <StatusCard
              label="GZIP / Compressão"
              value={speed.gzipEnabled ? "Ativado" : "Desativado"}
              status={speed.gzipEnabled ? "ok" : "critical"}
            />
            <StatusCard label="Servidor" value={speed.server || "Não informado"} status="neutral" />
            <StatusCard label="Classificação" value={speed.classification} status={speed.classification === "Lento" ? "critical" : speed.classification === "Regular" ? "warn" : "ok"} />
            <StatusCard
              label="Recursos bloqueantes no <head>"
              value={`${speed.renderBlockingScripts + speed.renderBlockingStyles} arquivo(s)`}
              note={`${speed.renderBlockingScripts} script(s) · ${speed.renderBlockingStyles} CSS`}
              status={speed.renderBlockingScripts + speed.renderBlockingStyles > 15 ? "critical" : speed.renderBlockingScripts + speed.renderBlockingStyles > 6 ? "warn" : "ok"}
            />
            {report.cms.cms && (
              <StatusCard
                label={`Cache do ${report.cms.cms}`}
                value={report.cms.cacheDetected ? "Identificado" : "Não identificado"}
                status={report.cms.cacheDetected ? "ok" : "warn"}
              />
            )}
          </div>

          {speed.lcp != null && (
            <div className="ls-check-grid" style={{ marginTop: 0 }}>
              <StatusCard label="LCP (Largest Contentful Paint)" value={`${(speed.lcp / 1000).toFixed(2)}s`} status={speed.lcp < 2500 ? "ok" : "warn"} />
              {speed.cls != null && <StatusCard label="CLS (Cumulative Layout Shift)" value={speed.cls.toFixed(3)} status={speed.cls < 0.1 ? "ok" : "warn"} />}
            </div>
          )}

          <div style={{ marginTop: "1.75rem" }}>
            <ScoreBar label="Nota de Velocidade" score={report.categories.find((c) => c.key === "velocidade")?.score ?? 0} />
          </div>

          <div className="lt-prompt" style={{ marginTop: "1.5rem" }}>
            <LightbulbIcon size={14} style={{ verticalAlign: "-2px", marginRight: ".3rem" }} />
            Referência (tempo de carregamento completo): Excelente {"< 1.5s"} · Bom 1.5s–2.5s · Regular 2.5s–4.5s ·
            Lento {"> 4.5s"}
          </div>
        </div>
      )}

      {tab === "seo" && (
        <div className="lt-card">
          <h3>
            <SearchIcon size={18} style={{ verticalAlign: "-3px", marginRight: ".4rem" }} />
            Análise SEO Completa
          </h3>
          <p className="lt-body">Verificação dos principais fatores de ranqueamento no Google.</p>

          <div className="ls-check-grid">
            <StatusCard
              label="Meta title"
              value={seo.title || "Ausente"}
              note={seo.title ? `${seo.titleLength} caracteres (ideal: 50–60)` : null}
              status={!seo.title ? "critical" : seo.titleLength < 30 || seo.titleLength > 65 ? "warn" : "ok"}
            />
            <StatusCard
              label="Meta description"
              value={seo.metaDescription || "Ausente"}
              note={seo.metaDescription ? `${seo.metaDescriptionLength} caracteres (ideal: 120–160)` : null}
              status={!seo.metaDescription ? "critical" : seo.metaDescriptionLength < 70 || seo.metaDescriptionLength > 160 ? "warn" : "ok"}
            />
            <StatusCard label="Tag canonical" value={seo.canonical || "Não configurada"} status={seo.canonical ? "ok" : "warn"} />
            <StatusCard label="Meta robots" value={seo.robotsMeta || "Não configurada"} status="neutral" />
            <StatusCard label="sitemap.xml" value={seo.sitemapFound ? "Encontrado" : "Não encontrado"} status={seo.sitemapFound ? "ok" : "critical"} />
            <StatusCard label="robots.txt" value={seo.robotsFound ? "Encontrado" : "Não encontrado"} status={seo.robotsFound ? "ok" : "warn"} />
            <StatusCard label="Open Graph" value={seo.hasOpenGraph ? "Configurado" : "Não configurado"} status={seo.hasOpenGraph ? "ok" : "warn"} />
            <StatusCard
              label="Links internos / externos"
              value={`${seo.internalLinks} internos / ${seo.externalLinks} externos`}
              note={seo.genericAnchors > 0 ? `${seo.genericAnchors} links com âncoras genéricas` : null}
              status={seo.internalLinks === 0 ? "critical" : "ok"}
            />
            <StatusCard label="Feed RSS/Atom" value={seo.rssFeedFound ? "Encontrado" : "Não encontrado"} status="neutral" />
          </div>

          <h3 style={{ marginTop: "2rem" }}>
            <ListIcon size={16} style={{ verticalAlign: "-3px", marginRight: ".4rem" }} />
            Estrutura de títulos (headings)
          </h3>
          <div className="ls-check-grid">
            <StatusCard label="<H1>" value={seo.h1Count} note={seo.h1Text} status={seo.h1Count === 1 ? "ok" : "critical"} />
            <StatusCard label="<H2>" value={seo.h2Count} status={seo.h2Count > 0 ? "ok" : "warn"} />
            <StatusCard label="<H3>" value={seo.h3Count} status="neutral" />
          </div>

          <h3 style={{ marginTop: "2rem" }}>
            <ChartIcon size={16} style={{ verticalAlign: "-3px", marginRight: ".4rem" }} />
            Pontuação SEO detalhada
          </h3>
          <div style={{ marginTop: "1rem" }}>
            <ScoreBar label="Meta Tags" weightPct={30} score={metaTagsScore} />
            <ScoreBar label="Headings (H1/H2/H3)" weightPct={20} score={headingsScore} />
            <ScoreBar label="Arquivos (sitemap/robots)" weightPct={15} score={filesScore} />
            <ScoreBar label="Links" weightPct={15} score={linksScore} />
          </div>
        </div>
      )}

      {tab === "geo" && (
        <div className="lt-card">
          <h3>
            <CpuBoltIcon size={18} style={{ verticalAlign: "-3px", marginRight: ".4rem" }} />
            Otimização para Busca por Inteligência Artificial (GEO)
          </h3>
          <p className="lt-body">Avaliação da visibilidade da sua marca para ChatGPT, Gemini e Perplexity.</p>

          <div className="ls-check-grid">
            <StatusCard
              label="Acesso de crawlers de IA"
              value={geo.crawlersOpen ? "Totalmente aberto" : "Bloqueado no robots.txt"}
              note={geo.crawlersOpen ? "Robôs como GPTBot e Google-Extended podem indexar o site." : "Isso impede que sua marca seja recomendada por IAs."}
              status={geo.crawlersOpen ? "ok" : "critical"}
            />
            <StatusCard
              label="Arquivo /llms.txt"
              value={geo.llmsTxtFound ? "Encontrado" : "Não encontrado"}
              note="Resumo estruturado do negócio para IAs lerem."
              status={geo.llmsTxtFound ? "ok" : "critical"}
            />
            <StatusCard
              label="Arquivo /llms-full.txt"
              value={geo.llmsFullTxtFound ? "Encontrado" : "Não encontrado"}
              note="Contexto detalhado para modelos de linguagem."
              status={geo.llmsFullTxtFound ? "ok" : "warn"}
            />
            <StatusCard
              label="Dados estruturados (Schema.org)"
              value={geo.schemaTypes.length > 0 ? `Detectados: ${geo.schemaTypes.join(", ")}` : "Não detectados"}
              status={geo.schemaTypes.length > 0 ? "ok" : "warn"}
            />
            <StatusCard
              label="Estrutura semântica (HTML5)"
              value={geo.hasSemanticHtml ? `${geo.semanticTagsFound.length} tags encontradas` : "Poucas tags semânticas"}
              note={geo.semanticTagsFound.join(", ") || null}
              status={geo.hasSemanticHtml ? "ok" : "warn"}
            />
            <StatusCard
              label="Padrões de resposta direta"
              value={geo.hasDirectAnswerPatterns ? "Listas/tabelas detectadas" : "Poucas listas ou tabelas"}
              note={`${geo.listCount} lista(s) · ${geo.tableCount} tabela(s)`}
              status={geo.hasDirectAnswerPatterns ? "ok" : "warn"}
            />
            <StatusCard
              label="Sitemap referenciado no robots.txt"
              value={geo.sitemapReferencedInRobots ? "Configurado" : "Ausente"}
              status={geo.sitemapReferencedInRobots ? "ok" : "warn"}
            />
          </div>

          <div className="lt-prompt" style={{ marginTop: "1.5rem" }}>
            <CpuBoltIcon size={14} style={{ verticalAlign: "-2px", marginRight: ".3rem" }} />
            <b>O que é GEO?</b> Mais buscas de usuários já começam em respostas diretas geradas por IA. O GEO
            prepara o site estruturalmente para que ChatGPT, Gemini e Perplexity consigam ler o conteúdo e
            recomendar a empresa nas respostas.
          </div>
        </div>
      )}

      {tab === "eeat" && (
        <div className="lt-card">
          <h3>
            <StarIcon size={18} style={{ verticalAlign: "-3px", marginRight: ".4rem" }} />
            Experiência, Autoridade e Confiabilidade (E-E-A-T)
          </h3>
          <p className="lt-body">Critérios de autoria, segurança e reputação institucional exigidos pelo Google e pelas IAs.</p>

          <div className="ls-check-grid">
            <StatusCard
              label="CNPJ da empresa"
              value={eeat.cnpjFound ? eeat.cnpjValue : "Não detectado"}
              note="A falta de CNPJ reduz a credibilidade perante o Google."
              status={eeat.cnpjFound ? "ok" : "critical"}
            />
            <StatusCard
              label="Seção ou página de FAQ"
              value={eeat.faqFound ? "Detectada" : "Não detectada"}
              status={eeat.faqFound ? "ok" : "warn"}
            />
            <StatusCard
              label="Depoimentos e avaliações"
              value={eeat.testimonialsFound ? "Detectados" : "Não detectados"}
              status={eeat.testimonialsFound ? "ok" : "warn"}
            />
            <StatusCard
              label="Página sobre a empresa"
              value={eeat.aboutPageFound ? "Detectada" : "Não detectada"}
              status={eeat.aboutPageFound ? "ok" : "warn"}
            />
            <StatusCard
              label="Política de privacidade"
              value={eeat.privacyPolicyFound ? "Detectada" : "Não detectada"}
              status={eeat.privacyPolicyFound ? "ok" : "critical"}
            />
            <StatusCard
              label="Página ou informações de contato"
              value={eeat.contactFound ? "Detectadas" : "Não detectadas"}
              status={eeat.contactFound ? "ok" : "critical"}
            />
            <StatusCard
              label="Aviso de cookies (LGPD)"
              value={eeat.cookieConsentFound ? "Detectado" : "Não detectado"}
              status={eeat.cookieConsentFound ? "ok" : "warn"}
            />
          </div>

          <div className="lt-prompt" style={{ marginTop: "1.5rem" }}>
            <StarIcon size={14} style={{ verticalAlign: "-2px", marginRight: ".3rem" }} />
            <b>O que significa E-E-A-T?</b> Experience, Expertise, Authoritativeness, Trustworthiness. O Google e
            as IAs priorizam indicar empresas legítimas e seguras — contato claro, política de privacidade, provas
            sociais e CNPJ visível são os pilares para ganhar relevância.
          </div>
        </div>
      )}

      {tab === "imagens" && (
        <div className="lt-card">
          <h3>
            <GalleryIcon size={18} style={{ verticalAlign: "-3px", marginRight: ".4rem" }} />
            Análise de Imagens
          </h3>
          <p className="lt-body">
            {images.total} imagens analisadas · {images.total > 0 ? Math.round(((images.total - images.withoutAlt) / images.total) * 100) : 0}% com ALT ·{" "}
            {images.modernFormat + images.legacyFormat > 0 ? Math.round((images.modernFormat / (images.modernFormat + images.legacyFormat)) * 100) : 0}% em formato moderno
          </p>

          <div style={{ marginTop: "1rem" }}>
            <ScoreBar label="Formato das imagens" weightPct={40} score={imagesFormatScore} />
            <ScoreBar label="Peso médio" weightPct={40} score={imagesWeightScore} />
            <ScoreBar label="Cobertura de ALT" weightPct={20} score={imagesAltScore} />
          </div>

          {images.entries.length > 0 && (
            <div style={{ overflowX: "auto", marginTop: "1.5rem" }}>
              <table className="lt-table">
                <thead>
                  <tr>
                    <th>Preview</th>
                    <th>Arquivo</th>
                    <th>Formato</th>
                    <th>Peso</th>
                    <th>ALT</th>
                  </tr>
                </thead>
                <tbody>
                  {images.entries.slice(0, 30).map((img, i) => (
                    <tr key={i} className={!img.hasAlt ? "critical" : ""}>
                      <td>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.src}
                          alt=""
                          loading="lazy"
                          style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6 }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.visibility = "hidden";
                          }}
                        />
                      </td>
                      <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }}>{img.src.split("/").pop()}</td>
                      <td className="lt-tool">{img.format}</td>
                      <td>{img.weightBytes != null ? formatBytes(img.weightBytes) : "—"}</td>
                      <td>{img.hasAlt ? <CheckCircleIcon size={16} style={{ color: "var(--lt-lime)" }} /> : <CloseCircleIcon size={16} style={{ color: "var(--lt-red)" }} />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "mobile" && (
        <div className="lt-card">
          <h3>
            <SmartphoneIcon size={18} style={{ verticalAlign: "-3px", marginRight: ".4rem" }} />
            Análise de Responsividade Mobile
          </h3>
          <div className="ls-check-grid">
            <StatusCard
              label="Meta viewport"
              value={mobile.viewportContent || "Ausente"}
              status={mobile.hasViewport ? "ok" : "critical"}
            />
            <StatusCard label="Zoom do usuário" value={mobile.zoomAllowed ? "Permitido" : "Bloqueado"} status={mobile.zoomAllowed ? "ok" : "warn"} />
            <StatusCard label="Media queries (breakpoints)" value={`${mobile.mediaQueriesCount} detectada(s)`} status={mobile.mediaQueriesCount > 0 ? "ok" : "warn"} />
            <StatusCard label="Framework responsivo" value={mobile.frameworkDetected || "Não detectado"} status="neutral" />
            <StatusCard
              label="Imagens responsivas (srcset)"
              value={`${mobile.responsiveImagesPct}% com srcset`}
              status={mobile.responsiveImagesPct > 50 ? "ok" : "warn"}
            />
            <StatusCard
              label="Lazy loading"
              value={mobile.lazyImagesCount > 0 ? `${mobile.lazyImagesCount} imagem(ns)` : "Nenhuma"}
              status={mobile.lazyImagesCount > 0 ? "ok" : "warn"}
            />
          </div>

          <div className="lt-prompt" style={{ marginTop: "1.5rem" }}>
            <SmartphoneIcon size={14} style={{ verticalAlign: "-2px", marginRight: ".3rem" }} />
            Mais de 65% das buscas no Google são feitas pelo celular. O Google usa o Mobile-First Indexing — ele
            avalia a versão mobile para definir o posicionamento em todos os dispositivos.
          </div>
        </div>
      )}

      {tab === "analytics" && (
        <div className="lt-card">
          <h3>
            <ChartIcon size={18} style={{ verticalAlign: "-3px", marginRight: ".4rem" }} />
            Analytics &amp; Rastreamento
          </h3>
          <p className="lt-body">Ferramentas de monitoramento detectadas no site.</p>
          <div className="ls-check-grid">
            <StatusCard label="Google Analytics 4" value={analytics.ga4Id || "Não instalado"} status={analytics.ga4 ? "ok" : "critical"} />
            <StatusCard label="Universal Analytics (legado)" value={analytics.universalAnalytics ? "Detectado" : "Não detectado"} status={analytics.universalAnalytics ? "warn" : "neutral"} />
            <StatusCard label="Google Tag Manager" value={analytics.gtmId || "Não instalado"} status={analytics.gtm ? "ok" : "warn"} />
            <StatusCard label="Meta Pixel (Facebook)" value={analytics.metaPixel ? "Instalado" : "Não instalado"} status={analytics.metaPixel ? "ok" : "neutral"} />
            <StatusCard label="Hotjar" value={analytics.hotjar ? "Instalado" : "Não instalado"} status={analytics.hotjar ? "ok" : "neutral"} />
            <StatusCard label="Microsoft Clarity" value={analytics.clarity ? "Instalado" : "Não instalado"} status={analytics.clarity ? "ok" : "neutral"} />
          </div>
        </div>
      )}

      {tab === "subpaginas" && (
        <div className="lt-card">
          <h3>
            <DocumentsIcon size={18} style={{ verticalAlign: "-3px", marginRight: ".4rem" }} />
            Análise de Subpáginas
          </h3>
          <p className="lt-body">{subpages.length} página(s) interna(s) analisada(s).</p>
          {subpagesTotalFound > subpages.length && (
            <p className="lt-body" style={{ marginTop: ".4rem" }}>
              Encontramos {subpagesTotalFound} subpáginas no sitemap. Analisamos apenas as primeiras{" "}
              {subpages.length}. Para uma análise completa, entre em contato com nosso time.
            </p>
          )}
          {subpages.length === 0 ? (
            <p className="lt-body" style={{ marginTop: "1rem" }}>
              Nenhuma subpágina encontrada (sitemap.xml ou links internos).
            </p>
          ) : (
            <div style={{ marginTop: "1.25rem" }}>
              {subpages.map((p) => {
                const issues = subpageIssues(p);
                const score = subpageScore(p);
                return (
                  <div key={p.url} className={`ls-subpage-card ${issues.length > 0 ? "has-issue" : ""}`}>
                    <div className="ls-subpage-card-head">
                      <div>
                        <div className="ls-subpage-card-title">
                          {p.title || p.label}
                          <span className={`ls-subpage-type ${p.type}`}>{p.type === "post" ? "Post" : "Página"}</span>
                        </div>
                        <div className="ls-subpage-card-url">{p.url}</div>
                      </div>
                      <ScoreRing score={score} size={54} />
                    </div>
                    {issues.length > 0 ? (
                      <div className="ls-subpage-tags">
                        {issues.map((issue, i) => (
                          <span className="ls-subpage-tag" key={i}>
                            {issue}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="lt-body" style={{ marginTop: ".6rem", fontSize: ".82rem" }}>
                        <CheckCircleIcon size={14} style={{ color: "var(--lt-lime)", verticalAlign: "-2px", marginRight: ".3rem" }} />
                        Nenhum problema encontrado nessa página.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "keyword" && keywordResult && (
        <div className="lt-card">
          <h3>
            <KeyIcon size={18} style={{ verticalAlign: "-3px", marginRight: ".4rem" }} />
            Análise de Palavra-chave: &ldquo;{keywordResult.keyword}&rdquo;
          </h3>
          <div className="ls-check-grid">
            <StatusCard label="Presente no título" value={keywordResult.inTitle ? "Sim" : "Não"} status={keywordResult.inTitle ? "ok" : "critical"} />
            <StatusCard label="Presente no H1" value={keywordResult.inH1 ? "Sim" : "Não"} status={keywordResult.inH1 ? "ok" : "critical"} />
            <StatusCard label="Presente na meta description" value={keywordResult.inMetaDescription ? "Sim" : "Não"} status={keywordResult.inMetaDescription ? "ok" : "warn"} />
            <StatusCard label="Presente na URL" value={keywordResult.inUrl ? "Sim" : "Não"} status={keywordResult.inUrl ? "ok" : "neutral"} />
            <StatusCard label="Presente no 1º parágrafo" value={keywordResult.inFirstParagraph ? "Sim" : "Não"} status={keywordResult.inFirstParagraph ? "ok" : "warn"} />
            <StatusCard label="Presente em subtítulos (H2/H3)" value={keywordResult.inSubheadings ? "Sim" : "Não"} status={keywordResult.inSubheadings ? "ok" : "warn"} />
            <StatusCard label="Ocorrências no texto" value={keywordResult.occurrences} status="neutral" />
            <StatusCard label="Densidade" value={`${keywordResult.density}%`} note="Ideal: entre 1% e 3%" status={keywordResult.density >= 1 && keywordResult.density <= 3 ? "ok" : "warn"} />
          </div>
        </div>
      )}

      {tab === "semantica" && (
        <div className="lt-card">
          <h3>
            <BrainIcon size={18} style={{ verticalAlign: "-3px", marginRight: ".4rem" }} />
            Análise Semântica
          </h3>
          <p className="lt-body">Palavras-chave e estrutura de conteúdo — o que o Google lê para entender o seu negócio.</p>
          <div className="ls-check-grid">
            <StatusCard label="Total de palavras" value={semantics.totalWords} status="neutral" />
            <StatusCard label="Parágrafos" value={semantics.paragraphCount} status="neutral" />
            <StatusCard label="Média por parágrafo" value={`${semantics.avgCharsPerParagraph} chars`} status="neutral" />
            <StatusCard label="Legibilidade" value={semantics.readability} status={semantics.readability === "Boa" ? "ok" : semantics.readability === "Média" ? "warn" : "critical"} />
          </div>

          {semantics.topWords.length > 0 && (
            <>
              <h3 style={{ marginTop: "2rem" }}>
                <HashtagIcon size={16} style={{ verticalAlign: "-3px", marginRight: ".4rem" }} />
                Top 10 palavras mais frequentes
              </h3>
              <p className="lt-body" style={{ fontSize: ".82rem" }}>
                Estas são as palavras que o Google mais associa ao seu site.
              </p>
              <div className="ls-word-chips">
                {semantics.topWords.map((w) => (
                  <span className="ls-word-chip" key={w.word}>
                    <b>{w.word}</b> {w.count}x <span>{w.pct}%</span>
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="ls-cta-final">
        <div className="lt-card accent">
          <div style={{ color: "var(--lt-lime)", marginBottom: ".5rem" }}>
            <RocketIcon size={32} />
          </div>
          <h3 className="lt-title-sm">Vamos melhorar o seu site?</h3>
          <p className="lt-body" style={{ margin: ".75rem 0 1.25rem" }}>
            Fale agora com nossos especialistas e descubra como levar seu site à nota máxima.
          </p>
          <WhatsAppCtaButton site={report.finalUrl} slug={report.slug} />
          <p className="lt-mono-meta" style={{ marginTop: "1rem" }}>
            Resposta em minutos · Análise gratuita · Sem compromisso
          </p>
        </div>
      </div>

      <div id="analise-completa" className="lt-card accent ls-disclaimer">
        <WarningTriangleIcon size={26} className="ls-disclaimer-icon" />
        <div>
          <h3>Por que esta análise é mais completa que um teste de velocidade comum?</h3>
          <p className="lt-body">
            Ferramentas como o PageSpeed avaliam basicamente a velocidade de carregamento,
            enquanto nossa análise vai muito além da tela inicial. Nós examinamos as páginas
            internas, a visibilidade da sua marca nas buscas tradicionais e nas novas ferramentas
            de inteligência artificial, além da autoridade e da qualidade do conteúdo publicado.
            Muitos desses critérios são novos no mercado digital, portanto apontar melhorias não
            significa que o seu site foi feito de forma errada, mas sim que existem boas
            oportunidades de atualização. Encare este relatório como um guia prático para
            direcionar o trabalho da sua equipe técnica.
          </p>
        </div>
      </div>

      {showEmailModal && <EmailModal slug={report.slug} onClose={() => setShowEmailModal(false)} />}
    </div>
  );
}
