import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { hfProducts } from "@/db/schema";

export type CanonicalProductIdentity = {
  id: number;
  slug: string;
  nameTr: string;
  displayName: string | null;
  categorySlug: string;
  unit: string;
};

const identityColumns = {
  id: hfProducts.id,
  slug: hfProducts.slug,
  nameTr: hfProducts.nameTr,
  displayName: hfProducts.displayName,
  categorySlug: hfProducts.categorySlug,
  unit: hfProducts.unit,
  canonicalSlug: hfProducts.canonicalSlug,
};

/** Resolve any public variant slug to the one canonical product row/ID. */
export async function resolveCanonicalProductBySlug(slug: string): Promise<CanonicalProductIdentity | null> {
  const normalized = slug.trim();
  if (!normalized) return null;

  const [source] = await db.select(identityColumns)
    .from(hfProducts)
    .where(eq(hfProducts.slug, normalized))
    .limit(1);
  if (!source) return null;
  if (!source.canonicalSlug) return source;

  const [master] = await db.select(identityColumns)
    .from(hfProducts)
    .where(eq(hfProducts.slug, source.canonicalSlug))
    .limit(1);
  return master ?? null;
}
