// src/modules/orders/helpers/repository.ts
import { and, asc, desc, eq, gte, lte, type SQL } from 'drizzle-orm';
import { orders, type OrderStatus } from '../schema';

/* ---- List params type ---- */
export type OrderListParams = {
  dealer_id?: string;
  seller_id?: string;
  status?: OrderStatus;
  date_from?: string;
  date_to?: string;
};

/* ---- Where builder ---- */
export function buildOrdersWhere(params: OrderListParams): SQL | undefined {
  const conds: SQL[] = [];

  if (params.dealer_id) {
    conds.push(eq(orders.dealer_id, params.dealer_id));
  }
  if (params.seller_id) {
    conds.push(eq(orders.seller_id, params.seller_id));
  }
  if (params.status) {
    conds.push(eq(orders.status, params.status));
  }
  if (params.date_from) {
    conds.push(gte(orders.created_at, new Date(params.date_from)));
  }
  if (params.date_to) {
    conds.push(lte(orders.created_at, new Date(params.date_to)));
  }

  return conds.length > 0 ? and(...conds) : undefined;
}

/* ---- Order-by builder ---- */
type SortField = 'created_at' | 'total' | 'status';
type SortDirection = 'asc' | 'desc';

const SORT_MAP = {
  created_at: orders.created_at,
  total: orders.total,
  status: orders.status,
} as const;

export function getOrdersOrder(
  sort: SortField = 'created_at',
  direction: SortDirection = 'desc',
) {
  const col = SORT_MAP[sort] ?? SORT_MAP.created_at;
  return direction === 'asc' ? asc(col) : desc(col);
}
