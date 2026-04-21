// =============================================================
// FILE: src/server/fetch-branding.ts
// Server-only utility — SSR'da branding config'i backend'den çeker
// =============================================================

import { DEFAULT_BRANDING, type AdminBrandingConfig } from '@/config/app-config';

type BrandMediaKey =
  | 'site_logo'
  | 'site_logo_dark'
  | 'site_logo_light'
  | 'site_favicon'
  | 'site_apple_touch_icon'
  | 'site_og_default_image';

type BrandMediaValue = {
  url?: string;
  alt?: string;
};

function ensureVersionedApiBase(rawBase: string): string {
  const base = rawBase.trim().replace(/\/+$/, '');
  if (!base) return '';
  if (/\/api\/v\d+$/i.test(base)) return base;
  if (/\/api$/i.test(base)) return `${base}/v1`;
  return `${base}/api/v1`;
}

/**
 * Backend API base URL (server-side only).
 * PANEL_API_URL > NEXT_PUBLIC_API_URL > fallback
 */
function getServerApiUrl(): string {
  const panel = (process.env.PANEL_API_URL || '').trim().replace(/\/+$/, '');
  if (panel) return ensureVersionedApiBase(panel);

  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || '').trim().replace(/\/+$/, '');
  if (base) return ensureVersionedApiBase(base);

  const pub = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
  if (pub) return ensureVersionedApiBase(pub);

  return 'https://api.haldefiyat.com/api/v1';
}

function getServerOrigin(apiBase: string): string {
  try {
    return new URL(apiBase).origin;
  } catch {
    return '';
  }
}

function resolveMediaUrl(apiBase: string, rawUrl: string): string {
  if (!rawUrl) return '';
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
  const origin = getServerOrigin(apiBase);
  if (!origin) return rawUrl;
  return `${origin}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
}

function parseJsonValue<T>(value: unknown): T | null {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
  return value && typeof value === 'object' ? (value as T) : null;
}

/**
 * SSR'da `ui_admin_config` key'ini public endpoint üzerinden çeker,
 * `branding` alt-objesini döndürür.
 * Hata durumunda DEFAULT_BRANDING fallback döner.
 */
export async function fetchBrandingConfig(): Promise<AdminBrandingConfig> {
  try {
    const base = getServerApiUrl();
    const mediaKeys: BrandMediaKey[] = [
      'site_logo',
      'site_logo_dark',
      'site_logo_light',
      'site_favicon',
      'site_apple_touch_icon',
      'site_og_default_image',
    ];
    const [brandingRes, ...mediaResponses] = await Promise.all([
      fetch(`${base}/site_settings/ui_admin_config`, { next: { revalidate: 300 } }),
      ...mediaKeys.map((key) =>
        fetch(`${base}/site_settings/${key}?locale=*`, { next: { revalidate: 300 } }),
      ),
    ]);

    const brandingData = brandingRes.ok ? await brandingRes.json() : null;
    const value = parseJsonValue<{ branding?: Partial<AdminBrandingConfig> }>(brandingData?.value);
    const branding = value?.branding ?? {};

    const media = { ...DEFAULT_BRANDING.media };
    await Promise.all(
      mediaResponses.map(async (response, index) => {
        if (!response.ok) return;
        const key = mediaKeys[index];
        const data = await response.json();
        const parsed = parseJsonValue<BrandMediaValue>(data?.value);
        const rawUrl = typeof parsed?.url === 'string' ? parsed.url.trim() : '';
        const alt = typeof parsed?.alt === 'string' ? parsed.alt.trim() : '';
        if (!rawUrl) return;
        media[key] = resolveMediaUrl(base, rawUrl);
        media[`${key}_alt` as keyof typeof media] = alt || DEFAULT_BRANDING.media[`${key}_alt` as keyof typeof media];
      }),
    );

    return {
      ...DEFAULT_BRANDING,
      ...branding,
      media,
      meta: { ...DEFAULT_BRANDING.meta, ...branding.meta },
    };
  } catch {
    return DEFAULT_BRANDING;
  }
}
