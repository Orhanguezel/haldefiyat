import Link from "next/link";
import { getSonMakaleler } from "@/lib/analiz";
import { fetchAutoWeeklyReports } from "@/lib/api";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

/**
 * Ana sayfadan analiz raporlarına iç link — en yüksek otoriteli sayfadan
 * "discovered — not indexed" analiz URL'lerine güçlü keşif sinyali (SEO).
 * Saf server component: fetch + statik makaleler birleşir, tarihe göre en yeniler.
 */
export default async function LatestReports({ limit = 6 }: { limit?: number }) {
  const autoReports = await fetchAutoWeeklyReports(8);
  const seen = new Set<string>();
  const reports = [...autoReports, ...getSonMakaleler(20)]
    .filter((m) => {
      if (seen.has(m.slug)) return false;
      seen.add(m.slug);
      return true;
    })
    .sort((a, b) => b.tarih.localeCompare(a.tarih))
    .slice(0, limit);

  if (reports.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-widest text-brand">
            Haftalık Raporlar & Analizler
          </p>
          <h2 className="font-display text-2xl font-bold text-foreground">Son Analiz Raporları</h2>
        </div>
        <Link href="/analiz" className="shrink-0 text-sm font-semibold text-brand hover:underline">
          Tüm raporlar →
        </Link>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
        {reports.map((m) => (
          <li key={m.slug}>
            <Link
              href={`/analiz/${m.slug}`}
              className="group flex h-full flex-col rounded-xl border border-(--color-border) bg-(--color-surface) p-5 transition-colors hover:border-(--color-brand)/30"
            >
              <time className="text-[12px] text-muted" dateTime={m.tarih}>
                {formatDate(m.tarih)}
              </time>
              <h3 className="mt-1 text-[15px] font-semibold leading-snug text-foreground transition-colors group-hover:text-brand">
                {m.baslik}
              </h3>
              {m.ozet ? (
                <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted">{m.ozet}</p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
