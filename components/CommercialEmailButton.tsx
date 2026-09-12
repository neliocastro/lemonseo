"use client";

import { useState } from "react";

interface CommercialEmailContent {
  to: string | null;
  subject: string;
  body: string;
}

export function CommercialEmailButton({ leadId }: { leadId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<CommercialEmailContent | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setOpen(true);
    setLoading(true);
    setContent(null);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/commercial-email`);
      const data = await res.json();
      if (res.ok) setContent(data);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!content) return;
    const text = `Assunto: ${content.subject}\n\n${content.body}`;
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => prompt("Copie o e-mail:", text)
    );
  }

  return (
    <>
      <button
        className="lt-btn lt-btn-ghost"
        style={{ padding: ".35rem .8rem", fontSize: ".78rem" }}
        onClick={handleGenerate}
      >
        ✉️ Gerar e-mail
      </button>

      {open && (
        <div className="ls-modal-backdrop" onClick={() => setOpen(false)}>
          <div className="ls-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <button className="ls-modal-close" onClick={() => setOpen(false)}>
              ×
            </button>
            <h3 className="lt-title-sm">E-mail comercial</h3>

            {loading && (
              <p className="lt-body" style={{ marginTop: "1rem" }}>
                Gerando…
              </p>
            )}

            {!loading && content && (
              <>
                <p className="lt-body" style={{ marginTop: "1rem" }}>
                  <strong>Para:</strong> {content.to || "nenhum e-mail encontrado — envie manualmente"}
                </p>
                <p className="lt-body">
                  <strong>Assunto:</strong> {content.subject}
                </p>
                <textarea
                  readOnly
                  value={content.body}
                  rows={14}
                  className="ls-input"
                  style={{ width: "100%", marginTop: ".75rem", fontFamily: "inherit", resize: "vertical" }}
                />
                <button className="lt-btn lt-btn-primary" style={{ marginTop: "1rem" }} onClick={handleCopy}>
                  {copied ? "Copiado!" : "Copiar e-mail"}
                </button>
              </>
            )}

            {!loading && !content && (
              <p className="lt-body" style={{ marginTop: "1rem" }}>
                Erro ao gerar o e-mail.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
