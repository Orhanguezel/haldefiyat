"use client";

import { useEffect, useRef } from "react";
import { useAuthSession } from "./AuthSessionProvider";
import { apiPost } from "@/lib/api-client";
import { getFavorites } from "@/lib/favorites";

export function FavoriteSyncManager() {
  const { user } = useAuthSession();
  const prevUserId = useRef<string | null>(null);

  useEffect(() => {
    const userId = user?.id ?? null;
    if (userId && prevUserId.current === null) {
      const local = getFavorites();
      if (local.length > 0) {
        apiPost("/favorites/sync", { slugs: local }).catch(() => null);
      }
    }
    prevUserId.current = userId;
  }, [user]);

  return null;
}
