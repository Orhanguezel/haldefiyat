CREATE TABLE IF NOT EXISTS hf_banner_targets (
  id INT NOT NULL AUTO_INCREMENT,
  banner_id INT NOT NULL,
  scope_type ENUM('global','page_type','city','district','product','category','market','firm','listing') NOT NULL,
  scope_value VARCHAR(190) NULL,
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY hf_banner_targets_unique (banner_id, scope_type, scope_value),
  KEY hf_banner_targets_lookup_idx (scope_type, scope_value, banner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
