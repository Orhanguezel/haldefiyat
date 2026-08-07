-- Yozgat Ticaret Borsası — Türkiye'nin en büyük yeşil mercimek üreticisi ili (bkz. TEPGE/TOBB
-- verileri: Yozgat ~13,9 bin ton, üretimde 1. sırada). Kırmızı/yeşil mercimek ayrımı
-- (text-parsers.ts) sonrası veri kapsamını genişletmek için eklendi.
INSERT INTO `hf_markets`
  (`slug`, `name`, `city_name`, `region_slug`, `source_key`, `market_type`, `display_order`, `is_active`)
VALUES
  ('yozgat-ticaret-borsasi', 'Yozgat Ticaret Borsası', 'Yozgat', 'ic-anadolu', 'tobb_borsa_yozgat', 'borsa', 115, 1)
ON DUPLICATE KEY UPDATE
  `name`        = VALUES(`name`),
  `source_key`  = VALUES(`source_key`),
  `market_type` = VALUES(`market_type`),
  `is_active`   = VALUES(`is_active`);
