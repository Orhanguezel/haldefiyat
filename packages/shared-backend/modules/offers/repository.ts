import { randomUUID } from "crypto";
import type { ResultSetHeader } from "mysql2";

import { and, asc, desc, eq, gte, like, lte, or, sql, type SQL } from "drizzle-orm";

import { db } from '../../db/client';

import { offerNumberCountersTable, offersTable, type NewOfferRow, type OfferRow } from "./schema";
import type { OfferListQuery } from "./validation";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export const packFormData = (v: unknown): string | null => {
  if (v == null) return null;
  if (typeof v === "string") return v;
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

export type OfferListItem = OfferRow & { form_data_parsed?: Record<string, unknown> | null };

export async function listOffers(params: OfferListQuery): Promise<{ items: OfferListItem[]; total: number }> {
  const conds: SQL[] = [];
  if (params.status) conds.push(eq(offersTable.status, params.status));
  if (params.source) conds.push(eq(offersTable.source, params.source));
  if (params.locale) conds.push(eq(offersTable.locale, params.locale));
  if (params.country_code) conds.push(like(offersTable.country_code, `%${params.country_code}%`));
  if (params.email) conds.push(eq(offersTable.email, params.email));
  if (params.product_id) conds.push(eq(offersTable.product_id, params.product_id));
  if (params.q?.trim()) {
    const s = `%${params.q.trim()}%`;
    conds.push(
      or(
        like(offersTable.customer_name, s),
        like(offersTable.company_name, s),
        like(offersTable.email, s),
        like(offersTable.subject, s),
        like(offersTable.offer_no, s),
        like(offersTable.country_code, s),
      ) as SQL,
    );
  }
  if (params.created_from) {
    conds.push(gte(offersTable.created_at, sql`CAST(${params.created_from} AS DATETIME(3))`));
  }
  if (params.created_to) {
    conds.push(lte(offersTable.created_at, sql`CAST(${params.created_to} AS DATETIME(3))`));
  }

  const whereCond = conds.length ? and(...conds) : undefined;
  const take = params.limit && params.limit > 0 ? params.limit : 100;
  const skip = params.offset && params.offset >= 0 ? params.offset : 0;
  const orderExpr =
    (params.sort || "created_at") === "updated_at"
      ? params.orderDir === "asc"
        ? asc(offersTable.updated_at)
        : desc(offersTable.updated_at)
      : params.orderDir === "asc"
        ? asc(offersTable.created_at)
        : desc(offersTable.created_at);

  const baseQuery = db.select().from(offersTable);
  const rowsQuery = whereCond ? baseQuery.where(whereCond) : baseQuery;
  const rows = await rowsQuery.orderBy(orderExpr, desc(offersTable.id)).limit(take).offset(skip);

  const countBase = db.select({ c: sql<number>`COUNT(*)` }).from(offersTable);
  const countQuery = whereCond ? countBase.where(whereCond) : countBase;
  const cnt = await countQuery;

  return {
    items: rows.map((row) => ({ ...row, form_data_parsed: unpackFormData(row.form_data ?? null) })),
    total: cnt[0]?.c ?? 0,
  };
}

export async function getOfferById(id: string): Promise<OfferListItem | null> {
  const rows = await db.select().from(offersTable).where(eq(offersTable.id, id)).limit(1);
  const row = rows[0];
  if (!row) return null;
  return { ...row, form_data_parsed: unpackFormData(row.form_data ?? null) };
}

export async function generateOfferNo(now: Date = new Date()): Promise<string> {
  const year = now.getFullYear();
  const prefix = "VS";

  const nextSeq = await db.transaction(async (trx) => {
    const existing = await trx
      .select()
      .from(offerNumberCountersTable)
      .where(eq(offerNumberCountersTable.year, year))
      .limit(1);

    if (!existing.length) {
      await trx.insert(offerNumberCountersTable).values({ year, last_seq: 1, prefix });
      return 1;
    }

    const next = (existing[0]?.last_seq ?? 0) + 1;
    await trx
      .update(offerNumberCountersTable)
      .set({ last_seq: next })
      .where(eq(offerNumberCountersTable.year, year));
    return next;
  });

  return `${prefix}-${year}-${String(nextSeq).padStart(4, "0")}`;
}

export async function createOffer(
  values: Omit<NewOfferRow, "id" | "created_at" | "updated_at"> & { id?: string },
): Promise<string> {
  const id = values.id ?? randomUUID();
  const offer_no = values.offer_no ?? (await generateOfferNo());

  await db.insert(offersTable).values({
    ...values,
    id,
    offer_no,
    source: values.source ?? "vistaseed",
    created_at: new Date() as never,
    updated_at: new Date() as never,
  });

  return id;
}

export async function updateOffer(id: string, patch: Partial<NewOfferRow>) {
  if (!Object.keys(patch).length) return;
  await db
    .update(offersTable)
    .set({ ...patch, updated_at: new Date() as never })
    .where(eq(offersTable.id, id));
}

export async function deleteOffer(id: string): Promise<number> {
  const [header] = await db.delete(offersTable).where(eq(offersTable.id, id));
  return (header as ResultSetHeader).affectedRows ?? 0;
}
