/**
 * TCMB EVDS API client.
 *
 * Endpoint: https://evds2.tcmb.gov.tr/service/evds/series=<CODE>&startDate=DD-MM-YYYY&endDate=DD-MM-YYYY&type=json
 * Auth: HTTP header `key: <EVDS_API_KEY>` (ücretsiz, https://evds2.tcmb.gov.tr/ kaydı ile alınır)
 *
 * Seriler (varsayilan):
 *   - TUFE Genel:          TP.FE.OKTG01
 *   - TUFE Gida grubu:     TP.FE.OKTG02
 *   - Yi-UFE Genel:        TP.UFE.OKTG01
 */

import { env } from "@/core/env";

export const EVDS_SERIES = {
  tufe_genel: "TP.FE.OKTG01",
  tufe_gida:  "TP.FE.OKTG02",
  ufe_genel:  "TP.UFE.OKTG01",
} as const;

export type EvdsIndicator = keyof typeof EVDS_SERIES;

export interface EvdsItem {
  periodYear: number;
  periodMonth: number;
  value: number | null;
}

interface EvdsRawItem {
  Tarih?: string;
  [key: string]: string | number | undefined;
}

interface EvdsRawResponse {
  items?: EvdsRawItem[];
  totalCount?: number;
}

function fmtDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getFullYear()}`;
}

function parsePeriod(raw: string | undefined): { year: number; month: number } | null {
  // Tarih formati "YYYY-M" veya "YYYY-MM" gelir
  if (!raw) return null;
  const m = /^(\d{4})-(\d{1,2})$/.exec(raw.trim());
  if (!m) return null;
  const year = parseInt(m[1]!, 10);
  const month = parseInt(m[2]!, 10);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
  return { year, month };
}

function valueKeyFor(seriesCode: string): string {
  // TP.FE.OKTG01 → TP_FE_OKTG01 (EVDS yanıtında nokta yerine alt çizgi)
  return seriesCode.replace(/\./g, "_");
}

/**
 * EVDS'den son N ay icin tek bir seri cek. API key yoksa null doner.
 */
export async function fetchEvdsSeries(
  indicator: EvdsIndicator,
  monthsBack = 36,
): Promise<EvdsItem[] | null> {
  const apiKey = env.EVDS_API_KEY;
  if (!apiKey) {
    console.warn("[evds] EVDS_API_KEY tanimli degil, cagri atlandi");
    return null;
  }

  const seriesCode = EVDS_SERIES[indicator];
  const valueKey = valueKeyFor(seriesCode);

  const end = new Date();
  const start = new Date(end);
  start.setMonth(start.getMonth() - monthsBack);

  const url = `https://evds2.tcmb.gov.tr/service/evds/series=${encodeURIComponent(seriesCode)}&startDate=${fmtDate(start)}&endDate=${fmtDate(end)}&type=json&frequency=5`;

  const res = await fetch(url, { headers: { key: apiKey } });
  if (!res.ok) {
    console.warn(`[evds] ${indicator} HTTP ${res.status}`);
    return null;
  }

  const data = (await res.json()) as EvdsRawResponse;
  const items = data.items ?? [];
  const out: EvdsItem[] = [];
  for (const it of items) {
    const period = parsePeriod(it.Tarih);
    if (!period) continue;
    const raw = it[valueKey];
    const value = raw === null || raw === undefined || raw === "" ? null : Number(raw);
    out.push({
      periodYear: period.year,
      periodMonth: period.month,
      value: Number.isFinite(value as number) ? (value as number) : null,
    });
  }
  // Tarihe gore artan
  out.sort((a, b) => (a.periodYear - b.periodYear) || (a.periodMonth - b.periodMonth));
  return out;
}
