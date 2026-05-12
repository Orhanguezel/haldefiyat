SET NAMES utf8mb4;
SET time_zone = '+00:00';

DROP TABLE IF EXISTS `site_settings`;

CREATE TABLE `site_settings` (
  `id` CHAR(36) NOT NULL,
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
(UUID(), 'ga4_measurement_id', '*', '"G-FJ8MX7VNEP"'),
(UUID(), 'gtm_container_id',   '*', '""'),
(UUID(), 'contact_phone',      '*', '"+90 530 048 41 83"'),
(UUID(), 'contact_email',      '*', '"atakan07sahin@gmail.com"');
