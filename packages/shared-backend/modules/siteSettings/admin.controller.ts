// src/modules/siteSettings/admin.controller.ts
// Admin handler'lar (aggregate + upsert) — max 200 satir kurali.
// Granular CRUD + delete + meta: admin.controller.crud.ts

import type { FastifyRequest, FastifyReply } from 'fastify';
import { handleRouteError } from '../_shared';
import {
  readAdminAggregateSettings,
  upsertAdminAggregateSettings,
  type AdminAggregateSettingsPayload,
} from './helpers';

type LocaleRequest = FastifyRequest & { locale?: string | null };
type LocaleQuery = { locale?: string };

// ── Aggregate GET/PUT ────────────────────────────────────────────────────────

export async function adminGetSettingsAggregate(req: FastifyRequest, reply: FastifyReply) {
  try {
    const qLocale = (req.query as LocaleQuery | undefined)?.locale;
    const result = await readAdminAggregateSettings(qLocale ?? (req as LocaleRequest).locale);
    return reply.send(result);
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_get_settings_aggregate');
  }
}

export async function adminUpsertSettingsAggregate(req: FastifyRequest, reply: FastifyReply) {
  try {
    const body = (req.body || {}) as AdminAggregateSettingsPayload;
    const qLocale = (req.query as LocaleQuery | undefined)?.locale;
    await upsertAdminAggregateSettings(body, qLocale);
    return reply.send({ ok: true });
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_upsert_settings_aggregate');
  }
}

// Re-export crud handlers for admin.routes.ts convenience
export {
  adminListSiteSettings,
  adminGetSiteSettingByKey,
  adminCreateSiteSetting,
  adminUpdateSiteSetting,
  adminBulkUpsertSiteSettings,
  adminDeleteManySiteSettings,
  adminDeleteSiteSetting,
  adminGetAppLocales,
  adminGetDefaultLocale,
} from './admin.controller.crud';
