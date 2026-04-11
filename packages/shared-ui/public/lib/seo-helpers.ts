import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/utils';
import { AVAILABLE_LOCALES, FALLBACK_LOCALE } from '@/i18n/locales';

const DEFAULT_SITE_NAME = 'Bereket Fide';
const DEFAULT_TITLE_SUFFIX = 'Bereket Fide';
const DEFAULT_OG_IMAGE = '/opengraph-image';

export function stripTrailingSlash(s: string): string {
  return s.endsWith('/') ? s.slice(0, -1) : s;
}

export function normLocaleShort(raw: string): string {
  return raw.split(/[_-]/)[0]?.toLowerCase() ?? '';
}

export function siteUrlBase(): string {
  return stripTrailingSlash(
    process.env.NEXT_PUBLIC_SITE_URL || SITE_URL,
  );
}

export function absoluteUrl(path: string): string {
  const base = siteUrlBase();
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

export function localizedPath(
  locale: string,
  pathname: string,
): string {
  const p = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (p === '/') return `/${locale}`;
  return `/${locale}${p}`;
}

export function localizedUrl(locale: string, pathname: string): string {
  return absoluteUrl(localizedPath(locale, pathname));
}

export function localeAlternates(
  pathname: string,
  locales = AVAILABLE_LOCALES,
  defaultLocale = FALLBACK_LOCALE,
): Record<string, string> {
  const alternates = Object.fromEntries(
    locales.map((locale) => [locale, localizedUrl(locale, pathname)]),
  ) as Record<string, string>;

  alternates['x-default'] = localizedUrl(defaultLocale, pathname);
  return alternates;
}

function absoluteMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return absoluteUrl(url);
}

function stripHtml(input: string): string {
  return input.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function clipText(input: string, max: number): string {
  if (input.length <= max) return input;
  return `${input.slice(0, max - 1).trimEnd()}…`;
}

export function buildSeoTitle(title: string, suffix = DEFAULT_TITLE_SUFFIX): string {
  const clean = stripHtml(title).trim();
  if (!clean) return suffix;
  // Strip any existing suffix variants to avoid duplication
  const stripped = clean
    .replace(/\s*\|\s*Bereket\s+Fide\s*$/i, '')
    .replace(/\s*\|\s*Bereket\s+Fide\s*$/i, '')
    .trim();
  if (!stripped) return suffix;
  return clipText(`${stripped} | ${suffix}`, 60);
}

export function buildSeoDescription(...parts: Array<string | null | undefined>): string {
  const combined = parts
    .map((part) => (part ? stripHtml(part) : ''))
    .filter(Boolean)
    .join(' ');

  return clipText(combined || DEFAULT_SITE_NAME, 155);
}

export function organizationJsonLd(locale: string, input?: {
  description?: string;
  email?: string;
  telephone?: string;
  address?: string;
  logo?: string;
  sameAs?: string[];
}) {
  return {
    name: DEFAULT_SITE_NAME,
    url: localizedUrl(locale, '/'),
    description: input?.description,
    email: input?.email,
    telephone: input?.telephone,
    address: input?.address,
    logo: input?.logo ? absoluteMediaUrl(input.logo) : absoluteUrl('/icon'),
    sameAs: input?.sameAs,
  };
}

export function buildPageMetadata(input: {
  locale: string;
  pathname: string;
  title: string;
  description: string;
  siteName?: string;
  ogImage?: string | null;
  noIndex?: boolean;
  openGraphType?: 'website' | 'article';
  includeLocaleAlternates?: boolean;
}): Metadata {
  const siteName = input.siteName || DEFAULT_SITE_NAME;
  const url = localizedUrl(input.locale, input.pathname);
  const image = absoluteMediaUrl(input.ogImage || DEFAULT_OG_IMAGE);
  const images = image ? [{ url: image }] : undefined;
  const title = buildSeoTitle(input.title);
  const description = buildSeoDescription(input.description);
  const includeLocaleAlternates = input.includeLocaleAlternates ?? true;

  return {
    title: {
      absolute: title,
    },
    description,
    alternates: {
      canonical: url,
      ...(includeLocaleAlternates ? { languages: localeAlternates(input.pathname) } : {}),
    },
    openGraph: {
      title,
      description,
      url,
      siteName,
      locale: input.locale,
      type: input.openGraphType || 'website',
      ...(images ? { images } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
    robots: input.noIndex ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export function asStr(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v === null || v === undefined) return '';
  return String(v);
}

export function asObj(v: unknown): Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

export function compact<T>(arr: (T | null | undefined | false)[]): T[] {
  return arr.filter(Boolean) as T[];
}
export function readSettingValue(input: unknown): Record<string, unknown> {
  const raw = (input as { value?: unknown } | null)?.value;
  return asObj(raw);
}
