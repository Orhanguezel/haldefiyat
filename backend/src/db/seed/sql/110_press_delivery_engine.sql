-- Basın kampanyaları için onaya bağlı, hız sınırlı gerçek gönderim kuyruğu.
-- Bu migration mevcut kurulumlara bir kez uygulanır.

ALTER TABLE hf_press_campaigns
  ADD COLUMN from_email VARCHAR(255) NOT NULL DEFAULT 'noreply@haldefiyat.com' AFTER segment_tags,
  ADD COLUMN reply_to_email VARCHAR(255) NOT NULL DEFAULT 'info@gzlteknoloji.com' AFTER from_email,
  ADD COLUMN rate_per_minute SMALLINT UNSIGNED NOT NULL DEFAULT 4 AFTER reply_to_email,
  ADD COLUMN delay_min_seconds SMALLINT UNSIGNED NOT NULL DEFAULT 15 AFTER rate_per_minute,
  ADD COLUMN delay_max_seconds SMALLINT UNSIGNED NOT NULL DEFAULT 25 AFTER delay_min_seconds,
  ADD COLUMN approved_preflight_hash CHAR(64) NULL AFTER sent_at,
  ADD COLUMN approved_at DATETIME(3) NULL AFTER approved_preflight_hash,
  ADD COLUMN approved_by VARCHAR(64) NULL AFTER approved_at,
  ADD COLUMN approval_snapshot LONGTEXT NULL AFTER approved_by,
  ADD COLUMN next_send_at DATETIME(3) NULL AFTER approval_snapshot,
  ADD COLUMN last_error VARCHAR(500) NULL AFTER next_send_at;

ALTER TABLE hf_press_outreach_logs
  MODIFY COLUMN status ENUM('planned','processing','sent','replied','published','bounced','rejected','failed','skipped','uncertain') NOT NULL DEFAULT 'planned',
  MODIFY COLUMN contacted_at DATETIME(3) NULL DEFAULT NULL,
  ADD COLUMN scheduled_at DATETIME(3) NULL AFTER contacted_at,
  ADD COLUMN sent_at DATETIME(3) NULL AFTER scheduled_at,
  ADD COLUMN provider_message_id VARCHAR(255) NULL AFTER sent_at,
  ADD COLUMN failure_class VARCHAR(64) NULL AFTER provider_message_id,
  ADD COLUMN last_error VARCHAR(500) NULL AFTER failure_class,
  ADD COLUMN attempt_count SMALLINT UNSIGNED NOT NULL DEFAULT 0 AFTER last_error,
  ADD COLUMN smtp_handoff_at DATETIME(3) NULL AFTER attempt_count,
  ADD UNIQUE KEY hf_press_logs_campaign_contact_channel_uq (campaign_id, contact_id, channel),
  ADD KEY hf_press_logs_delivery_idx (status, scheduled_at);

UPDATE hf_press_outreach_logs SET contacted_at = NULL WHERE status = 'planned';
