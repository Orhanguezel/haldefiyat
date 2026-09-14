/** Targeted editorial update; preserves draft/publication state. Run from backend/ with artifact directory. */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pool } from '../src/db/client';

const directory = resolve(process.argv[2]);
const before = JSON.parse(readFileSync(resolve(directory, 'before.json'), 'utf8'));
const patch = JSON.parse(readFileSync(resolve(directory, 'patch.json'), 'utf8'));
const apply = process.argv.includes('--apply');
const fields = ['title', 'summary', 'meta_title', 'meta_description', 'og_image', 'image_alt', 'tags', 'content'];
if (Object.keys(patch).sort().join() !== [...fields].sort().join()) throw new Error('Unexpected patch fields');
const image = await fetch(`https://haldefiyat.com${patch.og_image}`, { method: 'HEAD' });
if (!image.ok || !image.headers.get('content-type')?.includes('image/webp')) throw new Error('Cover unavailable');
const connection = await pool.getConnection();
try {
  await connection.beginTransaction();
  const [rows]: any = await connection.query('SELECT * FROM hf_analysis_reports WHERE id=36 FOR UPDATE');
  const row = rows[0];
  if (!row || row.slug !== before.slug || row.content !== before.content
    || new Date(row.updated_at).toISOString() !== before.updated_at || row.status !== 'draft') {
    throw new Error('Report changed since backup; aborting');
  }
  const [schedule]: any = await connection.query('SELECT * FROM hf_scheduled_publishes WHERE report_id=36');
  if (schedule.length) throw new Error('Report has a pending schedule; review required');
  if (apply) {
    await connection.execute(`UPDATE hf_analysis_reports SET ${fields.map(field => `${field}=?`).join(',')} WHERE id=36`,
      fields.map(field => field === 'tags' ? JSON.stringify(patch[field]) : patch[field]));
    const [afterRows]: any = await connection.query('SELECT * FROM hf_analysis_reports WHERE id=36');
    const after = afterRows[0];
    for (const field of fields) {
      const actual = field === 'tags' && typeof after[field] === 'string' ? JSON.parse(after[field]) : after[field];
      if (JSON.stringify(actual) !== JSON.stringify(patch[field])) throw new Error(`Field mismatch: ${field}`);
    }
    for (const field of Object.keys(row).filter(field => !fields.includes(field) && field !== 'updated_at')) {
      if (JSON.stringify(row[field]) !== JSON.stringify(after[field])) throw new Error(`Unintended change: ${field}`);
    }
    await connection.commit();
    writeFileSync(resolve(directory, 'after.json'), JSON.stringify(after, null, 2));
  } else await connection.rollback();
  console.log(JSON.stringify({ apply, id: 36, status: row.status, title: patch.title, coverHttpStatus: image.status, fields, otherFieldsPreserved: true }));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
  await pool.end();
}
