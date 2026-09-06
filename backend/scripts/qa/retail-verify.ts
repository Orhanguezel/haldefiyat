/** Read-only acceptance of the real selection/API data path. */
import { pool } from "@/db/client";
import { retailPricesByProduct } from "@/modules/prices/repository";
import { selectHalToMarket } from "@/modules/social/cards/select";
try {
  const card = await selectHalToMarket(6);
  if (card.items.some(row => row.recordedDate !== card.date || row.markets < 3 || !row.sourceUrl))
    throw new Error("K4 evidence contract failed");
  const products: Record<string, unknown> = {};
  for (const slug of ["domates", "patates", "limon", "yogurt", "sut"])
    products[slug] = await retailPricesByProduct(slug);
  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), card, products }, null, 2));
} finally { await pool.end(); }
