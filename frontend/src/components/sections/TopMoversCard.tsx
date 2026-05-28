import Link from "next/link";
import type { WidgetPrice } from "@/lib/api";

function movers(items: WidgetPrice[], direction: "up" | "down") {
  return items
    .filter((item) => Number.isFinite(item.changePct ?? NaN) && (direction === "up" ? (item.changePct ?? 0) > 0 : (item.changePct ?? 0) < 0))
    .sort((a, b) => direction === "up" ? (b.changePct ?? 0) - (a.changePct ?? 0) : (a.changePct ?? 0) - (b.changePct ?? 0))
    .slice(0, 5);
}

export default function TopMoversCard({ items }: { items: WidgetPrice[] }) {
  const up = movers(items, "up");
  const down = movers(items, "down");

  return (
    <section className="px-4 py-5">
      <div className="rounded-lg border border-(--color-border) bg-(--color-surface) p-4">
        <div className="font-(family-name:--font-mono) text-[10px] font-bold uppercase tracking-[0.12em] text-(--color-brand)">
          Bugünün Hareketleri
        </div>
        <div className="mt-4 grid gap-4">
          <MoverList title="Pahalananlar" rows={up} empty="Artış verisi yok" />
          <MoverList title="Ucuzlayanlar" rows={down} empty="Düşüş verisi yok" />
        </div>
      </div>
    </section>
  );
}

function MoverList({ title, rows, empty }: { title: string; rows: WidgetPrice[]; empty: string }) {
  return (
    <div>
      <h3 className="text-[13px] font-black text-(--color-foreground)">{title}</h3>
      <div className="mt-2 space-y-2">
        {rows.length ? rows.map((row) => (
          <Link key={`${title}-${row.productSlug}`} href={`/urun/${row.productSlug}`} className="flex min-h-11 items-center justify-between gap-3 rounded-md bg-(--color-background) px-3">
            <span className="truncate text-[13px] font-semibold text-(--color-foreground)">{row.productName}</span>
            <span className={`text-[12px] font-black ${(row.changePct ?? 0) >= 0 ? "text-(--color-success)" : "text-(--color-danger)"}`}>
              {(row.changePct ?? 0) >= 0 ? "+" : ""}{(row.changePct ?? 0).toFixed(1)}%
            </span>
          </Link>
        )) : (
          <div className="min-h-11 rounded-md bg-(--color-background) px-3 py-3 text-[13px] text-(--color-muted)">{empty}</div>
        )}
      </div>
    </div>
  );
}
