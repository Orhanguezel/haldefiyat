// =============================================================
// FILE: src/i18n/locale-short-client.ts
// guezelwebdesign – Locale normalize helper (CLIENT SAFE, NO HOOKS)
// - NO toShortLocale
// - Uses normLocaleTag
// =============================================================

import { normLocaleTag } from './locale-utils';

const safeStr = (v: unknown) => String(v ?? '').trim();

export function localeShortClient(v: unknown): string {
  const raw = safeStr(v);
  if (!raw) return '';
  return normLocaleTag(raw) || '';
}

export function localeShortClientOr(v: unknown, fallback = 'tr'): string {
  return localeShortClient(v) || fallback;
}
