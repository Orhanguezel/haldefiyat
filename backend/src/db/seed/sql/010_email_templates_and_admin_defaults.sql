SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS `email_templates` (
  `id` CHAR(36) NOT NULL,
  `template_key` VARCHAR(100) NOT NULL,
  `template_name` VARCHAR(255) DEFAULT NULL,
  `subject` VARCHAR(500) DEFAULT NULL,
  `content_html` LONGTEXT DEFAULT NULL,
  `variables` LONGTEXT DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_templates_key_uq` (`template_key`),
  KEY `email_templates_active_idx` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`)
SELECT UUID(), 'ui_admin_config', '*', '{"default_locale":"tr","branding":{}}'
WHERE NOT EXISTS (
  SELECT 1 FROM `site_settings` WHERE `key` = 'ui_admin_config' AND `locale` = '*'
);

INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`)
SELECT UUID(), 'site_logo_dark', '*', '{"url":"","alt":""}'
WHERE NOT EXISTS (
  SELECT 1 FROM `site_settings` WHERE `key` = 'site_logo_dark' AND `locale` = '*'
);

INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`)
SELECT UUID(), 'site_logo_light', '*', '{"url":"","alt":""}'
WHERE NOT EXISTS (
  SELECT 1 FROM `site_settings` WHERE `key` = 'site_logo_light' AND `locale` = '*'
);

INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`)
SELECT UUID(), 'site_apple_touch_icon', '*', '{"url":"/uploads/brand/apple-touch-icon.png","alt":"Hal Fiyatlari Apple Touch Icon"}'
WHERE NOT EXISTS (
  SELECT 1 FROM `site_settings` WHERE `key` = 'site_apple_touch_icon' AND `locale` = '*'
);

INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`)
SELECT UUID(), 'site_og_default_image', '*', '{"url":"/uploads/brand/logo.png","alt":"Hal Fiyatlari"}'
WHERE NOT EXISTS (
  SELECT 1 FROM `site_settings` WHERE `key` = 'site_og_default_image' AND `locale` = '*'
);
