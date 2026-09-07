/** Uses connection-local temporary tables only; never seeds/drops production tables. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pool } from '../../src/db/client';
import { cleanSql, splitStatements } from '../../src/db/seed/utils';
const conn=await pool.getConnection();
try {
 const seed=readFileSync(process.env.SEED_QA_SQL_DIR ? resolve(process.env.SEED_QA_SQL_DIR,'097_competitor_discovery_schema.sql') : new URL('../../src/db/seed/sql/097_competitor_discovery_schema.sql',import.meta.url),'utf8')
  .replaceAll('CREATE TABLE IF NOT EXISTS','CREATE TEMPORARY TABLE IF NOT EXISTS')
  .replaceAll('hf_competitor_serp_runs','qa_serp_runs').replaceAll('hf_competitor_serp_results','qa_serp_results')
  .replace(/,\s*CONSTRAINT fk_serp_run[^\n]*/,'');
 const after=readFileSync(process.env.SEED_QA_SQL_DIR ? resolve(process.env.SEED_QA_SQL_DIR,'099_competitor_measurement.sql') : new URL('../../src/db/seed/sql/099_competitor_measurement.sql',import.meta.url),'utf8');
 for(let i=0;i<2;i++) for(const sql of splitStatements(cleanSql(seed+'\n'+after))) if(sql.trim()) await conn.query(sql);
 const [runs]:any=await conn.query('SHOW COLUMNS FROM qa_serp_runs');
 const [results]:any=await conn.query('SHOW COLUMNS FROM qa_serp_results');
 for(const key of ['depth','gsc_start_date','gsc_end_date'])if(!runs.some((r:any)=>r.Field===key&&r.Null==='YES'))throw Error('Missing nullable '+key);
 if(!results.some((r:any)=>r.Field==='actual_engine'&&r.Null==='YES'))throw Error('Missing actual engine');
 const [version]=await conn.query('SELECT VERSION() version');
 console.log(JSON.stringify({ok:true,repeatPasses:2,version,temporaryTablesOnly:true}));
}finally{conn.release();await pool.end();}
