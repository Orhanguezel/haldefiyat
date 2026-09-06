import { retailTitleMatches, retailUnit, trustedRetailSource } from "@/modules/etl/retail-source-policy";

// Alias rp/p required. Old, unattributed aggregates remain in storage but cannot
// be presented as verified current quotes. A valid re-fetch restores coverage.
export const ELIGIBLE_RETAIL = `rp.recorded_date BETWEEN CURDATE() - INTERVAL 3 DAY AND CURDATE()
  AND rp.price > 0 AND rp.currency = 'TRY' AND p.is_active = 1
  AND rp.product_url IS NOT NULL AND rp.product_url <> ''
  AND NOT EXISTS (SELECT 1 FROM hf_retail_price_quarantine rq
    WHERE rq.product_id=rp.product_id AND rq.chain_slug=rp.chain_slug
      AND rq.recorded_date=rp.recorded_date AND rq.status <> 'rejected')`;

export interface RetailObservation {
  productSlug: string; productUnit: string; chainSlug: string; price: string;
  unit: string; recordedDate: string; productNameRaw: string | null; productUrl: string | null;
}

export function isVerifiedRetail(row: RetailObservation): boolean {
  return retailUnit(row.unit) != null && retailUnit(row.unit) === retailUnit(row.productUnit)
    && trustedRetailSource(row.productUrl) && !!row.productNameRaw
    && retailTitleMatches(row.productSlug, row.productNameRaw)
    && Number.isFinite(Number(row.price)) && Number(row.price) > 0;
}

export function latestRetailByChain(rows: RetailObservation[]): RetailObservation[] {
  const chains = new Map<string, RetailObservation>();
  for (const row of rows.filter(isVerifiedRetail)) {
    const current = chains.get(row.chainSlug);
    if (!current || row.recordedDate > current.recordedDate) chains.set(row.chainSlug, row);
  }
  return [...chains.values()].sort((a, b) => a.chainSlug.localeCompare(b.chainSlug));
}
