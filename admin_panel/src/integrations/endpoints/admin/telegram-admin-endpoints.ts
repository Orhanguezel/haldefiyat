// ===================================================================
// FILE: src/integrations/endpoints/admin/telegram-admin-endpoints.ts
// Telegram admin endpoints (Ensotek)
// ===================================================================

import { baseApi } from '@/integrations/base-api';
import type { FetchArgs } from '@reduxjs/toolkit/query';
import type {
  SimpleSuccessResp,
  TelegramAdminSendBody,
  TelegramAdminEventBody,
  TelegramAdminTestBody,
  TelegramAdminTestResp,
  TelegramNotificationBody,
} from '@/integrations/shared';
import { buildTelegramNotificationEventBody, TELEGRAM_ADMIN_BASE } from '@/integrations/shared';

export const telegramAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** POST /admin/telegram/test */
    telegramTest: b.mutation<TelegramAdminTestResp, TelegramAdminTestBody | void>({
      query: (body): FetchArgs => ({
        url: `${TELEGRAM_ADMIN_BASE}/test`,
        method: 'POST',
        body: body ?? {}, // chat_id opsiyonel
      }),
    }),

    /** POST /admin/telegram/send (generic) */
    telegramSend: b.mutation<SimpleSuccessResp, TelegramAdminSendBody>({
      query: (body): FetchArgs => ({
        url: `${TELEGRAM_ADMIN_BASE}/send`,
        method: 'POST',
        body,
      }),
    }),

    /** POST /admin/telegram/event (templated) */
    telegramEvent: b.mutation<SimpleSuccessResp, TelegramAdminEventBody>({
      query: (body): FetchArgs => ({
        url: `${TELEGRAM_ADMIN_BASE}/event`,
        method: 'POST',
        body,
      }),
    }),

    /**
     * Backward compat:
     * Eski FE kodu "sendTelegramNotification" çağırıyordu (functions altında).
     * Yeni backend yapısında bu çağrıyı /admin/telegram/event'e map ediyoruz.
     *
     * Beklenen eski body shape: TelegramNotificationBody = Record<string, unknown>
     * İçinden type/event alanlarını tolerant şekilde okuruz.
     */
    sendTelegramNotification: b.mutation<SimpleSuccessResp, TelegramNotificationBody>({
      query: (body): FetchArgs => ({
        url: `${TELEGRAM_ADMIN_BASE}/event`,
        method: 'POST',
        body: buildTelegramNotificationEventBody(body),
      }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useTelegramTestMutation,
  useTelegramSendMutation,
  useTelegramEventMutation,

  // Compat endpoint (internal name)
  useSendTelegramNotificationMutation: _useSendTelegramNotificationMutation,
} = telegramAdminApi;

// ---------------- Backward-compat exports ----------------

// Eski hook adı: useTelegramSendTestMutation
export const useTelegramSendTestMutation = useTelegramTestMutation;

// Eski hook adı: useSendTelegramNotificationMutation
export const useSendTelegramNotificationMutation = _useSendTelegramNotificationMutation;
