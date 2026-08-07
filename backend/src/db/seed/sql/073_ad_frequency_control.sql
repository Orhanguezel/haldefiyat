ALTER TABLE hf_banners
  ADD COLUMN visitor_daily_impression_limit INT NOT NULL DEFAULT 3 AFTER daily_impressions_date,
  ADD COLUMN visitor_campaign_impression_limit INT NOT NULL DEFAULT 20 AFTER visitor_daily_impression_limit;

CREATE TABLE IF NOT EXISTS hf_banner_visitor_frequency (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  banner_id INT NOT NULL,
  visitor_hash VARCHAR(64) NOT NULL,
  total_impressions INT NOT NULL DEFAULT 0,
  daily_impressions INT NOT NULL DEFAULT 0,
  daily_date DATE NULL,
  last_page_hash VARCHAR(64) NULL,
  last_impression_at DATETIME(3) NULL,
  last_click_at DATETIME(3) NULL,
  updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY hf_banner_visitor_frequency_uq (banner_id, visitor_hash),
  KEY hf_banner_visitor_frequency_updated_idx (updated_at)
);
