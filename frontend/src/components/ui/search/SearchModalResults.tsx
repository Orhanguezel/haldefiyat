"use client";

import { getEmoji } from "@/lib/emoji";
import type { SearchFlatRow, SearchResults } from "./types";

interface SearchModalResultsProps {
  query: string;
  results: SearchResults;
  flat: SearchFlatRow[];
  activeIdx: number;
  setActiveIdx: (i: number) => void;
  onNavigate: (row: SearchFlatRow) => void;
}

export default function SearchModalResults({
  query,
  results,
  flat,
  activeIdx,
  setActiveIdx,
  onNavigate,
}: SearchModalResultsProps) {
  const hasQuery = query.trim().length > 0;

  if (!hasQuery) {
    return (
      <div className="px-4 py-8 text-center text-[13px] text-(--color-muted)">
        Aramaya başlamak için bir şey yaz...
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
              <span className="text-xl">{getEmoji(p.slug, p.categorySlug)}</span>
              <span className="flex-1 truncate text-[14px] font-medium text-(--color-foreground)">
                {p.nameTr}
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
                <span className="text-xl">🏪</span>
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
