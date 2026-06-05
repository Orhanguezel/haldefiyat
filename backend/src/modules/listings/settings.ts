import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { siteSettings } from "@agro/shared-backend/modules/siteSettings/schema";
import { db } from "@/db/client";

export type FeaturedPricing = Record<"daily" | "weekly" | "monthly", { days: number; price: number }>;

const KEY = "listing_featured_pricing";

export const DEFAULT_FEATURED_PRICING: FeaturedPricing = {
  daily: { days: 1, price: 99 },
  weekly: { days: 7, price: 499 },
  monthly: { days: 30, price: 1499 },
};

export async function readFeaturedPricing(): Promise<FeaturedPricing | null> {
  const rows = await db.select({ value: siteSettings.value }).from(siteSettings)
    .where(and(eq(siteSettings.key, KEY), eq(siteSettings.locale, "*"))).limit(1);
  if (!rows[0]?.value) return null;
  try {
    return JSON.parse(rows[0].value) as FeaturedPricing;
  } catch {
    return null;
  }
}

export async function writeFeaturedPricing(pricing: FeaturedPricing): Promise<void> {
  const value = JSON.stringify(pricing);
  await db.insert(siteSettings)
    .values({ id: randomUUID(), key: KEY, locale: "*", value })
    .onDuplicateKeyUpdate({ set: { value } });
}
