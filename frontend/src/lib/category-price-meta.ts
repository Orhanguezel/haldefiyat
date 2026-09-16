import { fetchPricesPage } from "@/lib/api";
import { formatDateTr } from "@/lib/date-format";
import { fitMetaDescription } from "@/lib/meta-text";
import { pickTitle } from "@/lib/meta-title";

export type CategoryHeadline = {
  /** "Dana Karkas" — kategorinin en taze, en yuksek hacimli kaydi. */
  productName: string;
  priceTr: string;
  unit: string;
  dateTr: string;
  rowCount: number;
};

/**
 * Kategori listesi sayfalarinin (borsa, et, canli hayvan) baslik ve
 * aciklamasinda kullanilacak gunun rakami.
 *
 * NEDEN: bu sayfalarin baslik/aciklamasi sabitti — ne tarih ne rakam vardi
 * ("Et Fiyatlari — Dana Karkas, Kuzu Karkas"). Uc sayfa da %0,39–0,86 CTR ile
 * indexliydi. Verileri VAR (et 10, canli hayvan 8, hububat 55 satir), sorun
 * snippet'in bos vaat olmasiydi — ayni kusur hal ve urun sayfalarinda 2 Eylul'de
 * duzeltilince esleşmiş kumede CTR %3,22 -> %3,76 cikmisti.
 *
 * Veri yoksa null doner ve cagiran taraf sabit metne duser; sayi uydurulmaz.
 */
/**
 * Kategorinin cipa urunu — basligi hangi urun temsil eder.
 *
 * Kaynak sirasina birakinca en yeni satir hangisiyse o cikiyordu: hububat
 * sayfasinin basligi "Misir 12,00 TL/kg" oldu — hem o dikeyin cipa urunu degil
 * (bugday), hem de ucu bir arada duran misir kayitlarinin EN UCUZU idi.
 */
const CATEGORY_ANCHOR: Record<string, string> = {
  hububat: "bugday",
  et: "dana-karkas",
  "canli-hayvan": "dana",
};

export async function fetchCategoryHeadline(category: string, maxAgeDays = 30): Promise<CategoryHeadline | null> {
  try {
    const page = await fetchPricesPage({ category, range: "90d", latestOnly: true, limit: 200, sort: "date-desc" });
    const rows = page.items.filter((row) => Number(row.avgPrice) > 0 && row.productName && row.recordedDate);
    if (rows.length === 0) return null;

    const newestDate = rows.reduce((max, row) => (row.recordedDate > max ? row.recordedDate : max), rows[0]!.recordedDate);
    const age = Date.now() - Date.parse(`${newestDate.slice(0, 10)}T12:00:00Z`);
    if (!Number.isFinite(age) || age > maxAgeDays * 86400000) return null;
    const dateTr = formatDateTr(newestDate);
    if (!dateTr) return null;

    // O gunun satirlari urun bazinda toplanir; tek bir halin fiyatini kategorinin
    // rakami gibi sunmamak icin cipa urunun o gunku ORTALAMASI yazilir.
    const today = rows.filter((row) => row.recordedDate === newestDate);
    const groups = new Map<string, { name: string; unit: string; values: number[] }>();
    for (const row of today) {
      const key = row.canonicalProduct || row.productSlug || row.productName!;
      const group = groups.get(key) ?? { name: row.productName!, unit: row.unit || "kg", values: [] };
      group.values.push(Number(row.avgPrice));
      groups.set(key, group);
    }
    const anchor = CATEGORY_ANCHOR[category];
    const chosen = (anchor && groups.get(anchor))
      ?? [...groups.values()].sort((a, b) => b.values.length - a.values.length)[0];
    if (!chosen || chosen.values.length === 0) return null;
    const avg = chosen.values.reduce((a, b) => a + b, 0) / chosen.values.length;

    return {
      productName: chosen.name,
      priceTr: avg.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      unit: chosen.unit,
      dateTr,
      rowCount: rows.length,
    };
  } catch {
    return null;
  }
}

export function categoryTitle(base: string, headline: CategoryHeadline | null): string {
  if (!headline) return base;
  return pickTitle([
    `${base} ${headline.dateTr} — ${headline.productName} ${headline.priceTr} TL/${headline.unit}`,
    `${base} — ${headline.productName} ${headline.priceTr} TL/${headline.unit}`,
    `${base} ${headline.dateTr}`,
    base,
  ]);
}

export function categoryDescription(base: string, headline: CategoryHeadline | null, tail: string[] = []): string {
  if (!headline) return base;
  return fitMetaDescription(
    `${headline.dateTr}: ${headline.productName} ${headline.priceTr} TL/${headline.unit}, toplam ${headline.rowCount} güncel kayıt.`,
    [base, ...tail],
  );
}
