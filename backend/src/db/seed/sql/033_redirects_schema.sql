-- 301/410 yonlendirme yonetimi. source_path normalize edilmis tutulur:
-- locale prefix yok, basta slash, sonda slash yok (kok haric), query yok.
-- type=301 ise target_url zorunlu; type=410 (Gone) ise target_url NULL.
CREATE TABLE IF NOT EXISTS `hf_redirects` (
  `id`           INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  `source_path`  VARCHAR(512)   NOT NULL COMMENT 'Normalize kaynak yol, orn. /urun/eski-slug',
  `type`         ENUM('301','410') NOT NULL DEFAULT '301',
  `target_url`   VARCHAR(512)   DEFAULT NULL COMMENT '301 icin hedef (rel veya abs). 410 icin NULL',
  `note`         VARCHAR(255)   DEFAULT NULL COMMENT 'orn. GSC 2026-05-29',
  `hits`         INT UNSIGNED   NOT NULL DEFAULT 0,
  `last_hit_at`  DATETIME(3)    DEFAULT NULL,
  `is_active`    TINYINT(1)     NOT NULL DEFAULT 1,
  `created_at`   DATETIME(3)    DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`   DATETIME(3)    DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `hf_redirects_source_uq` (`source_path`),
  KEY `hf_redirects_active_idx` (`is_active`, `type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
