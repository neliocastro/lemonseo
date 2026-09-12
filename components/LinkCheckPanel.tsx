"use client";

import { useState } from "react";
import type { CheckedLink, LinkStatusCategory } from "@/lib/analyzers/linkStatus";

interface LinkCheckResponse {
  pageUrl: string;
  totalLinks: number;
  brokenCount: number;
  broken: CheckedLink[];
}

const CATEGORY_LABELS: Record<LinkStatusCategory, string> = {
  ok: "OK",
  redirect: "Redirecionamento",
  not_found: "Não encontrado (404)",
  server_error: "Erro do servidor (5xx)",
  timeout: "Tempo esgotado",
  other_error: "Erro de conexão",
};

const CATEGORY_ORDER: LinkStatusCategory[] = [
  "not_found",
  "server_error",
  "timeout",
  "other_error",
  "redirect",
];

export function LinkCheckPanel() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LinkCheckResponse | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/link-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao checar os links.");
        return;
      }
      setResult(data);
    } catch {
      setError("Erro ao checar os links.");
    } finally {
      setLoading(false);
    }
  }

  const grouped = result
    ? CATEGORY_ORDER.map((category) => ({
        category,
        links: result.broken.filter((l) => l.category === category),
      })).filter((g) => g.links.length > 0)
    : [];

  return (
    <section className="lt-card">
      <h3>Rastreador de links quebrados</h3>
      <p className="lt-body" style={{ marginTop: ".5rem" }}>
        Varre a página informada e checa o status de cada link interno/externo encontrado.
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
          {loading ? "Checando…" : "Checar links"}
        </button>
      </form>

      {error && (
        <p className="lt-body" style={{ marginTop: "1rem", color: "var(--lt-danger, #c0392b)" }}>
          {error}
        </p>
      )}

      {result && (
        <div style={{ marginTop: "1.25rem" }}>
          <p className="lt-body">
            {result.totalLinks} links encontrados em <strong>{result.pageUrl}</strong> —{" "}
            {result.brokenCount === 0 ? "nenhum problema encontrado." : `${result.brokenCount} com problema.`}
          </p>

          {grouped.map(({ category, links }) => (
            <div key={category} style={{ marginTop: "1.25rem" }}>
              <h4 style={{ marginBottom: ".5rem" }}>
                {CATEGORY_LABELS[category]} ({links.length})
              </h4>
              <div style={{ overflowX: "auto" }}>
                <table className="lt-table">
                  <thead>
                    <tr>
                      <th>Link</th>
                      <th>Tipo</th>
                      <th>Status</th>
                      <th>Encontrado em</th>
                      <th>Texto do link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {links.map((link) => (
                      <tr key={link.href}>
                        <td>
                          <a href={link.href} target="_blank" rel="noopener noreferrer">
                            {link.href}
                          </a>
                        </td>
                        <td>{link.type === "internal" ? "Interno" : "Externo"}</td>
                        <td>{link.statusCode ?? link.errorMessage ?? "—"}</td>
                        <td>{link.foundOn}</td>
                        <td>{link.anchorText || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
