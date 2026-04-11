// src/modules/jobListings/admin.controller.ts
import type { RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import {
  repoAdminListJobs,
  repoAdminGetJob,
  repoCreateJob,
  repoUpdateJob,
  repoDeleteJob,
  repoToggleJobActive,
  repoReorderJobs,
} from './repository';
import { jobListingCreateSchema, jobListingUpdateSchema } from './validation';
import {
  handleRouteError,
  sendNotFound,
  sendValidationError,
} from '@agro/shared-backend/modules/_shared';
import { getEffectiveDefaultLocale } from '@agro/shared-backend/modules/siteSettings';

async function resolveAdminJobLocale(input?: string): Promise<string> {
  const locale = String(input || '').trim().toLowerCase();
  if (locale) return locale;
  return getEffectiveDefaultLocale();
}

export const adminListJobs: RouteHandler = async (req, reply) => {
  try {
    const locale = await resolveAdminJobLocale((req.query as { locale?: string }).locale);
    const rows = await repoAdminListJobs(locale);
    return reply.send(rows);
  } catch (err) {
    return handleRouteError(reply, req, err, 'admin_list_jobs_error');
  }
};

export const adminGetJob: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const locale = await resolveAdminJobLocale((req.query as { locale?: string }).locale);
    const row = await repoAdminGetJob(id, locale);
    if (!row) return sendNotFound(reply);
    return reply.send(row);
  } catch (err) {
    return handleRouteError(reply, req, err, 'admin_get_job_error');
  }
};

export const adminCreateJob: RouteHandler = async (req, reply) => {
  try {
    const input = jobListingCreateSchema.parse(req.body ?? {});
    const id = randomUUID();

    await repoCreateJob(
      id,
      {
        department: input.department,
        location: input.location,
        employment_type: input.employment_type,
        is_active: input.is_active ? 1 : 0,
        display_order: input.display_order,
      },
      {
        locale: input.locale,
        title: input.title,
        slug: input.slug,
        description: input.description,
        requirements: input.requirements,
        meta_title: input.meta_title,
        meta_description: input.meta_description,
      },
    );

    const created = await repoAdminGetJob(id, input.locale);
    return reply.status(201).send(created);
  } catch (err) {
    return handleRouteError(reply, req, err, 'admin_create_job_error');
  }
};

export const adminUpdateJob: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const input = jobListingUpdateSchema.parse(req.body ?? {});
    const locale = await resolveAdminJobLocale(input.locale);

    const existing = await repoAdminGetJob(id, locale);
    if (!existing) return sendNotFound(reply);

    const base: Record<string, unknown> = {};
    if (input.department !== undefined) base.department = input.department;
    if (input.location !== undefined) base.location = input.location;
    if (input.employment_type !== undefined) base.employment_type = input.employment_type;
    if (input.is_active !== undefined) base.is_active = input.is_active ? 1 : 0;
    if (input.display_order !== undefined) base.display_order = input.display_order;

    const i18n: Record<string, unknown> = { locale };
    if (input.title !== undefined) i18n.title = input.title;
    if (input.slug !== undefined) i18n.slug = input.slug;
    if (input.description !== undefined) i18n.description = input.description;
    if (input.requirements !== undefined) i18n.requirements = input.requirements;
    if (input.meta_title !== undefined) i18n.meta_title = input.meta_title;
    if (input.meta_description !== undefined) i18n.meta_description = input.meta_description;

    await repoUpdateJob(
      id,
      Object.keys(base).length > 0 ? base as Parameters<typeof repoUpdateJob>[1] : undefined,
      Object.keys(i18n).length > 1 ? i18n as Parameters<typeof repoUpdateJob>[2] : undefined,
    );

    const updated = await repoAdminGetJob(id, locale);
    return reply.send(updated);
  } catch (err) {
    return handleRouteError(reply, req, err, 'admin_update_job_error');
  }
};

export const adminDeleteJob: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const locale = await resolveAdminJobLocale((req.query as { locale?: string }).locale);
    const existing = await repoAdminGetJob(id, locale);
    if (!existing) return sendNotFound(reply);
    await repoDeleteJob(id);
    return reply.send({ ok: true });
  } catch (err) {
    return handleRouteError(reply, req, err, 'admin_delete_job_error');
  }
};

export const adminToggleJobActive: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const { is_active } = (req.body ?? {}) as { is_active?: boolean };
    if (is_active === undefined) return sendValidationError(reply, 'is_active required');
    await repoToggleJobActive(id, is_active ? 1 : 0);
    return reply.send({ ok: true, is_active: is_active ? 1 : 0 });
  } catch (err) {
    return handleRouteError(reply, req, err, 'admin_toggle_job_error');
  }
};

export const adminReorderJobs: RouteHandler = async (req, reply) => {
  try {
    const { items } = (req.body ?? {}) as { items?: { id: string; display_order: number }[] };
    if (!Array.isArray(items) || items.length === 0) {
      return sendValidationError(reply, 'items array required');
    }
    await repoReorderJobs(items);
    return reply.send({ ok: true });
  } catch (err) {
    return handleRouteError(reply, req, err, 'admin_reorder_jobs_error');
  }
};
