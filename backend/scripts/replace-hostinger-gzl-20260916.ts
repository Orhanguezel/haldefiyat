import { pool } from '../src/db/client';
const apply = process.argv.includes('--apply');
const conn = await pool.getConnection();
try {
  await conn.beginTransaction();
  const [rows]: any = await conn.query("SELECT * FROM hf_banners WHERE advertiser IN ('Hostinger','GZL Teknoloji') FOR UPDATE");
  const changes = [];
  for (const id of [8,9,10]) {
    const old = rows.find((r: any) => r.id === id);
    if (!old || old.advertiser !== 'Hostinger' || old.payment_status !== 'waived' || Number(old.total_amount) !== 0) throw new Error(`Unexpected source ${id}`);
    const marker = `Hostinger #${id} yerine; 16 Eylül 2026 kullanıcı talebi.`;
    const existing = rows.find((r: any) => r.advertiser === 'GZL Teknoloji' && r.notes?.includes(marker));
    if (existing) {
      if (old.is_active !== 0 || existing.is_active !== 1) throw new Error('Unexpected replacement state');
      changes.push({ oldId: id, newId: existing.id, position: old.position, unchanged: true });
      continue;
    }
    if (old.is_active !== 1 || old.lifecycle_status !== 'live') throw new Error(`Source not live ${id}`);
    const [insert]: any = await conn.execute(`INSERT INTO hf_banners
      (position,title,advertiser,notes,type,source_type,lifecycle_status,payment_status,total_amount,
       image_url,alt,link_url,link_target,rel,cta_label,device,desktop_row,desktop_columns,display_order,is_active)
      VALUES (?,?,'GZL Teknoloji',?,'image','custom','live','waived',0,
       '/images/sponsors/gzl-banner.png',?,'/gzl-teknoloji#teklif','_self','sponsored nofollow','Teklif al',?,?,?,?,1)`,
      [old.position,'GZL Teknoloji — İşinizi dijitale taşıyın',marker+' Bedelsiz kurum içi reklam.',
       'GZL Teknoloji: web sitesi, özel yazılım ve otomasyon. Teklif al.',old.device,old.desktop_row,old.desktop_columns,old.display_order]);
    await conn.execute("UPDATE hf_banners SET is_active=0,lifecycle_status='completed' WHERE id=?",[id]);
    changes.push({oldId:id,newId:insert.insertId,position:old.position});
  }
  if (apply) {
    await Bun.write(`/tmp/hal-hostinger-gzl-before-${Date.now()}.json`,JSON.stringify({before:rows,changes},null,2));
    await conn.commit();
  } else await conn.rollback();
  console.log(JSON.stringify({apply,changes}));
} catch (error) { await conn.rollback(); throw error; }
finally { conn.release(); await pool.end(); }
