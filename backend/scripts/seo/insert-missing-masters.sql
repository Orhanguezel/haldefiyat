SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO hf_products
  (slug, name_tr, display_name, category_slug, unit, is_active,
   seo_index, canonical_slug, data_quality, search_volume, display_order)
VALUES
  ('biber',    'Biber',    'Biber',    'sebze-meyve', 'kg', 1, 1, NULL, 100, 6000, 100),
  ('lahana',   'Lahana',   'Lahana',   'sebze-meyve', 'kg', 1, 1, NULL, 100, 2500, 100),
  ('sarimsak', 'Sarımsak', 'Sarımsak', 'sebze-meyve', 'kg', 1, 1, NULL, 100, 4500, 100)
ON DUPLICATE KEY UPDATE
  display_name  = VALUES(display_name),
  seo_index     = VALUES(seo_index),
  search_volume = VALUES(search_volume);

UPDATE hf_products
SET seo_index = 1,
    display_name = 'Soğan Kuru',
    canonical_slug = NULL,
    search_volume = 6500
WHERE slug = 'sogan-kuru';
