import Link from "next/link";
import { ADMIN_TOOLS } from "@/lib/adminTools";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ferramentas | Admin | LemonSEO",
  robots: { index: false, follow: false },
};

export default function AdminToolsIndexPage() {
  return (
    <section>
      <h2 className="lt-title-sm" style={{ marginBottom: "1.25rem" }}>
        Ferramentas
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1rem",
        }}
      >
        {ADMIN_TOOLS.map((tool) => (
          <Link
            key={tool.slug}
            href={tool.href}
            className="lt-card"
            style={{ display: "block", cursor: "pointer" }}
          >
            <h3>{tool.title}</h3>
            <p className="lt-body" style={{ marginTop: ".5rem" }}>
              {tool.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
