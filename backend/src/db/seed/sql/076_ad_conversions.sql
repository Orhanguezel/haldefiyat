CREATE TABLE IF NOT EXISTS hf_banner_conversions (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  banner_id INT NOT NULL,
  event_type ENUM('listing_view','offer_submit','phone_click','whatsapp_click','firm_contact','directions_click','favorite_add') NOT NULL,
  entity_type ENUM('listing','firm','product') NOT NULL,
  entity_id VARCHAR(128) NOT NULL,
  visitor_hash VARCHAR(64) NOT NULL,
  source_position VARCHAR(64) NOT NULL,
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY hf_banner_conversions_unique (banner_id, event_type, entity_type, entity_id, visitor_hash),
  KEY hf_banner_conversions_date_idx (created_at, banner_id),
  KEY hf_banner_conversions_entity_idx (entity_type, entity_id)
);
