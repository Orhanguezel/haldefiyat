'use client';

import * as React from 'react';
import { BASE_URL } from '@/integrations/api-base';

/**
 * Urun gorselleri hf_products.image_url'de degil, frontend'in yayinladigi
 * manifest dosyasinda duruyor (471 gorsel). Manifest bir kez indirilir, slug ->
 * yol eslemesi bellekte tutulur. Site adresi sabit yazilmaz, API adresinden
 * turetilir.
 */
const SITE_ORIGIN = BASE_URL.replace(/\/api\/v1\/?$/, '');
const MANIFEST_URL = `${SITE_ORIGIN}/images/urunler/manifest.json`;

let cache: Record<string, string> | null = null;
let inflight: Promise<Record<string, string>> | null = null;

async function loadManifest(): Promise<Record<string, string>> {
  if (cache) return cache;
  if (!inflight) {
    inflight = fetch(MANIFEST_URL)
      .then((res) => (res.ok ? res.json() : {}))
      .then((json: Record<string, string>) => { cache = json ?? {}; return cache; })
      .catch(() => ({}));
  }
  return inflight;
}

export function useProductImage() {
  const [manifest, setManifest] = React.useState<Record<string, string>>(cache ?? {});

  React.useEffect(() => {
    let alive = true;
    void loadManifest().then((loaded) => { if (alive) setManifest(loaded); });
    return () => { alive = false; };
  }, []);

  return React.useCallback(
    (slug?: string | null, fallbackSlug?: string | null) => {
      const path = (slug && manifest[slug]) || (fallbackSlug && manifest[fallbackSlug]) || null;
      return path ? `${SITE_ORIGIN}${path}` : null;
    },
    [manifest],
  );
}
