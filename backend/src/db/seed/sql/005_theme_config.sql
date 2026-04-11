-- 005_theme_config.sql — Hal Fiyatlari (yesil tonlari)

SET NAMES utf8mb4;
SET time_zone = '+00:00';

DROP TABLE IF EXISTS `theme_config`;

CREATE TABLE `theme_config` (
  `id`         CHAR(36)     NOT NULL,
  `is_active`  TINYINT(1)   NOT NULL DEFAULT 1,
  `config`     MEDIUMTEXT   NOT NULL,
  `created_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `theme_config` (`id`, `is_active`, `config`, `created_at`, `updated_at`) VALUES (
  '00000000-0000-4000-8000-000000000002',
  1,
  '{
    "colors": {
      "primary":     "#16a34a",
      "secondary":   "#1e3a5f",
      "accent":      "#15803d",
      "background":  "#f9fafb",
      "foreground":  "#111827",
      "muted":       "#f3f4f6",
      "mutedFg":     "#6b7280",
      "border":      "#e5e7eb",
      "destructive": "#ef4444",
      "success":     "#22c55e",
      "navBg":       "#1e3a5f",
      "navFg":       "#ffffff",
      "footerBg":    "#1e3a5f",
      "footerFg":    "#f3f4f6"
    },
    "radius":     "0.375rem",
    "fontFamily": "Inter, sans-serif",
    "darkMode":   "light"
  }',
  NOW(3),
  NOW(3)
);
