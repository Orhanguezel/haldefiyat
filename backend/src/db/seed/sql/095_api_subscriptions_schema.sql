SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ─── API Pro Aboneligi (Stripe) ────────────────────────────────────────────
-- /pro sayfasi Pro tier'i vaat ediyordu ama satin alma yolu yoktu: tier yalnizca
-- admin tarafindan elle yukseltilebiliyordu (pricingMode: "manual_approval").
-- Bu tablo abonelik durumunun TEK KAYNAGIDIR; hf_api_keys.tier ondan turetilir.
--
-- Abonelik KULLANICI bazindadir, anahtar bazinda degil: bir kullanicinin aktif
-- aboneligi varsa TUM anahtarlari pro limitinde calisir. Aksi halde kullanici
-- 3 anahtar acip hangisinin pro oldugunu takip etmek zorunda kalirdi.
--
-- status Stripe'in kendi durum adlarini birebir tasir (trialing/active/past_due/
-- canceled/unpaid/incomplete...). "Pro erisimi var mi" sorusu tek yerden yanitlanir:
-- status IN ('trialing','active') AND current_period_end > NOW().
CREATE TABLE IF NOT EXISTS `hf_api_subscriptions` (
  `id`                     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`                VARCHAR(36)  NOT NULL,
  `stripe_customer_id`     VARCHAR(64)  NOT NULL,
  `stripe_subscription_id` VARCHAR(64)  DEFAULT NULL,
  `status`                 VARCHAR(32)  NOT NULL DEFAULT 'incomplete',
  `tier`                   ENUM('pro')  NOT NULL DEFAULT 'pro',
  `current_period_end`     DATETIME(3)  DEFAULT NULL,
  `cancel_at_period_end`   TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at`             DATETIME(3)  DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`             DATETIME(3)  DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  -- Kullanici basina tek abonelik kaydi: checkout tekrarlarinda UPSERT edilir.
  UNIQUE KEY `uq_user` (`user_id`),
  UNIQUE KEY `uq_stripe_subscription` (`stripe_subscription_id`),
  KEY `idx_status_period` (`status`, `current_period_end`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Stripe olay defteri (idempotens) ──────────────────────────────────────
-- Stripe ayni olayi birden fazla kez teslim eder (retry). Ayni event id ikinci
-- kez geldiginde islem TEKRARLANMAZ; INSERT IGNORE sifir satir donerse webhook
-- sessizce 200 doner ve Stripe retry firtinasi uretmez.
CREATE TABLE IF NOT EXISTS `hf_stripe_events` (
  `id`          VARCHAR(64)  NOT NULL COMMENT 'Stripe event id (evt_...)',
  `type`        VARCHAR(64)  NOT NULL,
  `api_version` VARCHAR(32)  NOT NULL DEFAULT '',
  `payload`     MEDIUMTEXT   NOT NULL,
  `created_at`  DATETIME(3)  DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_type_created` (`type`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
