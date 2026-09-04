import { neon } from "@neondatabase/serverless";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import type { AnalysisReport } from "./types";

export interface Lead {
  id: string;
  reportSlug: string;
  url: string;
  canal: "email" | "whatsapp";
  email?: string;
  createdAt: string;
}

/**
 * Persistência: Postgres (Neon) quando DATABASE_URL está configurada —
 * é o caso em produção na Vercel. Sem essa variável (ex: `next dev` sem
 * `.env.local` preenchido), cai para JSON local em `data/`, só para não
 * travar o desenvolvimento antes de configurar o banco.
 */

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

let schemaReady: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  if (!sql) return Promise.resolve();
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS reports (
          slug TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS leads (
          id TEXT PRIMARY KEY,
          report_slug TEXT NOT NULL,
          data JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
    })();
  }
  return schemaReady;
}

export async function saveReport(report: AnalysisReport): Promise<void> {
  if (sql) {
    await ensureSchema();
    await sql`
      INSERT INTO reports (slug, data, created_at)
      VALUES (${report.slug}, ${JSON.stringify(report)}, ${report.createdAt})
      ON CONFLICT (slug) DO UPDATE SET data = EXCLUDED.data
    `;
    return;
  }
  const all = await readJsonFile<Record<string, AnalysisReport>>(REPORTS_FILE, {});
  all[report.slug] = report;
  await writeJsonFile(REPORTS_FILE, all);
}

export async function getReport(slug: string): Promise<AnalysisReport | null> {
  if (sql) {
    await ensureSchema();
    const rows = await sql`SELECT data FROM reports WHERE slug = ${slug}`;
    return (rows[0]?.data as AnalysisReport) ?? null;
  }
  const all = await readJsonFile<Record<string, AnalysisReport>>(REPORTS_FILE, {});
  return all[slug] ?? null;
}

export async function saveLead(lead: Lead): Promise<void> {
  if (sql) {
    await ensureSchema();
    await sql`
      INSERT INTO leads (id, report_slug, data, created_at)
      VALUES (${lead.id}, ${lead.reportSlug}, ${JSON.stringify(lead)}, ${lead.createdAt})
      ON CONFLICT (id) DO NOTHING
    `;
    return;
  }
  const all = await readJsonFile<Lead[]>(LEADS_FILE, []);
  all.push(lead);
  await writeJsonFile(LEADS_FILE, all);
}

export async function listLeads(): Promise<Lead[]> {
  if (sql) {
    await ensureSchema();
    const rows = await sql`SELECT data FROM leads ORDER BY created_at DESC`;
    return rows.map((r) => r.data as Lead);
  }
  return readJsonFile<Lead[]>(LEADS_FILE, []);
}

export async function listReports(): Promise<AnalysisReport[]> {
  if (sql) {
    await ensureSchema();
    const rows = await sql`SELECT data FROM reports ORDER BY created_at DESC`;
    return rows.map((r) => r.data as AnalysisReport);
  }
  const all = await readJsonFile<Record<string, AnalysisReport>>(REPORTS_FILE, {});
  return Object.values(all).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// --- Fallback em JSON local (apenas quando DATABASE_URL não está definida) ---

const DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), "lemonseo-data")
  : path.join(process.cwd(), "data");
const REPORTS_FILE = path.join(DATA_DIR, "reports.json");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");

async function ensureFile(file: string, initial: string) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(file);
  } catch {
    await fs.writeFile(file, initial, "utf-8");
  }
}

async function readJsonFile<T>(file: string, initial: T): Promise<T> {
  await ensureFile(file, JSON.stringify(initial));
  const raw = await fs.readFile(file, "utf-8");
  try {
    return JSON.parse(raw) as T;
  } catch {
    return initial;
  }
}

async function writeJsonFile<T>(file: string, data: T) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
}
