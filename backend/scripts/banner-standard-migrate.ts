import { pool } from '../src/db/client';
import { adFormat, adSlotProfile, AD_FORMATS } from '../../shared/banner-layout.mjs';
const apply = process.argv.includes('--apply');
const conn = await pool.getConnection();
try {
  const [rows]: any = await conn.query('SELECT * FROM hf_banners ORDER BY position,desktop_row,display_order,id');
  const [slots]: any = await conn.query('SELECT * FROM hf_ad_slots');
  const [columns]: any = await conn.query("SHOW COLUMNS FROM hf_banners LIKE 'ad_format'");
  const syncSlots = async () => {
    for (const slot of slots) {
      const profile=adSlotProfile(slot.slot_key);
      const size=profile.formats.map(format=>`${AD_FORMATS[format].previewWidth}×${AD_FORMATS[format].rows===2?576:280}`).join(' / ')+'; mobil 120 px';
      await conn.execute("UPDATE hf_ad_slots SET desktop_capacity=?,mobile_behavior='stack',recommended_size=?,aspect_ratio=NULL WHERE slot_key=?",[profile.formats.length===1?1:profile.columns===2?1:3,size,slot.slot_key]);
    }
  };
  if (columns.length && rows.every((r: any) => r.ad_format && r.grid_column)) { if(apply) { await Bun.write(`/tmp/banner-standard-slots-before-${Date.now()}.json`,JSON.stringify({rows,slots})); await conn.beginTransaction(); await syncSlots(); await conn.commit(); } console.log(JSON.stringify({ alreadyMigrated: true, count: rows.length,slotsSynced:apply })); process.exitCode=0; }
  else {
    const counters = new Map<string, number>();
    const changes = rows.map((row: any) => {
      const format = adFormat({ position:row.position, desktopColumns:row.desktop_columns });
      const key = `${row.position}:${row.desktop_row}`;
      const occupied = ['live','scheduled','reserved','payment_pending'].includes(row.lifecycle_status) && !row.archived_at;
      const offset = occupied ? counters.get(key) ?? 0 : 0;
      if (occupied) counters.set(key, offset+AD_FORMATS[format].columns);
      if (occupied && offset+AD_FORMATS[format].columns > adSlotProfile(row.position).columns) throw new Error(`Existing slot conflict: ${row.id}`);
      const config = typeof row.creative_config === 'string' ? JSON.parse(row.creative_config) : row.creative_config ?? {};
      let image=row.image_url, caption=row.caption;
      if (row.advertiser === 'VistaSeeds') Object.assign(config,{logoUrl:'/assets/ads/vistaseeds/logo-white.png',backgroundColor:'#1f4d2b',textColor:'#ffffff',accentColor:'#e8c766',imageFit:'contain',description:'Profesyonel üretim için hibrit sebze tohumu çeşitleri.'}), image='/assets/ads/vistaseeds/cankan-f1.webp';
      if (row.advertiser === 'Bereket Fide') { Object.assign(config,{logoUrl:config.logoUrl||'/uploads/ads/bereketfide-amblem.png',backgroundColor:'#1f4d2b',textColor:'#ffffff',accentColor:'#e8c766',description:config.description||'Aşılı ve aşısız sebze fidesi üretimi.'}); if (/^Bu ürünün fidesi bizde$/i.test(caption||'')) caption='Sebze fidesi için Bereket Fide'; }
      if (row.advertiser === 'GZL Teknoloji') { Object.assign(config,{logoUrl:'/images/sponsors/gzl-logo.png',backgroundColor:'#081e32',textColor:'#ffffff',accentColor:'#dfbd70',description:'Web sitesi · Özel yazılım · Otomasyon',action:'quote'});image='/images/sponsors/gzl-devices.webp';caption='İşinizi dijitale taşıyın'; }
      if (row.advertiser === 'İhracat Radarı') Object.assign(config,{logoUrl:'/images/sponsors/ihracat-radari-logo-white.svg',backgroundColor:'#0a2246',textColor:'#ffffff',accentColor:'#18c8d8',mediaKind:'radar',description:'GTİP/HS Code ile ithalatçı firmaları listeleyin, yetkili kişiye ulaşın.'});
      return {id:row.id,format,gridColumn:offset+1,image,caption,config};
    });
    if (apply) {
      const backup=`/tmp/banner-standard-before-${Date.now()}.json`;
      await Bun.write(backup,JSON.stringify({rows,slots},null,2));
      // Expand first; legacy releases ignore these columns. Data conversion is atomic.
      if (!columns.length) await conn.query("ALTER TABLE hf_banners ADD COLUMN ad_format varchar(16) NULL, ADD COLUMN grid_column int NULL");
      await conn.beginTransaction();
      for (const c of changes) await conn.execute('UPDATE hf_banners SET ad_format=?,grid_column=?,image_url=?,caption=?,creative_config=? WHERE id=?',[c.format,c.gridColumn,c.image,c.caption,JSON.stringify(c.config),c.id]);
      await syncSlots();
      await conn.commit();
      await conn.query("ALTER TABLE hf_banners MODIFY ad_format varchar(16) NOT NULL DEFAULT 'full', MODIFY grid_column int NOT NULL DEFAULT 1");
      console.log(JSON.stringify({backup,applied:changes.map(({id,format,gridColumn})=>({id,format,gridColumn}))}));
    } else console.log(JSON.stringify({apply:false,changes:changes.map(({id,format,gridColumn})=>({id,format,gridColumn})),slots:slots.map((s:any)=>({key:s.slot_key,mode:s.delivery_mode,profile:adSlotProfile(s.slot_key)}))}));
  }
} catch (error) { await conn.rollback(); throw error; }
finally { conn.release(); await pool.end(); }
