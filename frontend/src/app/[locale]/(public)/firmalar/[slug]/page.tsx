export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { fetchFirmCities, fetchFirms, fetchFirmTypes, fetchMarkets, fetchPrices, type Firm } from "@/lib/api";
import { getPageMetadata } from "@/lib/seo";
import { provinceBySlug } from "@/data/turkey-cities";
import Breadcrumb from "@/components/seo/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import FirmCard from "@/components/firms/FirmCard";

type Props = { params: Promise<{ locale: string; slug: string }> };

const YEAR = new Date().getFullYear();
const TYPE_SLUGS: Record<string, Firm["firmType"]> = {
  komisyoncu: "komisyoncu",
  "soguk-hava": "soguk_hava",
  nakliye: "nakliye",
  "zirai-ilac": "zirai_ilac",
};

const TYPE_META: Record<Firm["firmType"], { slug: string; label: string; title: string; h1: string; intro: string }> = {
  komisyoncu: {
    slug: "komisyoncu",
    label: "Komisyoncu",
    title: `Türkiye Hal Komisyoncuları ${YEAR} — Firma, İletişim & Adres`,
    h1: "Türkiye Hal Komisyoncuları",
    intro: "Türkiye genelindeki hal komisyoncularını şehir, ilçe ve iletişim bilgilerine göre inceleyin. Komisyoncu profilleri, üretici ile alıcı arasındaki günlük hal ticaretinde ürün kabulü, satış takibi ve fiyat bilgisinin pratik şekilde bulunması için düzenlenir.",
  },
  soguk_hava: {
    slug: "soguk-hava",
    label: "Soğuk Hava",
    title: `Türkiye Soğuk Hava Firmaları ${YEAR} — Firma, İletişim & Adres`,
    h1: "Türkiye Soğuk Hava Firmaları",
    intro: "Soğuk hava firmalarını şehir ve iletişim bilgilerine göre inceleyin. Depolama, sevkiyat öncesi bekletme ve ürün muhafazası süreçlerinde doğru bölgedeki işletmeye hızlı ulaşmak için bu hub güncel firma kayıtlarını listeler.",
  },
  nakliye: {
    slug: "nakliye",
    label: "Nakliye",
    title: `Türkiye Hal Nakliye Firmaları ${YEAR} — Firma, İletişim & Adres`,
    h1: "Türkiye Hal Nakliye Firmaları",
    intro: "Hal nakliye firmalarını şehir bazında tarayın. Yaş sebze ve meyve taşımacılığında güzergah, araç uygunluğu ve iletişim bilgisini hızlı karşılaştırmak için aktif firma kayıtları tek listede toplanır.",
  },
  zirai_ilac: {
    slug: "zirai-ilac",
    label: "Zirai İlaç",
    title: `Türkiye Zirai İlaç Firmaları ${YEAR} — Firma, İletişim & Adres`,
    h1: "Türkiye Zirai İlaç Firmaları",
    intro: "Zirai ilaç ve tarımsal girdi firmalarını şehir bazında inceleyin. Üretici ve ticari alıcıların yerel işletmelere ulaşabilmesi için aktif kayıtlar adres ve iletişim bilgileriyle listelenir.",
  },
};

function isTypeSlug(slug: string): slug is keyof typeof TYPE_SLUGS {
  return Object.prototype.hasOwnProperty.call(TYPE_SLUGS, slug);
}

function cityLabel(slug: string, fallback?: string): string {
  return provinceBySlug(slug)?.label ?? fallback ?? titleCaseSlug(slug);
}

function titleCaseSlug(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase("tr") + part.slice(1))
    .join(" ");
}

