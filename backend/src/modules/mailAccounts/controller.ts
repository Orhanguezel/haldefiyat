import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { getAuthUserId, handleRouteError } from '@agro/shared-backend/modules/_shared';
import { env } from '@/core/env';
import {
  createGmailConnectUrl, deleteAccount, getGoogleCalendarStatus, getGoogleTasksStatus,
  getMessage, handleGmailCallback, listAccounts, listInbox, sendMailViaAccount,
  listOwnGoogleEvents, listOwnGoogleTasks,
  syncGoogleCalendar, syncGoogleTasks,
} from './service';

const sendSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(300),
  html: z.string().min(1),
  text: z.string().optional(),
  replyTo: z.string().email().nullable().optional(),
});

const wrap = (fn: (userId: string) => Promise<unknown>, code: string) =>
  async (req: FastifyRequest, reply: FastifyReply) => {
    try { return reply.send(await fn(getAuthUserId(req))); }
    catch (error) { return handleRouteError(reply, req, error, code); }
  };

export const listAccountsHandler = wrap(listAccounts, 'mail_accounts_list_failed');
export const gmailConnectHandler = wrap(createGmailConnectUrl, 'gmail_connect_failed');
export const tasksStatusHandler = wrap(getGoogleTasksStatus, 'google_tasks_status_failed');
export const tasksSyncHandler = wrap(syncGoogleTasks, 'google_tasks_sync_failed');
export const calendarStatusHandler = wrap(getGoogleCalendarStatus, 'google_calendar_status_failed');
export const calendarSyncHandler = wrap(syncGoogleCalendar, 'google_calendar_sync_failed');
export const ownTasksHandler = wrap(listOwnGoogleTasks, 'google_tasks_list_failed');
export const ownEventsHandler = wrap(listOwnGoogleEvents, 'google_calendar_list_failed');

export async function gmailCallbackHandler(
  req: FastifyRequest<{ Querystring: { code?: string; state?: string } }>,
  reply: FastifyReply,
) {
  try {
    if (!req.query.code || !req.query.state) return reply.code(400).send({ error: { message: 'missing_oauth_params' } });
    return reply.redirect(await handleGmailCallback(req.query.code, req.query.state));
  } catch (error) {
    req.log.error({ error }, 'gmail_callback_failed');
    return reply.redirect(`${env.FRONTEND_URL.replace(/\/+$/, '')}/admin/entegrasyonlar?google=error`);
  }
}

export async function deleteAccountHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  try {
    await deleteAccount(getAuthUserId(req), req.params.id);
    return reply.code(204).send();
  } catch (error) {
    return handleRouteError(reply, req, error, 'mail_account_delete_failed');
  }
}

export async function sendMailHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const input = sendSchema.parse(req.body);
    return reply.send(await sendMailViaAccount(getAuthUserId(req), input));
  } catch (error) {
    return handleRouteError(reply, req, error, 'mail_send_failed');
  }
}

export async function inboxHandler(
  req: FastifyRequest<{ Querystring: { limit?: string } }>,
  reply: FastifyReply,
) {
  try {
    return reply.send(await listInbox(getAuthUserId(req), Number(req.query.limit || 20)));
  } catch (error) {
    return handleRouteError(reply, req, error, 'mail_inbox_failed');
  }
}

export async function messageHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  try {
    const message = await getMessage(getAuthUserId(req), req.params.id);
    return message ? reply.send(message) : reply.code(404).send({ error: { message: 'not_found' } });
  } catch (error) {
    return handleRouteError(reply, req, error, 'mail_message_failed');
  }
}
