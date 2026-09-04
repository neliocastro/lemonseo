import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LandingForm } from "@/components/LandingForm";

const FEATURES = [
  { icon: "⚡", name: "Velocidade", desc: "Tempo de carregamento" },
  { icon: "🔍", name: "SEO Completo", desc: "Meta tags, headings, links" },
  { icon: "🖼️", name: "Imagens", desc: "Formato, peso e ALT" },
  { icon: "📱", name: "Mobile", desc: "Viewport e responsividade" },
  { icon: "📑", name: "Subpáginas", desc: "Analisa até 10 páginas" },
  { icon: "📊", name: "Analytics", desc: "GA4, GTM, Meta Pixel e mais" },
];

export default function Home() {
  return (
    <>
      <Header />
      <main className="ls-hero lt-section">
        <div className="lt-glow lime" style={{ width: 420, height: 420, top: -140, left: "50%", transform: "translateX(-50%)" }} />
        <span className="lt-eyebrow">Grátis · Resultado em segundos</span>
        <h1 className="lt-cover" style={{ marginTop: "1rem" }}>
          Analise seu site em
          <br />
          <em>segundos, de graça</em>
        </h1>
        <p className="lt-lede ls-hero-sub">
          Velocidade, SEO, Mobile, Imagens, Subpáginas e Analytics — relatório completo com
          linguagem simples.
        </p>

        <LandingForm />

        <div className="ls-features">
          {FEATURES.map((f) => (
            <div key={f.name} className="lt-card ls-feature">
              <div className="ls-feature-icon">{f.icon}</div>
              <div className="ls-feature-name">{f.name}</div>
              <div className="ls-feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
