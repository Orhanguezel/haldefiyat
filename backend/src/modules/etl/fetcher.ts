/**
 * Jenerik ETL fetcher.
 *
 * config/etl-sources.ts içindeki her kaynak için tek giriş noktası. Kaynağa
 * özgü hiçbir kural burada hard-coded değil — responseShape ile yanıt formatı
 * ayırt edilir. Yeni bir API formatı çıkarsa `parseResponse` içine yeni bir
 * shape eklenir, kaynak tanımı config'ten gelir.
 *
 * Davranış:
 *   1. Hedef tarih için endpoint çağrılır
 *   2. 204 No Content → `env.ETL.maxDateFallbackDays` kadar geriye tara
 *   3. Yanıt normalize edilir (product name, min/max/avg, unit, category)
 *   4. Bilinmeyen ürün: auto-register açıksa hf_products'a eklenir
 *   5. hf_price_history'ye upsert
 *   6. hf_etl_runs'a özet kayıt
 */

import { db } from "@/db/client";
import { hfMarkets, hfProducts, hfEtlRuns } from "@/db/schema";
import { eq } from "drizzle-orm";
import { upsertPriceRow } from "@/modules/prices/repository";
import { resolveProductSlug, turkishToAscii, invalidateAliasCache } from "./normalizer";
import type { EtlSourceConfig } from "@/config/etl-sources";
import { env } from "@/core/env";

export interface EtlRunResult {
  inserted: number;
  skipped:  number;
  errors:   string[];
}

interface NormalizedRow {
  name:     string;
  category: string | null;   // 'sebze' | 'meyve' | 'balik' | ...
  unit:     string | null;
  avg:      number | null;
  min:      number | null;
  max:      number | null;
  // Satıra özel tarih — örn. ANTKOMDER HTML'i aynı sayfada 2 güne ait fiyat
  // verir. Boş bırakılırsa fetch turundaki dateUsed kullanılır.
  recordedDate?: string;
}

// ── Response parsers ────────────────────────────────────────────────────────

function parseResponse(shape: EtlSourceConfig["responseShape"], raw: unknown): NormalizedRow[] {
  if (raw == null) return [];
  switch (shape) {
    case "izmir":          return parseIzmir(raw);
    case "ibb":            return parseIbb(raw);
    case "antkomder_html": return parseAntkomderHtml(String(raw));
    case "konya_html":     return parseKonyaHtml(String(raw));
    case "kayseri_html":   return parseKayseriHtml(String(raw));
    case "eskisehir_html": return parseEskisehirHtml(String(raw));
    case "denizli_html":   return parseDenizliHtml(String(raw));
    default:               return [];
  }
}

/**
 * İzmir Büyükşehir Belediyesi formatı:
 * { BultenTarihi, HalFiyatListesi: [{ MalAdi, OrtalamaUcret, AsgariUcret,
 *   AzamiUcret, Birim, MalTipAdi }] }
 */
function parseIzmir(raw: unknown): NormalizedRow[] {
  const obj = raw as { HalFiyatListesi?: unknown };
  const list = Array.isArray(obj?.HalFiyatListesi) ? obj.HalFiyatListesi : [];
  const rows: NormalizedRow[] = [];
  for (const item of list) {
    const r = item as Record<string, unknown>;
    const name = typeof r.MalAdi === "string" ? r.MalAdi.trim() : "";
    if (!name) continue;
    rows.push({
      name,
      category: typeof r.MalTipAdi === "string" ? String(r.MalTipAdi).trim() : null,
      unit:     typeof r.Birim === "string" ? String(r.Birim).trim() : null,
      avg:      toNum(r.OrtalamaUcret),
      min:      toNum(r.AsgariUcret),
      max:      toNum(r.AzamiUcret),
    });
  }
  return rows;
}

/**
 * İBB "eski" swagger formatı (şu an ölü, enabled=false — ileride açılırsa).
 * [{ UrunAdi, MinFiyat, MaxFiyat, OrtalamaFiyat, Birim, Tarih }]
 */
