// src/modules/dealerFinance/repository-aggregates.ts
import { db } from '../../db/client';
import { eq, sql, sum, and, isNotNull, lt } from 'drizzle-orm';
import { dealerTransactions, TRANSACTION_TYPES, type TransactionType } from '@agro/shared-backend/modules/dealerFinance';

const ZERO_BY_TYPE = (): Record<TransactionType, number> => {
  const o = {} as Record<TransactionType, number>;
  for (const t of TRANSACTION_TYPES) o[t] = 0;
  return o;
};

/** SUM(amount) grouped by type for one dealer profile */
export async function repoSumAmountsByType(dealerProfileId: string) {
  const rows = await db
    .select({
      type: dealerTransactions.type,
      total: sum(dealerTransactions.amount),
    })
    .from(dealerTransactions)
    .where(eq(dealerTransactions.dealer_id, dealerProfileId))
    .groupBy(dealerTransactions.type);

  const out = ZERO_BY_TYPE();
  for (const r of rows) {
    const t = r.type as TransactionType;
    out[t] = parseFloat(String(r.total ?? 0));
  }
  return out;
}

export async function repoCountAllTransactions(dealerProfileId: string) {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(dealerTransactions)
    .where(eq(dealerTransactions.dealer_id, dealerProfileId));
  return Number(row?.n ?? 0);
}

/** Rows with due_date set and due_date < now */
export async function repoCountOverdueTransactions(dealerProfileId: string) {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(dealerTransactions)
    .where(
      and(
        eq(dealerTransactions.dealer_id, dealerProfileId),
        isNotNull(dealerTransactions.due_date),
        lt(dealerTransactions.due_date, new Date()),
      ),
    );
  return Number(row?.n ?? 0);
}
