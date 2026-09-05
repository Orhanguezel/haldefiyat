import Link from "next/link";
import type { CityProductDetail } from "@/lib/api";
import { cityProductHref, fmtTl, pct } from "@/lib/city-product";
import { formatDateTr } from "@/lib/date-format";

const card = "rounded-2xl border border-(--color-border) bg-(--color-surface) p-5";
const h2 = "font-(family-name:--font-display) text-2xl font-black text-(--color-foreground)";

export function CityProductKeyNumbers({ d }: { d: CityProductDetail }) {
  const { latest, weekAgoAvg, nationalMedian, rank, cities, pair } = d;
  const week = latest && weekAgoAvg ? (latest.avgPrice / weekAgoAvg - 1) * 100 : null;
  const diff = latest && nationalMedian ? (latest.avgPrice / nationalMedian - 1) * 100 : null;
  const items: Array<{ label: string; value: string; sub?: string }> = [
    { label: "Bugünkü ortalama", value: latest ? `${fmtTl(latest.avgPrice)} ₺` : "—", sub: latest ? `${pair.unit} · ${formatDateTr(latest.recordedDate)}` : undefined },
    { label: "Günün aralığı", value: latest?.minPrice != null && latest?.maxPrice != null ? `${fmtTl(latest.minPrice)} – ${fmtTl(latest.maxPrice)}` : "—", sub: `${pair.marketName}` },
    { label: "Haftalık değişim", value: week == null ? "—" : pct(week), sub: weekAgoAvg ? `7 gün önce ${fmtTl(weekAgoAvg)} ₺` : undefined },
    { label: "Şehirler arası", value: diff == null ? "—" : pct(diff), sub: nationalMedian ? `${cities.length} şehir medyanı ${fmtTl(nationalMedian)} ₺${rank ? ` · ${rank}. ucuz` : ""}` : undefined },
  ];
  return (
    <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Özet sayılar">
      {items.map((it) => (
        <div key={it.label} className={card}>
          <p className="font-(family-name:--font-mono) text-[11px] font-bold uppercase tracking-wide text-(--color-muted)">{it.label}</p>
          <p className="mt-2 text-2xl font-black text-(--color-foreground)">{it.value}</p>
          {it.sub ? <p className="mt-1 text-xs text-(--color-muted)">{it.sub}</p> : null}
        </div>
      ))}
    </section>
  );
}

export function CityCompareTable({ d }: { d: CityProductDetail }) {
  const { cities, pair } = d;
  if (!cities.length) return null;
  return (
    <section className="mt-12" aria-label="Şehirler arası karşılaştırma">
      <h2 className={h2}>Diğer şehirlerde {pair.productName.toLocaleLowerCase("tr-TR")} kaç lira?</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-(--color-muted)">Son 7 günde kayıt üreten hallerin en güncel ortalaması, ucuzdan pahalıya. Şehir adı tıklanabilirse o şehrin kendi sayfası var.</p>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-(--color-border)">
        <table className="w-full min-w-[520px] text-sm">
          <thead><tr className="bg-(--color-bg-alt) text-left font-(family-name:--font-mono) text-[11px] uppercase tracking-wide text-(--color-muted)"><th className="px-4 py-3">Şehir</th><th className="px-4 py-3">Hal</th><th className="px-4 py-3 text-right">Ortalama (₺/{pair.unit})</th><th className="px-4 py-3 text-right">Tarih</th></tr></thead>
          <tbody>
            {cities.map((c) => {
              const me = c.citySlug === pair.citySlug;
              return (
                <tr key={`${c.citySlug}-${c.marketSlug}`} className={`border-t border-(--color-border) ${me ? "bg-(--color-brand)/5" : ""}`}>
                  <td className="px-4 py-3 font-semibold text-(--color-foreground)">
                    {c.eligible && !me ? <Link href={cityProductHref(c.citySlug, pair.productSlug)} className="text-(--color-brand) underline underline-offset-2">{c.cityName}</Link> : c.cityName}
                  </td>
                  <td className="px-4 py-3 text-(--color-muted)"><Link href={`/hal/${c.marketSlug}`} className="hover:underline">{c.marketSlug.replace(/-/g, " ")}</Link></td>
                  <td className="px-4 py-3 text-right font-bold text-(--color-brand)">{fmtTl(c.avgPrice)}</td>
                  <td className="px-4 py-3 text-right text-(--color-muted)">{formatDateTr(c.recordedDate)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function MarketMovers({ d }: { d: CityProductDetail }) {
  const { movers, pair } = d;
  if (!movers.length) return null;
  return (
    <section className="mt-12" aria-label="Aynı halde en çok değişenler">
      <h2 className={h2}>{pair.marketName}'nde aynı gün en çok değişen ürünler</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {movers.map((m) => (
          <li key={m.productSlug} className={card}>
            <Link href={m.eligible ? cityProductHref(m.citySlug, m.productSlug) : `/urun/${m.productSlug}`} className="font-semibold text-(--color-foreground) hover:underline">{m.productName}</Link>
            <p className={`mt-1 text-lg font-black ${m.changePct > 0 ? "text-rose-600" : "text-emerald-600"}`}>{pct(m.changePct)}</p>
            <p className="text-xs text-(--color-muted)">{fmtTl(m.prevPrice)} → {fmtTl(m.avgPrice)} ₺</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function EditorialBlocks({ productName, priceFactors, season }: { productName: string; priceFactors: string; season: string }) {
  if (!priceFactors && !season) return null;
  return (
    <section className="mt-12 grid gap-6 md:grid-cols-2" aria-label="Fiyatı etkileyen etkenler ve sezon">
      {priceFactors ? <div className={card}><h2 className="text-lg font-bold text-(--color-foreground)">{productName} fiyatını ne belirler?</h2><p className="mt-3 text-sm leading-7 text-(--color-muted)">{priceFactors}</p></div> : null}
      {season ? <div className={card}><h2 className="text-lg font-bold text-(--color-foreground)">Sezon ve hasat takvimi</h2><p className="mt-3 text-sm leading-7 text-(--color-muted)">{season}</p></div> : null}
    </section>
  );
}
