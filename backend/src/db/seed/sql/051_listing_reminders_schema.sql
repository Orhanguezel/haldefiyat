-- Ilan hatirlatma gonderim kaydi.
--
-- Neden ayri tablo: cron gunde bir kez `valid_until = CURDATE() + 3 gun` kosulunu tarar,
-- yani her ilan bu kosula normalde bir kez takilir. Ama cron iki kez calisirsa, gun
-- ortasinda yeniden deploy olursa veya bir hata sonrasi tekrar denenirse ayni kullaniciya
-- ikinci mail gider. UNIQUE(listing_id, kind) bunu imkansiz kilar.
--
-- kind: 'expiry_3d' (suresi dolmadan 3 gun once). Ileride 'expiry_1d', 'expired' eklenebilir.

CREATE TABLE IF NOT EXISTS hf_listing_reminders (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  listing_id  INT NOT NULL,
  kind        VARCHAR(32) NOT NULL,
  sent_at     DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_listing_kind (listing_id, kind),
  KEY idx_reminder_sent (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
