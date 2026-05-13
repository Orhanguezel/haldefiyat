import { fetchRetailPrices } from "@/lib/api";

interface Props {
  productSlug: string;
  productName: string;
  halAvgPrice: number;
}

const CHAIN_META: Record<string, { label: string; sourceUrl: string }> = {
  migros: { label: "Migros", sourceUrl: "migros.com.tr" },
  a101: { label: "A101", sourceUrl: "a101.com.tr" },
  bim: { label: "BİM", sourceUrl: "bim.com.tr" },
  sok: { label: "ŞOK", sourceUrl: "sokmarket.com.tr" },
  carrefour: { label: "CarrefourSA", sourceUrl: "carrefoursa.com" },
};

function formatTr(n: number): string {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDateTr(iso: string): string {
  const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
}

export default async function RetailComparison({ productSlug, productName, halAvgPrice }: Props) {
  const rows = await fetchRetailPrices(productSlug);
  if (rows.length === 0) return null;

  return (
    <div className="mt-8 rounded-xl border border-border bg-surface/50 px-6 py-5">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="text-base font-semibold text-foreground">
          {productName} — Hal vs Market
        </h2>
        <span className="text-[11px] uppercase tracking-[0.1em] text-muted">
          Tahmini perakende karşılaştırması
        </span>
      </div>

      <p className="mb-4 text-xs leading-relaxed text-muted">
        Bu tablo, hal toptan ortalamasıyla seçili büyük zincirlerin etiket fiyatını yan yana
        gösterir. Zincir verisi son 3 günden tek bir günlük örnektir; market fiyatları kampanya,
        bölge ve tarih farkına göre değişebilir.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((row) => {
          const chain = CHAIN_META[row.chainSlug] ?? { label: row.chainSlug, sourceUrl: row.chainSlug };
          const price = parseFloat(row.price);
          const markupPct = halAvgPrice > 0 && Number.isFinite(price)
            ? Math.round(((price - halAvgPrice) / halAvgPrice) * 100)
            : null;

          return (
            <div
              key={row.chainSlug}
              className="rounded-lg border border-border bg-bg/40 px-4 py-3"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold text-foreground">{chain.label}</span>
                {markupPct != null && (
                  <span className="font-(family-name:--font-mono) text-[11px] font-semibold text-(--color-brand)">
                    {markupPct > 0 ? `+%${markupPct}` : `%${markupPct}`}
                  </span>
                )}
              </div>
              <div className="mt-1 font-(family-name:--font-mono) text-lg font-bold text-foreground">
                Tahmini perakende ~₺{formatTr(price)}
              </div>
              <div className="mt-1 text-[11px] text-muted">
                Son güncelleme: {formatDateTr(row.recordedDate)} • Kaynak: {chain.sourceUrl}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-muted/80">
        Hal fiyatı toptan ortalamadır; perakende zincir fiyatına ulaşırken nakliye, soğuk
        zincir, fire ve marka maliyetleri eklenir. Bu nedenle hal-perakende farkı %50-200
        aralığında olabilir.
      </p>
    </div>
  );
}
