-- Zamanlanmış yayın: bir analiz raporunun belirli bir anda otomatik published olması.
-- Cron (scheduled-publish) publish_at <= NOW() olanları yayınlar + IndexNow ping'ler + satırı siler.
CREATE TABLE IF NOT EXISTS `hf_scheduled_publishes` (
  `report_id`  INT UNSIGNED NOT NULL PRIMARY KEY,
  `publish_at` DATETIME NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY `idx_sched_due` (`publish_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
