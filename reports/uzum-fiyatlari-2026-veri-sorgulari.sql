-- Üzüm fiyatları 2026 sezon analizi için yeniden üretilebilir veri sorguları.
-- Kesim tarihi: 2026-09-12
--
-- 12 Eylül doğrulaması (bkz. …-DOGRULAMA.md): ilk sürüm sitenin yayın süzgeçlerini
-- uygulamıyordu ve tabanın %38'i blackout'lu, %25'i makası 3× aşan sentetik ortalamaydı;
-- Bursa'nın üç yıl her gün 152,50 yazan donmuş serisi manşete girmişti. Aşağıdaki
-- GRAPE_FILTER sitenin kendi kurallarıyla aynıdır (city-product.ts VALID_PRICE + makas guard).
-- Not: PERCENTILE_CONT yerine tek/çift gözlem sayısında çalışan sıra ortalaması kullanılır.

-- ---------------------------------------------------------------------------
-- 0) Temiz taban: kaç kayıt, kaç hal, kaç ürün
-- ---------------------------------------------------------------------------
WITH grape_base AS (
  SELECT h.recorded_date, h.market_id, h.product_id, h.avg_price
  FROM hf_price_history h
  JOIN hf_products p ON p.id = h.product_id
  JOIN hf_markets m ON m.id = h.market_id
  WHERE (p.slug = 'uzum' OR p.slug LIKE 'uzum-%')
    AND p.slug NOT LIKE '%frenk%'
    AND h.unit = 'kg'
    AND h.avg_price BETWEEN 1 AND 1000
    AND h.recorded_date BETWEEN '2024-01-01' AND '2026-09-12'
    AND m.city_name <> 'Türkiye'                                   -- hal.gov.tr ulusal toplamı ayrı
    AND (h.min_price IS NULL OR h.max_price IS NULL OR h.max_price / h.min_price <= 3)  -- sentetik ortalama makası
    AND NOT EXISTS (SELECT 1 FROM hf_market_blackouts b
                    WHERE b.market_id = h.market_id AND h.recorded_date BETWEEN b.from_date AND b.to_date)
)
SELECT COUNT(*) AS records, COUNT(DISTINCT market_id) AS markets, COUNT(DISTINCT product_id) AS products,
       MIN(recorded_date) AS first_date, MAX(recorded_date) AS last_date
FROM grape_base;

-- ---------------------------------------------------------------------------
-- 1) Aylık medyan (tüm yaş üzüm ailesi, şehir halleri)
-- ---------------------------------------------------------------------------
WITH grape_base AS (
  SELECT YEAR(h.recorded_date) AS year_no, MONTH(h.recorded_date) AS month_no, h.avg_price
  FROM hf_price_history h
  JOIN hf_products p ON p.id = h.product_id
  JOIN hf_markets m ON m.id = h.market_id
  WHERE (p.slug = 'uzum' OR p.slug LIKE 'uzum-%')
    AND p.slug NOT LIKE '%frenk%'
    AND h.unit = 'kg'
    AND h.avg_price BETWEEN 1 AND 1000
    AND h.recorded_date BETWEEN '2024-01-01' AND '2026-09-12'
    AND m.city_name <> 'Türkiye'
    AND (h.min_price IS NULL OR h.max_price IS NULL OR h.max_price / h.min_price <= 3)
    AND NOT EXISTS (SELECT 1 FROM hf_market_blackouts b
                    WHERE b.market_id = h.market_id AND h.recorded_date BETWEEN b.from_date AND b.to_date)
), ranked AS (
  SELECT *,
    ROW_NUMBER() OVER (PARTITION BY year_no, month_no ORDER BY avg_price) AS row_no,
    COUNT(*) OVER (PARTITION BY year_no, month_no) AS row_count
  FROM grape_base
)
SELECT year_no, month_no, ROUND(AVG(avg_price), 2) AS median_price, MAX(row_count) AS observations
FROM ranked
WHERE row_no IN (FLOOR((row_count + 1) / 2), FLOOR((row_count + 2) / 2))
GROUP BY year_no, month_no
ORDER BY year_no, month_no;

