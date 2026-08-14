-- Alias/thin variants inherit the canonical target category. This removes
-- public filter drift without merging products or changing package units.
UPDATE hf_products variant
INNER JOIN hf_products master ON master.slug = variant.canonical_slug
SET variant.category_slug = master.category_slug
WHERE variant.canonical_slug IS NOT NULL
  AND variant.category_slug <> master.category_slug;