function normalizeTrSlug(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("tr")
    .replace(/İ/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function findCityMarket(citySlug: string) {
  const markets = await fetchMarkets();
  return markets.find((market) => (
    market.marketType !== "borsa" &&
    market.marketType !== "resmi" &&
    market.regionSlug !== "ulusal" &&
    normalizeTrSlug(market.cityName) === normalizeTrSlug(citySlug)
  )) ?? null;
}

async function cityContext(slug: string) {
  const [cities, firmPage, market] = await Promise.all([
    fetchFirmCities(),
    fetchFirms({ city: slug, type: "komisyoncu", limit: 60 }),
    findCityMarket(slug),
  ]);
  const aggregate = cities.find((item) => item.citySlug === slug);
  const knownCity = provinceBySlug(slug);
  if (!aggregate && !knownCity) return null;
  const cityName = cityLabel(slug, aggregate?.cityName);
  const prices = market ? await fetchPrices({ market: market.slug, range: "7d", limit: 4 }) : [];
  return { aggregate, cityName, firmPage, market, prices };
}

type CityContext = NonNullable<Awaited<ReturnType<typeof cityContext>>>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;

  if (isTypeSlug(slug)) {
    const type = TYPE_SLUGS[slug];
    const types = await fetchFirmTypes();
    const total = types.find((item) => item.firmType === type)?.total ?? 0;
    const meta = TYPE_META[type];
    return getPageMetadata(["firmalar_tip", "firmalar"], {
      locale,
      pathname: `/firmalar/${slug}`,
      vars: {
        type: meta.h1,
      },
      title: meta.title.replace(" — Firma", ` — ${total} Firma`),
      description: `${meta.h1}: ${total} aktif firma. Telefon, adres ve şehir bazlı firma rehberi.`,
      robots: { index: true, follow: true },
    });
  }

  const ctx = await cityContext(slug);
  // notFound() BURADA cagrilmaz: generateMetadata icinde cagrilirsa Next
  // render agacini kurmadan kisa devre yapar ve stillendirilmis not-found.tsx
  // yerine ciplak hata kabugu doner. 404'u page component'i veriyor.
  if (!ctx) return { title: "Sayfa bulunamadı", robots: { index: false, follow: false } };
  const total = ctx.aggregate?.total ?? ctx.firmPage.meta.total;
  return getPageMetadata(["firmalar_sehir", "firmalar"], {
    locale,
    pathname: `/firmalar/${slug}`,
    vars: {
      city: ctx.cityName,
      year: String(YEAR),
    },
    title: `${ctx.cityName} Hal Komisyoncuları ${YEAR} — ${total} Firma, İletişim & Adres`,
    description: `${ctx.cityName} halindeki ${total} komisyoncu ve firma: telefon, adres, çalıştıkları ürünler. ${ctx.cityName} hal güncel sebze meyve fiyatları.`,
    robots: total >= 5 ? { index: true, follow: true } : { index: false, follow: true },
  });
}

export default async function FirmHubPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  if (isTypeSlug(slug)) {
    return <TypeHub slug={slug} />;
  }

  const ctx = await cityContext(slug);
  if (!ctx) notFound();
  return <CityHub slug={slug} {...ctx} />;
}

async function TypeHub({ slug }: { slug: keyof typeof TYPE_SLUGS }) {
  const type = TYPE_SLUGS[slug];
  const [types, cities, firmPage] = await Promise.all([
    fetchFirmTypes(),
    fetchFirmCities(),
    fetchFirms({ type, limit: 60 }),
  ]);
  const total = types.find((item) => item.firmType === type)?.total ?? firmPage.meta.total;
  const meta = TYPE_META[type];

  const schema = {
    name: meta.h1,
    url: `/firmalar/${slug}`,
    numberOfItems: total,
    itemListElement: firmPage.items.slice(0, 20).map((firm, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `/firma/${firm.slug}`,
      name: firm.name,
    })),
  } satisfies Record<string, unknown>;

  return (
    <main className="relative z-10 mx-auto max-w-[1400px] px-8 py-12">
      <JsonLd type="ItemList" data={schema} />
      <Breadcrumb items={[
        { name: "Anasayfa", href: "/" },
        { name: "Firmalar", href: "/firmalar" },
        { name: meta.label, href: `/firmalar/${slug}` },
      ]} />
      <HubHeader eyebrow="B2B Firma Rehberi" title={`${meta.h1} (${total} firma)`} description={meta.intro} />

      <section className="mb-8 rounded-[8px] border border-(--color-border) bg-(--color-surface) p-5">
        <h2 className="font-(family-name:--font-display) text-xl font-bold text-(--color-foreground)">İllere Göre Firma Hub'ları</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {cities.filter((city) => city.total >= 5).slice(0, 60).map((city) => (
            <Link key={city.citySlug} href={`/firmalar/${city.citySlug}`} className="rounded-[6px] border border-(--color-border-soft) px-3 py-2 text-[12px] text-(--color-foreground) hover:border-(--color-brand)/45">
              {city.cityName} <span className="text-(--color-muted)">({city.total})</span>
            </Link>
          ))}
        </div>
      </section>

      <FirmGrid firms={firmPage.items} />
    </main>
  );
}

