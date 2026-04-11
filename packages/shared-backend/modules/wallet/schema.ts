// src/modules/wallet/schema.ts
import {
  mysqlTable,
  char,
  varchar,
  decimal,
  mysqlEnum,
  datetime,
  tinyint,
  index,
  foreignKey,
  text,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { users } from "@agro/shared-backend/modules/auth/schema";

export const wallets = mysqlTable(
  "wallets",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    user_id: char("user_id", { length: 36 }).notNull(),
    balance: decimal("balance", { precision: 14, scale: 2 }).notNull().default("0.00"),
    total_earnings: decimal("total_earnings", { precision: 14, scale: 2 }).notNull().default("0.00"),
    total_withdrawn: decimal("total_withdrawn", { precision: 14, scale: 2 }).notNull().default("0.00"),
    currency: varchar("currency", { length: 10 }).notNull().default("TRY"),
    status: mysqlEnum("status", ["active", "suspended", "closed"]).notNull().default("active"),
    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("wallets_user_id_unique").on(t.user_id),
    foreignKey({
      columns: [t.user_id],
      foreignColumns: [users.id],
      name: "fk_wallets_user",
    }).onDelete("cascade").onUpdate("cascade"),
  ]
);

export const walletTransactions = mysqlTable(
  "wallet_transactions",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    wallet_id: char("wallet_id", { length: 36 }).notNull(),
    user_id: char("user_id", { length: 36 }).notNull(),
    type: mysqlEnum("type", ["credit", "debit"]).notNull(),
    amount: decimal("amount", { precision: 14, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 10 }).notNull().default("TRY"),
    purpose: varchar("purpose", { length: 255 }).notNull().default(""),
    description: text("description"),
    payment_status: mysqlEnum("payment_status", ["pending", "completed", "failed", "refunded"]).notNull().default("pending"),
    transaction_ref: varchar("transaction_ref", { length: 255 }),
    is_admin_created: tinyint("is_admin_created").notNull().default(0),
    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    index("wallet_tx_wallet_id_idx").on(t.wallet_id),
    index("wallet_tx_user_id_idx").on(t.user_id),
    index("wallet_tx_created_idx").on(t.created_at),
    foreignKey({
      columns: [t.wallet_id],
      foreignColumns: [wallets.id],
      name: "fk_wallet_tx_wallet",
    }).onDelete("cascade").onUpdate("cascade"),
  ]
);

export type Wallet = typeof wallets.$inferSelect;
export type NewWallet = typeof wallets.$inferInsert;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type NewWalletTransaction = typeof walletTransactions.$inferInsert;
