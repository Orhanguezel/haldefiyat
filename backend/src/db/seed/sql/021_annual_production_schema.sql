SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ─── Yıllık Üretim / İstatistik ───────────────────────────────────────────────
-- Günlük hal fiyatı değil, yıllık üretim istatistiği (ton bazlı). İBB
-- yetiştiricilik XLSX ve ileride TÜİK bültenleri gibi kaynaklar buraya yazar.
--
-- (year, species_slug, region_slug) üçlüsü unique — aynı ürün+yıl+bölge
-- birden fazla kaynaktan gelirse son olanla güncellenir.
CREATE TABLE IF NOT EXISTS `hf_annual_production` (
  `id`             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `year`           SMALLINT UNSIGNED NOT NULL,
  `species`        VARCHAR(255)  NOT NULL,
  `species_slug`   VARCHAR(128)  NOT NULL,
  `category_slug`  VARCHAR(64)   NOT NULL DEFAULT 'diger' COMMENT 'balik-kultur, balik-tatlisu, diger...',
  `region_slug`    VARCHAR(64)   NOT NULL DEFAULT 'tr'    COMMENT 'tr (ulusal), istanbul, izmir...',
  `production_ton` DECIMAL(14,2) NOT NULL,
  `source_api`     VARCHAR(64)   NOT NULL,
  `note`           VARCHAR(255)  DEFAULT NULL,
  `created_at`     DATETIME(3)   DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`     DATETIME(3)   DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `hf_prod_year_species_region_uq` (`year`, `species_slug`, `region_slug`),
  KEY `hf_prod_year_idx` (`year`),
  KEY `hf_prod_category_idx` (`category_slug`),
  KEY `hf_prod_region_idx` (`region_slug`),
  KEY `hf_prod_source_idx` (`source_api`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Production ETL Çalıştırma Logu ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `hf_annual_etl_runs` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `source_api`    VARCHAR(64)  NOT NULL,
  `run_at`        DATETIME(3)  DEFAULT CURRENT_TIMESTAMP(3),
  `rows_fetched`  INT          NOT NULL DEFAULT 0,
  `rows_inserted` INT          NOT NULL DEFAULT 0,
  `rows_skipped`  INT          NOT NULL DEFAULT 0,
  `duration_ms`   INT          DEFAULT NULL,
  `status`        ENUM('ok','partial','error') NOT NULL DEFAULT 'ok',
  `error_msg`     TEXT         DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `hf_aer_source_time` (`source_api`, `run_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
