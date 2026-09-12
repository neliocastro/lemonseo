import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, isValidAdminCookie } from "@/lib/adminAuth";
import { updateLeadStatus, type LeadStatus } from "@/lib/store";

const VALID_STATUSES: LeadStatus[] = ["novo", "contatado", "convertido", "descartado"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isValidAdminCookie(req.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const status = body.status as LeadStatus;

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Status inválido." }, { status: 400 });
  }

  const updated = await updateLeadStatus(id, status);
  if (!updated) {
    return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ success: true, lead: updated });
}
