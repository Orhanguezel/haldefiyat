import {google} from 'googleapis';
import {createMarketingJwt,buildMarketingOAuthClient}from '/var/www/ekosistem-sosyal-medya/backend/src/modules/marketing/google-sa';
const auth=await createMarketingJwt('haldefiyat','gsc')??await buildMarketingOAuthClient('haldefiyat','gsc');const api=google.webmasters({version:'v3',auth});const out:any={checkedAt:new Date().toISOString()};
for(const dimensions of [['query'],['query','page']]){const request={startDate:'2026-09-06',endDate:'2026-09-12',type:'web',dataState:'final',dimensions,rowLimit:25000,dimensionFilterGroups:[{filters:[{dimension:'country',operator:'equals',expression:'tur'},{dimension:'device',operator:'equals',expression:'MOBILE'}]}]};out[dimensions.join('-')]={request,data:(await api.searchanalytics.query({siteUrl:'sc-domain:haldefiyat.com',requestBody:request})).data};}
await Bun.write('/tmp/hf-competitor-tr-mobile.json',JSON.stringify(out,null,2));process.exit(0);
