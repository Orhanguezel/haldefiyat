-- Canonical ürün yönlendirmeleri tek sıçrama olmalıdır.
-- 2026-08-13 canlı envanterinde tespit edilen 12 zincir, son master'a bağlanır.
-- Slug ve birim değişmez; yalnız canonical hedef düzleştirilir.

UPDATE `hf_products` SET `canonical_slug` = 'bakla' WHERE `slug` = 'bakla-taze-diger';
UPDATE `hf_products` SET `canonical_slug` = 'bal-kabagi' WHERE `slug` = 'balkabagi-soyulmus';
UPDATE `hf_products` SET `canonical_slug` = 'domates-pembe' WHERE `slug` = 'domates-petemek-erik';
UPDATE `hf_products` SET `canonical_slug` = 'pancar' WHERE `slug` IN ('kirmizi-pancar', 'pancar-kirmizi');
UPDATE `hf_products` SET `canonical_slug` = 'kivi' WHERE `slug` = 'kivi-ithal-muhtelif';
UPDATE `hf_products` SET `canonical_slug` = 'seftali' WHERE `slug` = 'seftali-nektari-muhtelif';
UPDATE `hf_products` SET `canonical_slug` = 'sogan-taze' WHERE `slug` = 'sogan-beyaz-kg';
UPDATE `hf_products` SET `canonical_slug` = 'sogan-kuru' WHERE `slug` IN (
  'sogan-kuru-kg',
  'sogan-kuru-taze',
  'sogan-kuru-taze-ii',
  'sogan-mor'
);
