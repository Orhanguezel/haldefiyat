"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPatch } from "@/lib/api-client";

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
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await apiGet<{ profile: UserProfile }>("/profiles/me");
      setState({ data: res.profile, loading: false, error: null });
    } catch {
      setState({ data: null, loading: false, error: "Profil yüklenemedi." });
    }
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);

  const update = useCallback(async (patch: Partial<UserProfile>) => {
    const res = await apiPatch<{ profile: UserProfile }>("/profiles/me", patch);
    setState((s) => ({ ...s, data: res.profile }));
    return res.profile;
  }, []);

  return { ...state, refetch: fetch, update };
}
