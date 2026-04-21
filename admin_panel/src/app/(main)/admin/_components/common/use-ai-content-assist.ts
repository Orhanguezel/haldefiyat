'use client';

// =============================================================
// useAIContentAssist — AI destekli icerik olusturma hook'u
// Ensotek ile birebir ayni pattern
// =============================================================

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { tokenStore } from '@/integrations/core/token';
import { BASE_URL } from '@/integrations/base-api';
import {
  ACCESS_TOKEN_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
  readBrowserStorage,
  redirectToLogin,
  removeBrowserStorage,
  writeBrowserStorage,
} from '@/integrations/shared';

export type AIAction = 'full' | 'enhance' | 'translate' | 'generate_meta';

export type LocaleContent = {
  locale: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  meta_title: string;
  meta_description: string;
  tags: string;
};

type AIRequest = {
  title?: string;
  summary?: string;
  content?: string;
  tags?: string;
  locale: string;
  target_locales?: string[];
  module_key?: string;
  action: AIAction;
};

type AIResponse = {
  ok: boolean;
  data?: { locales: LocaleContent[] };
  error?: { message: string };
};

export function useAIContentAssist() {
  const [loading, setLoading] = useState(false);

  const assist = useCallback(async (req: AIRequest): Promise<LocaleContent[] | null> => {
    setLoading(true);
    try {
      const buildHeaders = () => {
        const token = tokenStore.get() || readBrowserStorage(ACCESS_TOKEN_STORAGE_KEY);
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;
        return headers;
      };

      let res = await fetch(`${BASE_URL}/admin/ai/content`, {
        method: 'POST',
        headers: buildHeaders(),
        credentials: 'include',
        body: JSON.stringify(req),
      });

      if (res.status === 401) {
        const refreshRes = await fetch(`${BASE_URL}/auth/token/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json().catch(() => null) as { access_token?: string } | null;
          const accessToken = String(refreshData?.access_token || '').trim();

          if (accessToken) {
            tokenStore.set(accessToken);
            writeBrowserStorage(ACCESS_TOKEN_STORAGE_KEY, accessToken);

            res = await fetch(`${BASE_URL}/admin/ai/content`, {
              method: 'POST',
              headers: buildHeaders(),
              credentials: 'include',
              body: JSON.stringify(req),
            });
          }
        }
      }

      const data: AIResponse = await res.json();

      if (!res.ok || !data.ok) {
        if (res.status === 401) {
          tokenStore.set(null);
          removeBrowserStorage(ACCESS_TOKEN_STORAGE_KEY);
          removeBrowserStorage(REFRESH_TOKEN_STORAGE_KEY);
          redirectToLogin();
        }
        toast.error(data.error?.message || 'AI icerik hatasi');
        return null;
      }

      const locales = data.data?.locales;
      if (!locales?.length) {
        toast.error('AI bos yanit dondurdu');
        return null;
      }

      toast.success(`AI ${locales.length} dilde icerik hazirladi`);
      return locales;
    } catch (err: any) {
      toast.error(err.message || 'AI baglanti hatasi');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { assist, loading };
}
