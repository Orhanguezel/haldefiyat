-- TOBB merkezi portalindan eklenen uc yeni ticaret borsasi.
--
-- 2026-07-20: TOBB'un 111 borsasi tarandi (borsa_bolge.php'den kod listesi).
-- Sonuc: yalnizca ~21'i guncel fiyat yayimliyor; gerisi bos donuyor. Yani portal
-- genis gorunuyor ama gercek kapsam dar — yeni kaynak potansiyeli sinirli.
--
-- Bu ucu daha once hic alinmamisti. Digerleri (Eskisehir, Sungurlu, Ilgin, Nazilli,
-- Aydin, Bandirma, Biga, Karapinar, Eregli) DB'de market olarak zaten vardi ama
-- etl-sources.ts'te karsiligi yoktu — onlar icin yalnizca kaynak tanimi eklendi.

INSERT INTO hf_markets (slug, name, city_name, market_type, source_key, is_active, seo_index)
SELECT * FROM (SELECT 'nevsehir-ticaret-borsasi','NEVŞEHİR TİCARET BORSASI','NEVŞEHİR','borsa','tobb_borsa_nevsehir',1,1) AS t
WHERE NOT EXISTS (SELECT 1 FROM hf_markets WHERE slug='nevsehir-ticaret-borsasi');

INSERT INTO hf_markets (slug, name, city_name, market_type, source_key, is_active, seo_index)
SELECT * FROM (SELECT 'adana-ticaret-borsasi','ADANA TİCARET BORSASI','ADANA','borsa','tobb_borsa_adana',1,1) AS t
WHERE NOT EXISTS (SELECT 1 FROM hf_markets WHERE slug='adana-ticaret-borsasi');

INSERT INTO hf_markets (slug, name, city_name, market_type, source_key, is_active, seo_index)
SELECT * FROM (SELECT 'ordu-ticaret-borsasi','ORDU TİCARET BORSASI','ORDU','borsa','tobb_borsa_ordu',1,1) AS t
WHERE NOT EXISTS (SELECT 1 FROM hf_markets WHERE slug='ordu-ticaret-borsasi');
