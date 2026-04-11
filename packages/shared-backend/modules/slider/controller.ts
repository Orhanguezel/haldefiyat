// src/modules/slider/controller.ts
import type { RouteHandler } from 'fastify';
import { publicListQuerySchema, idOrSlugParamSchema } from './validation';
import { repoListPublic, repoGetBySlug } from './repository';
import { handleRouteError, sendNotFound } from '@agro/shared-backend/modules/_shared/http';
import { resolveLocales } from './helpers';
import { rowToPublic } from './helpers';

/** GET /sliders */
export const listPublicSlides: RouteHandler = async (req, reply) => {
  try {
    const parsed = publicListQuerySchema.safeParse(req.query);
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

    const rows = await repoListPublic({ ...q, locale, default_locale: def });
    return rows.map(rowToPublic);
  } catch (err) {
    return handleRouteError(reply, req, err, 'slider_list_failed');
  }
};

/** GET /sliders/:idOrSlug */
export const getPublicSlide: RouteHandler = async (req, reply) => {
  try {
    const v = idOrSlugParamSchema.safeParse(req.params);
    if (!v.success) {
      return reply.code(400).send({ error: { message: 'invalid_params' } });
    }

    const q = (req.query ?? {}) as Record<string, string>;
    const { locale, def } = await resolveLocales(req, {
      locale: q.locale,
      default_locale: q.default_locale,
    });

    const row = await repoGetBySlug(v.data.idOrSlug, locale, def);
    if (!row || !row.sl?.is_active) return sendNotFound(reply);

    return rowToPublic(row);
  } catch (err) {
    return handleRouteError(reply, req, err, 'slider_get_failed');
  }
};
