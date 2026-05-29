SET NAMES utf8mb4;
SET time_zone = '+00:00';

DELIMITER //

DROP PROCEDURE IF EXISTS add_hf_firm_column_if_missing//
CREATE PROCEDURE add_hf_firm_column_if_missing(
  IN p_column_name VARCHAR(64),
  IN p_alter_sql TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'hf_firms'
      AND COLUMN_NAME = p_column_name
  ) THEN
    SET @ddl = p_alter_sql;
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END//

DROP PROCEDURE IF EXISTS add_hf_firm_index_if_missing//
CREATE PROCEDURE add_hf_firm_index_if_missing(
  IN p_index_name VARCHAR(64),
  IN p_alter_sql TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'hf_firms'
      AND INDEX_NAME = p_index_name
  ) THEN
    SET @ddl = p_alter_sql;
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END//

DELIMITER ;

CALL add_hf_firm_column_if_missing('owner_user_id', 'ALTER TABLE `hf_firms` ADD COLUMN `owner_user_id` VARCHAR(36) NULL AFTER `categories`');
CALL add_hf_firm_column_if_missing('source', 'ALTER TABLE `hf_firms` ADD COLUMN `source` ENUM(''halkatalogu'',''user'') NOT NULL DEFAULT ''halkatalogu'' AFTER `owner_user_id`');
CALL add_hf_firm_column_if_missing('status', 'ALTER TABLE `hf_firms` ADD COLUMN `status` ENUM(''pending'',''approved'',''rejected'') NOT NULL DEFAULT ''approved'' AFTER `source`');
CALL add_hf_firm_column_if_missing('description', 'ALTER TABLE `hf_firms` ADD COLUMN `description` TEXT NULL AFTER `status`');
CALL add_hf_firm_column_if_missing('claim_status', 'ALTER TABLE `hf_firms` ADD COLUMN `claim_status` ENUM(''unclaimed'',''pending'',''verified'') NOT NULL DEFAULT ''unclaimed'' AFTER `description`');

CALL add_hf_firm_index_if_missing('hf_firms_owner_idx', 'ALTER TABLE `hf_firms` ADD INDEX `hf_firms_owner_idx` (`owner_user_id`)');
CALL add_hf_firm_index_if_missing('hf_firms_status_idx', 'ALTER TABLE `hf_firms` ADD INDEX `hf_firms_status_idx` (`status`, `source`)');
CALL add_hf_firm_index_if_missing('hf_firms_claim_status_idx', 'ALTER TABLE `hf_firms` ADD INDEX `hf_firms_claim_status_idx` (`claim_status`)');

DROP PROCEDURE IF EXISTS add_hf_firm_column_if_missing;
DROP PROCEDURE IF EXISTS add_hf_firm_index_if_missing;

CREATE TABLE IF NOT EXISTS hf_firm_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firm_id INT NOT NULL,
  product_slug VARCHAR(128) NULL,
  product_name VARCHAR(255) NOT NULL,
  note VARCHAR(500) NULL,
  price VARCHAR(128) NULL,
  display_order INT NOT NULL DEFAULT 100,
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT hf_firm_products_firm_fk FOREIGN KEY (firm_id) REFERENCES hf_firms(id) ON DELETE CASCADE,
  KEY hf_firm_products_firm_idx (firm_id),
  KEY hf_firm_products_product_idx (product_slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hf_firm_claims (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firm_id INT NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  evidence TEXT NULL,
  reviewed_by VARCHAR(36) NULL,
  reviewed_at DATETIME(3) NULL,
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT hf_firm_claims_firm_fk FOREIGN KEY (firm_id) REFERENCES hf_firms(id) ON DELETE CASCADE,
  KEY hf_firm_claims_firm_idx (firm_id),
  KEY hf_firm_claims_user_idx (user_id),
  KEY hf_firm_claims_status_idx (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
