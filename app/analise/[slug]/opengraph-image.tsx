import { ImageResponse } from "next/og";
import { getReport } from "@/lib/store";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const report = await getReport(slug);

  const score = report?.overallScore ?? 0;
  const ringColor = score < 4 ? "#FF6F61" : "#D2F5A3";
  let host = "lemonseo.com.br";
  try {
    host = report ? new URL(report.finalUrl).hostname : host;
  } catch {}

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#242F35",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, position: "absolute", top: 56, left: 64 }}>
          <div style={{ fontSize: 44 }}>🍋</div>
          <div style={{ fontSize: 32, color: "#fff", fontWeight: 700 }}>LemonSEO</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              width: 280,
              height: 280,
              borderRadius: "50%",
              border: `14px solid ${ringColor}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(210,245,163,0.06)",
            }}
          >
            <div style={{ display: "flex", fontSize: 96, fontWeight: 800, color: "#fff" }}>{score.toFixed(1)}</div>
            <div style={{ display: "flex", fontSize: 26, color: ringColor, fontWeight: 600 }}>/10</div>
          </div>
          <div style={{ display: "flex", marginTop: 40, fontSize: 34, color: "#fff", fontWeight: 700 }}>{host}</div>
          <div style={{ display: "flex", marginTop: 10, fontSize: 22, color: "#9CA9AD" }}>
            Análise gratuita de SEO e Performance
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
