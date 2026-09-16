import { fitTitle, pickTitle } from "@/lib/meta-title";
import { fitMetaDescription } from "@/lib/meta-text";
import type { ProductPriceSummary } from "@/lib/product-price-summary";
import { formatAveragePrice } from "@/lib/product-price-summary";

/** Bolge sayfasinin kendi halinden gelen, TAZE oldugu dogrulanmis kayit. */
export type PiyasaLocalPrice = {
  dateTr: string;
  avg: number;
  min?: number | null;
  max?: number | null;
  unit: string;
  marketName: string;
};

export type PiyasaMetaInput = {
  h1: string;
  productName: string;
  region: string;
  /** Config'deki sabit aciklama — sayi yoksa buna donulur. */
  fallbackDescription: string;
};

const tryFmt = (value: number) => value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function range(local: PiyasaLocalPrice): string | null {
  if (typeof local.min !== "number" || typeof local.max !== "number" || local.min <= 0 || local.max < local.min) return null;
  return `${tryFmt(local.min)}–${tryFmt(local.max)} TL/${local.unit}`;
}

/**
 * Piyasa sayfasi basligi — arama dili "piyasa", ve arayan BUGUNUN rakamini istiyor.
 *
 * Eski baslik sabitti: "Erdemli Limon Piyasasi — Kaynak ve Fiyat Kapsami".
 * Tarih de rakam da yok; bu aile %2 civari CTR aliyordu. Ayni kalip hal ve urun
 * sayfalarinda 2 Eylul'de uygulandiginda esleşmiş sorgu kumesinde CTR %3,22 ->
 * %3,76 cikmisti (pozisyon sabit).
 *
 * DURUSTLUK KURALI: yerel kayit yoksa baslik yerel fiyat SOYLEMEZ. Turkiye
 * ortalamasina duser ve bunu acikca yazar — Erdemli bahce fiyati ile Turkiye
 * hal ortalamasi ayni sey degildir ve sayfanin tamami bu ayrim uzerine kurulu.
 */
export function piyasaTitle(input: PiyasaMetaInput, local: PiyasaLocalPrice | null, national: ProductPriceSummary | null): string {
  if (local) {
    const band = range(local);
    return pickTitle([
      `${input.h1} ${local.dateTr} — ${band ?? `${tryFmt(local.avg)} TL/${local.unit}`}`,
      `${input.h1} ${local.dateTr} — ${tryFmt(local.avg)} TL/${local.unit}`,
      `${input.h1} ${local.dateTr}`,
      input.h1,
    ]);
  }
  if (national?.avg != null && national.dateTr) {
    return pickTitle([
      `${input.h1} — Türkiye Ortalaması ${national.dateTr}`,
      `${input.h1} — Türkiye Ortalaması`,
      input.h1,
    ]);
  }
  return fitTitle(input.h1, ["Kaynak ve Fiyat Kapsamı"]);
}

export function piyasaDescription(input: PiyasaMetaInput, local: PiyasaLocalPrice | null, national: ProductPriceSummary | null): string {
  const lower = input.productName.toLocaleLowerCase("tr-TR");
  if (local) {
    const band = range(local);
    return fitMetaDescription(
      `${input.region} ${lower} piyasası ${local.dateTr}: ${local.marketName} kaydında ortalama ${tryFmt(local.avg)} TL/${local.unit}${band ? ` (${band} aralığı)` : ""}.`,
      ["Toptan hal fiyatıdır; bahçe alım fiyatı değildir.", "Çeşit, birim ve tarih ayrımı korunur."],
    );
  }
  if (national?.avg != null && national.dateTr) {
    return fitMetaDescription(
      `${input.region} için doğrulanmış güncel yerel ${lower} kaydı yok. Türkiye genelinde ortalama ${formatAveragePrice(national)} (${national.dateTr}${national.marketCount > 1 ? `, ${national.marketCount} hal` : ""}).`,
      ["Bu sayı yerel bahçe veya toptan fiyatının yerine geçmez."],
    );
  }
  return input.fallbackDescription;
}
