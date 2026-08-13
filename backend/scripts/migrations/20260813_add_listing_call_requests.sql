CREATE TABLE IF NOT EXISTS hf_listing_call_requests (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL,
  buyer_user_id VARCHAR(36) NOT NULL,
  seller_user_id VARCHAR(36) NULL,
  preferred_slot ENUM('asap','morning','afternoon','evening') NOT NULL DEFAULT 'asap',
  note VARCHAR(500) NULL,
  status ENUM('pending','notified','accepted','declined','expired','cancelled','completed') NOT NULL DEFAULT 'pending',
  consent_at DATETIME(3) NOT NULL,
  notified_at DATETIME(3) NULL,
  resolved_at DATETIME(3) NULL,
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX hf_call_requests_listing_status_idx (listing_id, status, created_at),
  INDEX hf_call_requests_buyer_idx (buyer_user_id, created_at),
  INDEX hf_call_requests_seller_idx (seller_user_id, status, created_at)
);
