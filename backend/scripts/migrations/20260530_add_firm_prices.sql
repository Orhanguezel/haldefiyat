SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS hf_firm_prices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firm_id INT NOT NULL,
  product_slug VARCHAR(128) NULL,
  product_name VARCHAR(255) NOT NULL,
  unit VARCHAR(32) NOT NULL DEFAULT 'kg',
  min_price DECIMAL(12,2) NULL,
  max_price DECIMAL(12,2) NULL,
  avg_price DECIMAL(12,2) NOT NULL,
  recorded_date DATE NOT NULL,
  is_suspicious TINYINT(1) NOT NULL DEFAULT 0,
  created_by VARCHAR(36) NULL,
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT hf_firm_prices_firm_fk FOREIGN KEY (firm_id) REFERENCES hf_firms(id) ON DELETE CASCADE,
  UNIQUE KEY hf_firm_prices_uq (firm_id, product_name, recorded_date),
  KEY hf_firm_prices_firm_date_idx (firm_id, recorded_date),
  KEY hf_firm_prices_product_idx (product_slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
