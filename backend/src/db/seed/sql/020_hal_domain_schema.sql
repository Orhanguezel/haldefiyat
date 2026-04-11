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

-- ─── Seed: Pazarlar ───────────────────────────────────────────────────────────
INSERT INTO `hf_markets` (`slug`, `name`, `city_name`, `region_slug`, `source_key`, `display_order`) VALUES
('istanbul-hal',   'İstanbul Toptancı Hali',  'İstanbul', 'marmara', 'ibb',      1),
('izmir-hal',      'İzmir Toptancı Hali',     'İzmir',    'ege',     'izmir',    2),
('antalya-hal',    'Antalya Toptancı Hali',   'Antalya',  'akdeniz', 'manual',   3),
('ankara-hal',     'Ankara Toptancı Hali',    'Ankara',   'ic-anadolu', 'manual', 4),
('bursa-hal',      'Bursa Toptancı Hali',     'Bursa',    'marmara', 'bursa',    5),
('balikesir-hal',  'Balıkesir Toptancı Hali', 'Balıkesir','ege',     'balikesir',6),
('konya-hal',      'Konya Toptancı Hali',     'Konya',    'ic-anadolu', 'manual', 7),
('adana-hal',      'Adana Toptancı Hali',     'Adana',    'akdeniz', 'manual',   8)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `source_key` = VALUES(`source_key`);

-- ─── Seed: Ürünler ────────────────────────────────────────────────────────────
-- aliases: IBB API'den gelen varyant isimler (normalizasyon için)
INSERT INTO `hf_products` (`slug`, `name_tr`, `category_slug`, `unit`, `aliases`, `display_order`) VALUES
-- Sebzeler
('domates',       'Domates',          'sebze', 'kg', '["domates","Domates","DOMATES"]',              1),
('biber',         'Sivri Biber',      'sebze', 'kg', '["biber","sivri biber","Sivri Biber","Biber"]',2),
('patates',       'Patates',          'sebze', 'kg', '["patates","Patates","PATATES"]',               3),
('sogan',         'Soğan',            'sebze', 'kg', '["sogan","soğan","Soğan","Sogan"]',             4),
('havuc',         'Havuç',            'sebze', 'kg', '["havuc","havuç","Havuç","Havuc"]',             5),
('kabak',         'Kabak',            'sebze', 'kg', '["kabak","Kabak","KABAK"]',                     6),
('patlican',      'Patlıcan',         'sebze', 'kg', '["patlican","patlıcan","Patlıcan"]',            7),
('ispanak',       'Ispanak',          'sebze', 'kg', '["ıspanak","ispanak","Ispanak"]',               8),
('marul',         'Marul',            'sebze', 'kg', '["marul","Marul"]',                            9),
('salatalik',     'Salatalık',        'sebze', 'kg', '["salatalik","salatalık","Salatalık"]',        10),
-- Meyveler
('elma',          'Elma',             'meyve', 'kg', '["elma","Elma","ELMA"]',                       20),
('armut',         'Armut',            'meyve', 'kg', '["armut","Armut"]',                            21),
('uzum',          'Üzüm',             'meyve', 'kg', '["uzum","üzüm","Üzüm"]',                       22),
('nar',           'Nar',              'meyve', 'kg', '["nar","Nar"]',                                23),
('portakal',      'Portakal',         'meyve', 'kg', '["portakal","Portakal"]',                      24),
('mandalina',     'Mandalina',        'meyve', 'kg', '["mandalina","Mandalina"]',                    25),
('limon',         'Limon',            'meyve', 'kg', '["limon","Limon"]',                            26),
('cilek',         'Çilek',            'meyve', 'kg', '["cilek","çilek","Çilek"]',                    27),
('kayisi',        'Kayısı',           'meyve', 'kg', '["kayisi","kayısı","Kayısı"]',                 28),
('seftali',       'Şeftali',          'meyve', 'kg', '["seftali","şeftali","Şeftali"]',              29),
-- Bakliyat
('kuru-fasulye',  'Kuru Fasulye',     'bakliyat', 'kg', '["kuru fasulye","Kuru Fasulye"]',           40),
('nohut',         'Nohut',            'bakliyat', 'kg', '["nohut","Nohut"]',                         41),
('mercimek',      'Kırmızı Mercimek', 'bakliyat', 'kg', '["mercimek","kırmızı mercimek","Mercimek"]',42)
ON DUPLICATE KEY UPDATE `name_tr` = VALUES(`name_tr`), `aliases` = VALUES(`aliases`), `category_slug` = VALUES(`category_slug`);

-- ─── Seed: Örnek fiyat verisi (7 günlük) ─────────────────────────────────────
INSERT IGNORE INTO `hf_price_history`
  (`product_id`, `market_id`, `min_price`, `max_price`, `avg_price`, `currency`, `unit`, `recorded_date`, `source_api`)
SELECT
  p.id,
  m.id,
  ROUND(35.00 + (p.id * 2.5) + (m.id * 0.3) + (d.day_offset * 0.2) - 5, 2)  AS min_price,
  ROUND(35.00 + (p.id * 2.5) + (m.id * 0.3) + (d.day_offset * 0.2) + 8, 2)  AS max_price,
  ROUND(35.00 + (p.id * 2.5) + (m.id * 0.3) + (d.day_offset * 0.2) + 1.5, 2) AS avg_price,
  'TRY',
  'kg',
  DATE_SUB(CURDATE(), INTERVAL d.day_offset DAY),
  'seed'
FROM `hf_products` p
CROSS JOIN `hf_markets` m
CROSS JOIN (
  SELECT 0 AS day_offset UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
  UNION SELECT 5 UNION SELECT 6
) d
WHERE p.is_active = 1 AND m.is_active = 1;
