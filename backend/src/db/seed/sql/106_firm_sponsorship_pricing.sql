SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- Firma sponsorlugu fiyat listesi (TASLAK).
--
-- hf_firm_sponsorships tablosu, uclari ve "Sponsorlu" rozeti zaten vardi ama
-- SATILACAK SEYIN FIYATI hicbir yerde yaziyordu; her gorusmede yeniden
-- uyduruluyordu. Tek yerden okunur olsun diye buraya alindi.
--
-- status = "draft": rakamlar HENUZ ONAYLANMADI (17 Eyl 2026). Satista
-- kullanilmadan once Orhan/Atakan onayi gerekir. Admin panelden degistirilir,
-- deploy gerektirmez.
--
-- Birim mantigi: sponsorluk YERE gore satilir (hf_firm_sponsorships.placement):
--   il        -> yalniz o ilin /firmalar/<il> sayfasinda ust sirada
--   kategori  -> yalniz o firma tipinin listesinde (komisyoncu, soguk_hava...)
--   global    -> her listede
-- Fiyat farki kapsam farkidir; "il" en dar, "global" en genis.
--
-- Referans: ilan one-cikarma fiyatlari (listing_featured_pricing, seed 036)
-- gunluk 99 / haftalik 499 / aylik 1499 TL.

INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`)
SELECT UUID(), 'firm_sponsorship_pricing', '*', JSON_OBJECT(
  'status',   'draft',
  'currency', 'TRY',
  'note',     'Taslak fiyat — satista kullanilmadan once onaylanmali.',
  'tiers',    JSON_OBJECT(
    'il',       JSON_OBJECT('monthly', 750,  'quarterly', 1950, 'yearly', 6500),
    'kategori', JSON_OBJECT('monthly', 1500, 'quarterly', 3900, 'yearly', 13000),
    'global',   JSON_OBJECT('monthly', 4000, 'quarterly', 10500,'yearly', 36000)
  )
)
WHERE NOT EXISTS (
  SELECT 1 FROM (SELECT * FROM `site_settings`) AS s
  WHERE s.`key` = 'firm_sponsorship_pricing' AND s.`locale` = '*'
);
