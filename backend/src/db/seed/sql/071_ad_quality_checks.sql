ALTER TABLE hf_banners
  ADD COLUMN quality_override_reason VARCHAR(500) NULL AFTER creative_config,
  ADD COLUMN quality_checked_at DATETIME(3) NULL AFTER quality_override_reason;
