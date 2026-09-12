import type { AnalysisReport, Problem, Severity } from "./types";

export interface CommercialEmailContent {
  subject: string;
  body: string;
}

const SEVERITY_ORDER: Record<Severity, number> = { alto: 0, medio: 1, baixo: 2 };
const MAX_PROBLEMS_LISTED = 5;

function topProblems(problems: Problem[]): Problem[] {
  return [...problems].sort((a, b) => SEVERITY_ORDER[a.severidade] - SEVERITY_ORDER[b.severidade]).slice(0, MAX_PROBLEMS_LISTED);
}

function siteLabel(finalUrl: string): string {
  return finalUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

/**
 * Monta um e-mail de abordagem comercial em linguagem simples (não técnica),
 * consolidando os principais problemas/oportunidades do diagnóstico. Texto
 * pronto para uso manual/externo — não há disparo automático aqui.
 */
export function buildCommercialEmail(report: AnalysisReport): CommercialEmailContent {
  const problems = topProblems(report.problems);
  const site = siteLabel(report.finalUrl);

  const subject =
    report.problems.length > 0
      ? `${site} — ${report.problems.length} ponto(s) para melhorar o posicionamento no Google`
      : `${site} — resultado da nossa análise de SEO`;

  const bullets = problems.length > 0
    ? problems.map((p) => `- ${p.titulo}: ${p.impacto}`).join("\n")
    : "- Nenhum problema crítico identificado — parabéns pelo trabalho já feito no site!";

  const body = `Olá!

Analisamos o site ${site} com o LemonSEO e identificamos oportunidades reais de melhoria na presença digital de vocês.

Nota geral: ${report.overallScore.toFixed(1)}/10

Principais pontos encontrados:
${bullets}

Esses fatores impactam diretamente como o Google — e ferramentas de IA como ChatGPT, Gemini e Copilot — enxergam e recomendam o site de vocês.

Podemos ajudar a corrigir esses pontos e elevar a nota para 10. Topam bater um papo rápido para entender melhor os objetivos de vocês?

Abraço,
Equipe LemonSEO`;

  return { subject, body };
}
