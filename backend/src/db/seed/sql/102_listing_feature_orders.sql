-- Listing checkout already uses the shared orders model. HalDeFiyat did not
-- provision its table while online payments were disabled. No existing rows
-- or pricing settings are replaced by this migration.
CREATE TABLE IF NOT EXISTS orders (
  id CHAR(36) NOT NULL PRIMARY KEY,
  dealer_id CHAR(36) NOT NULL,
  seller_id CHAR(36) NULL,
  status ENUM('pending','confirmed','shipped','completed','cancelled') NOT NULL DEFAULT 'pending',
  total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  notes TEXT NULL,
  payment_method VARCHAR(32) NULL,
  payment_status ENUM('unpaid','pending','paid','failed','refunded') NOT NULL DEFAULT 'unpaid',
  payment_ref CHAR(36) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX orders_dealer_id_idx (dealer_id),
  INDEX orders_seller_id_idx (seller_id),
  INDEX orders_status_idx (status),
  INDEX orders_created_at_idx (created_at),
  INDEX orders_payment_ref_idx (payment_ref)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
