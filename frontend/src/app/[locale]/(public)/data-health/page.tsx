export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { fetchSourceStatus } from "@/lib/api";
import { getPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return getPageMetadata("data_health", {
    locale,
    pathname: "/data-health",
    title: "Veri Sağlığı | HaldeFiyat",
    description: "HaldeFiyat ETL kaynaklarının son çekim, son kaynak tarihi ve hata durumları.",
  });
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value.includes("T") ? value : `${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("tr-TR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const STATUS_CLASS: Record<string, string> = {
  ok: "border-emerald-400/25 bg-emerald-400/10 text-emerald-100",
  partial: "border-amber-400/25 bg-amber-400/10 text-amber-100",
  stale: "border-orange-400/25 bg-orange-400/10 text-orange-100",
  error: "border-red-400/25 bg-red-400/10 text-red-100",
};

export default async function DataHealthPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const items = await fetchSourceStatus();

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8">
        <p className="font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">
          Veri Altyapısı
        </p>
        <h1 className="mt-2 font-(family-name:--font-display) text-3xl font-bold text-(--color-foreground)">
          Veri Sağlığı
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-(--color-muted)">
          Her kaynak için son ETL koşusu, son yayın tarihi, yazılan satır sayısı ve hata durumu. Bu tablo API ve AI ajan kullanımında verinin tazeliğini doğrulamak için yayınlanır.
        </p>
      </div>

      <div className="overflow-x-auto rounded-[14px] border border-(--color-border) bg-(--color-surface)">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="border-b border-(--color-border) text-left">
              {["Kaynak", "Şehir", "Durum", "Son kaynak tarihi", "Son çekim", "Satır", "Hata"].map((head) => (
                <th key={head} className="px-4 py-3 font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.1em] text-(--color-muted)">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.sourceApi} className="border-b border-(--color-border)/50 last:border-b-0">
                <td className="px-4 py-3">
                  <div className="font-semibold text-(--color-foreground)">{item.sourceName}</div>
                  <div className="font-(family-name:--font-mono) text-[11px] text-(--color-muted)">{item.sourceApi}</div>
                  {item.sourceUrl && (
                    <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex text-xs text-(--color-brand) hover:underline">
                      Kaynağı aç
                    </a>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-(--color-muted)">{item.city ?? "-"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${STATUS_CLASS[item.status] ?? STATUS_CLASS.ok}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3 font-(family-name:--font-mono) text-xs text-(--color-muted)">{formatDate(item.lastSourceDate)}</td>
                <td className="px-4 py-3 font-(family-name:--font-mono) text-xs text-(--color-muted)">{formatDate(item.lastRunAt)}</td>
                <td className="px-4 py-3 font-(family-name:--font-mono) text-xs text-(--color-muted)">{item.rowsInserted.toLocaleString("tr-TR")}</td>
                <td className="max-w-[280px] px-4 py-3 text-xs text-(--color-muted)">{item.errorMsg ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
