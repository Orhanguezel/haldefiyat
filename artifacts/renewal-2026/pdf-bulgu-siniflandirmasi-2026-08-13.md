# PDF Bulguları Canlı Sınıflandırması

**Tarih:** 13 Ağustos 2026

**Kaynak:** `haldefiyat-durum-raporu-v2.pdf` içindeki 12 bulgu; canlı site, API, DB ve kod kanıtıyla çapraz kontrol.

| No | Bulgu | İlk doğrulama | Güncel sınıf | Kanıt / kalan iş |
|---:|---|---|---|---|
| 1 | Koyu/neon varsayılan | Devam ediyor | **Çözüldü (release bekliyor)** | Tema sağlayıcısı açık varsayılana alındı; Temiz Veri kararı ve token geçişi hazır. Canlı görsel kabul release ile yapılacak. |
| 2 | Ana sayfa yoğunluğu | Devam ediyor | **Kısmen** | Mobil SSR ağacı daha hafif; desktop hâlâ çok bölümlü. Yeni ilk ekran fiyat aramasına çevrildi, bölüm sadeleştirme ölçüm sonrası sürecek. |
| 3 | Fiyat görsel hiyerarşisi | Devam ediyor | **Kısmen** | Ürün/birim/kaynak guardları hazır; ortak Temiz Veri token ve hero geçişi başladı. Tüm fiyat kart/tablo yüzeyleri tamamlanmadı. |
| 4 | Emoji kullanımı | Devam ediyor | **Kısmen** | 170 satır envanterlendi; hero erişilebilir metin/nokta diline geçirildi. Kalan ikon sınıflandırması açık. |
| 5 | Bozuk ürün adları | Doğrulandı | **Kritik örnek çözüldü, geniş tarama kısmen** | `Domates (...)` ortak display-name guard ile temiz; `undefined/NaN/raw key` geniş taraması açık. |
| 6 | 546 TL domates | Doğrulandı | **Görünür vaka çözüldü, kök veri bekçisi kısmen** | Hata ham hal fiyatı değil türetilmiş perakende formülüydü; >%200 guard uygulandı. Yayın öncesi karantina genişletilecek. |
| 7 | Invalid Date | Doğrulandı | **Çözüldü** | Ortak tarih parser/fallback, testler ve canlı kabul tamamlandı. |
| 8 | Avakado/avokado ve birim çelişkisi | Doğrulandı | **Çözüldü (kör merge yapılmadı)** | Avokado (Adet/Kg), Maydanoz (Demet/Bağ) ayrıştırıldı; doğru canonical/unit canlı kabul edildi. |
| 9 | Filtrede kopya/yanlış ürünler | Doğrulandı | **Kısmen** | 46 çoklu birim grup envanterlendi; merkezi API etiketi eklendi. Canonical sözlük ve güven skoru Faz 2'de genişletilecek. |
| 10 | Çelişkili sayaçlar | Doğrulandı | **Kısmen** | Overview bazlı `trackedProducts/activeCities/activeMarkets` ana yüzeylerde kullanılıyor; metrik sözlüğü ve tüm tüketici taraması açık. |
| 11 | Sahiplik/finansman eksik | Doğrulandı | **Devam ediyor — dış onay bağımlı** | GZL Teknoloji/Atakan/Orhan rol çerçevesi kayıtlı; adres ve sorumlu yayıncı bilgisi onaysız uydurulmayacak. |
| 12 | Açık ilan telefonu | Doğrulandı | **Çözüldü** | Public DTO/HTML/RSC/API/serbest metin numarasız; `tel:` kaldırıldı; güvenli arama talebi canlı. |

## Sonuç

Yanlış pozitif bulunmadı. Dört bulgu tamamen kapalı (7, 8, 12 ve görünür 6 vakası), beş bulgu kontrollü genişletme aşamasında, tema değişikliği release kabulü bekliyor; yalnız gerçek künye dış bilgi/onay bağımlıdır. Bu sınıflandırma “kod yazıldı = tamam” saymaz; canlı kabul bekleyen tema maddesini açıkça ayırır.
