ALTER TABLE hf_banners
  ADD COLUMN experiment_key VARCHAR(96) NULL AFTER visitor_campaign_impression_limit,
  ADD COLUMN creative_variant VARCHAR(32) NULL AFTER experiment_key,
  ADD COLUMN auto_optimize TINYINT NOT NULL DEFAULT 0 AFTER creative_variant,
  ADD COLUMN minimum_optimization_impressions INT NOT NULL DEFAULT 1000 AFTER auto_optimize,
  ADD COLUMN performance_status ENUM('learning','normal','low','winner') NOT NULL DEFAULT 'learning' AFTER minimum_optimization_impressions,
  ADD KEY hf_banners_experiment_idx (experiment_key, performance_status);
