// ===================================================================
// FILE: src/integrations/endpoints/admin/telegram-inbound-endpoints.ts
// Telegram inbound + auto-reply admin endpoints (Ensotek)
// ===================================================================

import { baseApi } from '@/integrations/base-api';
import type {
  TelegramAutoReplyConfig,
  TelegramAutoReplyUpdateBody,
  TelegramInboundListParams,
  TelegramInboundListResult,
} from '@/integrations/shared';
import {
  normalizeTelegramAutoReplyConfig,
  TELEGRAM_AUTOREPLY_ADMIN_BASE,
  TELEGRAM_INBOUND_ADMIN_BASE,
} from '@/integrations/shared';

export const telegramInboundAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listTelegramInbound: build.query<TelegramInboundListResult, TelegramInboundListParams | void>({
      query: (arg) => {
        const params = arg && typeof arg === 'object' ? arg : undefined;

        if (params && Object.keys(params).length) {
          return {
            url: TELEGRAM_INBOUND_ADMIN_BASE,
            method: 'GET',
            params: params as Record<string, unknown>,
          };
        }
        return { url: TELEGRAM_INBOUND_ADMIN_BASE, method: 'GET' };
      },
      providesTags: ['TelegramInbound'],
    }),

    getTelegramAutoReply: build.query<TelegramAutoReplyConfig, void>({
      query: () => ({ url: TELEGRAM_AUTOREPLY_ADMIN_BASE, method: 'GET' }),
      transformResponse: (raw: unknown): TelegramAutoReplyConfig =>
        normalizeTelegramAutoReplyConfig(raw),
      providesTags: ['TelegramAutoReply'],
    }),

    updateTelegramAutoReply: build.mutation<{ ok: true }, TelegramAutoReplyUpdateBody>({
      query: (body) => ({ url: TELEGRAM_AUTOREPLY_ADMIN_BASE, method: 'POST', body }),
      invalidatesTags: ['TelegramAutoReply'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListTelegramInboundQuery,
  useGetTelegramAutoReplyQuery,
  useUpdateTelegramAutoReplyMutation,
} = telegramInboundAdminApi;
