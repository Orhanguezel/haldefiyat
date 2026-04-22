const KEY = "vs_access_token";

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setStoredAccessToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) localStorage.setItem(KEY, token);
    else localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
