/** Publish source-backed cotton dataset article and refresh the existing opening article.
 * Files must already be in the versioned public upload directory.
 * bun scripts/cotton-series/publish.ts ../data/cotton-series --apply
 */
import { pool } from '../../src/db/client';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { submitToIndexNow } from '../../src/modules/indexnow';
const dir=resolve(process.argv[2]);
const article=JSON.parse(readFileSync(resolve(dir,'publication.json'),'utf8'));
const opening=JSON.parse(readFileSync(resolve(dir,'opening-revised.json'),'utf8'));
if(Buffer.byteLength(article.content,'utf8')>65000)throw Error('Article exceeds TEXT column');
if(!process.argv.includes('--apply'))throw Error('Explicit --apply required');
const conn=await pool.getConnection();
try {
 await conn.beginTransaction();
 const [existing]:any=await conn.query('SELECT * FROM hf_analysis_reports WHERE id=30 FOR UPDATE');
 if(existing.length!==1 || existing[0].slug!=='pamuk-sezonu-2026-acilis-fiyati-2025-karsilastirmasi' || existing[0].status!=='published')throw Error('Unexpected opening article');
 const backup=resolve(dir,'opening-before-series.json');
 const { existsSync }=await import('node:fs');
 if(!existsSync(backup))writeFileSync(backup,JSON.stringify(existing,null,2));
 const [found]:any=await conn.query('SELECT * FROM hf_analysis_reports WHERE slug=? FOR UPDATE',[article.slug]);
 if(found.length)throw Error('Series article already exists; review before updating');
 await conn.execute("INSERT INTO hf_analysis_reports (slug,title,summary,content,meta_title,meta_description,image_alt,og_image,author,author_id,tags,iso_week,week_start,week_end,report_date,source,status,total_records,reviewed_at,published_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,'','2013-01-01','2026-09-07','2026-09-07','manual','published',0,NOW(3),NOW(3))",[article.slug,article.title,article.summary,article.content,article.metaTitle,article.metaDescription,article.title,article.ogImage,existing[0].author,existing[0].author_id,JSON.stringify(article.tags)]);
 await conn.execute("UPDATE hf_analysis_reports SET title=?,summary=?,content=?,meta_title=?,meta_description=?,image_alt=?,og_image=?,iso_week='',reviewed_at=NOW(3) WHERE id=30",[opening.title,opening.summary,opening.content,opening.metaTitle,opening.metaDescription,opening.title,article.ogImage]);
 await conn.commit();
 console.log(JSON.stringify({published:article.slug,updated:existing[0].slug}));
 console.log(JSON.stringify(await submitToIndexNow([`/analiz/${article.slug}`,`/analiz/${existing[0].slug}`])));
} catch(e){await conn.rollback();throw e}finally{conn.release();await pool.end()}
