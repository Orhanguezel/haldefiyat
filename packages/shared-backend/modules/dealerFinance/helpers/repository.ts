// src/modules/dealerFinance/helpers/repository.ts
import { and, eq, gte, lte, asc, desc } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { dealerTransactions } from '../schema';
import type { TransactionType } from '../schema';

export type TransactionFilterParams = {
  dealer_id: string;
  type?: TransactionType;
  date_from?: string;
  date_to?: string;
  due_from?: string;
  due_to?: string;
};

export type TransactionSortDirection = 'asc' | 'desc';

/** Build WHERE conditions for transaction queries */
export function buildTransactionsWhere(params: TransactionFilterParams): SQL | undefined {
  const conditions: SQL[] = [eq(dealerTransactions.dealer_id, params.dealer_id)];

  if (params.type) {
    conditions.push(eq(dealerTransactions.type, params.type));
  }
  if (params.date_from) {
    conditions.push(gte(dealerTransactions.created_at, new Date(params.date_from)));
  }
  if (params.date_to) {
    conditions.push(lte(dealerTransactions.created_at, new Date(params.date_to)));
  }
  if (params.due_from) {
    conditions.push(gte(dealerTransactions.due_date, new Date(params.due_from)));
  }
  if (params.due_to) {
    conditions.push(lte(dealerTransactions.due_date, new Date(params.due_to)));
  }

  return and(...conditions);
}

/** Build ORDER BY expression for transactions */
export function getTransactionsOrder(direction: TransactionSortDirection = 'desc') {
  return direction === 'asc'
    ? asc(dealerTransactions.created_at)
    : desc(dealerTransactions.created_at);
}
