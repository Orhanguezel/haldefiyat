SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ─── API Anahtarlari (Pro Tier) ────────────────────────────────────────────
-- Kullanici kendi adina API key olusturur (free veya pro). Header X-API-Key
-- ile geldiginde IP-based default rate limit yerine kullanici-tier limiti uygulanir.
-- key_hash: SHA-256 hex, ham anahtar DB'de saklanmaz.
-- key_prefix: kullaniciya gosterilen kismi (ornegin 'hf_a1b2c3d4').
-- daily_limit: gunluk istek sayisi (free=100 default, pro=10000 default).
-- used_today: gun icinde tuketilen sayac; usage_window_start farkliysa otomatik resetlenir.
CREATE TABLE IF NOT EXISTS `hf_api_keys` (
  `id`                  INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  `user_id`             VARCHAR(36)    NOT NULL,
  `key_hash`            VARCHAR(64)    NOT NULL                COMMENT 'SHA-256 hex of full key',
  `key_prefix`          VARCHAR(16)    NOT NULL                COMMENT 'Gosterilebilir kisim',
  `name`                VARCHAR(128)   NOT NULL DEFAULT 'My API Key',
  `tier`                ENUM('free','pro') NOT NULL DEFAULT 'free',
  `daily_limit`         INT UNSIGNED   NOT NULL DEFAULT 100,
  `used_today`          INT UNSIGNED   NOT NULL DEFAULT 0,
  `usage_window_start`  DATE           NOT NULL                COMMENT 'used_today reset gunu',
  `last_used_at`        DATETIME(3)    DEFAULT NULL,
  `revoked_at`          DATETIME(3)    DEFAULT NULL,
  `created_at`          DATETIME(3)    DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_key_hash` (`key_hash`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_tier_revoked` (`tier`, `revoked_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
