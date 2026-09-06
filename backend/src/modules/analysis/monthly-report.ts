/**
 * Aylik hal degerlendirmesi — haftalik raporun ayni taslak akisi, aylik pencerede.
 *
 * Haftalik rapor "bu hafta ne oldu" sorusunu cevapliyor; aylik rapor mevsim
 * gecisini ve ay boyu yonu anlatir. Ayni tabloyu (hf_analysis_reports) kullanir:
 * satirin aylik oldugu iso_week alanindaki "YYYY-Mmm" bicimiyle bellidir, sema
 * degismez.
 */
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { hfAnalysisReports, hfAuthors } from "@/db/schema";
import { repoGetSnapshotHistory } from "@/modules/index/repository";
import { weeklyPriceSummary, MIN_MOVER_MARKETS, type WeeklySummary } from "@/modules/prices/weekly";
import { INDEX_BASKET_SLUGS } from "@/modules/index/calculator";
import {
  MONTH_LABELS, MONTH_SLUGS, indexStatusOf, trNum, trPct, trPctSigned, trPeriod, trPriceUnit,
  type IndexPoint,
} from "./report-format";
import { esc, indexTable, moverTable } from "./report-html";

/** Ay basi ilk 5 gun ile ay sonu son 5 gun kiyaslanir: 2 gunluk pencere aylik yorumda gurultu. */
const MONTH_WINDOW_DAYS = 5;
const MIN_MONTH_RECORDS = 200;

export interface MonthRange {
  monthStart: string;
  monthEnd: string;
  monthKey: string;
  label: string;
  year: number;
  monthIndex: number;
}

/** Verilmezse GECEN ay: rapor ay bittikten sonra yazilir. */
export function resolveMonthRange(month?: string): MonthRange {
  const now = new Date();
  let year = now.getUTCFullYear();
  let monthIndex = now.getUTCMonth() - 1;
  const parsed = month?.match(/^(\d{4})-(\d{2})$/);
  if (parsed) {
    year = Number(parsed[1]);
    monthIndex = Number(parsed[2]) - 1;
  }
  if (monthIndex < 0) { monthIndex += 12; year -= 1; }
  const start = new Date(Date.UTC(year, monthIndex, 1, 12));
  const end = new Date(Date.UTC(year, monthIndex + 1, 0, 12));
  return {
    monthStart: start.toISOString().slice(0, 10),
    monthEnd: end.toISOString().slice(0, 10),
    monthKey: `${start.getUTCFullYear()}-M${String(monthIndex + 1).padStart(2, "0")}`,
    label: `${MONTH_LABELS[monthIndex]} ${start.getUTCFullYear()}`,
    year: start.getUTCFullYear(),
    monthIndex,
  };
}

export function isMonthlyReport(isoWeek: string | null | undefined): boolean {
  return !!isoWeek && /^\d{4}-M\d{2}$/.test(isoWeek);
}

function slugForMonth(range: MonthRange): string {
  return `${MONTH_SLUGS[range.monthIndex]}-${range.year}-aylik-hal-degerlendirmesi`;
}

function previousMonthOf(range: MonthRange): MonthRange {
  const previous = new Date(Date.UTC(range.year, range.monthIndex - 1, 1, 12));
  return resolveMonthRange(`${previous.getUTCFullYear()}-${String(previous.getUTCMonth() + 1).padStart(2, "0")}`);
}

/**
 * Sezon gecisi: bu ay kaydi olan ama gecen ay olmayan urunler (sezona giren) ve tersi.
 * Yorum degil olculen veri — "sezon basladi" cumlesi kaynaksiz kurulmaz.
 */
async function seasonShift(range: MonthRange, previous: MonthRange, limit = 8) {
  const rows = await db.execute(sql`
    SELECT p.slug AS slug,
           COALESCE(NULLIF(p.display_name, ''), p.name_tr) AS name,
           SUM(ph.recorded_date BETWEEN ${range.monthStart} AND ${range.monthEnd}) AS now_days,
           SUM(ph.recorded_date BETWEEN ${previous.monthStart} AND ${previous.monthEnd}) AS prev_days
    FROM hf_price_history ph
    JOIN hf_products p ON p.id = ph.product_id
    WHERE ph.recorded_date BETWEEN ${previous.monthStart} AND ${range.monthEnd}
      AND p.is_active = 1
    GROUP BY p.slug, name
    HAVING now_days >= 20 OR prev_days >= 20
  `);
  const list = (Array.isArray(rows) ? rows[0] : (rows as { rows?: unknown[] }).rows) as
    Array<{ slug: string; name: string; now_days: number; prev_days: number }> | undefined;
  const items = (list ?? []).map((row) => ({
    slug: String(row.slug),
    name: String(row.name || row.slug),
    now: Number(row.now_days || 0),
    prev: Number(row.prev_days || 0),
  }));
  return {
    entering: items.filter((item) => item.prev < 5 && item.now >= 20).slice(0, limit),
    leaving: items.filter((item) => item.now < 5 && item.prev >= 20).slice(0, limit),
  };
}

