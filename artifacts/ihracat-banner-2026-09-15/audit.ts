import {pool} from '/var/www/tarim-dijital-ekosistem/projects/hal-fiyatlari/backend/src/db/client';
const [banners]=await pool.query("SELECT id,position,title,advertiser,is_active,lifecycle_status,payment_status,link_url,desktop_row,desktop_columns FROM hf_banners WHERE advertiser='İhracat Radarı' OR position IN ('listing_detail_sidebar','firm_detail_sidebar','global_footer') ORDER BY position,desktop_row");
console.log(JSON.stringify(banners));await pool.end();
