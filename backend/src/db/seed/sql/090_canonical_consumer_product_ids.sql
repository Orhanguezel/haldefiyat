-- Consumer state must reference the canonical product row, never a variant ID.
-- Price history intentionally keeps observed variant IDs; public price queries
-- aggregate them through canonical_slug without destroying source granularity.

INSERT IGNORE INTO hf_user_favorites (user_id, product_id, created_at)
SELECT favorite.user_id, master.id, favorite.created_at
FROM hf_user_favorites favorite
INNER JOIN hf_products variant ON variant.id = favorite.product_id
INNER JOIN hf_products master ON master.slug = variant.canonical_slug;

DELETE favorite
FROM hf_user_favorites favorite
INNER JOIN hf_products variant ON variant.id = favorite.product_id
WHERE variant.canonical_slug IS NOT NULL;

UPDATE hf_alerts alert_row
INNER JOIN hf_products variant ON variant.id = alert_row.product_id
INNER JOIN hf_products master ON master.slug = variant.canonical_slug
SET alert_row.product_id = master.id;

UPDATE hf_firm_products firm_product
INNER JOIN hf_products variant ON variant.slug = firm_product.product_slug
SET firm_product.product_slug = variant.canonical_slug
WHERE variant.canonical_slug IS NOT NULL;

UPDATE hf_firm_prices firm_price
INNER JOIN hf_products variant ON variant.slug = firm_price.product_slug
SET firm_price.product_slug = variant.canonical_slug
WHERE variant.canonical_slug IS NOT NULL;
