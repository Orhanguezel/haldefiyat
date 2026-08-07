ALTER TABLE hf_ad_slots
  ADD COLUMN base_daily_price DECIMAL(12,2) NOT NULL DEFAULT 100.00 AFTER delivery_mode,
  ADD COLUMN traffic_multiplier DECIMAL(6,3) NOT NULL DEFAULT 1.000 AFTER base_daily_price,
  ADD COLUMN visibility_multiplier DECIMAL(6,3) NOT NULL DEFAULT 1.000 AFTER traffic_multiplier,
  ADD COLUMN desktop_multiplier DECIMAL(6,3) NOT NULL DEFAULT 1.000 AFTER visibility_multiplier,
  ADD COLUMN mobile_multiplier DECIMAL(6,3) NOT NULL DEFAULT 1.000 AFTER desktop_multiplier;

UPDATE hf_ad_slots SET
  base_daily_price = CASE
    WHEN slot_key LIKE '%top%' OR slot_key = 'home_hero' THEN 225
    WHEN slot_key LIKE '%sidebar%' THEN 150
    WHEN slot_key LIKE '%footer%' THEN 90
    ELSE 125
  END,
  traffic_multiplier = CASE
    WHEN page_type IN ('home', 'prices') THEN 1.250
    WHEN page_type = 'global' THEN 1.150
    ELSE 1.000
  END,
  visibility_multiplier = CASE
    WHEN slot_key LIKE '%top%' OR slot_key = 'home_hero' THEN 1.300
    WHEN slot_key LIKE '%sidebar%' THEN 1.100
    WHEN slot_key LIKE '%footer%' THEN 0.850
    ELSE 1.000
  END;

CREATE TABLE IF NOT EXISTS hf_ad_price_overrides (
  id INT NOT NULL AUTO_INCREMENT,
  banner_id INT NULL,
  slot_key VARCHAR(64) NOT NULL,
  suggested_price DECIMAL(12,2) NOT NULL,
  applied_price DECIMAL(12,2) NOT NULL,
  discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  reason VARCHAR(500) NOT NULL,
  calculation JSON NOT NULL,
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY hf_ad_price_overrides_banner_idx (banner_id, created_at),
  KEY hf_ad_price_overrides_slot_idx (slot_key, created_at)
);
