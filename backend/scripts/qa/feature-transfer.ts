import { randomUUID } from "node:crypto";
import Fastify from "fastify";
import jwt from "@fastify/jwt";
import { requireAuth } from "@agro/shared-backend/middleware/auth";
import { requireAdmin } from "@agro/shared-backend/middleware/roles";
import { registerFeatureTransferPublic, registerFeatureTransferAdmin } from "../../src/modules/listings/feature-transfer";
import { pool } from "../../src/db/client";
import { env } from "../../src/core/env";
if (process.env.QA_ALLOW_MUTATION !== "1") throw new Error("Requires QA_ALLOW_MUTATION=1");
const app=Fastify();await app.register(jwt,{secret:env.JWT_SECRET});
await app.register(async api=>{registerFeatureTransferPublic(api);await api.register(async admin=>{admin.addHook('onRequest',requireAuth);admin.addHook('onRequest',requireAdmin);registerFeatureTransferAdmin(admin);},{prefix:'/admin'});},{prefix:'/api/v1'});await app.ready();
const userId=randomUUID(), other=randomUUID(), adminId=randomUUID();
let listingId=0;const checks:string[]=[];
function check(value:unknown,name:string){if(!value)throw new Error(name);checks.push(name);}
const token=(id:string,role='user')=>app.jwt.sign({sub:id,role},{expiresIn:'10m'});
async function request(path:string,method='GET',body?:unknown,auth:string|false=token(userId)){
 const headers={'Content-Type':'application/json',...(auth?{Authorization:`Bearer ${auth}`}:{})};
 if(process.env.QA_BASE_URL){const r=await fetch(`${process.env.QA_BASE_URL}/api/v1${path}`,{method,headers,body:body?JSON.stringify(body):undefined});return{status:r.status,body:await r.json() as any};}
 const r=await app.inject({url:`/api/v1${path}`,method:method as any,headers,payload:body as any});return{status:r.statusCode,body:r.json()};
}
try {
 for(const uid of [userId,other,adminId]) await pool.execute("INSERT INTO users (id,email,password_hash,full_name,is_active) VALUES (?,?,'qa-no-login','QA Transfer',1)",[uid,`${uid}@invalid.haldefiyat.local`]);
 const [insert]=await pool.execute("INSERT INTO hf_listings (slug,user_id,product_name,title,valid_until,status,source,raw) VALUES (?,?,'QA','QA Havale',DATE_ADD(CURRENT_DATE(), INTERVAL 120 DAY),'approved','user',JSON_OBJECT('isTest',true))",[`qa-transfer-${userId}`,userId]);listingId=Number((insert as {insertId:number}).insertId);
 const base=`/listings/${listingId}/feature-transfer`;
 check((await request(base,'GET',undefined,false)).status===401,'Anonymous denied');
 check((await request(base,'GET',undefined,token(other))).status===404,'Other owner denied');
 const config=await request(base);check(config.status===200 && config.body.bank && config.body.pricing?.daily?.price>0,'Configured bank and server prices available');
 const results=await Promise.all([request(base,'POST',{package:'daily',price:1}),request(base,'POST',{package:'daily'})]);
 check(results.every(r=>r.status===200),'Checkout succeeds');
 const order=results[0].body;check(order.id===results[1].body.id,'Concurrent checkout reuses one order');
 check(order.amount===config.body.pricing.daily.price,'Client cannot choose amount');
 const review=`/admin/listings/feature-transfers/${order.id}/review`;
 check((await request(review,'POST',{action:'approve',reviewNote:'QA checked',paymentVerified:true})).status===403,'Member cannot approve payment');
 check((await request(review,'POST',{action:'approve',reviewNote:'QA checked',paymentVerified:true},token(adminId,'admin'))).status===409,'Unreported transfer cannot be approved');
 const report=await request(`/listings/feature-transfers/${order.id}/report`,'POST',{action:'report',senderName:'QA Sender'});
 check(report.body.status==='pending','Report waits for approval');
 const [before]=await pool.query<any[]>('SELECT is_featured FROM hf_listings WHERE id=?',[listingId]);check(before[0].is_featured===0,'Report does not activate feature');
 check((await request(review,'POST',{action:'approve',reviewNote:'QA checked'},token(adminId,'admin'))).status===409,'Bank confirmation is required');
 const approved=await request(review,'POST',{action:'approve',reviewNote:'QA checked',paymentVerified:true},token(adminId,'admin'));check(approved.body.status==='paid','Admin approval marks paid');
 const repeated=await request(review,'POST',{action:'approve',reviewNote:'QA duplicate',paymentVerified:true},token(adminId,'admin'));check(repeated.body.featuredUntil===approved.body.featuredUntil,'Repeated approval does not extend time');
 const [after]=await pool.query<any[]>('SELECT is_featured FROM hf_listings WHERE id=?',[listingId]);check(after[0].is_featured===1,'Approval activates feature');
 await pool.execute("UPDATE hf_listings SET valid_until=CURRENT_DATE(),is_featured=0,featured_until=NULL WHERE id=?",[listingId]);
 check((await request(base,'POST',{package:'monthly'})).status===409,'Too-short listing cannot buy package');
 console.log(JSON.stringify({passed:checks.length,checks}));
} finally {
 await pool.execute('DELETE FROM orders WHERE dealer_id=?',[userId]);
 if(listingId)await pool.execute('DELETE FROM hf_listings WHERE id=?',[listingId]);
 for(const uid of [userId,other,adminId])await pool.execute('DELETE FROM users WHERE id=?',[uid]);
 await app.close();await pool.end();
}
