"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon, WarningTriangleIcon } from "./icons";

export function LeadDeleteButton({ leadId, leadUrl }: { leadId: string; leadUrl: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Erro ao excluir o lead.");
        setDeleting(false);
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Erro de conexão ao excluir o lead.");
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lt-btn lt-btn-ghost"
        style={{ padding: ".35rem .6rem", fontSize: ".78rem", color: "var(--lt-red)" }}
        title="Excluir lead"
      >
        <TrashIcon size={14} />
      </button>

      {open && (
        <div className="ls-modal-backdrop" onClick={() => !deleting && setOpen(false)}>
          <div className="ls-modal" onClick={(e) => e.stopPropagation()}>
            <button className="ls-modal-close" onClick={() => setOpen(false)} disabled={deleting}>
              ×
            </button>
            <div style={{ color: "var(--lt-red)", marginBottom: "0.75rem" }}>
              <WarningTriangleIcon size={38} />
            </div>
            <h3 className="lt-title-sm">Excluir lead?</h3>
            <p className="lt-body" style={{ margin: ".5rem 0 1.25rem" }}>
              Você está prestes a excluir permanentemente o lead de <strong>{leadUrl}</strong>.
              Essa ação não pode ser desfeita e remove o histórico de status e interações
              associado a ele.
            </p>
            <div style={{ display: "flex", gap: ".75rem" }}>
              <button
                onClick={() => setOpen(false)}
                className="lt-btn lt-btn-ghost"
                style={{ flex: 1, justifyContent: "center" }}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className="lt-btn lt-btn-primary"
                style={{ flex: 1, justifyContent: "center", background: "var(--lt-red)" }}
                disabled={deleting}
              >
                {deleting ? "Excluindo..." : "Excluir definitivamente"}
              </button>
            </div>
            {error && (
              <p style={{ marginTop: "1rem", fontWeight: 600, color: "var(--lt-red)" }}>{error}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
