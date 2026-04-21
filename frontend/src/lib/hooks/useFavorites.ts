"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost, apiDelete } from "@/lib/api-client";
import {
  getFavorites,
  isFavorite as localIsFavorite,
  toggleFavorite as localToggle,
  subscribeFavorites,
  FAVORITES_CHANGE_EVENT,
} from "@/lib/favorites";
import { getStoredAccessToken } from "@/lib/auth-token";

export type FavoriteProduct = {
  productId: number;
  slug: string;
  nameTr: string;
  categorySlug: string;
  unit: string;
};

function isLoggedIn() {
  return Boolean(getStoredAccessToken());
}

export function useFavorites() {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [remoteItems, setRemoteItems] = useState<FavoriteProduct[]>([]);
  const [loadingRemote, setLoadingRemote] = useState(false);

  // localStorage'ı dinle (anonim kullanıcılar için)
  useEffect(() => {
    setSlugs(getFavorites());
    const unsub = subscribeFavorites(setSlugs);
    return unsub;
  }, []);

  const fetchRemote = useCallback(async () => {
    if (!isLoggedIn()) return;
    setLoadingRemote(true);
    try {
      const res = await apiGet<{ items: FavoriteProduct[] }>("/favorites");
      setRemoteItems(res.items);
      setSlugs(res.items.map((p) => p.slug));
    } catch {
      // sessizce devam
    } finally {
      setLoadingRemote(false);
    }
  }, []);

  useEffect(() => { void fetchRemote(); }, [fetchRemote]);

  // Login sonrası localStorage'ı DB'ye aktar
  const syncLocalToRemote = useCallback(async () => {
    const local = getFavorites();
    if (local.length === 0 || !isLoggedIn()) return;
    try {
      await apiPost("/favorites/sync", { slugs: local });
      await fetchRemote();
    } catch {
      // sessizce devam
    }
  }, [fetchRemote]);

  const toggle = useCallback(async (slug: string) => {
    if (isLoggedIn()) {
      const currently = slugs.includes(slug);
      if (currently) {
        await apiDelete(`/favorites/${slug}`);
        setSlugs((s) => s.filter((x) => x !== slug));
        setRemoteItems((s) => s.filter((x) => x.slug !== slug));
      } else {
        await apiPost("/favorites", { productSlug: slug });
        await fetchRemote();
      }
    } else {
      localToggle(slug);
    }
  }, [slugs, fetchRemote]);

  const isFav = useCallback((slug: string) => {
    return slugs.includes(slug);
  }, [slugs]);

  return {
    slugs,
    remoteItems,
    loadingRemote,
    isFav,
    toggle,
    syncLocalToRemote,
    refetch: fetchRemote,
  };
}

export { FAVORITES_CHANGE_EVENT };
