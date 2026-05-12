import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { getPageMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import Breadcrumb from "@/components/seo/Breadcrumb";
import { getSonMakaleler } from "@/lib/analiz";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return getPageMetadata("analiz", {
    locale,
    pathname: "/analiz",
    title: "Hal Fiyatı Analizleri & Haftalık Raporlar | HalDeFiyat",
    description:
      "Türkiye toptancı hal fiyatlarının haftalık analizi, mevsimsel trendler ve HaldeFiyat Endeksi yorumları. Tarım ve gıda fiyat haberleri.",
  });
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://haldefiyat.com").replace(/\/$/, "");

function formatDate(iso: string): string {
  return new Date(iso + "T12:00:00Z").toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function AnalizPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const makaleler = getSonMakaleler(20);

  const itemListSchema = {
    name: "HalDeFiyat Analiz ve Raporlar",
    description: "Türkiye toptancı hal fiyatlarına yönelik haftalık raporlar ve derinlemesine analizler.",
    url: `${SITE_URL}/analiz`,
    numberOfItems: makaleler.length,
    itemListElement: makaleler.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/analiz/${m.slug}`,
      name: m.baslik,
    })),
  } satisfies Record<string, unknown>;

  return (
    <main className="mx-auto max-w-4xl px-4 py-16 space-y-10">
      <JsonLd type="Dataset" data={itemListSchema} />
      <Breadcrumb items={[
        { name: "Anasayfa", href: "/" },
        { name: "Analiz", href: "/analiz" },
      ]} />

      <header>
        <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-brand mb-2">
          Haftalık Raporlar & Trend Analizleri
        </p>
        <h1 className="font-display text-4xl font-bold text-foreground mb-4">
          Hal Fiyatı Analizleri
        </h1>
        <p className="text-lg text-muted leading-relaxed max-w-2xl">
          Türkiye'nin 28+ toptancı halinden derlenen verilere dayalı haftalık fiyat raporları,
          mevsimsel trend analizleri ve HaldeFiyat Endeksi yorumları.
        </p>
      </header>

      <ul className="space-y-6" role="list">
        {makaleler.map((m) => (
          <li key={m.slug}>
            <Link
              href={`/analiz/${m.slug}`}
              className="group block rounded-2xl border border-(--color-border) bg-(--color-surface) p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-(--color-brand)/30 hover:shadow-lg"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {m.etiketler.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-(--color-brand)/10 px-2.5 py-0.5 text-[11px] font-semibold text-(--color-brand)"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h2 className="mb-2 text-[18px] font-bold text-(--color-foreground) group-hover:text-(--color-brand) transition-colors leading-snug">
                {m.baslik}
              </h2>
              <p className="mb-4 text-sm text-(--color-muted) leading-relaxed line-clamp-2">
                {m.ozet}
              </p>
              <div className="flex items-center justify-between text-[12px] text-(--color-muted)">
                <span className="font-medium">{m.yazar}</span>
                <time dateTime={m.tarih}>{formatDate(m.tarih)}</time>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
