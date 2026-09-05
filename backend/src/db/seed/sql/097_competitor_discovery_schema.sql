-- Rakip kesfi: arama sonuclarinda (ilk 2 sayfa) kim cikiyor?
-- Sorgular GSC'nin en cok gosterim alan aramalarindan gelir; motor su an Bing (Google VPS'e captcha veriyor).
CREATE TABLE IF NOT EXISTS hf_competitor_serp_runs (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  engine        VARCHAR(16)  NOT NULL DEFAULT 'bing',
  status        ENUM('running','ok','partial','error') NOT NULL DEFAULT 'running',
  query_source  VARCHAR(32)  NOT NULL DEFAULT 'gsc' COMMENT 'gsc | products | manual',
  queries_total INT          NOT NULL DEFAULT 0,
  queries_done  INT          NOT NULL DEFAULT 0,
  results_total INT          NOT NULL DEFAULT 0,
  error_msg     VARCHAR(512) NULL,
  started_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  finished_at   DATETIME(3)  NULL,
  INDEX idx_serp_runs_started (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hf_competitor_serp_results (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  run_id        INT          NOT NULL,
  query         VARCHAR(255) NOT NULL,
  query_clicks  INT          NOT NULL DEFAULT 0 COMMENT 'GSC: bizim tiklama',
  query_impressions INT      NOT NULL DEFAULT 0 COMMENT 'GSC: bizim gosterim',
  position      INT          NOT NULL COMMENT '1..20 (sayfa 1-2)',
  page          TINYINT      NOT NULL DEFAULT 1,
  url           VARCHAR(1024) NOT NULL,
  domain        VARCHAR(255) NOT NULL,
  title         VARCHAR(512) NULL,
  snippet       TEXT         NULL,
  is_ours       TINYINT      NOT NULL DEFAULT 0,
  checked_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_serp_run (run_id),
  INDEX idx_serp_domain (domain),
  INDEX idx_serp_query (query),
  CONSTRAINT fk_serp_run FOREIGN KEY (run_id) REFERENCES hf_competitor_serp_runs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
