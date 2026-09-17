import {pool} from '/var/www/tarim-dijital-ekosistem/projects/hal-fiyatlari/backend/src/db/client';
const out:any={checkedAt:new Date().toISOString()};
for(const[k,q]of Object.entries({sites:'SELECT * FROM hf_competitor_sites',runs:'SELECT * FROM hf_competitor_serp_runs ORDER BY id DESC LIMIT 15',snapshots:'SELECT * FROM hf_competitor_snapshots WHERE checked_at>="2026-09-07" ORDER BY checked_at DESC LIMIT 60',results:'SELECT * FROM hf_competitor_serp_results WHERE run_id IN (SELECT id FROM hf_competitor_serp_runs WHERE started_at>="2026-09-07") ORDER BY run_id DESC,query,position'})){const[r]=await pool.query(q);out[k]=r;}
await Bun.write('/tmp/hf-competitor-review-20260914.json',JSON.stringify(out,null,2));await pool.end();
