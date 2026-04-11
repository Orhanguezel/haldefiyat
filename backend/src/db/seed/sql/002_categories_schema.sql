-- =============================================================
-- FILE: 010_catalog_schema.sql  (FINAL / DRIZZLE-ALIGNED)
-- Bereket Fide – Catalog Schema (categories + category_i18n)
-- - Drizzle schema ile %100 uyumlu:
--   * categories: LONGTEXT image_url, icon VARCHAR(255)
--   * category_i18n: NO id column
--   * PK: (category_id, locale)
--   * UQ: (locale, slug)
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

START TRANSACTION;

-- -------------------------------------------------------------
-- 1) categories (BASE)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `categories` (
  `id`              CHAR(36)     NOT NULL,
  `module_key`      VARCHAR(64)  NOT NULL DEFAULT 'general',

  `image_url`        LONGTEXT     NULL,
  `storage_asset_id` CHAR(36)     NULL,
  `alt`              VARCHAR(255) NULL,
  `icon`             VARCHAR(255) NULL,

  `is_active`       TINYINT(1)   NOT NULL DEFAULT 1,
  `is_featured`     TINYINT(1)   NOT NULL DEFAULT 0,
  `display_order`   INT          NOT NULL DEFAULT 0,

  `created_at`      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),

  KEY `categories_module_idx` (`module_key`),
  KEY `categories_active_idx` (`is_active`),
  KEY `categories_featured_idx` (`is_featured`),
  KEY `categories_order_idx` (`display_order`),
  KEY `categories_storage_asset_idx` (`storage_asset_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 2) category_i18n (I18N)
--   - Drizzle: PK (category_id, locale)
--   - locale length: 8
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `category_i18n` (
  `category_id` CHAR(36)     NOT NULL,
  `locale`      VARCHAR(8)   NOT NULL DEFAULT 'de',   -- tr | en | de | ...

  `name`        VARCHAR(255) NOT NULL,
  `slug`        VARCHAR(255) NOT NULL,

  `description`      TEXT         NULL,
  `alt`              VARCHAR(255) NULL,
  `meta_title`       VARCHAR(255) NULL,
  `meta_description` VARCHAR(500) NULL,

  `created_at`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`category_id`, `locale`),

  UNIQUE KEY `category_i18n_locale_slug_uq` (`locale`, `slug`),
  KEY `category_i18n_locale_idx` (`locale`),
  KEY `category_i18n_name_idx` (`name`),

  CONSTRAINT `fk_category_i18n_category`
    FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
