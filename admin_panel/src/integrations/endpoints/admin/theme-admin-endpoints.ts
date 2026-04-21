import { baseApi } from '@/integrations/base-api';
import type { ThemeConfigView, ThemeUpdateInput } from '@/integrations/shared';
import { normalizeThemeConfig, THEME_ADMIN_BASE } from '@/integrations/shared';

export const themeAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getThemeAdmin: b.query<ThemeConfigView, void>({
      query: () => ({ url: THEME_ADMIN_BASE, method: 'GET' }),
      transformResponse: (res: unknown): ThemeConfigView => normalizeThemeConfig(res),
      providesTags: [{ type: 'Settings' as const, id: 'THEME' }],
      keepUnusedDataFor: 30,
    }),

    updateThemeAdmin: b.mutation<ThemeConfigView, ThemeUpdateInput>({
      query: (body) => ({ url: THEME_ADMIN_BASE, method: 'PUT', body }),
      transformResponse: (res: unknown): ThemeConfigView => normalizeThemeConfig(res),
      invalidatesTags: [{ type: 'Settings' as const, id: 'THEME' }],
    }),

    resetThemeAdmin: b.mutation<ThemeConfigView, void>({
      query: () => ({ url: `${THEME_ADMIN_BASE}/reset`, method: 'POST' }),
      transformResponse: (res: unknown): ThemeConfigView => normalizeThemeConfig(res),
      invalidatesTags: [{ type: 'Settings' as const, id: 'THEME' }],
    }),
  }),
  overrideExisting: true,
});

export const { useGetThemeAdminQuery, useUpdateThemeAdminMutation, useResetThemeAdminMutation } = themeAdminApi;
