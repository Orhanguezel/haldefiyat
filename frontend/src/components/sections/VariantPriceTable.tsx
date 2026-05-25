import Link from "next/link";
import { fetchVariantPrices } from "@/lib/api";

interface VariantPriceTableProps {
  masterSlug: string;
  productName: string;
  variantCount: number;
}

function formatPrice(value: number) {
  return value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPct(value: number | null) {
  if (value == null || !Number.isFinite(value)) return "-";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}%`;
}

export default async function VariantPriceTable({
  masterSlug,
  productName,
  variantCount,
}: VariantPriceTableProps) {
  const rows = await fetchVariantPrices(masterSlug, "7d");
  if (rows.length === 0) return null;

  const visibleRows = rows.slice(0, 18);
  const lowerName = productName.toLocaleLowerCase("tr-TR");

  return (
    <section id="variants" className="mt-8 rounded-xl border border-border bg-surface/50 px-6 py-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            {productName} Çeşitleri - Güncel Hal Fiyatları
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Türkiye genelindeki hallerde izlenen {variantCount} farklı {lowerName} çeşidinin
            son 7 günlük ortalama fiyatları.
          </p>
        </div>
        <span className="font-(family-name:--font-mono) text-[11px] uppercase tracking-[0.1em] text-muted">
          {rows.length} fiyatlı varyant
        </span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.08em] text-muted">
              <th className="border-b border-border-soft py-2 pr-4 font-semibold">Çeşit</th>
              <th className="border-b border-border-soft px-4 py-2 text-right font-semibold">7G Ort.</th>
              <th className="border-b border-border-soft px-4 py-2 text-right font-semibold">YoY</th>
              <th className="border-b border-border-soft py-2 pl-4 text-right font-semibold">Hal</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.slug} className="border-b border-border-soft">
                <td className="border-b border-border-soft py-2 pr-4">
                  <Link href={row.url} className="font-medium text-foreground hover:text-brand">
                    {row.displayName}
                  </Link>
                  <span className="ml-2 text-xs text-muted">/{row.unit}</span>
                </td>
                <td className="border-b border-border-soft px-4 py-2 text-right font-(family-name:--font-mono) text-foreground">
                  ₺{formatPrice(row.avgPrice)}
                </td>
                <td className="border-b border-border-soft px-4 py-2 text-right font-(family-name:--font-mono)">
                  <span className={row.yoyPct != null && row.yoyPct > 0 ? "text-red-500" : "text-emerald-500"}>
                    {formatPct(row.yoyPct)}
                  </span>
                </td>
                <td className="border-b border-border-soft py-2 pl-4 text-right text-muted">
                  {row.marketCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