-- ---------------------------------------------------------------------------
-- 2) Ürün bazında Tem–Eyl medyanı ve hal sayısı (uzum, uzum-beyaz, uzum-cekirdeksiz)
--    Dikkat: 'uzum' master 2023–2025'te tek halin donmuş serisiydi; blackout onu düşürür.
-- ---------------------------------------------------------------------------
WITH product_base AS (
  SELECT p.slug, YEAR(h.recorded_date) AS year_no, MONTH(h.recorded_date) AS month_no, h.market_id, h.avg_price
  FROM hf_price_history h
  JOIN hf_products p ON p.id = h.product_id
  JOIN hf_markets m ON m.id = h.market_id
  WHERE p.slug IN ('uzum', 'uzum-beyaz', 'uzum-cekirdeksiz')
    AND h.unit = 'kg'
    AND h.avg_price BETWEEN 1 AND 1000
    AND h.recorded_date BETWEEN '2022-07-01' AND '2026-09-12'
    AND MONTH(h.recorded_date) IN (7, 8, 9)
    AND m.city_name <> 'Türkiye'
    AND (h.min_price IS NULL OR h.max_price IS NULL OR h.max_price / h.min_price <= 3)
    AND NOT EXISTS (SELECT 1 FROM hf_market_blackouts b
                    WHERE b.market_id = h.market_id AND h.recorded_date BETWEEN b.from_date AND b.to_date)
), ranked AS (
  SELECT *,
    ROW_NUMBER() OVER (PARTITION BY slug, year_no, month_no ORDER BY avg_price) AS row_no,
    COUNT(*) OVER (PARTITION BY slug, year_no, month_no) AS row_count
  FROM product_base
), medians AS (
  SELECT slug, year_no, month_no, ROUND(AVG(avg_price), 2) AS median_price, MAX(row_count) AS observations
  FROM ranked
  WHERE row_no IN (FLOOR((row_count + 1) / 2), FLOOR((row_count + 2) / 2))
  GROUP BY slug, year_no, month_no
), market_counts AS (
  SELECT slug, year_no, month_no, COUNT(DISTINCT market_id) AS markets
  FROM product_base GROUP BY slug, year_no, month_no
)
SELECT medians.slug, medians.year_no, medians.month_no, medians.median_price, medians.observations, market_counts.markets
FROM medians JOIN market_counts USING (slug, year_no, month_no)
ORDER BY medians.slug, medians.year_no, medians.month_no;

-- ---------------------------------------------------------------------------
-- 3) Yıllık kıyas — YALNIZ eşleşmiş (hal × ürün) çiftleriyle.
--    Ham aylık medyanların yıllar arası kıyası kapsam değişiminden dolayı geçersizdir
--    (2024: 2 hal, 2025: 4 hal, 2026: 12 hal). Pencere her iki yılda 1–12 Eylül.
-- ---------------------------------------------------------------------------
WITH g AS (
  SELECT YEAR(h.recorded_date) AS y, m.slug AS hal, p.slug AS urun, h.avg_price
  FROM hf_price_history h
  JOIN hf_products p ON p.id = h.product_id
  JOIN hf_markets m ON m.id = h.market_id
  WHERE (p.slug = 'uzum' OR p.slug LIKE 'uzum-%')
    AND p.slug NOT LIKE '%frenk%'
    AND h.unit = 'kg'
    AND h.avg_price BETWEEN 1 AND 1000
    AND m.city_name <> 'Türkiye'
    AND (h.min_price IS NULL OR h.max_price IS NULL OR h.max_price / h.min_price <= 3)
    AND ((h.recorded_date BETWEEN '2025-09-01' AND '2025-09-12') OR (h.recorded_date BETWEEN '2026-09-01' AND '2026-09-12'))
    AND NOT EXISTS (SELECT 1 FROM hf_market_blackouts b
                    WHERE b.market_id = h.market_id AND h.recorded_date BETWEEN b.from_date AND b.to_date)
), pairs AS (
  SELECT hal, urun,
    AVG(CASE WHEN y = 2025 THEN avg_price END) AS p25,
    AVG(CASE WHEN y = 2026 THEN avg_price END) AS p26
  FROM g GROUP BY hal, urun
  HAVING p25 IS NOT NULL AND p26 IS NOT NULL
)
SELECT hal, urun, ROUND(p25, 1) AS eyl_2025, ROUND(p26, 1) AS eyl_2026, ROUND((p26 / p25 - 1) * 100, 1) AS pct
FROM pairs
UNION ALL
SELECT 'TOPLAM', CONCAT(COUNT(*), ' çift'), NULL, NULL, ROUND(SUM(p26) / SUM(p25) * 100 - 100, 1)
FROM pairs;

-- ---------------------------------------------------------------------------
-- 4) 12 Eylül 2026 çeşit × hal tablosu (ulusal ortalama dahil, etiketli)
-- ---------------------------------------------------------------------------
SELECT p.name_tr AS product, m.name AS market, h.avg_price, h.min_price, h.max_price, h.recorded_date
FROM hf_price_history h
JOIN hf_products p ON p.id = h.product_id
JOIN hf_markets m ON m.id = h.market_id
WHERE (p.slug = 'uzum' OR p.slug LIKE 'uzum-%')
  AND p.slug NOT LIKE '%frenk%'
  AND h.unit = 'kg'
  AND h.avg_price BETWEEN 1 AND 1000
  AND h.recorded_date = '2026-09-12'
ORDER BY p.name_tr, h.avg_price, m.name;
