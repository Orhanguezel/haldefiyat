// =============================================================
// FILE: src/modules/offer/repository.ts
// Bereket Fide – Offer Module Repository
// =============================================================

import { db } from '../../db/client';
import { and, asc, desc, eq, like, or, sql, type SQL, gte, lte } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import {
  offersTable,
  offerNumberCountersTable,
  type OfferRow,
  type NewOfferRow,
  type OfferStatus,
} from '@agro/shared-backend/modules/offer';

export type OfferListParams = {
  orderParam?: string;
  sort?: 'created_at' | 'updated_at';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;

  status?: OfferStatus;
  source?: string;
  locale?: string;

  // ✅ artık serbest metin ülke alanı (Almanya/Deutschland/Germany/DE)
  // filtrelemede LIKE ile kullanılacak
  country_code?: string;

  q?: string;
  email?: string;
  product_id?: string;
  service_id?: string;

  created_from?: string;
  created_to?: string;
};

const parseOrder = (
  orderParam?: string,
  sort?: OfferListParams['sort'],
  ord?: OfferListParams['order'],
): { col: 'created_at' | 'updated_at'; dir: 'asc' | 'desc' } | null => {
  if (orderParam) {
    const m = orderParam.match(/^([a-zA-Z0-9_]+)\.(asc|desc)$/);
    const col = m?.[1] as 'created_at' | 'updated_at' | undefined;
    const dir = m?.[2] as 'asc' | 'desc' | undefined;
    if (col && dir && (col === 'created_at' || col === 'updated_at')) {
      return { col, dir };
    }
  }
  if (sort && ord) return { col: sort, dir: ord };
  return null;
};

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/* -------------------------------------------------------------
 * JSON pack/unpack helpers (form_data)
 * ------------------------------------------------------------- */

export const packFormData = (v: unknown): string | null => {
  if (v == null) return null;
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v);
      if (isRecord(parsed)) {
        return JSON.stringify(parsed);
      }
      return JSON.stringify(parsed);
    } catch {
      return JSON.stringify({ raw: v });
    }
  }
  try {
    return JSON.stringify(v);
  } catch {
    return null;
  }
};

export const unpackFormData = (v: string | null | undefined): Record<string, unknown> | null => {
  if (!v) return null;
  try {
    const parsed = JSON.parse(v);
    return isRecord(parsed) ? parsed : { raw: parsed };
  } catch {
    return { raw: v };
  }
};

/* -------------------------------------------------------------
 * LIST
 * ------------------------------------------------------------- */

export type OfferListItem = OfferRow & {
  form_data_parsed?: Record<string, unknown> | null;
};

export async function listOffers(
  params: OfferListParams,
): Promise<{ items: OfferListItem[]; total: number }> {
  const conds: (SQL | undefined)[] = [];

  if (params.status) conds.push(eq(offersTable.status, params.status));
  if (params.source) conds.push(eq(offersTable.source, params.source));
  if (params.locale) conds.push(eq(offersTable.locale, params.locale));

  // ✅ country_code: serbest metin -> exact yerine LIKE (kısmi arama)
  if (params.country_code && params.country_code.trim()) {
    const c = `%${params.country_code.trim()}%`;
    conds.push(like(offersTable.country_code, c));
  }

  if (params.email) conds.push(eq(offersTable.email, params.email));
  if (params.product_id) conds.push(eq(offersTable.product_id, params.product_id));
  if (params.service_id) conds.push(eq(offersTable.service_id, params.service_id));

  if (params.q && params.q.trim()) {
    const s = `%${params.q.trim()}%`;
    conds.push(
      or(
        like(offersTable.customer_name, s),
        like(offersTable.company_name, s),
        like(offersTable.email, s),
        like(offersTable.subject, s),
        like(offersTable.offer_no, s),

        // ✅ pratik: genel aramaya ülke alanını da dahil et
        like(offersTable.country_code, s),
      ),
    );
  }

  if (params.created_from) {
    conds.push(gte(offersTable.created_at, sql`CAST(${params.created_from} AS DATETIME(3))`));
  }
  if (params.created_to) {
    conds.push(lte(offersTable.created_at, sql`CAST(${params.created_to} AS DATETIME(3))`));
  }

  const ord = parseOrder(params.orderParam, params.sort, params.order);

  let orderExpr: SQL;
  if (ord) {
    orderExpr =
      ord.dir === 'asc'
        ? asc(ord.col === 'created_at' ? offersTable.created_at : offersTable.updated_at)
        : desc(ord.col === 'created_at' ? offersTable.created_at : offersTable.updated_at);
  } else {
    orderExpr = desc(offersTable.created_at);
  }

  const take = params.limit && params.limit > 0 ? params.limit : 50;
  const skip = params.offset && params.offset >= 0 ? params.offset : 0;

  const whereCond =
    conds.length > 0 ? (and(...(conds.filter(Boolean) as SQL[])) as SQL) : undefined;

  const baseQuery = db.select().from(offersTable);
  const rowsQuery = whereCond ? baseQuery.where(whereCond as SQL) : baseQuery;

  const rows = await rowsQuery.orderBy(orderExpr, desc(offersTable.id)).limit(take).offset(skip);

  const countBase = db.select({ c: sql<number>`COUNT(*)` }).from(offersTable);
  const countQuery = whereCond ? countBase.where(whereCond as SQL) : countBase;

  const cnt = await countQuery;
  const total = cnt[0]?.c ?? 0;

  const items: OfferListItem[] = rows.map((r) => ({
    ...r,
    form_data_parsed: unpackFormData(r.form_data ?? null),
  }));

  return { items, total };
}

