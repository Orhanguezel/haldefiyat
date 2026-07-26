import type { FastifyInstance } from "fastify";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/db/client";

// "Soğan imzası" — önemli bir temel gıda haftalar boyunca kesintisiz tırmandığında,
// mainstream haber olmadan ~2 hafta önce yakalanır. Soğan W28'de (6-12 Tem) bu sinyali
// veriyordu, viral haber W30'da patladı. Bu tespit onu erken yakalar.
//
// Filtre: seo_index'li (önemli/curated) urun, ≥MIN_HALS geniş kapsam (veri hatasi degil),
// son 3 hafta bucket'i kesintisiz yukselen (donguel siçramalar elenir), toplam ≥MIN_PCT.

export interface PriceSurge {
  productSlug: string;
  name: string;
  buckets: [number, number, number, number]; // [3 hafta once ... simdi]
  pctChange: number;   // simdi / 3-hafta-once - 1 (yuzde)
  hals: number;        // en guncel hafta hal sayisi
  latestAvg: number;
  severity: number;    // pct * ln(hal) — buyukluk x guvenilirlik
}

export interface EarlyWarningOptions {
  minHals?: number;    // guvenilir kapsam esigi (varsayilan 8)
  minPct?: number;     // toplam yukselis esigi % (varsayilan 20)
  weekStepPct?: number; // her hafta minimum artis (varsayilan 3)
}

export async function detectPriceSurges(opts: EarlyWarningOptions = {}): Promise<PriceSurge[]> {
  const minHals = opts.minHals ?? 8;
  const minPct = opts.minPct ?? 20;
  const step = 1 + (opts.weekStepPct ?? 3) / 100;

  const [rows] = await pool.query<RowDataPacket[]>(
    `WITH latest AS (SELECT MAX(recorded_date) d FROM hf_price_history),
     b AS (
       SELECT ph.product_id,
              FLOOR(DATEDIFF((SELECT d FROM latest), ph.recorded_date) / 7) bk,
              AVG(ph.avg_price) a,
              COUNT(DISTINCT ph.market_id) hal
       FROM hf_price_history ph
       WHERE ph.unit = 'kg' AND ph.avg_price > 0
         AND ph.recorded_date > (SELECT d FROM latest) - INTERVAL 28 DAY
         -- Karantinali (market x tarih) araliklari disla (donmus/bozuk veri yaniltmasin)
         AND NOT EXISTS (
           SELECT 1 FROM hf_market_blackouts bl
           WHERE bl.market_id = ph.market_id
             AND ph.recorded_date BETWEEN bl.from_date AND bl.to_date
         )
       GROUP BY ph.product_id, bk
     )
     SELECT p.slug, p.name_tr AS name,
            MAX(CASE WHEN bk=3 THEN a END) b3,
            MAX(CASE WHEN bk=2 THEN a END) b2,
            MAX(CASE WHEN bk=1 THEN a END) b1,
            MAX(CASE WHEN bk=0 THEN a END) b0,
            MAX(CASE WHEN bk=0 THEN hal END) hal
     FROM b JOIN hf_products p ON p.id = b.product_id
     WHERE p.seo_index = 1
     GROUP BY p.id
     HAVING b3 IS NOT NULL AND b0 IS NOT NULL
       AND b2 > b3
       AND b1 > b2 * ?
       AND b0 > b1 * ?
       AND hal >= ?
       AND (b0 / b3 - 1) * 100 >= ?
     ORDER BY (b0 / b3 - 1) DESC
     LIMIT 25`,
    [step, step, minHals, minPct],
  );

  return rows.map((r) => {
    const b0 = Number(r.b0), b1 = Number(r.b1), b2 = Number(r.b2), b3 = Number(r.b3);
    const pct = Math.round((b0 / b3 - 1) * 100);
    const hal = Number(r.hal);
    return {
      productSlug: String(r.slug),
      name: String(r.name),
      buckets: [round1(b3), round1(b2), round1(b1), round1(b0)] as [number, number, number, number],
      pctChange: pct,
      hals: hal,
      latestAvg: round1(b0),
      severity: Math.round(pct * Math.log(Math.max(2, hal))),
    };
  });
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export async function registerEarlyWarningAdmin(app: FastifyInstance) {
  app.get("/early-warning", async (req, reply) => {
    const q = req.query as { min_hals?: string; min_pct?: string };
    const surges = await detectPriceSurges({
      minHals: q.min_hals ? Number(q.min_hals) : undefined,
      minPct: q.min_pct ? Number(q.min_pct) : undefined,
    });
    return reply.send({ items: surges, generatedAt: new Date().toISOString() });
  });
}
