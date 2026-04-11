import { and, eq, or, sql } from "drizzle-orm";

import { db } from "../../db/client";
import { products, productI18n } from "./schema";
import type { ItemType } from "./helpers.shared";

const SLUG_SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

export function parseSlugsParam(slugs: string | undefined): string[] | null {
  const raw = String(slugs ?? "").trim();
  if (!raw) return null;
  const parts = raw.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
  const ordered: string[] = [];
  const seen = new Set<string>();
  for (const p of parts) {
    if (p.length > 255 || !SLUG_SEGMENT.test(p)) continue;
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    ordered.push(p);
  }
  return ordered.length ? ordered : null;
}

/** Slug sırasını koruyarak ürün ID listesine çözümler (eşleşmeyen slug atlanır). */
export async function resolveOrderedIdsFromSlugs(
  slugList: string[],
  locale: string,
  itemType: ItemType,
): Promise<string[]> {
  const lowered = slugList.map((s) => s.toLowerCase());
  const rows = await db
    .select({ id: products.id, slug: productI18n.slug })
    .from(products)
    .innerJoin(productI18n, eq(productI18n.product_id, products.id))
    .where(
      and(
        eq(productI18n.locale, locale),
        eq(products.item_type, itemType as never),
        eq(products.is_active, 1 as never),
        or(...lowered.map((s) => eq(sql`LOWER(${productI18n.slug})`, s))),
      ),
    );

  const map = new Map<string, string>();
  for (const r of rows) {
    map.set(r.slug.toLowerCase(), r.id);
  }
  return lowered.map((s) => map.get(s)).filter((x): x is string => Boolean(x));
}
