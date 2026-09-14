# Elazığ ve Polatlı ETL hata kontrolü — 14 Eylül 2026

Paylaşılan 8–12 Eylül hata satırları üretim kayıtlarıyla karşılaştırıldı.

- Elazığ: `elazig-hal` kaydı aktif (id 173), kaynak `elazig_resmi` ile eşleşiyor. 12 Eylül 07:30 UTC eksik hal hatasından sonra 10:35 UTC turunda 30 satır yüklenmiş. 13 Eylül 30, 14 Eylül 29 satır yüklenmiş. Son fiyat tarihi 14 Eylül; son 30 günlük kapsamda 89 kayıt var. `Market bulunamadi` sorunu güncel değil.
- Elazığ'ın son `partial` durumu: `Semizotu: PRICE_QUARANTINED:SOURCE_MEDIAN_DEVIATION`. Bu, hal eşleşmesi hatası değildir; tek ürün için veri kalite korumasıdır. Kontrol devre dışı bırakılmadı.
- Polatlı: 10–11 Eylül HTTP 500 geçmiş kaynak yanıtı. 12–13 Eylül HTTP 200 / veri yayımlanmadı kaydı var. 14 Eylül 07:32 UTC turu `ok`, 3 satır yüklenmiş. Son fiyat tarihi 14 Eylül; son 30 günlük kapsamda 35 kayıt var. Mevcut yeniden deneme mekanizması korunuyor.

Eski loglar gerçekleşmiş çalışmaları kaydeder; güncel başarı gelince eski hatalar silinmez. Bu incelemede çalışan kaynak konfigürasyonu veya geçmiş loglar değiştirilmedi.

Kanıt: `artifacts/etl-errors-2026-09-14/before.json`, kaynak yanıtı `polatli-current.json`.
