"use client";

import { useState } from "react";
import type {
  SitemapBestPracticesResult,
  SitemapCoherenceResult,
  SitemapSyntaxResult,
} from "@/lib/analyzers/sitemap";

interface SitemapCheckResponse {
  syntax: SitemapSyntaxResult[];
  bestPractices: SitemapBestPracticesResult[];
  coherence: SitemapCoherenceResult;
}

export function SitemapCheckPanel() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SitemapCheckResponse | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/sitemap-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao checar o sitemap.");
        return;
      }
      setResult(data);
    } catch {
      setError("Erro ao checar o sitemap.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="lt-card">
      <h3>Relatório de sitemap</h3>
      <p className="lt-body" style={{ marginTop: ".5rem" }}>
        Localiza o(s) sitemap(s) do site e consolida sintaxe, boas práticas e coerência com o
        robots.txt/status HTTP real.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: ".6rem", marginTop: "1rem" }}>
        <input
          type="text"
          className="ls-input"
          placeholder="www.seusite.com.br"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" className="lt-btn lt-btn-primary" disabled={loading}>
          {loading ? "Checando…" : "Checar sitemap"}
        </button>
      </form>

      {error && (
        <p className="lt-body" style={{ marginTop: "1rem", color: "var(--lt-danger, #c0392b)" }}>
          {error}
        </p>
      )}

      {result && (
        <div style={{ marginTop: "1.25rem" }}>
          <h4>Sintaxe</h4>
          <div style={{ overflowX: "auto", marginTop: ".5rem" }}>
            <table className="lt-table">
              <thead>
                <tr>
                  <th>Sitemap</th>
                  <th>Origem</th>
                  <th>Válido</th>
                  <th>Tipo</th>
                  <th>Entradas</th>
                  <th>Detalhe</th>
                </tr>
              </thead>
              <tbody>
                {result.syntax.map((s) => (
                  <tr key={s.url} className={!s.valid ? "critical" : ""}>
                    <td>{s.url}</td>
                    <td>{s.source === "robots" ? "robots.txt" : "path padrão"}</td>
                    <td>{s.found ? (s.valid ? "✅" : "❌") : "não encontrado"}</td>
                    <td>{s.rootTag ?? "—"}</td>
                    <td>{s.entryCount}</td>
                    <td>{s.errorMessage ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.bestPractices.length > 0 && (
            <>
              <h4 style={{ marginTop: "1.5rem" }}>Boas práticas</h4>
              <div style={{ overflowX: "auto", marginTop: ".5rem" }}>
                <table className="lt-table">
                  <thead>
                    <tr>
                      <th>Sitemap</th>
                      <th>Parte de index</th>
                      <th>URLs</th>
                      <th>Acima do limite (50k)</th>
                      <th>Cobertura de lastmod</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.bestPractices.map((b) => (
                      <tr key={b.url} className={b.exceedsUrlLimit || b.hasLowLastmodCoverage ? "critical" : ""}>
                        <td>{b.url}</td>
                        <td>{b.partOfIndex ? "Sim" : "Não"}</td>
                        <td>{b.urlCount}</td>
                        <td>{b.exceedsUrlLimit ? "⚠️ Sim" : "Não"}</td>
                        <td>
                          {b.lastmodCoveragePercent}% {b.hasLowLastmodCoverage && "⚠️"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <h4 style={{ marginTop: "1.5rem" }}>
            Gargalos de indexação ({result.coherence.issues.length} de {result.coherence.totalUrlsChecked}{" "}
            URLs checadas, {result.coherence.totalUrlsListed} listadas no total)
          </h4>
          {result.coherence.issues.length === 0 ? (
            <p className="lt-body" style={{ marginTop: ".5rem" }}>
              Nenhum problema encontrado na amostra checada.
            </p>
          ) : (
            <div style={{ overflowX: "auto", marginTop: ".5rem" }}>
              <table className="lt-table">
                <thead>
                  <tr>
                    <th>URL</th>
                    <th>Bloqueada no robots.txt</th>
                    <th>Status</th>
                    <th>Sitemap de origem</th>
                  </tr>
                </thead>
                <tbody>
                  {result.coherence.issues.map((issue) => (
                    <tr key={issue.loc} className="critical">
                      <td>{issue.loc}</td>
                      <td>{issue.blockedByRobots ? "⚠️ Sim" : "Não"}</td>
                      <td>
                        {issue.statusCode ?? "—"} ({issue.statusCategory})
                      </td>
                      <td>{issue.sitemapUrl}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
