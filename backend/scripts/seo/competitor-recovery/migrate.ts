import { pool } from '../../../src/db/client';
for (const [table,column,type] of [['hf_competitor_serp_runs','depth','INT'],['hf_competitor_serp_runs','gsc_start_date','DATE'],['hf_competitor_serp_runs','gsc_end_date','DATE'],['hf_competitor_serp_results','actual_engine','VARCHAR(16)']]) {
 const [rows]:any=await pool.query('SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?',[table,column]);
 if(!rows.length) await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${type} NULL`);
}console.log('Measurement migration ready');await pool.end();
