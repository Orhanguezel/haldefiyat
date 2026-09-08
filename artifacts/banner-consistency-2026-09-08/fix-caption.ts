import {pool} from "./src/db/client";
const [before]=await pool.query("SELECT id,caption FROM hf_banners WHERE id=16 AND advertiser=?",["Bereket Fide"]);
await pool.query("UPDATE hf_banners SET caption=? WHERE id=16 AND advertiser=? AND caption=?",["Sebze fidesi için Bereket Fide","Bereket Fide","Bu ürünün fidesi bizde"]);
const [after]=await pool.query("SELECT id,caption FROM hf_banners WHERE id=16 AND advertiser=?",["Bereket Fide"]);
console.log(JSON.stringify({before,after}));await pool.end();
