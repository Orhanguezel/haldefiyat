-- The May 2026 apple analysis contains city-level YoY claims calculated before
-- the Bursa/Denizli/Eskisehir frozen-series incident was discovered. Preserve
-- the report for editorial re-audit, but remove it from public publication.
UPDATE hf_analysis_reports
SET status = 'draft', updated_at = NOW(3)
WHERE slug = 'elma-fiyat-analizi-mayis-2026'
  AND status = 'published';
