/**
 * 301/410 yonlendirme yonetimi + icerik/index denetimi.
 *
 * Public (proxy.ts kullanir):
 *   GET  /api/v1/redirects            → aktif redirect listesi (middleware cache'ler)
 *   GET  /api/v1/redirects/lookup     → ?path=... tek yol sorgusu
 *   POST /api/v1/redirects/hit        → { id } hit sayaci (fire-and-forget)
 *
 * Admin:
 *   GET    /api/v1/admin/redirects            → liste (type/search/page)
 *   POST   /api/v1/admin/redirects            → tekil veya toplu ekleme
 *   PATCH  /api/v1/admin/redirects/:id        → guncelle
 *   DELETE /api/v1/admin/redirects/:id        → sil
 *   GET    /api/v1/admin/seo-audit            → urun index/kalite denetimi (?filter=issues|all)
 */
import type { FastifyInstance } from "fastify";
import {
  adminListRedirects,
  auditProducts,
  deleteRedirect,
  incrementHit,
  listActiveRedirects,
  lookupRedirect,
  updateRedirect,
  upsertRedirects,
  type RedirectInput,
} from "./repository";

export async function registerRedirectsPublic(api: FastifyInstance) {
  api.get("/redirects", async (_req, reply) => {
    const items = await listActiveRedirects();
    return reply.send({ items });
  });

  api.get<{ Querystring: { path?: string } }>("/redirects/lookup", async (req, reply) => {
    const path = req.query.path ?? "";
    if (!path) return reply.status(400).send({ error: "path gerekli" });
    const hit = await lookupRedirect(path);
    if (!hit) return reply.status(404).send({ found: false });
    return reply.send({ found: true, type: hit.type, targetUrl: hit.targetUrl, id: hit.id });
  });

  api.post<{ Body: { id?: number } }>("/redirects/hit", async (req, reply) => {
    const id = Number(req.body?.id);
    if (Number.isFinite(id) && id > 0) void incrementHit(id);
    return reply.send({ ok: true });
  });
}

export async function registerSeoOpsAdmin(adminApi: FastifyInstance) {
  adminApi.get<{ Querystring: { type?: string; search?: string; page?: string } }>(
    "/redirects",
    async (req, reply) => {
      const result = await adminListRedirects({
        type: req.query.type,
        search: req.query.search,
        page: req.query.page ? parseInt(req.query.page, 10) : 1,
      });
      return reply.send(result);
    },
  );

  // Tekil veya toplu ekleme. Body: RedirectInput veya { items: RedirectInput[] }
  adminApi.post<{ Body: RedirectInput | { items: RedirectInput[] } }>(
    "/redirects",
    async (req, reply) => {
      const body = req.body;
      const inputs: RedirectInput[] = Array.isArray((body as { items?: unknown[] }).items)
        ? (body as { items: RedirectInput[] }).items
        : [body as RedirectInput];
      const result = await upsertRedirects(inputs);
      return reply.send({ ok: true, ...result });
    },
  );

  adminApi.patch<{ Params: { id: string }; Body: Partial<RedirectInput> & { isActive?: number } }>(
    "/redirects/:id",
    async (req, reply) => {
      await updateRedirect(parseInt(req.params.id, 10), req.body ?? {});
      return reply.send({ ok: true });
    },
  );

  adminApi.delete<{ Params: { id: string } }>("/redirects/:id", async (req, reply) => {
    await deleteRedirect(parseInt(req.params.id, 10));
    return reply.send({ ok: true });
  });

  adminApi.get<{ Querystring: { filter?: string } }>("/seo-audit", async (req, reply) => {
    const filter = req.query.filter === "all" ? "all" : "issues";
    const result = await auditProducts(filter);
    return reply.send(result);
  });
}
