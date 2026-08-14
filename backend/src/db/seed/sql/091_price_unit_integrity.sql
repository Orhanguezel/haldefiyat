-- Lexical unit cleanup is deterministic. Semantic mismatches are not rewritten:
-- public queries exclude them until source evidence supports a cohort migration.
UPDATE hf_price_history SET unit = 'kg' WHERE LOWER(TRIM(unit)) IN ('kg.', 'kilo', 'kilogram');
UPDATE hf_price_history SET unit = 'adet' WHERE LOWER(TRIM(unit)) IN ('ad.', 'tane');
UPDATE hf_price_history SET unit = 'kasa' WHERE LOWER(TRIM(unit)) IN ('sandik', 'sandık');
UPDATE hf_price_history SET unit = 'bag' WHERE LOWER(TRIM(unit)) IN ('bağ', 'bag.');
UPDATE hf_price_history SET unit = 'koli' WHERE LOWER(TRIM(unit)) IN ('kutu', 'koli.');
UPDATE hf_price_history SET unit = 'paket' WHERE LOWER(TRIM(unit)) IN ('pk', 'paket.');
UPDATE hf_price_history SET unit = 'litre' WHERE LOWER(TRIM(unit)) IN ('lt', 'lt.', 'l');
UPDATE hf_price_history SET unit = 'ton' WHERE LOWER(TRIM(unit)) IN ('tonne', 'ton.');

UPDATE hf_retail_prices SET unit = 'kg' WHERE LOWER(TRIM(unit)) IN ('kg.', 'kilo', 'kilogram');
UPDATE hf_retail_prices SET unit = 'adet' WHERE LOWER(TRIM(unit)) IN ('ad.', 'tane');
UPDATE hf_retail_prices SET unit = 'kasa' WHERE LOWER(TRIM(unit)) IN ('sandik', 'sandık');
UPDATE hf_retail_prices SET unit = 'bag' WHERE LOWER(TRIM(unit)) IN ('bağ', 'bag.');
UPDATE hf_retail_prices SET unit = 'koli' WHERE LOWER(TRIM(unit)) IN ('kutu', 'koli.');
UPDATE hf_retail_prices SET unit = 'paket' WHERE LOWER(TRIM(unit)) IN ('pk', 'paket.');
UPDATE hf_retail_prices SET unit = 'litre' WHERE LOWER(TRIM(unit)) IN ('lt', 'lt.', 'l');
UPDATE hf_retail_prices SET unit = 'ton' WHERE LOWER(TRIM(unit)) IN ('tonne', 'ton.');
