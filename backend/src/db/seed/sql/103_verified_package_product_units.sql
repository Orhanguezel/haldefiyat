-- Belediye birimleriyle dogrulanan ayri urunler; mevcut kg/adet urunlerini degistirmez.
-- Canakkale kasa -> ETL koli; Bursa palamut cift -> fiyat / 2, adet.
INSERT INTO hf_products
  (slug,name_tr,display_name,unit,category_slug,aliases,is_active,seo_index,data_quality)
VALUES
  ('mantar-kasa','Mantar (Kasa)','Mantar (Kasa)','koli','sebze','["MANTAR"]',1,0,0),
  ('marul-aysberg-kasa','Marul Aysberg (Kasa)','Marul Aysberg (Kasa)','koli','sebze','["MARUL ( AYSBERG )"]',1,0,0),
  ('marul-kasik-kasa','Marul Kaşık (Kasa)','Marul Kaşık (Kasa)','koli','sebze','["MARUL ( KAŞIK )"]',1,0,0),
  ('marul-lolorosso-kasa','Marul Lolorosso (Kasa)','Marul Lolorosso (Kasa)','koli','sebze','["MARUL ( LOLOROSSO )"]',1,0,0),
  ('palamut-adet','Palamut (Adet)','Palamut (Adet)','adet','balik','["PALAMUT"]',1,0,0)
ON DUPLICATE KEY UPDATE slug=VALUES(slug);
