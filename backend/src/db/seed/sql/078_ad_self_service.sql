CREATE TABLE IF NOT EXISTS hf_firm_members (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  firm_id INT NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  role ENUM('owner','manager','creative','finance','viewer') NOT NULL DEFAULT 'viewer',
  can_view_financials TINYINT NOT NULL DEFAULT 0,
  is_active TINYINT NOT NULL DEFAULT 1,
  invited_by VARCHAR(36) NULL,
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY hf_firm_members_uq (firm_id, user_id),
  KEY hf_firm_members_user_idx (user_id, is_active),
  CONSTRAINT hf_firm_members_firm_fk FOREIGN KEY (firm_id) REFERENCES hf_firms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS hf_ad_self_service_requests (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  firm_id INT NOT NULL,
  banner_id INT UNSIGNED NULL,
  requested_by VARCHAR(36) NOT NULL,
  request_type ENUM('creative_change','extension','new_slot','support') NOT NULL,
  status ENUM('pending','approved','rejected','revision_requested','cancelled') NOT NULL DEFAULT 'pending',
  payload JSON NOT NULL,
  requester_note TEXT NULL,
  review_note TEXT NULL,
  reviewed_by VARCHAR(36) NULL,
  reviewed_at DATETIME(3) NULL,
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY hf_ad_ssr_firm_idx (firm_id, status),
  KEY hf_ad_ssr_banner_idx (banner_id),
  KEY hf_ad_ssr_requester_idx (requested_by),
  CONSTRAINT hf_ad_ssr_firm_fk FOREIGN KEY (firm_id) REFERENCES hf_firms(id) ON DELETE CASCADE,
  CONSTRAINT hf_ad_ssr_banner_fk FOREIGN KEY (banner_id) REFERENCES hf_banners(id) ON DELETE SET NULL
);
