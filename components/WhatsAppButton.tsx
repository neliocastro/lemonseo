"use client";

const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5511900000000";

function buildWaLink(site: string) {
  const text = encodeURIComponent(
    `Olá! Acabei de analisar o site ${site} no LemonSEO e quero saber mais sobre como melhorar os resultados.`
  );
  return `https://wa.me/${WA_NUMBER}?text=${text}`;
}

export function WhatsAppFloatButton({ site, slug }: { site: string; slug: string }) {
  async function registerClick() {
    try {
      await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, canal: "whatsapp" }),
      });
    } catch {
      // não bloqueia a navegação do usuário se o registro falhar
    }
  }

  return (
    <a
      href={buildWaLink(site)}
      target="_blank"
      rel="noopener noreferrer"
      className="ls-wpp-float"
      aria-label="Falar no WhatsApp"
      onClick={registerClick}
    >
      <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.557 4.121 1.524 5.856L0 24l6.335-1.498A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.65-.493-5.184-1.355l-.37-.217-3.766.89.927-3.67-.24-.38A9.958 9.958 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
      </svg>
    </a>
  );
}

export function WhatsAppCtaButton({ site, slug }: { site: string; slug: string }) {
  async function registerClick() {
    try {
      await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, canal: "whatsapp" }),
      });
    } catch {
      // não bloqueia a navegação do usuário se o registro falhar
    }
  }

  return (
    <a
      href={buildWaLink(site)}
      target="_blank"
      rel="noopener noreferrer"
      className="lt-btn lt-btn-primary"
      onClick={registerClick}
    >
      💬 Falar com especialista agora
    </a>
  );
}
