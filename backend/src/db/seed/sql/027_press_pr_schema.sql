CREATE TABLE IF NOT EXISTS hf_press_contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organization VARCHAR(255) NOT NULL,
  publication_type ENUM('newspaper','website','association','chamber','agency','other') NOT NULL DEFAULT 'website',
  contact_name VARCHAR(255) NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NULL,
  city VARCHAR(128) NULL,
  tags JSON NULL,
  status ENUM('target','contacted','replied','published','blocked') NOT NULL DEFAULT 'target',
  notes TEXT NULL,
  last_contacted_at DATETIME(3) NULL,
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY hf_press_contacts_email_uq (email),
  KEY hf_press_contacts_status_idx (status),
  KEY hf_press_contacts_type_city_idx (publication_type, city)
);

CREATE TABLE IF NOT EXISTS hf_press_campaigns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(160) NOT NULL,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  pitch TEXT NOT NULL,
  template_key VARCHAR(128) NULL,
  segment_tags JSON NULL,
  status ENUM('draft','active','completed','archived') NOT NULL DEFAULT 'draft',
  scheduled_at DATETIME(3) NULL,
  sent_at DATETIME(3) NULL,
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY hf_press_campaigns_slug_uq (slug),
  KEY hf_press_campaigns_status_idx (status)
);

CREATE TABLE IF NOT EXISTS hf_press_outreach_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id INT NOT NULL,
  contact_id INT NOT NULL,
  channel ENUM('email','phone','social','other') NOT NULL DEFAULT 'email',
  status ENUM('planned','sent','replied','published','bounced','rejected') NOT NULL DEFAULT 'planned',
  note TEXT NULL,
  published_url VARCHAR(512) NULL,
  contacted_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  KEY hf_press_logs_campaign_idx (campaign_id),
  KEY hf_press_logs_contact_idx (contact_id),
  KEY hf_press_logs_status_idx (status)
);
