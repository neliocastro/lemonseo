"use client";

import { useState } from "react";

export function Footer() {
  const [open, setOpen] = useState(false);

  return (
    <footer className="ls-footer">
      <p>🍋 LemonSEO é uma ferramenta de triagem automática de SEO e performance.</p>
      <p>
        Usamos o Google PageSpeed Insights e verificações próprias de código-fonte público do site
        informado. Nenhum dado confidencial é coletado.
      </p>
      <div className="ls-footer-links">
        <button onClick={() => setOpen(true)} style={{ background: "transparent", border: "none", cursor: "pointer" }}>
          Política de Privacidade &amp; Termos de Uso
        </button>
      </div>
      <p style={{ marginTop: "1rem", opacity: 0.6 }}>
        © {new Date().getFullYear()} LemonSEO. Todos os direitos reservados.
      </p>
      <p style={{ marginTop: ".4rem", fontSize: ".72rem", opacity: 0.5 }}>
        Ícones por{" "}
        <a href="https://icones.js.org/collection/solar" target="_blank" rel="noopener noreferrer">
          Solar
        </a>
        , sob licença{" "}
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">
          CC BY 4.0
        </a>
        .
      </p>

      {open && (
        <div className="ls-modal-backdrop" onClick={() => setOpen(false)}>
          <div className="ls-modal" style={{ textAlign: "left", maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
            <button className="ls-modal-close" onClick={() => setOpen(false)}>
              ×
            </button>
            <h3 className="lt-title-sm" style={{ marginBottom: "1rem" }}>
              Política de Privacidade &amp; Termos de Uso
            </h3>
            <div className="lt-body" style={{ display: "flex", flexDirection: "column", gap: "0.9rem", fontSize: ".85rem" }}>
              <p>
                <strong>1. Coleta de informações públicas:</strong> esta ferramenta analisa apenas dados
                públicos disponíveis no código-fonte do site informado pelo usuário (meta tags, imagens,
                links). Nenhuma informação confidencial é extraída.
              </p>
              <p>
                <strong>2. Metodologia:</strong> as notas combinam dados reais do Google PageSpeed Insights
                com verificações on-page (SEO, imagens, mobile, subpáginas, analytics). Não garantimos
                posicionamento no Google — é uma triagem educativa e consultiva.
              </p>
              <div className="lt-alert">
                <p>
                  <strong>Isenção de responsabilidade:</strong> as notas e relatórios têm caráter
                  informativo. Não representam garantia de indexação, ranqueamento ou aprovação por
                  motores de busca ou assistentes de IA.
                </p>
              </div>
              <p>
                <strong>3. Cookies:</strong> utilizamos apenas cookies analíticos, sem rastreamento de
                anúncios de terceiros.
              </p>
              <p>
                <strong>4. Contato:</strong> dúvidas sobre privacidade podem ser enviadas para{" "}
                <a href="mailto:contato@lemonseo.com.br">contato@lemonseo.com.br</a>.
              </p>
            </div>
            <button className="lt-btn lt-btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: "1.5rem" }} onClick={() => setOpen(false)}>
              Li e aceito os termos
            </button>
          </div>
        </div>
      )}
    </footer>
  );
}
