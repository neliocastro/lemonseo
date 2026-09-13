import Link from "next/link";
import { SitemapCheckPanel } from "@/components/SitemapCheckPanel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Relatório de sitemap | Admin | LemonSEO",
  robots: { index: false, follow: false },
};

export default function SitemapPage() {
  return (
    <section>
      <Link href="/admin/ferramentas" className="lt-body" style={{ display: "inline-block", marginBottom: "1rem" }}>
        ← Ferramentas
      </Link>
      <SitemapCheckPanel />
    </section>
  );
}
