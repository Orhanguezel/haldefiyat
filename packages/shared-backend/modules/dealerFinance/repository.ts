// src/modules/dealerFinance/repository.ts
import { db } from '../../db/client';
import { eq, sql, and, like, or, asc } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { users } from '../auth/schema';
import {
  dealerProfiles,
  dealerTransactions,
  buildTransactionsWhere,
  getTransactionsOrder,
  type NewDealerProfileRow,
  type NewDealerTransactionRow,
  type TransactionFilterParams,
} from '@agro/shared-backend/modules/dealerFinance';

// ── Dealer Profiles ──────────────────────────────────────────────────────────

type ProfileListParams = {
  page: number;
  limit: number;
  offset: number;
  search?: string;
  is_approved?: number;
};

export type PublicDealerListParams = {
  limit: number;
  offset: number;
  q?: string;
  city?: string;
  region?: string;
};

type PublicDealerFilter = Pick<PublicDealerListParams, 'q' | 'city' | 'region'>;

/** Get dealer profile by user_id */
export async function repoGetDealerProfile(userId: string) {
  const [row] = await db
    .select()
    .from(dealerProfiles)
    .where(eq(dealerProfiles.user_id, userId))
    .limit(1);
  return row ?? null;
}

/** Get dealer profile by profile id */
export async function repoGetDealerProfileById(id: string) {
  const [row] = await db
    .select()
    .from(dealerProfiles)
    .where(eq(dealerProfiles.id, id))
    .limit(1);
  return row ?? null;
}

/** Create a new dealer profile */
export async function repoCreateDealerProfile(values: NewDealerProfileRow) {
  await db.insert(dealerProfiles).values(values);
}

/** Update dealer profile fields */
export async function repoUpdateDealerProfile(
  id: string,
  patch: Partial<Omit<NewDealerProfileRow, 'id' | 'user_id'>>,
) {
  await db.update(dealerProfiles).set(patch).where(eq(dealerProfiles.id, id));
}

/** Paginated list of dealer profiles */
export async function repoListDealerProfiles(params: ProfileListParams) {
  const conditions: SQL[] = [];
  if (params.is_approved !== undefined) {
    conditions.push(eq(dealerProfiles.is_approved, params.is_approved));
  }
  if (params.search) {
    conditions.push(like(dealerProfiles.company_name, `%${params.search}%`));
  }

  const whereExpr = conditions.length ? and(...conditions) : undefined;
  const base = db.select().from(dealerProfiles);
  const query = whereExpr ? base.where(whereExpr) : base;
  return query.limit(params.limit).offset(params.offset);
}

/** Count dealer profiles (for pagination) */
export async function repoCountDealerProfiles(params: ProfileListParams) {
  const conditions: SQL[] = [];
  if (params.is_approved !== undefined) {
    conditions.push(eq(dealerProfiles.is_approved, params.is_approved));
  }
  if (params.search) {
    conditions.push(like(dealerProfiles.company_name, `%${params.search}%`));
  }

  const whereExpr = conditions.length ? and(...conditions) : undefined;
  const base = db.select({ total: sql<number>`COUNT(*)` }).from(dealerProfiles);
  const [row] = await (whereExpr ? base.where(whereExpr) : base);
  return Number(row.total);
}

function buildPublicWhere(params: PublicDealerFilter) {
  const c = [
    eq(dealerProfiles.is_approved, 1),
    eq(dealerProfiles.list_public, 1),
    eq(users.is_active, 1),
  ];
  if (params.q?.trim()) {
    const needle = `%${params.q.trim()}%`;
    c.push(or(like(dealerProfiles.company_name, needle), like(users.full_name, needle))!);
  }
  if (params.city?.trim()) {
    c.push(like(dealerProfiles.city, `%${params.city.trim()}%`));
  }
  if (params.region?.trim()) {
    c.push(like(dealerProfiles.region, `%${params.region.trim()}%`));
  }
  return and(...c);
}

export async function repoListPublicDealers(params: PublicDealerListParams) {
  const whereExpr = buildPublicWhere(params);
  return db
    .select({
      id: dealerProfiles.id,
      company_name: dealerProfiles.company_name,
      city: dealerProfiles.city,
      region: dealerProfiles.region,
      latitude: dealerProfiles.latitude,
      longitude: dealerProfiles.longitude,
      phone: users.phone,
    })
    .from(dealerProfiles)
    .innerJoin(users, eq(users.id, dealerProfiles.user_id))
    .where(whereExpr)
    .orderBy(asc(dealerProfiles.company_name))
    .limit(params.limit)
    .offset(params.offset);
}

export async function repoCountPublicDealers(params: PublicDealerFilter) {
  const whereExpr = buildPublicWhere(params);
  const [row] = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(dealerProfiles)
    .innerJoin(users, eq(users.id, dealerProfiles.user_id))
    .where(whereExpr);
  return Number(row?.total ?? 0);
}

// ── Dealer Transactions ─────────────────────────────────────────────────────

type TxListParams = TransactionFilterParams & {
  page: number;
  limit: number;
  offset: number;
};

/** Paginated list of transactions for a dealer */
export async function repoListTransactions(params: TxListParams) {
  const whereExpr = buildTransactionsWhere(params);
  const orderExpr = getTransactionsOrder('desc');

  return db
    .select()
    .from(dealerTransactions)
    .where(whereExpr)
    .orderBy(orderExpr)
    .limit(params.limit)
    .offset(params.offset);
}

/** Count transactions for a dealer (for pagination) */
export async function repoCountTransactions(params: TransactionFilterParams) {
  const whereExpr = buildTransactionsWhere(params);

  const [row] = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(dealerTransactions)
    .where(whereExpr);
  return Number(row.total);
}

/** Insert a new transaction */
export async function repoCreateTransaction(values: NewDealerTransactionRow) {
  await db.insert(dealerTransactions).values(values);
}

/** Update dealer current_balance */
export async function repoUpdateDealerBalance(profileId: string, newBalance: string) {
  await db
    .update(dealerProfiles)
    .set({ current_balance: newBalance })
    .where(eq(dealerProfiles.id, profileId));
}
