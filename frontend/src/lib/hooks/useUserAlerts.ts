"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPatch, apiDelete } from "@/lib/api-client";

export type UserAlert = {
  id: number;
  productId: number;
  marketId: number | null;
  thresholdPrice: string;
  direction: "above" | "below";
  contactEmail: string | null;
  contactTelegram: string | null;
  lastTriggered: string | null;
  createdAt: string;
  productSlug: string;
  productName: string;
  marketSlug: string | null;
  marketName: string | null;
};

type State = { items: UserAlert[]; loading: boolean; error: string | null };

export function useUserAlerts() {
  const [state, setState] = useState<State>({ items: [], loading: true, error: null });

  const fetch = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await apiGet<{ items: UserAlert[] }>("/user/alerts");
      setState({ items: res.items, loading: false, error: null });
    } catch {
      setState({ items: [], loading: false, error: "Uyarılar yüklenemedi." });
    }
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);

  const update = useCallback(async (id: number, patch: { thresholdPrice?: number; direction?: "above" | "below" }) => {
    await apiPatch(`/user/alerts/${id}`, patch);
    await fetch();
  }, [fetch]);

  const remove = useCallback(async (id: number) => {
    await apiDelete(`/user/alerts/${id}`);
    setState((s) => ({ ...s, items: s.items.filter((a) => a.id !== id) }));
  }, []);

  return { ...state, refetch: fetch, update, remove };
}
