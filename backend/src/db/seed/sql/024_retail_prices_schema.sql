SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ─── Perakende Zincir Fiyatları ───────────────────────────────────────────────
-- Migros, A101, BİM vb. zincirlerden çekilen günlük sebze/meyve fiyatları.
-- Hal fiyatlarıyla kıyaslama ("Tahmini perakende ~₺XX") için kullanılır.
-- product_id: hf_products ile eşleşen kayıt (normalizer tarafından bağlanır).
-- NULL product_id: henüz eşleştirilmemiş, ham kayıt.
CREATE TABLE IF NOT EXISTS `hf_retail_prices` (
  `id`               INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `product_id`       INT UNSIGNED     DEFAULT NULL COMMENT 'hf_products.id — normalizer eşleşmesi',
  `chain_slug`       VARCHAR(64)      NOT NULL                    COMMENT 'migros | a101 | bim | sok | carrefour',
  `price`            DECIMAL(12,2)    NOT NULL,
  `currency`         VARCHAR(8)       NOT NULL DEFAULT 'TRY',
  `unit`             VARCHAR(32)      NOT NULL DEFAULT 'kg',
  `product_name_raw` VARCHAR(255)     DEFAULT NULL               COMMENT 'Zincirin orijinal ürün adı',
  `product_url`      VARCHAR(512)     DEFAULT NULL               COMMENT 'Ürün sayfası URL (kaynak attribution için)',
  `recorded_date`    DATE             NOT NULL,
  `created_at`       DATETIME(3)      DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `hf_rp_product_chain_date_uq` (`product_id`, `chain_slug`, `recorded_date`),
  KEY `hf_rp_chain_date_idx` (`chain_slug`, `recorded_date`),
  KEY `hf_rp_product_idx` (`product_id`),
  CONSTRAINT `fk_hf_rp_product` FOREIGN KEY (`product_id`) REFERENCES `hf_products` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
