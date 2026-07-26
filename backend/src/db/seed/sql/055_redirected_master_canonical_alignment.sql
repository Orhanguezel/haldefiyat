-- Aktif ürün redirect'ine sahip eski master'ların çocuklarını nihai master'a
-- doğrudan bağla. Böylece fiyat API'leri ve iç linkler A -> B -> C zinciri
-- üretmez. Idempotent: tekrar çalıştırıldığında değişiklik yapmaz.

UPDATE hf_products
   SET canonical_slug = 'biber-carliston'
 WHERE canonical_slug = 'biber';

UPDATE hf_products
   SET canonical_slug = 'sarimsak-kuru'
 WHERE canonical_slug = 'sarimsak';
