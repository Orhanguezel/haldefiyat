-- Rakip izleme: site tanımları
CREATE TABLE IF NOT EXISTS hf_competitor_sites (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  site_key             VARCHAR(64)  NOT NULL,
  name                 VARCHAR(255) NOT NULL,
  url                  VARCHAR(512) NOT NULL,
  check_interval_hours INT          NOT NULL DEFAULT 168, -- 168 = 1 hafta
  is_active            TINYINT      NOT NULL DEFAULT 1,
  last_checked_at      DATETIME(3)  NULL,
  created_at           DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_site_key (site_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rakip izleme: haftalık anlık görüntüler
CREATE TABLE IF NOT EXISTS hf_competitor_snapshots (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  site_key         VARCHAR(64)   NOT NULL,
  checked_at       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  product_count    INT           NULL,
  market_count     INT           NULL,
  detected_features JSON         NULL COMMENT 'Tespit edilen özellikler listesi',
  raw_metrics      JSON          NULL COMMENT 'Ham metrikleri saklar (grafik, API, harita vs.)',
  diff_summary     TEXT          NULL COMMENT 'Önceki snapshot\'a göre değişim özeti',
  scrape_ok        TINYINT       NOT NULL DEFAULT 1,
  error_msg        VARCHAR(512)  NULL,
  INDEX idx_site_key      (site_key),
  INDEX idx_checked_at    (checked_at),
  INDEX idx_site_checked  (site_key, checked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Varsayılan rakip siteleri
INSERT IGNORE INTO hf_competitor_sites (site_key, name, url, check_interval_hours, is_active) VALUES
  ('tarimpiyasa',       'TarımPiyasa',        'https://www.tarimpiyasa.com',         168, 1),
  ('guncelfiyatlari',   'GüncelFiyatları',    'https://www.guncelfiyatlari.com',     168, 1),
  ('halfiyat_vercel',   'HalFiyat (Vercel)',  'https://halfiyat.vercel.app',         168, 1),
  ('batiakdeniztv',     'BatıAkdeniz TV',     'https://www.batiakdeniztv.com',       168, 0),
  ('a101_market',       'A101 Market',        'https://www.a101.com.tr/market',      168, 0),
  ('migros_market',     'Migros Market',      'https://www.migros.com.tr/sebze-meyve', 168, 0);
