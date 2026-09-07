/** Age-matched descriptive cohorts; not a causal comparison of formats. Read-only. */
import { pool } from '../../src/db/client';
import { getGscAuthHeaders, queryGsc, resolveGscSite } from '@agro/shared-backend/modules/searchConsole/service';
const [articles]:any=await pool.query("SELECT id,slug,source,published_at FROM hf_analysis_reports WHERE status='published' AND published_at IS NOT NULL ORDER BY published_at");
const site=(await resolveGscSite()).replace(/^"+|"+$/g,''),headers=await getGscAuthHeaders();
const finalThrough=new Date(Date.now()-3*86400000).toISOString().slice(0,10);
const out=[];
for(const a of articles){
 a.formatFromSlug = /aylik/.test(a.slug) ? 'monthly' : /hafta/.test(a.slug) ? 'weekly' : 'analysis';
 const startDate=new Date(a.published_at).toISOString().slice(0,10);
 const endDate=new Date(new Date(startDate+'T00:00:00Z').getTime()+27*86400000).toISOString().slice(0,10);
 if(endDate>finalThrough){out.push({...a,startDate,endDate,status:'waiting_28_complete_days'});continue;}
 try{
  const rows=await queryGsc(site,headers,{startDate,endDate,dimensions:['date'],type:'web',dataState:'final',rowLimit:100,dimensionFilterGroups:[{filters:[{dimension:'page',operator:'equals',expression:'https://haldefiyat.com/analiz/'+a.slug}]}]});
  const clicks=rows.reduce((n,r)=>n+Number(r.clicks||0),0),impressions=rows.reduce((n,r)=>n+Number(r.impressions||0),0);
  const pos=rows.reduce((n,r)=>n+Number(r.position||0)*Number(r.impressions||0),0);
  out.push({...a,startDate,endDate,status:'measured',daysWithReturnedData:rows.length,clicks,impressions,ctr:impressions?clicks/impressions:null,position:impressions?pos/impressions:null});
 }catch(e:any){out.push({...a,startDate,endDate,status:'error',error:e.message});}
}
console.log(JSON.stringify({checkedAt:new Date().toISOString(),finalThrough,method:'First 28 calendar days from recorded publication. Missing daily rows are not evidence of collection completeness. Formats/date cohorts are descriptive, not causal.',items:out},null,2));await pool.end();
