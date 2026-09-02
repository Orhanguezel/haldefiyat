SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ─── API anahtar yetkileri ─────────────────────────────────────────────────
-- Anahtar bugune kadar YALNIZCA okuma icindi: kota sayiyor, kimlik tasimiyordu.
-- Ihale/alim talebi acma (ERP entegrasyonu) icin yazma yetkisi gerekiyor.
--
-- NEDEN AYRI TABLO: hf_api_keys'e kolon eklemek ALTER gerektirirdi; proje kurali
-- ALTER'i yasakliyor. Ayri tablo CREATE TABLE IF NOT EXISTS ile eklenir ve ayni
-- anahtara birden fazla yetki verilebilmesini de dogal kilar.
--
-- VARSAYILAN: kayit YOK = yalnizca okuma. Yazma yetkisi ACIKCA verilir; bir
-- anahtarin sizmasi durumunda en kotu ihtimal veri okunmasidir, musteri adina
-- islem yapilmasi degil. Yetki veren ve verildigi an kaydedilir.
--
-- Tanimli yetkiler:
--   listings:write  → alim/satis ilani (ihale) acabilir
CREATE TABLE IF NOT EXISTS `hf_api_key_scopes` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `api_key_id`  INT UNSIGNED NOT NULL,
  `scope`       VARCHAR(64)  NOT NULL,
  `granted_by`  VARCHAR(36)  DEFAULT NULL COMMENT 'yetkiyi veren admin',
  `granted_at`  DATETIME(3)  DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_key_scope` (`api_key_id`, `scope`),
  KEY `idx_scope` (`scope`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Idempotens kayitlari ──────────────────────────────────────────────────
-- ERP entegrasyonlari basarisiz istegi TEKRAR DENER. Idempotency-Key olmadan
-- ayni ihale iki kez acilir ve komisyoncular hangisine teklif verecegini bilemez.
-- Ayni anahtar + ayni idempotency key ikinci kez geldiginde ILK sonucun kimligi
-- doner, yeni kayit olusmaz.
CREATE TABLE IF NOT EXISTS `hf_api_idempotency` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `api_key_id`      INT UNSIGNED NOT NULL,
  `idempotency_key` VARCHAR(128) NOT NULL,
  `endpoint`        VARCHAR(128) NOT NULL,
  `resource_id`     VARCHAR(64)  NOT NULL COMMENT 'olusturulan kaydin kimligi',
  `created_at`      DATETIME(3)  DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_key_idem` (`api_key_id`, `idempotency_key`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
