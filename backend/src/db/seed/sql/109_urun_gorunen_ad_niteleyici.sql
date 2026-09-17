SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- Kalite/sinif varyantlarinin GORUNEN ADI niteleyicisini kaybetmis.
--
-- hf_products.name_tr "Domates (1.sinif)" derken display_name yalnizca "Domates"
-- yaziyordu. Sonuc: /urun/domates cesit tablosunda ayni adla dort satir farkli
-- fiyatla goruntuleniyordu (Domates 62,86 / Domates 45,00 / Domates …) ve
-- okuyucu hangisinin ne oldugunu anlayamiyordu. 17 Eyl 2026 AI gorunurluk
-- raporundaki "cesit duzeyindeki celiski" bulgusunun bizden kaynaklanan yarisi.
--
-- Bu dosya YALNIZ gorunen adi duzeltir; kayitlari BIRLESTIRMEZ. Sinif/kalite
-- varyanti gercekten ayri urundur (1. sinif domates ile 2. sinif ayni fiyat
-- degildir) — birlestirmek veriyi bozardi.
--
-- Ayri is olarak duran GERCEK dublikeler (ayni urunun iki yazimi: salk-domates /
-- salkim-domates, a-marul / marul-aysberg, dil / dil-baligi gibi) burada DEGIL;
-- onlar /admin/hal/products/absorb ile tek tek, cakisma kontrolunden gecirilerek
-- yutulur.

UPDATE `hf_products` SET `display_name` = 'Domates (1. Sınıf)'        WHERE `slug` = 'domates-1-sinif';
UPDATE `hf_products` SET `display_name` = 'Domates (2. Sınıf)'        WHERE `slug` = 'domates-2-sinif';
UPDATE `hf_products` SET `display_name` = 'Domates (3. Sınıf)'        WHERE `slug` = 'domates-3-sinif';
UPDATE `hf_products` SET `display_name` = 'Domates (II. Kalite)'      WHERE `slug` = 'domates-ii';
UPDATE `hf_products` SET `display_name` = 'Patates (II. Kalite)'      WHERE `slug` = 'patates-ii';
UPDATE `hf_products` SET `display_name` = 'Karpuz (II. Kalite)'       WHERE `slug` = 'karpuz-ii';
UPDATE `hf_products` SET `display_name` = 'Kiraz (II. Kalite)'        WHERE `slug` = 'kiraz-ii';
UPDATE `hf_products` SET `display_name` = 'Erik Can (II. Kalite)'     WHERE `slug` = 'erik-can-ii';
UPDATE `hf_products` SET `display_name` = 'Soğan Kuru (II. Kalite)'   WHERE `slug` = 'sogan-kuru-ii';
UPDATE `hf_products` SET `display_name` = 'Soğan Kuru Taze (II. Kalite)' WHERE `slug` = 'sogan-kuru-taze-ii';
UPDATE `hf_products` SET `display_name` = 'Havuç (I. Kalite)'         WHERE `slug` = 'havuc-i';
UPDATE `hf_products` SET `display_name` = 'Kayısı (I. Kalite)'        WHERE `slug` = 'kayisi-i';
UPDATE `hf_products` SET `display_name` = 'Patlıcan (I. Kalite)'      WHERE `slug` = 'patlican-i';
UPDATE `hf_products` SET `display_name` = 'Salatalık (I. Kalite)'     WHERE `slug` = 'salatalik-i';
UPDATE `hf_products` SET `display_name` = 'Elma (Diğer)'              WHERE `slug` = 'elma-diger';
UPDATE `hf_products` SET `display_name` = 'Limon Yatak (Sn.)'         WHERE `slug` = 'limon-yatak-sn';

-- Ambalaj/birim varyantlari: birim sutunu zaten farki gosteriyor ama cesit
-- tablosunda iki satir ayni adla gorundugu icin ad da tasisin.
UPDATE `hf_products` SET `display_name` = 'Dere Otu (Bağ)'            WHERE `slug` = 'dere-otu-bag';
UPDATE `hf_products` SET `display_name` = 'Semizotu (Bağ)'            WHERE `slug` = 'semizotu-bag';
UPDATE `hf_products` SET `display_name` = 'Tere (Bağ)'                WHERE `slug` = 'tere-bag';
UPDATE `hf_products` SET `display_name` = 'Marul Düz (Adet)'          WHERE `slug` = 'marul-duz-adet';
