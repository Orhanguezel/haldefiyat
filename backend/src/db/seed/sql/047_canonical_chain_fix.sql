-- Kanonik zincirlerini duzlestir.
--
-- Kural: canonical_slug DAIMA gercek master'a isaret eder (master = canonical_slug IS NULL).
-- Zincir olusursa (A -> B -> C) toplama sorgulari bozulur, cunku hepsi
-- COALESCE(canonical_slug, slug) ile TEK adim cozer, zincir takip etmez. Sonuc: B ayri bir
-- urunmus gibi gorunur, ayni urun tabloda iki satir isgal eder ve her iki satirin ortalamasi
-- da yanlis olur.
--
-- Lahana'da bu hata bultene "Lahana +%114" ve "Lahana (Beyaz) +%125" olarak yansidi
-- (bkz. 046_lahana_canonical_fix.sql). Tarama ayni hatanin 9 vakasini daha buldu:
-- kilcik-sivri-biber, biber-carli, biber-dolmalik, erik-murdum, kabak-bal, oval-domates,
-- patates-kumpir, sil-havuc, yeni-dunya-malta-erigi.
--
-- Asagidaki ifade her calistiginda zinciri bir seviye kisaltir. Uc kez tekrarlanir; pratikte
-- zincirler 2 seviyeyi gecmiyor, ucuncusu emniyet payi. Idempotent — zincir yoksa 0 satir etkiler.
--
-- `m.canonical_slug <> c.slug` guard'i: A -> B -> A dongusunde kendine isaret eden kanonik
-- olusmasini engeller.
--
-- Yeni kanonik atamasi yapan her isten sonra dogrulama sorgusu:
--   SELECT c.slug, c.canonical_slug FROM hf_products c
--     JOIN hf_products m ON m.slug = c.canonical_slug
--    WHERE c.canonical_slug IS NOT NULL AND m.canonical_slug IS NOT NULL;
--   -> bos donmeli.

UPDATE hf_products c
  JOIN hf_products m ON m.slug = c.canonical_slug
   SET c.canonical_slug = m.canonical_slug
 WHERE c.canonical_slug IS NOT NULL
   AND m.canonical_slug IS NOT NULL
   AND m.canonical_slug <> c.slug;

UPDATE hf_products c
  JOIN hf_products m ON m.slug = c.canonical_slug
   SET c.canonical_slug = m.canonical_slug
 WHERE c.canonical_slug IS NOT NULL
   AND m.canonical_slug IS NOT NULL
   AND m.canonical_slug <> c.slug;

UPDATE hf_products c
  JOIN hf_products m ON m.slug = c.canonical_slug
   SET c.canonical_slug = m.canonical_slug
 WHERE c.canonical_slug IS NOT NULL
   AND m.canonical_slug IS NOT NULL
   AND m.canonical_slug <> c.slug;
