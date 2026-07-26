-- Otomatik analizlerde insan editoryal kontrolunu denetlenebilir hale getirir.
-- Alanlar yalniz admin publish/schedule eyleminde doldurulur; eski yayinlar
-- geriye donuk olarak incelenmis varsayilmaz.

ALTER TABLE hf_analysis_reports
  ADD COLUMN reviewed_by VARCHAR(36) NULL AFTER total_records,
  ADD COLUMN reviewed_at DATETIME(3) NULL AFTER reviewed_by;
