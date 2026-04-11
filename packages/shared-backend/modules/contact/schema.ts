// =============================================================
// FILE: src/modules/contact/schema.ts
// =============================================================
import {
  mysqlTable,
  char,
  varchar,
  text,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/mysql-core";

export const contact_messages = mysqlTable(
  "contact_messages",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 64 }).notNull(),
    subject: varchar("subject", { length: 255 }).notNull(),
    message: text("message").notNull(),

    status: varchar("status", { length: 32 }).notNull().default("new"), // 'new' | 'in_progress' | 'closed'
    is_resolved: boolean("is_resolved").notNull().default(false),

    admin_note: varchar("admin_note", { length: 2000 }),

    // meta
    ip: varchar("ip", { length: 64 }),
    user_agent: varchar("user_agent", { length: 512 }),

    // antispam
    website: varchar("website", { length: 255 }),

    created_at: timestamp("created_at", { fsp: 3 }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { fsp: 3 }).notNull().defaultNow().onUpdateNow(),
  },
  (t) => [
    index("idx_contact_created_at").on(t.created_at),
    index("idx_contact_status").on(t.status),
    index("idx_contact_resolved").on(t.is_resolved),
  ],
);

export type ContactRow = typeof contact_messages.$inferSelect;
export type ContactInsert = typeof contact_messages.$inferInsert;

// Şimdilik ekstra projection yok, direkt row'u view gibi kullanıyoruz
export type ContactView = ContactRow;