function categoryTable(summary: WeeklySummary): string {
  const rows = Object.entries(summary.avgByCategory)
    .filter(([, value]) => Number.isFinite(value) && value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  if (!rows.length) return "";
  const body = rows
    .map(([slug, value]) => `<tr><td>${esc(slug.replace(/-/g, " "))}</td><td>${trPriceUnit(value)}</td></tr>`)
    .join("\n");
  return `<table><thead><tr><th>Kategori</th><th>Ay ortalaması</th></tr></thead><tbody>\n${body}\n</tbody></table>`;
}

function seasonSection(shift: Awaited<ReturnType<typeof seasonShift>>): string {
  if (!shift.entering.length && !shift.leaving.length) return "";
  const parts: string[] = [`<h2>Sezon Değişimi</h2>`];
  if (shift.entering.length) {
    parts.push(`<p><strong>Bu ay tezgâha giren ürünler:</strong> `
      + shift.entering.map((item) => `${esc(item.name)} (${item.now} gün kayıt)`).join(", ") + ".</p>");
  }
  if (shift.leaving.length) {
    parts.push(`<p><strong>Sezonu kapanan ürünler:</strong> `
      + shift.leaving.map((item) => `${esc(item.name)} (geçen ay ${item.prev} gün kayıt, bu ay yok denecek kadar az)`).join(", ") + ".</p>");
  }
  parts.push(`<p class="note">Sezon değerlendirmesi yorum değil kayıt sayımıdır: bir ürünün kaç ayrı günde `
    + `hal listelerinde göründüğü sayılır. Kaynak yayınını kestiğinde de bu sayı düşer.</p>`);
  return parts.join("\n");
}

function buildMonthlyHtml(input: {
  range: MonthRange;
  summary: WeeklySummary;
  previousSummary: WeeklySummary | null;
  indexRows: IndexPoint[];
  status: ReturnType<typeof indexStatusOf>;
  monthOpenIndex: IndexPoint | null;
  monthCloseIndex: IndexPoint | null;
  shift: Awaited<ReturnType<typeof seasonShift>>;
}): string {
  const { range, summary, previousSummary } = input;
  const periodLabel = trPeriod(range.monthStart, range.monthEnd);
  const lead = [...summary.topFallers, ...summary.topRisers]
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))[0];

  const indexChangePct = input.monthOpenIndex && input.monthCloseIndex && input.monthOpenIndex.indexValue > 0
    ? ((input.monthCloseIndex.indexValue - input.monthOpenIndex.indexValue) / input.monthOpenIndex.indexValue) * 100
    : null;

  const dek: string[] = [];
  if (indexChangePct != null) {
    dek.push(`HaldeFiyat Endeksi ayı ${trNum(input.monthCloseIndex!.indexValue, 2)} puanda kapattı; `
      + `ay başına göre değişim <strong>${trPctSigned(indexChangePct)}</strong>.`);
  }
  if (lead) {
    dek.push(`Ayın en sert hareketi ${esc(lead.productName)} tarafında: ${lead.marketCount} halin ortalaması `
      + `<strong>${trPctSigned(lead.changePct)}</strong> değişti.`);
  }
  if (summary.breadth?.measured) {
    dek.push(`Ölçüt karşılayan ${summary.breadth.measured} üründe medyan değişim `
      + `${trPctSigned(summary.breadth.medianChangePct ?? 0)}.`);
  }

  const previousLine = previousSummary?.breadth?.measured
    ? `<p>Bir önceki ayda ölçüt karşılayan ${previousSummary.breadth.measured} üründe medyan değişim `
      + `${trPctSigned(previousSummary.breadth.medianChangePct ?? 0)} idi; ${previousSummary.breadth.up} ürün yükselmiş, `
      + `${previousSummary.breadth.down} ürün gerilemişti.</p>`
    : "";

  const sections = [
    `<p class="kicker">Aylık Hal Değerlendirmesi · ${esc(range.label)}</p>`,
    `<p class="dek">${dek.join(" ")}</p>`,
    `<div class="meta"><span><strong>Dönem:</strong> ${esc(periodLabel)}</span>`
      + `<span><strong>Kayıt:</strong> ${trNum(summary.totalRecords, 0)} fiyat gözlemi</span>`
      + `<span><strong>Ürün:</strong> ${trNum(summary.productCount, 0)}</span>`
      + `<span><strong>Kaynak sayısı:</strong> ${trNum(summary.marketCount, 0)} hal ve borsa</span></div>`,
    "",
    `<h2>Ayın Endeks Seyri</h2>`,
    input.indexRows.length
      ? indexTable(input.indexRows)
      : `<p>Bu ay için haftalık endeks hesabı oluşmadı; değerlendirme ürün ve hal kayıtları üzerinden yapıldı.</p>`,
    "",
    summary.topRisers.length ? `<h2>Ay Boyunca En Çok Yükselenler</h2>\n${moverTable(summary.topRisers)}` : "",
    "",
    summary.topFallers.length ? `<h2>Ay Boyunca En Çok Gerileyenler</h2>\n${moverTable(summary.topFallers)}` : "",
    "",
    summary.breadth?.measured
      ? `<h2>Piyasa Genişliği</h2>\n<p>Ölçüt karşılayan ${summary.breadth.measured} üründen `
        + `${summary.breadth.up} tanesi yükseldi, ${summary.breadth.down} tanesi geriledi, `
        + `${summary.breadth.flat} tanesi yatay kaldı. Medyan değişim ${trPctSigned(summary.breadth.medianChangePct ?? 0)}.</p>`
        + previousLine
      : "",
    "",
    categoryTable(summary) ? `<h2>Kategori Ortalamaları</h2>\n${categoryTable(summary)}` : "",
    "",
    seasonSection(input.shift),
    "",
    `<p class="note"><strong>Metodoloji:</strong> Değerlendirme, ${esc(periodLabel)} arasında `
      + `${trNum(summary.marketCount, 0)} kaynaktan derlenen ${trNum(summary.totalRecords, 0)} fiyat gözlemine dayanır. `
      + `Ay başındaki ilk ${MONTH_WINDOW_DAYS} gün ile ay sonundaki son ${MONTH_WINDOW_DAYS} günün her-hal ortalamaları `
      + `karşılaştırılır; ulusal değer haller arası medyandır. En az ${MIN_MOVER_MARKETS} ayrı halde görülen kilogram `
      + `bazlı ürünler değerlendirmeye girer. HaldeFiyat Endeksi ${INDEX_BASKET_SLUGS.length} üründen oluşan sabit sepeti izler. `
      + `Fiyatlar toptan hal seviyesidir, perakende etiketi değildir.</p>`,
  ];

  return sections.filter((part) => part != null).join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function buildSummaryText(range: MonthRange, summary: WeeklySummary, indexChangePct: number | null): string {
  const riser = summary.topRisers[0];
  const faller = summary.topFallers[0];
  const moves: string[] = [];
  if (faller) moves.push(`${faller.productName} ${trPct(faller.changePct)} geriledi`);
  if (riser) moves.push(`${riser.productName} ${trPct(riser.changePct)} yükseldi`);
  const movesText = moves.length ? moves.join("; ") : "belirgin bir ürün hareketi ölçülmedi";
  const indexText = indexChangePct != null
    ? ` HaldeFiyat Endeksi ay boyunca ${trPctSigned(indexChangePct)} değişti.`
    : "";
  const breadth = summary.breadth?.measured
    ? ` Ölçüt karşılayan ${summary.breadth.measured} üründe medyan değişim ${trPctSigned(summary.breadth.medianChangePct ?? 0)}.`
    : "";
  return `${range.label} ayında ${movesText}.${indexText}${breadth}`;
}

