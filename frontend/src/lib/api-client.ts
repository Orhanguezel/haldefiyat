import { getStoredAccessToken, setStoredAccessToken } from "@/lib/auth-token";

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8088").replace(/\/$/, "");

class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const bearer = getStoredAccessToken();
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      ...(options.headers ?? {}),
    },
  });

    if (!res.ok) {
      let code = "request_failed";
      try {
        const body = await res.json();
        code = body?.error?.message ?? code;
      } catch {}

      if (res.status === 401 && typeof window !== "undefined") {
        localStorage.removeItem("app-auth");
        setStoredAccessToken(null);
      }

      throw new ApiError(res.status, code, `${res.status} ${code}`);
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
