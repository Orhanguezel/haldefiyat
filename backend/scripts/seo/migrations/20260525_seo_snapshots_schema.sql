SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS `hf_seo_snapshots` (
  `id`                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `snapshot_date`      DATE         NOT NULL,
  `url`                VARCHAR(512) NOT NULL,
  `coverage_state`     VARCHAR(64)  DEFAULT NULL,
  `last_crawled`       DATETIME(3)  DEFAULT NULL,
  `google_canonical`   VARCHAR(512) DEFAULT NULL,
  `user_canonical`     VARCHAR(512) DEFAULT NULL,
  `clicks_28d`         INT          NOT NULL DEFAULT 0,
  `impressions_28d`    INT          NOT NULL DEFAULT 0,
  `position_avg`       DECIMAL(5,2) DEFAULT NULL,
  `ctr_pct`            DECIMAL(5,2) DEFAULT NULL,
  `created_at`         DATETIME(3)  DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`         DATETIME(3)  DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `hf_seo_snapshots_uq` (`snapshot_date`, `url`),
  KEY `hf_seo_snapshots_date_idx` (`snapshot_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
