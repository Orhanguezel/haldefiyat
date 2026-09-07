import { createHmac } from 'node:crypto';
import { pool } from '../../src/db/client';
import { env } from '../../src/core/env';
const [users]:any=await pool.query("SELECT id FROM users WHERE role='admin' LIMIT 1").catch(async()=>pool.query("SELECT user_id id FROM user_roles WHERE role='admin' LIMIT 1"));
if (!users[0]) throw new Error('ADMIN_REQUIRED');
const b64=(v:unknown)=>Buffer.from(JSON.stringify(v)).toString('base64url');
const data=b64({alg:'HS256',typ:'JWT'})+'.'+b64({sub:users[0].id,role:'admin',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+300});
const token=data+'.'+createHmac('sha256',env.JWT_SECRET).update(data).digest('base64url');
const body={sourcePath:'/analiz/elma-fiyat-analizi-mayis-2026',type:'301',targetUrl:'/urun/elma',note:'A1.4: yayımdan kaldırılmış Mayıs analizi; elma fiyat ve tarihçe merkezine yönlendirme.'};
if (process.argv.includes('--apply')) {
 const res=await fetch('http://127.0.0.1:8091/api/v1/admin/redirects',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body)});
 console.log(JSON.stringify({status:res.status,result:await res.json(),redirect:body}));
} else console.log(JSON.stringify({dryRun:true,redirect:body}));
await pool.end();
