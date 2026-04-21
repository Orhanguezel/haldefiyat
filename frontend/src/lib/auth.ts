"use client";

import { apiGet, apiPost, ApiError } from "@/lib/api-client";
import { getStoredAccessToken, setStoredAccessToken } from "@/lib/auth-token";

const AUTH_STORAGE_KEY = "app-auth";
const AUTH_CHANGED_EVENT = "auth:changed";

export type AuthUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  email_verified: number;
  is_active: number;
  ecosystem_id: string | null;
  role: string;
};

type AuthResponse = {
  access_token: string;
  token_type: string;
  user: AuthUser;
};

type GoogleConfigResponse = {
  enabled: boolean;
  client_id: string | null;
};

type StoredAuthPayload = {
  user: AuthUser;
};

function emitAuthChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

function persistAuth(response: AuthResponse) {
  if (typeof window === "undefined") return response;
  setStoredAccessToken(response.access_token);
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: response.user } satisfies StoredAuthPayload));
  emitAuthChanged();
  return response;
}

export function clearStoredAuth() {
  if (typeof window === "undefined") return;
  setStoredAccessToken(null);
  localStorage.removeItem(AUTH_STORAGE_KEY);
  emitAuthChanged();
}

export function getStoredAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuthPayload;
    return parsed?.user ?? null;
  } catch {
    return null;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export async function loginWithEmail(input: {
  email: string;
  password: string;
}) {
  const response = await apiPost<AuthResponse>("/auth/token", {
    grant_type: "password",
    email: input.email.trim().toLowerCase(),
    password: input.password,
  });
  return persistAuth(response);
}

export async function signupWithEmail(input: {
  email: string;
  password: string;
  fullName?: string;
}) {
  const response = await apiPost<AuthResponse>("/auth/signup", {
    email: input.email.trim().toLowerCase(),
    password: input.password,
    full_name: input.fullName?.trim() || undefined,
    rules_accepted: true,
  });
  return persistAuth(response);
}

export async function loginWithGoogle(idToken: string) {
  const response = await apiPost<AuthResponse>("/auth/google", {
    id_token: idToken,
  });
  return persistAuth(response);
}

export async function fetchGoogleAuthConfig() {
  return apiGet<GoogleConfigResponse>("/auth/google/config");
}

export async function fetchCurrentUser() {
  const response = await apiGet<{ user: AuthUser }>("/auth/user");
  const currentToken = getStoredAccessToken();
  if (currentToken && response.user) {
    persistAuth({
      access_token: currentToken,
      token_type: "bearer",
      user: response.user,
    });
  }
  return response.user;
}

export async function rehydrateAuthSession() {
  if (!getStoredAccessToken()) {
    clearStoredAuth();
    return null;
  }

  try {
    return await fetchCurrentUser();
  } catch {
    clearStoredAuth();
    return null;
  }
}

export async function logout() {
  try {
    await apiPost<void>("/auth/logout");
  } finally {
    clearStoredAuth();
  }
}

export { AUTH_CHANGED_EVENT };
