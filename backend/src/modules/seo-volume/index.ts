import type { FastifyInstance } from "fastify";
import { sql } from "drizzle-orm";

import { db } from "@/db/client";
import { getPageImpressions } from "@agro/shared-backend/modules/searchConsole";

// search_volume'u GSC gerçek gösterimlerinden doldurur: her /urun/{slug} sayfasının
// son N gün gösterimi → o ürünün search_volume'u. Sadece gösterimi olan ürünler güncellenir
// (manuel/0 değerlere dokunulmaz — additive).
//
// 301'li varyantin gosterimi MASTER'a yazilir: varyantin sayfasi yok, arama
// sonucundaki tiklama master'a dusuyor, ama gosterim GSC'de eski URL'e
// kaydediliyordu. Cozumleme yapilmadigi icin gorunurluk olu kayitta birikiyordu
// — `kapya-biber` 6.225 gosterimle duruyor, master `biber-kapya` 88 goruinuyordu
// (2026-09-21). Bu deger panel onceliklendirmesini, sehir x urun hacim kapisini
// ve "populer" siralamasini besliyor.
export async function syncSearchVolumeFromGsc(days = 90): Promise<{ updated: number; products: number; merged: number }> {
  const pages = await getPageImpressions(days);

  const canonRes = await db.execute(sql`SELECT slug, canonical_slug FROM hf_products`);
  const canonRows = (Array.isArray(canonRes) ? canonRes[0] : canonRes) as unknown as Array<{ slug: string; canonical_slug: string | null }>;
  const canonicalOf = new Map(canonRows.map((r) => [r.slug, r.canonical_slug || r.slug]));

  const bySlug = new Map<string, number>();
  const mergedSlugs = new Set<string>();
  for (const p of pages) {
    const m = p.page.match(/\/urun\/([^/?#]+)/);
    if (!m?.[1]) continue;
    const slug = decodeURIComponent(m[1]).toLocaleLowerCase("tr");
    const target = canonicalOf.get(slug) ?? slug;
    if (target !== slug) mergedSlugs.add(slug);
    bySlug.set(target, (bySlug.get(target) ?? 0) + p.impressions);
  }

  let updated = 0;
  for (const [slug, impressions] of bySlug) {
    const res = await db.execute(sql`UPDATE hf_products SET search_volume = ${impressions} WHERE slug = ${slug}`);
    const row = (Array.isArray(res) ? res[0] : res) as { affectedRows?: number };
    updated += Number(row?.affectedRows ?? 0);
  }
  // Devredilen varyant kendi degerini tutmaz: ayni gosterim iki kayitta sayilirsa
  // siralama ve kapi esikleri iki kez beslenir.
  for (const slug of mergedSlugs) {
    await db.execute(sql`UPDATE hf_products SET search_volume = 0 WHERE slug = ${slug}`);
  }
  return { updated, products: bySlug.size, merged: mergedSlugs.size };
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
