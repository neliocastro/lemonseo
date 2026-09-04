import type * as cheerio from "cheerio";

export interface SemanticsResult {
  totalWords: number;
  paragraphCount: number;
  avgCharsPerParagraph: number;
  readability: "Boa" | "Média" | "Difícil";
  topWords: { word: string; count: number; pct: number }[];
}

const STOPWORDS = new Set([
  "de", "a", "o", "que", "e", "do", "da", "em", "um", "para", "com", "não", "uma", "os",
  "no", "se", "na", "por", "mais", "as", "dos", "como", "mas", "ao", "ele", "das", "seu",
  "sua", "ou", "quando", "muito", "nos", "já", "eu", "também", "só", "pelo", "pela", "até",
  "isso", "ela", "entre", "depois", "sem", "mesmo", "aos", "seus", "quem", "nas", "me",
  "esse", "eles", "você", "essa", "num", "nem", "suas", "meu", "às", "minha", "numa",
  "the", "and", "of", "to", "in", "is", "for", "on", "with", "your", "you", "it", "are",
]);

export function analyzeSemantics($: cheerio.CheerioAPI): SemanticsResult {
  const paragraphs = $("p")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter((t) => t.length > 0);

  const fullText = paragraphs.join(" ") || $("body").text();
  const words = fullText
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .split(/\s+/)
    .filter(Boolean);

  const totalWords = words.length;
  const paragraphCount = paragraphs.length;
  const avgCharsPerParagraph =
    paragraphCount > 0 ? Math.round(paragraphs.reduce((s, p) => s + p.length, 0) / paragraphCount) : 0;

  const freq = new Map<string, number>();
  for (const w of words) {
    if (w.length < 4 || STOPWORDS.has(w)) continue;
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  const topWords = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count, pct: totalWords > 0 ? Math.round((count / totalWords) * 10000) / 100 : 0 }));

  let readability: SemanticsResult["readability"] = "Boa";
  if (avgCharsPerParagraph > 600) readability = "Difícil";
  else if (avgCharsPerParagraph > 350) readability = "Média";

  return { totalWords, paragraphCount, avgCharsPerParagraph, readability, topWords };
}
