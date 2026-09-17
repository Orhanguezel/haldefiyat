import {pool} from './src/db/client';
const before=await Bun.file('/tmp/banner-standard-before-1789567025696.json').json();
const [rows]:any=await pool.query('SELECT * FROM hf_banners ORDER BY id');
const unchanged=['advertiser','position','desktop_row','is_active','lifecycle_status','start_at','end_at','payment_status','total_amount','paid_amount','invoice_number','listing_id','firm_id','link_url'];
const diffs=[];
for(const old of before.rows){const row=rows.find((r:any)=>r.id===old.id);if(!row){diffs.push({id:old.id,missing:true});continue;}for(const key of unchanged)if(JSON.stringify(row[key])!==JSON.stringify(old[key]))diffs.push({id:old.id,field:key});if(row.impressions<old.impressions||row.clicks<old.clicks)diffs.push({id:old.id,metricsDecreased:true});}
console.log(JSON.stringify({beforeCount:before.rows.length,afterCount:rows.length,active:rows.filter((r:any)=>r.is_active).map((r:any)=>r.id),diffs}));await pool.end();
