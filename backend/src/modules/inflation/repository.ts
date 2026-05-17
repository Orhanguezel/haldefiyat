import { db } from "@/db/client";
import { hfInflationMonthly } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { fetchEvdsSeries, type EvdsIndicator } from "./evds-client";

export interface InflationRow {
  periodYear: number;
  periodMonth: number;
  indicator: EvdsIndicator;
  indexValue: number | null;
  yoyChangePct: number | null;
  momChangePct: number | null;
}

const INDICATORS: EvdsIndicator[] = ["tufe_genel", "tufe_gida", "ufe_genel"];

// EVDS'ten bir seriyi cek + yoy/mom hesapla + DB'ye upsert
async function syncOne(indicator: EvdsIndicator): Promise<number> {
  const items = await fetchEvdsSeries(indicator, 36);
  if (!items || items.length === 0) return 0;

  let inserted = 0;
  for (let i = 0; i < items.length; i++) {
    const cur = items[i]!;
    if (cur.value === null) continue;

    // Onceki ay
    const prev = items[i - 1];
    const momPct = prev?.value != null && prev.value > 0
      ? ((cur.value - prev.value) / prev.value) * 100
      : null;

    // Gecen yilin ayni ayi (12 onceki nokta)
    const yoy = items[i - 12];
    const yoyPct = yoy?.value != null && yoy.value > 0
      ? ((cur.value - yoy.value) / yoy.value) * 100
      : null;

    await db
      .insert(hfInflationMonthly)
      .values({
        periodYear:    cur.periodYear,
        periodMonth:   cur.periodMonth,
        indicator,
        indexValue:    cur.value.toFixed(4),
        yoyChangePct:  yoyPct != null ? yoyPct.toFixed(4) : null,
        momChangePct:  momPct != null ? momPct.toFixed(4) : null,
        sourceApi:     "tcmb_evds",
      })
      .onDuplicateKeyUpdate({
        set: {
          indexValue:    cur.value.toFixed(4),
          yoyChangePct:  yoyPct != null ? yoyPct.toFixed(4) : null,
          momChangePct:  momPct != null ? momPct.toFixed(4) : null,
        },
      });
    inserted++;
  }
  return inserted;
}

// Tum gostergeleri sync et
export async function syncInflation(): Promise<{ indicator: string; rows: number }[]> {
  const results: { indicator: string; rows: number }[] = [];
  for (const ind of INDICATORS) {
    const rows = await syncOne(ind);
    results.push({ indicator: ind, rows });
  }
  return results;
}

// Son N ay tum gosterge satirlari (public/admin icin)
export async function listInflation(monthsBack = 13): Promise<InflationRow[]> {
  const rows = await db
    .select()
    .from(hfInflationMonthly)
    .orderBy(desc(hfInflationMonthly.periodYear), desc(hfInflationMonthly.periodMonth))
    .limit(monthsBack * INDICATORS.length);

  return rows.map((r) => ({
    periodYear:   r.periodYear,
    periodMonth:  r.periodMonth,
    indicator:    r.indicator as EvdsIndicator,
    indexValue:   r.indexValue != null ? Number(r.indexValue) : null,
    yoyChangePct: r.yoyChangePct != null ? Number(r.yoyChangePct) : null,
    momChangePct: r.momChangePct != null ? Number(r.momChangePct) : null,
  }));
}

// Manuel aylik veri ekleme/guncelleme — EVDS otomasyonu calismadiginda kullanilir
export interface ManualInflationInput {
  periodYear: number;
  periodMonth: number;
  indicator: EvdsIndicator;
  indexValue?: number | null;
  yoyChangePct?: number | null;
  momChangePct?: number | null;
}

export async function upsertManualInflation(input: ManualInflationInput): Promise<void> {
  await db
    .insert(hfInflationMonthly)
    .values({
      periodYear:    input.periodYear,
      periodMonth:   input.periodMonth,
      indicator:     input.indicator,
      indexValue:    input.indexValue != null ? input.indexValue.toFixed(4) : null,
      yoyChangePct:  input.yoyChangePct != null ? input.yoyChangePct.toFixed(4) : null,
      momChangePct:  input.momChangePct != null ? input.momChangePct.toFixed(4) : null,
      sourceApi:     "manual",
    })
    .onDuplicateKeyUpdate({
      set: {
        indexValue:    input.indexValue != null ? input.indexValue.toFixed(4) : null,
        yoyChangePct:  input.yoyChangePct != null ? input.yoyChangePct.toFixed(4) : null,
        momChangePct:  input.momChangePct != null ? input.momChangePct.toFixed(4) : null,
        sourceApi:     "manual",
      },
    });
}

// En son ay icin tek bir gosterge — urun sayfasi badge'i icin
export async function latestIndicator(indicator: EvdsIndicator): Promise<InflationRow | null> {
  const rows = await db
    .select()
    .from(hfInflationMonthly)
    .where(eq(hfInflationMonthly.indicator, indicator))
    .orderBy(desc(hfInflationMonthly.periodYear), desc(hfInflationMonthly.periodMonth))
    .limit(1);
  const r = rows[0];
  if (!r) return null;
  return {
    periodYear:   r.periodYear,
    periodMonth:  r.periodMonth,
    indicator:    r.indicator as EvdsIndicator,
    indexValue:   r.indexValue != null ? Number(r.indexValue) : null,
    yoyChangePct: r.yoyChangePct != null ? Number(r.yoyChangePct) : null,
    momChangePct: r.momChangePct != null ? Number(r.momChangePct) : null,
  };
}
