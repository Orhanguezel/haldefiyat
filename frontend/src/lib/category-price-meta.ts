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
export async function fetchCategoryHeadline(category: string, maxAgeDays = 30): Promise<CategoryHeadline | null> {
  try {
    const page = await fetchPricesPage({ category, range: "90d", latestOnly: true, limit: 200, sort: "date-desc" });
    const rows = page.items.filter((row) => Number(row.avgPrice) > 0 && row.productName && row.recordedDate);
    if (rows.length === 0) return null;
    const newest = rows.reduce((max, row) => (row.recordedDate > max.recordedDate ? row : max), rows[0]!);
    const age = Date.now() - Date.parse(`${newest.recordedDate.slice(0, 10)}T12:00:00Z`);
    if (!Number.isFinite(age) || age > maxAgeDays * 86400000) return null;
    const dateTr = formatDateTr(newest.recordedDate);
    if (!dateTr) return null;
    return {
      productName: newest.productName!,
      priceTr: Number(newest.avgPrice).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      unit: newest.unit || "kg",
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
