import type { RetailPriceRow } from "./api";

export const MAX_RETAIL_MARKUP_PCT = 1_000;

export type PlausibleRetailPrice = RetailPriceRow & {
  numericPrice: number;
  markupPct: number | null;
};

/**
 * Perakende kartı bir fiyat kaynağı değil, hal fiyatından türetilen karşılaştırmadır.
 * Geçersiz veya hal ortalamasının on bir katını aşan (%1000 üzeri) sert eşleme/türev
 * anomalilerini yayınlamaz. Olağan raf marjı için dar ve yanıltıcı bir tavan varsaymaz.
 */
export function plausibleRetailPrices(rows: RetailPriceRow[], halAvgPrice: number): PlausibleRetailPrice[] {
  const hasWholesale = Number.isFinite(halAvgPrice) && halAvgPrice > 0;

  return rows.flatMap((row) => {
    const numericPrice = Number.parseFloat(row.price);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) return [];
    const markupPct = hasWholesale ? Math.round(((numericPrice - halAvgPrice) / halAvgPrice) * 100) : null;
    if (markupPct != null && markupPct > MAX_RETAIL_MARKUP_PCT) return [];
    return [{ ...row, numericPrice, markupPct }];
  });
}
