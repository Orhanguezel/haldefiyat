import {randomUUID} from 'node:crypto';
import Fastify from 'fastify';
import jwt from '@fastify/jwt';
import {registerListingsPublic} from '../../src/modules/listings/router';
import {pool} from '../../src/db/client';
import {env} from '../../src/core/env';
if(process.env.QA_ALLOW_MUTATION!=='1')throw Error('Requires QA_ALLOW_MUTATION=1');
const app=Fastify();await app.register(jwt,{secret:env.JWT_SECRET});await app.register(registerListingsPublic,{prefix:'/api/v1'});await app.ready();
const owner=randomUUID(),other=randomUUID();let id=0;const checks:string[]=[];
function check(value:unknown,name:string){if(!value)throw Error(name);checks.push(name);}
async function request(path:string,method='GET',body?:unknown,user:string|null=owner){
 const headers={...(body?{'Content-Type':'application/json'}:{}),...(user?{Authorization:`Bearer ${app.jwt.sign({sub:user,role:'user'},{expiresIn:'10m'})}`}:{})};
 if(process.env.QA_BASE_URL){const r=await fetch(`${process.env.QA_BASE_URL}/api/v1${path}`,{method,headers,body:body?JSON.stringify(body):undefined});return{status:r.status,body:await r.json() as any};}
 const r=await app.inject({url:`/api/v1${path}`,method:method as any,headers,payload:body as any});return{status:r.statusCode,body:r.json()};
}
try {
 for(const uid of [owner,other])await pool.execute("INSERT INTO users (id,email,password_hash,full_name,is_active) VALUES (?,?,'qa-no-login','QA Lifecycle',1)",[uid,`${uid}@invalid.haldefiyat.local`]);
 const [insert]=await pool.execute("INSERT INTO hf_listings (slug,user_id,product_name,title,valid_until,status,source,raw) VALUES (?,?,'QA','QA Lifecycle',DATE_SUB(CURRENT_DATE(),INTERVAL 1 DAY),'approved','user',JSON_OBJECT('isTest',true))",[`qa-lifecycle-${owner}`,owner]);id=Number((insert as {insertId:number}).insertId);
 check((await request(`/listings/me/${id}`,'GET',undefined,null)).status===401,'Anonymous cannot preview');
 check((await request(`/listings/me/${id}`,'GET',undefined,other)).status===404,'Other member cannot preview');
 const preview=await request(`/listings/me/${id}`);check(preview.status===200 && preview.body.item.id===id,'Expired listing is visible to owner');
 check((await request(`/listings/${id}`,'DELETE',undefined,other)).status===404,'Other member cannot delete');
 const future=new Date(Date.now()+30*86400000).toISOString().slice(0,10);
 check((await request(`/listings/${id}/renew`,'POST',{validUntil:future},other)).status===404,'Other member cannot renew');
 check((await request(`/listings/${id}/renew`,'POST',{validUntil:'2020-01-01'})).status>=400,'Past renewal date is rejected');
 check((await request(`/listings/${id}/renew`,'POST',{validUntil:future})).status===200,'Owner can extend date');
 const renewed=await request(`/listings/me/${id}`);check(renewed.body.item.validUntil===future&&renewed.body.item.status==='pending','Renewal persists and requires moderation');
 check((await request(`/listings/${id}/renew`,'POST',{validUntil:future})).status===409,'Renewal cannot shorten or reuse date');
 const orderId=randomUUID();await pool.execute("INSERT INTO orders (id,dealer_id,status,total,payment_method,payment_status,notes) VALUES (?,?,'pending',350,'bank_transfer','pending',?)",[orderId,owner,JSON.stringify({kind:'listing_feature_transfer',listingId:id})]);
 check((await request(`/listings/${id}`,'DELETE')).status===409,'Pending bank report blocks deletion');
 await pool.execute("UPDATE orders SET payment_status='unpaid' WHERE id=?",[orderId]);
 check((await request(`/listings/${id}`,'DELETE')).status===200,'Owner can delete listing');
 check((await request(`/listings/me/${id}`)).status===404,'Deleted listing cannot be previewed');
 check(!(await request('/listings/me')).body.items.some((item:any)=>item.id===id),'Deleted listing disappears from owner list');
 check((await request(`/listings/${id}`,'PATCH',{title:'QA Restore attempt'})).status===404,'Editing cannot restore deleted listing');
 check((await request(`/listings/${id}/renew`,'POST',{validUntil:future})).status===404,'Renewing cannot restore deleted listing');
 const [orderRows]=await pool.query<any[]>('SELECT status FROM orders WHERE id=?',[orderId]);check(orderRows[0].status==='cancelled','Unpaid promotion request is cancelled');
 console.log(JSON.stringify({passed:checks.length,checks}));
}finally {
 await pool.execute('DELETE FROM orders WHERE dealer_id=?',[owner]);if(id)await pool.execute('DELETE FROM hf_listings WHERE id=?',[id]);
 for(const uid of [owner,other])await pool.execute('DELETE FROM users WHERE id=?',[uid]);await app.close();await pool.end();
}
