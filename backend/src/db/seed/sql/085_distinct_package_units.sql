-- Farklı satış/paket birimi ayrı ürün kimliğidir. Canonical master ile birimi
-- uyuşmayan tarihsel merge kayıtlarını ayır ve legacy yazımları normalize et.

UPDATE `hf_products` SET `unit` = 'kg' WHERE `unit` IN ('kg.', 'kilogram');
UPDATE `hf_products` SET `unit` = 'bag' WHERE `unit` = 'bağ';
UPDATE `hf_products` SET `unit` = 'litre' WHERE `unit` = 'lt';

UPDATE `hf_products` child
INNER JOIN `hf_products` master ON master.`slug` = child.`canonical_slug`
SET
  child.`family_slug` = master.`family_slug`,
  child.`canonical_slug` = NULL,
  child.`seo_index` = 0
WHERE child.`canonical_slug` IS NOT NULL
  AND child.`unit` <> master.`unit`;
