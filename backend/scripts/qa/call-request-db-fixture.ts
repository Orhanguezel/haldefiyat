import { randomUUID } from "node:crypto";
import { createApp } from "../../src/app";
import { pool } from "../../src/db/client";

if (process.env.QA_ALLOW_MUTATION !== "1") {
  throw new Error("Bu fixture gecici DB kaydi olusturur. QA_ALLOW_MUTATION=1 ile acikca etkinlestirin.");
}

const runId = `qa-call-${Date.now()}`;
const buyerId = randomUUID();
const sellerId = randomUUID();
const buyerEmail = `${runId}-buyer@invalid.haldefiyat.local`;
const sellerEmail = `${runId}-seller@invalid.haldefiyat.local`;
const listingIds: number[] = [];
const createdRequestIds: number[] = [];
const results: Array<{ check: string; ok: boolean; detail?: unknown }> = [];
const app = await createApp();

function check(condition: unknown, name: string, detail?: unknown): asserts condition {
  const ok = Boolean(condition);
  results.push({ check: name, ok, ...(detail === undefined ? {} : { detail }) });
  if (!ok) throw new Error(`${name} basarisiz: ${JSON.stringify(detail)}`);
}

async function inject(input: Parameters<typeof app.inject>[0]) {
  const response = await app.inject(input);
  let body: Record<string, any> = {};
  try { body = response.json(); } catch { /* body olmayabilir */ }
  return { response, body };
}

