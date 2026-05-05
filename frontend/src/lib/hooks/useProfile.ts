"use client";

import { useCallback, useEffect, useState } from "react";
import { AUTH_CHANGED_EVENT } from "@/lib/auth";
import { apiGet, apiPatch } from "@/lib/api-client";
import { getStoredAccessToken } from "@/lib/auth-token";

export type UserProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  country: string | null;
  postal_code: string | null;
};

type State = { data: UserProfile | null; loading: boolean; error: string | null };

export function useProfile() {
  const [state, setState] = useState<State>({ data: null, loading: true, error: null });

  const fetch = useCallback(async () => {
    if (typeof window !== "undefined" && !getStoredAccessToken()) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await apiGet<UserProfile | null>("/profiles/me");
      setState({ data: res ?? null, loading: false, error: null });
    } catch {
      setState({ data: null, loading: false, error: "Profil yüklenemedi." });
    }
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onAuth = () => { void fetch(); };
    window.addEventListener(AUTH_CHANGED_EVENT, onAuth);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, onAuth);
  }, [fetch]);

  const update = useCallback(async (patch: Partial<UserProfile>) => {
    const res = await apiPatch<UserProfile>("/profiles/me", patch);
    setState((s) => ({ ...s, data: res }));
    return res;
  }, []);

  return { ...state, refetch: fetch, update };
}
