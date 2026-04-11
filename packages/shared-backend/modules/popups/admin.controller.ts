import type { FastifyRequest, FastifyReply } from "fastify";
import {
  repoListAdmin,
  repoGetById,
  repoCreate,
  repoUpdate,
  repoDelete,
  repoReorder,
  repoSetStatus,
  type PopupWithAsset,
} from "./repository";
import {
  adminListQuerySchema,
  idParamSchema,
  localeQuerySchema,
  createSchema,
  updateSchema,
  reorderSchema,
  setStatusSchema,
} from "./validation";
import { resolveRequestLocales, toBool, handleRouteError, sendNotFound } from "@agro/shared-backend/modules/_shared";

function toAdminView(p: PopupWithAsset) {
  const { row, i18n, image_url } = p;
  return {
    id: row.id,
    uuid: row.uuid,
    type: row.type,
    title: i18n.title,
    content: i18n.content ?? null,
    image_url,
    image_asset_id: row.image_asset_id ?? null,
    alt: i18n.alt ?? null,
    background_color: row.background_color ?? null,
    text_color: row.text_color ?? null,
    button_text: i18n.button_text ?? null,
    button_color: row.button_color ?? null,
    button_hover_color: row.button_hover_color ?? null,
    button_text_color: row.button_text_color ?? null,
    link_url: row.link_url ?? null,
    link_target: row.link_target,
    target_paths: row.target_paths,
    text_behavior: row.text_behavior,
    scroll_speed: row.scroll_speed,
    closeable: row.closeable === 1,
    delay_seconds: row.delay_seconds,
    display_frequency: row.display_frequency,
    is_active: row.is_active === 1,
    display_order: row.display_order,
    start_at: row.start_at ?? null,
    end_at: row.end_at ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function adminListPopups(req: FastifyRequest, reply: FastifyReply) {
  try {
    const q = adminListQuerySchema.parse(req.query);
    const { locale, def } = await resolveRequestLocales(req, { locale: q.locale, default_locale: q.default_locale });
    const rows = await repoListAdmin({ ...q, locale, default_locale: def });
    return reply.send(rows.map(toAdminView));
  } catch (err) {
    return handleRouteError(reply, req, err, "popup_list_failed");
  }
}

export async function adminGetPopup(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = idParamSchema.parse(req.params);
    const q = localeQuerySchema.parse(req.query ?? {});
    const { locale, def } = await resolveRequestLocales(req, q);
    const r = await repoGetById(id, locale, def);
    if (!r) return sendNotFound(reply);
    return reply.send(toAdminView(r));
  } catch (err) {
    return handleRouteError(reply, req, err, "popup_get_failed");
  }
}

export async function adminCreatePopup(req: FastifyRequest, reply: FastifyReply) {
  try {
    const body = createSchema.parse(req.body);
    const { locale, def } = await resolveRequestLocales(req, { locale: body.locale });
    const r = await repoCreate(body, locale, def);
    return reply.code(201).send(toAdminView(r));
  } catch (err) {
    return handleRouteError(reply, req, err, "popup_create_failed");
  }
}

export async function adminUpdatePopup(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = idParamSchema.parse(req.params);
    const body = updateSchema.parse(req.body);
    const { locale, def } = await resolveRequestLocales(req, { locale: body.locale });
    const r = await repoUpdate(id, body, locale, def);
    if (!r) return sendNotFound(reply);
    return reply.send(toAdminView(r));
  } catch (err) {
    return handleRouteError(reply, req, err, "popup_update_failed");
  }
}

export async function adminDeletePopup(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = idParamSchema.parse(req.params);
    await repoDelete(id);
    return reply.code(204).send();
  } catch (err) {
    return handleRouteError(reply, req, err, "popup_delete_failed");
  }
}

export async function adminReorderPopups(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { ids } = reorderSchema.parse(req.body);
    await repoReorder(ids);
    return reply.send({ ok: true });
  } catch (err) {
    return handleRouteError(reply, req, err, "popup_reorder_failed");
  }
}

export async function adminSetPopupStatus(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = idParamSchema.parse(req.params);
    const { is_active } = setStatusSchema.parse(req.body);
    const q = localeQuerySchema.parse(req.query ?? {});
    const { locale, def } = await resolveRequestLocales(req, q);
    const r = await repoSetStatus(id, toBool(is_active), locale, def);
    if (!r) return sendNotFound(reply);
    return reply.send(toAdminView(r));
  } catch (err) {
    return handleRouteError(reply, req, err, "popup_status_failed");
  }
}
