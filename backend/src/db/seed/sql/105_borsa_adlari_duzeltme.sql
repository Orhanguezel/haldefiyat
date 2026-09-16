SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- TOBB borsa adlari kaynaktan BUYUK HARF ve cogu zaman Turkce harfsiz geliyor
-- ("ESKISEHIR TICARET BORSASI", "AYDIN"). Bu ad hem sayfa basliginda hem sehir
-- filtresinde gorunuyordu: "ADANA Hal Fiyatlari" gibi basliklar ve karisik
-- sehir listesi (17 Eyl 2026 dis degerlendirmesinde "guven dusuruyor" diye
-- isaretlendi). Resmi yazima cevrilir.
--
-- Ilce borsalarinda city_name ILCE degil BAGLI IL olur: Bandirma -> Balikesir,
-- Biga -> Canakkale, Bafra -> Samsun, Nazilli -> Aydin, Ilgin/Karapinar/Eregli/
-- Aksehir -> Konya, Sungurlu -> Corum. Sehir filtresi il bazinda calisir; ilce
-- adi yazildiginda o borsa hicbir il grubuna dusmuyordu.
--
-- Turkce I sorunu: "NAZILLI" -> tr-lower -> "nazilli" degil "nazilli" belirsiz;
-- bu yuzden otomatik title-case DEGIL, acik liste kullanilir.

UPDATE `hf_markets` SET `name` = 'Adana Ticaret Borsası', `city_name` = 'Adana' WHERE `slug` = 'adana-ticaret-borsasi';
UPDATE `hf_markets` SET `name` = 'Akşehir Ticaret Borsası', `city_name` = 'Konya' WHERE `slug` = 'aksehir-ticaret-borsasi';
UPDATE `hf_markets` SET `name` = 'Alaca Ticaret Borsası', `city_name` = 'Çorum' WHERE `slug` = 'alaca-ticaret-borsasi';
UPDATE `hf_markets` SET `name` = 'Aydın Ticaret Borsası', `city_name` = 'Aydın' WHERE `slug` = 'aydin-ticaret-borsasi';
UPDATE `hf_markets` SET `name` = 'Bafra Ticaret Borsası', `city_name` = 'Samsun' WHERE `slug` = 'bafra-ticaret-borsasi';
UPDATE `hf_markets` SET `name` = 'Bandırma Ticaret Borsası', `city_name` = 'Balıkesir' WHERE `slug` = 'bandirma-ticaret-borsasi';
UPDATE `hf_markets` SET `name` = 'Biga Ticaret Borsası', `city_name` = 'Çanakkale' WHERE `slug` = 'biga-ticaret-borsasi';
UPDATE `hf_markets` SET `name` = 'Çorum Ticaret Borsası', `city_name` = 'Çorum' WHERE `slug` = 'corum-ticaret-borsasi';
UPDATE `hf_markets` SET `name` = 'Edirne Ticaret Borsası', `city_name` = 'Edirne' WHERE `slug` = 'edirne-ticaret-borsasi';
UPDATE `hf_markets` SET `name` = 'Ereğli Ticaret Borsası', `city_name` = 'Konya' WHERE `slug` = 'eregli-konya-ticaret-borsasi';
UPDATE `hf_markets` SET `name` = 'Erzurum Ticaret Borsası', `city_name` = 'Erzurum' WHERE `slug` = 'erzurum-ticaret-borsasi';
UPDATE `hf_markets` SET `name` = 'Eskişehir Ticaret Borsası', `city_name` = 'Eskişehir' WHERE `slug` = 'eskisehir-ticaret-borsasi';
UPDATE `hf_markets` SET `name` = 'Gaziantep Ticaret Borsası', `city_name` = 'Gaziantep' WHERE `slug` = 'gaziantep-ticaret-borsasi';
UPDATE `hf_markets` SET `name` = 'Ilgın Ticaret Borsası', `city_name` = 'Konya' WHERE `slug` = 'ilgin-ticaret-borsasi';
UPDATE `hf_markets` SET `name` = 'Karaman Ticaret Borsası', `city_name` = 'Karaman' WHERE `slug` = 'karaman-ticaret-borsasi';
UPDATE `hf_markets` SET `name` = 'Karapınar Ticaret Borsası', `city_name` = 'Konya' WHERE `slug` = 'karapinar-konya-ticaret-borsasi';
UPDATE `hf_markets` SET `name` = 'Konya Ticaret Borsası', `city_name` = 'Konya' WHERE `slug` = 'konya-ticaret-borsasi';
UPDATE `hf_markets` SET `name` = 'Kütahya Ticaret Borsası', `city_name` = 'Kütahya' WHERE `slug` = 'kutahya-ticaret-borsasi';
UPDATE `hf_markets` SET `name` = 'Nazilli Ticaret Borsası', `city_name` = 'Aydın' WHERE `slug` = 'nazilli-ticaret-borsasi';
UPDATE `hf_markets` SET `name` = 'Nevşehir Ticaret Borsası', `city_name` = 'Nevşehir' WHERE `slug` = 'nevsehir-ticaret-borsasi';
UPDATE `hf_markets` SET `name` = 'Ordu Ticaret Borsası', `city_name` = 'Ordu' WHERE `slug` = 'ordu-ticaret-borsasi';
UPDATE `hf_markets` SET `name` = 'Sungurlu Ticaret Borsası', `city_name` = 'Çorum' WHERE `slug` = 'sungurlu-ticaret-borsasi';
UPDATE `hf_markets` SET `name` = 'Uzunköprü Ticaret Borsası', `city_name` = 'Edirne' WHERE `slug` = 'uzunkopru-ticaret-borsasi';
