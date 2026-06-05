import { and, asc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { hfProducts } from "@/db/schema";
import { hfListings } from "./schema";

type BoardSide = { median: number | null; count: number; top3: Array<{ id: number; slug: string; title: string; price: number }> };

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

async function side(productId: number, city: string, type: "satis" | "alim"): Promise<BoardSide> {
  const rows = await db.select({
    id: hfListings.id,
    slug: hfListings.slug,
    title: hfListings.title,
    priceMin: hfListings.priceMin,
  }).from(hfListings).where(and(
    eq(hfListings.productId, productId),
    eq(hfListings.citySlug, city),
    eq(hfListings.listingType, type),
    eq(hfListings.status, "approved"),
    eq(hfListings.isSuspicious, 0),
    gte(hfListings.validUntil, sql`CURRENT_DATE()`),
    inArray(hfListings.priceType, ["sabit", "hal_endeksli"]),
  )).orderBy(asc(hfListings.priceMin)).limit(50);
  const priced = rows.map((r) => ({ id: r.id, slug: r.slug, title: r.title, price: Number(r.priceMin) })).filter((r) => r.price > 0);
  return { median: priced.length >= 3 ? median(priced.map((r) => r.price)) : null, count: priced.length, top3: priced.slice(0, 3) };
}

export async function getListingBoard(productSlug: string, city: string) {
  const [product] = await db.select({ id: hfProducts.id, slug: hfProducts.slug, name: hfProducts.nameTr })
    .from(hfProducts).where(eq(hfProducts.slug, productSlug)).limit(1);
  if (!product) return null;
  const [sell, buy] = await Promise.all([side(product.id, city, "satis"), side(product.id, city, "alim")]);
  const spread = sell.median != null && buy.median != null ? sell.median - buy.median : null;
  return { product: { slug: product.slug, name: product.name }, city, sell, buy, spread, updatedAt: new Date().toISOString() };
}
