import { and, eq, gte, ne, sql } from "drizzle-orm";
import { mysqlTable, varchar, tinyint, datetime } from "drizzle-orm/mysql-core";
import { sendBereketMail } from "@agro/shared-backend/core/mail";
import { users } from "@agro/shared-backend/modules/auth/schema";
import { telegramSendRaw } from "@agro/shared-backend/modules/telegram/helpers/telegram.notifier";
import { db } from "@/db/client";
import { hfListings } from "./schema";

const daily = new Map<string, { day: string; count: number }>();
const subscribers = mysqlTable("newsletter_subscribers", {
  email: varchar("email", { length: 255 }).notNull(),
  isVerified: tinyint("is_verified").notNull().default(0),
  unsubscribedAt: datetime("unsubscribed_at", { fsp: 3 }),
});

function allow(key: string) {
  const day = new Date().toISOString().slice(0, 10);
  const row = daily.get(key);
  if (!row || row.day !== day) {
    daily.set(key, { day, count: 1 });
    return true;
  }
  if (row.count >= 5) return false;
  row.count++;
  return true;
}

function chatId(raw: Record<string, unknown> | null | undefined) {
  const value = raw?.telegram_chat_id ?? raw?.chat_id;
  return value == null ? null : String(value);
}

export async function notifyMatches(listing: typeof hfListings.$inferSelect) {
  if (!listing.productId || !listing.citySlug || listing.status !== "approved") return;
  const opposite = listing.listingType === "satis" ? "alim" : "satis";
  const matches = await db.select({
    id: hfListings.id,
    title: hfListings.title,
    userId: hfListings.userId,
    raw: hfListings.raw,
    email: subscribers.email,
  }).from(hfListings)
    .leftJoin(users, eq(users.id, hfListings.userId))
    .leftJoin(subscribers, and(
      eq(subscribers.email, users.email),
      eq(subscribers.isVerified, 1),
      sql`${subscribers.unsubscribedAt} IS NULL`,
    ))
    .where(and(
      ne(hfListings.id, listing.id),
      eq(hfListings.productId, listing.productId),
      eq(hfListings.citySlug, listing.citySlug),
      eq(hfListings.listingType, opposite),
      eq(hfListings.status, "approved"),
      gte(hfListings.validUntil, sql`CURRENT_DATE()`),
    )).limit(50);
  const text = `Yeni eşleşen ilan: ${listing.title} (${listing.productName})`;
  for (const match of matches) {
    const key = match.userId ?? chatId(match.raw) ?? `listing:${match.id}`;
    if (!allow(key)) continue;
    const tg = chatId(match.raw);
    if (tg) await telegramSendRaw({ chatId: tg, text });
    if (match.email) {
      await sendBereketMail({
        to: match.email,
        subject: "Yeni ilan eşleşmesi",
        html: `<p>${text}</p><p>HaldeFiyat ilanlar panelinden detaylara bakabilirsiniz.</p>`,
      } as Parameters<typeof sendBereketMail>[0]).catch(() => {});
    }
  }
}
