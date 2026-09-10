import { getStoredAccessToken, setStoredAccessToken } from "@/lib/auth-token";

/**
 * Browser-side API base URL resolution:
 *   - Build'e NEXT_PUBLIC_API_URL baked edilmişse o kullanılır (dev override)
 *   - Değilse browser'da `window.location.origin` (prod: haldefiyat.com,
 *     nginx /api → backend proxy yapıyor)
 *   - SSR/build ortamında fallback localhost:8088 (dev server default)
 *
 * Özellikle `NEXT_PUBLIC_API_URL=http://localhost:*` build'de baked kalmışsa
 * bunu canlı tarayıcıda kullanmayız — guard window.origin'e düşer.
 */
function resolveApiBase(): string {
  const override = process.env.NEXT_PUBLIC_API_URL?.trim() ?? "";
  if (typeof window !== "undefined") {
    const isLocalhostBaked = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(override);
    if (override && !isLocalhostBaked) return override;
    return window.location.origin;
  }
  return override || "http://localhost:8088";
}
const BASE_URL = `${resolveApiBase().replace(/\/$/, "")}/api/v1`;

class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let refreshPromise: Promise<void> | null = null;

async function refreshAccessToken(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(`${BASE_URL}/auth/token/refresh`, {
        method: "POST", credentials: "include", cache: "no-store",
      });
      if (!response.ok) throw new ApiError(response.status, "refresh_failed", "Oturum yenilenemedi.");
      const data = await response.json();
      if (!data.access_token) throw new ApiError(502, "invalid_refresh_response", "Oturum yenilenemedi.");
      setStoredAccessToken(data.access_token);
    })().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

function expireSession() {
  setStoredAccessToken(null);
  try { localStorage.removeItem("app-auth"); } catch { /* Storage may be unavailable. */ }
  window.dispatchEvent(new Event("auth:changed"));
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retried = false,
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const bearer = getStoredAccessToken();
  const res = await fetch(url, {
    ...options,
    cache: "no-store",
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      ...(options.headers ?? {}),
    },
  });

    if (!res.ok) {
      let code = "request_failed";
      let details: unknown;
      try {
        const body = await res.json();
        code = typeof body?.error === "string" ? body.error : body?.error?.message ?? code;
        details = body;
      } catch {}

      const sessionRequest = !path.startsWith("/auth/") || path === "/auth/user" || path === "/auth/session/bootstrap";
      if (res.status === 401 && sessionRequest && typeof window !== "undefined") {
        if (!retried) {
          try {
            // Another request may already have renewed the token while this one was in flight.
            if (!getStoredAccessToken() || getStoredAccessToken() === bearer) await refreshAccessToken();
          } catch (error) {
            if (error instanceof ApiError && error.status === 401) expireSession();
            throw error;
          }
          return request<T>(path, options, true);
        }
        expireSession();
      }

      throw new ApiError(res.status, code, `${res.status} ${code}`, details);
    }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export const apiGet = <T>(path: string, query?: Record<string, any>, options?: RequestInit) => {
  let fullPath = path;
  if (query) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    const qs = params.toString();
    if (qs) {
      fullPath += (path.includes("?") ? "&" : "?") + qs;
    }
  }
  return request<T>(fullPath, { ...options, method: "GET" });
};

export const apiPost = <T>(path: string, body?: unknown, options?: RequestInit) =>
  request<T>(path, {
    ...options,
    method: "POST",
    body: (body !== undefined && body !== null) ? JSON.stringify(body) : undefined,
  });

export const apiPatch = <T>(path: string, body?: unknown, options?: RequestInit) =>
  request<T>(path, {
    ...options,
    method: "PATCH",
    body: (body !== undefined && body !== null) ? JSON.stringify(body) : undefined,
  });

export const apiPut = <T>(path: string, body?: unknown, options?: RequestInit) =>
  request<T>(path, {
    ...options,
    method: "PUT",
    body: (body !== undefined && body !== null) ? JSON.stringify(body) : undefined,
  });

export const apiDelete = <T>(path: string, options?: RequestInit) =>
  request<T>(path, { ...options, method: "DELETE" });

export { ApiError };
