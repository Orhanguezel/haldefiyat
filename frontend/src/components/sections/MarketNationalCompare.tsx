import Link from "next/link";

import type { MarketComparison } from "@/lib/api";

/**
 * "<sehir> hal fiyatlari" sorgularinin hepsinde 1. sirada o sehrin belediyesi var.
 * Birincil kaynak kendi listesini daha iyi yayinlayamayacagimiz icin ayrisma
 * kiyasta: belediye yalniz kendi halini bilir, biz 20 hali birden biliyoruz.
 * Blok bu yuzden "ucuz mu pahali mi" sorusunu cevaplar, listeyi tekrar etmez.
 */
const tl = (v: number) => v.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (v: number) => `${v > 0 ? "+" : ""}${v.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}%`;

export default function MarketNationalCompare({
  data,
  marketName,
  cityName,
}: {
  data: MarketComparison | null;
  marketName: string;
  cityName: string;
}) {
  const items = data?.items ?? [];
  if (items.length < 3) return null;

  const cheaper = data!.cheaperCount;
  const pricier = data!.pricierCount;
  const peerCount = Math.max(...items.map((i) => i.peerCount));
  const bestDeal = [...items].sort((a, b) => a.diffPct - b.diffPct)[0]!;

  return (
    <section className="mt-8 rounded-xl border border-border bg-surface/50 px-6 py-5">
      <h2 className="text-base font-semibold text-foreground">
        {cityName} hali Türkiye ile kıyaslandığında
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {marketName} fiyatları, aynı ürünün Türkiye genelindeki {peerCount} hal kaydıyla
        karşılaştırıldı. Listedeki {items.length} üründen <strong className="text-foreground">{cheaper} tanesi</strong> Türkiye
        medyanının altında, <strong className="text-foreground">{pricier} tanesi</strong> üstünde.
        {" "}
        En belirgin fark {bestDeal.productName.toLocaleLowerCase("tr-TR")}: {tl(bestDeal.ourPrice)} TL/{bestDeal.unit},
        Türkiye medyanı {tl(bestDeal.nationalMedian)} TL ({pct(bestDeal.diffPct)}).
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="py-2 pr-3 font-medium">Ürün</th>
              <th className="py-2 pr-3 text-right font-medium">Bu hal</th>
              <th className="py-2 pr-3 text-right font-medium">Türkiye medyanı</th>
              <th className="py-2 pr-3 text-right font-medium">Fark</th>
              <th className="py-2 pr-3 text-right font-medium">Sıra</th>
              <th className="py-2 font-medium">En ucuz hal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.productSlug} className="border-b border-border-soft/60 last:border-0">
                <td className="py-2 pr-3">
                  <Link href={`/urun/${it.productSlug}`} className="font-medium text-foreground hover:underline">
                    {it.productName}
                  </Link>
                </td>
                <td className="py-2 pr-3 text-right tabular-nums text-foreground">{tl(it.ourPrice)} TL</td>
                <td className="py-2 pr-3 text-right tabular-nums text-muted">{tl(it.nationalMedian)} TL</td>
                <td
                  className={`py-2 pr-3 text-right tabular-nums ${
                    it.diffPct < 0 ? "text-emerald-600" : it.diffPct > 0 ? "text-rose-600" : "text-muted"
                  }`}
                >
                  {pct(it.diffPct)}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums text-muted">
                  {it.rank}/{it.peerCount}
                </td>
                <td className="py-2 text-muted">
                  {it.cheapest.cityName} · {tl(it.cheapest.price)} TL
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted">
        Sıra, ucuzdan pahalıya doğrudur: 1 = Türkiye&apos;nin en ucuz hali. Her hal için o halin
        son yedi gün içindeki en güncel kaydı kullanılır; farklı haller farklı günlerde yayın
        yaptığı için karşılaştırma aynı güne sabitlenmez. Medyan, işlem hacmine göre
        ağırlıklandırılmış bir ortalama değildir.
      </p>
    </section>
  );
}
