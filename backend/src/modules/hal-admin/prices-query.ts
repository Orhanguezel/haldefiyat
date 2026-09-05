import { pool } from "@/db/client";
import type { RowDataPacket } from "mysql2/promise";

export type AdminPriceFilters = {
  q?: string;
  city?: string;
  market?: string;
  category?: string;
  unit?: string;
  source?: string;
  issue?: "unit_mismatch" | "inactive_product" | "inactive_market" | "quarantined" | "any";
  days?: number;
  latestOnly?: boolean;
  sort?: "date_desc" | "date_asc" | "price_desc" | "price_asc" | "product";
  page?: number;
  limit?: number;
};

const SORTS: Record<string, string> = {
  date_desc: "ph.recorded_date DESC, p.name_tr ASC",
  date_asc: "ph.recorded_date ASC, p.name_tr ASC",
  price_desc: "ph.avg_price DESC",
  price_asc: "ph.avg_price ASC",
  product: "p.name_tr ASC, m.name ASC",
};

const COLUMNS = `
  ph.id, ph.product_id AS productId, ph.market_id AS marketId,
  ph.min_price AS minPrice, ph.avg_price AS avgPrice, ph.max_price AS maxPrice,
  ph.avg_price_method AS avgPriceMethod, ph.currency, ph.unit,
  ph.recorded_date AS recordedDate, ph.source_api AS sourceApi, ph.created_at AS createdAt,
  p.slug AS productSlug, COALESCE(NULLIF(p.display_name, ''), p.name_tr) AS productName,
  p.name_tr AS productNameTr, p.category_slug AS categorySlug, p.unit AS productUnit,
  p.canonical_slug AS canonicalSlug, p.is_active AS productActive, p.image_url AS productImage,
  m.slug AS marketSlug, m.name AS marketName, m.city_name AS cityName,
  m.market_type AS marketType, m.is_active AS marketActive,
  q.id AS quarantineId, q.reason_code AS quarantineReason, q.severity AS quarantineSeverity`;

const JOINS = `
  JOIN hf_products p ON p.id = ph.product_id
  JOIN hf_markets m ON m.id = ph.market_id
  LEFT JOIN hf_price_quarantine q
    ON q.product_id = ph.product_id AND q.market_id = ph.market_id
   AND q.recorded_date = ph.recorded_date AND q.status = 'pending'`;

/**
 * Yonetim listesi public sorgudan ayridir. Iki fark bilinclidir:
 *
 * 1) "Her cift icin son kayit" CTE'sinde hicbir join yok — boylece
 *    (product_id, market_id, recorded_date) essiz indeksi uzerinde loose index
 *    scan calisir. Join'li public surum 1M satiri tarayip ~32 sn suruyordu.
 * 2) Yonetim ham veriyi gorur: pasif urun, birim uyusmazligi ve karantina
 *    satirlari gizlenmez, isaretlenir.
 */
function buildSql(filters: AdminPriceFilters) {
  const latestOnly = filters.latestOnly !== false;
  const days = Math.max(1, Math.min(9000, filters.days ?? 90));
  const where: string[] = [];
  const args: unknown[] = [];

  if (filters.q?.trim()) {
    const term = `%${filters.q.trim().replace(/[%_\\]/g, (char) => `\\${char}`)}%`;
    where.push("(p.name_tr LIKE ? OR p.slug LIKE ? OR p.display_name LIKE ?)");
    args.push(term, term, term);
  }
  if (filters.city?.trim()) { where.push("m.city_name = ?"); args.push(filters.city.trim()); }
  if (filters.market?.trim()) { where.push("m.slug = ?"); args.push(filters.market.trim()); }
  if (filters.category?.trim()) { where.push("p.category_slug = ?"); args.push(filters.category.trim()); }
  if (filters.unit?.trim()) { where.push("ph.unit = ?"); args.push(filters.unit.trim()); }
  if (filters.source?.trim()) { where.push("ph.source_api = ?"); args.push(filters.source.trim()); }
  if (filters.issue === "unit_mismatch") where.push("ph.unit <> p.unit");
  if (filters.issue === "inactive_product") where.push("p.is_active = 0");
  if (filters.issue === "inactive_market") where.push("m.is_active = 0");
  if (filters.issue === "quarantined") where.push("q.id IS NOT NULL");
  if (filters.issue === "any") {
    where.push("(ph.unit <> p.unit OR p.is_active = 0 OR m.is_active = 0 OR q.id IS NOT NULL)");
  }
  if (!latestOnly) where.push(`ph.recorded_date >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)`);

  const cte = latestOnly
    ? `WITH latest AS (
         SELECT product_id, market_id, MAX(recorded_date) rd
         FROM hf_price_history
         WHERE recorded_date >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)
         GROUP BY product_id, market_id
       ) `
    : "";
  const from = latestOnly
    ? `FROM latest l
       JOIN hf_price_history ph
         ON ph.product_id = l.product_id AND ph.market_id = l.market_id AND ph.recorded_date = l.rd`
    : "FROM hf_price_history ph";

  return {
    cte,
    from: `${from} ${JOINS}`,
    where: where.length ? `WHERE ${where.join(" AND ")}` : "",
    args,
  };
}

