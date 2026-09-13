import Link from "next/link";
import { listLeads, listReports } from "@/lib/store";
import { ChatIcon, LetterIcon, GlobeIcon } from "@/components/icons";
import { LeadStatusSelect } from "@/components/LeadStatusSelect";
import { LeadDeleteButton } from "@/components/LeadDeleteButton";
import { CommercialEmailButton } from "@/components/CommercialEmailButton";
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
    <>
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
                  <th>Status</th>
                  <th>Data</th>
                  <th>Relatório</th>
                  <th>E-mail comercial</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sortedLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td>{lead.url}</td>
                    <td style={{ display: "flex", alignItems: "center", gap: ".4rem" }}>
                      {lead.canal === "email" && <LetterIcon size={14} />}
                      {lead.canal === "whatsapp" && <ChatIcon size={14} />}
                      {lead.canal === "auto" && <GlobeIcon size={14} />}
                      {lead.canal === "email" && "E-mail"}
                      {lead.canal === "whatsapp" && "WhatsApp"}
                      {lead.canal === "auto" && "Consulta pública"}
                    </td>
                    <td>
                      {lead.email ? (
                        lead.email
                      ) : lead.scrapedEmails && lead.scrapedEmails.length > 0 ? (
                        <span title="Encontrado pelo scraper no site do lead">
                          🔍 {lead.scrapedEmails[0].email}
                          {lead.scrapedEmails.length > 1 && ` +${lead.scrapedEmails.length - 1}`}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <LeadStatusSelect leadId={lead.id} status={lead.status ?? "novo"} />
                    </td>
                    <td>{formatDate(lead.createdAt)}</td>
                    <td>
                      <Link href={`/analise/${lead.reportSlug}`} className="lt-btn lt-btn-ghost" style={{ padding: ".35rem .8rem", fontSize: ".78rem" }}>
                        Ver relatório
                      </Link>
                    </td>
                    <td>
                      <CommercialEmailButton leadId={lead.id} />
                    </td>
                    <td>
                      <LeadDeleteButton leadId={lead.id} leadUrl={lead.url} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="lt-card" style={{ marginTop: "1.5rem" }}>
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
    </>
  );
}
