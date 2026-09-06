/** Existing ETL path; dry-run by default, explicit --apply writes verified quotes. */
import { runMarketfiyatiEtl } from "@/modules/etl/market-scrapers/marketfiyati";
import { pool } from "@/db/client";
try {
  const result = await runMarketfiyatiEtl(undefined, { dryRun: !process.argv.includes("--apply") });
  console.log(JSON.stringify(result, null, 2));
  if (!result.verifiedOffers || result.throttled) process.exitCode = 1;
} finally { await pool.end(); }
