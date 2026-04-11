// src/modules/categories/admin.controller.ts

import type { FastifyRequest, FastifyReply } from 'fastify';
import { handleRouteError, sendNotFound, toBool } from '../_shared';
import {
  createCategorySchema,
  updateCategorySchema,
  listCategoriesSchema,
} from './validation';
import {
  repoListCategories,
  repoGetCategoryById,
  repoCreateCategory,
  repoUpdateCategory,
  repoDeleteCategory,
  repoToggleCategoryActive,
  repoToggleCategoryFeatured,
  repoUpdateCategoryOrder,
  repoSetCategoryImage,
} from './repository';

/** GET /admin/categories/list */
export async function adminListCategories(req: FastifyRequest, reply: FastifyReply) {
  try {
    const q = req.query as Record<string, string>;
    const params = listCategoriesSchema.parse(q);
    const rows = await repoListCategories({
      locale: params.locale,
      module_key: params.module_key,
      search: params.search,
      is_active: params.is_active,
      is_featured: params.is_featured,
    });
    return reply.send(rows);
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_categories_list');
  }
}

/** GET /admin/categories/:id */
export async function adminGetCategory(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const q = req.query as Record<string, string>;
    const row = await repoGetCategoryById(id, q.locale);
    if (!row) return sendNotFound(reply);
    return reply.send(row);
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_category_get');
  }
}

/** POST /admin/categories */
export async function adminCreateCategory(req: FastifyRequest, reply: FastifyReply) {
  try {
    const data = createCategorySchema.parse(req.body ?? {});
    const result = await repoCreateCategory(data);
    const row = await repoGetCategoryById(result.id, data.locale);
    return reply.status(201).send(row);
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_category_create');
  }
}

/** PATCH /admin/categories/:id */
export async function adminUpdateCategory(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const data = updateCategorySchema.parse(req.body ?? {});
    const existing = await repoGetCategoryById(id, data.locale);
    if (!existing) return sendNotFound(reply);
    await repoUpdateCategory({ ...data, id });
    const row = await repoGetCategoryById(id, data.locale || existing.locale);
    return reply.send(row);
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_category_update');
  }
}

/** DELETE /admin/categories/:id */
export async function adminDeleteCategory(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const existing = await repoGetCategoryById(id);
    if (!existing) return sendNotFound(reply);
    await repoDeleteCategory(id);
    return reply.send({ ok: true });
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_category_delete');
  }
}

/** POST /admin/categories/reorder */
export async function adminReorderCategories(req: FastifyRequest, reply: FastifyReply) {
  try {
    const body = req.body as { items?: { id: string; display_order: number }[] };
    if (!Array.isArray(body?.items)) {
      return reply.status(400).send({ error: 'items array required' });
    }
    await repoUpdateCategoryOrder(body.items);
    return reply.send({ ok: true });
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_categories_reorder');
  }
}

/** PATCH /admin/categories/:id/active */
export async function adminToggleCategoryActive(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const body = req.body as { is_active?: unknown };
    const existing = await repoGetCategoryById(id);
    if (!existing) return sendNotFound(reply);
    await repoToggleCategoryActive(id, toBool(body.is_active));
    const row = await repoGetCategoryById(id);
    return reply.send(row);
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_category_toggle_active');
  }
}

/** PATCH /admin/categories/:id/featured */
export async function adminToggleCategoryFeatured(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const body = req.body as { is_featured?: unknown };
    const existing = await repoGetCategoryById(id);
    if (!existing) return sendNotFound(reply);
    await repoToggleCategoryFeatured(id, toBool(body.is_featured));
    const row = await repoGetCategoryById(id);
    return reply.send(row);
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_category_toggle_featured');
  }
}

/** PATCH /admin/categories/:id/image */
export async function adminSetCategoryImage(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const body = req.body as { asset_id?: string | null; alt?: string | null };
    const existing = await repoGetCategoryById(id);
    if (!existing) return sendNotFound(reply);
    await repoSetCategoryImage(id, body.asset_id ?? null, body.alt ?? null);
    const row = await repoGetCategoryById(id);
    return reply.send(row);
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_category_set_image');
  }
}
