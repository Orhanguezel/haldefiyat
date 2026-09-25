/**
 * Run from backend/:
 *   bun scripts/update-analysis-report-37-cover.ts
 *   bun scripts/update-analysis-report-37-cover.ts --apply
 *
 * The weekly generator owns the report text and metrics. This script only
 * attaches the approved cover and its disclosure after the draft refresh.
 */
import { pool } from "../src/db/client";

const REPORT_ID = 37;
const EXPECTED_SLUG = "eylul-3-hafta-2026-hal-raporu";
const COVER_PATH = "/uploads/analysis-covers/2026-09-21/hal-raporu-14-20-eylul-2026.webp";
const IMAGE_ALT = "Kasalar içinde sivri biber, portakal, limon ve üzüm bulunan temsili toptancı hali görünümü";
const DISCLOSURE = `<p class="note"><strong>Görsel notu:</strong> Kapak görseli, bu raporda öne çıkan ürünleri temsilen yapay zekâ ile üretilmiştir; gerçek bir hal ya da olayın belgesel kaydı değildir.</p>`;

const apply = process.argv.includes("--apply");
const response = await fetch(`https://haldefiyat.com${COVER_PATH}`, {
  method: "HEAD",
  signal: AbortSignal.timeout(15_000),
});
if (!response.ok || !response.headers.get("content-type")?.includes("image/webp")) {
  throw new Error(`Cover is not publicly available: ${response.status} ${response.headers.get("content-type")}`);
}

const connection = await pool.getConnection();
try {
  await connection.beginTransaction();
  const [rows]: any = await connection.query(
    `SELECT id, slug, status, published_at, og_image, image_alt, content,
            CHAR_LENGTH(content) AS content_length
       FROM hf_analysis_reports
      WHERE id = ? FOR UPDATE`,
    [REPORT_ID],
  );
  const row = rows[0];
  if (!row || row.slug !== EXPECTED_SLUG) throw new Error("Report identity changed");
  if (row.status !== "draft" || row.published_at != null) throw new Error("Report is no longer an unpublished draft");

  const content = String(row.content ?? "");
  const nextContent = content.includes("<strong>Görsel notu:</strong>")
    ? content
    : `${content.trim()}\n\n${DISCLOSURE}`;

  if (apply) {
    await connection.query(
      `UPDATE hf_analysis_reports
          SET og_image = ?, image_alt = ?, content = ?
        WHERE id = ? AND status = 'draft' AND published_at IS NULL`,
      [COVER_PATH, IMAGE_ALT, nextContent, REPORT_ID],
    );
    const [afterRows]: any = await connection.query(
      `SELECT id, slug, status, published_at, og_image, image_alt,
              CHAR_LENGTH(content) AS content_length
         FROM hf_analysis_reports WHERE id = ?`,
      [REPORT_ID],
    );
    const after = afterRows[0];
    if (after.status !== "draft" || after.published_at != null || after.og_image !== COVER_PATH) {
      throw new Error("Draft/status/cover invariant failed");
    }
    await connection.commit();
    console.log(JSON.stringify({ apply, before: {
      status: row.status,
      publishedAt: row.published_at,
      ogImage: row.og_image,
      imageAlt: row.image_alt,
      contentLength: row.content_length,
    }, after }, null, 2));
  } else {
    await connection.rollback();
    console.log(JSON.stringify({ apply, reportId: REPORT_ID, slug: row.slug,
      status: row.status, publishedAt: row.published_at, publicCoverVerified: true,
      beforeOgImage: row.og_image, nextOgImage: COVER_PATH,
      disclosureWillBeAdded: nextContent !== content,
    }, null, 2));
  }
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
  await pool.end();
}
