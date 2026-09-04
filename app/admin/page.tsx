import Link from "next/link";
import { listLeads, listReports } from "@/lib/store";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin | LemonSEO",
  robots: { index: false, follow: false },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR");
}

export default async function AdminPage() {
  const [leads, reports] = await Promise.all([listLeads(), listReports()]);
  const sortedLeads = [...leads].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div style={{ minHeight: "100vh" }}>
      <header className="ls-header">
        <Link href="/" className="ls-header-logo">
          🍋 LemonSEO
        </Link>
        <span className="ls-header-site">🔒 Admin</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: ".6rem" }}>
          <ThemeToggle />
          <AdminLogoutButton />
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem" }}>
        <section className="lt-card" style={{ marginBottom: "1.5rem" }}>
          <h3>Leads capturados ({sortedLeads.length})</h3>
          {sortedLeads.length === 0 ? (
            <p className="lt-body" style={{ marginTop: ".75rem" }}>
              Nenhum lead registrado ainda.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="lt-table" style={{ marginTop: "1rem" }}>
                <thead>
                  <tr>
                    <th>Site</th>
                    <th>Canal</th>
                    <th>Contato</th>
                    <th>Data</th>
                    <th>Relatório</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLeads.map((lead) => (
                    <tr key={lead.id}>
                      <td>{lead.url}</td>
                      <td>{lead.canal === "email" ? "📩 E-mail" : "💬 WhatsApp"}</td>
                      <td>{lead.email || "—"}</td>
                      <td>{formatDate(lead.createdAt)}</td>
                      <td>
                        <Link href={`/analise/${lead.reportSlug}`} className="lt-btn lt-btn-ghost" style={{ padding: ".35rem .8rem", fontSize: ".78rem" }}>
                          Ver relatório
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="lt-card">
          <h3>Relatórios gerados ({reports.length})</h3>
          {reports.length === 0 ? (
            <p className="lt-body" style={{ marginTop: ".75rem" }}>
              Nenhuma análise realizada ainda.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="lt-table" style={{ marginTop: "1rem" }}>
                <thead>
                  <tr>
                    <th>Site</th>
                    <th>Nota</th>
                    <th>Data</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.slug} className={report.overallScore < 4 ? "critical" : ""}>
                      <td>{report.finalUrl}</td>
                      <td className="lt-tool">{report.overallScore.toFixed(1)}/10</td>
                      <td>{formatDate(report.createdAt)}</td>
                      <td>
                        <Link href={`/analise/${report.slug}`} className="lt-btn lt-btn-ghost" style={{ padding: ".35rem .8rem", fontSize: ".78rem" }}>
                          Abrir
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
