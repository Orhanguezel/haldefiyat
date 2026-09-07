import { pool } from '../../src/db/client';
const queries: Record<string,string> = {
 articles: `SELECT id,slug,title,status,published_at,meta_title,meta_description FROM hf_analysis_reports ORDER BY id`,
 redirects: `SELECT * FROM hf_redirects WHERE source_path LIKE '%elma%'`,
 settings: `SELECT \`key\`,value FROM site_settings WHERE \`key\` IN ('ga4_measurement_id','ga4_property_id','contact_address','company_address','site_address','gsc_site_url')`,
 etlColumns: `SHOW COLUMNS FROM hf_etl_runs`,
 etlSummary: `SELECT CASE WHEN created_at < '2026-08-19' THEN 'Aug07-18' WHEN created_at < '2026-08-31' THEN 'Aug19-30' ELSE 'Aug31-Sep08' END period, source_api,status,COUNT(*) runs,SUM(rows_fetched) fetched,SUM(rows_inserted) inserted,LEFT(MAX(error_msg),600) sample_error FROM hf_etl_runs WHERE created_at >= '2026-08-07' AND created_at < '2026-09-09' GROUP BY period,source_api,status`,
 markets: `SELECT m.slug,MAX(p.recorded_date) latest,COUNT(DISTINCT p.recorded_date) days,COUNT(*) rows_n FROM hf_markets m JOIN hf_price_history p ON p.market_id=m.id WHERE m.slug IN ('kayseri-hal','adana-hal','mersin-hal','kocaeli-hal','istanbul-hal') AND p.recorded_date >= '2026-06-01' GROUP BY m.slug`,
};
const out: Record<string,unknown> = {checkedAt:new Date().toISOString()};
for (const [key,sql] of Object.entries(queries)) {try {const [rows]=await pool.query(sql);out[key]=rows;}catch(e:any){out[key]={error:e.message};}}
console.log(JSON.stringify(out,null,2));await pool.end();
