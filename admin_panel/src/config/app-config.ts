// =============================================================
// FILE: src/config/app-config.ts
// Admin Panel Config — DB'den gelen branding verileri için fallback
// =============================================================

import packageJson from '../../package.json';
import { FALLBACK_LOCALE } from '@/i18n/config';

const currentYear = new Date().getFullYear();

export type AdminBrandingConfig = {
  app_name: string;
  app_copyright: string;
  html_lang: string;
  theme_color: string;
  media: {
    site_logo: string;
    site_logo_alt: string;
    site_logo_dark: string;
    site_logo_dark_alt: string;
    site_logo_light: string;
    site_logo_light_alt: string;
    site_favicon: string;
    site_favicon_alt: string;
    site_apple_touch_icon: string;
    site_apple_touch_icon_alt: string;
    site_og_default_image: string;
    site_og_default_image_alt: string;
  };
  meta: {
    title: string;
    description: string;
    og_url: string;
    og_title: string;
    og_description: string;
    twitter_card: string;
  };
};

export const DEFAULT_BRANDING: AdminBrandingConfig = {
  app_name: 'Hal Fiyatlari Admin Panel',
  app_copyright: 'haldefiyat.com',
  html_lang: FALLBACK_LOCALE,
  theme_color: '#0f766e',
  media: {
    site_logo: '/admin/logo.png',
    site_logo_alt: 'Hal Fiyatlari',
    site_logo_dark: '',
    site_logo_dark_alt: 'Hal Fiyatlari',
    site_logo_light: '',
    site_logo_light_alt: 'Hal Fiyatlari',
    site_favicon: '/admin/favicon.png',
    site_favicon_alt: 'Hal Fiyatlari favicon',
    site_apple_touch_icon: '/admin/apple-touch-icon.png',
    site_apple_touch_icon_alt: 'Hal Fiyatlari Apple Touch Icon',
    site_og_default_image: '/admin/logo.png',
    site_og_default_image_alt: 'Hal Fiyatlari',
  },
  meta: {
    title: 'Hal Fiyatlari Admin Panel',
    description:
      'Hal fiyatlari, urunler, haller, uyarilar, ETL ve icerik yonetimi icin yonetim paneli.',
    og_url: 'https://admin.haldefiyat.com',
    og_title: 'Hal Fiyatlari Admin Panel',
    og_description:
      'Hal Fiyatlari yonetim paneli ile fiyat verilerini, ETL akislarini ve icerik modullerini yonetin.',
    twitter_card: 'summary_large_image',
  },
};

export const APP_CONFIG = {
  name: DEFAULT_BRANDING.app_name,
  version: packageJson.version,
  copyright: `© ${currentYear}, ${DEFAULT_BRANDING.app_copyright}.`,
  meta: {
    title: DEFAULT_BRANDING.meta.title,
    description: DEFAULT_BRANDING.meta.description,
  },
  branding: DEFAULT_BRANDING,
} as const;
