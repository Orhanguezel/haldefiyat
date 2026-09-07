import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/db/client";
import { comparisonIssue, type RunEvidence } from "./comparison";
import { detectSocialRef } from "./social-handle";
import { domainOf } from "./serp-bing";
import { ourHost } from "./discovery";

type Row = RowDataPacket & Record<string, unknown>;

export async function getLatestRun(): Promise<Row | null> {
  const [rows] = await pool.query<Row[]>("SELECT * FROM hf_competitor_serp_runs ORDER BY id DESC LIMIT 1");
  return rows?.[0] ?? null;
}

export async function listRuns(limit = 12): Promise<Row[]> {
  const [rows] = await pool.query<Row[]>("SELECT * FROM hf_competitor_serp_runs ORDER BY id DESC LIMIT ?", [limit]);
  return rows ?? [];
}

/**
 * Alan adi bazinda toplam: kac sorguda goruldu, ortalama/en iyi pozisyon, ilk 3'te kac kez,
 * kac sorguda bizden onde. Izlenen sitelerle eslesme url host'una gore.
 */
export async function discoveryDomains(runId: number): Promise<Row[]> {
  const ours = ourHost();
  const [rows] = await pool.query<Row[]>(
    `WITH our_pos AS (
       SELECT query, MIN(position) AS pos FROM hf_competitor_serp_results WHERE run_id = ? AND is_ours = 1 GROUP BY query
     ),
     best AS (
       SELECT r.domain, r.query, MIN(r.position) AS pos, MAX(r.query_impressions) AS impressions
       FROM hf_competitor_serp_results r WHERE r.run_id = ? AND r.is_ours = 0 GROUP BY r.domain, r.query
     )
     SELECT b.domain,
            COUNT(*)                                        AS queries,
            ROUND(AVG(b.pos), 1)                            AS avg_position,
            MIN(b.pos)                                      AS best_position,
            SUM(b.pos <= 3)                                 AS top3,
            SUM(b.pos <= 10)                                AS page1,
            SUM(o.pos IS NULL OR b.pos < o.pos)             AS ahead_of_us,
            SUM(b.impressions)                              AS impressions,
            (SELECT title FROM hf_competitor_serp_results t WHERE t.run_id = ? AND t.domain = b.domain ORDER BY t.position LIMIT 1) AS sample_title,
            (SELECT url FROM hf_competitor_serp_results t WHERE t.run_id = ? AND t.domain = b.domain ORDER BY t.position LIMIT 1)   AS sample_url,
            0 AS tracked
     FROM best b LEFT JOIN our_pos o ON o.query = b.query
     GROUP BY b.domain
     ORDER BY queries DESC, avg_position ASC`,
    [runId, runId, runId, runId],
  );
  const [sites] = await pool.query<Row[]>("SELECT url FROM hf_competitor_sites");
  const tracked = new Set(sites.map(s => domainOf(String(s.url))).filter(Boolean));
  return (rows ?? []).filter(r => !detectSocialRef(String(r.sample_url))).map((r) => ({ ...r, tracked: tracked.has(String(r.domain)) ? 1 : 0, isOurs: r.domain === ours }));
}

/** Sorgu bazinda: bizim pozisyonumuz, GSC gosterim/tiklama, ilk 5 alan adi. */
export async function discoveryQueries(runId: number): Promise<Row[]> {
  const [rows] = await pool.query<Row[]>(
    `SELECT r.query,
            MAX(r.query_impressions) AS impressions,
            MAX(r.query_clicks)      AS clicks,
            MIN(CASE WHEN r.is_ours = 1 THEN r.position END) AS our_position,
            COUNT(*)                 AS results,
            SUBSTRING_INDEX(GROUP_CONCAT(DISTINCT CASE WHEN r.is_ours = 0 THEN r.domain END ORDER BY r.position SEPARATOR ','), ',', 5) AS top_domains
     FROM hf_competitor_serp_results r WHERE r.run_id = ?
     GROUP BY r.query ORDER BY impressions DESC, r.query`,
    [runId],
  );
  return rows ?? [];
}

