import Fastify from "fastify";
import { pool } from "../../src/db/client";
import { registerHalAdmin } from "../../src/modules/hal-admin";

const SOURCE = "__qa_quarantine__";
const DATE = "2099-12-30";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const app = Fastify({ logger: false });
let quarantineId = 0;

async function cleanup() {
  if (quarantineId) {
    await pool.query("DELETE FROM hf_price_quarantine_decisions WHERE quarantine_id=?", [quarantineId]);
    await pool.query("DELETE FROM hf_price_quarantine WHERE id=?", [quarantineId]);
  }
  await pool.query("DELETE FROM hf_price_history WHERE source_api=? AND recorded_date=?", [`${SOURCE}:reviewed`, DATE]);
}

try {
  const [[productRows], [marketRows]] = await Promise.all([
    pool.query("SELECT id,unit FROM hf_products WHERE is_active=1 LIMIT 1"),
    pool.query("SELECT id FROM hf_markets WHERE is_active=1 LIMIT 1"),
  ]);
  const product = (productRows as Array<{ id: number; unit: string }>)[0];
  const market = (marketRows as Array<{ id: number }>)[0];
  assert(product && market, "QA icin urun/hal bulunamadi");

  await pool.query("DELETE FROM hf_price_history WHERE product_id=? AND market_id=? AND recorded_date=?", [product.id, market.id, DATE]);
  const [insert] = await pool.query(
    `INSERT INTO hf_price_quarantine
      (product_id,market_id,recorded_date,source_api,unit,min_price,max_price,avg_price,reason_code,severity,confidence)
     VALUES (?,?,?,?,?,10,20,15,'ABSOLUTE_LIMIT','critical',0.9900)`,
    [product.id, market.id, DATE, SOURCE, product.unit],
  );
  quarantineId = Number((insert as { insertId?: number }).insertId ?? 0);
  assert(quarantineId > 0, "QA karantina kaydi olusmadi");

  await registerHalAdmin(app);
  await app.ready();

  const preview = await app.inject({
    method: "POST",
    url: "/hal/price-quarantine/bulk-preview",
    payload: { ids: [quarantineId], decision: "approve" },
  });
  assert(preview.statusCode === 200, `On izleme HTTP ${preview.statusCode}: ${preview.body}`);
  const previewBody = preview.json() as { previewToken: string; actionable: number };
  assert(previewBody.actionable === 1 && previewBody.previewToken?.length === 64, "On izleme snapshot/token gecersiz");

  const stale = await app.inject({
    method: "POST",
    url: "/hal/price-quarantine/bulk-review",
    payload: { ids: [quarantineId], decision: "approve", note: "QA eski token", previewToken: "0".repeat(64), confirmBulk: true, confirmCritical: true },
  });
  assert(stale.statusCode === 409, `Eski token reddedilmedi: HTTP ${stale.statusCode}`);

  const missingCriticalConfirm = await app.inject({
    method: "POST",
    url: "/hal/price-quarantine/bulk-review",
    payload: { ids: [quarantineId], decision: "approve", note: "QA kritik onaysiz", previewToken: previewBody.previewToken, confirmBulk: true },
  });
  assert(missingCriticalConfirm.statusCode === 400, `Kritik ikinci onay reddedilmedi: HTTP ${missingCriticalConfirm.statusCode}`);

  const apply = await app.inject({
    method: "POST",
    url: "/hal/price-quarantine/bulk-review",
    payload: { ids: [quarantineId], decision: "approve", note: "QA toplu onay", previewToken: previewBody.previewToken, confirmBulk: true, confirmCritical: true },
  });
  assert(apply.statusCode === 200, `Toplu karar HTTP ${apply.statusCode}: ${apply.body}`);

  const rollback = await app.inject({
    method: "POST",
    url: `/hal/price-quarantine/${quarantineId}/rollback`,
    payload: { note: "QA snapshot geri alma", confirmRollback: true },
  });
  assert(rollback.statusCode === 200, `Geri alma HTTP ${rollback.statusCode}: ${rollback.body}`);

  const [queueRows] = await pool.query("SELECT status FROM hf_price_quarantine WHERE id=?", [quarantineId]);
  const [priceRows] = await pool.query("SELECT id FROM hf_price_history WHERE product_id=? AND market_id=? AND recorded_date=?", [product.id, market.id, DATE]);
  const [auditRows] = await pool.query("SELECT action FROM hf_price_quarantine_decisions WHERE quarantine_id=? ORDER BY id", [quarantineId]);
  assert((queueRows as Array<{ status: string }>)[0]?.status === "rolled_back", "Kuyruk rolled_back olmadi");
  assert((priceRows as unknown[]).length === 0, "Snapshot oncesinde olmayan fiyat geri almada silinmedi");
  assert(JSON.stringify(auditRows).includes("approve") && JSON.stringify(auditRows).includes("rollback"), "Audit karar zinciri eksik");
  console.log(JSON.stringify({ ok: true, preview: true, staleTokenGuard: true, criticalDoubleConfirm: true, bulkReview: true, rollback: true, audit: true }));
} finally {
  await cleanup();
  await app.close();
  await pool.end();
}