function parseIbb(raw: unknown): NormalizedRow[] {
  const list: unknown[] = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { value?: unknown[] })?.value)
      ? (raw as { value: unknown[] }).value
      : [];
  const rows: NormalizedRow[] = [];
  for (const item of list) {
    const r = item as Record<string, unknown>;
    const name = typeof r.UrunAdi === "string" ? r.UrunAdi.trim() : "";
    if (!name) continue;
    rows.push({
      name,
      category: null,
      unit:     typeof r.Birim === "string" ? String(r.Birim).trim() : null,
      avg:      toNum(r.OrtalamaFiyat),
      min:      toNum(r.MinFiyat),
      max:      toNum(r.MaxFiyat),
    });
  }
  return rows;
}

function toNum(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

/**
 * ANTKOMDER (Antalya Yaş Sebze ve Meyve Komisyoncular Derneği) HTML tablosu:
 * Tek tablo, başlıklar: [#, Ürünler, "DD-MM-YYYY (Bugün)", "DD-MM-YYYY"]
 * Her satır: [index, ürünAdı, bugün_fiyat, dün_fiyat]
 * Fiyat formatı: "80.00 ₺" | "₺ Fiyat Bekleniyor" | "Mevcut Değil ₺"
 *
 * Aynı HTML'den iki günlük veri çıkarıp her birini ayrı NormalizedRow
 * olarak döndürür (recordedDate başlıktan gelir). Kaynak birim belirtmediği
 * için config.defaultUnit devreye girer.
 */
function parseAntkomderHtml(html: string): NormalizedRow[] {
  const out: NormalizedRow[] = [];
  const tableMatch = /<table[^>]*>([\s\S]*?)<\/table>/i.exec(html);
  if (!tableMatch) return out;
  const body = tableMatch[1] ?? "";

  // Başlık satırından DD-MM-YYYY formatındaki tarihleri topla
  const headerRow = /<tr[^>]*>([\s\S]*?)<\/tr>/i.exec(body);
  if (!headerRow) return out;
  const headerCells = [...headerRow[1]!.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)]
    .map((m) => stripTags(m[1] ?? ""));
  const dateColumns: { colIndex: number; isoDate: string }[] = [];
  for (let i = 0; i < headerCells.length; i++) {
    const m = /(\d{2})-(\d{2})-(\d{4})/.exec(headerCells[i] ?? "");
    if (m) dateColumns.push({ colIndex: i, isoDate: `${m[3]}-${m[2]}-${m[1]}` });
  }
  if (dateColumns.length === 0) return out;

  // Veri satırları
  const trMatches = [...body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  for (let r = 1; r < trMatches.length; r++) {
    const cells = [...trMatches[r]![1]!.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)]
      .map((m) => stripTags(m[1] ?? ""));
    const name = (cells[1] ?? "").trim();
    if (!name) continue;

    for (const col of dateColumns) {
      const avg = parsePriceTry(cells[col.colIndex] ?? "");
      if (avg == null) continue;
      out.push({
        name,
        category:     null,
        unit:         null,
        avg,
        min:          null,
        max:          null,
        recordedDate: col.isoDate,
      });
    }
  }
  return out;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'");
}

