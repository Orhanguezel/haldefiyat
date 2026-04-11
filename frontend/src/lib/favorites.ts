/**
 * LocalStorage tabanli favori urun yardimcisi.
 *
 * NEDEN pure function: React bagimsiz, hem client component hem event listener
 * icinden cagrilabilir. SSR guard ile Next.js uyumlu.
 */

const KEY = "haldefiyat:favorites";
const CHANGE_EVENT = "haldefiyat:favorites:change";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readRaw(): string[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string" && v.length > 0);
  } catch {
    return [];
  }
}

function writeRaw(slugs: string[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(slugs));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { slugs } }));
  } catch {
    // localStorage kotasi dolmus olabilir — sessizce dusur
  }
}

export function getFavorites(): string[] {
  return readRaw();
}

export function isFavorite(slug: string): boolean {
  if (!slug) return false;
  return readRaw().includes(slug);
}

export function toggleFavorite(slug: string): boolean {
  if (!slug) return false;
  const current = readRaw();
  const exists = current.includes(slug);
  const next = exists ? current.filter((s) => s !== slug) : [...current, slug];
  writeRaw(next);
  return !exists;
}

export function removeFavorite(slug: string): void {
  if (!slug) return;
  const current = readRaw();
  if (!current.includes(slug)) return;
  writeRaw(current.filter((s) => s !== slug));
}

export function subscribeFavorites(listener: (slugs: string[]) => void): () => void {
  if (!isBrowser()) return () => {};
  const handler = () => listener(readRaw());
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export const FAVORITES_STORAGE_KEY = KEY;
export const FAVORITES_CHANGE_EVENT = CHANGE_EVENT;
