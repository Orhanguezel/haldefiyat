export const dynamic = "force-dynamic";

import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import PageContainer from "@/components/layout/PageContainer";
import { fetchPricesOverview, fetchSourceStatus, type SourceStatusRow } from "@/lib/api";
import { localePath } from "@/lib/locale-path";
import { getPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return getPageMetadata("data_health", {
    locale,
    pathname: "/data-health",
    title: "Veri Sağlığı | HaldeFiyat",
    description: "HaldeFiyat kaynaklarının son çekim, son yayın tarihi ve tazelik durumu.",
  });
}

function formatDate(value?: string | null) {
  if (!value) return "Veri yok";
  const date = new Date(value.includes("T") ? value : `${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return "Veri yok";
  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(value.includes("T") ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

const STATUS_META: Record<SourceStatusRow["status"], { label: string; className: string; symbol: string }> = {
  ok: { label: "Güncel", symbol: "✓", className: "border-emerald-700/25 bg-emerald-600/10 text-emerald-800 dark:text-emerald-300" },
  partial: { label: "Kısmi", symbol: "!", className: "border-amber-700/25 bg-amber-500/10 text-amber-800 dark:text-amber-300" },
  stale: { label: "Gecikmeli", symbol: "◷", className: "border-orange-700/25 bg-orange-500/10 text-orange-800 dark:text-orange-300" },
  error: { label: "Bakımda", symbol: "×", className: "border-red-700/25 bg-red-500/10 text-red-800 dark:text-red-300" },
  no_data: { label: "Veri yok", symbol: "–", className: "border-slate-700/25 bg-slate-500/10 text-slate-700 dark:text-slate-300" },
};

function StatusBadge({ status }: { status: SourceStatusRow["status"] }) {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.className}`}>
      <span aria-hidden>{meta.symbol}</span>{meta.label}
    </span>
  );
}

function SourceDetails({ item }: { item: SourceStatusRow }) {
  return (
    <>
      <div className="font-semibold text-(--color-foreground)">{item.sourceName}</div>
      <div className="mt-0.5 font-(family-name:--font-mono) text-[11px] text-(--color-muted)">{item.sourceApi}</div>
      {item.sourceUrl && (
        <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center text-xs font-semibold text-(--color-brand) hover:underline">
          Resmî kaynağı aç <span className="ml-1" aria-hidden>↗</span>
        </a>
      )}
    </>
  );
}

