import type { ListingBoard as Board } from "@/lib/api";
import Link from "next/link";

function money(value: number | null) {
  if (value == null) return "Eşik yok";
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(value) + " TL";
}

function Side({ title, side }: { title: string; side: Board["sell"] }) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-(--color-foreground)">{title}</h3>
          <p className="text-xs text-(--color-muted)">{side.count} aktif ilan</p>
        </div>
        <strong className="text-sm text-(--color-brand)">{money(side.median)}</strong>
      </div>
      <div className="grid gap-3">
        {side.top3.map((item) => (
          <Link key={item.id} href={`/ilan/${item.slug}`} className="rounded-[8px] border border-(--color-border) bg-(--color-surface) p-3">
            <span className="line-clamp-1 text-sm font-semibold text-(--color-foreground)">{item.title}</span>
            <span className="mt-1 block text-xs text-(--color-muted)">{money(item.price)}</span>
          </Link>
        ))}
        {!side.top3.length ? <p className="text-sm text-(--color-muted)">Uygun ilan yok.</p> : null}
      </div>
    </section>
  );
}

export function ListingBoard({ board }: { board: Board | null }) {
  if (!board) return null;
  return (
    <section className="my-10 border-y border-(--color-border) py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-(family-name:--font-display) text-2xl font-bold text-(--color-foreground)">
            Canlı arz/talep panosu
          </h2>
          <p className="mt-1 text-sm text-(--color-muted)">
            {board.product?.name ?? "Ürün"} · {board.city ?? "Türkiye"}
          </p>
        </div>
        {board.spread == null ? null : (
          <div className="rounded-[6px] bg-(--color-bg-alt) px-3 py-2 text-sm">
            Makas <strong>{money(board.spread)}</strong>
          </div>
        )}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Side title="Satış tarafı" side={board.sell} />
        <Side title="Alım tarafı" side={board.buy} />
      </div>
    </section>
  );
}
