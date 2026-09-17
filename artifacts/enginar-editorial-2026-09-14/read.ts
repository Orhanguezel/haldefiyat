import {pool} from "/var/www/tarim-dijital-ekosistem/projects/hal-fiyatlari/backend/src/db/client";
const slugs=await Bun.file('/tmp/enginar-review-slugs.json').json();
const [products]:any=await pool.query(`SELECT p.id,p.slug,p.name_tr,p.display_name,p.unit,p.category_slug,p.canonical_slug,p.data_quality,p.search_volume,p.seo_index,p.is_active, e.published_at,e.source,e.reviewed_by,CHAR_LENGTH(e.about_md) aboutLength,
(SELECT COUNT(DISTINCT ph.market_id) FROM hf_price_history ph JOIN hf_products v ON v.id=ph.product_id WHERE (v.id=p.id OR v.canonical_slug=p.slug) AND ph.unit=v.unit AND ph.recorded_date>=DATE_SUB(CURDATE(),INTERVAL 30 DAY)) markets30,
(SELECT COUNT(DISTINCT ph.recorded_date) FROM hf_price_history ph JOIN hf_products v ON v.id=ph.product_id WHERE (v.id=p.id OR v.canonical_slug=p.slug) AND ph.unit=v.unit AND ph.recorded_date>=DATE_SUB(CURDATE(),INTERVAL 30 DAY)) days30,
(SELECT MAX(ph.recorded_date) FROM hf_price_history ph JOIN hf_products v ON v.id=ph.product_id WHERE (v.id=p.id OR v.canonical_slug=p.slug) AND ph.unit=v.unit) lastDate
FROM hf_products p LEFT JOIN hf_product_editorial e ON e.product_slug=p.slug WHERE p.slug IN (?) OR p.slug LIKE 'enginar%'`,[slugs]);
const [editorial]=await pool.query("SELECT * FROM hf_product_editorial WHERE product_slug LIKE 'enginar%'");
const [prices]=await pool.query(`SELECT ph.recorded_date,ph.unit,ph.min_price,ph.max_price,ph.avg_price,ph.avg_price_method,m.name,m.slug,ph.source_api FROM hf_price_history ph JOIN hf_products p ON p.id=ph.product_id JOIN hf_markets m ON m.id=ph.market_id WHERE p.slug='enginar-taze' AND ph.recorded_date>=DATE_SUB(CURDATE(),INTERVAL 30 DAY) ORDER BY ph.recorded_date DESC,m.slug`);
console.log(JSON.stringify({products,editorial,prices}));await pool.end();
