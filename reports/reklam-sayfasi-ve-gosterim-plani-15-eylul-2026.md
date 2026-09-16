# Reklam sayfası ve gösterim planı — 15 Eylül 2026

## Görsel sorun ve düzeltme

Hero açık temada açık arka plan ile sabit beyaz başlık/açıklama kullanıyordu. Başlığın yalnız yeşil kısmı görünüyordu. Tema renklerine bağlı, daha kısa, iki sütunlu bir hero hazırlandı. Teklif ve medya kiti düğmeleri görünür; reklamveren paneli bağlantısı korundu. Kullanıcıya dönük metinlerde iç operasyon dili sadeleştirildi.

## Kamuya açık metrik kararı

Google Search Console Web API'den, boyutsuz mülk toplamıyla ve kesinleşmiş veriyle doğrulanan dönem:

- 16 Ağustos–12 Eylül 2026: 28 gün.
- 544.693 Google Arama gösterimi.
- 17.575 Google Arama tıklaması.

Bunlar “Google’daki görünürlüğümüz” başlığı, açık tarih aralığı ve kaynakla gösterilir. Aylık toplam site trafiği, tekil kullanıcı, reklam erişimi veya banner garantisi olarak kullanılmaz. Verinin bitiş tarihi 35 günden eski olduğunda sayı kartı gizlenir; yayınlanan snapshot otomatik Google sorgusu değildir ve dönemsel yenilenmelidir.

Tanımlar: [Google Search Console performans raporu](https://support.google.com/webmasters/answer/7576553?hl=tr). Aynı sayfada kapsam verileri (ürün, hal/veri noktası, il) ziyaretçi metriği olarak sunulmaz.

## Reklam ölçümünün mevcut durumu

Aynı 28 günde veritabanı reklam sayaçları: 138.450 sunum kaydı, 127 tıklama. Toplamın 100.200'ü (%72,4) global_footer alanında; bu alanda 49 tıklama var. Ürün alanında 8.840 sunum / 7 tıklama; fiyatlar üst şeridinde 2.346 / 12. Alanların trafiği ve kampanya bileşimi farklı; bu oranlar tek başına nedensel karşılaştırma değildir.

Kod incelemesi: `/banners` ve `/banners/grid` yanıtında impression kaydı artırılıyor. Bu, reklamın ekranda görünür kaldığını kanıtlamaz. Bu yüzden 138.450 sayısı reklamveren sayfasına görülen banner/erişim iddiasıyla konmadı.

Hesap sayfasının doğrudan GZL bileşeni kampanya envanteri sayacını kullanmıyor. GZL #18'in 130 gösterim / 0 tıklama kümülatif değeri yalnız mevcut kampanya yerleşimine ait; hesabım gösterimleri buna dahil kabul edilmemeli.

## Uygulanan görünürlük adımı

Ürün ve şehir–ürün fiyat sayfalarında mevcut reklam alanı, fiyat özetinden sonra ve uzun grafikten önceye alındı. Alan sayısı artırılmadı. Ücretli footer kampanyaları başka konuma taşınmadı. Bunun görünürlük/tıklama artışı sağladığı henüz ölçülmüş değildir.

## Sonraki ölçülebilir adımlar

1. Sunum sayısını koruyarak ayrı görünür reklam olayı ölç: ekran kesişimi ve görünür kalma süresi, bot/önizleme filtresi, tekrar engeli. Geçmiş sunum serisini sessizce farklı tanımla birleştirme.
2. Sonraki 7 ve 14 günde cihaz ve alan bazında sunum, görünürlük ve tıklamayı karşılaştır. GSC arama gösterimini payda yapma.
3. GZL hesabım tanıtımı için ayrı yerleşim kimliği ve aynı kampanya ölçüm akışını bağla; sayacı artırmak için arka planda reklam isteği gönderme.
4. Fiyat/ürün niyetine uygun, kısa mobil kreatiflerle mevcut üst/ürün alanlarının doluluğunu değerlendir. Otomatik yenileme veya hesap ekranını kaplayan reklamlarla gösterim büyütme.

Kanıtlar: `artifacts/advertise-page-2026-09-15/gsc.json`, `ads.json`, kaynak toplama betikleri. Medya kiti bağlantısı HTTP 200.

## Canlı doğrulama

Frontend sürümü `.next-release-20260915bd01`; derleme ve iki worker yüklemesi tamamlandı. 1440 px masaüstü ve 390 px mobil görseller kontrol edildi; yatay taşma yok. Teklif düğmesi reklam konusu ile iletişim sayfasına gidiyor. Görseller `output/playwright/advertise-page/` altında. Anonim oturum başlangıcındaki 401 yanıtları mevcut oturum kontrolünden kaynaklanıyor.
