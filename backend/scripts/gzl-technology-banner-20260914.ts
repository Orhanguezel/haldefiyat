import { pool } from "../src/db/client";
const conn = await pool.getConnection();
try {
  await conn.beginTransaction();
  const [existing]: any = await conn.query("SELECT id,is_active FROM hf_banners WHERE advertiser=? AND link_url=? FOR UPDATE", ["GZL Teknoloji", "/gzl-teknoloji#teklif"]);
  if (existing.length) {
    console.log(JSON.stringify({ existing }));
  } else {
    const [rows]: any = await conn.query("SELECT COALESCE(MAX(desktop_row),0)+1 AS nextRow FROM hf_banners WHERE position='urun_sidebar'");
    const [result]: any = await conn.execute(`INSERT INTO hf_banners
      (position,title,advertiser,notes,type,source_type,lifecycle_status,payment_status,total_amount,image_url,alt,link_url,link_target,rel,cta_label,device,desktop_row,desktop_columns,is_active)
      VALUES ('urun_sidebar',?,'GZL Teknoloji',?,'image','custom','live','waived',0,?,?,?,'_self','sponsored nofollow','Teklif al','all',?,1,1)`,
      ["GZL Teknoloji — İşinizi dijitale taşıyın", "Platform işletmecisinin kendi hizmet tanıtımı; bedelsiz kurum içi reklam. 14 Eylül 2026 kullanıcı talebi.", "/images/sponsors/gzl-banner.png", "GZL Teknoloji: web sitesi, özel yazılım ve otomasyon. Teklif al.", "/gzl-teknoloji#teklif", rows[0].nextRow]);
    console.log(JSON.stringify({ created: result.insertId, position: "urun_sidebar", row: rows[0].nextRow }));
  }
  await conn.commit();
} catch (error) { await conn.rollback(); throw error; }
finally { conn.release(); await pool.end(); }
