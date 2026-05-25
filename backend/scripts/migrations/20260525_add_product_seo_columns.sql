SET NAMES utf8mb4;
SET time_zone = '+00:00';

DELIMITER //

DROP PROCEDURE IF EXISTS add_hf_product_column_if_missing//
CREATE PROCEDURE add_hf_product_column_if_missing(
  IN p_column_name VARCHAR(64),
  IN p_alter_sql TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'hf_products'
      AND COLUMN_NAME = p_column_name
  ) THEN
    SET @ddl = p_alter_sql;
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END//

DROP PROCEDURE IF EXISTS add_hf_product_index_if_missing//
CREATE PROCEDURE add_hf_product_index_if_missing(
  IN p_index_name VARCHAR(64),
  IN p_alter_sql TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'hf_products'
      AND INDEX_NAME = p_index_name
  ) THEN
    SET @ddl = p_alter_sql;
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END//

DELIMITER ;

CALL add_hf_product_column_if_missing('display_name', 'ALTER TABLE `hf_products` ADD COLUMN `display_name` VARCHAR(160) DEFAULT NULL COMMENT ''Insancil baslik. NULL ise name_tr Title-Case fallback'' AFTER `aliases`');
CALL add_hf_product_column_if_missing('canonical_slug', 'ALTER TABLE `hf_products` ADD COLUMN `canonical_slug` VARCHAR(128) DEFAULT NULL COMMENT ''Master urune yonlendirme hedefi. NULL = bu kayit master'' AFTER `display_name`');
CALL add_hf_product_column_if_missing('seo_index', 'ALTER TABLE `hf_products` ADD COLUMN `seo_index` TINYINT(1) NOT NULL DEFAULT 0 COMMENT ''Sitemap ve index havuzuna dahil mi'' AFTER `canonical_slug`');
CALL add_hf_product_column_if_missing('data_quality', 'ALTER TABLE `hf_products` ADD COLUMN `data_quality` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT ''0-100 otomatik veri kalite skoru'' AFTER `seo_index`');
CALL add_hf_product_column_if_missing('search_volume', 'ALTER TABLE `hf_products` ADD COLUMN `search_volume` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT ''Manuel aylik arama hacmi tahmini'' AFTER `data_quality`');

CALL add_hf_product_index_if_missing('hf_products_canonical_idx', 'ALTER TABLE `hf_products` ADD INDEX `hf_products_canonical_idx` (`canonical_slug`)');
CALL add_hf_product_index_if_missing('hf_products_seo_idx', 'ALTER TABLE `hf_products` ADD INDEX `hf_products_seo_idx` (`seo_index`, `display_order`)');

DROP PROCEDURE IF EXISTS add_hf_product_column_if_missing;
DROP PROCEDURE IF EXISTS add_hf_product_index_if_missing;

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