function stripTags(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

function parsePriceTry(raw: string): number | null {
  if (!raw) return null;
  // "₺ Fiyat Bekleniyor", "Mevcut Değil ₺", "-", boş → null
  const cleaned = raw.replace(/₺/g, "").replace(/\s+/g, " ").trim();
  if (!cleaned) return null;
  if (/bekleniyor|mevcut de[ğg]il|veri yok|^-+$/i.test(cleaned)) return null;
  // "80.00" veya "80,00"
  const n = parseFloat(cleaned.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * HTML'deki tüm <table>'ları tr × td matrisine ayırır. Parser'lar bu ortak
 * utility üzerinden çalışır, her biri sütun anlamlandırmasını kendi yapar.
 */
function extractTables(html: string): string[][][] {
  const tables = [...html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/gi)];
  const out: string[][][] = [];
  for (const t of tables) {
    const body = t[1] ?? "";
    const trs = [...body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
    const rows: string[][] = [];
    for (const tr of trs) {
      const cells = [...tr[1]!.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)]
        .map((m) => stripTags(m[1] ?? ""));
      if (cells.length > 0) rows.push(cells);
    }
    if (rows.length > 0) out.push(rows);
  }
  return out;
}

/** Birim normalize: "Kg", "KG", "Adet", "Bağ", "Paket" → lowercase */
function normalizeUnit(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const u = raw.trim().toLocaleLowerCase("tr-TR");
  if (!u || /^-+$/.test(u)) return null;
  // Türkçe karakter sadeleştirme
  return u.replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c");
}

/**
 * Konya Büyükşehir — https://www.konya.bel.tr/hal-fiyatlari
 * 2 ayrı tablo: SEBZE + MEYVE. Her satır: [Ürün, Birim, En Düşük, En Yüksek].
 * Başlık satırı th-only olduğu için 4 hücreli olmayan satırlar ayıklanır.
 * Kategori tablo sırasından belirlenir (0=sebze, 1=meyve).
 */
function parseKonyaHtml(html: string): NormalizedRow[] {
  const out: NormalizedRow[] = [];
  const tables = extractTables(html);
  // İlk 2 veri tablosu sebze + meyve (varsa 3. tablo başka içerik olabilir)
  const categories = ["sebze", "meyve"];
  for (let i = 0; i < Math.min(tables.length, categories.length); i++) {
    for (const row of tables[i]!) {
      if (row.length < 4) continue;
      const name = row[0]!.trim();
      // Başlık ve başlık-benzeri satırları atla
      if (!name || /^(ürün|cinsi|ürün adı|fiyatları)$/i.test(name)) continue;
      const min = parsePriceTry(row[2] ?? "");
      const max = parsePriceTry(row[3] ?? "");
      if (min == null && max == null) continue;
      const avg = min != null && max != null ? (min + max) / 2 : (min ?? max);
      out.push({
        name,
        category: categories[i]!,
        unit:     normalizeUnit(row[1] ?? ""),
        avg,
        min,
        max,
      });
    }
  }
  return out;
}

/**
 * Eskişehir Büyükşehir — https://www.eskisehir.bel.tr/hal-fiyatlari
 * Tek tablo, kolonlar: [Ürün Adı, Ürün Cinsi, Ürün Türü, Max, Min, Avg].
 * Fiyatlar virgüllü ondalık ("73,51"), birim yok, tarih default bugün.
 * "Ürün Adı" + "Ürün Cinsi" farklıysa birleştirilir; aynıysa tek isim kalır.
 */
function parseEskisehirHtml(html: string): NormalizedRow[] {
  const out: NormalizedRow[] = [];
  const tables = extractTables(html);
  if (tables.length === 0) return out;
  for (const row of tables[0]!) {
    if (row.length < 6) continue;
    const name  = row[0]!.trim();
    const cinsi = row[1]!.trim();
    if (!name || /^(ürün|ürün adı)$/i.test(name)) continue;
    const max = parsePriceTry(row[3] ?? "");
    const min = parsePriceTry(row[4] ?? "");
    const avg = parsePriceTry(row[5] ?? "");
    if (min == null && max == null && avg == null) continue;
    const displayName = cinsi && cinsi.toLocaleLowerCase("tr-TR") !== name.toLocaleLowerCase("tr-TR")
      ? `${name} (${cinsi})`
      : name;
    out.push({
      name:     displayName,
      category: null,
      unit:     null,
      avg:      avg ?? (min != null && max != null ? (min + max) / 2 : (min ?? max)),
      min, max,
    });
  }
  return out;
}

/**
 * Denizli Büyükşehir — https://www.denizli.bel.tr/Default.aspx?k=halfiyatlari
 * 2 tablo (sebze + meyve ayrımı başlıkta), kolonlar:
 * [Ürün Adı, Asgari(TL), Orta(TL), Ekstra(TL)] → min | avg | max
 * Fiyat formatı "90,00 TL".
 */
function parseDenizliHtml(html: string): NormalizedRow[] {
  const out: NormalizedRow[] = [];
  const tables = extractTables(html);
  // Her iki tablo da aynı şemada; kategori ayrımını config.defaultCategory yapar.
  for (const table of tables.slice(0, 2)) {
    for (const row of table) {
      if (row.length < 4) continue;
      const name = row[0]!.trim();
      if (!name || /^ürün adı$/i.test(name)) continue;
      const min = parsePriceTry(row[1] ?? "");
      const avg = parsePriceTry(row[2] ?? "");
      const max = parsePriceTry(row[3] ?? "");
      if (min == null && max == null && avg == null) continue;
      out.push({
        name,
        category: null,
        unit:     null,
        avg:      avg ?? (min != null && max != null ? (min + max) / 2 : (min ?? max)),
        min, max,
      });
    }
  }
  return out;
}

/**
 * Kayseri Büyükşehir — https://www.kayseri.bel.tr/hal-fiyatlari
 * Tek tablo, kolonlar: [CİNSİ, BİRİMİ, EN YÜKSEK, EN DÜŞÜK].
 * DİKKAT: Kayseri kolon sırası ters — önce MAX, sonra MIN.
 */
function parseKayseriHtml(html: string): NormalizedRow[] {
  const out: NormalizedRow[] = [];
  const tables = extractTables(html);
  if (tables.length === 0) return out;
  for (const row of tables[0]!) {
    if (row.length < 4) continue;
    const name = row[0]!.trim();
    if (!name || /^(cinsi|ürün|ürün adı)$/i.test(name)) continue;
    const max = parsePriceTry(row[2] ?? "");
    const min = parsePriceTry(row[3] ?? "");
    if (min == null && max == null) continue;
    const avg = min != null && max != null ? (min + max) / 2 : (max ?? min);
    out.push({
      name,
      category: null,   // Kayseri kategori vermiyor — config.defaultCategory
      unit:     normalizeUnit(row[1] ?? ""),
      avg,
      min,
      max,
    });
  }
  return out;
}

// ── HTTP ────────────────────────────────────────────────────────────────────

interface FetchOutcome {
  rows:        NormalizedRow[];
  dateUsed:    string;          // gerçekten veri gelen tarih
  httpStatus:  number;
}

const HTML_SHAPES = new Set<EtlSourceConfig["responseShape"]>([
  "antkomder_html",
  "konya_html",
  "kayseri_html",
  "eskisehir_html",
  "denizli_html",
]);

async function fetchDated(source: EtlSourceConfig, date: string): Promise<FetchOutcome | null> {
  const url = source.baseUrl + source.endpointTemplate.replace("{date}", date);
  const isHtml = HTML_SHAPES.has(source.responseShape);
  const res = await fetch(url, {
    headers: {
      Accept:      isHtml ? "text/html,application/xhtml+xml" : "application/json",
      "User-Agent": "HaldeFiyatBot/1.0 (+https://haldefiyat.com)",
    },
    signal: AbortSignal.timeout(env.ETL.requestTimeoutMs),
  });

  if (res.status === 204) return { rows: [], dateUsed: date, httpStatus: 204 };
  if (!res.ok) throw new Error(`HTTP ${res.status} @ ${url}`);

  const text = await decodeResponseBody(res);
  if (!text.trim()) return { rows: [], dateUsed: date, httpStatus: res.status };

  if (isHtml) {
    return { rows: parseResponse(source.responseShape, text), dateUsed: date, httpStatus: res.status };
  }

  let json: unknown;
  try { json = JSON.parse(text); }
  catch { throw new Error(`Invalid JSON response from ${url}`); }

  return { rows: parseResponse(source.responseShape, json), dateUsed: date, httpStatus: res.status };
}

/**
 * Response gövdesini Content-Type header'ındaki charset'e göre decode eder.
 * Bazı belediye siteleri (Eskişehir vb.) hala windows-1254 / iso-8859-9
 * yayınlıyor — UTF-8 varsayımı Türkçe karakterleri bozuyor.
 *
 * Bun'ın yerleşik TextDecoder'ı iso-8859-9 / windows-1254 label'larını
 * desteklemediği için Türkçe için manuel decoder ile idare ediyoruz.
 */
async function decodeResponseBody(res: Response): Promise<string> {
  const buf = await res.arrayBuffer();
  const ct  = res.headers.get("content-type") ?? "";
  const m   = /charset=["']?([a-zA-Z0-9_-]+)/i.exec(ct);
  const raw = (m?.[1] ?? "utf-8").toLowerCase();
  if (raw === "iso-8859-9" || raw === "windows-1254" || raw === "cp1254") {
    return decodeIso8859_9(buf);
  }
  try {
    return new TextDecoder(raw, { fatal: false }).decode(buf);
  } catch {
    return new TextDecoder("utf-8", { fatal: false }).decode(buf);
  }
}

/**
 * ISO-8859-9 (Latin-5, Turkish) manuel decoder. Latin-1'den yalnızca 6
 * kodnokta farklı, gerisi byte == code point.
 */
function decodeIso8859_9(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  const chars: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i]!;
    switch (b) {
      case 0xD0: chars.push("Ğ"); break;
      case 0xDD: chars.push("İ"); break;
      case 0xDE: chars.push("Ş"); break;
      case 0xF0: chars.push("ğ"); break;
      case 0xFD: chars.push("ı"); break;
      case 0xFE: chars.push("ş"); break;
      default:   chars.push(String.fromCharCode(b));
    }
  }
  return chars.join("");
}

/**
 * Hedef tarihte veri yoksa (204 / boş) N gün geriye gider.
 * İlk dolu yanıtı döndürür.
 */
async function fetchWithFallback(source: EtlSourceConfig, startDate: string): Promise<FetchOutcome> {
  const maxFallback = Math.max(0, env.ETL.maxDateFallbackDays);
  let lastOutcome: FetchOutcome | null = null;

  for (let offset = 0; offset <= maxFallback; offset++) {
    const date = shiftDate(startDate, -offset);
    const outcome = await fetchDated(source, date);
    if (outcome && outcome.rows.length > 0) return outcome;
    lastOutcome = outcome ?? lastOutcome;
  }

  return lastOutcome ?? { rows: [], dateUsed: startDate, httpStatus: 0 };
}

function shiftDate(iso: string, deltaDays: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

// ── Product auto-register ───────────────────────────────────────────────────

function slugify(raw: string): string {
  return turkishToAscii(raw)
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 128);
}

function normalizeCategory(raw: string | null, fallback: string): string {
  if (!raw) return fallback || "diger";
  const slug = turkishToAscii(raw)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug) return fallback || "diger";
  // Çok yaygın eş-anlamlıları tek slug'a indirge (API değişirse uzun süre tutar)
  if (slug.includes("sebze") && slug.includes("meyve")) return "sebze-meyve";
  return slug;
}

