"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet, apiPost, apiDelete } from "@/lib/api-client";
import {
  getFavorites,
  removeFavorite,
  toggleFavorite as localToggle,
  subscribeFavorites,
  FAVORITES_CHANGE_EVENT,
} from "@/lib/favorites";
import { useAuthSession } from "@/components/providers/AuthSessionProvider";

export const REMOTE_FAVORITES_CHANGED = "haldefiyat:favorites:remote-change";

export type FavoriteProduct = {
  productId: number;
  slug: string;
  nameTr: string;
  displayName?: string | null;
  categorySlug: string;
  unit: string;
};

export function useFavorites() {
  const { user, loading: authLoading } = useAuthSession();
  const userId = user?.id;
  const requestId = useRef(0);
  const [error, setError] = useState(false);
  const [slugs, setSlugs] = useState<string[]>([]);
  const [remoteItems, setRemoteItems] = useState<FavoriteProduct[]>([]);
  const [loadingRemote, setLoadingRemote] = useState(true);

  const fetchRemote = useCallback(async () => {
    const request = ++requestId.current;
    if (authLoading) return;
    if (!userId) {
      setRemoteItems([]);
      setSlugs(getFavorites());
      setError(false);
      setLoadingRemote(false);
      return;
    }
    setLoadingRemote(true);
    setError(false);
    try {
      const res = await apiGet<{ items: FavoriteProduct[] }>("/favorites");
      if (request !== requestId.current) return;
      setRemoteItems(res.items);
      setSlugs(res.items.map((p) => p.slug));
    } catch {
      if (request === requestId.current) setError(true);
    } finally {
      if (request === requestId.current) setLoadingRemote(false);
    }
  }, [userId, authLoading]);

  useEffect(() => {
    setRemoteItems([]);
    setSlugs([]);
    void fetchRemote();
    return () => { requestId.current++; };
  }, [fetchRemote, userId]);

  useEffect(() => {
    const unsubscribe = subscribeFavorites(() => { if (!userId) void fetchRemote(); });
    const changed = () => { void fetchRemote(); };
    window.addEventListener(REMOTE_FAVORITES_CHANGED, changed);
    return () => { unsubscribe(); window.removeEventListener(REMOTE_FAVORITES_CHANGED, changed); };
  }, [fetchRemote, userId]);

  // Login sonrası localStorage'ı DB'ye aktar
  const syncLocalToRemote = useCallback(async () => {
    const local = getFavorites();
    if (local.length === 0 || !userId) return;
    try {
      await apiPost("/favorites/sync", { slugs: local });
      await fetchRemote();
    } catch {
      // sessizce devam
    }
  }, [fetchRemote, userId]);

  const toggle = useCallback(async (slug: string) => {
    if (userId) {
      const currently = slugs.includes(slug);
      if (currently) {
        await apiDelete(`/favorites/${encodeURIComponent(slug)}`);
        removeFavorite(slug);
        setSlugs((s) => s.filter((x) => x !== slug));
        setRemoteItems((s) => s.filter((x) => x.slug !== slug));
      } else {
        await apiPost("/favorites", { productSlug: slug });
        await fetchRemote();
      }
    } else {
      localToggle(slug);
    }
  }, [slugs, fetchRemote, userId]);

  const isFav = useCallback((slug: string) => {
    return slugs.includes(slug);
  }, [slugs]);

  return {
    slugs,
    remoteItems,
    loadingRemote: authLoading || loadingRemote,
    error,
    isFav,
    toggle,
    syncLocalToRemote,
    refetch: fetchRemote,
  };
}

export { FAVORITES_CHANGE_EVENT };
