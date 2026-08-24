-- hf_firm_products.image_url — firma kendi urun gorselini yukleyebilsin.
-- Kanonik tanim seed'de (034_firms_schema.sql); bu dosya yalnizca CANLI DB icin.
-- Yeni kurulumlar seed'den dogru sema ile gelir.
SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'hf_firm_products'
    AND COLUMN_NAME = 'image_url'
);
SET @sql := IF(@col = 0,
  'ALTER TABLE hf_firm_products ADD COLUMN image_url VARCHAR(512) NULL AFTER price',
  'SELECT "image_url zaten var" AS bilgi'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
