"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost, apiPatch } from "@/lib/api-client";

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: number;
  created_at: string;
};

type State = {
  items: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
};

export function useNotifications() {
  const [state, setState] = useState<State>({ items: [], unreadCount: 0, loading: true, error: null });

  const fetch = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [listRes, countRes] = await Promise.all([
        apiGet<{ data: Notification[] }>("/notifications"),
        apiGet<{ count: number }>("/notifications/unread-count"),
      ]);
      setState({ items: listRes.data ?? [], unreadCount: countRes.count ?? 0, loading: false, error: null });
    } catch {
      setState((s) => ({ ...s, loading: false, error: "Bildirimler yüklenemedi." }));
    }
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);

  const markRead = useCallback(async (id: string) => {
    await apiPatch(`/notifications/${id}`);
    setState((s) => ({
      ...s,
      items: s.items.map((n) => n.id === id ? { ...n, is_read: 1 } : n),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }));
  }, []);

  const markAllRead = useCallback(async () => {
    await apiPost("/notifications/mark-all-read");
    setState((s) => ({
      ...s,
      items: s.items.map((n) => ({ ...n, is_read: 1 })),
      unreadCount: 0,
    }));
  }, []);

  return { ...state, refetch: fetch, markRead, markAllRead };
}
