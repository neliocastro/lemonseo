import Link from "next/link";
import { LinkCheckPanel } from "@/components/LinkCheckPanel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rastreador de links quebrados | Admin | LemonSEO",
  robots: { index: false, follow: false },
};

export default function LinksQuebradosPage() {
  return (
    <section>
      <Link href="/admin/ferramentas" className="lt-body" style={{ display: "inline-block", marginBottom: "1rem" }}>
        ← Ferramentas
      </Link>
      <LinkCheckPanel />
    </section>
  );
}
