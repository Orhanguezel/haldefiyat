"use client";

import ProductImage from "@/components/ui/ProductImage";
import type { SearchFlatRow, SearchResults } from "./types";
import { Clock3, Store, X } from "lucide-react";

interface SearchModalResultsProps {
  query: string;
  results: SearchResults;
  flat: SearchFlatRow[];
  activeIdx: number;
  setActiveIdx: (i: number) => void;
  onNavigate: (row: SearchFlatRow) => void;
  recents?: string[];
  onPickRecent?: (q: string) => void;
  onRemoveRecent?: (q: string) => void;
}

export default function SearchModalResults({
  query,
  results,
  flat,
  activeIdx,
  setActiveIdx,
  onNavigate,
  recents = [],
  onPickRecent,
  onRemoveRecent,
}: SearchModalResultsProps) {
  const hasQuery = query.trim().length > 0;

  if (!hasQuery) {
    if (recents.length && onPickRecent) {
      return (
        <div className="px-4 py-4">
          <div className="pb-2 font-(family-name:--font-mono) text-[10px] font-semibold uppercase tracking-[0.12em] text-(--color-muted)">
            Son aramalar
          </div>
          <div className="flex flex-wrap gap-2">
            {recents.map((term) => (
              <span key={term} className="inline-flex items-center overflow-hidden rounded-full border border-(--color-border) bg-(--color-bg-alt) text-[13px]">
                <button
                  type="button"
                  onClick={() => onPickRecent(term)}
                  className="inline-flex items-center gap-1.5 py-1 pl-3 pr-1 font-medium text-(--color-foreground) hover:text-(--color-brand)"
                >
                  <Clock3 className="h-3.5 w-3.5 text-(--color-muted)" /> {term}
                </button>
                {onRemoveRecent ? (
                  <button
                    type="button"
                    onClick={() => onRemoveRecent(term)}
                    aria-label={`${term} aramasını sil`}
                    className="px-1.5 py-1 text-(--color-muted) hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                ) : null}
              </span>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div className="px-4 py-8 text-center text-[13px] text-(--color-muted)">
        Ürün veya hal ara — mikrofon simgesiyle sesli arayabilirsin.
      </div>
    );
  }

  if (flat.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-[13px] text-(--color-muted)">
        Sonuç bulunamadı.
      </div>
    );
  }

  const productCount = results.products.slice(0, 5).length;

  return (
    <div className="max-h-[60vh] overflow-y-auto py-2">
      {productCount > 0 ? (
        <SearchSection title="Ürünler">
          {results.products.slice(0, 5).map((p, i) => (
            <SearchResultButton
              key={`p-${p.id}`}
              active={activeIdx === i}
              onMouseEnter={() => setActiveIdx(i)}
              onClick={() => onNavigate({ kind: "product", item: p })}
            >
              <ProductImage slug={p.slug} name={p.displayName || p.nameTr} categorySlug={p.categorySlug} imageUrl={p.imageUrl} size={28} />
              <span className="flex-1 truncate text-[14px] font-medium text-(--color-foreground)">
                {p.displayName || p.nameTr}
              </span>
              <span className="rounded-md bg-(--color-bg-alt) px-2 py-0.5 font-(family-name:--font-mono) text-[10px] uppercase tracking-wide text-(--color-muted)">
                {p.categorySlug}
              </span>
            </SearchResultButton>
          ))}
        </SearchSection>
      ) : null}
      {results.markets.slice(0, 5).length > 0 ? (
        <SearchSection title="Haller">
          {results.markets.slice(0, 5).map((m, i) => {
            const globalIdx = productCount + i;
            return (
              <SearchResultButton
                key={`m-${m.id}`}
                active={activeIdx === globalIdx}
                onMouseEnter={() => setActiveIdx(globalIdx)}
                onClick={() => onNavigate({ kind: "market", item: m })}
              >
                <Store className="h-5 w-5 text-(--color-brand)" aria-hidden />
                <span className="flex-1 truncate text-[14px] font-medium text-(--color-foreground)">
                  {m.name}
                </span>
                <span className="text-[11px] text-(--color-muted)">{m.cityName}</span>
              </SearchResultButton>
            );
          })}
        </SearchSection>
      ) : null}
    </div>
  );
}

function SearchSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <div className="px-4 pb-1 pt-2 font-(family-name:--font-mono) text-[10px] font-semibold uppercase tracking-[0.12em] text-(--color-muted)">
        {title}
      </div>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

interface SearchResultButtonProps {
  active: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
  children: React.ReactNode;
}

function SearchResultButton({ active, onMouseEnter, onClick, children }: SearchResultButtonProps) {
  return (
    <button
      type="button"
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={
        "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors " +
        (active ? "bg-(--color-brand)/15 text-(--color-foreground)" : "hover:bg-(--color-bg-alt)")
      }
    >
      {children}
    </button>
  );
}
