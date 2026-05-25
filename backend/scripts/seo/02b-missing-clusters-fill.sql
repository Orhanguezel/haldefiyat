SET NAMES utf8mb4;
SET time_zone = '+00:00';

UPDATE hf_products
SET canonical_slug = 'biber',
    seo_index = 0
WHERE slug LIKE 'biber-%'
  AND slug NOT LIKE 'biberiye%'
  AND (canonical_slug IS NULL OR canonical_slug = '');

UPDATE hf_products
SET seo_index = 0,
    canonical_slug = 'biberiye-rozmarin'
WHERE slug IN ('biberiye-25-gr', 'biberiye-diger');

UPDATE hf_products
SET seo_index = 1,
    display_name = 'Biberiye (Rozmarin)',
    canonical_slug = NULL
WHERE slug = 'biberiye-rozmarin';

UPDATE hf_products
SET canonical_slug = 'sogan-kuru',
    seo_index = 0
WHERE slug LIKE 'sogan-%'
  AND slug NOT IN ('sogan-kuru', 'sogan-taze')
  AND (canonical_slug IS NULL OR canonical_slug = '');

UPDATE hf_products
SET seo_index = 1,
    display_name = 'Taze Soğan',
    canonical_slug = NULL
WHERE slug = 'sogan-taze';

UPDATE hf_products
SET canonical_slug = 'lahana',
    seo_index = 0
WHERE slug LIKE 'lahana-%'
  AND (canonical_slug IS NULL OR canonical_slug = '');

UPDATE hf_products
SET canonical_slug = 'sarimsak',
    seo_index = 0
WHERE slug LIKE 'sarimsak-%'
  AND slug NOT IN ('sarimsak-taze')
  AND (canonical_slug IS NULL OR canonical_slug = '');

UPDATE hf_products
SET seo_index = 1,
    display_name = 'Taze Sarımsak',
    canonical_slug = NULL
WHERE slug = 'sarimsak-taze';

UPDATE hf_products
SET canonical_slug = 'sogan-kuru',
    seo_index = 0,
    display_name = NULL
WHERE slug = 'k-sogan';