async function findOrCreateProductId(raw: NormalizedRow, source: EtlSourceConfig): Promise<number | null> {
  const slug = await resolveProductSlug(raw.name);
  if (slug) {
    const rows = await db.select({ id: hfProducts.id })
      .from(hfProducts)
      .where(eq(hfProducts.slug, slug))
      .limit(1);
    if (rows[0]) return rows[0].id;
  }
  if (!env.ETL.autoRegisterProducts) return null;

  const newSlug = slugify(raw.name);
  if (!newSlug) return null;

  const unit = (raw.unit ?? source.defaultUnit).toLowerCase();

  // Upsert: slug unique
  await db.insert(hfProducts).values({
    slug:         newSlug,
    nameTr:       raw.name,
    categorySlug: normalizeCategory(raw.category, source.defaultCategory),
    unit,
    aliases:      [raw.name],
    isActive:     1,
  }).onDuplicateKeyUpdate({
    set: {
      nameTr:       raw.name,
      categorySlug: normalizeCategory(raw.category, source.defaultCategory),
      unit,
    },
  });

  invalidateAliasCache();

  const rows = await db.select({ id: hfProducts.id })
    .from(hfProducts)
    .where(eq(hfProducts.slug, newSlug))
    .limit(1);
  return rows[0]?.id ?? null;
}

