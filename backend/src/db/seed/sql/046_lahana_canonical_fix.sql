-- Lahana ailesi kanonik duzeltmesi.
--
-- Iki ayri hata vardi:
--
-- 1) KIRIK KANONIK ZINCIRI: `beyaz-lahana-diger`.canonical_slug = 'beyaz-lahana' idi, ama
--    'beyaz-lahana' master degil — o da 'lahana-beyaz'a isaret eden bir takma addi. Toplama
--    sorgulari COALESCE(canonical_slug, slug) ile TEK adim cozer, zincir takip etmez; bu yuzden
--    'beyaz-lahana' ayri bir urunmus gibi tabloya dusuyordu. Kanonik DAIMA master'a isaret etmeli.
--
-- 2) `lahana` COP KOVASI: generic 'lahana' master'i altinda birbirinden tamamen farkli urunler
--    toplanmisti — beyaz lahana (32 TL), karalahana (111 TL), bruksel (46 TL), mor lahana.
--    Bunlarin ortalamasi hicbir seyi temsil etmiyordu; bultende "Lahana +%114" ve
--    "Lahana (Beyaz) +%125" diye iki ayri satir cikiyordu.
--
-- Uyeler dogru master'lara dagitildi. Degistirilen satirlarin hepsi seo_index=0 — indexli
-- URL kaybi yok, dolayisiyla 301 gerekmiyor.
--
-- ETL upsert'i canonical_slug'a dokunmuyor (fetcher.ts onDuplicateKeyUpdate: nameTr,
-- categorySlug, unit) — bu duzeltme sonraki ETL kosusunda geri alinmaz.
--
-- NOT: kayisi / kayisi-sekerpare / kayisi-mut / kayisi-sanayi BILINCLI olarak ayri birakildi.
-- Sekerpare ve Mut ayri cesitler, sanayilik ayri pazar — farkli fiyat seviyeleri gercek.

UPDATE hf_products SET canonical_slug = 'lahana-beyaz'
 WHERE slug IN ('beyaz-lahana-diger', 'lahana-beyaz-kg', 'lahana-top');

UPDATE hf_products SET canonical_slug = 'bruksel-lahana'
 WHERE slug IN ('lahana-bruksel', 'lahana-buruksel');

UPDATE hf_products SET canonical_slug = 'karalahana'
 WHERE slug IN ('lahana-kara', 'lahana-kara-bag', 'lahana-karayaprak', 'lahana-siyah');

UPDATE hf_products SET canonical_slug = 'kirmizi-lahana'
 WHERE slug IN ('lahana-mor');
