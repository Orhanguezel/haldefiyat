/**
 * Publish the reviewed 2026 grape season analysis.
 *
 * Run from backend/:
 *   bun scripts/publish-grape-2026-analysis.ts          # dry-run
 *   bun scripts/publish-grape-2026-analysis.ts --apply  # publish/upsert
 *
 * This script does not send Telegram or social-media notifications.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { pool } from "../src/db/client";

const apply = process.argv.includes("--apply");
const slug = "uzum-fiyatlari-2026-sezon-analizi";
const title = "Üzüm Fiyatları 2026: Sezon Başında Hal Verileri, Rekolte ve Dünya Piyasası";
const summary = "2026'da üzüm üretimi düşük 2025 bazından toparlanırken yaş üzüm hal medyanı hasatla birlikte geriledi. Kuru üzümde yüksek rekolte, stok ve ihracat dengesi sezonun yönünü belirleyecek.";
const metaTitle = "Üzüm Fiyatları 2026: Sezon, Rekolte ve Dünya Analizi";
const metaDescription = "2026 üzüm sezonu başladı. Hal fiyatları, 2024-2026 karşılaştırması, TÜİK rekolte tahmini, kuru üzüm ihracatı ve dünya görünümü verilerle incelendi.";
const imageAlt = "Ege Bölgesi'nde 2026 üzüm hasadında Sultaniye ve siyah üzüm salkımları — yapay zekâ ile oluşturulmuş temsili görsel";
const ogImage = "/uploads/analysis-covers/2026-09-12/uzum-sezon-analizi-2026.webp";
const tags = ["üzüm", "üzüm fiyatları", "2026 sezon analizi", "çekirdeksiz üzüm", "kuru üzüm", "rekolte", "hal fiyatları"];
const content = readFileSync(new URL("../../reports/uzum-fiyatlari-2026-sezon-analizi-content.html", import.meta.url), "utf8").trim();

if (
  !content.includes("9.247")
  || !content.includes("47,50")
  || !content.includes("yaklaşık %20")
  || !content.includes("Kaynaklar")
) {
  throw new Error("Beklenen doğrulama işaretleri HTML içeriğinde bulunamadı");
}

const imageResponse = await fetch(`https://haldefiyat.com${ogImage}`, {
  method: "HEAD",
  signal: AbortSignal.timeout(15_000),
});
if (!imageResponse.ok || !imageResponse.headers.get("content-type")?.includes("image/webp")) {
  throw new Error(`Kapak görseli canlıda doğrulanamadı: HTTP ${imageResponse.status}`);
}

const connection = await pool.getConnection();
try {
  await connection.beginTransaction();
  const [beforeRows]: any = await connection.query(
    "SELECT id,status,published_at,og_image FROM hf_analysis_reports WHERE slug=? FOR UPDATE",
    [slug],
  );

  if (apply) {
    await connection.execute(
      `INSERT INTO hf_analysis_reports
        (slug,title,summary,meta_title,meta_description,image_alt,og_image,content,author,tags,iso_week,week_start,week_end,report_date,source,status,total_records,reviewed_at,published_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,'','2024-01-01','2026-09-12','2026-09-12','manual','published',9247,NOW(3),NOW(3))
       ON DUPLICATE KEY UPDATE
        title=VALUES(title), summary=VALUES(summary), meta_title=VALUES(meta_title),
        meta_description=VALUES(meta_description), image_alt=VALUES(image_alt),
        og_image=VALUES(og_image), content=VALUES(content), author=VALUES(author),
        tags=VALUES(tags), iso_week=VALUES(iso_week), week_start=VALUES(week_start),
        week_end=VALUES(week_end), report_date=VALUES(report_date), source='manual',
        status='published', total_records=VALUES(total_records), reviewed_at=NOW(3),
        published_at=COALESCE(published_at,NOW(3))`,
      [slug, title, summary, metaTitle, metaDescription, imageAlt, ogImage, content, "HaldeFiyat Veri Ekibi", JSON.stringify(tags)],
    );
  }

  const [afterRows]: any = await connection.query(
    "SELECT id,slug,title,status,published_at,og_image,total_records,CHAR_LENGTH(content) content_length FROM hf_analysis_reports WHERE slug=?",
    [slug],
  );

  if (apply) await connection.commit();
  else await connection.rollback();

  console.log(JSON.stringify({ apply, before: beforeRows[0] ?? null, after: afterRows[0] ?? null, notificationsSent: false }, null, 2));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
  await pool.end();
}