export default async function DataHealthPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [items, overview] = await Promise.all([fetchSourceStatus(), fetchPricesOverview()]);
  const metricCards = [
    { label: "Güncel ürün", value: overview.currentProducts, note: "Son 7 günde fiyatı olan" },
    { label: "Aktif kaynak", value: overview.activeSources, note: "Son 30 günde veri sağlayan" },
    { label: "Güncel şehir", value: overview.currentCities, note: "Son 30 günde verisi olan" },
    { label: "Son veri tarihi", value: formatDate(overview.latestRecordedDate), note: overview.freshness === "fresh" ? "Veri güncel" : overview.freshness === "stale" ? "Veri gecikmeli" : "Tazelik bilinmiyor" },
  ];

  return (
    <PageContainer className="space-y-8">
      <header className="max-w-3xl">
        <p className="font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">Veri altyapısı</p>
        <h1 className="mt-2 font-(family-name:--font-display) text-3xl font-bold text-(--color-foreground)">Veri Sağlığı</h1>
        <p className="mt-3 text-sm leading-6 text-(--color-muted)">
          Kaynakların son yayın ve aktarım durumunu açıkça gösteriyoruz. Rakamlar ölçüm anındaki gerçek API özetidir; ham sistem hata ayrıntıları güvenlik nedeniyle yayınlanmaz.
        </p>
      </header>

      <section aria-label="Veri kapsamı özeti" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-(--color-muted)">{metric.label}</div>
            <div className="mt-2 font-(family-name:--font-display) text-2xl font-bold text-(--color-foreground)">
              {typeof metric.value === "number" ? metric.value.toLocaleString("tr-TR") : metric.value}
            </div>
            <div className="mt-1 text-xs text-(--color-muted)">{metric.note}</div>
          </div>
        ))}
      </section>

      <section aria-labelledby="status-legend-title" className="rounded-2xl border border-(--color-border) bg-(--color-surface-subtle) p-4 sm:p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 id="status-legend-title" className="font-semibold text-(--color-foreground)">Durumlar nasıl belirleniyor?</h2>
            <p className="mt-1 text-sm leading-6 text-(--color-muted)">Güncel: başarılı ve en fazla 2 günlük veri. Gecikmeli: son yayın tarihi 2 günden eski. Kısmi: aktarımın bir bölümü tamamlandı. Bakımda: son aktarım başarısız. Veri yok: henüz tarih bulunmuyor.</p>
          </div>
          <Link href={localePath(locale, "/metodoloji")} className="inline-flex min-h-11 shrink-0 items-center font-semibold text-(--color-brand) hover:underline">Metodolojiyi incele →</Link>
        </div>
      </section>

      {items.length === 0 ? (
        <div role="status" className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-8 text-center text-sm text-(--color-muted)">Kaynak durumları şu anda alınamıyor. Lütfen daha sonra yeniden deneyin.</div>
      ) : (
        <section aria-label="Kaynak durumları">
          <div className="grid gap-3 md:hidden">
            {items.map((item) => (
              <article key={item.sourceApi} className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
                <div className="flex items-start justify-between gap-3"><div><SourceDetails item={item} /></div><StatusBadge status={item.status} /></div>
                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-(--color-border) pt-4 text-sm">
                  <div><dt className="text-xs text-(--color-muted)">Şehir</dt><dd className="mt-1 font-medium text-(--color-foreground)">{item.city ?? "Belirtilmemiş"}</dd></div>
                  <div><dt className="text-xs text-(--color-muted)">Yazılan satır</dt><dd className="mt-1 font-medium text-(--color-foreground)">{item.rowsInserted.toLocaleString("tr-TR")}</dd></div>
                  <div><dt className="text-xs text-(--color-muted)">Son kaynak tarihi</dt><dd className="mt-1 text-(--color-foreground)">{formatDate(item.lastSourceDate)}</dd></div>
                  <div><dt className="text-xs text-(--color-muted)">Son çekim</dt><dd className="mt-1 text-(--color-foreground)">{formatDate(item.lastRunAt)}</dd></div>
                </dl>
                {item.statusMessage && <p className="mt-3 rounded-xl bg-(--color-surface-subtle) p-3 text-xs leading-5 text-(--color-muted)">{item.statusMessage}</p>}
              </article>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface) md:block">
            <table className="w-full border-collapse">
              <thead><tr className="border-b border-(--color-border) text-left">{["Kaynak", "Şehir", "Durum", "Son kaynak tarihi", "Son çekim", "Satır", "Açıklama"].map((head) => <th key={head} scope="col" className="px-4 py-3 font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.08em] text-(--color-muted)">{head}</th>)}</tr></thead>
              <tbody>{items.map((item) => (
                <tr key={item.sourceApi} className="border-b border-(--color-border)/60 align-top last:border-b-0">
                  <td className="px-4 py-3"><SourceDetails item={item} /></td>
                  <td className="px-4 py-3 text-sm text-(--color-muted)">{item.city ?? "-"}</td>
                  <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-3 font-(family-name:--font-mono) text-xs text-(--color-muted)">{formatDate(item.lastSourceDate)}</td>
                  <td className="px-4 py-3 font-(family-name:--font-mono) text-xs text-(--color-muted)">{formatDate(item.lastRunAt)}</td>
                  <td className="px-4 py-3 font-(family-name:--font-mono) text-xs text-(--color-muted)">{item.rowsInserted.toLocaleString("tr-TR")}</td>
                  <td className="max-w-60 px-4 py-3 text-xs leading-5 text-(--color-muted)">{item.statusMessage ?? "-"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </section>
      )}
    </PageContainer>
  );
}
