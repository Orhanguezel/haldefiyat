import Link from "next/link";
import { getProductsInSeason, getMonthName } from "@/lib/season";
import { fetchWidget } from "@/lib/api";

function formatTr(n: number): string {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function SeasonalGuide() {
  const products = getProductsInSeason();
  const monthName = getMonthName();

  if (products.length === 0) return null;

  const slugs = products.map((p) => p.slug);
  const widget = await fetchWidget({ slugs, limit: slugs.length });
  const widgetBySlug = new Map(widget.map((w) => [w.productSlug, w]));

  return (
    <section className="mx-auto max-w-[1400px] px-8 py-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">
            Mevsim Rehberi
          </span>
          <h2 className="mt-1 font-(family-name:--font-display) text-2xl font-bold text-(--color-foreground)">
            {monthName} Ayında Mevsiminde Ürünler
          </h2>
          <p className="mt-1 text-sm text-(--color-muted)">
            Şu an hasat döneminde olan sebze ve meyveler — en taze ve en uygun fiyatlı
          </p>
        </div>
        <Link
          href="/fiyatlar"
          className="shrink-0 font-(family-name:--font-mono) text-[12px] font-semibold text-(--color-brand) hover:underline"
        >
          Tüm fiyatlar →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((p) => {
          const w = widgetBySlug.get(p.slug);
          const hasPrice = w && Number.isFinite(w.avgPrice) && w.avgPrice > 0;
          const changePct = w?.changePct ?? null;
          const isUp = changePct != null && changePct > 0;
          const isDown = changePct != null && changePct < 0;
          const arrow = isUp ? "▲" : isDown ? "▼" : "—";
          const sign = isUp ? "+" : "";
          // PriceTicker ile tutarli: UP=yesil (fiyat yukseliyor), DOWN=kirmizi
          const changeClass = isUp
            ? "bg-green-500/10 text-green-400"
            : isDown
            ? "bg-red-500/10 text-red-400"
            : "bg-blue-500/10 text-blue-400";

          return (
            <Link
              key={p.slug}
              href={`/urun/${p.slug}`}
              className="group flex flex-col gap-2 rounded-[14px] border border-(--color-border) bg-(--color-surface) p-4 transition-colors hover:border-(--color-brand)/50 hover:bg-(--color-bg-alt)"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-3xl leading-none" aria-hidden>
                  {p.emoji}
                </span>
                {hasPrice && (
                  <span className="font-(family-name:--font-mono) text-[14px] font-bold text-(--color-foreground)">
                    ₺{formatTr(w.avgPrice)}
                  </span>
                )}
              </div>
              <div>
                <div className="text-[14px] font-semibold text-(--color-foreground) group-hover:text-(--color-brand)">
                  {p.nameTr}
                </div>
                <div className="mt-0.5 text-[12px] leading-snug text-(--color-muted)">
                  {p.note}
                </div>
                {changePct != null && (
                  <div className="mt-1.5 inline-flex items-center gap-1.5">
                    <span className={`rounded-[4px] px-1.5 py-0.5 font-(family-name:--font-mono) text-[10px] font-semibold ${changeClass}`}>
                      {arrow} {sign}{changePct.toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-(--color-muted)">
                      7 günde
                    </span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
