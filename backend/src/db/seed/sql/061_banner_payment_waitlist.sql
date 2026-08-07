ALTER TABLE hf_banners
  ADD COLUMN payment_status ENUM('unpaid','partial','paid','waived','refunded','cancelled') NOT NULL DEFAULT 'unpaid' AFTER lifecycle_status,
  ADD COLUMN payment_override TINYINT(1) NOT NULL DEFAULT 0 AFTER payment_status,
  ADD COLUMN payment_override_reason VARCHAR(500) NULL AFTER payment_override,
  ADD INDEX hf_banners_payment_idx (payment_status, lifecycle_status);

UPDATE hf_banners
SET payment_status = 'waived',
    payment_override = 1,
    payment_override_reason = 'Sistem gecisinden once yayinda olan reklam'
WHERE lifecycle_status IN ('scheduled','live');

CREATE TABLE IF NOT EXISTS hf_ad_waitlist (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  position VARCHAR(64) NOT NULL,
  title VARCHAR(190) NOT NULL,
  advertiser VARCHAR(160) NULL,
  source_type ENUM('custom','listing','firm','code') NOT NULL DEFAULT 'custom',
  listing_id INT UNSIGNED NULL,
  firm_id INT UNSIGNED NULL,
  device ENUM('all','desktop','mobile') NOT NULL DEFAULT 'all',
  preferred_start_at DATETIME(3) NULL,
  preferred_end_at DATETIME(3) NULL,
  priority INT NOT NULL DEFAULT 0,
  status ENUM('waiting','offered','converted','cancelled') NOT NULL DEFAULT 'waiting',
  notes VARCHAR(500) NULL,
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY hf_ad_waitlist_status_idx (status, priority, created_at),
  KEY hf_ad_waitlist_position_idx (position, preferred_start_at, preferred_end_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
