import {pool} from '/var/www/tarim-dijital-ekosistem/projects/hal-fiyatlari/backend/src/db/client';
import {createHmac} from 'node:crypto';
import {writeFileSync} from 'node:fs';
const [r]:any=await pool.query("SELECT u.id FROM users u JOIN user_roles r ON r.user_id=u.id WHERE r.role='admin' AND u.is_active=1 LIMIT 1");
const [counts]=await pool.query("SELECT COUNT(*) total,SUM(is_active=1) active FROM users");
const b=(v:any)=>Buffer.from(JSON.stringify(v)).toString('base64url');
const msg=b({alg:'HS256',typ:'JWT'})+'.'+b({sub:r[0].id,role:'admin',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600});
const token=msg+'.'+createHmac('sha256',process.env.JWT_SECRET!).update(msg).digest('base64url');
writeFileSync('/tmp/hal-users-qa-token',token,{mode:0o600});
for(const q of ['limit=20&offset=20','limit=20&offset=20&with_meta=true','limit=20&offset=0&with_meta=true&role=admin','limit=20&offset=0&with_meta=true&is_active=false']){
 const res=await fetch('http://127.0.0.1:8091/api/v1/admin/users?'+q,{headers:{authorization:'Bearer '+token}});const body:any=await res.json();
 console.log(JSON.stringify({q,status:res.status,count:Array.isArray(body)?body.length:body.items?.length,total:body.total,stats:body.stats,error:body.error,roles:body.items?.map((u:any)=>u.roles)}));
}
console.log(JSON.stringify({db:counts}));await pool.end();
