/** Read-only by default. --apply also submits the sitemap and seven IndexNow URLs. */
import { pool } from '../../src/db/client';
import { getGscAuthHeaders, resolveGscSite } from '@agro/shared-backend/modules/searchConsole/service';
import { ga4Headers, resolveGa4Property, runGa4Report } from '@agro/shared-backend/modules/ga4/service';
import { submitToIndexNow } from '../../src/modules/indexnow';
const out: Record<string,unknown>={checkedAt:new Date().toISOString()};
try {
 const h=await getGscAuthHeaders();const site=(await resolveGscSite()).replace(/^"+|"+$/g,'');
 const res=await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/sitemaps/${encodeURIComponent('https://haldefiyat.com/sitemap.xml')}`,{method:process.argv.includes('--apply')?'PUT':'GET',headers:h,signal:AbortSignal.timeout(25000)});
 out.sitemap={site,status:res.status};
} catch(e:any){out.sitemap={error:e.message};}
try {
 const h=await ga4Headers(), pid=(await resolveGa4Property()).replace(/^"+|"+$/g,'');
 const res=await fetch(`https://analyticsadmin.googleapis.com/v1beta/properties/${pid}/dataStreams`,{headers:h,signal:AbortSignal.timeout(25000)});
 const body:any=await res.json();
 out.ga4={property:pid,status:res.status,streams:body.dataStreams?.map((s:any)=>({displayName:s.displayName,webStreamData:s.webStreamData}))};
 out.ga4Observation=await runGa4Report(pid,h,{dateRanges:[{startDate:'2026-09-04',endDate:'2026-09-06'}],dimensions:[{name:'date'}],metrics:[{name:'sessions'},{name:'activeUsers'},{name:'screenPageViews'}]});
} catch(e:any){out.ga4Error=e.message;}
try {out.indexNow=process.argv.includes('--apply') ? await submitToIndexNow(['/rehber','/rehber/tursu','/rehber/salca-konserve','/rehber/recel','/analiz/nar-fiyatlari-2026-sezon-acilisi-analizi','/analiz/tursuluk-sezonu-2026-tursu-sepeti-hal-fiyatlari','/fiyat/adana/limon']) : {dryRun:true};}catch(e:any){out.indexNow={error:e.message};}
console.log(JSON.stringify(out,null,2));await pool.end();
