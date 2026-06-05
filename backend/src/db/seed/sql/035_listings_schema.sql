-- İlan + Canlı Borsa modülü
-- İki taraflı pazar: üretici=satış ilanı, komisyoncu/alıcı=alım ilanı.
-- hf_firms ailesi deseni miras alınır. Ürün taksonomisi hf_products'a FK ile bağlanır
-- (firma fiyatlarının aksine) — canlı borsa karşılaştırması bunu gerektirir.

CREATE TABLE IF NOT EXISTS hf_listings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(190) NOT NULL,
  user_id VARCHAR(36) NULL,
  firm_id INT NULL,
  listing_type ENUM('satis','alim') NOT NULL DEFAULT 'satis',
  party_role ENUM('uretici','komisyoncu','alici','diger') NOT NULL DEFAULT 'uretici',

  product_id INT UNSIGNED NULL,
  product_slug VARCHAR(128) NULL,
  product_name VARCHAR(255) NOT NULL,
  category_slug VARCHAR(64) NOT NULL DEFAULT 'diger',

  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  quality VARCHAR(96) NULL,
  packaging VARCHAR(96) NULL,

  quantity DECIMAL(14,2) NULL,
  quantity_unit VARCHAR(32) NOT NULL DEFAULT 'kg',

  price_type ENUM('sabit','pazarlik','hal_endeksli') NOT NULL DEFAULT 'sabit',
  price_min DECIMAL(12,2) NULL,
  price_max DECIMAL(12,2) NULL,
  price_unit VARCHAR(32) NOT NULL DEFAULT 'kg',
  hal_index_pct DECIMAL(6,2) NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'TRY',

  city_slug VARCHAR(96) NULL,
  district_slug VARCHAR(128) NULL,

  contact_name VARCHAR(255) NULL,
  contact_phone VARCHAR(128) NULL,
  phone_verified TINYINT(1) NOT NULL DEFAULT 0,
  hide_phone TINYINT(1) NOT NULL DEFAULT 0,

  valid_until DATE NOT NULL,
  status ENUM('pending','approved','rejected','expired','closed') NOT NULL DEFAULT 'pending',
  moderation_note TEXT NULL,
  is_suspicious TINYINT(1) NOT NULL DEFAULT 0,

  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  featured_until DATETIME(3) NULL,
  view_count INT NOT NULL DEFAULT 0,

  source ENUM('user','telegram','whatsapp','assisted','seed') NOT NULL DEFAULT 'user',
  created_by VARCHAR(36) NULL,
  raw JSON NULL,
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  UNIQUE KEY hf_listings_slug_uq (slug),
  CONSTRAINT hf_listings_product_fk FOREIGN KEY (product_id) REFERENCES hf_products(id) ON DELETE SET NULL,
  CONSTRAINT hf_listings_firm_fk FOREIGN KEY (firm_id) REFERENCES hf_firms(id) ON DELETE SET NULL,
  KEY hf_listings_city_idx (city_slug, district_slug),
  KEY hf_listings_product_idx (product_slug),
  KEY hf_listings_type_status_idx (listing_type, status, valid_until),
  KEY hf_listings_borsa_idx (product_id, city_slug, listing_type, status),
  KEY hf_listings_featured_idx (is_featured, featured_until),
  KEY hf_listings_user_idx (user_id),
  KEY hf_listings_status_idx (status, created_at)
);

CREATE TABLE IF NOT EXISTS hf_listing_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL,
  url VARCHAR(512) NOT NULL,
  display_order INT NOT NULL DEFAULT 100,
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT hf_listing_images_listing_fk FOREIGN KEY (listing_id) REFERENCES hf_listings(id) ON DELETE CASCADE,
  KEY hf_listing_images_listing_idx (listing_id)
);

-- "Teklif al" / iletişim akışı — hf_firm_deals lead deseninin ilan karşılığı
CREATE TABLE IF NOT EXISTS hf_listing_inquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL,
  user_id VARCHAR(36) NULL,
  name VARCHAR(255) NULL,
  phone VARCHAR(128) NULL,
  message TEXT NULL,
  offer_price DECIMAL(12,2) NULL,
  status ENUM('new','contacted','closed') NOT NULL DEFAULT 'new',
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT hf_listing_inquiries_listing_fk FOREIGN KEY (listing_id) REFERENCES hf_listings(id) ON DELETE CASCADE,
  KEY hf_listing_inquiries_listing_idx (listing_id),
  KEY hf_listing_inquiries_status_idx (status, created_at)
);

-- Telefon OTP doğrulama — düşük sürtünmeli ilan girişi + güven dengesi.
-- Şu an projede OTP altyapısı yok; mobil-öncelikli "çok kişi girsin" hedefi için eklenir.
CREATE TABLE IF NOT EXISTS hf_phone_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(32) NOT NULL,
  code VARCHAR(8) NOT NULL,
  purpose ENUM('listing','signup','claim') NOT NULL DEFAULT 'listing',
  attempts INT NOT NULL DEFAULT 0,
  verified_at DATETIME(3) NULL,
  expires_at DATETIME(3) NOT NULL,
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  KEY hf_phone_verifications_phone_idx (phone, purpose, expires_at)
);
