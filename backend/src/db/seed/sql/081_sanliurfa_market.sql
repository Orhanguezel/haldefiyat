-- Şanlıurfa Ticaret Borsası — kırmızı mercimekte Mardin'den sonra 2. büyük üretici il
-- (TEPGE verisi ~134 bin ton/yıl). Kırmızı/yeşil mercimek ayrımı sonrası veri kapsamını
-- genişletmek için eklendi.
INSERT INTO `hf_markets`
  (`slug`, `name`, `city_name`, `region_slug`, `source_key`, `market_type`, `display_order`, `is_active`)
VALUES
  ('sanliurfa-ticaret-borsasi', 'Şanlıurfa Ticaret Borsası', 'Şanlıurfa', 'guneydogu', 'tobb_borsa_sanliurfa', 'borsa', 116, 1)
ON DUPLICATE KEY UPDATE
  `name`        = VALUES(`name`),
  `source_key`  = VALUES(`source_key`),
  `market_type` = VALUES(`market_type`),
  `is_active`   = VALUES(`is_active`);
