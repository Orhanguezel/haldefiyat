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

function parseResponse(
  shape: EtlSourceConfig["responseShape"],
  raw: unknown,
  source: EtlSourceConfig,
): NormalizedRow[] {
  if (raw == null) return [];
  switch (shape) {
    case "izmir":          return parseIzmir(raw, source);
    case "ibb":            return parseIbb(raw);
    case "antkomder_html": return parseAntkomderHtml(String(raw));
    case "ankara_html":    return parseAnkaraHtml(raw);
    case "mersin_html":    return parseMersinHtml(raw);
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
 *
 * Balık kaynağında (izmir_balik) MalTipAdi tek başına yetersiz — "BALIK"
 * altında hem taze deniz balığı hem donuk balık karışık geliyor. İsim
 * patern'ine (DONUK vb.) göre alt kategori türetiyoruz:
 *   MalTipAdi=BALIK + isim "DONUK"   → balik-donuk
 *   MalTipAdi=BALIK                   → balik-deniz
 *   MalTipAdi=TATLI SU                → balik-tatlisu
 *   MalTipAdi=KÜLTÜR                  → balik-kultur
 *   MalTipAdi=İTHAL (DONUK) vb.       → balik-ithal
 */
function parseIzmir(raw: unknown, source: EtlSourceConfig): NormalizedRow[] {
  const obj = raw as { HalFiyatListesi?: unknown };
  const list = Array.isArray(obj?.HalFiyatListesi) ? obj.HalFiyatListesi : [];
  const rows: NormalizedRow[] = [];
  const isFishSource = source.key === "izmir_balik";
  for (const item of list) {
    const r = item as Record<string, unknown>;
    const name = typeof r.MalAdi === "string" ? r.MalAdi.trim() : "";
    if (!name) continue;
    const tipRaw = typeof r.MalTipAdi === "string" ? r.MalTipAdi.trim() : null;
    const category = isFishSource ? subCategorizeFish(tipRaw, name) : tipRaw;
    rows.push({
      name,
      category,
      unit:     typeof r.Birim === "string" ? String(r.Birim).trim() : null,
      avg:      toNum(r.OrtalamaUcret),
      min:      toNum(r.AsgariUcret),
      max:      toNum(r.AzamiUcret),
    });
  }
  return rows;
}

function subCategorizeFish(malTipAdi: string | null, malAdi: string): string {
  const tip = (malTipAdi ?? "").toLocaleUpperCase("tr-TR");
  const nameUp = malAdi.toLocaleUpperCase("tr-TR");
  if (tip.includes("TATLI")) return "balik-tatlisu";
  if (tip.includes("KÜLTÜR") || tip.includes("KULTUR")) return "balik-kultur";
  if (tip.includes("İTHAL") || tip.includes("ITHAL")) return "balik-ithal";
  // MalTipAdi=BALIK: donuk olanı ayır
  if (/\bDONUK\b/.test(nameUp)) return "balik-donuk";
  return "balik-deniz";
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
  // "80.00", "80,00", "2.700,00", "1,000.50"
  const normalized =
    cleaned.includes(".") && cleaned.includes(",")
      ? cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")
        ? cleaned.replace(/\./g, "").replace(",", ".")
        : cleaned.replace(/,/g, "")
      : cleaned.includes(",")
        ? cleaned.replace(",", ".")
        : cleaned;
  const n = parseFloat(normalized);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseAnkaraHtml(raw: unknown): NormalizedRow[] {
  const pages = Array.isArray(raw) ? raw : [raw];
  const out: NormalizedRow[] = [];
  for (const page of pages) {
    const payload = page as { html?: unknown; type?: unknown };
    const html = typeof payload?.html === "string" ? payload.html : "";
    const type = typeof payload?.type === "string" ? payload.type : "";
    if (!html) continue;

    const category =
      type === "vegetable" ? "sebze" :
      type === "fruit" ? "meyve" :
      type === "fish" ? "balik" :
      type === "imported" ? "ithal" :
      null;

    const tables = extractTables(html);
    if (tables.length === 0) continue;
    for (const row of tables[0]!) {
      if (row.length < 6) continue;
      const name = row[0]!.trim();
      if (!name || /^(ürün adı|ürün|birim|en düşük fiyat|en yüksek fiyat|tarih)$/i.test(name)) continue;
      const min = parsePriceTry(row[3] ?? "");
      const max = parsePriceTry(row[4] ?? "");
      const recordedDate = parseTrDate(row[5] ?? "");
      if (min == null && max == null) continue;
      out.push({
        name,
        category,
        unit: normalizeUnit(row[2] ?? ""),
        avg: min != null && max != null ? (min + max) / 2 : (min ?? max),
        min,
        max,
        recordedDate,
      });
    }
  }
  return out;
}

function parseMersinHtml(raw: unknown): NormalizedRow[] {
  const pages = Array.isArray(raw) ? raw : [raw];
  const out: NormalizedRow[] = [];
  for (const page of pages) {
    const payload = page as { html?: unknown; category?: unknown };
    const html = typeof payload?.html === "string" ? payload.html : "";
    const category = payload?.category === "3"
      ? "meyve"
      : payload?.category === "4"
        ? "sebze"
        : null;
    if (!html) continue;
    const tables = extractTables(html);
    if (tables.length === 0) continue;

    for (const row of tables[0]!) {
      if (row.length < 8) continue;
      const marketName = row[0]!.trim();
      const product = row[1]!.trim();
      const kind = row[2]!.trim();
      if (!product || /^(şube|ürün|cinsi|türü|min\. fiyat|mak\. fiyat|ort\. fiyat|birim)$/i.test(product)) {
        continue;
      }
      const min = parsePriceTry(row[4] ?? "");
      const max = parsePriceTry(row[5] ?? "");
      const avg = parsePriceTry(row[6] ?? "");
      if (min == null && max == null && avg == null) continue;

      const displayName = kind && kind.toLocaleLowerCase("tr-TR") !== product.toLocaleLowerCase("tr-TR")
        ? `${product} (${kind})`
        : product;

      out.push({
        name: displayName,
        category,
        unit: normalizeUnit(row[7] ?? ""),
        avg: avg ?? (min != null && max != null ? (min + max) / 2 : (min ?? max)),
        min,
        max,
        // Şube kolonu şu an tek pazar içinde varyant değil; kaynak market seviyesinde tutuluyor.
      });
      void marketName;
    }
  }
  return out;
}

function parseTrDate(raw: string): string | undefined {
  const m = /(\d{2})\.(\d{2})\.(\d{4})/.exec(raw.trim());
  return m ? `${m[3]}-${m[2]}-${m[1]}` : undefined;
}

function formatDateTr(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}.${month}.${year}`;
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
  "ankara_html",
  "mersin_html",
  "konya_html",
  "kayseri_html",
  "eskisehir_html",
  "denizli_html",
]);

async function fetchDated(
  source: EtlSourceConfig,
  date: string,
  isBackfill = false,
): Promise<FetchOutcome | null> {
  if (source.responseShape === "ankara_html") {
    return fetchAnkaraDated(source, date, isBackfill);
  }
  if (source.responseShape === "mersin_html") {
    return fetchMersinDated(source, date, isBackfill);
  }

  // Geriye dönük çağrıda backfillEndpoint tercih edilir (Konya gibi: default
  // sayfa bugünü, ?tarih=YYYY-MM-DD arşivi döndürür).
  const template = isBackfill ? source.backfillEndpoint : source.endpointTemplate;
  const url = source.baseUrl + template.replace("{date}", date);
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
    return { rows: parseResponse(source.responseShape, text, source), dateUsed: date, httpStatus: res.status };
  }

  let json: unknown;
  try { json = JSON.parse(text); }
  catch { throw new Error(`Invalid JSON response from ${url}`); }

  return { rows: parseResponse(source.responseShape, json, source), dateUsed: date, httpStatus: res.status };
}

async function fetchAnkaraDated(
  source: EtlSourceConfig,
  date: string,
  isBackfill = false,
): Promise<FetchOutcome | null> {
  const template = isBackfill ? source.backfillEndpoint : source.endpointTemplate;
  const url = source.baseUrl + template.replace("{date}", date);
  const requestDate = formatDateTr(date);
  const categories = ["vegetable", "fruit", "fish", "imported"] as const;
  const pages: Array<{ html: string; type: string }> = [];
  let lastStatus = 200;

  for (const type of categories) {
    const body = new URLSearchParams({ date: requestDate, type });
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "HaldeFiyatBot/1.0 (+https://haldefiyat.com)",
      },
      body,
      signal: AbortSignal.timeout(env.ETL.requestTimeoutMs),
    });

    lastStatus = res.status;
    if (res.status === 204) continue;
    if (!res.ok) throw new Error(`HTTP ${res.status} @ ${url} [type=${type}]`);

    const html = await decodeResponseBody(res);
    if (html.trim()) pages.push({ html, type });
  }

  const rows = parseResponse(source.responseShape, pages, source);
  return { rows, dateUsed: date, httpStatus: lastStatus };
}

async function fetchMersinDated(
  source: EtlSourceConfig,
  date: string,
  isBackfill = false,
): Promise<FetchOutcome | null> {
  const template = isBackfill ? source.backfillEndpoint : source.endpointTemplate;
  const url = source.baseUrl + template.replace("{date}", date);
  const categories = ["3", "4"] as const;
  const pages: Array<{ html: string; category: string }> = [];
  let lastStatus = 200;

  for (const category of categories) {
    const body = new URLSearchParams({ published: date, product_category: category });
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "HaldeFiyatBot/1.0 (+https://haldefiyat.com)",
        "X-Requested-With": "XMLHttpRequest",
      },
      body,
      signal: AbortSignal.timeout(env.ETL.requestTimeoutMs),
    });

    lastStatus = res.status;
    if (res.status === 204) continue;
    if (!res.ok) throw new Error(`HTTP ${res.status} @ ${url} [category=${category}]`);

    const html = await decodeResponseBody(res);
    if (html.trim()) pages.push({ html, category });
  }

  const rows = parseResponse(source.responseShape, pages, source);
  return { rows, dateUsed: date, httpStatus: lastStatus };
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
 *
 * Backfill modunda (explicit tarih) URL şablonu farklı + fallback pencere
 * 0 olur (sadece o günü dener, boşsa boş döner — tarih iterasyonu üst
 * katmandadır).
 */
async function fetchWithFallback(
  source: EtlSourceConfig,
  startDate: string,
  isBackfill = false,
): Promise<FetchOutcome> {
  if (isBackfill) {
    const outcome = await fetchDated(source, startDate, true);
    return outcome ?? { rows: [], dateUsed: startDate, httpStatus: 0 };
  }

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
  options: { backfill?: boolean } = {},
): Promise<EtlRunResult> {
  const startDate = targetDate ?? new Date().toISOString().slice(0, 10);
  const isBackfill = options.backfill === true;
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
    outcome = await fetchWithFallback(source, startDate, isBackfill);
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
