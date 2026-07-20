-- Bozuk slug'lari saglam ikizine bagla.
--
-- Sebep: slugify, Turkce karakteri ASCII'ye cevirmeden `[^a-z0-9]+` ile degistirdiginde
-- harf `-` oluyordu: kereviz -> kerev-z, limon-mayer -> l-mon-mayer, semizotu -> sem-zotu.
-- Bu bozuk slug'lar AYRI MASTER olarak olustu ve fiyat kayitlari dogru aileye yuvarlanmadi.
--
-- Hata ~2026-05-12'de duzelmis (bozuk serilerin cogu o tarihte duruyor), ama olusan
-- oksuz urunler ve 178 kayit oylece kaldi.
--
-- SILME YOK: canonical_slug ile baglanir, veri saglam aileye yuvarlanir. seo_index=0
-- yapilir ki bozuk slug arama motorunda ayri sayfa olarak gorunmesin.


UPDATE hf_products SET canonical_slug = 'kereviz', seo_index = 0 WHERE slug = 'kerev-z' AND canonical_slug IS NULL;
UPDATE hf_products SET canonical_slug = 'kuzukulagi', seo_index = 0 WHERE slug = 'kuzukula-i' AND canonical_slug IS NULL;
UPDATE hf_products SET canonical_slug = 'portakal-washington', seo_index = 0 WHERE slug = 'portakal-wash-ngton' AND canonical_slug IS NULL;
UPDATE hf_products SET canonical_slug = 'salatalik-silor', seo_index = 0 WHERE slug = 'salatalik-s-lor' AND canonical_slug IS NULL;
UPDATE hf_products SET canonical_slug = 'semizotu', seo_index = 0 WHERE slug = 'sem-zotu' AND canonical_slug IS NULL;
UPDATE hf_products SET canonical_slug = 'turp-siyah', seo_index = 0 WHERE slug = 'turp-s-yah' AND canonical_slug IS NULL;
UPDATE hf_products SET canonical_slug = 'asma-yapragi', seo_index = 0 WHERE slug = 'asma-yapra-i' AND canonical_slug IS NULL;
UPDATE hf_products SET canonical_slug = 'feslegen-reyhan', seo_index = 0 WHERE slug = 'fesle-en-reyhan' AND canonical_slug IS NULL;
UPDATE hf_products SET canonical_slug = 'limon-yatak', seo_index = 0 WHERE slug = 'l-mon-yatak' AND canonical_slug IS NULL;
UPDATE hf_products SET canonical_slug = 'limon-mayer', seo_index = 0 WHERE slug = 'l-mon-mayer' AND canonical_slug IS NULL;
UPDATE hf_products SET canonical_slug = 'armut-margarit', seo_index = 0 WHERE slug = 'armut-margar-t' AND canonical_slug IS NULL;
UPDATE hf_products SET canonical_slug = 'domates-salcalik', seo_index = 0 WHERE slug = 'domates-sal-alik' AND canonical_slug IS NULL;
UPDATE hf_products SET canonical_slug = 'portakal-valencia', seo_index = 0 WHERE slug = 'portakal-valenc-a' AND canonical_slug IS NULL;
UPDATE hf_products SET canonical_slug = 'armut-akca', seo_index = 0 WHERE slug = 'armut-ak-a' AND canonical_slug IS NULL;
UPDATE hf_products SET canonical_slug = 'zencefil', seo_index = 0 WHERE slug = 'zencef-l' AND canonical_slug IS NULL;
