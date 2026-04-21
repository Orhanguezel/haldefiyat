import type { SQL } from "drizzle-orm";
import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { hfAnnualProduction } from "@/db/schema";

export interface ProductionFilters {
  species?:  string;   // slug
  region?:   string;   // slug
  category?: string;   // slug
  yearFrom?: number;
  yearTo?:   number;
  limit?:    number;
}

export async function listProduction(params: ProductionFilters) {
  const limit = Math.min(2000, Math.max(1, params.limit ?? 500));
  const conds: SQL[] = [];
  if (params.species)  conds.push(eq(hfAnnualProduction.speciesSlug, params.species));
  if (params.region)   conds.push(eq(hfAnnualProduction.regionSlug,  params.region));
  if (params.category) conds.push(eq(hfAnnualProduction.categorySlug, params.category));
  if (params.yearFrom != null) conds.push(gte(hfAnnualProduction.year, params.yearFrom));
  if (params.yearTo   != null) conds.push(lte(hfAnnualProduction.year, params.yearTo));

  return db
    .select({
      id:            hfAnnualProduction.id,
      year:          hfAnnualProduction.year,
      species:       hfAnnualProduction.species,
      speciesSlug:   hfAnnualProduction.speciesSlug,
      categorySlug:  hfAnnualProduction.categorySlug,
      regionSlug:    hfAnnualProduction.regionSlug,
      productionTon: hfAnnualProduction.productionTon,
      sourceApi:     hfAnnualProduction.sourceApi,
      note:          hfAnnualProduction.note,
    })
    .from(hfAnnualProduction)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(hfAnnualProduction.year), asc(hfAnnualProduction.speciesSlug))
    .limit(limit);
}

/**
 * Tür bazlı zaman serisi — grafik için (yıl, ton) çiftleri.
 * speciesSlug zorunlu.
 */
export async function productionSeries(speciesSlug: string, regionSlug?: string) {
  const conds: SQL[] = [eq(hfAnnualProduction.speciesSlug, speciesSlug)];
  if (regionSlug) conds.push(eq(hfAnnualProduction.regionSlug, regionSlug));
  return db
    .select({
      year:          hfAnnualProduction.year,
      species:       hfAnnualProduction.species,
      regionSlug:    hfAnnualProduction.regionSlug,
      productionTon: hfAnnualProduction.productionTon,
    })
    .from(hfAnnualProduction)
    .where(and(...conds))
    .orderBy(asc(hfAnnualProduction.year));
}

/**
 * Kayıtlı türlerin özeti — frontend filtre dropdown'ı için.
 * Her tür için: slug, isim, kategori, ilk yıl, son yıl, toplam kayıt.
 */
export async function listSpecies(regionSlug?: string) {
  const conds: SQL[] = [];
  if (regionSlug) conds.push(eq(hfAnnualProduction.regionSlug, regionSlug));
  return db
    .select({
      speciesSlug:  hfAnnualProduction.speciesSlug,
      species:      sql<string>`MAX(${hfAnnualProduction.species})`,
      categorySlug: sql<string>`MAX(${hfAnnualProduction.categorySlug})`,
      firstYear:    sql<number>`MIN(${hfAnnualProduction.year})`,
      lastYear:     sql<number>`MAX(${hfAnnualProduction.year})`,
      entries:      sql<number>`COUNT(*)`,
    })
    .from(hfAnnualProduction)
    .where(conds.length ? and(...conds) : undefined)
    .groupBy(hfAnnualProduction.speciesSlug)
    .orderBy(asc(hfAnnualProduction.speciesSlug));
}

export async function productionSummary() {
  const rows = await db
    .select({
      totalRows:    sql<number>`COUNT(*)`,
      speciesCount: sql<number>`COUNT(DISTINCT ${hfAnnualProduction.speciesSlug})`,
      regionCount:  sql<number>`COUNT(DISTINCT ${hfAnnualProduction.regionSlug})`,
      yearMin:      sql<number>`MIN(${hfAnnualProduction.year})`,
      yearMax:      sql<number>`MAX(${hfAnnualProduction.year})`,
    })
    .from(hfAnnualProduction);
  return rows[0] ?? null;
}
