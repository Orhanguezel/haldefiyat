import type { FastifyInstance } from "fastify";
import { pool } from "@/db/client";
import { classifyGsc } from "./gsc-index";

// Tek-kaynak paylasimi: sosyal platform (ve diger tuketiciler) haldefiyat GSC
// durumunu BURADAN okur, kendisi GSC'ye gitmez. GSC_EXPORT_TOKEN ile korunur.
export async function registerGscPublic(api: FastifyInstance) {
  api.get("/gsc/export", async (req, reply) => {
    const token = process.env.GSC_EXPORT_TOKEN;
    if (!token) return reply.status(404).send({ error: "Export devre disi (GSC_EXPORT_TOKEN tanimsiz)" });
    const auth = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    const provided = auth || (req.query as { token?: string })?.token;
    if (provided !== token) return reply.status(401).send({ error: "Yetkisiz" });

    const [rows] = await pool.query<any[]>(
      "SELECT url, verdict, coverage_state, last_crawl, checked_at FROM gsc_url_index ORDER BY checked_at DESC",
    );
    const items = (rows ?? []).map((r) => {
      const { category, label } = classifyGsc(r.verdict ?? null, r.coverage_state ?? null);
      return {
        url: r.url,
        verdict: r.verdict ?? null,
        coverageState: r.coverage_state ?? null,
        lastCrawl: r.last_crawl ? new Date(r.last_crawl).toISOString() : null,
        checkedAt: r.checked_at ? new Date(r.checked_at).toISOString() : null,
        category,
        label,
      };
    });
    reply.header("Cache-Control", "private, max-age=300");
    return reply.send({ source: "haldefiyat", count: items.length, items });
  });
}
