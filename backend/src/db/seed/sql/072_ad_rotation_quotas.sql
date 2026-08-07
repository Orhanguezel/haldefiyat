ALTER TABLE hf_banners
  ADD COLUMN impression_limit INT NULL AFTER clicks,
  ADD COLUMN click_limit INT NULL AFTER impression_limit,
  ADD COLUMN daily_impression_limit INT NULL AFTER click_limit,
  ADD COLUMN daily_impressions INT NOT NULL DEFAULT 0 AFTER daily_impression_limit,
  ADD COLUMN daily_impressions_date DATE NULL AFTER daily_impressions;