// ── Orchestration ───────────────────────────────────────────────────────────

async function logEtlRun(params: {
  sourceKey: string;
  runDate:   string;
  rowsFetched:  number;
  rowsInserted: number;
  rowsSkipped:  number;
  durationMs:   number;
  status:       "ok" | "partial" | "error";
  errorMsg:     string | null;
}) {
  try {
    await db.insert(hfEtlRuns).values({
      sourceApi:    params.sourceKey,
      runDate:      new Date(`${params.runDate}T00:00:00`),
      rowsFetched:  params.rowsFetched,
      rowsInserted: params.rowsInserted,
      rowsSkipped:  params.rowsSkipped,
      durationMs:   params.durationMs,
      status:       params.status,
      errorMsg:     params.errorMsg,
    });
  } catch { /* log hatası ETL'i durdurmamalı */ }
}

export async function runSourceFetch(
  source: EtlSourceConfig,
  targetDate?: string,
): Promise<EtlRunResult> {
  const startDate = targetDate ?? new Date().toISOString().slice(0, 10);
  const t0 = Date.now();
  let inserted = 0;
  let skipped  = 0;
  const errors: string[] = [];

  // Market referansı
  const marketRows = await db.select({ id: hfMarkets.id })
    .from(hfMarkets)
    .where(eq(hfMarkets.slug, source.marketSlug))
    .limit(1);
  if (!marketRows[0]) {
    const msg = `Market bulunamadi: ${source.marketSlug}`;
    await logEtlRun({
      sourceKey: source.key, runDate: startDate, rowsFetched: 0,
      rowsInserted: 0, rowsSkipped: 0, durationMs: Date.now() - t0,
      status: "error", errorMsg: msg,
    });
    throw new Error(msg);
  }
  const marketId = marketRows[0].id;

  // Fetch + fallback
  let outcome: FetchOutcome;
  try {
    outcome = await fetchWithFallback(source, startDate);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logEtlRun({
      sourceKey: source.key, runDate: startDate, rowsFetched: 0,
      rowsInserted: 0, rowsSkipped: 0, durationMs: Date.now() - t0,
      status: "error", errorMsg: msg,
    });
    throw err;
  }

  // Upsert satırları
  for (const row of outcome.rows) {
    const avg = row.avg ?? (row.min != null && row.max != null ? (row.min + row.max) / 2 : null);
    if (avg == null || !Number.isFinite(avg) || avg <= 0) { skipped++; continue; }

    let productId: number | null = null;
    try {
      productId = await findOrCreateProductId(row, source);
    } catch (err) {
      errors.push(`${row.name}: ${err instanceof Error ? err.message : String(err)}`);
      skipped++;
      continue;
    }
    if (!productId) { skipped++; continue; }

    try {
      await upsertPriceRow({
        productId,
        marketId,
        minPrice:     row.min != null ? String(row.min) : null,
        maxPrice:     row.max != null ? String(row.max) : null,
        avgPrice:     String(avg),
        recordedDate: row.recordedDate ?? outcome.dateUsed,
        sourceApi:    source.key,
      });
      inserted++;
    } catch (err) {
      errors.push(`${row.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  await logEtlRun({
    sourceKey:    source.key,
    runDate:      outcome.dateUsed,
    rowsFetched:  outcome.rows.length,
    rowsInserted: inserted,
    rowsSkipped:  skipped,
    durationMs:   Date.now() - t0,
    status:       errors.length > 0 ? "partial" : outcome.rows.length === 0 ? "error" : "ok",
    errorMsg:     errors.length > 0
      ? errors.slice(0, 5).join("; ")
      : outcome.rows.length === 0
        ? `Kaynak boş yanıt döndürdü (HTTP ${outcome.httpStatus}, ${startDate} ve ${env.ETL.maxDateFallbackDays} gün geriye kadar)`
        : null,
  });

  return { inserted, skipped, errors };
}
