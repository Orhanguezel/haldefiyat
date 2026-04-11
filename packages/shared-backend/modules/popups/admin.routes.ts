import type { FastifyInstance } from "fastify";
import {
  adminListPopups,
  adminGetPopup,
  adminCreatePopup,
  adminUpdatePopup,
  adminDeletePopup,
  adminReorderPopups,
  adminSetPopupStatus,
} from "./admin.controller";

export async function registerPopupsAdmin(app: FastifyInstance) {
  const B = "/popups";
  app.get(B, adminListPopups);
  app.get(`${B}/:id`, adminGetPopup);
  app.post(B, adminCreatePopup);
  app.patch(`${B}/:id`, adminUpdatePopup);
  app.delete(`${B}/:id`, adminDeletePopup);
  app.post(`${B}/reorder`, adminReorderPopups);
  app.patch(`${B}/:id/status`, adminSetPopupStatus);
}
