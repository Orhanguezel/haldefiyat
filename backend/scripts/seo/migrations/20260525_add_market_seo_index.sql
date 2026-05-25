SET NAMES utf8mb4;
SET time_zone = '+00:00';

DELIMITER //

DROP PROCEDURE IF EXISTS add_hf_market_column_if_missing//
CREATE PROCEDURE add_hf_market_column_if_missing(
  IN p_column_name VARCHAR(64),
  IN p_alter_sql TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'hf_markets'
      AND COLUMN_NAME = p_column_name
  ) THEN
    SET @ddl = p_alter_sql;
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END//

DROP PROCEDURE IF EXISTS add_hf_market_index_if_missing//
CREATE PROCEDURE add_hf_market_index_if_missing(
  IN p_index_name VARCHAR(64),
  IN p_alter_sql TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'hf_markets'
      AND INDEX_NAME = p_index_name
  ) THEN
    SET @ddl = p_alter_sql;
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END//

DELIMITER ;

CALL add_hf_market_column_if_missing('seo_index', 'ALTER TABLE `hf_markets` ADD COLUMN `seo_index` TINYINT(1) NOT NULL DEFAULT 1 COMMENT ''Sitemap ve index havuzuna dahil mi'' AFTER `display_order`');
CALL add_hf_market_index_if_missing('hf_markets_seo_idx', 'ALTER TABLE `hf_markets` ADD INDEX `hf_markets_seo_idx` (`seo_index`, `display_order`)');

UPDATE hf_markets SET seo_index = 1 WHERE seo_index IS NULL;

DROP PROCEDURE IF EXISTS add_hf_market_column_if_missing;
DROP PROCEDURE IF EXISTS add_hf_market_index_if_missing;