export async function listAdminPrices(filters: AdminPriceFilters) {
  const limit = Math.min(250, Math.max(1, filters.limit ?? 50));
  const page = Math.max(1, filters.page ?? 1);
  const offset = (page - 1) * limit;
  const { cte, from, where, args } = buildSql(filters);
  const order = SORTS[filters.sort ?? "date_desc"] ?? SORTS.date_desc;

  const [rows, counted] = await Promise.all([
    pool.query<RowDataPacket[]>(
      `${cte}SELECT ${COLUMNS} ${from} ${where} ORDER BY ${order} LIMIT ${limit} OFFSET ${offset}`,
      args,
    ),
    pool.query<RowDataPacket[]>(`${cte}SELECT COUNT(*) AS total ${from} ${where}`, args),
  ]);

  const total = Number(counted[0][0]?.total ?? 0);
  return {
    items: rows[0].map(mapRow),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

function isoDay(value: unknown) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? "").slice(0, 10);
}

type AdminPriceItem = Record<string, unknown> & {
  productId: number; marketId: number; recordedDate: string;
  productActive: boolean; marketActive: boolean; unitMismatch: boolean; quarantined: boolean;
};

function mapRow(row: RowDataPacket): AdminPriceItem {
  return {
    ...(row as Record<string, unknown>),
    productId: Number(row.productId),
    marketId: Number(row.marketId),
    recordedDate: isoDay(row.recordedDate),
    productActive: Number(row.productActive) === 1,
    marketActive: Number(row.marketActive) === 1,
    unitMismatch: String(row.unit) !== String(row.productUnit),
    quarantined: row.quarantineId != null,
  };
}

/** Sag panel icin: kaydin kendisi + ayni ciftin gecmisi + ayni gun diger haller + karantina kayitlari. */
export async function getAdminPriceDetail(id: number) {
  const [base] = await pool.query<RowDataPacket[]>(
    `SELECT ${COLUMNS} FROM hf_price_history ph ${JOINS} WHERE ph.id = ? LIMIT 1`,
    [id],
  );
  const row = base[0];
  if (!row) return null;
  const item = mapRow(row);

  const [history, peers, quarantine, stats] = await Promise.all([
    pool.query<RowDataPacket[]>(
      `SELECT ph.id, ph.recorded_date AS recordedDate, ph.min_price AS minPrice,
              ph.avg_price AS avgPrice, ph.max_price AS maxPrice, ph.unit,
              ph.source_api AS sourceApi, ph.avg_price_method AS avgPriceMethod
       FROM hf_price_history ph
       WHERE ph.product_id = ? AND ph.market_id = ?
       ORDER BY ph.recorded_date DESC LIMIT 60`,
      [item.productId, item.marketId],
    ),
    pool.query<RowDataPacket[]>(
      `SELECT ph.id, ph.avg_price AS avgPrice, ph.min_price AS minPrice, ph.max_price AS maxPrice,
              ph.unit, ph.source_api AS sourceApi, ph.recorded_date AS recordedDate,
              m.name AS marketName, m.city_name AS cityName, m.slug AS marketSlug
       FROM hf_price_history ph
       JOIN hf_markets m ON m.id = ph.market_id
       WHERE ph.product_id = ? AND ph.recorded_date = ? AND ph.market_id <> ?
       ORDER BY ph.avg_price ASC LIMIT 40`,
      [item.productId, item.recordedDate, item.marketId],
    ),
    pool.query<RowDataPacket[]>(
      `SELECT id, recorded_date AS recordedDate, reason_code AS reasonCode, severity, status,
              avg_price AS avgPrice, peer_median AS peerMedian, deviation_ratio AS deviationRatio,
              review_note AS reviewNote, reviewed_at AS reviewedAt, created_at AS createdAt
       FROM hf_price_quarantine
       WHERE product_id = ? AND market_id = ?
       ORDER BY recorded_date DESC LIMIT 20`,
      [item.productId, item.marketId],
    ),
    pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS rows30, MIN(avg_price) AS min30, MAX(avg_price) AS max30, AVG(avg_price) AS avg30
       FROM hf_price_history
       WHERE product_id = ? AND market_id = ? AND recorded_date >= DATE_SUB(?, INTERVAL 30 DAY)`,
      [item.productId, item.marketId, item.recordedDate],
    ),
  ]);

  return {
    item,
    history: history[0].map((entry) => ({ ...entry, recordedDate: isoDay(entry.recordedDate) })),
    peers: peers[0].map((entry) => ({ ...entry, recordedDate: isoDay(entry.recordedDate) })),
    quarantine: quarantine[0].map((entry) => ({ ...entry, recordedDate: isoDay(entry.recordedDate) })),
    stats: stats[0][0] ?? null,
  };
}

/** Filtre acilir listesi icin kaynak listesi (74 farkli source_api var). */
export async function listPriceSources() {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT source_api AS source, COUNT(*) AS count, MAX(recorded_date) AS lastDate
     FROM hf_price_history
     WHERE recorded_date >= DATE_SUB(CURDATE(), INTERVAL 400 DAY)
     GROUP BY source_api ORDER BY count DESC`,
  );
  return rows.map((row) => ({ ...row, lastDate: isoDay(row.lastDate) }));
}
