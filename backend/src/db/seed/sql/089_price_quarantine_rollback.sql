ALTER TABLE `hf_price_quarantine`
  MODIFY COLUMN `status` ENUM('pending','approved','rejected','corrected','rolled_back') NOT NULL DEFAULT 'pending';

CREATE TABLE IF NOT EXISTS `hf_price_quarantine_decisions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `quarantine_id` BIGINT UNSIGNED NOT NULL,
  `action` ENUM('approve','reject','correct','rollback') NOT NULL,
  `before_price_json` JSON NULL,
  `after_price_json` JSON NULL,
  `note` TEXT NOT NULL,
  `reviewed_by` VARCHAR(36) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `hf_pqd_quarantine_created_idx` (`quarantine_id`,`created_at`),
  CONSTRAINT `fk_hf_pqd_quarantine` FOREIGN KEY (`quarantine_id`) REFERENCES `hf_price_quarantine` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
