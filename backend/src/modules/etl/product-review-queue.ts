import { pool } from "@/db/client";
import { canonicalUnit } from "./canonical-contract";
import { canonicalProductCategory } from "./category-dictionary";
import { normalizeRawProductName, productMatchKey } from "./normalizer";

export interface UnknownProductObservation {
  sourceApi: string;
  marketId?: number | null;
  rawName: string;
  rawCategory?: string | null;
  rawUnit?: string | null;
  fallbackCategory?: string | null;
  recordedDate: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  avgPrice?: number | null;
}

/** Bilinmeyen ürünü public kataloğa açmak yerine idempotent inceleme kuyruğunda toplar. */
export async function enqueueUnknownProduct(input: UnknownProductObservation): Promise<void> {
  const normalizedName = normalizeRawProductName(input.rawName);
  const unit = canonicalUnit(input.rawUnit);
  const rawUnit = String(input.rawUnit ?? "").trim() || null;
  const category = canonicalProductCategory({
    rawCategory: input.rawCategory,
    rawName: input.rawName,
    fallback: input.fallbackCategory,
  });
  await pool.query(
    `INSERT INTO hf_product_review_queue
      (source_api,market_id,raw_name,normalized_name,raw_category,suggested_category,raw_unit,canonical_unit,
       match_key,recorded_date,min_price,max_price,avg_price,reason_code)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE raw_name=VALUES(raw_name), raw_category=VALUES(raw_category),
       suggested_category=VALUES(suggested_category), canonical_unit=VALUES(canonical_unit),
       match_key=VALUES(match_key), recorded_date=VALUES(recorded_date), min_price=VALUES(min_price),
       max_price=VALUES(max_price), avg_price=VALUES(avg_price), occurrence_count=occurrence_count+1,
       last_seen_at=CURRENT_TIMESTAMP(3)`,
    [input.sourceApi, input.marketId ?? null, input.rawName, normalizedName, input.rawCategory ?? null,
     category, rawUnit, unit, unit ? productMatchKey(normalizedName, unit) : null, input.recordedDate,
     input.minPrice ?? null, input.maxPrice ?? null, input.avgPrice ?? null,
     unit ? "UNKNOWN_PRODUCT" : "UNKNOWN_UNIT"],
  );
}
