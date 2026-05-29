-- Covering index for date-range queries on hf_price_history.
-- The existing UNIQUE KEY (product_id, market_id, recorded_date) cannot be used
-- for full-table date-range scans (no product/market filter) because the
-- leading column is product_id, not recorded_date.
-- This index lets WHERE recorded_date BETWEEN x AND y use an index scan.
-- NOT: MySQL 8 `CREATE INDEX IF NOT EXISTS` desteklemez. Seed her zaman
-- drop+create ile fresh calistigi icin index onceden var olmaz; guardsiz CREATE yeterli.
CREATE INDEX idx_ph_date_product_market
  ON hf_price_history (recorded_date, product_id, market_id);
