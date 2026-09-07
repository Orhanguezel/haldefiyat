import { pool } from '../../../src/db/client';
const rows = await Bun.file(process.argv[2]!).json();
const fields = ['about_md','price_factors_md','season_md','production_region_md','quality_indicators_md','culinary_uses_md'];
const conn = await pool.getConnection();
try {await conn.beginTransaction();for(const row of rows) {
 if (!['limon','limon-mayer','domates-salcalik','uzum'].includes(row.product_slug)) throw new Error('Unexpected product');
 const [result]:any = await conn.query(`UPDATE hf_product_editorial SET ${fields.map(f=>`${f}=?`).join(',')}, source='manual', reviewed_by=NULL, reviewed_at=NULL, updated_at=NOW(3) WHERE product_slug=? AND published_at IS NOT NULL`, [...fields.map(f=>row[f]),row.product_slug]);
 if (result.affectedRows !== 1) throw new Error('Published editorial missing: '+row.product_slug);
}await conn.commit();console.log('Updated four existing published editorials');}catch(e){await conn.rollback();throw e;}finally{conn.release();await pool.end();}
