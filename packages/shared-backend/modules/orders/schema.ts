// src/modules/orders/schema.ts
import {
  mysqlTable,
  char,
  varchar,
  text,
  decimal,
  int,
  datetime,
  index,
  foreignKey,
  mysqlEnum,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { users } from '../auth/schema';
import { products } from '../products/schema';

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'shipped',
  'completed',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_PAYMENT_STATUSES = ['unpaid', 'pending', 'paid', 'failed', 'refunded'] as const;
export type OrderPaymentStatus = (typeof ORDER_PAYMENT_STATUSES)[number];

/* ========================= ORDERS ========================= */
export const orders = mysqlTable(
  'orders',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    dealer_id: char('dealer_id', { length: 36 }).notNull(),
    /** B2B coklu satici: NULL = VistaSeed merkez depo */
    seller_id: char('seller_id', { length: 36 }),
    status: mysqlEnum('status', ORDER_STATUSES).notNull().default('pending'),
    total: decimal('total', { precision: 12, scale: 2 }).notNull().default('0.00'),
    notes: text('notes'),
    payment_method: varchar('payment_method', { length: 32 }),
    payment_status: mysqlEnum('payment_status', ORDER_PAYMENT_STATUSES).notNull().default('unpaid'),
    payment_ref: char('payment_ref', { length: 36 }),
    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index('orders_dealer_id_idx').on(t.dealer_id),
    index('orders_seller_id_idx').on(t.seller_id),
    index('orders_status_idx').on(t.status),
    index('orders_created_at_idx').on(t.created_at),
    index('orders_payment_ref_idx').on(t.payment_ref),
    foreignKey({
      columns: [t.dealer_id],
      foreignColumns: [users.id],
      name: 'fk_orders_dealer',
    })
      .onDelete('restrict')
      .onUpdate('cascade'),
    foreignKey({
      columns: [t.seller_id],
      foreignColumns: [users.id],
      name: 'fk_orders_seller',
    })
      .onDelete('set null')
      .onUpdate('cascade'),
  ],
);

/* ========================= ORDER ITEMS ========================= */
export const orderItems = mysqlTable(
  'order_items',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    order_id: char('order_id', { length: 36 }).notNull(),
    product_id: char('product_id', { length: 36 }).notNull(),
    quantity: int('quantity').notNull().default(1),
    unit_price: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
    total_price: decimal('total_price', { precision: 12, scale: 2 }).notNull(),
    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    index('order_items_order_id_idx').on(t.order_id),
    index('order_items_product_id_idx').on(t.product_id),
    foreignKey({
      columns: [t.order_id],
      foreignColumns: [orders.id],
      name: 'fk_order_items_order',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    foreignKey({
      columns: [t.product_id],
      foreignColumns: [products.id],
      name: 'fk_order_items_product',
    })
      .onDelete('restrict')
      .onUpdate('cascade'),
  ],
);

// Types
export type OrderRow = typeof orders.$inferSelect;
export type NewOrderRow = typeof orders.$inferInsert;
export type OrderItemRow = typeof orderItems.$inferSelect;
export type NewOrderItemRow = typeof orderItems.$inferInsert;
