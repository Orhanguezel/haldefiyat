// src/modules/telegram/validation.ts
import { z } from 'zod';

/* ---------------- manual send ---------------- */

export const TelegramSendBodySchema = z.object({
  title: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(4000),
  type: z.string().trim().max(100).optional(),
  chat_id: z.string().trim().max(64).optional(),
});

export type TelegramSendBody = z.infer<typeof TelegramSendBodySchema>;

/* ---------------- event dispatcher ---------------- */

const baseEvent = z.object({
  chat_id: z.string().trim().max(64).optional(),
});

// 1) Yeni uye
const eventNewUser = baseEvent.extend({
  event: z.literal('new_user'),
  data: z.object({
    user_name: z.string().trim().min(1),
    user_email: z.string().trim().min(1),
    role: z.string().trim().min(1),
    created_at: z.string().trim().min(1),
  }),
});

// 2) Iletisim formu
const eventNewContact = baseEvent.extend({
  event: z.literal('new_contact'),
  data: z.object({
    customer_name: z.string().trim().min(1),
    customer_email: z.string().trim().min(1),
    customer_phone: z.string().trim().optional(),
    subject: z.string().trim().optional(),
    message: z.string().trim().min(1),
    created_at: z.string().trim().min(1),
  }),
});

// 3) Destek ticket
const eventNewTicket = baseEvent.extend({
  event: z.literal('new_ticket'),
  data: z.object({
    customer_name: z.string().trim().min(1),
    subject: z.string().trim().min(1),
    message: z.string().trim().min(1),
    created_at: z.string().trim().min(1),
  }),
});

export const TelegramEventBodySchema = z.discriminatedUnion('event', [
  eventNewUser,
  eventNewContact,
  eventNewTicket,
]);

export type TelegramEventBody = z.infer<typeof TelegramEventBodySchema>;

/* ---------------- test ---------------- */

export const TelegramTestBodySchema = z.object({
  chat_id: z.string().trim().max(64).optional(),
});
export type TelegramTestBody = z.infer<typeof TelegramTestBodySchema>;

/* ---------------- inbound list ---------------- */

export const TelegramInboundListQuerySchema = z.object({
  chat_id: z.string().trim().max(64).optional(),
  q: z.string().trim().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  cursor: z.string().trim().max(500).optional(),
});
export type TelegramInboundListQuery = z.infer<typeof TelegramInboundListQuerySchema>;

/* ---------------- autoreply ---------------- */

export const TelegramAutoReplyUpdateBodySchema = z.object({
  enabled: z.boolean().optional(),
  template: z.string().trim().min(1).max(4000).optional(),
});
export type TelegramAutoReplyUpdateBody = z.infer<typeof TelegramAutoReplyUpdateBodySchema>;

/* ---------------- webhook ---------------- */

export const TelegramWebhookBodySchema = z
  .object({
    update_id: z.number().int(),
    message: z
      .object({
        message_id: z.number().int().optional(),
        date: z.number().int().optional(),
        text: z.string().optional(),
        from: z
          .object({
            id: z.union([z.number().int(), z.string()]).optional(),
            is_bot: z.boolean().optional(),
            username: z.string().optional(),
            first_name: z.string().optional(),
            last_name: z.string().optional(),
          })
          .optional(),
        chat: z
          .object({
            id: z.union([z.number().int(), z.string()]),
            type: z.string().optional(),
            title: z.string().optional(),
            username: z.string().optional(),
          })
          .optional(),
      })
      .optional(),
  })
  .passthrough();

export type TelegramWebhookBody = z.infer<typeof TelegramWebhookBodySchema>;
