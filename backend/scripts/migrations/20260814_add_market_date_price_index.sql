-- Hal detay ve market filtreli fiyat sorgularının tüm geçmişi taramasını önler.
-- Canlı uygulama (MySQL/InnoDB):
--   ALTER TABLE hf_price_history
--     ADD INDEX idx_ph_market_date_product (market_id, recorded_date, product_id),
--     ALGORITHM=INPLACE, LOCK=NONE;
--
-- Çalıştırmadan önce idempotence kontrolü:
--   SELECT COUNT(*) FROM information_schema.statistics
--   WHERE table_schema = DATABASE()
--     AND table_name = 'hf_price_history'
--     AND index_name = 'idx_ph_market_date_product';

ALTER TABLE hf_price_history
  ADD INDEX idx_ph_market_date_product (market_id, recorded_date, product_id),
  ALGORITHM=INPLACE,
  LOCK=NONE;
