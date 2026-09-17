import {db,pool} from '/var/www/tarim-dijital-ekosistem/projects/hal-fiyatlari/backend/src/db/client';
import {sql} from 'drizzle-orm';
import {blackoutFilter} from '/var/www/tarim-dijital-ekosistem/projects/hal-fiyatlari/backend/src/modules/prices/blackouts';
const safe=await blackoutFilter(sql`ph.recorded_date`,sql`ph.market_id`,sql`ph.source_api`);
const [years]=await db.execute(sql`SELECT YEAR(ph.recorded_date) year,COUNT(*) rawRows,SUM(CASE WHEN ${safe} THEN 1 ELSE 0 END) usableRows,COUNT(DISTINCT CASE WHEN ${safe} THEN ph.recorded_date END) usableDays FROM hf_price_history ph JOIN hf_products p ON p.id=ph.product_id WHERE (p.slug='domates' OR p.canonical_slug='domates') AND ph.unit=p.unit GROUP BY YEAR(ph.recorded_date)`);
const [prior]=await db.execute(sql`SELECT p.slug,COUNT(*) rawRows,SUM(CASE WHEN ${safe} THEN 1 ELSE 0 END) usableRows FROM hf_price_history ph JOIN hf_products p ON p.id=ph.product_id WHERE (p.slug='domates' OR p.canonical_slug='domates') AND ph.unit=p.unit AND ph.recorded_date BETWEEN DATE_SUB(DATE_SUB(CURDATE(),INTERVAL 7 DAY),INTERVAL 1 YEAR) AND DATE_SUB(CURDATE(),INTERVAL 1 YEAR) GROUP BY p.slug`);
console.log(JSON.stringify({years,prior}));await pool.end();
