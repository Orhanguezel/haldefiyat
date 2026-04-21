"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { PriceRow } from "@/lib/api";
import {
  getFavorites,
  removeFavorite,
  subscribeFavorites,
} from "@/lib/favorites";
import { getEmoji } from "@/lib/emoji";

const API_BASE: string = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1`
  : "/api/v1";

type LoadState = "idle" | "loading" | "ready";

interface FavoriteEntry {
  slug: string;
  row: PriceRow | null;
}

async function fetchFavoriteRow(slug: string): Promise<PriceRow | null> {
  try {
    const res = await fetch(
      `${API_BASE}/prices?product=${encodeURIComponent(slug)}&range=1d&limit=5`,
      { headers: { Accept: "application/json" }, cache: "no-store" },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { items?: PriceRow[] };
    const items = Array.isArray(json.items) ? json.items : [];
    return items[0] ?? null;
  } catch {
    return null;
  }
}

function fmt(value: string | null | undefined): string {
  if (value == null || value === "") return "—";
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function humanize(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toLocaleUpperCase("tr") + part.slice(1))
    .join(" ");
}

export default function FavoritesClient() {
  const [entries, setEntries] = useState<FavoriteEntry[]>([]);
  const [state, setState] = useState<LoadState>("idle");

  const load = useCallback(async () => {
    const slugs = getFavorites();
    if (slugs.length === 0) {
      setEntries([]);
      setState("ready");
      return;
    }
    setState("loading");
    const rows = await Promise.all(slugs.map(fetchFavoriteRow));
    setEntries(slugs.map((slug, i) => ({ slug, row: rows[i] ?? null })));
    setState("ready");
  }, []);

  useEffect(() => {
    void load();
    const unsub = subscribeFavorites(() => {
      void load();
    });
    return unsub;
  }, [load]);

  const onRemove = (slug: string) => {
    removeFavorite(slug);
  };

  if (state !== "ready") return <SkeletonGrid />;
  if (entries.length === 0) return <EmptyState />;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map(({ slug, row }) => (
        <FavoriteCard key={slug} slug={slug} row={row} onRemove={onRemove} />
      ))}
    </div>
  );
}

function FavoriteCard({
  slug,
  row,
  onRemove,
}: {
  slug: string;
  row: PriceRow | null;
  onRemove: (slug: string) => void;
}) {
  const emoji = getEmoji(slug, row?.categorySlug);
  const name = row?.productName ?? humanize(slug);

  return (
    <div className="group relative overflow-hidden rounded-[16px] border border-(--color-border) bg-(--color-surface) p-6 transition-all duration-300 hover:-translate-y-1 hover:border-(--color-brand)/30">
      <div className="mb-4 flex items-start justify-between gap-2">
        <Link href={`/urun/${slug}`} className="flex items-center gap-2.5">
          <span className="text-[28px]" aria-hidden>{emoji}</span>
          <div>
            <div className="text-[15px] font-bold text-(--color-foreground)">{name}</div>
            {row ? (
              <div className="mt-px text-[11px] text-(--color-muted)">
                {row.marketName} · {row.cityName}
              </div>
            ) : (
              <div className="mt-px text-[11px] text-(--color-muted)">Veri bekleniyor…</div>
            )}
          </div>
        </Link>
        <button
          type="button"
          onClick={() => onRemove(slug)}
          className="rounded-md p-1 text-(--color-muted) transition-colors hover:bg-(--color-bg-alt) hover:text-(--color-danger)"
          aria-label={`${name} favorilerden çıkar`}
          title="Favorilerden çıkar"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {row ? (
        <div className="flex items-baseline gap-2">
          <span className="font-(family-name:--font-mono) text-[28px] font-bold tracking-[-0.02em] text-(--color-foreground)">
            ₺{fmt(row.avgPrice)}
          </span>
          <span className="font-(family-name:--font-mono) text-[12px] text-(--color-muted)">
            /{row.unit || "kg"}
          </span>
        </div>
      ) : (
        <div className="font-(family-name:--font-mono) text-[13px] text-(--color-muted)">
          Bugüne ait kayıt yok.
        </div>
      )}

      {row ? (
        <div className="mt-3 flex items-center justify-between font-(family-name:--font-mono) text-[11px] text-(--color-muted)">
          <span>min ₺{fmt(row.minPrice)} · max ₺{fmt(row.maxPrice)}</span>
          <Link href={`/urun/${slug}`} className="text-(--color-brand) hover:underline">Detay →</Link>
        </div>
      ) : (
        <div className="mt-3 text-right">
          <Link href={`/urun/${slug}`} className="font-(family-name:--font-mono) text-[11px] text-(--color-brand) hover:underline">
            Detay →
          </Link>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[16px] border border-dashed border-(--color-border) bg-(--color-surface) p-12 text-center">
      <div className="mx-auto mb-4 text-5xl" aria-hidden>⭐</div>
      <h2 className="font-(family-name:--font-display) text-xl font-bold text-(--color-foreground)">
        Henüz favori ürün eklemediniz
      </h2>
      <p className="mt-2 text-[13px] text-(--color-muted)">
        Bir ürün sayfasından yıldız butonuyla favorilerinize ekleyebilirsiniz.
      </p>
      <Link
        href="/fiyatlar"
        className="mt-5 inline-flex rounded-[10px] bg-(--color-brand) px-4 py-2 text-[13px] font-semibold text-(--color-navy) hover:opacity-90"
      >
        Fiyatları Keşfet
      </Link>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-40 animate-pulse rounded-[16px] border border-(--color-border) bg-(--color-surface)"
        />
      ))}
    </div>
  );
}
