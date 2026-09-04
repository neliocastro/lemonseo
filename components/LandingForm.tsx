"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const STEPS = [
  "Conectando ao servidor",
  "Baixando conteúdo HTML",
  "Analisando velocidade",
  "Verificando imagens",
  "Analisando responsividade mobile",
  "Verificando meta tags e SEO",
  "Analisando subpáginas",
  "Verificando analytics e trackers",
  "Gerando relatório final",
];

export function LandingForm() {
  const router = useRouter();
  const [site, setSite] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!site.trim()) return;
    setError(null);
    setLoading(true);
    setStepIndex(0);

    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 700);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: site, keyword }),
      });
      const data = await res.json();
      clearInterval(interval);
      if (!res.ok) {
        setError(data.error || "Não foi possível analisar esse site.");
        setLoading(false);
        return;
      }
      router.push(`/analise/${data.slug}`);
    } catch {
      clearInterval(interval);
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="ls-progress-wrap">
        <div className="ls-progress-card lt-card">
          <div style={{ fontSize: "2.2rem", marginBottom: "0.75rem" }}>🍋</div>
          <h2 className="lt-title-sm">Analisando seu site</h2>
          <p className="lt-body" style={{ margin: ".5rem 0 1rem" }}>
            Verificando <strong style={{ color: "var(--lt-text)" }}>{site}</strong> em tempo real
          </p>
          <div className="ls-progress-track">
            <div
              className="ls-progress-fill"
              style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          <div style={{ textAlign: "left" }}>
            {STEPS.map((step, i) => (
              <div
                key={step}
                className={`ls-step ${i < stepIndex ? "done" : i === stepIndex ? "active" : ""}`}
              >
                <span className="ls-step-icon">{i < stepIndex ? "✓" : i === stepIndex ? "⟳" : "○"}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="lt-card ls-form-card">
      <div className="ls-field">
        <label>🌐 URL do seu site</label>
        <input
          type="text"
          placeholder="www.seusite.com.br"
          value={site}
          onChange={(e) => setSite(e.target.value)}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          required
        />
        <div className="ls-hint">Ex: www.seusite.com.br — com ou sem https://</div>
      </div>
      <div className="ls-field">
        <label>
          🔑 Palavra-chave para testar{" "}
          <span style={{ color: "var(--lt-muted)", fontWeight: 400 }}>(opcional)</span>
          <span className="ls-badge-new">NOVO</span>
        </label>
        <input
          type="text"
          placeholder="Ex: agência de marketing digital SP"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          autoComplete="off"
        />
        <div className="ls-hint">
          Teste se seu site está otimizado para aparecer quando alguém pesquisar esse termo no Google
        </div>
      </div>
      {error && (
        <div className="lt-alert" style={{ marginBottom: "1rem" }}>
          <p>{error}</p>
        </div>
      )}
      <button type="submit" className="lt-btn lt-btn-primary ls-submit">
        🔍 Analisar agora — é grátis
      </button>
    </form>
  );
}
