// src/modules/jobApplications/admin.controller.ts
import type { RouteHandler } from 'fastify';
import {
  repoAdminListApplications,
  repoAdminGetApplication,
  repoUpdateApplicationStatus,
  repoDeleteApplication,
} from './repository';
import { jobApplicationStatusSchema } from './validation';
import {
  handleRouteError,
  sendNotFound,
} from '@agro/shared-backend/modules/_shared';
import { getEffectiveDefaultLocale } from '@agro/shared-backend/modules/siteSettings';

async function resolveAdminApplicationLocale(input?: string): Promise<string> {
  const locale = String(input || '').trim().toLowerCase();
  if (locale) return locale;
  return getEffectiveDefaultLocale();
}

export const adminListApplications: RouteHandler = async (req, reply) => {
  try {
    const { job_listing_id, locale: localeInput } = req.query as { job_listing_id?: string; locale?: string };
    const locale = await resolveAdminApplicationLocale(localeInput);
    const rows = await repoAdminListApplications(job_listing_id, locale);
    return reply.send(rows);
  } catch (err) {
    return handleRouteError(reply, req, err, 'admin_list_applications_error');
  }
};

export const adminGetApplication: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const locale = await resolveAdminApplicationLocale((req.query as { locale?: string }).locale);
    const row = await repoAdminGetApplication(id, locale);
    if (!row) return sendNotFound(reply);
    return reply.send(row);
  } catch (err) {
    return handleRouteError(reply, req, err, 'admin_get_application_error');
  }
};

export const adminUpdateApplicationStatus: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const locale = await resolveAdminApplicationLocale((req.query as { locale?: string }).locale);
    const existing = await repoAdminGetApplication(id, locale);
    if (!existing) return sendNotFound(reply);
    const input = jobApplicationStatusSchema.parse(req.body ?? {});
    await repoUpdateApplicationStatus(id, input.status, input.admin_note);
    const updated = await repoAdminGetApplication(id, locale);
    return reply.send(updated);
  } catch (err) {
    return handleRouteError(reply, req, err, 'admin_update_status_error');
  }
};

export const adminDeleteApplication: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const locale = await resolveAdminApplicationLocale((req.query as { locale?: string }).locale);
    const existing = await repoAdminGetApplication(id, locale);
    if (!existing) return sendNotFound(reply);
    await repoDeleteApplication(id);
    return reply.send({ ok: true });
  } catch (err) {
    return handleRouteError(reply, req, err, 'admin_delete_application_error');
  }
};
