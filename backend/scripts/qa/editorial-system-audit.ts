/** Read-only audit. No contact information or credentials are returned. */
import { pool } from "@/db/client";
import { realListingSql } from "@/modules/listings/evidence-policy";
import { countListings, getListingBySlug } from "@/modules/listings/repo";
import { listWantedProducts } from "@/modules/listings/wanted";
import { retailPricesByProduct } from "@/modules/prices/repository";
try {
  const [baseline] = await pool.query(`SELECT COUNT(*) AS approvedActive,
    SUM(${realListingSql()}) AS realActive,
    SUM(NOT (${realListingSql()})) AS rehearsalActive
    FROM hf_listings WHERE status='approved' AND valid_until >= CURRENT_DATE()`);
  const [etlHistory] = await pool.query(`SELECT source_api,run_date,rows_fetched,rows_inserted,status
    FROM hf_etl_runs WHERE run_date='2026-09-01' AND source_api LIKE '%marketfiyati%'`);
  const rehearsal = await getListingBySlug("domates-istanbul-21");
  if (rehearsal) throw new Error("REHEARSAL_STILL_PUBLIC");
  console.log(JSON.stringify({checkedAt:new Date().toISOString(),baseline,
    publicCount:await countListings({publicOnly:true}), rehearsalPublic:!!rehearsal,
    wanted:await listWantedProducts(), retail:{sut:await retailPricesByProduct("sut"),yogurt:await retailPricesByProduct("yogurt")},
    septemberFirstEtlHistory:etlHistory},null,2));
} finally { await pool.end(); }
