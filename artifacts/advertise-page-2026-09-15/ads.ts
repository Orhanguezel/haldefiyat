import {pool} from '/var/www/tarim-dijital-ekosistem/projects/hal-fiyatlari/backend/src/db/client';
const [totals]=await pool.query("SELECT SUM(impressions) impressions,SUM(clicks) clicks,MIN(metric_date) firstDay,MAX(metric_date) lastDay FROM hf_banner_daily_metrics WHERE metric_date BETWEEN '2026-08-16' AND '2026-09-12'");
const [positions]=await pool.query("SELECT b.position,SUM(m.impressions) impressions,SUM(m.clicks) clicks FROM hf_banner_daily_metrics m JOIN hf_banners b ON b.id=m.banner_id WHERE m.metric_date BETWEEN '2026-08-16' AND '2026-09-12' GROUP BY b.position ORDER BY impressions DESC");
const [gzl]=await pool.query("SELECT id,title,position,impressions,clicks,is_active FROM hf_banners WHERE title LIKE '%GZL%'");
console.log(JSON.stringify({totals,positions,gzl}));await pool.end();
