"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { Product, Market } from "@/lib/api";
import SearchModalHeader from "./search/SearchModalHeader";
import SearchModalResults from "./search/SearchModalResults";
import {
  cleanVoiceQuery,
  getRecentSearches,
  normalizeSearch,
  pushRecentSearch,
  removeRecentSearch,
  unwrapArray,
  type SearchFlatRow,
  type SearchResults,
} from "./search/types";
import { productHref } from "@/lib/product-links";
import { useModalA11y } from "@/hooks/useModalA11y";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";
import { trackDiscoveryEvent } from "@/lib/analytics";
import { Mic } from "lucide-react";

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8088").replace(/\/$/, "") +
  "/api/v1";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function openSearchModal(): void {
  if (typeof document !== "undefined") {
    document.dispatchEvent(new Event("open-search"));
  }
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastTrackedQueryRef = useRef("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults>({ products: [], markets: [] });
  const [activeIdx, setActiveIdx] = useState(0);
  const [recents, setRecents] = useState<string[]>([]);
  useModalA11y(isOpen, onClose, dialogRef, inputRef);

  // Sesli arama: soylenen cumle dolgu kelimelerden arindirilip sorguya yazilir
  // ("domates fiyatlari bugun" -> "domates"); sonuclar mevcut debounce'la akar.
  const voice = useVoiceSearch((transcript) => setQuery(cleanVoiceQuery(transcript)));

  useEffect(() => {
    if (voice.interim) setQuery(voice.interim);
  }, [voice.interim]);

  const flat = useMemo<SearchFlatRow[]>(() => {
    const rows: SearchFlatRow[] = [];
    results.products.slice(0, 5).forEach((item) => rows.push({ kind: "product", item }));
    results.markets.slice(0, 5).forEach((item) => rows.push({ kind: "market", item }));
    return rows;
  }, [results]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults({ products: [], markets: [] });
      setActiveIdx(0);
      lastTrackedQueryRef.current = "";
      voice.stop();
      return;
    }
    setRecents(getRecentSearches());
    trackDiscoveryEvent("search_opened", { trigger: "programmatic" });
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
    // voice.stop referansi stabil (useCallback []); dep'e eklemek gereksiz re-run yaratir
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const q = query.trim();
    if (q.length < 1) {
      setResults({ products: [], markets: [] });
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const [pRes, mRes] = await Promise.all([
          fetch(`${API_BASE}/prices/products?q=${encodeURIComponent(q)}&canonicalOnly=true`, {
            signal: ctrl.signal,
          }).then((r) => r.json()),
          fetch(`${API_BASE}/prices/markets`, { signal: ctrl.signal }).then((r) => r.json()),
        ]);
        const products = unwrapArray<Product>(pRes);
        const allMarkets = unwrapArray<Market>(mRes);
        const nq = normalizeSearch(q);
        const markets = allMarkets.filter(
          (m) => normalizeSearch(m.name).includes(nq) || normalizeSearch(m.cityName).includes(nq),
        );
        setResults({ products, markets });
        setActiveIdx(0);
        if (lastTrackedQueryRef.current !== nq) {
          lastTrackedQueryRef.current = nq;
          trackDiscoveryEvent("search_submitted", {
            query_length: q.length,
            product_results: products.length,
            market_results: markets.length,
            result_count: products.length + markets.length,
            zero_results: products.length + markets.length === 0,
          });
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setResults({ products: [], markets: [] });
        }
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      ctrl.abort();
      clearTimeout(timer);
    };
  }, [query, isOpen]);

  const handleNavigate = useCallback(
    (row: SearchFlatRow) => {
      const href = row.kind === "product"
        ? productHref({ productSlug: row.item.slug, canonicalSlug: row.item.canonicalSlug })
        : `/hal/${row.item.slug}`;
      trackDiscoveryEvent("search_result_selected", {
        result_type: row.kind,
        result_position: Math.max(1, flat.indexOf(row) + 1),
        item_slug: row.item.slug,
      });
      pushRecentSearch(query);
      onClose();
      router.push(href);
    },
    [flat, router, onClose, query],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document.dispatchEvent(new Event("open-search"));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const handleInputKey = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx(Math.min(activeIdx + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx(Math.max(activeIdx - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const row = flat[activeIdx];
      if (row) handleNavigate(row);
    }
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          key="search-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[200] flex items-start justify-center bg-black/60 px-4 pt-[12vh] backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Arama"
        >
          <motion.div
            ref={dialogRef}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-2xl"
          >
            <SearchModalHeader
              query={query}
              onQueryChange={setQuery}
              onKeyDown={handleInputKey}
              inputRef={inputRef}
              loading={loading}
              onClose={onClose}
              voiceSupported={voice.supported}
              listening={voice.listening}
              onVoiceToggle={voice.listening ? voice.stop : voice.start}
            />
            {voice.listening ? (
              <div className="flex items-center gap-2 border-b border-(--color-border) bg-red-500/10 px-4 py-2 text-sm font-medium text-red-600">
                <Mic className="h-4 w-4 animate-pulse" /> Dinleniyor… şimdi konuşun
              </div>
            ) : voice.error ? (
              <div className="border-b border-(--color-border) bg-amber-500/10 px-4 py-2 text-xs text-amber-700">
                {voice.error}
              </div>
            ) : null}
            <SearchModalResults
              query={query}
              results={results}
              flat={flat}
              activeIdx={activeIdx}
              setActiveIdx={setActiveIdx}
              onNavigate={handleNavigate}
              recents={recents}
              onPickRecent={setQuery}
              onRemoveRecent={(q) => setRecents(removeRecentSearch(q))}
            />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
