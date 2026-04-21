// ===================================================================
// FILE: src/integrations/endpoints/admin/telegram-webhook-endpoints.ts
// Telegram webhook admin endpoints (Ensotek)
// ===================================================================

import { baseApi } from '@/integrations/base-api';
import type {
  TelegramUpdate,
  TelegramWebhookResponse,
} from '@/integrations/shared';

export const telegramWebhookAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    telegramWebhookSimulate: build.mutation<TelegramWebhookResponse, { update: TelegramUpdate }>({
      query: (body) => ({
        url: '/admin/telegram/webhook/simulate',
        method: 'POST',
        body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useTelegramWebhookSimulateMutation } = telegramWebhookAdminApi;
