-- Audit analitigi icin gunluk ozet tablolari (S5).
--
-- SORUN: overview/retention sorgulari `audit_request_logs` (3,1M satir) uzerinde
-- ayni 30 gunluk pencereyi ~9 kez tariyor. 2026-08-31 profili:
--   ham sayim            3,9 sn
--   COUNT(DISTINCT ip)   5,8 sn
--   returningIps         6,2 sn
--   daily                8,9 sn
--   segmentSummary      45,7 sn   <- en pahali
--   toplam uc            175-242 sn (soguk)
-- Darbogaz CPU degil I/O: `GROUP BY ip` regex OLMADAN da 104 sn suruyor.
-- Tek cozum ayni pencereyi tekrar tekrar taramamak.
--
-- TASARIM: gun bazinda onceden toplanmis iki tablo. Ozellikle IP tablosu
-- kritik — aralik-genelinde DISTINCT IP, donen ziyaretci ve segment analizi
-- 3,1M satir yerine ~gun x tekil-IP (bu boyutta ~150K) satirdan hesaplanir.
--
-- Bu tablolar TURETILMIS veridir: kaynak `audit_request_logs`. Silinip yeniden
-- uretilebilir; rollup job'i idempotenttir (gun bazinda REPLACE).

-- Gun bazinda sayaclar: summary + daily grafigi buradan okunur.
CREATE TABLE IF NOT EXISTS `audit_daily_metrics` (
  `day`              DATE        NOT NULL,
  `total_requests`   INT         NOT NULL DEFAULT 0,
  `human_requests`   INT         NOT NULL DEFAULT 0,
  `bot_requests`     INT         NOT NULL DEFAULT 0,
  `pageviews`        INT         NOT NULL DEFAULT 0,
  `ads_pageviews`    INT         NOT NULL DEFAULT 0,
  `direct_pageviews` INT         NOT NULL DEFAULT 0,
  `error_requests`   INT         NOT NULL DEFAULT 0,
  `unique_ips`       INT         NOT NULL DEFAULT 0,
  `computed_at`      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`day`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Gun x IP: aralik-genelinde tekil ziyaretci, donen ziyaretci ve B2B segment
-- sinyalleri buradan hesaplanir. `desktop_business_hour` ve `has_intent`
-- rollup aninda bir kez hesaplanir; sorgu aninda REGEXP calismaz.
CREATE TABLE IF NOT EXISTS `audit_daily_ips` (
  `day`                   DATE         NOT NULL,
  `ip`                    VARCHAR(64)  NOT NULL,
  `pageviews`             INT          NOT NULL DEFAULT 0,
  `desktop_business_hour` TINYINT(1)   NOT NULL DEFAULT 0,
  `has_intent`            TINYINT(1)   NOT NULL DEFAULT 0,
  `is_ads`                TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`day`, `ip`),
  KEY `audit_daily_ips_ip_idx` (`ip`),
  KEY `audit_daily_ips_day_idx` (`day`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Gun x boyut x deger: en cok gezilen sayfa / referrer / cihaz listeleri.
-- `kind` = 'path' | 'referer' | 'device'
CREATE TABLE IF NOT EXISTS `audit_daily_dimensions` (
  `day`    DATE         NOT NULL,
  `kind`   VARCHAR(16)  NOT NULL,
  `value`  VARCHAR(255) NOT NULL,
  `count`  INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (`day`, `kind`, `value`),
  KEY `audit_daily_dimensions_lookup_idx` (`kind`, `day`, `count`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
