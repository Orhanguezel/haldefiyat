import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Megaphone, CalendarDays } from "lucide-react";
import ProductImage from "@/components/ui/ProductImage";
import BannerSlot from "@/components/ads/BannerSlot";
import { fetchPriceHistory } from "@/lib/api";
import { guidesForProduct, latestGuidePrice } from "@/lib/product-guides";
import { formatDateTr } from "@/lib/date-format";

const button = "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-(--color-brand) px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--color-brand)";

type Props = { productSlug: string; productName: string; citySlug?: string; cityName?: string; categorySlug?: string };

export function ProductTradeBanner({ productSlug, productName, citySlug, cityName }: Props) {
  const query = new URLSearchParams({ product: productSlug, type: "alim", ...(citySlug ? { city: citySlug } : {}) });
  return (
    <aside aria-label="Alım ilanı ver" className="my-6 flex flex-col gap-5 rounded-2xl border border-(--color-brand)/30 bg-(--color-surface) p-5 sm:flex-row sm:items-center sm:p-6">
      <div className="flex flex-1 items-center gap-4">
        <ProductImage slug={productSlug} name={productName} size={64} />
        <div>
          <h2 className="font-(family-name:--font-display) text-lg font-bold text-(--color-foreground)">{productName} almak mı istiyorsunuz?</h2>
          <p className="mt-1 text-sm leading-6 text-(--color-muted)">{cityName ? `${cityName} için ürün` : "Ürün"}, miktar ve hedef fiyatınızı belirtin.</p>
        </div>
      </div>
      <Link href={`/ilan-ver?${query}`} className={button}>Alım ilanı ver <ArrowRight size={16} aria-hidden="true" /></Link>
    </aside>
  );
}

export function ProductAdvertisingBanner({ productSlug, citySlug, categorySlug }: Pick<Props, "productSlug" | "citySlug" | "categorySlug">) {
  return (
    <div className="my-6">
      <BannerSlot position="urun_sidebar" wide className="min-w-0" context={{ product: productSlug, city: citySlug, category: categorySlug }} />
      {/* Kendi reklam davetimiz sponsorlu alanla ayni yuksekligi hak etmiyor:
          yan sutunda yarim ekran bos kaliyordu. Tek satirlik serit. */}
      <aside aria-label="HalDeFiyat reklam seçenekleri" className="mx-auto flex max-w-6xl flex-col gap-3 rounded-xl bg-(--color-brand)/8 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--color-brand)/10 text-(--color-brand)"><Megaphone size={18} aria-hidden="true" /></span>
        <p className="flex-1 text-sm leading-6 text-(--color-muted)">
          <span className="font-semibold text-(--color-foreground)">İşinizi tarımın buluşma noktasında tanıtın.</span> Ürün sayfalarında görünür olun.
        </p>
        <Link href="/reklam-ver" className={`${button} shrink-0`}>Reklam ver <ArrowRight size={16} aria-hidden="true" /></Link>
      </aside>
    </div>
  );
}

export function ProductGuideLinks({ productSlug }: { productSlug: string }) {
  const guides = guidesForProduct(productSlug);
  if (!guides.length) return null;
  const winter = guides.some((guide) => ["salca-konserve", "tursu"].includes(guide.slug));
  return (
    <section className="my-10" aria-label="Ürüne göre alım rehberleri">
      <h2 className="font-(family-name:--font-display) text-2xl font-black text-(--color-foreground)">{winter ? "Fiyattan kışlık hazırlığına" : "Alımınızı sezon verileriyle planlayın"}</h2>
      <p className="mt-2 text-sm leading-6 text-(--color-muted)">İlgili ürünlerin son kayıtları ve alım rehberleri. Aşağıdaki fiyatlar Türkiye genelindeki hal kayıtlarından hesaplanır.</p>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {guides.map((guide) => {
          const matched = guide.basket.find((item) => item.slug === productSlug);
          const items = [matched ?? guide.basket[0], ...guide.basket.filter((item) => item.slug !== (matched ?? guide.basket[0]).slug)].slice(0, 2);
          return (
            <article key={guide.slug} className={`overflow-hidden rounded-2xl border border-(--color-border) p-5 sm:p-6 ${guide.slug === "salca-konserve" ? "bg-amber-500/6" : "bg-(--color-brand)/5"}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-(family-name:--font-display) text-xl font-bold text-(--color-foreground)">{guide.h1}</h3>
                  <p className="mt-2 flex items-center gap-2 text-xs text-(--color-muted)"><CalendarDays size={14} aria-hidden="true" /> {guide.seasonWindow}</p>
                </div>
                <ProductImage slug={guide.coverImageSlug} name={guide.h1} size={72} />
              </div>
              <div className="my-5 divide-y divide-(--color-border)">
                {items.map((item) => <div key={item.slug} className="py-3">
                  <Link href={`/urun/${item.slug}`} className="text-sm font-semibold text-(--color-foreground) hover:underline">{item.label}</Link>
                  <Suspense fallback={<p className="mt-1 text-xs text-(--color-muted)">Fiyat kaydı yükleniyor…</p>}><GuidePrice slug={item.slug} /></Suspense>
                </div>)}
              </div>
              <p className="mb-4 text-xs leading-5 text-(--color-muted)">{guide.slug === "salca-konserve" ? "Salça için sofralık fiyatı yerine salçalık çeşitlerin kaydını esas alın." : guide.slug === "tursu" ? "Kornişon ve yeşil domates kayıtları sınırlı olabilir. Çeşit ve hal sayısını birlikte değerlendirin." : "Geçmişteki uygun ay, gelecek fiyatın garantisi değildir. Aylık seyri rehberde karşılaştırın."}</p>
              <Link href={`/rehber/${guide.slug}`} className="inline-flex items-center gap-2 text-sm font-bold text-(--color-brand) hover:underline">Rehberi ve aylık fiyatları incele <ArrowRight size={16} aria-hidden="true" /></Link>
            </article>
          );
        })}
      </div>
      <p className="mt-3 text-xs leading-5 text-(--color-muted)">Fiyat: aynı gün ve birimde, hal başına çeşit ortalamalarının medyanı. Şehir fiyatı, perakende fiyatı veya hazır salça/turşu maliyeti değildir.</p>
    </section>
  );
}

async function GuidePrice({ slug }: { slug: string }) {
  const price = latestGuidePrice(await fetchPriceHistory(slug, undefined, "7d", "daily"));
  if (!price) return <p className="mt-1 text-xs text-(--color-muted)">Son 7 günde karşılaştırılabilir kayıt yok.</p>;
  return <p className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
    <span className="text-xs text-(--color-muted)">{formatDateTr(price.date)} · {price.marketCount} hal{price.marketCount < 3 ? " · sınırlı kayıt" : ""}</span>
    <strong className="font-(family-name:--font-mono) text-sm text-(--color-foreground)">{price.price.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} TL/{price.unit}</strong>
  </p>;
}
