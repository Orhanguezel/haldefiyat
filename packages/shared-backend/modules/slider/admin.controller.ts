// src/modules/slider/admin.controller.ts
import type { RouteHandler } from 'fastify';
import {
  adminListQuerySchema,
  idParamSchema,
  createSchema,
  updateSchema,
  reorderSchema,
  setStatusSchema,
  setImageSchema,
  type CreateBody,
  type UpdateBody,
  type SetImageBody,
} from './validation';
import {
  repoListAdmin,
  repoGetById,
  repoCreate,
  repoUpdate,
  repoDelete,
  repoReorder,
  repoSetStatus,
  repoSetImage,
} from './repository';
import { handleRouteError, sendNotFound } from '@agro/shared-backend/modules/_shared/http';
import { resolveLocales } from './helpers';
import { toAdminView } from './helpers';

/** GET /admin/sliders */
export const adminListSlides: RouteHandler = async (req, reply) => {
  try {
    const parsed = adminListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({
        error: { message: 'invalid_query', issues: parsed.error.flatten() },
      });
    }

    const q = parsed.data;
    const { locale, def } = await resolveLocales(req, {
      locale: q.locale,
      default_locale: q.default_locale,
    });

    const rows = await repoListAdmin({ ...q, locale, default_locale: def });
    return rows.map(toAdminView);
  } catch (err) {
    return handleRouteError(reply, req, err, 'slider_admin_list_failed');
  }
};

/** GET /admin/sliders/:id */
export const adminGetSlide: RouteHandler = async (req, reply) => {
  try {
    const v = idParamSchema.safeParse(req.params);
    if (!v.success) {
      return reply.code(400).send({ error: { message: 'invalid_params' } });
    }

    const q = (req.query ?? {}) as Record<string, string>;
    const { locale, def } = await resolveLocales(req, {
      locale: q.locale,
      default_locale: q.default_locale,
    });

    const row = await repoGetById(v.data.id, locale, def);
    if (!row) return sendNotFound(reply);

    return toAdminView(row);
  } catch (err) {
    return handleRouteError(reply, req, err, 'slider_admin_get_failed');
  }
};

/** POST /admin/sliders */
export const adminCreateSlide: RouteHandler = async (req, reply) => {
  try {
    const b = createSchema.safeParse(req.body);
    if (!b.success) {
      return reply.code(400).send({
        error: { message: 'invalid_body', issues: b.error.flatten() },
      });
    }

    const { locale } = await resolveLocales(req, { locale: b.data.locale });
    const created = await repoCreate(b.data as CreateBody, locale);
    return reply.code(201).send(toAdminView(created));
  } catch (err) {
    const typedErr = err as { code?: string };
    if (typedErr?.code === 'ER_DUP_ENTRY') {
      return reply.code(409).send({ error: { message: 'slug_locale_already_exists' } });
    }
    return handleRouteError(reply, req, err, 'slider_create_failed');
  }
};

/** PATCH /admin/sliders/:id */
export const adminUpdateSlide: RouteHandler = async (req, reply) => {
  try {
    const p = idParamSchema.safeParse(req.params);
    if (!p.success) {
      return reply.code(400).send({ error: { message: 'invalid_params' } });
    }

    const b = updateSchema.safeParse(req.body);
    if (!b.success) {
      return reply.code(400).send({
        error: { message: 'invalid_body', issues: b.error.flatten() },
      });
    }

    const { locale, def } = await resolveLocales(req, { locale: b.data.locale });
    const updated = await repoUpdate(p.data.id, b.data as UpdateBody, locale, def);
    if (!updated) return sendNotFound(reply);

    return toAdminView(updated);
  } catch (err) {
    const typedErr = err as { code?: string };
    if (typedErr?.code === 'ER_DUP_ENTRY') {
      return reply.code(409).send({ error: { message: 'slug_locale_already_exists' } });
    }
    return handleRouteError(reply, req, err, 'slider_update_failed');
  }
};

/** DELETE /admin/sliders/:id */
export const adminDeleteSlide: RouteHandler = async (req, reply) => {
  try {
    const p = idParamSchema.safeParse(req.params);
    if (!p.success) {
      return reply.code(400).send({ error: { message: 'invalid_params' } });
    }

    await repoDelete(p.data.id);
    return reply.send({ ok: true });
  } catch (err) {
    return handleRouteError(reply, req, err, 'slider_delete_failed');
  }
};

/** POST /admin/sliders/reorder */
export const adminReorderSlides: RouteHandler = async (req, reply) => {
  try {
    const b = reorderSchema.safeParse(req.body);
    if (!b.success) {
      return reply.code(400).send({
        error: { message: 'invalid_body', issues: b.error.flatten() },
      });
    }

    await repoReorder(b.data.ids);
    return reply.send({ ok: true });
  } catch (err) {
    return handleRouteError(reply, req, err, 'slider_reorder_failed');
  }
};

/** POST /admin/sliders/:id/status */
export const adminSetStatus: RouteHandler = async (req, reply) => {
  try {
    const p = idParamSchema.safeParse(req.params);
    if (!p.success) {
      return reply.code(400).send({ error: { message: 'invalid_params' } });
    }

    const b = setStatusSchema.safeParse(req.body);
    if (!b.success) {
      return reply.code(400).send({
        error: { message: 'invalid_body', issues: b.error.flatten() },
      });
    }

    const { locale, def } = await resolveLocales(req);
    const updated = await repoSetStatus(p.data.id, b.data.is_active, locale, def);
    if (!updated) return sendNotFound(reply);

    return toAdminView(updated);
  } catch (err) {
    return handleRouteError(reply, req, err, 'slider_set_status_failed');
  }
};

/** PATCH /admin/sliders/:id/image */
export const adminSetSliderImage: RouteHandler = async (req, reply) => {
  try {
    const p = idParamSchema.safeParse(req.params);
    if (!p.success) {
      return reply.code(400).send({ error: { message: 'invalid_params' } });
    }

    const b = setImageSchema.safeParse(req.body);
    if (!b.success) {
      return reply.code(400).send({
        error: { message: 'invalid_body', issues: b.error.flatten() },
      });
    }

    const { locale, def } = await resolveLocales(req);
    const updated = await repoSetImage(p.data.id, b.data as SetImageBody, locale, def);
    if (!updated) return sendNotFound(reply);

    return toAdminView(updated);
  } catch (err) {
    return handleRouteError(reply, req, err, 'slider_set_image_failed');
  }
};
