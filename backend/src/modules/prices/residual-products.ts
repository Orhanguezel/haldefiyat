import { and, eq, not, or, sql, type SQL } from "drizzle-orm";
import { hfProducts } from "@/db/schema";

/**
 * "Torba" (artik) urun kayitlari — bir halin adlandirilmis cesitlere sigdiramadigi
 * her seyi attigi kova: "ELMA (DİĞER)", "NAR MUHTELİF", "DOMATES DİĞER (İYİ TARIM)".
 *
 * NEDEN AYRI BIR KAVRAM: bunlar kanonik bagla ana urune bagli oldugu icin satirlari
 * ana urunun YAYIMLANAN ortalamasina giriyordu. Ama torba, tanimi geregi tek bir
 * urun degil: 17 Eyl 2026 olcumunde `dut` ana kaydi 63,00 TL/kg iken torba dahil
 * ortalama 87,43 idi (+%38,8) ve torbanin kendi araligi 29 – 204 TL/kg'di. Nar'da
 * torba 65 – 425 TL/kg. Yedi kat ic araligi olan bir kova tek bir mansaet rakami
 * tasiyamaz — ve o mansaet rakam basliklara, snippet'lere ve AI yanitlarina giriyor.
 *
 * NEREDE DISLANIR: ana urunun ortalamasi ve fiyat gecmisi (mansaet + grafik).
 * NEREDE KALIR: cesit tablosu — okur "bu halde bir de 'diger' kalemi var" bilgisini
 * gormeli; veri gizlenmiyor, yalnizca ortalamaya karistirilmiyor.
 *
 * KENDI SLUG'IYLA SORULURSA DAHILDIR: `?product=elma-muhtelif` cagrisi o kaydin
 * kendi verisini dondurur. Dislama yalnizca kayit KANONIK BAG uzerinden aileye
 * dahil edilirken uygulanir.
 */

/** Slug'da kelime olarak "muhtelif" veya "diger". */
const RESIDUAL_SLUG_RE = /(^|-)(muhtelif|diger)(-|$)/u;

/** `mercan-kosk` ("MERCAN KÖŞK DİĞER") gibi kanonik bagsiz kayitlar torba sayilmaz:
 *  onlarin kendi sayfasi kendi urunudur, bir ailenin artigi degil. */
export function isResidualProduct(product: { slug: string; canonicalSlug?: string | null }): boolean {
  return Boolean(product.canonicalSlug) && RESIDUAL_SLUG_RE.test(product.slug);
}

/** SQL: kanonik bagi olan ve slug'i torba desenine uyan kayit. */
const residualSql: SQL = and(
  sql`${hfProducts.canonicalSlug} IS NOT NULL`,
  sql`${hfProducts.slug} REGEXP '(^|-)(muhtelif|diger)(-|$)'`,
)!;

/**
 * Aile filtresi: master slug + kanonik cocuklari, TORBA olanlar haric.
 * Kaydin kendi slug'i sorulmussa torba olsa bile dahildir.
 */
export function familyScopeExcludingResidual(productSlug: string): SQL {
  return or(
    eq(hfProducts.slug, productSlug),
    and(eq(hfProducts.canonicalSlug, productSlug), not(residualSql)),
  )!;
}

/** Ham SQL sorgulari icin ayni kural (kovalanmis fiyat gecmisi). */
export function familyScopeExcludingResidualRaw(alias: string, productSlug: string): SQL {
  const p = sql.raw(alias);
  return sql`(${p}.slug = ${productSlug} OR (${p}.canonical_slug = ${productSlug}
    AND NOT (${p}.canonical_slug IS NOT NULL AND ${p}.slug REGEXP '(^|-)(muhtelif|diger)(-|$)')))`;
}
