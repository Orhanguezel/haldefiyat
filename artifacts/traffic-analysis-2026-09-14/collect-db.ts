import {pool} from '/var/www/tarim-dijital-ekosistem/projects/hal-fiyatlari/backend/src/db/client';
const out:any={checkedAt:new Date().toISOString(),periods:{}};
for(const [name,start,end]of [['current','2026-08-31','2026-09-14'],['previous','2026-08-17','2026-08-31'],['baseline','2026-08-19','2026-08-31']]){
 const q:Record<string,string>={
 users:'SELECT COUNT(*) n FROM users WHERE created_at>=? AND created_at<?',
 newsletter:'SELECT COUNT(*) n,SUM(is_verified=1) verified FROM newsletter_subscribers WHERE created_at>=? AND created_at<?',
 cta:'SELECT placement,event,COUNT(*) n,COUNT(DISTINCT visitor_hash,DATE(created_at)) visitor_days FROM hf_cta_events WHERE created_at>=? AND created_at<? GROUP BY placement,event',
 banners:'SELECT SUM(impressions) impressions,SUM(clicks) clicks FROM hf_banner_daily_metrics WHERE metric_date>=? AND metric_date<?',
 payments:'SELECT currency,transaction_type,COUNT(*) n,SUM(amount) amount FROM hf_ad_payments WHERE paid_at>=? AND paid_at<? GROUP BY currency,transaction_type',
 claims:'SELECT status,COUNT(*) n FROM hf_firm_claims WHERE created_at>=? AND created_at<? GROUP BY status',
 listings:'SELECT status,COUNT(*) n FROM hf_listings WHERE created_at>=? AND created_at<? GROUP BY status',
 inquiries:'SELECT COUNT(*) n FROM hf_listing_inquiries WHERE created_at>=? AND created_at<?',
 calls:'SELECT COUNT(*) n FROM hf_listing_call_requests WHERE created_at>=? AND created_at<?',
 articles:'SELECT id,title,status,published_at FROM hf_analysis_reports WHERE published_at>=? AND published_at<?',
 etl:'SELECT status,COUNT(*) n,SUM(rows_fetched) fetched,SUM(rows_inserted) inserted,SUM(rows_fetched=0) empty_fetch FROM hf_etl_runs WHERE created_at>=? AND created_at<? GROUP BY status',
 etlSources:'SELECT source_api,status,COUNT(*) n,SUM(rows_fetched) fetched,SUM(rows_inserted) inserted FROM hf_etl_runs WHERE created_at>=? AND created_at<? GROUP BY source_api,status',
 prices:'SELECT COUNT(*) n,COUNT(DISTINCT market_id) markets,SUM(avg_price_method="midpoint") midpoint FROM hf_price_history WHERE recorded_date>=? AND recorded_date<?',
 quarantine:'SELECT reason_code,COUNT(*) n FROM hf_price_quarantine WHERE created_at>=? AND created_at<? GROUP BY reason_code',
 };
 const p:any={start,end};for(const[k,sql]of Object.entries(q)){try{const[r]=await pool.query(sql,[start,end]);p[k]=r;}catch(e:any){p[k]={error:e.message};}}out.periods[name]=p;
}
for(const[k,sql]of Object.entries({
 currentListings:'SELECT status,COUNT(*) n,SUM(valid_until>=NOW()) unexpired FROM hf_listings GROUP BY status',
 latestPrices:'SELECT source_api,MAX(recorded_date) latest,COUNT(*) n FROM hf_price_history WHERE recorded_date>="2026-08-01" GROUP BY source_api',
 catalog:'SELECT COUNT(*) total,SUM(seo_index=1) indexed FROM hf_products',
 latestReports:'SELECT id,title,status,report_date FROM hf_analysis_reports ORDER BY id DESC LIMIT 6',
 newsletterTotal:'SELECT COUNT(*) total,SUM(unsubscribed_at IS NULL) subscribed FROM newsletter_subscribers',
})){try{const[r]=await pool.query(sql);out[k]=r;}catch(e:any){out[k]={error:e.message};}}
console.log(JSON.stringify(out,null,2));await pool.end();
