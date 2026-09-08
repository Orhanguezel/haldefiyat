import {pool} from "./src/db/client";
// Verified against Tanitio haldefiyat Facebook account_id on 2026-09-08.
const url="https://www.facebook.com/1093315187207024";
await pool.query("INSERT INTO site_settings (id,`key`,locale,value) VALUES (UUID(),?, ?,?) ON DUPLICATE KEY UPDATE id=id",["social_facebook","*",JSON.stringify(url)]);
const [rows]=await pool.query("SELECT `key`,locale,value FROM site_settings WHERE `key`=?",["social_facebook"]);
console.log(JSON.stringify(rows));await pool.end();
