import type { Metadata } from "next";
import { Funnel_Display, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const funnelDisplay = Funnel_Display({
  variable: "--font-funnel-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "LemonSEO — Analise seu site em segundos",
  description:
    "Analise seu site em segundos: velocidade, SEO, mobile, imagens, subpáginas e analytics. Relatório completo em linguagem simples, de graça.",
  openGraph: {
    title: "LemonSEO — Analise seu site em segundos",
    description:
      "Descubra em segundos o que está impedindo seu site de performar bem no Google.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${funnelDisplay.variable} ${manrope.variable} ${jetbrainsMono.variable}`}
    >
      <body className="lt-theme">{children}</body>
    </html>
  );
}