function buildTitle(range: MonthRange, summary: WeeklySummary, indexChangePct: number | null): string {
  const lead = [...summary.topFallers, ...summary.topRisers]
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))[0];
  if (indexChangePct != null && Math.abs(indexChangePct) >= 3) {
    const yon = indexChangePct > 0 ? "yükseldi" : "geriledi";
    return `${range.label} Hal Fiyatları: Endeks ${trPct(Math.abs(indexChangePct))} ${yon}`;
  }
  if (lead) {
    const yon = lead.changePct > 0 ? "zamlandı" : "ucuzladı";
    return `${range.label} Hal Fiyatları: ${lead.productName} ${trPct(Math.abs(lead.changePct))} ${yon}`;
  }
  return `${range.label} Hal Fiyatları Değerlendirmesi`;
}

export interface MonthlyReportDraft {
  slug: string;
  title: string;
  summary: string;
  content: string;
  monthKey: string;
  monthStart: string;
  monthEnd: string;
  totalRecords: number;
  tags: string[];
}

export async function generateMonthlyReport(month?: string): Promise<MonthlyReportDraft | null> {
  const range = resolveMonthRange(month);
  const summary = await weeklyPriceSummary(range.monthStart, range.monthEnd, { windowDays: MONTH_WINDOW_DAYS });
  if (summary.totalRecords < MIN_MONTH_RECORDS) return null;

  const previous = previousMonthOf(range);
  const previousSummary = await weeklyPriceSummary(previous.monthStart, previous.monthEnd, { windowDays: MONTH_WINDOW_DAYS })
    .catch(() => null);

  const history = await repoGetSnapshotHistory(26);
  const points: IndexPoint[] = history.map((row) => ({
    indexWeek: row.indexWeek,
    indexValue: Number(row.indexValue),
    basketAvg: Number(row.basketAvg),
    weekStart: typeof row.weekStart === "string" ? row.weekStart.slice(0, 10) : row.weekStart.toISOString().slice(0, 10),
    weekEnd: typeof row.weekEnd === "string" ? row.weekEnd.slice(0, 10) : row.weekEnd.toISOString().slice(0, 10),
  }));
  const inMonth = points.filter((point) => point.weekEnd >= range.monthStart && point.weekStart <= range.monthEnd);
  const monthOpenIndex = inMonth[0] ?? null;
  const monthCloseIndex = inMonth.length ? inMonth[inMonth.length - 1]! : null;
  const indexChangePct = monthOpenIndex && monthCloseIndex && monthOpenIndex.indexValue > 0
    ? ((monthCloseIndex.indexValue - monthOpenIndex.indexValue) / monthOpenIndex.indexValue) * 100
    : null;

  const shift = await seasonShift(range, previous).catch(() => ({ entering: [], leaving: [] }));
  const status = monthCloseIndex ? indexStatusOf(points, monthCloseIndex.indexWeek) : null;

  const content = buildMonthlyHtml({
    range, summary, previousSummary, indexRows: inMonth, status, monthOpenIndex, monthCloseIndex, shift,
  });

  const tags = ["aylık değerlendirme", "hal fiyatları", MONTH_LABELS[range.monthIndex]!.toLocaleLowerCase("tr-TR")];
  for (const item of [...summary.topFallers, ...summary.topRisers].slice(0, 4)) {
    if (item.productName) tags.push(item.productName.toLocaleLowerCase("tr-TR"));
  }

  return {
    slug: slugForMonth(range),
    title: buildTitle(range, summary, indexChangePct),
    summary: buildSummaryText(range, summary, indexChangePct),
    content,
    monthKey: range.monthKey,
    monthStart: range.monthStart,
    monthEnd: range.monthEnd,
    totalRecords: summary.totalRecords,
    tags: [...new Set(tags)].slice(0, 8),
  };
}

