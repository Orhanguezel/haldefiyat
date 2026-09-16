/** Restore creative/layout metadata only. Metrics, payments and lifecycle changes are never overwritten. */
import { pool } from '../src/db/client';
const path=process.argv.find(arg=>arg.endsWith('.json'));
if(!path) throw new Error('Usage: bun scripts/banner-standard-rollback.ts /tmp/banner-standard-before-....json [--apply]');
const backup=await Bun.file(path).json();
if(!process.argv.includes('--apply')) { console.log(JSON.stringify({apply:false,banners:backup.rows.length,slots:backup.slots.length})); await pool.end(); }
else {
 const conn=await pool.getConnection();
 try {
  await conn.beginTransaction();
  for(const r of backup.rows) await conn.execute('UPDATE hf_banners SET ad_format=?,grid_column=?,image_url=?,caption=?,creative_config=? WHERE id=?',[r.ad_format||'full',r.grid_column||1,r.image_url,r.caption,typeof r.creative_config==='string'?r.creative_config:JSON.stringify(r.creative_config),r.id]);
  for(const s of backup.slots) await conn.execute('UPDATE hf_ad_slots SET desktop_capacity=?,mobile_behavior=?,recommended_size=?,aspect_ratio=? WHERE slot_key=?',[s.desktop_capacity,s.mobile_behavior,s.recommended_size,s.aspect_ratio,s.slot_key]);
  await conn.commit();console.log('Restored metadata; restore prior application releases before resuming writes.');
 } catch(error) {await conn.rollback();throw error;} finally {conn.release();await pool.end();}
}
