import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, isValidAdminCookie } from "@/lib/adminAuth";
import { getLead, getReport } from "@/lib/store";
import { generateCommercialEmailForLead } from "@/lib/commercialEmail";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isValidAdminCookie(req.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) {
    return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });
  }

  const report = await getReport(lead.reportSlug);
  if (!report) {
    return NextResponse.json({ error: "Relatório do lead não encontrado." }, { status: 404 });
  }

  return NextResponse.json(generateCommercialEmailForLead(lead, report));
}
