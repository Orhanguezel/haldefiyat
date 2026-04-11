SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS `newsletter_subscribers` (
  `id` CHAR(36) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `is_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `locale` VARCHAR(10) DEFAULT NULL,
  `meta` LONGTEXT NOT NULL,
  `unsubscribed_at` DATETIME(3) DEFAULT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `newsletter_email_uq` (`email`),
  KEY `newsletter_verified_idx` (`is_verified`),
  KEY `newsletter_locale_idx` (`locale`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
