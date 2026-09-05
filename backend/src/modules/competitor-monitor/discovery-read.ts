import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/db/client";
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
            EXISTS(SELECT 1 FROM hf_competitor_sites s WHERE s.url LIKE CONCAT('%', b.domain, '%')) AS tracked
     FROM best b LEFT JOIN our_pos o ON o.query = b.query
     GROUP BY b.domain
     ORDER BY queries DESC, avg_position ASC`,
    [runId, runId, runId, runId],
  );
  return (rows ?? []).map((r) => ({ ...r, isOurs: r.domain === ours }));
}

/** Sorgu bazinda: bizim pozisyonumuz, GSC gosterim/tiklama, ilk 5 alan adi. */
export async function discoveryQueries(runId: number): Promise<Row[]> {
  const [rows] = await pool.query<Row[]>(
    `SELECT r.query,
            MAX(r.query_impressions) AS impressions,
            MAX(r.query_clicks)      AS clicks,
            MIN(CASE WHEN r.is_ours = 1 THEN r.position END) AS our_position,
            COUNT(*)                 AS results,
            SUBSTRING_INDEX(GROUP_CONCAT(CASE WHEN r.is_ours = 0 THEN r.domain END ORDER BY r.position SEPARATOR ','), ',', 5) AS top_domains
     FROM hf_competitor_serp_results r WHERE r.run_id = ?
     GROUP BY r.query ORDER BY impressions DESC, r.query`,
    [runId],
  );
  return rows ?? [];
}

export async function discoveryQueryResults(runId: number, query: string): Promise<Row[]> {
  const [rows] = await pool.query<Row[]>(
    "SELECT position, page, url, domain, title, snippet, is_ours FROM hf_competitor_serp_results WHERE run_id = ? AND query = ? ORDER BY position",
    [runId, query],
  );
  return rows ?? [];
}

export async function discoveryDomainResults(runId: number, domain: string): Promise<Row[]> {
  const [rows] = await pool.query<Row[]>(
    `SELECT r.query, r.position, r.url, r.title, r.query_impressions AS impressions,
            (SELECT MIN(o.position) FROM hf_competitor_serp_results o WHERE o.run_id = r.run_id AND o.query = r.query AND o.is_ours = 1) AS our_position
     FROM hf_competitor_serp_results r WHERE r.run_id = ? AND r.domain = ? ORDER BY r.position`,
    [runId, domain],
  );
  return rows ?? [];
}

/** Onceki kosuya gore yeni gorunen / kaybolan alan adlari. */
export async function discoveryDelta(runId: number): Promise<{ appeared: string[]; disappeared: string[]; previousRunId: number | null }> {
  const [prev] = await pool.query<Row[]>("SELECT id FROM hf_competitor_serp_runs WHERE id < ? AND status <> 'running' ORDER BY id DESC LIMIT 1", [runId]);
  const previousRunId = prev?.[0] ? Number(prev[0].id) : null;
  if (!previousRunId) return { appeared: [], disappeared: [], previousRunId: null };
  const [rows] = await pool.query<Row[]>(
    `SELECT domain, SUM(run_id = ?) AS now_n, SUM(run_id = ?) AS prev_n FROM hf_competitor_serp_results
     WHERE run_id IN (?, ?) AND is_ours = 0 GROUP BY domain`,
    [runId, previousRunId, runId, previousRunId],
  );
  const appeared = (rows ?? []).filter((r) => Number(r.now_n) > 0 && Number(r.prev_n) === 0).map((r) => String(r.domain));
  const disappeared = (rows ?? []).filter((r) => Number(r.now_n) === 0 && Number(r.prev_n) > 0).map((r) => String(r.domain));
  return { appeared, disappeared, previousRunId };
}
