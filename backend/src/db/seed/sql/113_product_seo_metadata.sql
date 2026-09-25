-- Ürün bazlı arama sonucu başlığı ve açıklaması.
-- NULL değerler mevcut dinamik ürün meta şablonunu kullanmaya devam eder.
ALTER TABLE hf_products
  ADD COLUMN seo_title VARCHAR(80) NULL AFTER image_url,
  ADD COLUMN seo_description VARCHAR(200) NULL AFTER seo_title;
