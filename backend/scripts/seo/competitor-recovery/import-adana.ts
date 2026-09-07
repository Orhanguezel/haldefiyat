import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pool } from '../../../src/db/client';
import { getSourceByKey } from '../../../src/config/etl-sources';
import { runSourceFetch } from '../../../src/modules/etl/fetcher';
import { parseAdanaBulletin } from '../../../src/modules/etl/sources/municipality/adana';
const dir = resolve(process.argv[2] ?? '');
const apply = process.argv.includes('--apply');
const manifest = JSON.parse(readFileSync(resolve(dir, 'manifest.json'), 'utf8')) as { url: string; file: string; sha256: string }[];
const docs = manifest.map(m => { const bytes = readFileSync(resolve(dir,m.file)); if (createHash('sha256').update(bytes).digest('hex') !== m.sha256) throw new Error('Archive checksum mismatch: '+m.file); return {...m,html:bytes.toString('utf8')}; }).map(m => ({...m, rows: parseAdanaBulletin(m.html)}))
  .filter(m => m.rows[0]!.recordedDate >= '2026-06-10' && m.rows[0]!.recordedDate <= '2026-09-07')
  .sort((a,b) => a.rows[0]!.recordedDate.localeCompare(b.rows[0]!.recordedDate));
if (!apply) { console.log(JSON.stringify({documents:docs.length,validRows:docs.reduce((n,d)=>n+d.rows.length,0),first:docs[0]?.rows[0]?.recordedDate,last:docs.at(-1)?.rows[0]?.recordedDate}));await pool.end();process.exit(0); }
await pool.query(`INSERT INTO hf_markets (slug,name,city_name,region_slug,source_key,market_type,seo_index,is_active) VALUES ('adana-hal','Adana Büyükşehir Belediyesi Toptancı Hali','Adana','akdeniz','adana_resmi','hal',1,1) ON DUPLICATE KEY UPDATE source_key=VALUES(source_key)`);
const source = getSourceByKey('adana_resmi');if (!source) throw new Error('Adana source missing');
// Replay captured official bytes through the existing normalization, review queue,
// unit/price-quality guards and idempotent upsert. No external price substitutions.
const realFetch = globalThis.fetch;
const cache = new Map(docs.map(m=>[m.url,m.html]));
globalThis.fetch = ((input: any, init: any) => {const url=String(input);return cache.has(url) ? Promise.resolve(new Response(cache.get(url),{status:200})) : realFetch(input,init);}) as typeof fetch;
try {for (const doc of docs) {
 const endpoint = new URL(doc.url).pathname;
 const result = await runSourceFetch({...source,endpointTemplate:endpoint,backfillEndpoint:endpoint},doc.rows[0]!.recordedDate,{backfill:true});
 console.log(JSON.stringify({date:doc.rows[0]!.recordedDate,...result}));
}} finally {globalThis.fetch=realFetch;await pool.end();}
