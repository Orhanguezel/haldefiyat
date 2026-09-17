import {pool} from '/var/www/tarim-dijital-ekosistem/projects/hal-fiyatlari/backend/src/db/client';
const [prices]=await pool.query(`SELECT p.slug,m.slug market,h.recorded_date,h.min_price,h.max_price,h.avg_price,h.unit FROM hf_price_history h JOIN hf_products p ON p.id=h.product_id JOIN hf_markets m ON m.id=h.market_id WHERE p.slug IN ('mantar-kasa','marul-aysberg-kasa','marul-kasik-kasa','marul-lolorosso-kasa','palamut-adet','ithal-uskumru-koli','ithal-kalamar-koli') AND h.recorded_date>='2026-09-11' ORDER BY p.slug,m.slug,h.recorded_date DESC`);
const [review]=await pool.query('SELECT id,status,reviewed_at FROM hf_price_quarantine WHERE id IN (1427,1429)');
console.log(JSON.stringify({prices,review}));await pool.end();
