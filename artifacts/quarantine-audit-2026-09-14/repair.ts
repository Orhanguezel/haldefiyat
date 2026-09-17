import {pool} from '/var/www/tarim-dijital-ekosistem/projects/hal-fiyatlari/backend/src/db/client';
const c=await pool.getConnection();
try {
 await c.beginTransaction();
 const variants=[['mantar-kasa','Mantar (Kasa)','MANTAR'],['marul-aysberg-kasa','Marul Aysberg (Kasa)','MARUL ( AYSBERG )'],['marul-kasik-kasa','Marul Kaşık (Kasa)','MARUL ( KAŞIK )'],['marul-lolorosso-kasa','Marul Lolorosso (Kasa)','MARUL ( LOLOROSSO )']];
 for(const [slug,name,alias] of variants){
  await c.query(`INSERT INTO hf_products(slug,name_tr,display_name,unit,category_slug,aliases,is_active,seo_index,data_quality) VALUES (?,?,?,'koli','sebze',?,1,0,0) ON DUPLICATE KEY UPDATE slug=VALUES(slug)`,[slug,name,name,JSON.stringify([alias])]);
 }
 const [rows]:any=await c.query(`SELECT q.* FROM hf_price_quarantine q JOIN hf_products p ON p.id=q.product_id WHERE q.source_api='bursa_resmi' AND q.recorded_date='2026-09-14' AND p.slug IN ('ithal-uskumru-koli','ithal-kalamar-koli') AND q.status='pending' FOR UPDATE`);
 const note='2026-09-15 resmi Bursa hal tablosuyla dogrulandi: uskumru 6000 TL/koli, kalamar 2500 TL/koli. Onceki 60/25 TL kayitlari eski yuzde-bir olcegi nedeniyle yanlis referans. Kg donusumu yapilmadi.';
 for(const q of rows){
  if(q.unit!=='koli'||!([6000,2500].includes(Number(q.avg_price)))||Number(q.min_price)!==Number(q.max_price))throw Error('Review guard');
  const [existing]:any=await c.query('SELECT * FROM hf_price_history WHERE product_id=? AND market_id=? AND recorded_date=? FOR UPDATE',[q.product_id,q.market_id,q.recorded_date]);
  await c.query(`INSERT INTO hf_price_history(product_id,market_id,min_price,max_price,avg_price,avg_price_method,currency,unit,recorded_date,source_api) VALUES (?,?,?,?,?,'midpoint','TRY',?,?,?) ON DUPLICATE KEY UPDATE min_price=VALUES(min_price),max_price=VALUES(max_price),avg_price=VALUES(avg_price),avg_price_method=VALUES(avg_price_method),unit=VALUES(unit),source_api=VALUES(source_api)`,[q.product_id,q.market_id,q.min_price,q.max_price,q.avg_price,q.unit,q.recorded_date,'bursa_resmi:reviewed']);
  const [after]:any=await c.query('SELECT * FROM hf_price_history WHERE product_id=? AND market_id=? AND recorded_date=?',[q.product_id,q.market_id,q.recorded_date]);
  await c.query("UPDATE hf_price_quarantine SET status='approved',review_note=?,reviewed_by='codex',reviewed_at=NOW(3) WHERE id=?",[note,q.id]);
  await c.query("INSERT INTO hf_price_quarantine_decisions(quarantine_id,action,before_price_json,after_price_json,note,reviewed_by) VALUES (?,'approve',?,?,?,'codex')",[q.id,existing[0]?JSON.stringify(existing[0]):null,JSON.stringify(after[0]),note]);
 }
 await c.commit();console.log(JSON.stringify({variants:variants.map(v=>v[0]),approved:rows.map((q:any)=>q.id)}));
}catch(e){await c.rollback();throw e}finally{c.release();await pool.end()}
