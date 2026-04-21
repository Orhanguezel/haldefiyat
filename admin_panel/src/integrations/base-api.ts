// =============================================================
// FILE: src/integrations/base-api.ts
// Next.js FINAL (App Router compatible)
// =============================================================
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
} from '@reduxjs/toolkit/query';

import { tags } from './tags';
import { BASE_URL } from '@/integrations/api-base';
import { tokenStore } from '@/integrations/core/token';
import {
  ACCESS_TOKEN_STORAGE_KEY,
  AUTH_SKIP_REAUTH,
  coerceSerializableFetchErrorData,
  ensureRequestBodyHeaders,
  extractRequestPath,
  getDefaultLocale,
  isAbsoluteUrl,
  normalizeRequestArg,
  readBrowserStorage,
  redirectToLogin,
  REFRESH_TOKEN_STORAGE_KEY,
  removeBrowserStorage,
  writeBrowserStorage,
} from '@/integrations/shared';

const DEBUG_API = String(process.env.NEXT_PUBLIC_DEBUG_API || '') === '1';
if (DEBUG_API) {
  // eslint-disable-next-line no-console
  console.info('[gzl] BASE_URL =', BASE_URL);
}

type AnyArgs = string | FetchArgs;

/* -------------------- Base Query -------------------- */

type RBQ = BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  unknown,
  FetchBaseQueryMeta
>;

const rawBaseQuery: RBQ = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: 'include',
  prepareHeaders: (headers) => {
    if (headers.get('x-skip-auth') === '1') {
      headers.delete('x-skip-auth');
      if (!headers.has('Accept')) headers.set('Accept', 'application/json');
      if (!headers.has('Accept-Language')) headers.set('Accept-Language', getDefaultLocale());
      return headers;
    }

    const token = tokenStore.get() || readBrowserStorage(ACCESS_TOKEN_STORAGE_KEY);

    if (token && !headers.has('authorization')) {
      headers.set('authorization', `Bearer ${token}`);
    }

    if (!headers.has('Accept')) headers.set('Accept', 'application/json');
    if (!headers.has('Accept-Language')) headers.set('Accept-Language', getDefaultLocale());

    return headers;
  },

  responseHandler: async (response) => {
    const ct = response.headers.get('content-type') || '';
    if (ct.includes('application/json')) return response.json();
    if (ct.includes('text/')) return response.text();

    try {
      const t = await response.text();
      return t || null;
    } catch {
      return null;
    }
  },

  validateStatus: (res) => res.ok,
}) as RBQ;

/* -------------------- 401 → refresh → retry -------------------- */

const baseQueryWithReauth: RBQ = async (args, api, extra) => {
  let req: AnyArgs = normalizeRequestArg(args);
  const path = typeof req === 'string' ? req : req.url || '';
  const cleanPath = extractRequestPath(path);

  if (typeof req !== 'string') {
    if (AUTH_SKIP_REAUTH.has(cleanPath)) {
      const orig = (req.headers as Record<string, string> | undefined) ?? {};
      req.headers = { ...orig, 'x-skip-auth': '1' };
    }
    req = ensureRequestBodyHeaders(req);
  }

  let result = await rawBaseQuery(req, api, extra);
  result = await coerceSerializableFetchErrorData(result);

  if (result.error?.status === 401 && !AUTH_SKIP_REAUTH.has(cleanPath)) {
    const refreshRes = await rawBaseQuery(
      {
        url: '/auth/token/refresh',
        method: 'POST',
        headers: { 'x-skip-auth': '1', Accept: 'application/json' },
      },
      api,
      extra,
    );

    if (!refreshRes.error) {
      const access_token = (refreshRes.data as { access_token?: string } | undefined)?.access_token;

      if (access_token) {
        tokenStore.set(access_token);
        writeBrowserStorage(ACCESS_TOKEN_STORAGE_KEY, access_token);

        let retry: AnyArgs = normalizeRequestArg(args);
        if (typeof retry !== 'string') {
          retry = ensureRequestBodyHeaders(retry);
        }

        result = await rawBaseQuery(retry, api, extra);
        result = await coerceSerializableFetchErrorData(result);
      } else {
        tokenStore.set(null);
        removeBrowserStorage(ACCESS_TOKEN_STORAGE_KEY);
        removeBrowserStorage(REFRESH_TOKEN_STORAGE_KEY);
      }
    } else {
      tokenStore.set(null);
      removeBrowserStorage(ACCESS_TOKEN_STORAGE_KEY);
      removeBrowserStorage(REFRESH_TOKEN_STORAGE_KEY);
    }
  }

  // Refresh denemesi sonrası halen 401 ise kullanıcıyı login'e yönlendir.
  if (result.error?.status === 401 && !AUTH_SKIP_REAUTH.has(cleanPath)) {
    redirectToLogin();
  }

  return result;
};

/* -------------------- API -------------------- */

export const baseApi = createApi({
  reducerPath: 'gwdApi',
  baseQuery: baseQueryWithReauth,
  endpoints: () => ({}),
  tagTypes: tags,
});

export { rawBaseQuery };

// Not: BASE_URL artik '@/integrations/api-base' icinden export ediliyor.
export { BASE_URL };
