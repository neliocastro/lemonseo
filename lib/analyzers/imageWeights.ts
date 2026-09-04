import type { ImageEntry } from "./images";

const MAX_IMAGES_CHECKED = 15;
const REQUEST_TIMEOUT = 5000;

export interface ImageWithWeight extends ImageEntry {
  weightBytes: number | null;
  ok: boolean;
}

async function headSize(url: string): Promise<{ weightBytes: number | null; ok: boolean }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LemonSEOBot/1.0)" },
    });
    const len = res.headers.get("content-length");
    return { weightBytes: len ? parseInt(len, 10) : null, ok: res.ok };
  } catch {
    return { weightBytes: null, ok: false };
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchImageWeights(entries: ImageEntry[]): Promise<ImageWithWeight[]> {
  const checked = entries.slice(0, MAX_IMAGES_CHECKED);
  const rest = entries.slice(MAX_IMAGES_CHECKED);

  const withWeights = await Promise.all(
    checked.map(async (entry) => {
      const { weightBytes, ok } = await headSize(entry.src);
      return { ...entry, weightBytes, ok } satisfies ImageWithWeight;
    })
  );

  return [...withWeights, ...rest.map((e) => ({ ...e, weightBytes: null, ok: true }) satisfies ImageWithWeight)];
}
