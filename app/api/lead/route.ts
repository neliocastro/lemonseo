import { NextRequest, NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import { getReport, saveLead } from "@/lib/store";

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

    await saveLead({
      id: nanoid(),
      reportSlug: slug,
      url: report.finalUrl,
      canal,
      email,
      createdAt: new Date().toISOString(),
    });

    // TODO: quando RESEND_API_KEY estiver configurada, disparar aqui o e-mail
    // transacional com o relatório (para o lead) e a notificação interna de
    // novo lead (para o dono do LemonSEO). Ver passo 7 do plano.

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao registrar contato." }, { status: 500 });
  }
}
