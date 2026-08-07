CREATE TABLE IF NOT EXISTS hf_ad_audit_logs (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('banner','slot','package','payment','request','pricing') NOT NULL,
  entity_id VARCHAR(64) NOT NULL,
  action VARCHAR(64) NOT NULL,
  actor_user_id VARCHAR(36) NULL,
  before_data JSON NULL,
  after_data JSON NULL,
  reason VARCHAR(500) NULL,
  is_financial TINYINT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY hf_ad_audit_entity_idx (entity_type, entity_id, created_at),
  KEY hf_ad_audit_actor_idx (actor_user_id, created_at)
);
