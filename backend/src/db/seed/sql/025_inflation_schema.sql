SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ─── Aylik enflasyon gostergeleri (TCMB EVDS) ───────────────────────────────
-- TUFE, TUFE-gida ve Yi-UFE serileri aylik tek satir.
-- Urun sayfasinda "X fiyat artisi (5+%) — TUFE %3 araliginda" karsilastirma etiketi
-- icin kullanilir. Cron: ayin 5'i 10:00 UTC (TCMB ayin 3'unde yayinlar).
CREATE TABLE IF NOT EXISTS `hf_inflation_monthly` (
  `id`             INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  `period_year`    SMALLINT UNSIGNED NOT NULL    COMMENT 'YYYY',
  `period_month`   TINYINT UNSIGNED  NOT NULL    COMMENT '1-12',
  `indicator`      VARCHAR(64)    NOT NULL       COMMENT 'tufe_genel | tufe_gida | ufe_genel',
  `index_value`    DECIMAL(12,4)  DEFAULT NULL   COMMENT 'Ham endeks degeri (TCMB EVDS)',
  `yoy_change_pct` DECIMAL(8,4)   DEFAULT NULL   COMMENT 'Yillik degisim % (gecen yilin ayni ayina gore)',
  `mom_change_pct` DECIMAL(8,4)   DEFAULT NULL   COMMENT 'Aylik degisim % (onceki aya gore)',
  `source_api`     VARCHAR(64)    NOT NULL DEFAULT 'tcmb_evds',
  `created_at`     DATETIME(3)    DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_period_indicator` (`period_year`, `period_month`, `indicator`),
  KEY `idx_indicator_period` (`indicator`, `period_year`, `period_month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
