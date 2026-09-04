"use client";

import { useState } from "react";
import Link from "next/link";
import type { AnalysisReport, Problem, Severity } from "@/lib/types";
import { ScoreRing } from "./ScoreRing";
import { EmailModal } from "./EmailModal";
import { WhatsAppFloatButton, WhatsAppCtaButton } from "./WhatsAppButton";

const SEVERITY_LABEL: Record<Severity, { icon: string; label: string }> = {
  alto: { icon: "🔴", label: "Alto impacto" },
  medio: { icon: "🟡", label: "Médio impacto" },
  baixo: { icon: "🟢", label: "Baixo impacto" },
};

function heroMessage(score: number): string {
  if (score >= 8) return "Muito bom! Seu site está com uma base técnica sólida.";
  if (score >= 6) return "No caminho certo, mas há pontos importantes para corrigir.";
  if (score >= 4) return "Seu site tem problemas que provavelmente afetam seu tráfego orgânico.";
  return "Seu site tem problemas críticos que estão custando visitas e clientes.";
}

function ProblemGroup({ severity, problems }: { severity: Severity; problems: Problem[] }) {
  if (problems.length === 0) return null;
  const meta = SEVERITY_LABEL[severity];
  return (
    <div>
      <div className="ls-problem-group-title">
        {meta.icon} {meta.label} <span style={{ opacity: 0.6, fontWeight: 400, fontSize: ".8rem" }}>({problems.length})</span>
      </div>
      {problems.map((p, i) => (
        <div className="ls-problem-item" key={i}>
          <div className="ls-problem-icon">❌</div>
          <div>
            <div className="ls-problem-cat">{p.categoria}</div>
            <div className="ls-problem-title">{p.titulo}</div>
            <div className="ls-problem-impact">💡 {p.impacto}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

const TABS = [
  { key: "problemas", label: "🚨 Problemas" },
  { key: "velocidade", label: "⚡ Velocidade" },
  { key: "seo", label: "🔍 SEO" },
  { key: "imagens", label: "🖼️ Imagens" },
  { key: "mobile", label: "📱 Mobile" },
  { key: "analytics", label: "📊 Analytics" },
  { key: "subpaginas", label: "📑 Subpáginas" },
  { key: "keyword", label: "🔑 Palavra-chave" },
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

  return (
    <div className="ls-result-wrap" style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem 1.5rem" }}>
      <div className="lt-card ls-result-hero" style={{ marginBottom: "1.5rem" }}>
        <ScoreRing score={report.overallScore} size={130} />
        <div>
          <div className="ls-result-url">{report.finalUrl}</div>
          <h2 className="lt-title-sm" style={{ marginTop: ".4rem" }}>
            {heroMessage(report.overallScore)}
          </h2>
          <p className="lt-body" style={{ fontSize: ".82rem", marginTop: ".6rem" }}>
            A nota geral considera, de forma conjunta, Velocidade, SEO, Mobile, Imagens, Subpáginas
            e Analytics.
          </p>
        </div>
      </div>

      <div className="ls-actions">
        <button className="lt-btn lt-btn-ghost" onClick={() => window.print()}>
          🖨️ Exportar PDF
        </button>
        <button className="lt-btn lt-btn-ghost" onClick={() => setShowEmailModal(true)}>
          📩 Receber por e-mail
        </button>
        <button className="lt-btn lt-btn-ghost" onClick={copyLink}>
          🔗 Compartilhar
        </button>
        <Link href="/" className="lt-btn lt-btn-ghost">
          🔍 Analisar outro site
        </Link>
      </div>

      <div className="ls-metric-grid">
        {report.categories.map((c) => (
          <div className="lt-card ls-metric-card" key={c.key}>
            <div className="ls-metric-icon">{c.icon}</div>
            <div className="ls-metric-label">{c.label}</div>
            <ScoreRing score={c.score} size={68} />
            <div className="ls-metric-detail">{c.detail}</div>
          </div>
        ))}
      </div>

      <nav className="ls-tabs-nav">
        {visibleTabs.map((t) => (
          <button
            key={t.key}
            className={`ls-tab-btn ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "problemas" && (
        <div>
          <p className="lt-body" style={{ marginBottom: "1rem" }}>
            📋 Listamos todos os problemas encontrados, do mais crítico ao menos urgente. Os de{" "}
            <strong style={{ color: "var(--lt-text)" }}>alto impacto</strong> afetam diretamente o
            Google — comece por eles.
          </p>
          <div className="ls-problem-counters">
            <span className="lt-badge alert">🔴 {alto.length} alto impacto</span>
            <span className="lt-badge">🟡 {medio.length} médio impacto</span>
            <span className="lt-badge">🟢 {baixo.length} baixo impacto</span>
          </div>
          {report.problems.length === 0 ? (
            <p className="lt-body">Nenhum problema relevante encontrado. 🎉</p>
          ) : (
            <>
              <ProblemGroup severity="alto" problems={alto} />
              <ProblemGroup severity="medio" problems={medio} />
              <ProblemGroup severity="baixo" problems={baixo} />
            </>
          )}
        </div>
      )}

      {tab === "velocidade" && (
        <div className="lt-card">
          <h3>Velocidade</h3>
          <p className="lt-body">
            Fonte dos dados:{" "}
            {report.speed.source === "pagespeed"
              ? "Google PageSpeed Insights"
              : "Tempo de resposta do servidor (fallback — configure PAGESPEED_API_KEY para dados completos do Google)"}
          </p>
          <table className="lt-table" style={{ marginTop: "1rem" }}>
            <tbody>
              <tr>
                <td className="lt-tool">Tempo de carregamento</td>
                <td>{(report.speed.loadTimeMs / 1000).toFixed(2)}s</td>
              </tr>
              {report.speed.lcp != null && (
                <tr>
                  <td className="lt-tool">LCP (Largest Contentful Paint)</td>
                  <td>{(report.speed.lcp / 1000).toFixed(2)}s</td>
                </tr>
              )}
              {report.speed.cls != null && (
                <tr>
                  <td className="lt-tool">CLS (Cumulative Layout Shift)</td>
                  <td>{report.speed.cls.toFixed(3)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "seo" && (
        <div className="lt-card">
          <h3>SEO on-page</h3>
          <table className="lt-table" style={{ marginTop: "1rem" }}>
            <tbody>
              <tr>
                <td className="lt-tool">Meta title</td>
                <td>{report.seo.title || "Não encontrado"} {report.seo.title && `(${report.seo.titleLength} caracteres)`}</td>
              </tr>
              <tr>
                <td className="lt-tool">Meta description</td>
                <td>
                  {report.seo.metaDescription || "Não encontrada"}{" "}
                  {report.seo.metaDescription && `(${report.seo.metaDescriptionLength} caracteres)`}
                </td>
              </tr>
              <tr>
                <td className="lt-tool">H1</td>
                <td>{report.seo.h1Text || "Não encontrado"} ({report.seo.h1Count} no total)</td>
              </tr>
              <tr>
                <td className="lt-tool">URL canônica</td>
                <td>{report.seo.canonical || "Não definida"}</td>
              </tr>
              <tr>
                <td className="lt-tool">Open Graph (compartilhamento social)</td>
                <td>{report.seo.hasOpenGraph ? "Configurado" : "Não configurado"}</td>
              </tr>
              <tr>
                <td className="lt-tool">Idioma declarado</td>
                <td>{report.seo.lang || "Não declarado"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {tab === "imagens" && (
        <div className="lt-card">
          <h3>Imagens</h3>
          <table className="lt-table" style={{ marginTop: "1rem" }}>
            <tbody>
              <tr>
                <td className="lt-tool">Total de imagens</td>
                <td>{report.images.total}</td>
              </tr>
              <tr>
                <td className="lt-tool">Sem texto alternativo (alt)</td>
                <td>{report.images.withoutAlt}</td>
              </tr>
              <tr>
                <td className="lt-tool">Formato moderno (WebP/AVIF)</td>
                <td>{report.images.modernFormat}</td>
              </tr>
              <tr>
                <td className="lt-tool">Formato antigo (JPG/PNG/GIF)</td>
                <td>{report.images.legacyFormat}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {tab === "mobile" && (
        <div className="lt-card">
          <h3>Mobile</h3>
          <table className="lt-table" style={{ marginTop: "1rem" }}>
            <tbody>
              <tr>
                <td className="lt-tool">Meta viewport</td>
                <td>{report.mobile.hasViewport ? "Configurada corretamente" : "Ausente ou incompleta"}</td>
              </tr>
              <tr>
                <td className="lt-tool">Conteúdo da tag</td>
                <td style={{ fontFamily: "var(--lt-f-mono)" }}>{report.mobile.viewportContent || "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {tab === "analytics" && (
        <div className="lt-card">
          <h3>Analytics e trackers</h3>
          {report.analytics.detected.length === 0 ? (
            <p className="lt-body">Nenhuma ferramenta de analytics foi detectada no código-fonte.</p>
          ) : (
            <ul className="lt-blist" style={{ marginTop: "1rem" }}>
              {report.analytics.detected.map((d) => (
                <li className="lt-brow" key={d}>
                  <span className="lt-bdot" />
                  <p>{d}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "subpaginas" && (
        <div className="lt-card">
          <h3>Subpáginas verificadas</h3>
          {report.subpages.length === 0 ? (
            <p className="lt-body">Nenhuma subpágina encontrada (sitemap.xml ou links internos).</p>
          ) : (
            <table className="lt-table" style={{ marginTop: "1rem" }}>
              <thead>
                <tr>
                  <th>Página</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {report.subpages.map((p) => (
                  <tr key={p.url} className={p.ok ? "" : "critical"}>
                    <td>{p.title || p.url}</td>
                    <td>{p.status ?? "Erro de acesso"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "keyword" && report.keywordResult && (
        <div className="lt-card">
          <h3>Palavra-chave: &ldquo;{report.keywordResult.keyword}&rdquo;</h3>
          <table className="lt-table" style={{ marginTop: "1rem" }}>
            <tbody>
              <tr>
                <td className="lt-tool">Presente no título</td>
                <td>{report.keywordResult.inTitle ? "Sim" : "Não"}</td>
              </tr>
              <tr>
                <td className="lt-tool">Presente no H1</td>
                <td>{report.keywordResult.inH1 ? "Sim" : "Não"}</td>
              </tr>
              <tr>
                <td className="lt-tool">Presente na meta description</td>
                <td>{report.keywordResult.inMetaDescription ? "Sim" : "Não"}</td>
              </tr>
              <tr>
                <td className="lt-tool">Presente na URL</td>
                <td>{report.keywordResult.inUrl ? "Sim" : "Não"}</td>
              </tr>
              <tr>
                <td className="lt-tool">Ocorrências no texto</td>
                <td>{report.keywordResult.occurrences}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="ls-cta-final">
        <div className="lt-card accent">
          <div style={{ fontSize: "2rem", marginBottom: ".5rem" }}>🚀</div>
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

      <WhatsAppFloatButton site={report.finalUrl} slug={report.slug} />
      {showEmailModal && <EmailModal slug={report.slug} onClose={() => setShowEmailModal(false)} />}
    </div>
  );
}
