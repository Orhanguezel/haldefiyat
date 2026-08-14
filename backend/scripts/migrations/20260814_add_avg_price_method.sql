ALTER TABLE hf_price_history
  ADD COLUMN avg_price_method VARCHAR(16) NOT NULL DEFAULT 'unknown' AFTER avg_price;

-- Tarihsel kayıtları mevcut veriyle kanıtlanabilen en dar kuralla sınıflandır.
-- Eşitlik iki ondalık DECIMAL alanlarında test edilir; min/max olmayan kayıtlar
-- kaynak tarafından bildirilmiş tek değer kabul edilir.
UPDATE hf_price_history
SET avg_price_method = CASE
  WHEN min_price IS NOT NULL
    AND max_price IS NOT NULL
    AND ABS(avg_price - ((min_price + max_price) / 2)) < 0.005
    THEN 'midpoint'
  ELSE 'reported'
END
WHERE avg_price_method = 'unknown';
