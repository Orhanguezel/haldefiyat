import { pool } from './src/db/client';
import { readFileSync } from 'node:fs';
import { submitToIndexNow } from './src/modules/indexnow';
const data = JSON.parse(readFileSync('/tmp/hal-editorial-2026-09-07-payload.json','utf8'));
const originals = JSON.parse(readFileSync('/tmp/hal-editorial-2026-09-07-before.json','utf8'));
const connection = await pool.getConnection();
try {
 await connection.beginTransaction();
 const [rows]: any = await connection.query('SELECT * FROM hf_analysis_reports WHERE id=29 FOR UPDATE');
 const original = originals.find((r:any)=>r.id===29);
 if(rows.length!==1 || rows[0].status!=='draft' || rows[0].content!==original.content || rows[0].title!==original.title) throw Error('Weekly draft changed; refusing to overwrite');
 const w=data.weekly, c=data.cotton;
 const [duplicate]:any=await connection.query('SELECT id FROM hf_analysis_reports WHERE slug IN (?,?)',[w.slug,c.slug]);
 if(duplicate.length) throw Error('Target slug already exists');
 const [author]:any=await connection.query('SELECT id,full_name FROM hf_authors WHERE id=?',[rows[0].author_id]);
 if(!author.length) throw Error('Existing author missing');
 await connection.execute("UPDATE hf_analysis_reports SET slug=?,title=?,summary=?,content=?,meta_title=?,meta_description=?,image_alt=?,total_records=?,status='published',reviewed_at=NOW(3),published_at=NOW(3) WHERE id=29",[w.slug,w.title,w.summary,w.content,w.metaTitle,w.metaDescription,w.title,w.totalRecords]);
 const [result]:any=await connection.execute("INSERT INTO hf_analysis_reports (slug,title,summary,content,meta_title,meta_description,image_alt,author,author_id,tags,iso_week,week_start,week_end,report_date,source,status,total_records,reviewed_at,published_at) VALUES (?,?,?,?,?,?,?,?,?,?,'2026-37','2026-09-07','2026-09-07','2026-09-07','manual','published',0,NOW(3),NOW(3))",[c.slug,c.title,c.summary,c.content,c.metaTitle,c.metaDescription,c.title,author[0].full_name,author[0].id,JSON.stringify(c.tags)]);
 await connection.commit();
 console.log(JSON.stringify({published:[{id:29,slug:w.slug},{id:result.insertId,slug:c.slug}]}));
 try { console.log('IndexNow',JSON.stringify(await submitToIndexNow([`/analiz/${w.slug}`,`/analiz/${c.slug}`]))); } catch(error) {console.log('IndexNow submission failed');}
} catch(error) { await connection.rollback(); throw error; }
finally { connection.release(); await pool.end(); }
