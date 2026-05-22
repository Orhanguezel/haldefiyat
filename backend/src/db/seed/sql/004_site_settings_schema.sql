SET NAMES utf8mb4;
SET time_zone = '+00:00';

DROP TABLE IF EXISTS `site_settings`;

CREATE TABLE `site_settings` (
  `id` VARCHAR(64) NOT NULL,
  `key` VARCHAR(100) NOT NULL,
  `locale` VARCHAR(8) NOT NULL DEFAULT '*',
  `value` MEDIUMTEXT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `site_settings_key_locale_uq` (`key`, `locale`),
  KEY `site_settings_key_idx` (`key`),
  KEY `site_settings_locale_idx` (`locale`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`) VALUES
(UUID(), 'brand_name',        '*', '"Hal Fiyatlari"'),
(UUID(), 'brand_subtitle',    '*', '"Gunluk piyasa ve hal fiyatlari"'),
(UUID(), 'brand_short_name',  '*', '"HalFiyat"'),
(UUID(), 'app_name',          '*', '"Hal Fiyatlari API"'),
(UUID(), 'app_version',       '*', '"0.1.0"'),
(UUID(), 'default_locale',    '*', '"tr"'),
(UUID(), 'available_locales', '*', '["tr"]'),
(UUID(), 'footer_copyright',  '*', '"© 2026 Hal Fiyatlari"'),
(UUID(), 'storage_driver',    '*', '"local"'),
(UUID(), 'site_logo',         '*', '"/uploads/brand/logo.png"'),
(UUID(), 'site_favicon',      '*', '"/uploads/brand/favicon.png"'),
(UUID(), 'site_apple_touch',  '*', '"/uploads/brand/apple-touch-icon.png"'),
(UUID(), 'ga4_measurement_id', '*', '"G-YHLL9WK7ML"'),
(UUID(), 'gtm_container_id',   '*', '"GTM-K3WDGHX5"'),
-- Referans (frontend tuketmiyor; admin/raporlama icin tenant kaydi tam olsun)
(UUID(), 'ga4_property_id',    '*', '"538279658"'),
(UUID(), 'google_ads_id',      '*', '"941-057-6390"'),
(UUID(), 'search_console_property', '*', '"haldefiyat.com"'),
(UUID(), 'contact_phone',      '*', '"+90 530 048 41 83"'),
(UUID(), 'contact_email',      '*', '"atakan07sahin@gmail.com"'),
(UUID(), 'social_telegram',    '*', '"https://t.me/haldefiyat"');

-- Global SEO defaults — frontend layout.tsx fetchGlobalSeo bunlari ister;
-- yoksa her sayfa render'inda 404 dongusu + SEO meta uretilmemesi olusur.
-- seoSchemaStrict + siteMetaDefaultSchemaStrict ile uyumlu.
-- site_seo: '*' global; site_meta_default: per-locale ('*' yasak, tr zorunlu).
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`) VALUES
(UUID(), 'site_seo', '*', '{"site_name":"HalDeFiyat","title_default":"HalDeFiyat | Türkiye Güncel Hal Fiyatları","title_template":"%s | HalDeFiyat","description":"Türkiye geneli hallerden günlük güncel sebze ve meyve fiyatları. 22+ kaynaktan toptan ve market fiyat takibi.","open_graph":{"type":"website","images":["/brand-logo.png"]},"twitter":{"card":"summary_large_image","site":"","creator":""},"robots":{"noindex":false,"index":true,"follow":true}}'),
(UUID(), 'site_meta_default', 'tr', '{"title":"HalDeFiyat | Türkiye Güncel Hal Fiyatları","description":"Türkiye geneli hallerden günlük güncel sebze ve meyve fiyatları. Toptan ve market fiyatları karşılaştırması, fiyat geçmişi ve analiz.","keywords":"hal fiyatları, sebze fiyatları, meyve fiyatları, günlük hal fiyatları, toptan fiyat, market fiyatları, fiyat karşılaştırma"}')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);
