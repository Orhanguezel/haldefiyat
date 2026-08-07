ALTER TABLE hf_banners
  ADD COLUMN lifecycle_status ENUM(
    'draft','proposal','reserved','payment_pending','scheduled',
    'live','completed','cancelled','problem','archived'
  ) NOT NULL DEFAULT 'draft' AFTER source_type,
  ADD COLUMN reservation_expires_at DATETIME(3) NULL AFTER end_at,
  ADD COLUMN sales_owner VARCHAR(160) NULL AFTER reservation_expires_at,
  ADD COLUMN cancellation_reason VARCHAR(500) NULL AFTER sales_owner,
  ADD INDEX hf_banners_lifecycle_idx (lifecycle_status, start_at, end_at, reservation_expires_at);

UPDATE hf_banners
SET lifecycle_status = CASE
  WHEN archived_at IS NOT NULL THEN 'archived'
  WHEN is_active = 1 AND start_at IS NOT NULL AND start_at > CURRENT_TIMESTAMP(3) THEN 'scheduled'
  WHEN is_active = 1 AND (end_at IS NULL OR end_at >= CURRENT_TIMESTAMP(3)) THEN 'live'
  WHEN end_at IS NOT NULL AND end_at < CURRENT_TIMESTAMP(3) THEN 'completed'
  ELSE 'draft'
END;
