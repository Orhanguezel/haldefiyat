-- hf_social_templates — sosyal medya içerik şablonları (ekosistem-sosyal-medya'dan taşındı)
-- haldefiyat sosyal otomasyonu hal'e taşındığında içerik şablonları burada tutulur.
CREATE TABLE IF NOT EXISTS hf_social_templates (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  platform         VARCHAR(24)  NOT NULL DEFAULT 'x',
  name             VARCHAR(255) NOT NULL,
  post_type        VARCHAR(32)  NOT NULL DEFAULT 'haber',
  caption_template TEXT         NOT NULL,
  hashtags         VARCHAR(500),
  variables        JSON,
  is_active        TINYINT      NOT NULL DEFAULT 1,
  source_uuid      VARCHAR(64),
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_hf_social_templates_source (source_uuid),
  KEY idx_hf_social_templates_platform (platform, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
