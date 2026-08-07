CREATE TABLE IF NOT EXISTS hf_ad_slots (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slot_key VARCHAR(64) NOT NULL,
  label VARCHAR(160) NOT NULL,
  page_type VARCHAR(64) NOT NULL,
  placement_description VARCHAR(300) NOT NULL,
  desktop_capacity TINYINT UNSIGNED NOT NULL DEFAULT 1,
  mobile_capacity TINYINT UNSIGNED NOT NULL DEFAULT 1,
  mobile_behavior ENUM('stack','hide','single','scroll') NOT NULL DEFAULT 'stack',
  recommended_size VARCHAR(80) NULL,
  aspect_ratio VARCHAR(32) NULL,
  source_types JSON NOT NULL,
  delivery_mode ENUM('fixed','rotation') NOT NULL DEFAULT 'fixed',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  display_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY hf_ad_slots_key_uq (slot_key),
  KEY hf_ad_slots_active_idx (is_active, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO hf_ad_slots
  (slot_key, label, page_type, placement_description, desktop_capacity, mobile_capacity, mobile_behavior, recommended_size, aspect_ratio, source_types, delivery_mode, is_active, display_order)
VALUES
  ('global_top', 'Tüm sayfalar — üst', 'global', 'Ana navigasyonun hemen altında.', 1, 1, 'single', '970×90', '10.78:1', JSON_ARRAY('custom','firm','code'), 'rotation', 1, 10),
  ('global_footer', 'Tüm sayfalar — footer üstü', 'global', 'Ana içerik bittikten sonra, footer başlamadan önce.', 2, 1, 'stack', '970×90 / iki kart', '10.78:1', JSON_ARRAY('custom','listing','firm','code'), 'fixed', 1, 20),
  ('home_ticker_below', 'Anasayfa — ticker altı', 'home', 'Canlı fiyat ticker şeridinin altında.', 1, 1, 'single', '970×90; mobil 320×100', '10.78:1', JSON_ARRAY('custom','listing','firm','code'), 'rotation', 1, 30),
  ('home_mid', 'Anasayfa — orta', 'home', 'Anasayfa ana veri bloklarının arasında.', 2, 1, 'stack', '970×90 / iki kart', '10.78:1', JSON_ARRAY('custom','listing','firm'), 'fixed', 1, 40),
  ('home_footer_top', 'Anasayfa — footer üstü', 'home', 'Anasayfa içerik sonu ile footer arasında.', 2, 1, 'stack', '970×90 / iki kart', '10.78:1', JSON_ARRAY('custom','listing','firm','code'), 'fixed', 1, 50),
  ('prices_top', 'Fiyatlar — üst şerit', 'prices', 'Fiyat tablosunun üst bölümünde.', 2, 1, 'stack', '970×90 / iki kart', '10.78:1', JSON_ARRAY('custom','listing','firm'), 'fixed', 1, 60),
  ('prices_sidebar', 'Fiyatlar — yan sütun', 'prices', 'Fiyatlar sayfasının sağ yan sütununda.', 1, 1, 'single', '300×250 / 300×600', '6:5', JSON_ARRAY('custom','firm','code'), 'rotation', 1, 70),
  ('analiz_inline', 'Analiz — yazı içi', 'analysis', 'Analiz metni içindeki kontrollü reklam kırılımında.', 1, 1, 'single', '728×90', '8.09:1', JSON_ARRAY('custom','firm','code'), 'rotation', 1, 80),
  ('analiz_sidebar', 'Analiz — yan sütun', 'analysis', 'Analiz detayının sağ yan sütununda.', 1, 1, 'single', '300×250', '6:5', JSON_ARRAY('custom','firm','code'), 'rotation', 1, 90),
  ('urun_sidebar', 'Ürün detay — yan sütun', 'product', 'Ürün detayının sağ yan sütununda.', 1, 1, 'single', '300×250', '6:5', JSON_ARRAY('custom','listing','firm'), 'rotation', 1, 100),
  ('hal_sidebar', 'Hal detay — yan sütun', 'market', 'Hal detayının sağ yan sütununda.', 1, 1, 'single', '300×250', '6:5', JSON_ARRAY('custom','listing','firm'), 'rotation', 1, 110),
  ('listing_detail_sidebar', 'İlan detay — yan sütun', 'listing', 'İlan iletişim formunun altında.', 1, 1, 'single', '300×250', '6:5', JSON_ARRAY('custom','listing','firm'), 'fixed', 1, 120),
  ('firm_detail_sidebar', 'Firma detay — yan sütun', 'firm', 'Firma detayının sağ yan sütununda.', 1, 1, 'single', '300×250', '6:5', JSON_ARRAY('custom','firm'), 'fixed', 1, 130),
  ('firm_detail_footer', 'Firma detay — içerik altı', 'firm', 'Firma detay içeriğinin sonunda.', 2, 1, 'stack', '970×90 / iki kart', '10.78:1', JSON_ARRAY('custom','listing','firm'), 'fixed', 1, 140)
ON DUPLICATE KEY UPDATE
  label = VALUES(label),
  page_type = VALUES(page_type),
  placement_description = VALUES(placement_description),
  recommended_size = VALUES(recommended_size),
  aspect_ratio = VALUES(aspect_ratio),
  source_types = VALUES(source_types),
  display_order = VALUES(display_order);
