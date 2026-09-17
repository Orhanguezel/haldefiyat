import { google } from 'googleapis';
import { createMarketingJwt, buildMarketingOAuthClient } from '/var/www/ekosistem-sosyal-medya/backend/src/modules/marketing/google-sa';
const out:any={checkedAt:new Date().toISOString(),site:'sc-domain:haldefiyat.com',property:'538279658'};
const auth=await createMarketingJwt('haldefiyat','gsc') ?? await buildMarketingOAuthClient('haldefiyat','gsc');
const gsc=google.webmasters({version:'v3',auth});
async function query(startDate:string,endDate:string,dimensions:string[]=[],dataState='final') {
 const rows:any[]=[];let extra:any={};
 for(let startRow=0;;startRow+=25000){
 const r=await gsc.searchanalytics.query({siteUrl:out.site,requestBody:{startDate,endDate,dimensions,dataState,type:'web',rowLimit:25000,startRow}});
 rows.push(...r.data.rows??[]);extra={metadata:r.data.metadata,responseAggregationType:r.data.responseAggregationType};
 if((r.data.rows?.length??0)<25000) break;
 }
 return {request:{startDate,endDate,dimensions,dataState,type:'web'},...extra,rows};
}
const shift=(date:string,n:number)=>new Date(Date.parse(date+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);
out.daily=await query('2026-08-01','2026-09-13',['date']);
out.fresh=await query('2026-09-07','2026-09-13',['date'],'all');
const cutoff=out.daily.rows.map((r:any)=>r.keys[0]).sort().at(-1);out.cutoff=cutoff;
const length=Math.round((Date.parse(cutoff)-Date.parse('2026-08-31'))/86400000)+1;
const windows:any={continuation:['2026-08-31',cutoff],previous:[shift('2026-08-31',-length),'2026-08-30'],last7:[shift(cutoff,-6),cutoff],prior7:[shift(cutoff,-13),shift(cutoff,-7)],baseline:['2026-08-19','2026-08-30']};
out.windows={};
for(const [name,range]of Object.entries(windows) as any){
 const [from,to]=range; const v:any={total:await query(from,to)};
 for(const dimension of ['page','query','device','country']) v[dimension]=await query(from,to,[dimension]);
 out.windows[name]=v;
}
try {out.sitemaps=(await gsc.sitemaps.list({siteUrl:out.site})).data;}catch(e:any){out.sitemaps={error:e.message};}
try {
 const gaAuth=await createMarketingJwt('haldefiyat','ga4')??await buildMarketingOAuthClient('haldefiyat','ga4');
 const ga=google.analyticsdata({version:'v1beta',auth:gaAuth});out.ga4={};
 for(const [name,from,to]of [['current','2026-08-31','2026-09-13'],['previous','2026-08-17','2026-08-30'],['baseline','2026-08-19','2026-08-30']]) {
  const metrics=['sessions','activeUsers','newUsers','screenPageViews','engagementRate','bounceRate','averageSessionDuration','keyEvents'];
  const requestBody={dateRanges:[{startDate:from,endDate:to}],metrics:metrics.map(name=>({name})),dimensionFilter:{filter:{fieldName:'hostName',inListFilter:{values:['haldefiyat.com','www.haldefiyat.com']}}}};
  out.ga4[name]={request:requestBody,data:(await ga.properties.runReport({property:'properties/538279658',requestBody})).data};
  for(const dimension of ['date','sessionDefaultChannelGroup','deviceCategory','eventName']) {
   out.ga4[name][dimension]=(await ga.properties.runReport({property:'properties/538279658',requestBody:{...requestBody,dimensions:[{name:dimension}],metrics:(dimension==='eventName'?['eventCount']:['sessions','screenPageViews']).map(name=>({name})),limit:'10000'}})).data;
  }
 }
}catch(e:any){out.ga4Error=e.message;}
await Bun.write('/tmp/hf-google-20260914.json',JSON.stringify(out,null,2));process.exit(0);
