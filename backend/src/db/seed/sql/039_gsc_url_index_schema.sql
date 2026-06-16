-- 039_gsc_url_index_schema.sql
-- Google Search Console URL Inspection cache (shared searchConsole modülü kullanır).
-- DROP yok, CREATE IF NOT EXISTS — canlıda güvenli uygulanır.
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `gsc_url_index` (
  `url`            VARCHAR(1000) NOT NULL,
  `verdict`        VARCHAR(64)   DEFAULT NULL,
  `coverage_state` VARCHAR(255)  DEFAULT NULL,
  `last_crawl`     DATETIME(3)   DEFAULT NULL,
  `checked_at`     DATETIME(3)   DEFAULT NULL,
  PRIMARY KEY (`url`(255)),
  KEY `gsc_url_index_verdict_idx` (`verdict`),
  KEY `gsc_url_index_checked_idx` (`checked_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
