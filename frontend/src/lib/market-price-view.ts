import type { PriceRow, Product } from "@/lib/api";

/**
 * Ana hal tablosunda yalniz kaynagin en son yayin gununu tutar.
 * Arsiv kayitlari ayri ve sayfalanmis gorunumde sunulur.
 */
export function latestMarketRows(prices: PriceRow[]): PriceRow[] {
  const latestDate = prices
    .map((price) => price.recordedDate.slice(0, 10))
    .filter(Boolean)
    .sort()
    .at(-1);

  if (!latestDate) return [];
  return prices.filter((price) => price.recordedDate.slice(0, 10) === latestDate);
}

/**
 * Ilk ekran urunleri sabit bir editoryel listeyle degil, urun katalogundaki
 * dogrulanmis arama talebiyle siralanir. Halin o gun yayimlamadigi urun aday
 * olamaz; esitlikte gorunen ad deterministik sirayi korur.
 */
export function rankCurrentMarketRows(prices: PriceRow[], products: Product[]): PriceRow[] {
  const searchVolume = new Map(products.map((product) => [product.slug, product.searchVolume ?? 0]));
  return [...prices].sort((left, right) => {
    const leftVolume = searchVolume.get(left.canonicalProduct || left.productSlug)
      ?? searchVolume.get(left.productSlug)
      ?? 0;
    const rightVolume = searchVolume.get(right.canonicalProduct || right.productSlug)
      ?? searchVolume.get(right.productSlug)
      ?? 0;
    return rightVolume - leftVolume || left.productName.localeCompare(right.productName, "tr");
  });
}