function CityHub({
  slug,
  aggregate,
  cityName,
  firmPage,
  market,
  prices,
}: CityContext & { slug: string }) {
  const total = aggregate?.total ?? firmPage.meta.total;
  const districts = districtSummary(firmPage.items);
  const priceDate = prices[0]?.recordedDate;
  const topProducts = prices.slice(0, 3).map((price) => `${price.productName} ${formatPrice(price.avgPrice)}`);
  const marketHref = market ? `/hal/${market.slug}` : null;

  const intro = `${cityName} hal komisyoncuları ve firmaları rehberinde ${total} aktif kayıt yer alıyor. ${districts.length > 0 ? `Kayıtlar özellikle ${districts.join(", ")} ilçelerinde yoğunlaşıyor. ` : ""}${cityName} komisyoncu arayan üretici, tüccar ve alıcılar telefon, adres ve firma tipine göre hızlı karşılaştırma yapabilir.${marketHref ? ` ${cityName} hali fiyat sayfasıyla birlikte kullanıldığında satış ve sevkiyat planı daha net kurulabilir.` : " Bu sayfa fiyat verisine bağlı kalmadan gerçek işletme dizini olarak çalışır."}`;

  const schema = {
    name: `${cityName} Hal Komisyoncuları ve Firmaları`,
    url: `/firmalar/${slug}`,
    numberOfItems: total,
    itemListElement: firmPage.items.slice(0, 20).map((firm, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `/firma/${firm.slug}`,
      name: firm.name,
    })),
  } satisfies Record<string, unknown>;

  return (
    <main className="relative z-10 mx-auto max-w-[1400px] px-8 py-12">
      <JsonLd type="ItemList" data={schema} />
      <Breadcrumb items={[
        { name: "Anasayfa", href: "/" },
        { name: "Firmalar", href: "/firmalar" },
        { name: cityName, href: `/firmalar/${slug}` },
      ]} />
      <HubHeader
        eyebrow={`${cityName} Komisyoncu Rehberi`}
        title={`${cityName} Hal Komisyoncuları ve Firmaları`}
        description={intro}
      />

      <section className={`mb-8 grid gap-4 ${marketHref ? "lg:grid-cols-[1.2fr_0.8fr]" : ""}`}>
        {marketHref && (
          <div className="rounded-[8px] border border-(--color-border) bg-(--color-surface) p-5">
            <h2 className="font-(family-name:--font-display) text-xl font-bold text-(--color-foreground)">
              {cityName} Hali Fiyat Bağlantısı
            </h2>
            <p className="mt-2 text-sm leading-6 text-(--color-muted)">
              Firma aramasını hal fiyatlarıyla birlikte değerlendirin. Komisyoncu görüşmeleri öncesinde ürün bazlı min, ortalama ve maks fiyatları kontrol edebilirsiniz.
            </p>
            {topProducts.length > 0 && (
              <p className="mt-3 font-(family-name:--font-mono) text-[12px] text-(--color-muted)">
                {priceDate ? `${priceDate}: ` : ""}{topProducts.join(" · ")}
              </p>
            )}
            <Link href={marketHref} className="mt-4 inline-flex rounded-[6px] bg-(--color-brand) px-4 py-2 font-(family-name:--font-mono) text-[12px] font-semibold text-white">
              {cityName} hal fiyatlarına bak
            </Link>
          </div>
        )}
        <div className="rounded-[8px] border border-(--color-border) bg-(--color-surface) p-5">
          <h2 className="font-(family-name:--font-display) text-xl font-bold text-(--color-foreground)">Firma Dağılımı</h2>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            <Stat label="Toplam firma" value={total} />
            <Stat label="Komisyoncu" value={aggregate?.byType.komisyoncu ?? firmPage.meta.total} />
            <Stat label="Soğuk hava" value={aggregate?.byType.soguk_hava ?? 0} />
            <Stat label="Nakliye" value={aggregate?.byType.nakliye ?? 0} />
          </dl>
        </div>
      </section>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-(--color-border-soft) pb-3">
        <h2 className="font-(family-name:--font-display) text-xl font-bold text-(--color-foreground)">
          {cityName} Komisyoncu Listesi
        </h2>
        <Link href={`/firmalar?city=${encodeURIComponent(slug)}`} className="font-(family-name:--font-mono) text-[12px] font-semibold text-(--color-brand)">
          Filtreli liste görünümü
        </Link>
      </div>
      <FirmGrid firms={firmPage.items} />
    </main>
  );
}

function HubHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <header className="mb-8">
      <span className="font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">
        {eyebrow}
      </span>
      <h1 className="mt-1 font-(family-name:--font-display) text-3xl font-bold text-(--color-foreground) sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 max-w-4xl text-sm leading-6 text-(--color-muted)">
        {description}
      </p>
    </header>
  );
}

function FirmGrid({ firms }: { firms: Firm[] }) {
  if (firms.length === 0) {
    return (
      <div className="rounded-[8px] border border-dashed border-(--color-border-soft) bg-(--color-bg-alt) p-10 text-center text-sm text-(--color-muted)">
        Bu hub için aktif firma kaydı bekleniyor.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {firms.map((firm) => (
        <FirmCard key={firm.id} firm={firm} />
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[6px] border border-(--color-border-soft) p-3">
      <dt className="font-(family-name:--font-mono) text-[10px] uppercase tracking-[0.08em] text-(--color-muted)">{label}</dt>
      <dd className="mt-1 font-(family-name:--font-display) text-2xl font-bold text-(--color-foreground)">{value}</dd>
    </div>
  );
}

function districtSummary(firms: Firm[]): string[] {
  const counts = new Map<string, number>();
  for (const firm of firms) {
    if (!firm.districtSlug) continue;
    counts.set(firm.districtSlug, (counts.get(firm.districtSlug) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "tr"))
    .slice(0, 4)
    .map(([slug]) => titleCaseSlug(slug));
}

function formatPrice(value?: string | number | null): string {
  if (!value) return "-";
  return `${Number(value).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
}
