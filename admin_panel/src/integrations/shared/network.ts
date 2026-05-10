import type { FetchArgs } from '@reduxjs/toolkit/query';

export type RequestArgs = string | FetchArgs;

export function trimSlash(x: string): string {
  return x.replace(/\/+$/, '');
}

export function ensureLeadingSlash(x: string): string {
  return x.startsWith('/') ? x : `/${x}`;
}

export function isAbsoluteUrl(x: string): boolean {
  return /^https?:\/\//i.test(x);
}

export function joinOriginAndBase(origin?: string, base?: string): string {
  if (!origin) return '';

  const cleanOrigin = trimSlash(origin);
  if (!base) return cleanOrigin;

  return cleanOrigin + ensureLeadingSlash(trimSlash(base));
}

export function guessDevBackend(): string {
  try {
    if (typeof window !== 'undefined') {
      const loc = window.location;
      const host = loc?.hostname || 'localhost';
      const proto = loc?.protocol || 'http:';
      return `${proto}//${host}:8084`;
    }
  } catch {
    // ignore
  }

  return 'http://localhost:8088/api/v1';
}

export function resolveBaseUrl(): string {
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || '').trim();
  const apiOrigin = (process.env.NEXT_PUBLIC_API_ORIGIN || '').trim();
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE || '').trim();
  const isDev = process.env.NODE_ENV !== 'production';

  if (apiUrl) {
    if (isAbsoluteUrl(apiUrl)) return trimSlash(apiUrl);
    return ensureLeadingSlash(trimSlash(apiUrl));
  }
  if (apiOrigin && apiBase) return joinOriginAndBase(apiOrigin, apiBase);

  if (apiBase) {
    if (isAbsoluteUrl(apiBase)) return trimSlash(apiBase);
    return ensureLeadingSlash(trimSlash(apiBase));
  }

  if (isDev) return guessDevBackend();
  return '/api';
}

export function extractRequestPath(url: string): string {
  try {
    if (isAbsoluteUrl(url)) {
      const parsed = new URL(url);
      return parsed.pathname.replace(/\/+$/, '');
    }

    return url.replace(/^https?:\/\/[^/]+/i, '').replace(/\/+$/, '');
  } catch {
    return url.replace(/\/+$/, '');
  }
}

export function normalizeRequestArg(arg: RequestArgs): RequestArgs {
  if (typeof arg === 'string') {
    if (isAbsoluteUrl(arg) || arg.startsWith('/')) return arg;
    return `/${arg}`;
  }

  const url = arg.url ?? '';
  if (url && !isAbsoluteUrl(url) && !url.startsWith('/')) {
    return { ...arg, url: `/${url}` };
  }

  return arg;
}

export function isObjectRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function isProbablyFormData(body: unknown): boolean {
  return !!body && typeof body === 'object' && typeof (body as { append?: unknown }).append === 'function';
}

export function isJsonLikeBody(body: unknown): body is Record<string, unknown> {
  if (typeof FormData !== 'undefined' && body instanceof FormData) return false;
  if (typeof Blob !== 'undefined' && body instanceof Blob) return false;
  if (typeof ArrayBuffer !== 'undefined' && body instanceof ArrayBuffer) return false;
  if (isProbablyFormData(body)) return false;
  return isObjectRecord(body);
}

export function ensureRequestBodyHeaders(args: FetchArgs): FetchArgs {
  const next: FetchArgs = { ...args };
  const headers = (next.headers as Record<string, string>) ?? {};

  if (isJsonLikeBody(next.body)) {
    next.headers = { ...headers, 'Content-Type': 'application/json' };
    return next;
  }

  if (headers['Content-Type']) {
    const { ['Content-Type']: _ignored, ...rest } = headers;
    next.headers = rest;
  }

  return next;
}
