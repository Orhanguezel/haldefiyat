// ===================================================================
// FILE: src/modules/telegram/admin.controller.ts
// Admin Telegram handlers
// ===================================================================

import type { FastifyRequest, FastifyReply } from 'fastify';
import { handleRouteError } from '../_shared';
import {
  TelegramInboundListQuerySchema,
  TelegramAutoReplyUpdateBodySchema,
  TelegramTestBodySchema,
  TelegramSendBodySchema,
  TelegramEventBodySchema,
} from './validation';
import { repoListInbound, repoGetAutoReply, repoUpsertAutoReply } from './repository';
import { sendTelegramTest, sendTelegramGeneric, sendTelegramEvent } from './service';

export async function adminListInbound(req: FastifyRequest, reply: FastifyReply) {
  try {
    const q = TelegramInboundListQuerySchema.parse(req.query ?? {});
    const result = await repoListInbound(q);
    return reply.code(200).send(result);
  } catch (e) {
    return handleRouteError(reply, req, e, 'list_inbound');
  }
}

export async function adminGetAutoReply(req: FastifyRequest, reply: FastifyReply) {
  try {
    const cfg = await repoGetAutoReply();
    return reply.code(200).send(cfg);
  } catch (e) {
    return handleRouteError(reply, req, e, 'get_autoreply');
  }
}

export async function adminUpdateAutoReply(req: FastifyRequest, reply: FastifyReply) {
  try {
    const body = TelegramAutoReplyUpdateBodySchema.parse(req.body ?? {});
    const result = await repoUpsertAutoReply(body);
    return reply.code(200).send(result);
  } catch (e) {
    return handleRouteError(reply, req, e, 'update_autoreply');
  }
}

export async function adminTelegramTest(req: FastifyRequest, reply: FastifyReply) {
  try {
    const body = TelegramTestBodySchema.parse(req.body ?? {});
    const result = await sendTelegramTest(body.chat_id);
    return reply.code(200).send(result);
  } catch (e) {
    return handleRouteError(reply, req, e, 'telegram_test_failed');
  }
}

export async function adminTelegramSend(req: FastifyRequest, reply: FastifyReply) {
  try {
    const body = TelegramSendBodySchema.parse(req.body ?? {});
    const result = await sendTelegramGeneric(body);
    return reply.code(201).send(result);
  } catch (e) {
    return handleRouteError(reply, req, e, 'telegram_send_failed');
  }
}

export async function adminTelegramEvent(req: FastifyRequest, reply: FastifyReply) {
  try {
    const body = TelegramEventBodySchema.parse(req.body ?? {});
    const result = await sendTelegramEvent(body);
    return reply.code(201).send(result);
  } catch (e) {
    return handleRouteError(reply, req, e, 'telegram_event_failed');
  }
}
