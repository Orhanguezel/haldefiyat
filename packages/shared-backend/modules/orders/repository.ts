// src/modules/orders/repository.ts
import { and, eq, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { db } from '../../db/client';
import {
  orders,
  orderItems,
  type OrderStatus,
  type NewOrderRow,
  type NewOrderItemRow,
} from '@agro/shared-backend/modules/orders';
import { users } from '../auth/schema';
import { products, productI18n } from '../products/schema';
import { buildOrdersWhere, getOrdersOrder, type OrderListParams } from '@agro/shared-backend/modules/orders';

const orderSeller = alias(users, 'order_seller');

/* ---- List (paginated) ---- */
export async function repoListOrders(
  params: OrderListParams & { limit: number; offset: number },
) {
  const where = buildOrdersWhere(params);
  const orderBy = getOrdersOrder('created_at', 'desc');

  const rows = await db
    .select({
      id: orders.id,
      dealer_id: orders.dealer_id,
      dealer_name: users.full_name,
      seller_id: orders.seller_id,
      seller_name: orderSeller.full_name,
      status: orders.status,
      total: orders.total,
      notes: orders.notes,
      payment_method: orders.payment_method,
      payment_status: orders.payment_status,
      payment_ref: orders.payment_ref,
      created_at: orders.created_at,
      updated_at: orders.updated_at,
    })
    .from(orders)
    .leftJoin(users, eq(users.id, orders.dealer_id))
    .leftJoin(orderSeller, eq(orderSeller.id, orders.seller_id))
    .where(where)
    .orderBy(orderBy)
    .limit(params.limit)
    .offset(params.offset);

  return rows;
}

/* ---- Count ---- */
export async function repoCountOrders(params: OrderListParams): Promise<number> {
  const where = buildOrdersWhere(params);

  const base = db
    .select({ total: sql<number>`COUNT(*)` })
    .from(orders);

  const result = where ? await base.where(where) : await base;
  return Number(result[0]?.total ?? 0);
}

/* ---- Get by ID (with items) ---- */
export async function repoGetOrderById(id: string, locale = 'tr') {
  const loc = locale.slice(0, 8);
  const [order] = await db
    .select({
      id: orders.id,
      dealer_id: orders.dealer_id,
      dealer_name: users.full_name,
      seller_id: orders.seller_id,
      seller_name: orderSeller.full_name,
      status: orders.status,
      total: orders.total,
      notes: orders.notes,
      payment_method: orders.payment_method,
      payment_status: orders.payment_status,
      payment_ref: orders.payment_ref,
      created_at: orders.created_at,
      updated_at: orders.updated_at,
    })
    .from(orders)
    .leftJoin(users, eq(users.id, orders.dealer_id))
    .leftJoin(orderSeller, eq(orderSeller.id, orders.seller_id))
    .where(eq(orders.id, id))
    .limit(1);

  if (!order) return null;

  const items = await db
    .select({
      id: orderItems.id,
      order_id: orderItems.order_id,
      product_id: orderItems.product_id,
      quantity: orderItems.quantity,
      unit_price: orderItems.unit_price,
      total_price: orderItems.total_price,
      created_at: orderItems.created_at,
      product_title: productI18n.title,
    })
    .from(orderItems)
    .leftJoin(
      productI18n,
      and(eq(productI18n.product_id, orderItems.product_id), eq(productI18n.locale, loc)),
    )
    .where(eq(orderItems.order_id, id));

  return { ...order, items };
}

/* ---- Create (order + items) ---- */
export async function repoCreateOrder(
  order: NewOrderRow,
  items: NewOrderItemRow[],
) {
  await db.insert(orders).values(order);
  if (items.length > 0) {
    await db.insert(orderItems).values(items);
  }
}

/* ---- Update status ---- */
export async function repoUpdateOrderStatus(id: string, status: OrderStatus) {
  await db
    .update(orders)
    .set({ status, updated_at: new Date() })
    .where(eq(orders.id, id));
}

export async function repoUpdateOrderSeller(id: string, sellerId: string | null) {
  await db
    .update(orders)
    .set({ seller_id: sellerId, updated_at: new Date() })
    .where(eq(orders.id, id));
}

/** Satıcı dashboard: durum bazlı adet ve ciro (seller_id = atanmış bayi kullanıcı) */
export async function repoSellerOrdersAggregate(sellerId: string) {
  return db
    .select({
      status: orders.status,
      count: sql<number>`count(*)`,
      total_sum: sql<string>`coalesce(sum(${orders.total}), 0)`,
    })
    .from(orders)
    .where(eq(orders.seller_id, sellerId))
    .groupBy(orders.status);
}

/* ---- Delete ---- */
export async function repoDeleteOrder(id: string) {
  await db.delete(orders).where(eq(orders.id, id));
}

/* ---- Get product prices (for total calculation) ---- */
export async function repoGetProductPrices(productIds: string[]) {
  if (productIds.length === 0) return new Map<string, string>();

  const rows = await db
    .select({ id: products.id, price: products.price })
    .from(products)
    .where(sql`${products.id} IN (${sql.join(productIds.map((pid) => sql`${pid}`), sql`, `)})`);

  const map = new Map<string, string>();
  for (const row of rows) {
    map.set(row.id, row.price);
  }
  return map;
}
