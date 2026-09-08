/** Replay only the source-named mandarin varieties; never replace missing quotes. */
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pool } from '../../../src/db/client';
import { parseAdanaBulletin } from '../../../src/modules/etl/sources/municipality/adana';
import { upsertPriceRow } from '../../../src/modules/prices/repository';
const dir = resolve(process.argv[2]!);
const apply = process.argv.includes('--apply');
const targets: Record<string, string> = {
  'MANDALİNA(W WMOURKUT)': 'mandalina-w-wmourkut',
  'MANDALİNA(MANDORA)': 'mandalina-mandora',
};
const manifest = await Bun.file(resolve(dir,'manifest.json')).json();
const rows: any[] = [];
for (const doc of manifest) {
 const bytes = await Bun.file(resolve(dir,doc.file)).arrayBuffer();
 if (createHash('sha256').update(Buffer.from(bytes)).digest('hex') !== doc.sha256) throw new Error('Checksum mismatch');
 for (const r of parseAdanaBulletin(Buffer.from(bytes).toString('utf8'))) {
  if (targets[r.name]) rows.push({...r,slug:targets[r.name],sourceUrl:doc.url});
 }
}
console.log(JSON.stringify({apply,rows:rows.length,dates:[...new Set(rows.map(r=>r.recordedDate))].sort(),sourceNames:Object.keys(targets)}));
if (apply) {
 const [markets]:any = await pool.query('SELECT id FROM hf_markets WHERE slug=? AND source_key=?',['adana-hal','adana_resmi']);
 if (markets.length!==1) throw new Error('Official Adana market missing');
 for (const [name,slug] of Object.entries(targets)) {
  await pool.query(`INSERT INTO hf_products (slug,name_tr,display_name,unit,category_slug,canonical_slug,seo_index,is_active) VALUES (?,?,?,'kg','meyve','mandalina',0,1) ON DUPLICATE KEY UPDATE slug=VALUES(slug)`,[slug,name,name]);
  const [products]:any=await pool.query('SELECT id,name_tr,unit,canonical_slug FROM hf_products WHERE slug=?',[slug]);
  const p=products[0];if(p.name_tr!==name||p.unit!=='kg'||p.canonical_slug!=='mandalina')throw new Error('Unexpected target identity');
  for(const r of rows.filter(r=>r.slug===slug))await upsertPriceRow({productId:p.id,marketId:markets[0].id,minPrice:String(r.min),maxPrice:String(r.max),avgPrice:String((r.min+r.max)/2),recordedDate:r.recordedDate,sourceApi:'adana_resmi',unit:'kg'});
 }
 console.log('Applied through shared price-quality guards; source names preserved.');
}
await pool.end();
