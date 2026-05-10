// src/lib/seo.ts
// SEO helper — backend'den sayfa SEO verisini çekip Next.js Metadata objesi oluşturur.

import type { Metadata } from "next";
import { appLocales, toLocalizedPath, type AppLocale } from "@/i18n/routing";
import { getRequestLocale } from "@/i18n/get-request-locale";

const BASE_URL = (process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8088").replace(/\/$/, "");
const API_V1 = /\/api\/v1$/i.test(BASE_URL) ? BASE_URL : `${BASE_URL}/api/v1`;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3033").replace(/\/$/, "");
const SITE_SETTINGS_BRAND = (process.env.NEXT_PUBLIC_SITE_BRAND || "hal-fiyatlari").trim();

export interface PageSeoData {
  pageKey: string;
  title?: string;
  description?: string;
  keywords?: string;
  open_graph?: {
    type?: string;
    images?: string[];
  };
  twitter?: {
    card?: string;
    site?: string;
    creator?: string;
  };
  robots?: {
    noindex?: boolean;
    index?: boolean;
    follow?: boolean;
  };
  site_name?: string; // Backendden gelebilecek site adı
  _fallback?: boolean;
}

type InlineSeoPage = {
  title?: string;
  description?: string;
  og_image?: string;
  no_index?: boolean;
};

type MetadataOverrides = Partial<Metadata> & {
  vars?: Record<string, string>;
  siteName?: string;
  locale?: string;
  pathname?: string;
};

function buildLocaleAlternates(locale: string, pathname: string): { canonical: string; languages: Record<string, string> } {
  const canonical = `${SITE_URL}${toLocalizedPath(pathname, locale)}`;
  const languages = Object.fromEntries(
    appLocales.map((appLocale) => [appLocale, `${SITE_URL}${toLocalizedPath(pathname, appLocale)}`]),
  );

  return {
    canonical,
    languages: {
      ...(languages as Record<string, string>),
      "x-default": `${SITE_URL}${toLocalizedPath(pathname, appLocales[0] ?? locale)}`,
    },
  };
}

/**
 * Backend'den sayfa SEO verisini çek.
 */
export async function fetchPageSeo(pageKey: string): Promise<PageSeoData | null> {
  const normalizedPageKey = String(pageKey || "").trim();
  if (!normalizedPageKey) return null;

  try {
    const res = await fetch(
      `${API_V1}/site_settings/seo_pages?locale=${encodeURIComponent(await getRequestLocale())}&prefix=${encodeURIComponent(`${SITE_SETTINGS_BRAND}__`)}`,
      {
        next: { revalidate: 300 },
      },
    );
    if (res.ok) {
      const row = await res.json();
      const value = typeof row?.value === "string" ? JSON.parse(row.value) : row?.value;
      const page = value?.[normalizedPageKey] as InlineSeoPage | undefined;
      if (page && (page.title || page.description || page.og_image || page.no_index)) {
        return {
          pageKey: normalizedPageKey,
          title: page.title,
          description: page.description,
          open_graph: {
            type: "website",
            images: page.og_image ? [page.og_image] : [],
          },
          robots: {
            noindex: page.no_index === true,
            index: page.no_index !== true,
            follow: true,
          },
        };
      }
    }
  } catch {
    // fallback to legacy endpoint below
  }

  try {
    const res = await fetch(`${API_V1}/site_settings/page-seo/${normalizedPageKey}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/**
 * Template değişkenleri değiştir: {{key}} -> "Value"
 */
function interpolate(template: string, vars: Record<string, string>): string {
  if (!template) return "";
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

/**
 * SEO verisinden Next.js Metadata objesi oluştur.
 */
export function buildMetadata(
  seo: PageSeoData | null,
  overrides?: MetadataOverrides,
): Metadata {
  const vars = overrides?.vars ?? {};
  const siteName = overrides?.siteName ?? seo?.site_name ?? process.env.NEXT_PUBLIC_SITE_NAME ?? "Website";
  const locale = overrides?.locale;
  const pathname = overrides?.pathname;
  const fallbackTitle = typeof overrides?.title === "string" ? overrides.title : undefined;
  const fallbackDescription = typeof overrides?.description === "string" ? overrides.description : undefined;

  const title = seo?.title ? interpolate(seo.title, vars) : fallbackTitle;
  const description = seo?.description ? interpolate(seo.description, vars) : fallbackDescription;
  const keywords = seo?.keywords ? seo.keywords.split(",").map((k) => k.trim()).filter(Boolean) : undefined;

  const robots = seo?.robots?.noindex
    ? { index: false, follow: seo.robots.follow ?? true }
    : overrides?.robots;

  const ogImages = seo?.open_graph?.images?.map((img) =>
    img.startsWith("/") ? `${SITE_URL}${img}` : img,
  );
  const alternates = locale && pathname ? buildLocaleAlternates(locale, pathname) : overrides?.alternates;
  const {
    vars: _vars,
    siteName: _siteName,
    locale: _locale,
    pathname: _pathname,
    title: _title,
    description: _description,
    keywords: _keywords,
    openGraph: _openGraph,
    twitter: _twitter,
    robots: _robots,
    alternates: _alternates,
    ...restOverrides
  } = overrides ?? {};

  const meta: Metadata = {
    ...restOverrides,
    ...(title && { title: { absolute: title } }),
    ...(description && { description }),
    ...(keywords && { keywords }),
    ...(robots && { robots }),
    openGraph: {
      ...(title && { title }),
      ...(description && { description }),
      ...(seo?.open_graph?.type && { type: seo.open_graph.type as "website" }),
      ...(ogImages?.length && { images: ogImages }),
      siteName: siteName,
    },
    twitter: {
      card: (seo?.twitter?.card as "summary_large_image") ?? "summary_large_image",
      ...(seo?.twitter?.site && { site: seo.twitter.site }),
      ...(seo?.twitter?.creator && { creator: seo.twitter.creator }),
    },
    ...(alternates && { alternates }),
  };

  // Geçici alanları temizle
  if ("vars" in meta) delete (meta as any).vars;
  if ("siteName" in meta && !("openGraph" in meta)) delete (meta as any).siteName;

  return meta;
}

/**
 * Kısayol: fetchPageSeo + buildMetadata tek satırda.
 */
export async function getPageMetadata(
  pageKey: string,
  overrides?: MetadataOverrides,
): Promise<Metadata> {
  const resolvedLocale = overrides?.locale ?? await getRequestLocale();
  const seo = await fetchPageSeo(pageKey);
  return buildMetadata(seo, {
    ...overrides,
    locale: resolvedLocale,
  });
}

export function getLocaleAlternates(locale: string, pathname: string) {
  return buildLocaleAlternates(locale, pathname);
}

/** noindex sayfalar için hızlı metadata */
export function noIndexMetadata(title: string): Metadata {
  return { title, robots: { index: false, follow: false } };
}
