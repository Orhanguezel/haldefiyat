/** bun scripts/cotton-series/import.ts /absolute/data/cotton-series [--apply]
 * Schema setup is additive; --apply imports only the validated collector output.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { pool } from '../../src/db/client';
const dir=resolve(process.argv[2] || '');
const rows=JSON.parse(readFileSync(resolve(dir,'observations.json'),'utf8')) as Record<string,unknown>[];
const coverage=JSON.parse(readFileSync(resolve(dir,'coverage.json'),'utf8')) as Record<string,unknown>[];
if(!rows.length || coverage.some(x=>x.status==='error')) throw Error('Incomplete collection; import refused');
const fields=['observation_id','series_id','source','period_start','period_end','period_complete','product','cotton_form','sale_type','payment_type','price_basis','unit','average_method','min_price','max_price','avg_price','quantity_kg','turnover_try','transaction_count','derived_weighted_price','source_url','source_sha256','raw_line','parser_version'];
const seen=new Set();
for(const row of rows){
 if(seen.has(row.observation_id))throw Error('Duplicate observation');seen.add(row.observation_id);
 if(!['sutb','itb'].includes(String(row.source)) || row.unit!=='TRY/kg' || !/^\d{4}-\d{2}-\d{2}$/.test(String(row.period_start)) || !/^\d{4}-\d{2}-\d{2}$/.test(String(row.period_end)))throw Error('Invalid dimensions');
 if(!(Number(row.min_price)>0 && Number(row.max_price)>=Number(row.avg_price) && Number(row.avg_price)>=Number(row.min_price)))throw Error('Invalid price bounds');
 const raw=readFileSync(resolve(dir,'raw',createHash('sha256').update(String(row.source_url)).digest('hex')));
 if(createHash('sha256').update(raw).digest('hex')!==row.source_sha256)throw Error('Raw evidence hash mismatch');
}
console.log(JSON.stringify({validatedRows:rows.length,apply:process.argv.includes('--apply')}));
try{
 if(process.argv.includes('--apply')){
  const ddl=readFileSync(new URL('../../src/db/seed/sql/098_cotton_monthly_series.sql',import.meta.url),'utf8');
  await pool.query(ddl);
  const conn=await pool.getConnection();
  try{
   await conn.beginTransaction();
   // Replace only successfully inspected source/month partitions, including prior partial snapshots.
   for(const c of coverage) await conn.execute("DELETE FROM hf_cotton_observations WHERE source=? AND period_start=?",[c.source,c.period_start]);
   for(const row of rows){
    await conn.execute(`INSERT INTO hf_cotton_observations (${fields.join(',')}) VALUES (${fields.map(()=>'?').join(',')}) ON DUPLICATE KEY UPDATE ${fields.filter(f=>f!=='observation_id').map(f=>`${f}=VALUES(${f})`).join(',')}`,
     fields.map(f=>row[f]===undefined?null:row[f]));
   }
   await conn.commit();
  }catch(e){await conn.rollback();throw e}finally{conn.release()}
  const [result]=await pool.query('SELECT source,COUNT(*) records,COUNT(DISTINCT series_id) series,MIN(period_start) first_period,MAX(period_end) last_period FROM hf_cotton_observations GROUP BY source');
  console.log(JSON.stringify(result));
 }
}finally{await pool.end()}
