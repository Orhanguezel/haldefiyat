import Link from "next/link";
import { fetchCityProductPairs } from "@/lib/api";
import { cityProductHref } from "@/lib/city-product";

/**
 * /urun ve /hal sayfalarindan sehir x urun sayfalarina ic link. Yalniz kapi kosulunu
 * gecen (eligible) ciftler linklenir: noindex sayfaya ic link akitmayiz.
 */
export default async function CityProductLinks({ product, productName, city, cityName }: { product?: string; productName?: string; city?: string; cityName?: string }) {
  const pairs = await fetchCityProductPairs({ eligible: true, product, city });
  if (pairs.length < 2) return null;
  const title = product ? `Şehir şehir ${(productName ?? "").toLocaleLowerCase("tr-TR")} fiyatları` : `${cityName ?? ""} hal fiyatları — ürün sayfaları`;
  return (
    <section className="mt-8 rounded-xl border border-border bg-surface/50 px-6 py-5" aria-label={title}>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {pairs.slice(0, 40).map((p) => (
          <li key={`${p.citySlug}/${p.productSlug}`}>
            <Link href={cityProductHref(p.citySlug, p.productSlug)} className="inline-block rounded-full border border-border px-3 py-1 text-sm text-foreground hover:border-(--color-brand) hover:text-(--color-brand)">
              {product ? p.cityName : p.productName}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
