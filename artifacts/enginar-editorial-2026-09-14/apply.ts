import {pool} from '/var/www/tarim-dijital-ekosistem/projects/hal-fiyatlari/backend/src/db/client';
import {revalidateFrontendTag} from '/var/www/tarim-dijital-ekosistem/projects/hal-fiyatlari/backend/src/core/revalidate';
const content=await Bun.file('/tmp/enginar-editorial-content.json').json();
const before=await Bun.file('/tmp/enginar-editorial-before.json').json();
const c=await pool.getConnection();
try{
 await c.beginTransaction();
 for(const e of content){
  const [rows]:any=await c.query('SELECT * FROM hf_product_editorial WHERE product_slug=? FOR UPDATE',[e.product_slug]);
  const old=before.editorial.find((x:any)=>x.product_slug===e.product_slug);
  if(Boolean(old)!==Boolean(rows[0]) || (old && old.about_md!==rows[0].about_md)) throw Error('Editorial changed since review');
  const fields=['about_md','price_factors_md','season_md','production_region_md','quality_indicators_md','culinary_uses_md'];
  await c.query(`INSERT INTO hf_product_editorial (product_slug,${fields.join(',')},related_slugs,source,reviewed_by,reviewed_at,published_at) VALUES (?,?,?,?,?,?,?,?,'ai_reviewed','codex',NOW(3),NOW(3)) ON DUPLICATE KEY UPDATE ${fields.map(k=>`${k}=VALUES(${k})`).join(',')},related_slugs=VALUES(related_slugs),source='ai_reviewed',reviewed_by='codex',reviewed_at=NOW(3),published_at=COALESCE(published_at,NOW(3))`,[e.product_slug,...fields.map(k=>e[k]),JSON.stringify(e.related_slugs)]);
 }
 const [gate]:any=await c.query(`SELECT COUNT(DISTINCT ph.market_id) markets, SUM(m.market_type='hal') halRows FROM hf_products p JOIN hf_products v ON v.id=p.id OR v.canonical_slug=p.slug JOIN hf_price_history ph ON ph.product_id=v.id AND ph.unit=v.unit JOIN hf_markets m ON m.id=ph.market_id WHERE p.slug='enginar-taze' AND v.is_active=1 AND ph.recorded_date>=DATE_SUB(CURDATE(),INTERVAL 30 DAY)`);
 if(gate[0].markets<3||gate[0].halRows<1)throw Error('Coverage gate failed');
 const [up]:any=await c.query("UPDATE hf_products p JOIN hf_product_editorial e ON e.product_slug=p.slug SET p.seo_index=1 WHERE p.slug='enginar-taze' AND p.is_active=1 AND p.canonical_slug IS NULL AND p.data_quality>=70 AND e.published_at IS NOT NULL");
 if(up.affectedRows!==1)throw Error('SEO gate failed');
 await c.commit();
 console.log(JSON.stringify({published:content.map((e:any)=>e.product_slug),seoEnabled:'enginar-taze',coverage:gate[0]}));
 await revalidateFrontendTag('prices');
}catch(e){await c.rollback();throw e}finally{c.release();await pool.end()}
