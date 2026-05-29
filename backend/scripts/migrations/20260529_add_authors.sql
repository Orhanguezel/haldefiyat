SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS hf_authors (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(120) NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  title VARCHAR(200) DEFAULT NULL,
  bio TEXT DEFAULT NULL,
  expertise JSON DEFAULT NULL,
  avatar_url VARCHAR(500) DEFAULT NULL,
  credentials VARCHAR(300) DEFAULT NULL,
  social_links JSON DEFAULT NULL,
  email VARCHAR(255) DEFAULT NULL,
  is_active TINYINT NOT NULL DEFAULT 1,
  display_order INT NOT NULL DEFAULT 100,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY hf_authors_slug_uq (slug),
  KEY hf_authors_active_idx (is_active, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELIMITER //

DROP PROCEDURE IF EXISTS add_hf_analysis_column_if_missing//
CREATE PROCEDURE add_hf_analysis_column_if_missing(
  IN p_column_name VARCHAR(64),
  IN p_alter_sql TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'hf_analysis_reports'
      AND COLUMN_NAME = p_column_name
  ) THEN
    SET @ddl = p_alter_sql;
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END//

DROP PROCEDURE IF EXISTS add_hf_analysis_index_if_missing//
CREATE PROCEDURE add_hf_analysis_index_if_missing(
  IN p_index_name VARCHAR(64),
  IN p_alter_sql TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'hf_analysis_reports'
      AND INDEX_NAME = p_index_name
  ) THEN
    SET @ddl = p_alter_sql;
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END//

DELIMITER ;

CALL add_hf_analysis_column_if_missing('author_id', 'ALTER TABLE `hf_analysis_reports` ADD COLUMN `author_id` INT UNSIGNED NULL AFTER `author`');
CALL add_hf_analysis_index_if_missing('hf_analysis_reports_author_idx', 'ALTER TABLE `hf_analysis_reports` ADD INDEX `hf_analysis_reports_author_idx` (`author_id`)');

DROP PROCEDURE IF EXISTS add_hf_analysis_column_if_missing;
DROP PROCEDURE IF EXISTS add_hf_analysis_index_if_missing;

INSERT INTO hf_authors
  (slug, full_name, title, bio, expertise, credentials, avatar_url, social_links, email, is_active, display_order)
VALUES
  ('haldefiyat-veri-ekibi', 'HaldeFiyat Veri Ekibi', 'Veri ve Piyasa Analizi Ekibi',
   'HaldeFiyat veri ekibi, Türkiye toptancı hal fiyatlarını günlük ETL akışı, fiyat geçmişi ve bölgesel karşılaştırmalarla analiz eder.',
   JSON_ARRAY('hal fiyatları', 'piyasa analizi', 'veri analizi'),
   'Türkiye geneli hal fiyat verisi ve haftalık piyasa raporlaması',
   NULL, JSON_OBJECT(), NULL, 1, 10),
  ('atakan-kaya', 'Atakan Kaya', 'Ziraat Mühendisi',
   'Sebze ve meyve tedarik zinciri, sera üretimi ve bölgesel fiyat oluşumu üzerine çalışan pilot editoryal yazar profili.',
   JSON_ARRAY('sera üretimi', 'sebze fiyatları', 'tedarik zinciri'),
   'Pilot yazar profili; gerçek yazar bilgileri onaylandığında güncellenecek',
   NULL, JSON_OBJECT(), NULL, 1, 20),
  ('elif-demir', 'Elif Demir', 'Tarım Ekonomisi Uzmanı',
   'Tarım piyasalarında arz-talep dengesi, üretici-tüketici fiyat makası ve haftalık fiyat hareketleri üzerine analizler hazırlar.',
   JSON_ARRAY('tarım ekonomisi', 'fiyat makası', 'piyasa izleme'),
   'Pilot yazar profili; gerçek yazar bilgileri onaylandığında güncellenecek',
   NULL, JSON_OBJECT(), NULL, 1, 30),
  ('mehmet-arslan', 'Mehmet Arslan', 'Hal Piyasaları Analisti',
   'Büyükşehir halleri, lojistik maliyetleri ve bölgesel fiyat ayrışmaları alanında editoryal analizler üretir.',
   JSON_ARRAY('hal piyasaları', 'lojistik', 'bölgesel fiyatlar'),
   'Pilot yazar profili; gerçek yazar bilgileri onaylandığında güncellenecek',
   NULL, JSON_OBJECT(), NULL, 1, 40),
  ('zeynep-celik', 'Zeynep Çelik', 'Gıda Tedarik Zinciri Danışmanı',
   'Yaş meyve-sebze tedarik zinciri, sezon geçişleri ve perakende fiyat etkileri üzerine değerlendirmeler yapar.',
   JSON_ARRAY('gıda tedarik zinciri', 'sezon analizi', 'perakende fiyatları'),
   'Pilot yazar profili; gerçek yazar bilgileri onaylandığında güncellenecek',
   NULL, JSON_OBJECT(), NULL, 1, 50)
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  title = VALUES(title),
  bio = VALUES(bio),
  expertise = VALUES(expertise),
  credentials = VALUES(credentials),
  avatar_url = VALUES(avatar_url),
  social_links = VALUES(social_links),
  email = VALUES(email),
  is_active = VALUES(is_active),
  display_order = VALUES(display_order);
