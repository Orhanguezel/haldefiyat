SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS `hf_product_editorial` (
  `id`                     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_slug`           VARCHAR(128) NOT NULL,
  `about_md`               TEXT         NOT NULL,
  `price_factors_md`       TEXT         NOT NULL,
  `season_md`              TEXT         NOT NULL,
  `production_region_md`   TEXT         NOT NULL,
  `quality_indicators_md`  TEXT         DEFAULT NULL,
  `culinary_uses_md`       TEXT         DEFAULT NULL,
  `related_slugs`          JSON         DEFAULT NULL COMMENT 'Ilgili urun slug listesi',
  `source`                 ENUM('manual','ai_draft','ai_reviewed') NOT NULL DEFAULT 'manual',
  `reviewed_by`            VARCHAR(36)  DEFAULT NULL,
  `reviewed_at`            DATETIME(3)  DEFAULT NULL,
  `published_at`           DATETIME(3)  DEFAULT NULL,
  `created_at`             DATETIME(3)  DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`             DATETIME(3)  DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `hf_pe_slug_uq` (`product_slug`),
  KEY `hf_pe_published_idx` (`published_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
