import { fetchVariantPrices } from "@/lib/api";
import { getProductDisplayName } from "@/lib/product-display-name";

interface VariantPriceTableProps {
  masterSlug: string;
  productName: string;
  variantCount: number;
}

function formatPrice(value: number) {
  return value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function VariantPriceTable({
  masterSlug,
  productName,
  variantCount,
}: VariantPriceTableProps) {
  const rows = await fetchVariantPrices(masterSlug, "7d");
  if (rows.length === 0) return null;

  const visibleRows = rows.slice(0, 18);
  const hasYoy = visibleRows.some((row) => row.priorYearAvgPrice != null && Number.isFinite(row.priorYearAvgPrice));
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

      <div
        className="mt-4 overflow-x-auto"
        role="region"
        aria-label={`${productName} çeşit fiyat tablosu`}
        tabIndex={0}
      >
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.08em] text-muted">
              <th className="border-b border-border-soft py-2 pr-4 font-semibold">Çeşit</th>
              <th className="border-b border-border-soft px-4 py-2 text-right font-semibold">7G Ort.</th>
              {hasYoy && <th className="border-b border-border-soft px-4 py-2 text-right font-semibold">Geçen yıl aynı dönem</th>}
              <th className="border-b border-border-soft py-2 pl-4 text-right font-semibold">Hal</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.slug} className="border-b border-border-soft">
                <td className="border-b border-border-soft py-2 pr-4">
                  <span className="font-medium text-foreground">
                    {getProductDisplayName({ displayName: row.displayName, nameTr: row.nameTr ?? row.displayName })}
                  </span>
                  <span className="ml-2 text-xs text-muted">/{row.unit}</span>
                </td>
                <td className="border-b border-border-soft px-4 py-2 text-right font-(family-name:--font-mono) text-foreground">
                  ₺{formatPrice(row.avgPrice)}
                </td>
                {hasYoy && <td className="border-b border-border-soft px-4 py-2 text-right font-(family-name:--font-mono)">
                  {row.priorYearAvgPrice != null && Number.isFinite(row.priorYearAvgPrice)
                    ? `₺${formatPrice(row.priorYearAvgPrice)}` : "—"}
                </td>}
                <td className="border-b border-border-soft py-2 pl-4 text-right text-muted">
                  {row.marketCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {hasYoy && <p className="mt-3 text-xs text-muted">Geçen yıl fiyatı, aynı çeşit, hal ve birimde eşleşen günlerin ortalamasıdır.</p>}
      </div>
    </section>
  );
}
