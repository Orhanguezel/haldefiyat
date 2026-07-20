-- Haftalik bultenin SABIT SEPETI.
--
-- Neden sabit: bulten eskiden "en cok yuzde degisen" urunleri listeliyordu. Yuzde bazli
-- siralama dusuk fiyatli ve nis urunleri sistematik olarak one cikarir (tere 2 lira oynayinca
-- mansete cikar, domates 3 lira oynayinca listeye giremez) — okur her hafta tanimadigi
-- urunlerle karsilasip kiyas yapamiyordu. Sabit sepette liste degismez, sayilar degisir.
--
-- Secim olcutu: Turkiye tuketim hacmi + YIL BOYU bulunabilirlik + genis hal kapsami.
-- Mevsimsel yuksek hacimliler (karpuz, kiraz, kayisi) bilerek disarida — sabit sepette
-- sezon disi bosluk yaratirlar; onlar zaten yillik degisim bolumunde gorunur.
--
-- sort_order tabloda gorunum sirasidir (sebze once, sonra meyve).

CREATE TABLE IF NOT EXISTS hf_basket_products (
  slug        VARCHAR(128) NOT NULL PRIMARY KEY,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_basket_active_order (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- slug = KANONIK aile slug'i (hf_products.canonical_slug IS NULL olan master kayit).
INSERT IGNORE INTO hf_basket_products (slug, sort_order) VALUES
  ('domates',     10),
  ('patates',     20),
  ('sogan-kuru',  30),
  ('salatalik',   40),
  ('biber-sivri', 50),
  ('patlican',    60),
  ('kabak',       70),
  ('havuc',       80),
  ('elma',        90),
  ('limon',      100),
  ('portakal',   110),
  ('muz-yerli',  120);
