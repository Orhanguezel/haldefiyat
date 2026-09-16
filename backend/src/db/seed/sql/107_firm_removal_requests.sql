SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- Firma kaydi KALDIRMA talebi (KVKK m.11 silme hakki).
--
-- NEDEN ayri tablo: hf_firm_claims "bu firma benim, yonetmek istiyorum" demek;
-- bu ise "kaydimi yayindan kaldirin" demek. Ikisi farkli sonuc uretir ve
-- kaldirma talebi hesap acmadan, oturum acmadan yapilabilmeli — KVKK basvurusunun
-- onune giris zorunlulugu konulamaz.
--
-- Kayitlarin 1.333'u halkatalogu.com derlemesidir; ilgili kisinin kendisi
-- eklememistir. Duzeltme yolu sayfada zaten vardi, SILME yolu yoktu. Sikayetlerin
-- tipik baslangici "kaldirin dedim kaldirmadilar"dir.
--
-- Onaylanan talep firmayi SILMEZ, yayindan kaldirir (hf_firms.is_active = 0):
-- geri alinabilir ve talebin ne zaman/kim tarafindan karsilandigi kayitli kalir.

CREATE TABLE IF NOT EXISTS hf_firm_removal_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firm_id INT NOT NULL,
  requester_name VARCHAR(160) NOT NULL,
  -- Talebi yapanin firmayla iliskisi; yetkisiz kaldirma talebini ayirt etmek icin.
  relationship ENUM('sahibi','yetkili','calisan','diger') NOT NULL DEFAULT 'sahibi',
  contact VARCHAR(190) NOT NULL,
  reason TEXT NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  review_note TEXT NULL,
  reviewed_by VARCHAR(36) NULL,
  reviewed_at DATETIME(3) NULL,
  created_ip VARCHAR(64) NULL,
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT hf_firm_removal_requests_firm_fk FOREIGN KEY (firm_id) REFERENCES hf_firms(id) ON DELETE CASCADE,
  KEY hf_firm_removal_requests_firm_idx (firm_id),
  KEY hf_firm_removal_requests_status_idx (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
