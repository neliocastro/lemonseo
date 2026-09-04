"use client";

import { useState } from "react";

export function EmailModal({ slug, onClose }: { slug: string; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, email, canal: "email" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Erro ao enviar.");
        return;
      }
      setStatus("done");
      setMessage("✓ Recebemos seu contato! Em breve alguém da nossa equipe fala com você.");
    } catch {
      setStatus("error");
      setMessage("Erro de conexão ao enviar o e-mail.");
    }
  }

  return (
    <div className="ls-modal-backdrop" onClick={onClose}>
      <div className="ls-modal" onClick={(e) => e.stopPropagation()}>
        <button className="ls-modal-close" onClick={onClose}>
          ×
        </button>
        <span style={{ fontSize: "2.4rem", display: "block", marginBottom: "0.75rem" }}>📩</span>
        <h3 className="lt-title-sm">Receber relatório por e-mail</h3>
        <p className="lt-body" style={{ margin: ".5rem 0 1.25rem" }}>
          Deixe seu e-mail para receber o relatório completo e um contato da nossa equipe.
        </p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
          <input
            type="email"
            required
            className="ls-input"
            placeholder="seu-email@empresa.com.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" className="lt-btn lt-btn-primary" style={{ justifyContent: "center" }} disabled={status === "sending" || status === "done"}>
            {status === "sending" ? "Enviando..." : "Enviar relatório"}
          </button>
        </form>
        {message && (
          <p style={{ marginTop: "1rem", fontWeight: 600, color: status === "error" ? "var(--lt-red)" : "var(--lt-lime)" }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
