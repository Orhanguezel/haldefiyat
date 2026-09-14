import { pool } from "../src/db/client";

const ADVERTISER = "İhracat Radarı";
const SITE = "https://ihracatradari.com.tr";

/** Platform işletmecisinin kendi ikinci sitesi; bedelsiz kurum içi reklam. */
const PLACEMENTS = [
  {
    position: "listing_detail_sidebar",
    caption: "İlanınızın alıcısı yurt dışında olabilir",
    ctaLabel: "Alıcıları keşfet",
    linkUrl: `${SITE}/tr/hizmetler/urun-adina-gore-ithalatci-firma-bulma`,
  },
  {
    position: "firm_detail_sidebar",
    caption: "Yurt dışı alıcınızı veriden bulun",
    ctaLabel: "İthalatçıları gör",
    linkUrl: `${SITE}/tr/hizmetler/gtip-hs-koduna-gore-musteri-bulma`,
  },
  {
    position: "global_footer",
    caption: "Ürününüzün yurt dışı alıcısını bulun",
    ctaLabel: "Alıcıları keşfet",
    linkUrl: `${SITE}/tr`,
  },
] as const;

const conn = await pool.getConnection();
const report: unknown[] = [];
try {
  await conn.beginTransaction();
  for (const placement of PLACEMENTS) {
    const [existing]: any = await conn.query(
      "SELECT id, is_active FROM hf_banners WHERE advertiser=? AND position=? FOR UPDATE",
      [ADVERTISER, placement.position],
    );
    if (existing.length) {
      report.push({ position: placement.position, skipped: existing[0].id });
      continue;
    }
    const [rows]: any = await conn.query(
      "SELECT COALESCE(MAX(desktop_row),0)+1 AS nextRow FROM hf_banners WHERE position=? AND is_active=1",
      [placement.position],
    );
    const [result]: any = await conn.execute(
      `INSERT INTO hf_banners
        (position, title, advertiser, notes, type, source_type, lifecycle_status, payment_status, total_amount,
         creative_template, image_url, alt, link_url, link_target, rel, caption, cta_label,
         device, desktop_row, desktop_columns, is_active)
       VALUES (?, ?, ?, ?, 'image', 'custom', 'live', 'waived', 0,
               'image', NULL, ?, ?, '_blank', 'sponsored nofollow noopener', ?, ?,
               'all', ?, 1, 1)`,
      [
        placement.position,
        `${ADVERTISER} — ${placement.caption}`,
        ADVERTISER,
        "Platform işletmecisinin ikinci sitesi; bedelsiz kurum içi reklam. 15 Eylül 2026 kullanıcı talebi.",
        `${ADVERTISER}: dış ticaret verisiyle yurt dışı alıcı bulma platformu.`,
        placement.linkUrl,
        placement.caption,
        placement.ctaLabel,
        rows[0].nextRow,
      ],
    );
    report.push({ position: placement.position, created: result.insertId, row: rows[0].nextRow });
  }
  await conn.commit();
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  await conn.rollback();
  throw error;
} finally {
  conn.release();
  await pool.end();
}
