import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { hfMarkets } from "@/db/schema";

export async function listMarkets() {
  return db
    .select({
      id: hfMarkets.id,
      slug: hfMarkets.slug,
      name: hfMarkets.name,
      cityName: hfMarkets.cityName,
      regionSlug: hfMarkets.regionSlug,
    })
    .from(hfMarkets)
    .where(eq(hfMarkets.isActive, 1))
    .orderBy(asc(hfMarkets.displayOrder), asc(hfMarkets.name));
}
