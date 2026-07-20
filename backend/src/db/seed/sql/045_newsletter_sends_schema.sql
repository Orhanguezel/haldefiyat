-- Gonderilen haftalik bultenlerin arsivi.
--
-- Neden: bulten HTML'i her calismada yeniden uretiliyordu ve hicbir yerde saklanmiyordu.
-- Abonelere ne gittigi geriye donuk GORULEMIYORDU — 2026-07 bulteninde "+%356" gibi bir
-- hata abonelere ulastiktan sonra ancak ekran goruntusunden fark edilebildi. Arsiv olmadan
-- "gecen hafta ne gonderdik" sorusunun cevabi yok, dolayisiyla hata da tespit edilemiyor.
--
-- status:
--   draft   — uretildi, henuz gonderilmedi (onay bekliyor / duzenlenebilir)
--   sent    — abonelere gonderildi
--   skipped — gonderilmedi (abone yok, veri yok)
--   failed  — gonderim hatasi

CREATE TABLE IF NOT EXISTS hf_newsletter_sends (
  id          VARCHAR(36) NOT NULL PRIMARY KEY,
  kind        VARCHAR(16) NOT NULL DEFAULT 'weekly',
  status      VARCHAR(16) NOT NULL DEFAULT 'draft',
  subject     VARCHAR(255) NOT NULL,
  html        MEDIUMTEXT NOT NULL,
  recipients  INT NOT NULL DEFAULT 0,
  successes   INT NOT NULL DEFAULT 0,
  failures    INT NOT NULL DEFAULT 0,
  reason      VARCHAR(255),
  edited_at   DATETIME(3),
  sent_at     DATETIME(3),
  created_at  DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_sends_created (created_at),
  KEY idx_sends_status (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
