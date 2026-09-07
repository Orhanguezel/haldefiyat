/** Dry-run by default; --apply notifies IndexNow of currently eligible city pages. */
import { pool } from '../../src/db/client';
import { listCityProductPairs } from '../../src/modules/prices/city-product';
import { submitToIndexNow } from '../../src/modules/indexnow';
try {
 const pairs=(await listCityProductPairs()).filter(p=>p.eligible);
 const paths=pairs.map(p=>`/fiyat/${p.citySlug}/${p.productSlug}`);
 if(!paths.length)throw Error('No eligible pages; submission stopped');
 const result=process.argv.includes('--apply') ? await submitToIndexNow(paths) : null;
 console.log(JSON.stringify({checkedAt:new Date().toISOString(),apply:process.argv.includes('--apply'),eligiblePages:paths.length,adanaPages:pairs.filter(p=>p.citySlug==='adana').length,paths,result},null,2));
}finally{await pool.end();}
