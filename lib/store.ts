import { promises as fs } from "fs";
import path from "path";
import type { AnalysisReport } from "./types";

/**
 * MVP: persistência em JSON local (data/reports.json, data/leads.json).
 * Funciona em `next dev` e num único processo de servidor.
 * Em produção na Vercel (serverless, filesystem efêmero) troque por
 * Postgres (Neon/Vercel Postgres) mantendo a mesma interface abaixo —
 * ver plano em ~/.claude/plans/analise-essa-pasta-seo-fluttering-fairy.md.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const REPORTS_FILE = path.join(DATA_DIR, "reports.json");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");

export interface Lead {
  id: string;
  reportSlug: string;
  url: string;
  canal: "email" | "whatsapp";
  email?: string;
  createdAt: string;
}

async function ensureFile(file: string, initial: string) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(file);
  } catch {
    await fs.writeFile(file, initial, "utf-8");
  }
}

async function readJson<T>(file: string, initial: T): Promise<T> {
  await ensureFile(file, JSON.stringify(initial));
  const raw = await fs.readFile(file, "utf-8");
  try {
    return JSON.parse(raw) as T;
  } catch {
    return initial;
  }
}

async function writeJson<T>(file: string, data: T) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
}

export async function saveReport(report: AnalysisReport): Promise<void> {
  const all = await readJson<Record<string, AnalysisReport>>(REPORTS_FILE, {});
  all[report.slug] = report;
  await writeJson(REPORTS_FILE, all);
}

export async function getReport(slug: string): Promise<AnalysisReport | null> {
  const all = await readJson<Record<string, AnalysisReport>>(REPORTS_FILE, {});
  return all[slug] ?? null;
}

export async function saveLead(lead: Lead): Promise<void> {
  const all = await readJson<Lead[]>(LEADS_FILE, []);
  all.push(lead);
  await writeJson(LEADS_FILE, all);
}

export async function listLeads(): Promise<Lead[]> {
  return readJson<Lead[]>(LEADS_FILE, []);
}

export async function listReports(): Promise<AnalysisReport[]> {
  const all = await readJson<Record<string, AnalysisReport>>(REPORTS_FILE, {});
  return Object.values(all).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
