import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile, appendFile } from "node:fs/promises";
import { join } from "node:path";
import { PILOT_VERSION, RETAIL_PILOT_QUERIES, retailDay } from "./retail-pilot";

type KeywordState = { completedDay?: string; nextDueAt?: string; emptyStreak?: number; lastError?: string };
export type PilotState = { version: number; startedAt: string; keywords: Record<string, KeywordState> };
export const pilotDirectory = () => process.env.RETAIL_PILOT_DATA_DIR || join(process.cwd(), "var", "retail-pilot");
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
async function atomicJson(path: string, value: unknown) {
  const tmp = `${path}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(value), { mode: 0o600 });
  await rename(tmp, path);
}
export function duePilotQueries(state: PilotState, now: Date, limit = 8) {
  return RETAIL_PILOT_QUERIES.filter((keyword) => {
    const item = state.keywords[keyword];
    return item?.completedDay !== retailDay(now) && (!item?.nextDueAt || Date.parse(item.nextDueAt) <= now.getTime());
  }).slice(0, Math.max(1, Math.min(8, limit)));
}

/** Protected by the ETL's database advisory lock; raw pages survive process restarts. */
export class RetailPilotStore {
  state!: PilotState;
  cachedPages = 0;
  constructor(readonly directory = pilotDirectory(), readonly persist = true, readonly now = new Date()) {}
  async open() {
    if (this.persist) await mkdir(this.directory, { recursive: true, mode: 0o700 });
    try { this.state = JSON.parse(await readFile(join(this.directory, "state.json"), "utf8")); }
    catch (error: any) {
      if (error.code !== "ENOENT") throw error; // Corruption must never trigger a full duplicate crawl.
      this.state = { version: PILOT_VERSION, startedAt: this.now.toISOString(), keywords: {} };
    }
    if (this.state.version !== PILOT_VERSION) throw new Error("RETAIL_PILOT_VERSION_MISMATCH");
    return this;
  }
  async page<T>(keyword: string, page: number, fetchPage: () => Promise<{ data: T | null; calls: number; throttled: boolean; error?: string; unavailable?: boolean }>) {
    const folder = join(this.directory, "raw", retailDay(this.now));
    const path = join(folder, `${hash(keyword)}-${page}.json`);
    try {
      const saved = JSON.parse(await readFile(path, "utf8"));
      if (saved.sha256 !== hash(JSON.stringify(saved.data))) throw new Error("RETAIL_RAW_CHECKSUM_MISMATCH");
      this.cachedPages++;
      return { data: saved.data, calls: 0, throttled: false } as { data: T; calls: number; throttled: boolean; error?: string; unavailable?: boolean };
    } catch (error: any) { if (error.code !== "ENOENT") throw error; }
    const result = await fetchPage();
    if (result.data && this.persist) {
      await mkdir(folder, { recursive: true, mode: 0o700 });
      await atomicJson(path, { source: "marketfiyati", keyword, page, fetchedAt: new Date().toISOString(),
        sha256: hash(JSON.stringify(result.data)), data: result.data });
    }
    return result;
  }
  finish(keyword: string, products: number, error?: string) {
    const previous = this.state.keywords[keyword];
    const emptyStreak = error ? previous?.emptyStreak ?? 0 : products ? 0 : (previous?.emptyStreak ?? 0) + 1;
    this.state.keywords[keyword] = {
      completedDay: error ? previous?.completedDay : retailDay(this.now), emptyStreak,
      nextDueAt: new Date(this.now.getTime() + (error ? 2 * 3600_000 : products ? 0 : 3 * 86400_000)).toISOString(),
      ...(error ? { lastError: error } : {}),
    };
  }
  async observation(value: unknown) {
    if (!this.persist) return;
    const folder = join(this.directory, "observations", retailDay(this.now));
    await mkdir(folder, { recursive: true, mode: 0o700 });
    await atomicJson(join(folder, `${hash(JSON.stringify(value))}.json`), {
      observedAt: new Date().toISOString(), sha256: hash(JSON.stringify(value)), value,
    });
  }
  async html(url: string, fetchHtml: () => Promise<string | null>) {
    const path = join(this.directory, "raw", retailDay(this.now), `${hash(url)}.html.json`);
    try {
      const saved = JSON.parse(await readFile(path, "utf8"));
      if (saved.sha256 !== hash(saved.body)) throw new Error("RETAIL_RAW_CHECKSUM_MISMATCH");
      this.cachedPages++;
      return saved.body as string;
    } catch (error: any) { if (error.code !== "ENOENT") throw error; }
    const body = await fetchHtml();
    if (body && this.persist) {
      await mkdir(join(this.directory, "raw", retailDay(this.now)), { recursive: true, mode: 0o700 });
      await atomicJson(path, { source: "migros", url, fetchedAt: new Date().toISOString(), sha256: hash(body), body });
    }
    return body;
  }
  async snapshot(source: string, url: string, body: string) {
    if (!this.persist) return;
    const folder = join(this.directory, "raw", retailDay(this.now));
    await mkdir(folder, { recursive: true, mode: 0o700 });
    await atomicJson(join(folder, `${hash(`${source}:${url}:${body}`)}.json`), {
      source, url, fetchedAt: new Date().toISOString(), sha256: hash(body), body,
    });
  }
  async save(result: unknown, executionKind: "scheduled" | "manual") {
    if (!this.persist) return;
    await atomicJson(join(this.directory, "state.json"), this.state);
    await appendFile(join(this.directory, "runs.jsonl"), JSON.stringify({ at: new Date().toISOString(),
      day: retailDay(this.now), executionKind, version: PILOT_VERSION, result }) + "\n", { mode: 0o600 });
  }
}
