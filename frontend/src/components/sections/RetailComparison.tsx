import { fetchRetailPrices } from "@/lib/api";
import { formatDateTr } from "@/lib/date-format";
import { plausibleRetailPrices } from "@/lib/retail-price-guard";
import { retailFreshnessLabel } from "@/lib/retail-freshness";

interface Props {
  productSlug: string;
  productName: string;
  halAvgPrice: number;
  derivedAverageCount?: number;
  observationCount?: number;
}

const CHAIN_META: Record<string, { label: string; sourceUrl: string }> = {
  migros: { label: "Migros", sourceUrl: "migros.com.tr" },
  a101: { label: "A101", sourceUrl: "a101.com.tr" },
  bim: { label: "BİM", sourceUrl: "bim.com.tr" },
  sok: { label: "ŞOK", sourceUrl: "sokmarket.com.tr" },
  carrefour: { label: "CarrefourSA", sourceUrl: "carrefoursa.com" },
  tarim_kredi: { label: "KOOP Market", sourceUrl: "tkkoop.com.tr" },
};

function retailChainMeta(chainSlug: string) {
  const known = CHAIN_META[chainSlug];
  if (known) return known;
  const publicLabel = chainSlug
    .split(/[_-]+/u)
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase("tr-TR") + part.slice(1))
    .join(" ");
  return { label: publicLabel || "Perakende zinciri", sourceUrl: "Perakende zinciri" };
}

function formatTr(n: number): string {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function RetailComparison({
  productSlug,
  productName,
  halAvgPrice,
  derivedAverageCount = 0,
  observationCount = 0,
}: Props) {
  const rows = plausibleRetailPrices(await fetchRetailPrices(productSlug), halAvgPrice);
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
        bölge ve tarih farkına göre değişebilir. Perakende verisi destekleyicidir; HalDeFiyat
        Endeksi&apos;ni veya hal ortalamasını sürmez. Kaynak çağrı limiti nedeniyle bazı zincir/ürünler
        bir gün eksik kalabilir. {derivedAverageCount > 0 ? (
          <>Hal bazının {derivedAverageCount}/{observationCount} kaydı min–maks orta noktasıdır; işlem hacmi ağırlıklı değildir.</>
        ) : null}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((row) => {
          const chain = retailChainMeta(row.chainSlug);
          const price = row.numericPrice;
          const markupPct = row.markupPct;

          return (
            <div
              key={row.chainSlug}
              className="rounded-lg border border-border bg-bg/40 px-4 py-3"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold text-foreground">{chain.label}</span>
                <span className="font-(family-name:--font-mono) text-[11px] font-semibold text-(--color-brand)">
                  {markupPct > 0 ? `+%${markupPct}` : `%${markupPct}`}
                </span>
              </div>
              <div className="mt-1 font-(family-name:--font-mono) text-lg font-bold text-foreground">
                Tahmini perakende ~₺{formatTr(price)}
              </div>
              <div className="mt-1 text-[11px] text-muted">
                Veri tazeliği: {retailFreshnessLabel(row.recordedDate)} • {formatDateTr(row.recordedDate, { day: "numeric", month: "long" }) ?? "Tarih doğrulanamadı"} • Kaynak: {chain.sourceUrl}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-muted/80">
        Hal fiyatı toptan ortalamadır; perakende zincir fiyatına ulaşırken nakliye, soğuk
        zincir, fire, paket/gramaj ve marka maliyetleri eklenir. Fark ürün ve döneme göre
        geniş ölçüde değişebilir; bu oran bir piyasa kuralı veya fiyat tahmini değildir.
      </p>
    </div>
  );
}
