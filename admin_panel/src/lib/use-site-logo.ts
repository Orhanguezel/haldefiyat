'use client';

import { useEffect, useState } from 'react';

type LogoVariant = 'site_logo' | 'site_logo_dark' | 'site_logo_light';

export type SiteLogo = {
  url: string;
  alt: string;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/+$/, '');

function resolveAbsolute(url: string): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (!API_BASE) return url;
  // API_BASE ornek: https://panel.vistaseeds.com.tr/api/v1 -> origin'i cikar
  try {
    const origin = new URL(API_BASE).origin;
    return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
  } catch {
    return url;
  }
}

export function useSiteLogo(variant: LogoVariant = 'site_logo'): SiteLogo | null {
  const [logo, setLogo] = useState<SiteLogo | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch(`${API_BASE}/site_settings/${variant}?locale=tr`, {
          cache: 'no-store',
        });
        if (!res.ok) return;
        const row = await res.json();
        const raw = row?.value;
        const value = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (!value) return;
        const url = typeof value.url === 'string' ? value.url : '';
        const alt = typeof value.alt === 'string' ? value.alt : '';
        if (!cancelled && url) setLogo({ url: resolveAbsolute(url), alt });
      } catch {
        /* swallow — caller fallback'i kullanir */
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [variant]);

  return logo;
}
