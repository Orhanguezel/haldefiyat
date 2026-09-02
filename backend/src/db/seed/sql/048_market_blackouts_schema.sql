-- Hal x tarih araligi karantinasi.
--
-- Bazi hallerin verisi gecmise donuk GUVENILMEZ (ornek: tek bir anlik goruntunun
-- 1097 gun boyunca her gune kopyalanmasi). Bu satirlar SILINMEZ — dogru veriyle
-- backfill edilecekler. O zamana kadar toplama sorgulari bu araliklari disler.
--
-- Kullanim: `excludeBlackouts()` yardimcisi (modules/prices/blackouts.ts). Yeni bir
-- toplama sorgusu yazarken o yardimciyi kullan; elle NOT (...) yazma.
--
-- Backfill tamamlanan aralik icin kaydi SIL — veri otomatik geri gelir.

CREATE TABLE IF NOT EXISTS hf_market_blackouts (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  market_id  INT NOT NULL,
  from_date  DATE NOT NULL,
  to_date    DATE NOT NULL,
  reason     VARCHAR(255) NOT NULL,
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_blackout_market (market_id, from_date, to_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Donmus veri: tek anlik goruntu her gune kopyalanmis. Bitis tarihleri gunluk
-- parmak izi (kayit sayisi + fiyat toplami) degismeye basladigi gune gore olculdu.
INSERT INTO hf_market_blackouts (market_id, from_date, to_date, reason)
SELECT m.id, '2023-04-21', d.son, 'donmus veri: tek anlik goruntu tekrarlanmis'
FROM hf_markets m
JOIN (
  SELECT 'Bursa Toptancı Hali'     AS nm, '2026-04-21' AS son UNION ALL
  SELECT 'Denizli Toptancı Hali',        '2026-04-24' UNION ALL
  SELECT 'Eskişehir Toptancı Hali',      '2026-04-19'
) d ON d.nm = m.name
WHERE NOT EXISTS (
  SELECT 1 FROM hf_market_blackouts b WHERE b.market_id = m.id AND b.from_date = '2023-04-21'
);

-- 2026-09-02: batiakdeniztv.com kaynakli Antalya ilce halleri. Site fiyat
-- sayfalarini guncellemeyi birakti; ETL her gun ayni degerleri yeniden yaziyordu
-- (Serik'te 42 gun boyunca gunluk toplam kurusu kurusuna 395,00). Kaynaklar
-- etl-sources.ts'te kapatildi; bu kayit o donemin satirlarini toplamalardan disler.
-- Bitis tarihleri kaynak kapatildigi gune sabitlendi — site canlanip kaynak yeniden
-- acilirsa bu kayitlar SILINMELI, yoksa gercek veriyi de gizlerler.
INSERT INTO hf_market_blackouts (market_id, from_date, to_date, reason)
SELECT m.id, d.baslangic, '2026-09-02', 'donmus veri: kaynak site guncellemeyi birakti'
FROM hf_markets m
JOIN (
  SELECT 'Antalya Serik Hali'      AS nm, '2026-07-22' AS baslangic UNION ALL
  SELECT 'Antalya Kumluca Hali',         '2026-07-22' UNION ALL
  SELECT 'Gazipaşa Toptancı Hali',       '2026-07-22' UNION ALL
  SELECT 'Finike Toptancı Hali',         '2026-07-22' UNION ALL
  SELECT 'Alanya Toptancı Hali',         '2026-06-24'
) d ON d.nm = m.name
WHERE NOT EXISTS (
  SELECT 1 FROM hf_market_blackouts b WHERE b.market_id = m.id AND b.from_date = d.baslangic
);
