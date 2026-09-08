import {pool} from "./src/db/client";
const [before]=await pool.query("SELECT id,image_url FROM hf_banners WHERE id IN (13,15) AND advertiser=?",["Bereket Fide"]);
await pool.query("UPDATE hf_banners SET image_url=? WHERE id IN (13,15) AND advertiser=? AND image_url=?",["/uploads/ads/bereketfide-sera.jpg","Bereket Fide","/uploads/ads/bereketfide-marka-karo.jpg"]);
const [after]=await pool.query("SELECT id,image_url FROM hf_banners WHERE id IN (13,15) AND advertiser=?",["Bereket Fide"]);
console.log(JSON.stringify({before,after}));await pool.end();
