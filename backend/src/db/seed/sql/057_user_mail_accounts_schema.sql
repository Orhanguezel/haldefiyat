SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_mail_accounts (
  id CHAR(36) NOT NULL,
  owner_user_id CHAR(36) NOT NULL,
  provider ENUM('gmail_oauth','imap_smtp') NOT NULL DEFAULT 'gmail_oauth',
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) DEFAULT NULL,
  enc_access_token TEXT DEFAULT NULL,
  enc_refresh_token TEXT DEFAULT NULL,
  token_expiry DATETIME(3) DEFAULT NULL,
  scopes TEXT DEFAULT NULL,
  smtp_host VARCHAR(255) DEFAULT NULL,
  smtp_port INT DEFAULT NULL,
  smtp_secure TINYINT(1) DEFAULT NULL,
  smtp_username VARCHAR(255) DEFAULT NULL,
  enc_password TEXT DEFAULT NULL,
  status ENUM('connected','expired','error','disconnected') NOT NULL DEFAULT 'connected',
  last_error VARCHAR(500) DEFAULT NULL,
  last_synced_at DATETIME(3) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_mail_account_email (owner_user_id, email),
  KEY idx_user_mail_accounts_owner (owner_user_id),
  CONSTRAINT fk_user_mail_accounts_owner FOREIGN KEY (owner_user_id)
    REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_google_task (
  id CHAR(36) NOT NULL,
  owner_user_id CHAR(36) NOT NULL,
  external_id VARCHAR(255) DEFAULT NULL,
  subject VARCHAR(500) NOT NULL,
  body TEXT DEFAULT NULL,
  due_at DATETIME(3) DEFAULT NULL,
  status ENUM('open','done','cancelled') NOT NULL DEFAULT 'open',
  completed_at DATETIME(3) DEFAULT NULL,
  raw_data JSON DEFAULT NULL,
  source ENUM('google','osgb') NOT NULL DEFAULT 'google',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_google_task_external (owner_user_id, external_id),
  KEY idx_user_google_task_owner (owner_user_id, status),
  CONSTRAINT fk_user_google_task_owner FOREIGN KEY (owner_user_id)
    REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_google_event (
  id CHAR(36) NOT NULL,
  owner_user_id CHAR(36) NOT NULL,
  external_id VARCHAR(255) DEFAULT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT DEFAULT NULL,
  starts_at DATETIME(3) DEFAULT NULL,
  ends_at DATETIME(3) DEFAULT NULL,
  location VARCHAR(500) DEFAULT NULL,
  raw_data JSON DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_google_event_external (owner_user_id, external_id),
  KEY idx_user_google_event_owner (owner_user_id, starts_at),
  CONSTRAINT fk_user_google_event_owner FOREIGN KEY (owner_user_id)
    REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Not: hal-fiyatlari'da modül/rol izin tablosu yok; admin route requireAdmin ile gated.
