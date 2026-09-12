import { NextRequest, NextResponse } from "next/server";
import { purgeExpiredReports } from "@/lib/store";

/**
 * Executada diariamente pelo Vercel Cron (ver vercel.json) em horário de baixo
 * tráfego para expurgar relatórios com mais de 120 dias. Protegida por
 * CRON_SECRET — o Vercel envia esse valor automaticamente como Bearer token
 * em cron jobs configurados via vercel.json.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }
  }

  const startedAt = Date.now();
  const { deletedCount, deletedSlugs, freedBytes } = await purgeExpiredReports();
  const durationMs = Date.now() - startedAt;

  console.log(
    JSON.stringify({
      event: "report_purge_run",
      deletedCount,
      deletedSlugs,
      freedBytes,
      durationMs,
      ranAt: new Date().toISOString(),
    })
  );

  return NextResponse.json({ success: true, deletedCount, freedBytes, durationMs });
}