/* -------------------------------------------------------------
 * GET BY ID
 * ------------------------------------------------------------- */

export async function getOfferById(id: string): Promise<OfferListItem | null> {
  const rows = await db.select().from(offersTable).where(eq(offersTable.id, id)).limit(1);

  const row = rows[0] as OfferRow | undefined;
  if (!row) return null;

  return {
    ...row,
    form_data_parsed: unpackFormData(row.form_data ?? null),
  };
}

/* -------------------------------------------------------------
 * Teklif numarası üretimi: ENS-YYYY-0001
 *   - year bazlı sayaç tablosu: offer_number_counters
 * ------------------------------------------------------------- */

export async function generateOfferNo(now: Date = new Date()): Promise<string> {
  const year = now.getFullYear();
  const prefix = 'BF';

  const nextSeq = await db.transaction(async (trx) => {
    const existing = await trx
      .select()
      .from(offerNumberCountersTable)
      .where(eq(offerNumberCountersTable.year, year))
      .limit(1);

    if (!existing.length) {
      await trx.insert(offerNumberCountersTable).values({
        year,
        last_seq: 1,
        prefix,
      });
      return 1;
    }

    const current = existing[0];
    const next = (current.last_seq ?? 0) + 1;

    await trx
      .update(offerNumberCountersTable)
      .set({ last_seq: next })
      .where(eq(offerNumberCountersTable.year, year));

    return next;
  });

  const seqStr = String(nextSeq).padStart(4, '0');
  return `${prefix}-${year}-${seqStr}`;
}

/* -------------------------------------------------------------
 * CREATE / UPDATE / DELETE
 * ------------------------------------------------------------- */

export async function createOffer(
  values: Omit<NewOfferRow, 'id' | 'created_at' | 'updated_at'> & {
    id?: string;
  },
): Promise<string> {
  const id = values.id ?? randomUUID();

  const offer_no = values.offer_no ?? (await generateOfferNo());

  // ✅ country_code serbest metin olduğu için trim ile normalize ediyoruz
  const normalizedCountry =
    typeof values.country_code === 'string' && values.country_code.trim()
      ? values.country_code.trim()
      : null;

  const insertVals: NewOfferRow = {
    id,
    offer_no,
    status: values.status ?? ('new' as any),
    source: values.source ?? 'bereketfide',
    locale: values.locale ?? null,
    country_code: normalizedCountry,

    customer_name: values.customer_name,
    company_name: typeof values.company_name === 'undefined' ? null : values.company_name,
    email: values.email,
    phone: typeof values.phone === 'undefined' ? null : values.phone,
    subject: typeof values.subject === 'undefined' ? null : values.subject,
    message: typeof values.message === 'undefined' ? null : values.message,
    product_id: typeof values.product_id === 'undefined' ? null : values.product_id,
    service_id: typeof values.service_id === 'undefined' ? null : values.service_id,

    form_data: typeof values.form_data === 'undefined' ? null : values.form_data,

    consent_marketing:
      typeof values.consent_marketing === 'undefined' ? (0 as any) : values.consent_marketing,
    consent_terms: typeof values.consent_terms === 'undefined' ? (0 as any) : values.consent_terms,

    currency: values.currency ?? 'EUR',
    net_total: typeof values.net_total === 'undefined' ? null : values.net_total,

    vat_rate: typeof values.vat_rate === 'undefined' ? null : values.vat_rate,

    vat_total: typeof values.vat_total === 'undefined' ? null : values.vat_total,

    shipping_total: typeof values.shipping_total === 'undefined' ? null : values.shipping_total,

    gross_total: typeof values.gross_total === 'undefined' ? null : values.gross_total,

    valid_until: typeof values.valid_until === 'undefined' ? null : values.valid_until,

    admin_notes: typeof values.admin_notes === 'undefined' ? null : values.admin_notes,

    pdf_url: typeof values.pdf_url === 'undefined' ? null : values.pdf_url,
    pdf_asset_id: typeof values.pdf_asset_id === 'undefined' ? null : values.pdf_asset_id,

    email_sent_at: typeof values.email_sent_at === 'undefined' ? null : values.email_sent_at,

    created_at: new Date() as any,
    updated_at: new Date() as any,
  };

  await db.insert(offersTable).values(insertVals);
  return id;
}

export async function updateOffer(id: string, patch: Partial<NewOfferRow>) {
  if (!Object.keys(patch).length) return;

  // ✅ patch içinde country_code varsa trimle
  if (typeof (patch as any).country_code === 'string') {
    const s = String((patch as any).country_code).trim();
    (patch as any).country_code = s ? s : null;
  }

  await db
    .update(offersTable)
    .set({ ...patch, updated_at: new Date() as any })
    .where(eq(offersTable.id, id));
}

export async function deleteOffer(id: string): Promise<number> {
  const res = await db.delete(offersTable).where(eq(offersTable.id, id)).execute();

  const affected = typeof (res as any)?.affectedRows === 'number' ? (res as any).affectedRows : 0;

  return affected;
}
