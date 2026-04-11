"use client";

import { useEffect, useRef, useState } from "react";
import type { Market, Product } from "@/lib/api";
import AlertModal from "./AlertModal";
import type { OpenAlertDetail } from "./alert/types";

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8088").replace(/\/$/, "") + "/api/v1";

function unwrapArray<T>(json: unknown): T[] {
  if (Array.isArray(json)) return json as T[];
  if (json && typeof json === "object") {
    const obj = json as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];
  }
  return [];
}

/**
 * Global alarm modal launcher.
 *
 * NEDEN lazy: Products/markets listesi sadece modal ilk acildiginda cekilir.
 * Anasayfa JS bundle'i, kullanici "Alarm Kur" butonuna basmadikca network request
 * acmaz. Prop drilling yerine DOM custom event kullaniyoruz.
 */
export default function AlertModalProvider() {
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [initial, setInitial] = useState<{ product?: string; market?: string }>({});
  const loadedRef = useRef(false);

  useEffect(() => {
    function handleOpen(e: Event) {
      const detail = (e as CustomEvent<OpenAlertDetail>).detail ?? {};
      setInitial({ product: detail.productSlug, market: detail.marketSlug });
      setIsOpen(true);
    }
    document.addEventListener("open-alert", handleOpen);
    return () => document.removeEventListener("open-alert", handleOpen);
  }, []);

  useEffect(() => {
    if (!isOpen || loadedRef.current) return;
    loadedRef.current = true;
    const ctrl = new AbortController();
    (async () => {
      try {
        const [pRes, mRes] = await Promise.all([
          fetch(`${API_BASE}/prices/products`, { signal: ctrl.signal }).then((r) => r.json()),
          fetch(`${API_BASE}/prices/markets`, { signal: ctrl.signal }).then((r) => r.json()),
        ]);
        setProducts(unwrapArray<Product>(pRes));
        setMarkets(unwrapArray<Market>(mRes));
      } catch {
        loadedRef.current = false;
      }
    })();
    return () => ctrl.abort();
  }, [isOpen]);

  return (
    <AlertModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      products={products}
      markets={markets}
      initialProduct={initial.product}
      initialMarket={initial.market}
    />
  );
}