export async function discoveryQueryResults(runId: number, query: string): Promise<Row[]> {
  const [rows] = await pool.query<Row[]>(
    "SELECT position, actual_engine, page, url, domain, title, snippet, is_ours FROM hf_competitor_serp_results WHERE run_id = ? AND query = ? ORDER BY position",
    [runId, query],
  );
  return rows ?? [];
}

export async function discoveryDomainResults(runId: number, domain: string): Promise<Row[]> {
  const [rows] = await pool.query<Row[]>(
    `WITH ranked AS (
       SELECT r.*, ROW_NUMBER() OVER (PARTITION BY r.query ORDER BY r.position, r.id) AS rn
       FROM hf_competitor_serp_results r WHERE r.run_id = ? AND r.domain = ?
     ) SELECT r.query, r.position, r.actual_engine, r.url, r.title, r.query_impressions AS impressions,
       (SELECT MIN(o.position) FROM hf_competitor_serp_results o WHERE o.run_id = r.run_id AND o.query = r.query AND o.is_ours = 1) AS our_position
       FROM ranked r WHERE r.rn = 1 ORDER BY r.position, r.query`,
    [runId, domain],
  );
  return rows ?? [];
}

/** Social accounts/content and audience groups remain separate from web domains. */
export async function discoverySocial(runId: number) {
  const [rows] = await pool.query<Row[]>("SELECT query, position, url, title FROM hf_competitor_serp_results WHERE run_id = ? ORDER BY position, query", [runId]);
  return rows.flatMap(r => {
    const ref = detectSocialRef(String(r.url));
    return ref && ref.kind !== "platform_page" ? [{ ...r, ...ref }] : [];
  });
}

/** Compare complete runs with matching observed engine, depth and query set. */
export async function discoveryDelta(runId: number) {
  const empty = (reason: string) => ({ appeared: [] as string[], disappeared: [] as string[], previousRunId: null, reason });
  const [runs] = await pool.query<(Row & RunEvidence)[]>(`
    SELECT r.*, COUNT(DISTINCT s.actual_engine) actual_engines,
      SUM(s.actual_engine IS NULL) unknown_engines, MIN(s.actual_engine) actual_engine,
      COUNT(DISTINCT s.query) query_count
    FROM hf_competitor_serp_runs r LEFT JOIN hf_competitor_serp_results s ON s.run_id=r.id
    WHERE r.id <= ? GROUP BY r.id ORDER BY r.id DESC`, [runId]);
  const c = runs.find(r => Number(r.id) === runId);
  const issue = comparisonIssue(c);
  if (issue || !c) return empty(issue ?? 'Tarama bulunamadı.');
  for (const prev of runs) {
    if (Number(prev.id) >= runId || comparisonIssue(prev) || Number(prev.depth) !== Number(c.depth) || prev.actual_engine !== c.actual_engine) continue;
    const previousRunId = Number(prev.id);
    const [sets] = await pool.query<Row[]>("SELECT query FROM hf_competitor_serp_results WHERE run_id IN (?, ?) GROUP BY query HAVING COUNT(DISTINCT run_id) <> 2", [runId, previousRunId]);
    if (sets.length) continue;
    const [rows] = await pool.query<Row[]>(`
      SELECT domain, SUM(run_id = ?) now_n, SUM(run_id = ?) prev_n
      FROM hf_competitor_serp_results WHERE run_id IN (?, ?) AND is_ours = 0 GROUP BY domain`,
      [runId, previousRunId, runId, previousRunId]);
    const web = rows.filter(r => !detectSocialRef('https://' + r.domain));
    return {
      appeared: web.filter(r => Number(r.now_n) > 0 && Number(r.prev_n) === 0).map(r => String(r.domain)),
      disappeared: web.filter(r => Number(r.now_n) === 0 && Number(r.prev_n) > 0).map(r => String(r.domain)),
      previousRunId, reason: null,
    };
  }
  return empty('Aynı sorgu kümesi, derinlik ve doğrulanmış motorla tamamlanmış önceki tarama yok.');
}
