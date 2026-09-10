import { randomUUID } from "node:crypto";
import { pool } from "../../src/db/client";
import { updateOwnerListing, getListingCreative } from "../../src/modules/listings/repo";
if (process.env.QA_ALLOW_MUTATION !== "1") throw new Error("Requires QA_ALLOW_MUTATION=1");
const owner = randomUUID();
let listingId = 0;
const checks: string[] = [];
function check(ok: unknown, message: string) { if (!ok) throw new Error(message); checks.push(message); }
try {
  await pool.execute("INSERT INTO users (id,email,password_hash,full_name,is_active) VALUES (?,?,'qa-no-login','QA Owner Edit',1)", [owner, `${owner}@invalid.haldefiyat.local`]);
  const [insert] = await pool.execute("INSERT INTO hf_listings (slug,user_id,product_name,title,valid_until,status,source) VALUES (?,?,'QA','QA Owner Edit',DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY),'pending','user')", [`qa-edit-${owner}`, owner]);
  listingId = Number((insert as { insertId: number }).insertId);
  await updateOwnerListing(listingId, owner, { images: ["/uploads/listings/qa-first.webp", "/uploads/listings/qa-second.webp"] });
  check((await getListingCreative(listingId))?.images.length === 2, "Owner image addition persists");
  check(await updateOwnerListing(listingId, randomUUID(), { images: [] }) === null, "Other user cannot edit");
  check((await getListingCreative(listingId))?.images.length === 2, "Unauthorized edit preserves images");
  await updateOwnerListing(listingId, owner, { title: "QA Updated title" });
  check((await getListingCreative(listingId))?.images.length === 2, "Text-only patch preserves images");
  await updateOwnerListing(listingId, owner, { images: ["/uploads/listings/qa-second.webp", "/uploads/listings/qa-first.webp"] });
  check((await getListingCreative(listingId))?.images[0]?.endsWith("qa-second.webp"), "Cover order persists");
  await updateOwnerListing(listingId, owner, { images: [] });
  const result = await getListingCreative(listingId);
  check(result?.images.length === 0 && result.status === "pending", "Image removal persists and requires moderation");
  console.log(JSON.stringify({ checks, passed: checks.length }));
} finally {
  if (listingId) { await pool.execute("DELETE FROM hf_listing_images WHERE listing_id=?", [listingId]); await pool.execute("DELETE FROM hf_listings WHERE id=?", [listingId]); }
  await pool.execute("DELETE FROM users WHERE id=?", [owner]);
  await pool.end();
}
