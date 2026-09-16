import { pool } from "../src/db/client";

// Dry-run by default. Preserve historical advertiser metrics by creating new IDs.
const apply = process.argv.includes("--apply");
const placements = [
  { oldId: 6, position: "home_mid", caption: "Ürününüzün yurt dışı alıcısını bulun" },
  { oldId: 3, position: "analiz_sidebar", caption: "Yeni ihracat pazarlarını keşfedin" },
];
const conn = await pool.getConnection();
try {
  await conn.beginTransaction();
  const [before]: any = await conn.query("SELECT * FROM hf_banners WHERE id IN (2,3,5,6,19,20,21) OR (advertiser='İhracat Radarı' AND position IN ('home_mid','analiz_sidebar')) FOR UPDATE");
  const changes = [];
  for (const placement of placements) {
    const source = before.find((row: any) => row.id === placement.oldId);
    if (!source || source.advertiser !== "VistaSeeds" || source.position !== placement.position || source.payment_status !== "waived") throw new Error("Unexpected source campaign");
    const existing = before.find((row: any) => row.advertiser === "İhracat Radarı" && row.position === placement.position);
    if (existing) {
      if (existing.is_active !== 1 || source.is_active !== 0) throw new Error("Unexpected existing placement state");
      changes.push({ position: placement.position, skipped: existing.id });
      continue;
    }
    if (source.is_active !== 1 || source.lifecycle_status !== "live") throw new Error("Source no longer live");
    const [insert]: any = await conn.execute(`INSERT INTO hf_banners
      (position,title,advertiser,notes,type,source_type,lifecycle_status,payment_status,total_amount,
       creative_template,alt,link_url,link_target,rel,caption,cta_label,device,desktop_row,desktop_columns,display_order,is_active)
      VALUES (?,?,'İhracat Radarı',?,'image','custom','live','waived',0,'image',?,?,'_blank',
       'sponsored nofollow noopener',?,'Alıcıları keşfet',?,?,?,?,1)`, [
      placement.position, `İhracat Radarı — ${placement.caption}`,
      `16 Eylül 2026 kullanıcı talebi; VistaSeeds #${source.id} yerine bedelsiz kurum içi reklam.`,
      "İhracat Radarı: dış ticaret verisiyle yurt dışı alıcı bulma platformu.",
      "https://ihracatradari.com.tr/tr/hizmetler/urun-adina-gore-ithalatci-firma-bulma",
      placement.caption, source.device, source.desktop_row, source.desktop_columns, source.display_order,
    ]);
    await conn.execute("UPDATE hf_banners SET is_active=0,lifecycle_status='completed' WHERE id=?", [source.id]);
    changes.push({ position: placement.position, replaced: source.id, created: insert.insertId });
  }
  for (const id of [2,5,19,20,21]) {
    if (before.find((row: any) => row.id === id)?.is_active !== 1) throw new Error(`Expected preserved campaign ${id}`);
  }
  // Share the footer row with VistaSeeds instead of consuming a second full row.
  await conn.execute("UPDATE hf_banners SET desktop_row=1,desktop_columns=2 WHERE id=21 AND advertiser='İhracat Radarı'");
  if (apply) {
    // Write rollback evidence before committing any changes.
    await Bun.write(`/tmp/hal-ihracat-expansion-before-${Date.now()}.json`, JSON.stringify({ before, changes }, null, 2));
    await conn.commit();
  } else await conn.rollback();
  console.log(JSON.stringify({ apply, changes }, null, 2));
} catch (error) {
  await conn.rollback();
  throw error;
} finally {
  conn.release();
  await pool.end();
}
