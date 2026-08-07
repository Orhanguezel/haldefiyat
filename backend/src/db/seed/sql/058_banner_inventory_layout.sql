ALTER TABLE hf_banners
  ADD COLUMN source_type ENUM('custom','listing','firm','code') NOT NULL DEFAULT 'custom' AFTER type,
  ADD COLUMN listing_id INT UNSIGNED NULL AFTER source_type,
  ADD COLUMN firm_id INT UNSIGNED NULL AFTER listing_id,
  ADD COLUMN sponsorship_id INT UNSIGNED NULL AFTER firm_id,
  ADD COLUMN desktop_row INT UNSIGNED NOT NULL DEFAULT 1 AFTER device,
  ADD COLUMN desktop_columns TINYINT UNSIGNED NOT NULL DEFAULT 1 AFTER desktop_row,
  ADD COLUMN archived_at DATETIME(3) NULL AFTER end_at,
  ADD INDEX hf_banners_layout_idx (position, desktop_row, is_active, start_at, end_at),
  ADD INDEX hf_banners_listing_idx (listing_id),
  ADD INDEX hf_banners_firm_idx (firm_id);

UPDATE hf_banners
SET source_type = CASE WHEN type = 'code' THEN 'code' ELSE 'custom' END
WHERE source_type IS NULL OR source_type = '';
