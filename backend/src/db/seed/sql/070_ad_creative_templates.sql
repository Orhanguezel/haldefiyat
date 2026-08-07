ALTER TABLE hf_banners
  ADD COLUMN creative_template VARCHAR(64) NOT NULL DEFAULT 'image' AFTER creative_file_url,
  ADD COLUMN creative_config JSON NULL AFTER creative_template;

UPDATE hf_banners SET creative_template = 'mpu' WHERE id = 3;
UPDATE hf_banners SET creative_template = 'leaderboard' WHERE id = 5;
