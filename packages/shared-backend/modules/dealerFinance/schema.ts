// src/modules/dealerFinance/schema.ts
import {
  mysqlTable,
  char,
  varchar,
  decimal,
  tinyint,
  datetime,
  index,
  uniqueIndex,
  mysqlEnum,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { users } from '../auth/schema';

/** DEALER PROFILES — extends user profiles with B2B fields */
export const dealerProfiles = mysqlTable(
  'dealer_profiles',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    user_id: char('user_id', { length: 36 })
      .notNull()
      .references(() => users.id),
    company_name: varchar('company_name', { length: 255 }),
    city: varchar('city', { length: 128 }),
    region: varchar('region', { length: 128 }),
    latitude: decimal('latitude', { precision: 10, scale: 7 }),
    longitude: decimal('longitude', { precision: 10, scale: 7 }),
    tax_number: varchar('tax_number', { length: 50 }),
    tax_office: varchar('tax_office', { length: 255 }),
    credit_limit: decimal('credit_limit', { precision: 12, scale: 2 })
      .notNull()
      .default('0.00'),
    risk_limit: decimal('risk_limit', { precision: 12, scale: 2 })
      .notNull()
      .default('0.00'),
    current_balance: decimal('current_balance', { precision: 12, scale: 2 })
      .notNull()
      .default('0.00'),
    discount_rate: decimal('discount_rate', { precision: 5, scale: 2 })
      .notNull()
      .default('0.00'),
    ecosystem_id: varchar('ecosystem_id', { length: 128 }),
    is_approved: tinyint('is_approved').notNull().default(0),
    list_public: tinyint('list_public').notNull().default(1),
    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('dealer_profiles_user_id_unique').on(t.user_id),
    index('dealer_profiles_is_approved_idx').on(t.is_approved),
  ],
);

export const TRANSACTION_TYPES = [
  'order',
  'payment',
  'adjustment',
  'refund',
] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

/** DEALER TRANSACTIONS — cari hareketler */
export const dealerTransactions = mysqlTable(
  'dealer_transactions',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    dealer_id: char('dealer_id', { length: 36 })
      .notNull()
      .references(() => dealerProfiles.id),
    order_id: char('order_id', { length: 36 }),
    type: mysqlEnum('type', ['order', 'payment', 'adjustment', 'refund']).notNull(),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    balance_after: decimal('balance_after', { precision: 12, scale: 2 }).notNull(),
    description: varchar('description', { length: 500 }),
    due_date: datetime('due_date', { fsp: 3 }),
    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    created_by: char('created_by', { length: 36 }),
  },
  (t) => [
    index('dealer_tx_dealer_id_idx').on(t.dealer_id),
    index('dealer_tx_type_idx').on(t.type),
    index('dealer_tx_created_at_idx').on(t.created_at),
    index('dealer_tx_order_id_idx').on(t.order_id),
    index('dealer_tx_due_date_idx').on(t.due_date),
  ],
);

// Row types
export type DealerProfileRow = typeof dealerProfiles.$inferSelect;
export type NewDealerProfileRow = typeof dealerProfiles.$inferInsert;
export type DealerTransactionRow = typeof dealerTransactions.$inferSelect;
export type NewDealerTransactionRow = typeof dealerTransactions.$inferInsert;
