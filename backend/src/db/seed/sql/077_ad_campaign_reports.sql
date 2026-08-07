ALTER TABLE hf_banners
  ADD COLUMN report_email VARCHAR(255) NULL AFTER performance_status,
  ADD COLUMN weekly_report_enabled TINYINT NOT NULL DEFAULT 0 AFTER report_email,
  ADD COLUMN weekly_report_sent_at DATETIME(3) NULL AFTER weekly_report_enabled,
  ADD COLUMN closing_report_sent_at DATETIME(3) NULL AFTER weekly_report_sent_at;
