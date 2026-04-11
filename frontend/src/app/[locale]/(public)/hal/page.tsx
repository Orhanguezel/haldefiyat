import type { Metadata } from "next";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { fetchMarkets, type Market } from "@/lib/api";

type Props = { params: Promise<{ locale: string }> };

export function generateMetadata(): Metadata {
  return {
    title: "Tüm Haller",
    description:
      "Türkiye genelindeki hal ve pazarlar bölgelere göre gruplandırılmış liste. Fiyat sayfasına doğrudan erişin.",
    openGraph: {
      title: "Tüm Haller | HaldeFiyat",
      description:
        "Türkiye'deki hal ve pazarların bölgesel listesi — tek tıkla güncel fiyatlar.",
      type: "website",
      locale: "tr_TR",
    },
    alternates: { canonical: "/hal" },
  };
}

interface RegionGroup {
  key: string;
  label: string;
  markets: Market[];
}

const REGION_LABELS: Record<string, string> = {
  marmara: "Marmara",
  ege: "Ege",
  akdeniz: "Akdeniz",
  "ic-anadolu": "İç Anadolu",
  "karadeniz": "Karadeniz",
  "dogu-anadolu": "Doğu Anadolu",
  "guneydogu-anadolu": "Güneydoğu Anadolu",
};

function toTitle(value: string): string {
  return value
    .split(/[-_\s]+/g)
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : ""))
    .join(" ");
}

function groupByRegion(markets: Market[]): RegionGroup[] {
  const groups = new Map<string, RegionGroup>();
  for (const market of markets) {
    const key = (market.regionSlug ?? "diger").trim() || "diger";
    const label = REGION_LABELS[key] ?? toTitle(key);
    if (!groups.has(key)) {
      groups.set(key, { key, label, markets: [] });
    }
    groups.get(key)!.markets.push(market);
  }
  return [...groups.values()].sort((a, b) => a.label.localeCompare(b.label, "tr"));
}

export default async function HalIndexPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const markets = await fetchMarkets();
  const groups = groupByRegion(markets);
  const cityCount = new Set(markets.map((m) => m.cityName)).size;

  return (
    <main className="relative z-10 mx-auto max-w-[1400px] px-8 py-12">
      <header className="mb-10">
        <div className="font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">
          Bölgesel Piyasa Analizi
        </div>
        <h1 className="mt-2 font-(family-name:--font-display) text-3xl font-bold tracking-[-0.02em] text-(--color-foreground) sm:text-4xl">
          Tüm Haller
        </h1>
        <p className="mt-2 font-(family-name:--font-mono) text-[12px] text-(--color-muted)">
          {markets.length} hal · {cityCount} şehir
        </p>
      </header>

      {markets.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-(--color-border-soft) bg-(--color-bg-alt) p-10 text-center text-[13px] text-(--color-muted)">
          Henüz kayıtlı hal bulunmuyor.
        </div>
      ) : (
        <div className="space-y-12">
          {groups.map((group) => (
            <section key={group.key}>
              <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-(--color-border-soft) pb-3">
                <h2 className="font-(family-name:--font-display) text-xl font-bold text-(--color-foreground)">
                  {group.label}
                </h2>
                <span className="font-(family-name:--font-mono) text-[11px] text-(--color-muted)">
                  {group.markets.length} hal
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.markets.map((market) => (
                  <Link
                    key={market.id}
                    href={`/hal/${market.slug}`}
                    className="group flex flex-col gap-2 rounded-[14px] border border-(--color-border) bg-(--color-surface) p-5 transition-all duration-300 hover:-translate-y-[2px] hover:border-(--color-brand)/40 hover:bg-(--color-bg-alt)"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-(family-name:--font-mono) text-[10px] font-semibold uppercase tracking-[0.1em] text-(--color-brand)">
                        {market.cityName}
                      </span>
                      <span
                        aria-hidden
                        className="font-(family-name:--font-mono) text-[14px] text-(--color-muted) transition-transform group-hover:translate-x-0.5 group-hover:text-(--color-brand)"
                      >
                        →
                      </span>
                    </div>
                    <div className="font-(family-name:--font-display) text-[17px] font-bold text-(--color-foreground)">
                      {market.name}
                    </div>
                    <div className="mt-auto font-(family-name:--font-mono) text-[11px] text-(--color-muted)">
                      Fiyatları Gör
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
