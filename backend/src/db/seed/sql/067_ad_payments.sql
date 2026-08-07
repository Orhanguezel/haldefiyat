ALTER TABLE hf_banners
  ADD COLUMN total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER payment_override_reason,
  ADD COLUMN payment_due_at DATETIME(3) NULL AFTER total_amount;

CREATE TABLE IF NOT EXISTS hf_ad_payments (
  id INT NOT NULL AUTO_INCREMENT,
  banner_id INT NOT NULL,
  transaction_type ENUM('payment','refund') NOT NULL DEFAULT 'payment',
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'TRY',
  payment_method ENUM('cash','bank_transfer','card','other') NOT NULL,
  paid_at DATETIME(3) NOT NULL,
  reference_number VARCHAR(160) NULL,
  notes VARCHAR(500) NULL,
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY hf_ad_payments_banner_idx (banner_id, paid_at),
  KEY hf_ad_payments_reference_idx (reference_number)
);