try {
  await app.ready();
  const connection = await pool.getConnection();
  try {
    await connection.execute(
      `INSERT INTO users (id, email, password_hash, full_name, is_active, email_verified)
       VALUES (?, ?, 'qa-not-a-login-password', 'QA Call Buyer', 1, 1),
              (?, ?, 'qa-not-a-login-password', 'QA Call Seller', 1, 1)`,
      [buyerId, buyerEmail, sellerId, sellerEmail],
    );

    for (let index = 1; index <= 6; index += 1) {
      const slug = `${runId}-${index}`;
      const [insert] = await connection.execute(
        `INSERT INTO hf_listings
          (slug, user_id, product_name, title, valid_until, status, contact_phone,
           hide_phone, call_requests_enabled, call_availability, source)
         VALUES (?, ?, 'Domates', ?, DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY),
                 'approved', '+905551112233', 1, 1,
                 'asap,morning,afternoon,evening', 'user')`,
        [slug, sellerId, `QA arama talebi ilani ${index}`],
      );
      listingIds.push(Number((insert as { insertId: number }).insertId));
    }
  } finally {
    connection.release();
  }

  const buyerToken = app.jwt.sign({ sub: buyerId, email: buyerEmail, role: "user" }, { expiresIn: "10m" });
  const sellerToken = app.jwt.sign({ sub: sellerId, email: sellerEmail, role: "user" }, { expiresIn: "10m" });
  const mutationPayload = {
    preferredSlot: "morning",
    privacyAccepted: true,
    note: "Beni +90 555 111 22 33 veya qa.person@example.com uzerinden arayin",
    formElapsedMs: 4_000,
  };

  const anonymous = await inject({
    method: "POST",
    url: `/api/v1/listings/${listingIds[0]}/call-requests`,
    payload: mutationPayload,
  });
  check(anonymous.response.statusCode === 401, "anonymous auth gate", anonymous.response.statusCode);

  const crossSite = await inject({
    method: "POST",
    url: `/api/v1/listings/${listingIds[0]}/call-requests`,
    headers: {
      cookie: `access_token=${buyerToken}`,
      origin: "https://attacker.invalid",
      "sec-fetch-site": "cross-site",
    },
    payload: mutationPayload,
  });
  check(crossSite.response.statusCode === 403, "cross-site cookie mutation gate", crossSite.response.statusCode);

  const bearerHeaders = { authorization: `Bearer ${buyerToken}`, "user-agent": "HalDeFiyat-QA/1.0" };
  const first = await inject({
    method: "POST",
    url: `/api/v1/listings/${listingIds[0]}/call-requests`,
    headers: bearerHeaders,
    payload: mutationPayload,
  });
  check(first.response.statusCode === 201, "authenticated create", { status: first.response.statusCode, body: first.body });
  check(first.response.headers["cache-control"]?.includes("no-store"), "private response cache policy", first.response.headers["cache-control"]);
  createdRequestIds.push(Number(first.body.id));

  const duplicate = await inject({
    method: "POST",
    url: `/api/v1/listings/${listingIds[0]}/call-requests`,
    headers: bearerHeaders,
    payload: mutationPayload,
  });
  check(duplicate.response.statusCode === 409, "listing buyer duplicate quota", duplicate.response.statusCode);

  for (let index = 1; index < 5; index += 1) {
    const created = await inject({
      method: "POST",
      url: `/api/v1/listings/${listingIds[index]}/call-requests`,
      headers: bearerHeaders,
      payload: mutationPayload,
    });
    check(created.response.statusCode === 201, `daily quota setup ${index + 1}`, created.response.statusCode);
    createdRequestIds.push(Number(created.body.id));
  }

  const limited = await inject({
    method: "POST",
    url: `/api/v1/listings/${listingIds[5]}/call-requests`,
    headers: bearerHeaders,
    payload: mutationPayload,
  });
  check(limited.response.statusCode === 429, "buyer daily quota", { status: limited.response.statusCode, body: limited.body });

  const sellerAccept = await inject({
    method: "PATCH",
    url: `/api/v1/listings/call-requests/${createdRequestIds[0]}`,
    headers: { authorization: `Bearer ${sellerToken}` },
    payload: { status: "accepted" },
  });
  check(sellerAccept.response.statusCode === 200, "seller accepts request", sellerAccept.response.statusCode);

  const buyerCannotComplete = await inject({
    method: "PATCH",
    url: `/api/v1/listings/call-requests/${createdRequestIds[0]}`,
    headers: bearerHeaders,
    payload: { status: "completed" },
  });
  check(buyerCannotComplete.response.statusCode === 409, "buyer cannot complete seller transition", buyerCannotComplete.response.statusCode);

  const sellerComplete = await inject({
    method: "PATCH",
    url: `/api/v1/listings/call-requests/${createdRequestIds[0]}`,
    headers: { authorization: `Bearer ${sellerToken}` },
    payload: { status: "completed" },
  });
  check(sellerComplete.response.statusCode === 200, "seller completes accepted request", sellerComplete.response.statusCode);

  const [requestRows] = await pool.query(
    `SELECT id, buyer_user_id AS buyerUserId, seller_user_id AS sellerUserId,
            note, consent_at AS consentAt, status
       FROM hf_listing_call_requests
      WHERE buyer_user_id = ? ORDER BY id`,
    [buyerId],
  );
  const requests = requestRows as Array<Record<string, any>>;
  check(requests.length === 5, "exact persisted request count", requests.length);
  check(requests.every((row) => row.consentAt), "consent audit timestamp", requests.map((row) => row.consentAt));
  check(requests.every((row) => row.buyerUserId === buyerId && row.sellerUserId === sellerId), "buyer seller ownership");
  check(!requests.some((row) => /qa\.person@example\.com|555\s*111/i.test(String(row.note))), "stored note PII redaction", requests.map((row) => row.note));

  const dashboard = await inject({
    method: "GET",
    url: "/api/v1/listings/call-requests/me",
    headers: bearerHeaders,
  });
  check(dashboard.response.statusCode === 200 && dashboard.body.items?.length === 5, "authenticated dashboard list");
  check(dashboard.body.items.every((item: Record<string, unknown>) => !("buyerUserId" in item) && !("sellerUserId" in item)), "dashboard identity redaction");

  const [auditRows] = await pool.query(
    `SELECT user_id AS userId, method, status_code AS statusCode, request_body AS requestBody
       FROM audit_request_logs
      WHERE user_id = ? AND path LIKE '/api/v1/listings/%call-requests%'
      ORDER BY id`,
    [buyerId],
  );
  const audits = auditRows as Array<Record<string, any>>;
  check(audits.some((row) => row.method === "POST" && row.statusCode === 201), "audit binds JWT sub to successful mutation", audits);
  check(audits.some((row) => row.method === "POST" && row.statusCode === 429), "audit captures quota rejection", audits);
  check(audits.every((row) => row.requestBody == null), "audit stores no mutation body");

  console.log(JSON.stringify({ runId, ok: true, checks: results.length, results }, null, 2));
} finally {
  try {
    if (createdRequestIds.length) {
      await pool.query("DELETE FROM hf_listing_call_requests WHERE id IN (?)", [createdRequestIds]);
    }
    await pool.query("DELETE FROM hf_listing_call_requests WHERE buyer_user_id = ? OR seller_user_id = ?", [buyerId, sellerId]);
    if (listingIds.length) await pool.query("DELETE FROM hf_listings WHERE id IN (?)", [listingIds]);
    await pool.query("DELETE FROM audit_request_logs WHERE user_id IN (?, ?)", [buyerId, sellerId]);
    await pool.query("DELETE FROM users WHERE id IN (?, ?)", [buyerId, sellerId]);
  } finally {
    await app.close().catch(() => {});
    await pool.end().catch(() => {});
  }
}
