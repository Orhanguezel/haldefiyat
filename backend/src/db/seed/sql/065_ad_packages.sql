CREATE TABLE IF NOT EXISTS hf_ad_packages (
  id INT NOT NULL AUTO_INCREMENT,
  slug VARCHAR(96) NOT NULL,
  name VARCHAR(160) NOT NULL,
  billing_period ENUM('daily','weekly','monthly','custom') NOT NULL DEFAULT 'monthly',
  duration_days INT NOT NULL DEFAULT 30,
  price DECIMAL(12,2) NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'TRY',
  devices JSON NULL,
  impression_limit INT NULL,
  click_limit INT NULL,
  includes_firm_profile TINYINT NOT NULL DEFAULT 0,
  discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  custom_price_allowed TINYINT NOT NULL DEFAULT 0,
  is_active TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY hf_ad_packages_slug_uq (slug),
  KEY hf_ad_packages_active_idx (is_active, billing_period)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hf_ad_package_slots (
  id INT NOT NULL AUTO_INCREMENT,
  package_id INT NOT NULL,
  slot_key VARCHAR(64) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY hf_ad_package_slots_uq (package_id, slot_key),
  KEY hf_ad_package_slots_slot_idx (slot_key, package_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO hf_ad_packages
  (slug, name, billing_period, duration_days, price, currency, devices, custom_price_allowed)
VALUES
  ('gunluk-baslangic', 'Günlük Başlangıç', 'daily', 1, 99, 'TRY', JSON_ARRAY('all'), 1),
  ('haftalik-gorunurluk', 'Haftalık Görünürlük', 'weekly', 7, 499, 'TRY', JSON_ARRAY('all'), 1),
  ('aylik-sponsor', 'Aylık Sponsor', 'monthly', 30, 1499, 'TRY', JSON_ARRAY('all'), 1);
