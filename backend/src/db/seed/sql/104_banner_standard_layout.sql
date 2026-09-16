-- Run backend/scripts/banner-standard-migrate.ts --apply after upgrading an existing inventory.
-- Nullable during expansion: the migration validates and assigns positions before enforcing NOT NULL.
ALTER TABLE hf_banners
  ADD COLUMN ad_format VARCHAR(16) NULL,
  ADD COLUMN grid_column INT NULL;
