import type { FastifyInstance } from "fastify";
import { listPopups } from "./controller";

export async function registerPopups(app: FastifyInstance) {
  const B = "/popups";
  app.get(B, { config: { public: true } }, listPopups);
}
