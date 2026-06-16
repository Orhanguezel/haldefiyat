import type { FastifyInstance } from "fastify";
import { sql } from "drizzle-orm";

import { db } from "@/db/client";
import { getPageImpressions } from "@agro/shared-backend/modules/searchConsole";

// search_volume'u GSC gerçek gösterimlerinden doldurur: her /urun/{slug} sayfasının
// son N gün gösterimi → o ürünün search_volume'u. Sadece gösterimi olan ürünler güncellenir
// (manuel/0 değerlere dokunulmaz — additive).
export async function syncSearchVolumeFromGsc(days = 90): Promise<{ updated: number; products: number }> {
  const pages = await getPageImpressions(days);
  const bySlug = new Map<string, number>();
  for (const p of pages) {
    const m = p.page.match(/\/urun\/([^/?#]+)/);
    if (!m?.[1]) continue;
    const slug = decodeURIComponent(m[1]).toLocaleLowerCase("tr");
    bySlug.set(slug, (bySlug.get(slug) ?? 0) + p.impressions);
  }

  let updated = 0;
  for (const [slug, impressions] of bySlug) {
    const res = await db.execute(sql`UPDATE hf_products SET search_volume = ${impressions} WHERE slug = ${slug}`);
    const row = (Array.isArray(res) ? res[0] : res) as { affectedRows?: number };
    updated += Number(row?.affectedRows ?? 0);
  }
  return { updated, products: bySlug.size };
}

export async function registerSeoVolumeAdmin(app: FastifyInstance) {
  app.post("/seo/search-volume/sync", async (req, reply) => {
    try {
      const result = await syncSearchVolumeFromGsc(90);
      return reply.send({ ok: true, ...result });
    } catch (err) {
      req.log.error({ err }, "search_volume_sync_failed");
      return reply.status(500).send({ error: "GSC gösterim senkronu başarısız" });
    }
  });
}
