-- hf_products.unit temizligi — parser'dan sizan tablo basliklarini birime cevir.
--
-- SORUN: bazi kaynaklarda (Ankara/Bursa/Izmir balik tablolari) birim sutunu yerine
-- SUTUN BASLIGI yakalanmis. Katalogda bulunan gercek degerler:
--
--   "kasa (10 kg)p ks.-s kut."   "kilo (1 kg)p ks- s kut"
--   "sardalya"  "napolyon"  "asili"     <- urun adi parcasi, birim degil
--   "(adet)"    "18 kg"     "taze kg"   "kg."   "kilogram"   "ad"
--
-- NICIN ONEMLI: `unit` yalnizca gosterim alani degil — `productMatchKey` icinde
-- urun kimliginin parcasi. "sardalya" birimli bir kayit, ayni urunun kg'lik
-- kaydiyla eslesmiyordu (sessiz veri kaybi).
--
-- FIYATLAR KG BASI DOGRULANDI: somon 250-350, alabalik 150, hamsi 66-133 TL —
-- yani fiyat sutunu dogru okunmus, yalnizca birim sutunu yanlis. "kasa" yazsa da
-- deger kasa fiyati DEGIL; bu yuzden kg'ye cevirmek 10x hata uretmez.
--
-- BILINCLI OLARAK DOKUNULMAYAN: adet / bag / demet / kasa / koli / paket / lt.
-- Bunlar gecerli birimler. Fiyat gecmisinde cogunun satirlari "kg" gorunuyor ama
-- o kg cogu zaman GOZLEM DEGIL, kaynagin `defaultUnit` varsayilani (HTML scrape
-- birim vermiyorsa kg yaziliyor). Veriden turetmek dongusel olurdu — bu ayri bir
-- is olarak KALAN-ISLER'de duruyor.
--
-- Kokun kendisi `etl/normalizer.ts` icindeki unitClass()'ta kapatildi: taninmayan
-- deger artik ham dize olarak gecmiyor, kg varsayiliyor ve log'a uyari dusuyor.

UPDATE hf_products SET unit = 'kg'
WHERE unit REGEXP 'kut|ks\\.|ks-|ks '
   OR LOWER(unit) IN ('kilogram', 'kg.', 'kilo', 'taze kg', '18 kg', 'sardalya', 'napolyon', 'asili');

UPDATE hf_products SET unit = 'adet'
WHERE LOWER(unit) IN ('ad', '(adet)');
