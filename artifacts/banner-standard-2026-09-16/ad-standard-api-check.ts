import {pool} from './src/db/client';
import Fastify from 'fastify';
import {registerBannersAdmin} from './src/modules/banners';
const app=Fastify();await registerBannersAdmin(app);await app.ready();
const base={title:'QA yerleşim kontrolü',caption:'QA yerleşim kontrolü',position:'home_mid',device:'all',lifecycleStatus:'live',paymentStatus:'waived',type:'image',sourceType:'custom',alt:'QA',linkUrl:'/gzl-teknoloji',rel:'sponsored nofollow noopener',desktopRow:1,gridColumn:1};
const conflicts=[];
for(const format of ['half','third','tall']) {const r=await app.inject({method:'POST',url:'/banners',payload:{...base,format}});if(r.statusCode!==409)throw new Error(`Expected conflict, got ${r.statusCode}: ${r.body}`);conflicts.push({format,status:r.statusCode,body:r.json()});}
const invalid=await app.inject({method:'PATCH',url:'/banners/21',payload:{format:'tall',desktopRow:2}});if(invalid.statusCode!==400)throw new Error(`Expected bounds rejection ${invalid.body}`);
const queued=await Promise.all(Array.from({length:12},()=>app.inject({method:'POST',url:'/banners',payload:{}})));if(queued.some(r=>r.statusCode!==400))throw new Error('Concurrent validation failed');
const quotes=[];for(const format of ['full','half','third','tall']) {const r=await app.inject({method:'POST',url:'/banners/pricing/quote',payload:{slotKey:'home_mid',device:'desktop',durationDays:7,format}});quotes.push({format,status:r.statusCode,...r.json()});}
console.log(JSON.stringify({conflicts,bounds:invalid.statusCode,concurrent:queued.map(r=>r.statusCode),quotes}));await app.close();await pool.end();
