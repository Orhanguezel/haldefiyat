-- CTA huni olcumu — bulten formlarinin gosterim/etkilesim/donusum verisi.
--
-- Neden gerekli: 6-19 Temmuz 2026 trafik raporunda "anasayfa CTA'si oncelikli" yazmistik.
-- Kod kontrol edilince CTA'larin ZATEN yerinde oldugu goruldu (mobil hero sticky,
-- /fiyatlar seridi, anasayfa alti, canli fiyat). Buna ragmen ~900 engaged pageview/gun'e
-- karsilik toplam 11 abone var.
--
-- Yani sorun yerlesim degil donusum orani. Ama donusum orani OLCULEMIYORDU:
--   - Sitede yalnizca Google Ads etiketi (AW-...) yuklu, GA4 yok.
--   - `trackConversion` sadece BASARILI kayitta atesleniyor; kac kisinin CTA'yi
--     gordugu, kacinin yazmaya basladigi hic bilinmiyordu.
--   - Kampanya durduruldugu icin Ads arayuzu organik trafik icin de bir sey vermiyor.
--
-- Bu tablo huninin dort adimini birinci taraf olarak tutar:
--   impression -> focus -> submit -> success
-- Boylece "metin/teklif testi" bir tahmin degil olcum haline gelir.
--
-- Gizlilik: kisi kimligi saklanmaz. `visitor_hash` IP+UA+GUNLUK tuzdan turetilir,
-- gun degisince ayni ziyaretci farkli hash alir — tekil sayim icin yeterli, kalici
-- takip icin degil.

CREATE TABLE IF NOT EXISTS hf_cta_events (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  placement    VARCHAR(48)  NOT NULL,
  event        VARCHAR(16)  NOT NULL,
  path         VARCHAR(255) NOT NULL DEFAULT '/',
  device       VARCHAR(8)   NOT NULL DEFAULT 'desktop',
  visitor_hash CHAR(16)     NOT NULL DEFAULT '',
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY hf_cta_events_day_idx (created_at, placement, event),
  KEY hf_cta_events_placement_idx (placement, event)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
