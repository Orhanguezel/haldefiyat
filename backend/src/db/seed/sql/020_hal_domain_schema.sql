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
  `market_type`   ENUM('hal','borsa','resmi','kooperatif') NOT NULL DEFAULT 'hal',
  `display_order` INT              NOT NULL DEFAULT 0,
  `seo_index`     TINYINT(1)       NOT NULL DEFAULT 1 COMMENT 'Sitemap ve index havuzuna dahil mi',
  `is_active`     TINYINT(1)       NOT NULL DEFAULT 1,
  `created_at`    DATETIME(3)      DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`    DATETIME(3)      DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `hf_markets_slug_uq` (`slug`),
  KEY `hf_markets_city_idx` (`city_name`),
  KEY `hf_markets_type_idx` (`market_type`, `is_active`),
  KEY `hf_markets_seo_idx` (`seo_index`, `display_order`)
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
  `display_name`  VARCHAR(160)     DEFAULT NULL COMMENT 'Insancil baslik. NULL ise name_tr Title-Case fallback',
  `canonical_slug` VARCHAR(128)    DEFAULT NULL COMMENT 'Master urune yonlendirme hedefi. NULL = bu kayit master',
  `seo_index`     TINYINT(1)       NOT NULL DEFAULT 0 COMMENT 'Sitemap ve index havuzuna dahil mi',
  `data_quality`  TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '0-100 otomatik veri kalite skoru',
  `search_volume` INT UNSIGNED     NOT NULL DEFAULT 0 COMMENT 'Manuel aylik arama hacmi tahmini',
  `display_order` INT              NOT NULL DEFAULT 0,
  `is_active`     TINYINT(1)       NOT NULL DEFAULT 1,
  `created_at`    DATETIME(3)      DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`    DATETIME(3)      DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `hf_products_slug_uq` (`slug`),
  KEY `hf_products_category_idx` (`category_slug`),
  KEY `hf_products_canonical_idx` (`canonical_slug`),
  KEY `hf_products_seo_idx` (`seo_index`, `display_order`)
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
DROP TABLE IF EXISTS `hf_alerts`;
CREATE TABLE `hf_alerts` (
  `id`              INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `user_id`         VARCHAR(36)      DEFAULT NULL COMMENT 'users.id FK — null ise anonim uyarı',
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
  KEY `hf_alerts_user_idx` (`user_id`),
  CONSTRAINT `fk_hf_alerts_product` FOREIGN KEY (`product_id`) REFERENCES `hf_products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_hf_alerts_market`  FOREIGN KEY (`market_id`)  REFERENCES `hf_markets`  (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Kullanıcı Favorileri ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `hf_user_favorites` (
  `id`         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `user_id`    VARCHAR(36)   NOT NULL COMMENT 'users.id FK',
  `product_id` INT UNSIGNED  NOT NULL,
  `created_at` DATETIME(3)   DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `hf_uf_user_product_uq` (`user_id`, `product_id`),
  KEY `hf_uf_user_idx` (`user_id`),
  CONSTRAINT `fk_hf_uf_product` FOREIGN KEY (`product_id`) REFERENCES `hf_products` (`id`) ON DELETE CASCADE
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
INSERT INTO `hf_markets` (`slug`, `name`, `city_name`, `region_slug`, `source_key`, `market_type`, `display_order`, `is_active`) VALUES
('izmir-hal',           'İzmir Toptancı Hali',            'İzmir',    'ege',        'izmir_sebzemeyve',         'hal', 1, 1),
('ankara-hal',          'Ankara Toptancı Hali',           'Ankara',   'ic-anadolu', 'ankara_resmi',             'hal', 2, 1),
('mersin-hal',          'Mersin Toptancı Hali',           'Mersin',   'akdeniz',    'mersin_resmi',             'hal', 3, 1),
('konya-hal',           'Konya Toptancı Hali',            'Konya',    'ic-anadolu', 'konya_resmi',              'hal', 4, 1),
('kayseri-hal',         'Kayseri Toptancı Hali',          'Kayseri',  'ic-anadolu', 'kayseri_resmi',            'hal', 5, 1),
('eskisehir-hal',       'Eskişehir Toptancı Hali',        'Eskişehir','ic-anadolu', 'eskisehir_resmi',          'hal', 6, 1),
('denizli-hal',         'Denizli Toptancı Hali',          'Denizli',  'ege',        'denizli_resmi',            'hal', 7, 1),
('antalya-hal-merkez',  'Antalya Toptancı Hali (Merkez)', 'Antalya',  'akdeniz',    'antalya_merkez_antkomder', 'hal', 8, 1),
('antalya-hal-serik',   'Antalya Serik Hali',             'Antalya',  'akdeniz',    'antalya_serik_antkomder',  'hal', 9, 1),
('antalya-hal-kumluca', 'Antalya Kumluca Hali',           'Antalya',  'akdeniz',    'antalya_kumluca_antkomder','hal',10, 1),
('gaziantep-hal',          'Gaziantep Toptancı Hali',             'Gaziantep', 'guneydogu',  'gaziantep_resmi',          'hal', 11, 1),
('bursa-hal',              'Bursa Toptancı Hali',                 'Bursa',     'marmara',    'bursa_resmi',              'hal', 12, 1),
('kocaeli-hal-merkez',     'Kocaeli Merkez Sebze Meyve Hali',    'Kocaeli',   'marmara',    'kocaeli_merkez',           'hal', 13, 1),
('balikesir-hal',          'Balıkesir Toptancı Hali',            'Balıkesir', 'marmara',    'balikesir_resmi',          'hal', 14, 1),
('ulusal-hal-gov-tr',      'Türkiye Ulusal Ortalama (hal.gov.tr)', 'Türkiye',   'ulusal',     'hal_gov_tr_ulusal',        'hal', 99, 1),
('istanbul-hal-ibb',       'İstanbul Toptancı Hali (İBB)',         'İstanbul',  'marmara',    'istanbul_ibb',             'hal', 15, 1),
('corum-hal',              'Çorum Toptancı Hali',                  'Çorum',     'karadeniz',  'corum_resmi',              'hal', 16, 1),
('kutahya-hal',            'Kütahya Toptancı Hali',                'Kütahya',   'ege',        'kutahya_resmi',            'hal', 17, 1),
('manisa-hal',             'Manisa Toptancı Hali',                 'Manisa',    'ege',        'manisa_resmi',             'hal', 18, 1),
('kahramanmaras-hal',      'Kahramanmaraş Toptancı Hali',          'Kahramanmaraş', 'guneydogu', 'kahramanmaras_resmi',   'hal', 19, 1),
('canakkale-hal',          'Çanakkale Toptancı Hali',              'Çanakkale', 'marmara',    'canakkale_resmi',          'hal', 20, 1),
('yalova-hal',             'Yalova Toptancı Hali',                 'Yalova',    'marmara',    'yalova_resmi',             'hal', 21, 1),
('tekirdag-hal',           'Tekirdağ Toptancı Hali',               'Tekirdağ',  'marmara',    'tekirdag_resmi',           'hal', 22, 1),
('trabzon-hal',            'Trabzon Toptancı Hali',                'Trabzon',   'karadeniz',  'trabzon_resmi',            'hal', 23, 1),
('gazipasa-hal',           'Gazipaşa Toptancı Hali',               'Antalya',   'akdeniz',    'gazipasa_batiakdeniz',     'hal', 24, 1),
('alanya-hal',             'Alanya Toptancı Hali',                 'Antalya',   'akdeniz',    'alanya_batiakdeniz',       'hal', 25, 1),
('demre-hal',              'Demre Toptancı Hali',                  'Antalya',   'akdeniz',    'demre_batiakdeniz',        'hal', 26, 1),
('finike-hal',             'Finike Toptancı Hali',                 'Antalya',   'akdeniz',    'finike_batiakdeniz',       'hal', 27, 1),
('bolu-hal',               'Bolu Toptancı Hali',                   'Bolu',      'karadeniz',  'bolu_resmi',               'hal', 28, 1),
('tmo-resmi-alim',         'TMO Resmi Alım',                       'Türkiye',   'ulusal',     'tmo_alim_resmi',           'resmi', 101, 1),
('tmo-piyasa-bulteni',     'TMO Piyasa Bülteni',                   'Türkiye',   'ulusal',     'tmo_piyasa_bulteni',       'borsa', 102, 1),
('polatli-ticaret-borsasi','Polatlı Ticaret Borsası',              'Ankara',    'ic-anadolu', 'polatli_borsa',           'borsa', 103, 1),
('izmir-ticaret-borsasi',  'İzmir Ticaret Borsası',                'İzmir',     'ege',        'izmir_borsa_pamuk',        'borsa', 104, 1),
('bakanlik-destekleme',    'Bakanlık Destekleme',                  'Türkiye',   'ulusal',     'bakanlik_destekleme',      'resmi', 105, 1)
ON DUPLICATE KEY UPDATE
  `name`       = VALUES(`name`),
  `source_key` = VALUES(`source_key`),
  `market_type` = VALUES(`market_type`),
  `is_active`  = VALUES(`is_active`);

-- ─── HaldeFiyat Endeksi Anlık Görüntüleri ────────────────────────────────────
-- Haftalık hesaplanan sepet endeks değerleri. index_value = 100 → baz hafta.
-- basket_avg: seçili ürünlerin haftalık ulusal ortalama fiyatı (TRY/kg)
CREATE TABLE IF NOT EXISTS `hf_index_snapshots` (
  `id`             INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `index_week`     CHAR(8)          NOT NULL COMMENT 'YYYY-WW — baz: ISO hafta numarası',
  `index_value`    DECIMAL(10,4)    NOT NULL COMMENT '100 = baz hafta',
  `base_week`      CHAR(8)          NOT NULL COMMENT 'Hesaplamada referans alınan hafta',
  `basket_avg`     DECIMAL(10,4)    NOT NULL COMMENT 'Sepet ürünlerin ağırlıksız ortalaması (TRY/kg)',
  `products_count` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Hesaplamaya katılan ürün sayısı',
  `week_start`     DATE             NOT NULL,
  `week_end`       DATE             NOT NULL,
  `created_at`     DATETIME(3)      DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`     DATETIME(3)      DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `hf_idx_week_uq` (`index_week`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Borsa/resmi fiyat dikeyi için MVP ürünleri seed edilir; hal ürünleri
-- ETL_AUTO_REGISTER_PRODUCTS=true akışıyla gerçek kaynaklardan büyümeye devam eder.
INSERT INTO `hf_products`
  (`slug`, `name_tr`, `category_slug`, `unit`, `aliases`, `display_name`, `seo_index`, `data_quality`, `search_volume`, `display_order`, `is_active`)
VALUES
  ('bugday',   'Buğday',   'hububat',        'kg', JSON_ARRAY('bugday','buğday','ekmeklik buğday','makarnalık buğday','wheat'),       'Buğday',   1, 70, 9000, 101, 1),
  ('arpa',     'Arpa',     'hububat',        'kg', JSON_ARRAY('arpa','barley','yemlik arpa'),                                      'Arpa',     1, 70, 6500, 102, 1),
  ('misir',    'Mısır',    'hububat',        'kg', JSON_ARRAY('mısır','misir','dane mısır','corn'),                                'Mısır',    1, 70, 8000, 103, 1),
  ('aycicegi', 'Ayçiçeği', 'yagli-tohum',    'kg', JSON_ARRAY('ayçiçeği','aycicegi','yağlık ayçiçeği','sunflower'),                'Ayçiçeği', 1, 70, 5400, 104, 1),
  ('pamuk',    'Pamuk',    'sanayi-bitkisi', 'kg', JSON_ARRAY('pamuk','kütlü pamuk','kutlu pamuk','lif pamuk','cotton'),            'Pamuk',    1, 70, 7200, 105, 1)
ON DUPLICATE KEY UPDATE
  `name_tr` = VALUES(`name_tr`),
  `category_slug` = VALUES(`category_slug`),
  `unit` = VALUES(`unit`),
  `aliases` = VALUES(`aliases`),
  `display_name` = VALUES(`display_name`),
  `seo_index` = VALUES(`seo_index`),
  `data_quality` = GREATEST(`data_quality`, VALUES(`data_quality`)),
  `search_volume` = VALUES(`search_volume`),
  `display_order` = VALUES(`display_order`),
  `is_active` = VALUES(`is_active`);
