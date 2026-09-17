import {pool} from './src/db/client';
import Fastify from 'fastify';
import {registerBannersAdmin} from './src/modules/banners';
import {adLayoutError,adRectanglesOverlap} from '../shared/banner-layout.mjs';
import {findLayoutConflicts} from './src/modules/banners/repository';
const [rows]:any=await pool.query('SELECT id,is_active,lifecycle_status,ad_format,grid_column FROM hf_banners ORDER BY id');
const app=Fastify();await registerBannersAdmin(app);await app.ready();
const [inventory]:any=await pool.query('SELECT id FROM hf_banners WHERE is_active=1 AND archived_at IS NULL ORDER BY id');
const results=[];
for(const {id} of inventory) {
 const response=await app.inject({method:'GET',url:`/banners/${id}`});const data=response.json().data;
 const quality=await app.inject({method:'GET',url:`/banners/${id}/quality`});
 results.push({id,status:response.statusCode,layoutError:adLayoutError(data),conflicts:await findLayoutConflicts(data,id),quality:quality.json()});
}
console.log(JSON.stringify({rows,results}));await app.close();await pool.end();
