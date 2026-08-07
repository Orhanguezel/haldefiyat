CREATE TABLE IF NOT EXISTS hf_banner_daily_metrics (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  banner_id INT NOT NULL,
  metric_date DATE NOT NULL,
  device ENUM('desktop','mobile') NOT NULL,
  scope_key VARCHAR(190) NOT NULL DEFAULT 'global',
  impressions INT NOT NULL DEFAULT 0,
  unique_impressions INT NOT NULL DEFAULT 0,
  clicks INT NOT NULL DEFAULT 0,
  unique_clicks INT NOT NULL DEFAULT 0,
  updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY hf_banner_daily_metrics_uq (banner_id, metric_date, device, scope_key),
  KEY hf_banner_daily_metrics_date_idx (metric_date, banner_id)
);

CREATE TABLE IF NOT EXISTS hf_banner_metric_uniques (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  banner_id INT NOT NULL,
  metric_date DATE NOT NULL,
  visitor_hash VARCHAR(64) NOT NULL,
  event_type ENUM('impression','click') NOT NULL,
  device ENUM('desktop','mobile') NOT NULL,
  scope_key VARCHAR(190) NOT NULL DEFAULT 'global',
  UNIQUE KEY hf_banner_metric_uniques_uq (banner_id, metric_date, visitor_hash, event_type, device, scope_key),
  KEY hf_banner_metric_uniques_date_idx (metric_date)
);
