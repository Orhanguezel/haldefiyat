import type { FastifyRequest, FastifyReply } from "fastify";
import { repoListPublic, type PopupWithAsset } from "./repository";
import { publicListQuerySchema } from "./validation";
import { resolveRequestLocales, handleRouteError } from "@agro/shared-backend/modules/_shared";

function toPublicView(p: PopupWithAsset) {
  const { row, i18n, image_url } = p;
  return {
    id: row.id,
    type: row.type,
    title: i18n.title,
    content: i18n.content ?? null,
    target_paths: row.target_paths,
    image: image_url,
    alt: i18n.alt ?? null,
    background_color: row.background_color ?? null,
    text_color: row.text_color ?? null,
    button_text: i18n.button_text ?? null,
    button_color: row.button_color ?? null,
    button_hover_color: row.button_hover_color ?? null,
    button_text_color: row.button_text_color ?? null,
    link_url: row.link_url ?? null,
    link_target: row.link_target,
    text_behavior: row.text_behavior,
    scroll_speed: row.scroll_speed,
    closeable: row.closeable === 1,
    delay_seconds: row.delay_seconds,
    display_frequency: row.display_frequency,
    order: row.display_order,
  };
}

export async function listPopups(req: FastifyRequest, reply: FastifyReply) {
  try {
    const q = publicListQuerySchema.parse(req.query);
    const { locale, def } = await resolveRequestLocales(req, { locale: q.locale, default_locale: q.default_locale });
    const rows = await repoListPublic({ ...q, locale, default_locale: def });
    return reply.send(rows.map(toPublicView));
  } catch (err) {
    return handleRouteError(reply, req, err, "popup_public_list_failed");
  }
}