/** Taslagi kaydeder. Yayindaki bir kayit varsa dokunmaz — editorun yayini ezilmez. */
export async function persistMonthlyReport(month?: string) {
  const draft = await generateMonthlyReport(month);
  if (!draft) return null;

  const [teamAuthor] = await db
    .select({ id: hfAuthors.id })
    .from(hfAuthors)
    .where(eq(hfAuthors.slug, "haldefiyat-veri-ekibi"))
    .limit(1);

  const [existing] = await db.select().from(hfAnalysisReports).where(eq(hfAnalysisReports.slug, draft.slug)).limit(1);
  if (existing?.status === "published") return existing;

  const reportDate = new Date(`${draft.monthEnd}T12:00:00Z`);
  const values = {
    slug: draft.slug,
    title: draft.title,
    summary: draft.summary,
    metaTitle: draft.title.slice(0, 60),
    metaDescription: draft.summary.slice(0, 155),
    ogImage: "/og-default.png",
    imageAlt: draft.title,
    content: draft.content,
    author: "HaldeFiyat Veri Ekibi",
    authorId: teamAuthor?.id ?? null,
    tags: draft.tags,
    isoWeek: draft.monthKey,
    weekStart: new Date(`${draft.monthStart}T12:00:00Z`),
    weekEnd: reportDate,
    reportDate,
    source: "auto" as const,
    status: "draft" as const,
    totalRecords: draft.totalRecords,
    publishedAt: null,
  };

  if (existing) {
    await db.update(hfAnalysisReports).set(values).where(eq(hfAnalysisReports.id, existing.id));
    const [updated] = await db.select().from(hfAnalysisReports).where(eq(hfAnalysisReports.id, existing.id)).limit(1);
    return updated ?? existing;
  }

  await db.insert(hfAnalysisReports).values(values);
  const [created] = await db.select().from(hfAnalysisReports).where(eq(hfAnalysisReports.slug, draft.slug)).limit(1);
  return created ?? null;
}

/** En son aylik taslagi/raporu dondurur — panelde "bu ay var mi" kontrolu icin. */
export async function latestMonthlyReport() {
  const [row] = await db
    .select()
    .from(hfAnalysisReports)
    .where(sql`${hfAnalysisReports.isoWeek} REGEXP '^[0-9]{4}-M[0-9]{2}$'`)
    .orderBy(desc(hfAnalysisReports.reportDate))
    .limit(1);
  return row ?? null;
}
