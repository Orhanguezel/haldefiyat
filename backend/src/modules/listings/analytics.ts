import type { FastifyReply, FastifyRequest } from "fastify";
import type { RowDataPacket } from "mysql2";

import { pool } from "@/db/client";
import { handleRouteError } from "@agro/shared-backend/modules/_shared";

function parseDays(value: unknown): number {
  const n = Number(value ?? 30);
  if (!Number.isFinite(n)) return 30;
  return Math.min(90, Math.max(1, Math.trunc(n)));
}

function decodeParam(raw: string): string {
  try {
    return decodeURIComponent(raw.replace(/\+/g, " ")).trim();
  } catch {
    return raw.trim();
  }
}

// /ilanlar?type=..&product=..&city=..&district=.. url'lerinden dolu filtreleri sayar.
function tallySearches(urls: Array<{ url: string }>) {
  const product = new Map<string, number>();
  const city = new Map<string, number>();
  for (const { url } of urls) {
    const qs = url.split("?")[1];
    if (!qs) continue;
    const params = new URLSearchParams(qs);
    const p = decodeParam(params.get("product") ?? "");
    const c = decodeParam(params.get("city") ?? "");
    if (p) product.set(p, (product.get(p) ?? 0) + 1);
    if (c) city.set(c, (city.get(c) ?? 0) + 1);
  }
  const top = (m: Map<string, number>) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([term, hits]) => ({ term, hits }));
  return { products: top(product), cities: top(city) };
}

export async function getListingAnalytics(req: FastifyRequest, reply: FastifyReply) {
  try {
    const days = parseDays((req.query as { days?: string | number })?.days);

    const [dailyRows] = await pool.query<RowDataPacket[]>(
      `SELECT DATE(created_at) AS date,
         SUM(path = '/ilanlar') AS listViews,
         SUM(path LIKE '/ilan/%') AS detailViews,
         SUM(path = '/ilan-ver') AS ilanVerViews
       FROM audit_request_logs
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
         AND (path = '/ilanlar' OR path LIKE '/ilan/%' OR path = '/ilan-ver')
         AND COALESCE(is_bot, 0) = 0 AND COALESCE(is_internal, 0) = 0
       GROUP BY date ORDER BY date DESC`,
      [days - 1],
    );

    const [inqRows] = await pool.query<RowDataPacket[]>(
      `SELECT DATE(created_at) AS date, COUNT(*) AS inquiries FROM hf_listing_inquiries
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) GROUP BY date`,
      [days - 1],
    );
    const inqByDate = new Map(inqRows.map((r) => [String(r.date), Number(r.inquiries ?? 0)]));

    const daily = dailyRows.map((r) => {
      const date = r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date).slice(0, 10);
      return {
        date,
        listViews: Number(r.listViews ?? 0),
        detailViews: Number(r.detailViews ?? 0),
        ilanVerViews: Number(r.ilanVerViews ?? 0),
        inquiries: inqByDate.get(String(r.date)) ?? 0,
      };
    });

    const summary = daily.reduce(
      (acc, d) => ({
        listViews: acc.listViews + d.listViews,
        detailViews: acc.detailViews + d.detailViews,
        ilanVerViews: acc.ilanVerViews + d.ilanVerViews,
        inquiries: acc.inquiries + d.inquiries,
      }),
      { listViews: 0, detailViews: 0, ilanVerViews: 0, inquiries: 0 },
    );

    const [perListing] = await pool.query<RowDataPacket[]>(
      `SELECT l.id, l.title, l.slug, l.status, l.view_count AS viewCount,
         (SELECT COUNT(*) FROM hf_listing_inquiries q WHERE q.listing_id = l.id) AS inquiries
       FROM hf_listings l ORDER BY l.view_count DESC, l.created_at DESC LIMIT 50`,
    );

    const [searchRows] = await pool.query<RowDataPacket[]>(
      `SELECT url FROM audit_request_logs
       WHERE path = '/ilanlar' AND url LIKE '%?%'
         AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) AND COALESCE(is_bot, 0) = 0
       LIMIT 5000`,
      [days - 1],
    );
    const searches = tallySearches(searchRows as Array<{ url: string }>);

    return reply.send({
      days,
      summary,
      daily,
      searches,
      perListing: perListing.map((r) => ({
        id: Number(r.id),
        title: String(r.title ?? ""),
        slug: String(r.slug ?? ""),
        status: String(r.status ?? ""),
        viewCount: Number(r.viewCount ?? 0),
        inquiries: Number(r.inquiries ?? 0),
      })),
    });
  } catch (err) {
    return handleRouteError(reply, req, err, "listing_analytics");
  }
}
