CREATE TABLE IF NOT EXISTS hf_newsletter_suppressions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  reason ENUM('hard_bounce', 'complaint', 'manual') NOT NULL,
  provider VARCHAR(64) DEFAULT NULL,
  provider_event_id VARCHAR(191) DEFAULT NULL,
  detail VARCHAR(500) DEFAULT NULL,
  occurred_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  created_by VARCHAR(36) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY hf_newsletter_suppressions_email_uq (email),
  UNIQUE KEY hf_newsletter_suppressions_provider_event_uq (provider_event_id),
  KEY hf_newsletter_suppressions_reason_idx (reason, occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
