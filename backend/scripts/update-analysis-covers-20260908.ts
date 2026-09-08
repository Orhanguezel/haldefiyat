/** Run from backend/: bun scripts/update-analysis-covers-20260908.ts [--apply] */
import { readFileSync } from 'node:fs';
import { pool } from '../src/db/client';
const mapping = JSON.parse(readFileSync(new URL('../../artifacts/analysis-covers-2026-09-08/mapping.json', import.meta.url), 'utf8'));
const apply = process.argv.includes('--apply');
const uniqueUrls: string[] = [...new Set<string>(mapping.map((r: any) => r.newOgImage))];
for (const url of uniqueUrls) {
  const response = await fetch(`https://haldefiyat.com${url}`, { method: 'HEAD', signal: AbortSignal.timeout(15000) });
  if (!response.ok || !response.headers.get('content-type')?.includes('image/webp')) throw new Error(`Missing image: ${url}`);
}
const connection = await pool.getConnection();
const changes: any[] = [];
try {
  await connection.beginTransaction();
  for (const item of mapping) {
    const [rows]: any = await connection.query('SELECT id,slug,og_image,image_alt,status,published_at,SHA2(content,256) AS content_hash FROM hf_analysis_reports WHERE id=? FOR UPDATE', [item.id]);
    const row = rows[0];
    if (!row || row.slug !== item.slug) throw new Error(`Report identity changed: ${item.id}`);
    if (row.og_image === item.newOgImage && row.image_alt === item.newImageAlt) continue;
    if (row.og_image !== item.og_image) throw new Error(`Cover changed since inventory: ${item.id}`);
    if (apply) {
      await connection.query('UPDATE hf_analysis_reports SET og_image=?,image_alt=? WHERE id=?', [item.newOgImage, item.newImageAlt, item.id]);
      const [after]: any = await connection.query('SELECT status,published_at,SHA2(content,256) AS content_hash FROM hf_analysis_reports WHERE id=?', [item.id]);
      if (JSON.stringify(after[0]) !== JSON.stringify({status:row.status,published_at:row.published_at,content_hash:row.content_hash})) throw new Error(`Content/status invariant failed: ${item.id}`);
    }
    changes.push({id:item.id,slug:item.slug,before:row.og_image,after:item.newOgImage});
  }
  if (apply) await connection.commit(); else await connection.rollback();
  console.log(JSON.stringify({apply,changed:changes.length,verifiedAssets:uniqueUrls.length,contentAndStatusPreserved:true,changes},null,2));
} catch (error) { await connection.rollback(); throw error; }
finally { connection.release(); await pool.end(); }
