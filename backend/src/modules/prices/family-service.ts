import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { hfProducts } from "@/db/schema";
import { computeBaseMap } from "./family";

// family_slug'ı DETERMİNİSTİK yeniden kurar: aktif + canonical-olmayan ürünleri kök isme
// göre kümele, ≥2 üyeli kökler family_slug=kök alır (çeşit seçici o kök altında çıkar),
// tek üyeli/köksüzler NULL. İdempotent — endpoint + ETL cron aynı fonksiyonu çağırır.
export async function rebuildProductFamilies(): Promise<{ families: number; assigned: number; cleared: number }> {
  const rows = await db
    .select({ id: hfProducts.id, name: sql<string>`COALESCE(NULLIF(${hfProducts.displayName}, ''), ${hfProducts.nameTr})` })
    .from(hfProducts)
    .where(and(eq(hfProducts.isActive, 1), isNull(hfProducts.canonicalSlug)));

  const baseMap = computeBaseMap(rows);
  const counts = new Map<string, number>();
  for (const b of baseMap.values()) if (b) counts.set(b, (counts.get(b) ?? 0) + 1);

  const byFamily = new Map<string, number[]>();
  const clearIds: number[] = [];
  for (const r of rows) {
    const b = baseMap.get(r.id) || "";
    if (b && (counts.get(b) ?? 0) >= 2) {
      const arr = byFamily.get(b) ?? [];
      arr.push(r.id);
      byFamily.set(b, arr);
    } else clearIds.push(r.id);
  }

  let assigned = 0;
  for (const [fam, ids] of byFamily) {
    for (let i = 0; i < ids.length; i += 500) {
      await db.update(hfProducts).set({ familySlug: fam }).where(inArray(hfProducts.id, ids.slice(i, i + 500)));
    }
    assigned += ids.length;
  }
  for (let i = 0; i < clearIds.length; i += 500) {
    await db.update(hfProducts).set({ familySlug: null }).where(inArray(hfProducts.id, clearIds.slice(i, i + 500)));
  }

  return { families: byFamily.size, assigned, cleared: clearIds.length };
}
