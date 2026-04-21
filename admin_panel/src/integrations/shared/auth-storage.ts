export const ACCESS_TOKEN_STORAGE_KEY = 'mh_access_token';
export const REFRESH_TOKEN_STORAGE_KEY = 'mh_refresh_token';
export const AUTH_LOGIN_PATH = '/auth/login';

export const AUTH_SKIP_REAUTH_PATHS = [
  '/auth/token',
  '/auth/signup',
  '/auth/google',
  '/auth/google/start',
  '/auth/token/refresh',
  '/auth/logout',
] as const;

export const AUTH_SKIP_REAUTH = new Set<string>(AUTH_SKIP_REAUTH_PATHS);

export function getDefaultLocale(): string {
  const envLocale = (process.env.NEXT_PUBLIC_DEFAULT_LOCALE || '').trim();
  if (envLocale) return envLocale;

  if (typeof navigator !== 'undefined') {
    return (navigator.language || 'tr').trim() || 'tr';
  }

  return 'tr';
}

export function readBrowserStorage(key: string): string {
  try {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

export function writeBrowserStorage(key: string, value: string): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export function removeBrowserStorage(key: string): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function redirectToLogin(nextPath?: string): void {
  try {
    if (typeof window === 'undefined') return;

    const here = nextPath || `${window.location.pathname}${window.location.search}`;
    const target = `${AUTH_LOGIN_PATH}?next=${encodeURIComponent(here)}`;

    if (!window.location.pathname.startsWith(AUTH_LOGIN_PATH)) {
      window.location.replace(target);
    }
  } catch {
    // ignore
  }
}

export function createBrowserTokenStore(storageKey = ACCESS_TOKEN_STORAGE_KEY) {
  return {
    get(): string {
      return readBrowserStorage(storageKey);
    },
    set(token?: string | null): void {
      if (!token) {
        removeBrowserStorage(storageKey);
        return;
      }

      writeBrowserStorage(storageKey, token);
    },
  };
}
