// =============================================================
// FILE: src/integrations/endpoints/admin/site-settings-admin-endpoints.ts
// FINAL — no helpers inside; everything from types barrel
// =============================================================

import { baseApi } from '@/integrations/base-api';
import type {
  AdminSiteSetting,
  AdminSiteSettingsListParams,
  AppLocaleMeta,
  DeleteManySiteSettingsAdminArg,
  DeleteSiteSettingAdminArg,
  GetSiteSettingAdminByKeyArg,
  SiteSettingRow,
  UpdateSiteSettingAdminArg,
  UpsertSettingBody,
} from '@/integrations/shared';
import {
  buildAdminSiteSettingsListParams,
  buildDeleteManySiteSettingsParams,
  getSiteSettingsItemTags,
  getSiteSettingsUpdateTags,
  normalizeAdminSiteSettingsList,
  normalizeAdminSiteSettingRow,
  normalizeAppLocalesPublic,
  normalizeDefaultLocalePublic,
  resolveAdminSiteSettingKeyArg,
  SITE_SETTINGS_ADMIN_BASE,
  SITE_SETTINGS_ADMIN_LIST,
} from '@/integrations/shared';

const extendedApi = baseApi.enhanceEndpoints({ addTagTypes: ['SiteSettings'] as const });

export const siteSettingsAdminApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    listSiteSettingsAdmin: b.query<AdminSiteSetting[], AdminSiteSettingsListParams | undefined>({
      query: (params) => {
        const q = buildAdminSiteSettingsListParams(params);
        return q ? { url: SITE_SETTINGS_ADMIN_LIST, params: q } : { url: SITE_SETTINGS_ADMIN_LIST };
      },
      transformResponse: (res: unknown): AdminSiteSetting[] => normalizeAdminSiteSettingsList(res),
      providesTags: (result) => getSiteSettingsItemTags(result),
      keepUnusedDataFor: 60,
    }),

    getSiteSettingAdminByKey: b.query<AdminSiteSetting | null, GetSiteSettingAdminByKeyArg>({
      queryFn: async (arg, _api, _extraOptions, baseQuery) => {
        const { key, locale } = resolveAdminSiteSettingKeyArg(arg);
        const normalizedKey = String(key || '').trim();
        if (!normalizedKey) return { data: null };

        const fallbackKey = normalizedKey.includes('__')
          ? normalizedKey.split('__').slice(1).join('__').trim()
          : normalizedKey;
        const keys = Array.from(new Set([normalizedKey, fallbackKey].filter(Boolean)));

        const result = await baseQuery({
          url: SITE_SETTINGS_ADMIN_LIST,
          params: {
            keys: keys.join(','),
            order: 'updated_at.desc',
            limit: Math.max(keys.length, 2),
            ...(locale ? { locale } : {}),
          },
        });

        if (result.error) {
          return { error: result.error };
        }

        const rows = normalizeAdminSiteSettingsList(result.data);
        if (!rows.length) return { data: null };

        const normalized =
          rows.find((row) => row.key === normalizedKey) ||
          rows.find((row) => row.key === fallbackKey) ||
          null;

        return { data: normalized };
      },
      providesTags: (_r, _e, arg) => {
        const key = typeof arg === 'string' ? arg : arg.key;
        return [{ type: 'SiteSettings', id: key }];
      },
    }),

    // /admin/site_settings/app-locales
    getAppLocalesAdmin: b.query<AppLocaleMeta[], void>({
      query: () => ({ url: `${SITE_SETTINGS_ADMIN_BASE}/app-locales`, method: 'GET' }),
      transformResponse: (res: unknown): AppLocaleMeta[] => normalizeAppLocalesPublic(res),
      providesTags: [{ type: 'SiteSettings' as const, id: 'APP_LOCALES' }],
      keepUnusedDataFor: 60,
    }),

    // /admin/site_settings/default-locale
    getDefaultLocaleAdmin: b.query<string, void>({
      query: () => ({ url: `${SITE_SETTINGS_ADMIN_BASE}/default-locale`, method: 'GET' }),
      transformResponse: (res: unknown): string => normalizeDefaultLocalePublic(res),
      providesTags: [{ type: 'SiteSettings' as const, id: 'DEFAULT_LOCALE' }],
      keepUnusedDataFor: 60,
    }),

    createSiteSettingAdmin: b.mutation<AdminSiteSetting, UpsertSettingBody>({
      query: (body) => ({
        url: SITE_SETTINGS_ADMIN_BASE,
        method: 'POST',
        body: { key: body.key, value: body.value },
      }),
      transformResponse: (res: unknown): AdminSiteSetting =>
        normalizeAdminSiteSettingRow(res as SiteSettingRow) as AdminSiteSetting,
      invalidatesTags: [{ type: 'SiteSettings', id: 'LIST' }],
    }),

    updateSiteSettingAdmin: b.mutation<
      { ok: true },
      UpdateSiteSettingAdminArg
    >({
      query: ({ key, value, locale }) => ({
        url: `${SITE_SETTINGS_ADMIN_BASE}/${encodeURIComponent(key)}`,
        method: 'PUT',
        params: locale ? { locale } : undefined,
        body: { value },
      }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, arg) => getSiteSettingsUpdateTags(arg.key),
    }),

    bulkUpsertSiteSettingsAdmin: b.mutation<{ ok: true }, { items: UpsertSettingBody[] }>({
      query: ({ items }) => ({
        url: `${SITE_SETTINGS_ADMIN_BASE}/bulk-upsert`,
        method: 'POST',
        body: { items: items.map((i) => ({ key: i.key, value: i.value })) },
      }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: [
        { type: 'SiteSettings', id: 'LIST' },
        { type: 'SiteSettings', id: 'DEFAULT_LOCALE' },
        { type: 'SiteSettings', id: 'APP_LOCALES' },
      ],
    }),

    deleteSiteSettingAdmin: b.mutation<{ ok: true }, DeleteSiteSettingAdminArg>({
      query: ({ key, locale }) => ({
        url: `${SITE_SETTINGS_ADMIN_BASE}/${encodeURIComponent(key)}`,
        method: 'DELETE',
        params: locale ? { locale } : undefined,
      }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'SiteSettings', id: arg.key },
        { type: 'SiteSettings', id: 'LIST' },
      ],
    }),

    deleteManySiteSettingsAdmin: b.mutation<
      { ok: true },
      DeleteManySiteSettingsAdminArg
    >({
      query: (p) => ({
        url: SITE_SETTINGS_ADMIN_BASE,
        method: 'DELETE',
        params: buildDeleteManySiteSettingsParams(p),
      }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: [{ type: 'SiteSettings', id: 'LIST' }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListSiteSettingsAdminQuery,
  useGetSiteSettingAdminByKeyQuery,
  useGetAppLocalesAdminQuery,
  useGetDefaultLocaleAdminQuery,
  useCreateSiteSettingAdminMutation,
  useUpdateSiteSettingAdminMutation,
  useDeleteSiteSettingAdminMutation,
  useBulkUpsertSiteSettingsAdminMutation,
  useDeleteManySiteSettingsAdminMutation,
} = siteSettingsAdminApi;
