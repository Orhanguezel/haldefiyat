-- Üzüm fiyatları 2026 sezon analizi için yeniden üretilebilir veri sorguları.
-- Kesim tarihi: 2026-09-12
-- Not: PERCENTILE_CONT yerine tek/çift gözlem sayısında çalışan sıra ortalaması kullanılır.

WITH grape_base AS (
  SELECT
    h.recorded_date,
    h.market_id,
    h.product_id,
    h.avg_price
  FROM hf_price_history h
  JOIN hf_products p ON p.id = h.product_id
  WHERE (p.slug = 'uzum' OR p.slug LIKE 'uzum-%')
    AND p.slug NOT LIKE '%frenk%'
    AND h.unit = 'kg'
    AND h.avg_price BETWEEN 1 AND 1000
    AND h.recorded_date BETWEEN '2024-01-01' AND '2026-09-12'
)
SELECT
  COUNT(*) AS records,
  COUNT(DISTINCT market_id) AS markets,
  COUNT(DISTINCT product_id) AS products,
  MIN(recorded_date) AS first_date,
  MAX(recorded_date) AS last_date
FROM grape_base;

WITH grape_base AS (
  SELECT
    YEAR(h.recorded_date) AS year_no,
    MONTH(h.recorded_date) AS month_no,
    h.avg_price
  FROM hf_price_history h
  JOIN hf_products p ON p.id = h.product_id
  WHERE (p.slug = 'uzum' OR p.slug LIKE 'uzum-%')
    AND p.slug NOT LIKE '%frenk%'
    AND h.unit = 'kg'
    AND h.avg_price BETWEEN 1 AND 1000
    AND h.recorded_date BETWEEN '2024-01-01' AND '2026-09-12'
), ranked AS (
  SELECT
    *,
    ROW_NUMBER() OVER (PARTITION BY year_no, month_no ORDER BY avg_price) AS row_no,
    COUNT(*) OVER (PARTITION BY year_no, month_no) AS row_count
  FROM grape_base
)
SELECT
  year_no,
  month_no,
  ROUND(AVG(avg_price), 2) AS median_price,
  MAX(row_count) AS observations
FROM ranked
WHERE row_no IN (FLOOR((row_count + 1) / 2), FLOOR((row_count + 2) / 2))
GROUP BY year_no, month_no
ORDER BY year_no, month_no;

WITH product_base AS (
  SELECT
    p.slug,
    YEAR(h.recorded_date) AS year_no,
    MONTH(h.recorded_date) AS month_no,
    h.market_id,
    h.avg_price
  FROM hf_price_history h
  JOIN hf_products p ON p.id = h.product_id
  WHERE p.slug IN ('uzum', 'uzum-beyaz', 'uzum-cekirdeksiz')
    AND h.unit = 'kg'
    AND h.avg_price BETWEEN 1 AND 1000
    AND h.recorded_date BETWEEN '2022-07-01' AND '2026-09-12'
    AND MONTH(h.recorded_date) IN (7, 8, 9)
), ranked AS (
  SELECT
    *,
    ROW_NUMBER() OVER (
      PARTITION BY slug, year_no, month_no ORDER BY avg_price
    ) AS row_no,
    COUNT(*) OVER (
      PARTITION BY slug, year_no, month_no
    ) AS row_count
  FROM product_base
), medians AS (
  SELECT
    slug,
    year_no,
    month_no,
    ROUND(AVG(avg_price), 2) AS median_price,
    MAX(row_count) AS observations
  FROM ranked
  WHERE row_no IN (FLOOR((row_count + 1) / 2), FLOOR((row_count + 2) / 2))
  GROUP BY slug, year_no, month_no
), market_counts AS (
  SELECT
    slug,
    year_no,
    month_no,
    COUNT(DISTINCT market_id) AS markets
  FROM product_base
  GROUP BY slug, year_no, month_no
)
SELECT
  medians.slug,
  medians.year_no,
  medians.month_no,
  medians.median_price,
  medians.observations,
  market_counts.markets
FROM medians
JOIN market_counts USING (slug, year_no, month_no)
ORDER BY medians.slug, medians.year_no, medians.month_no;

SELECT
  p.name_tr AS product,
  m.name AS market,
  h.avg_price,
  h.min_price,
  h.max_price,
  h.recorded_date
FROM hf_price_history h
JOIN hf_products p ON p.id = h.product_id
JOIN hf_markets m ON m.id = h.market_id
WHERE (p.slug = 'uzum' OR p.slug LIKE 'uzum-%')
  AND p.slug NOT LIKE '%frenk%'
  AND h.unit = 'kg'
  AND h.avg_price BETWEEN 1 AND 1000
  AND h.recorded_date = '2026-09-12'
ORDER BY p.name_tr, h.avg_price, m.name;
