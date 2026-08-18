-- Haftalik rapor takip listesi (JSON). Ek: reviewed_by/reviewed_at canli tabloda vardi
-- fakat seed 026'da yoktu; seed artik ucunu de tanimliyor (fresh kurulumda kaybolmasin).
-- Idempotence kontrolu:
--   SELECT COLUMN_NAME FROM information_schema.columns
--   WHERE table_schema = DATABASE() AND table_name = 'hf_analysis_reports'
--     AND COLUMN_NAME IN ('watchlist','reviewed_by','reviewed_at');

ALTER TABLE hf_analysis_reports
  ADD COLUMN watchlist JSON NULL AFTER total_records;
