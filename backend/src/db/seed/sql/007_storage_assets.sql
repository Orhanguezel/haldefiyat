-- ─── Storage Assets Şeması ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `storage_assets` (
  `id`                     CHAR(36)       NOT NULL,
  `user_id`                CHAR(36)       NULL,
  `name`                   VARCHAR(255)   NOT NULL,
  `bucket`                 VARCHAR(64)    NOT NULL,
  `path`                   VARCHAR(512)   NOT NULL,
  `folder`                 VARCHAR(255)   NULL,
  `mime`                   VARCHAR(127)   NOT NULL,
  `size`                   BIGINT UNSIGNED NOT NULL,
  `width`                  INT UNSIGNED   NULL,
  `height`                 INT UNSIGNED   NULL,
  `url`                    TEXT           NULL,
  `hash`                   VARCHAR(64)    NULL,
  `provider`               VARCHAR(16)    NOT NULL DEFAULT 'local',
  `provider_public_id`     VARCHAR(255)   NULL,
  `provider_resource_type` VARCHAR(16)    NULL,
  `provider_format`        VARCHAR(32)    NULL,
  `provider_version`       INT UNSIGNED   NULL,
  `etag`                   VARCHAR(64)    NULL,
  `metadata`               JSON           NULL,
  `created_at`             DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`             DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_bucket_path` (`bucket`, `path`),
  KEY `idx_storage_bucket`   (`bucket`),
  KEY `idx_storage_folder`   (`folder`),
  KEY `idx_storage_created`  (`created_at`),
  KEY `idx_provider_pubid`   (`provider_public_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Seed: Marka Görselleri ───────────────────────────────────────────────────
INSERT INTO `storage_assets`
  (`id`, `name`, `bucket`, `path`, `folder`, `mime`, `size`, `width`, `height`,
   `url`, `provider`, `provider_resource_type`, `provider_format`, `metadata`)
VALUES
  (
    'a1b2c3d4-0001-0000-0000-000000000001',
    'logo.png',
    'uploads',
    'brand/logo.png',
    'brand',
    'image/png',
    134648,
    1230,
    460,
    '/uploads/brand/logo.png',
    'local',
    'image',
    'png',
    JSON_OBJECT('alt', 'HaldeFiyat Logo', 'usage', 'site-logo')
  ),
  (
    'a1b2c3d4-0001-0000-0000-000000000002',
    'favicon.png',
    'uploads',
    'brand/favicon.png',
    'brand',
    'image/png',
    165432,
    613,
    648,
    '/uploads/brand/favicon.png',
    'local',
    'image',
    'png',
    JSON_OBJECT('alt', 'HaldeFiyat Favicon', 'usage', 'favicon')
  ),
  (
    'a1b2c3d4-0001-0000-0000-000000000003',
    'apple-touch-icon.png',
    'uploads',
    'brand/apple-touch-icon.png',
    'brand',
    'image/png',
    2150917,
    1536,
    1024,
    '/uploads/brand/apple-touch-icon.png',
    'local',
    'image',
    'png',
    JSON_OBJECT('alt', 'HaldeFiyat Apple Touch Icon', 'usage', 'apple-touch-icon')
  )
ON DUPLICATE KEY UPDATE
  `name`     = VALUES(`name`),
  `url`      = VALUES(`url`),
  `width`    = VALUES(`width`),
  `height`   = VALUES(`height`),
  `size`     = VALUES(`size`),
  `metadata` = VALUES(`metadata`);
