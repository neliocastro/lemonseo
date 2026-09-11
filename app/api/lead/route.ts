import { NextRequest, NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import { findLeadByReportSlug, getReport, registerLeadContact, saveLead } from "@/lib/store";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 10);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const slug = typeof body.slug === "string" ? body.slug : "";
    const canal = body.canal === "whatsapp" ? "whatsapp" : "email";
    const email = typeof body.email === "string" ? body.email.trim() : undefined;

    if (!slug) {
      return NextResponse.json({ error: "Relatório inválido." }, { status: 400 });
    }
    const report = await getReport(slug);
    if (!report) {
      return NextResponse.json({ error: "Relatório não encontrado." }, { status: 404 });
    }
    if (canal === "email" && !email) {
      return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
    }

    // Toda consulta já criou um lead automático (POST /api/analyze). Aqui só
    // enriquecemos esse mesmo registro com o contato espontâneo — não
    // duplicamos o lead. O fallback abaixo cobre relatórios antigos, gerados
    // antes dessa automação existir.
    const existingLead = await findLeadByReportSlug(slug);
    if (existingLead) {
      await registerLeadContact(existingLead.id, { canal, email });
    } else {
      await saveLead({
        id: nanoid(),
        reportSlug: slug,
        url: report.finalUrl,
        canal,
        email,
        createdAt: new Date().toISOString(),
        status: "novo",
        interactions: [],
      });
    }

    // TODO: quando RESEND_API_KEY estiver configurada, disparar aqui o e-mail
    // transacional com o relatório (para o lead) e a notificação interna de
    // novo lead (para o dono do LemonSEO). Ver passo 7 do plano.

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao registrar contato." }, { status: 500 });
  }
}
