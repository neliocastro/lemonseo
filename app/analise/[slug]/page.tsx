import Link from "next/link";
import { getReport } from "@/lib/store";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ResultView } from "@/components/ResultView";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const report = await getReport(slug);
  return {
    title: report ? `Análise SEO — ${report.finalUrl} | LemonSEO` : "Relatório não encontrado | LemonSEO",
    robots: { index: false, follow: false },
  };
}

export default async function AnalisePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const report = await getReport(slug);

  if (!report) {
    return (
      <>
        <Header />
        <main className="ls-error-box lt-card">
          <div style={{ fontSize: "2.2rem", marginBottom: ".5rem" }}>⚠️</div>
          <h2 className="lt-title-sm">Relatório não encontrado</h2>
          <p className="lt-body" style={{ margin: "1rem 0" }}>
            Esse link pode ter expirado ou o relatório não existe mais.
          </p>
          <Link href="/" className="lt-btn lt-btn-primary">
            ← Analisar outro site
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header site={report.finalUrl} />
      <ResultView report={report} />
      <Footer />
    </>
  );
}
