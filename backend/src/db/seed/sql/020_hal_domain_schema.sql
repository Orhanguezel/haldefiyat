SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ─── Hal Pazarları ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `hf_markets` (
  `id`            INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `slug`          VARCHAR(128)     NOT NULL,
  `name`          VARCHAR(255)     NOT NULL,
  `city_name`     VARCHAR(128)     NOT NULL,
  `region_slug`   VARCHAR(64)      DEFAULT NULL,
  `source_key`    VARCHAR(64)      DEFAULT NULL COMMENT 'api kaynak tanımlayıcısı: ibb, izmir, manual...',
  `display_order` INT              NOT NULL DEFAULT 0,
  `is_active`     TINYINT(1)       NOT NULL DEFAULT 1,
  `created_at`    DATETIME(3)      DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`    DATETIME(3)      DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `hf_markets_slug_uq` (`slug`),
  KEY `hf_markets_city_idx` (`city_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Ürünler ──────────────────────────────────────────────────────────────────
-- category_slug: sebze, meyve, bakliyat, tahil vb.
-- aliases: JSON array — normalizer için varyantlar (["Havuc","havuç","HAVUÇ"])
CREATE TABLE IF NOT EXISTS `hf_products` (
  `id`            INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `slug`          VARCHAR(128)     NOT NULL,
  `name_tr`       VARCHAR(255)     NOT NULL,
  `category_slug` VARCHAR(64)      NOT NULL DEFAULT 'diger',
  `unit`          VARCHAR(32)      NOT NULL DEFAULT 'kg',
  `aliases`       JSON             DEFAULT NULL COMMENT 'Türkçe varyant listesi normalizer için',
  `display_order` INT              NOT NULL DEFAULT 0,
  `is_active`     TINYINT(1)       NOT NULL DEFAULT 1,
  `created_at`    DATETIME(3)      DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`    DATETIME(3)      DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `hf_products_slug_uq` (`slug`),
  KEY `hf_products_category_idx` (`category_slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Fiyat Geçmişi ────────────────────────────────────────────────────────────
-- IBB API: her ürün/hal/gün için min/max/avg fiyat döndürür
-- avg_price: NULL değilse gösterilecek ana fiyat; NULL ise min+max ortalaması kullanılır
CREATE TABLE IF NOT EXISTS `hf_price_history` (
  `id`            INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `product_id`    INT UNSIGNED     NOT NULL,
  `market_id`     INT UNSIGNED     NOT NULL,
  `min_price`     DECIMAL(12,2)    DEFAULT NULL,
  `max_price`     DECIMAL(12,2)    DEFAULT NULL,
  `avg_price`     DECIMAL(12,2)    NOT NULL,
  `currency`      VARCHAR(8)       NOT NULL DEFAULT 'TRY',
  `unit`          VARCHAR(32)      NOT NULL DEFAULT 'kg',
  `recorded_date` DATE             NOT NULL,
  `source_api`    VARCHAR(64)      NOT NULL DEFAULT 'manual'
                                   COMMENT 'ibb | izmir | balikesir | bursa | manual | seed',
  `created_at`    DATETIME(3)      DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `hf_ph_product_market_date_uq` (`product_id`, `market_id`, `recorded_date`),
  KEY `hf_ph_recorded_date` (`recorded_date`),
  KEY `hf_ph_source_api` (`source_api`),
  CONSTRAINT `fk_hf_ph_product` FOREIGN KEY (`product_id`) REFERENCES `hf_products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_hf_ph_market`  FOREIGN KEY (`market_id`)  REFERENCES `hf_markets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Fiyat Alarmları ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `hf_alerts` (
  `id`              INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `product_id`      INT UNSIGNED     NOT NULL,
  `market_id`       INT UNSIGNED     DEFAULT NULL,
  `threshold_price` DECIMAL(12,2)    DEFAULT NULL,
  `direction`       ENUM('above','below') DEFAULT NULL,
  `contact_email`   VARCHAR(255)     DEFAULT NULL,
  `contact_telegram`VARCHAR(128)     DEFAULT NULL COMMENT 'Telegram chat_id veya username',
  `is_active`       TINYINT(1)       NOT NULL DEFAULT 1,
  `last_triggered`  DATETIME(3)      DEFAULT NULL,
  `created_at`      DATETIME(3)      DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `hf_alerts_product_idx` (`product_id`),
  CONSTRAINT `fk_hf_alerts_product` FOREIGN KEY (`product_id`) REFERENCES `hf_products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_hf_alerts_market`  FOREIGN KEY (`market_id`)  REFERENCES `hf_markets`  (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── ETL Çalıştırma Logu ──────────────────────────────────────────────────────
-- Her cron çalışmasının sonucunu kaydeder (monitoring için)
CREATE TABLE IF NOT EXISTS `hf_etl_runs` (
  `id`            INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `source_api`    VARCHAR(64)      NOT NULL,
  `run_date`      DATE             NOT NULL,
  `rows_fetched`  INT              NOT NULL DEFAULT 0,
  `rows_inserted` INT              NOT NULL DEFAULT 0,
  `rows_skipped`  INT              NOT NULL DEFAULT 0,
  `duration_ms`   INT              DEFAULT NULL,
  `status`        ENUM('ok','partial','error') NOT NULL DEFAULT 'ok',
  `error_msg`     TEXT             DEFAULT NULL,
  `created_at`    DATETIME(3)      DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `hf_etl_runs_source_date` (`source_api`, `run_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Pazar kataloğu (ETL kaynakları için FK referansı) ─────────────────────
-- Sadece config/etl-sources.ts'teki aktif kaynakların market referansı burada
-- tutulur. Placeholder "gelecekte bir gün" hal'leri yer almaz — yeni kaynak
-- aktifleştirilirken config + bu seed beraber güncellenir.
--   izmir-hal                : izmir_sebzemeyve + izmir_balik
--   antalya-hal-merkez       : antalya_merkez_antkomder
--   antalya-hal-serik        : antalya_serik_antkomder (dernek fiyat açınca aktif)
--   antalya-hal-kumluca      : antalya_kumluca_antkomder (dernek fiyat açınca aktif)
INSERT INTO `hf_markets` (`slug`, `name`, `city_name`, `region_slug`, `source_key`, `display_order`, `is_active`) VALUES
('izmir-hal',           'İzmir Toptancı Hali',            'İzmir',    'ege',        'izmir_sebzemeyve',         1, 1),
('konya-hal',           'Konya Toptancı Hali',            'Konya',    'ic-anadolu', 'konya_resmi',              2, 1),
('kayseri-hal',         'Kayseri Toptancı Hali',          'Kayseri',  'ic-anadolu', 'kayseri_resmi',            3, 1),
('eskisehir-hal',       'Eskişehir Toptancı Hali',        'Eskişehir','ic-anadolu', 'eskisehir_resmi',          4, 1),
('denizli-hal',         'Denizli Toptancı Hali',          'Denizli',  'ege',        'denizli_resmi',            5, 1),
('antalya-hal-merkez',  'Antalya Toptancı Hali (Merkez)', 'Antalya',  'akdeniz',    'antalya_merkez_antkomder', 6, 1),
('antalya-hal-serik',   'Antalya Serik Hali',             'Antalya',  'akdeniz',    'antalya_serik_antkomder',  7, 1),
('antalya-hal-kumluca', 'Antalya Kumluca Hali',           'Antalya',  'akdeniz',    'antalya_kumluca_antkomder',8, 1)
ON DUPLICATE KEY UPDATE
  `name`       = VALUES(`name`),
  `source_key` = VALUES(`source_key`),
  `is_active`  = VALUES(`is_active`);

-- Ürün kataloğu ETL ilk çalıştığında kaynaklardan otomatik doldurulur
-- (ETL_AUTO_REGISTER_PRODUCTS=true). Bu nedenle seed'de hiçbir ürün
-- tanımlanmaz — tüm katalog gerçek veriden inşa edilir.
