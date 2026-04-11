// =============================================================
// FILE: src/modules/references/router.ts  (PUBLIC ROUTES)
// =============================================================
import type { FastifyInstance } from "fastify";
import {
  listReferencesPublic,
  getReferencePublic,
  getReferenceBySlugPublic,
} from "./controller";

const BASE = "/references";

export async function registerReferences(app: FastifyInstance) {
  app.get(`${BASE}`, { config: { public: true } }, listReferencesPublic);
  app.get(`${BASE}/:id`, { config: { public: true } }, getReferencePublic);
  app.get(
    `${BASE}/by-slug/:slug`,
    { config: { public: true } },
    getReferenceBySlugPublic,
  );
}
