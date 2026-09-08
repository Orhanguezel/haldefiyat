# Sosyal kanal görünürlüğü — 8 Eylül 2026

## Sorun ve değişiklik

Footer sosyal bağlantıları 16 px, isimsiz ikonlardı. Facebook prop'u layout'tan geçmesine rağmen Footer içinde kullanılmıyordu; canlı site_settings içinde social_facebook da yoktu.

- WhatsApp ve Facebook için ana sayfa içerik akışına ve global footer üstüne iki ayrı takip kartı eklendi.
- Önceki bannerların mesajları canlı HTML metnine aktarıldı. Mobilde raster görsel içindeki yazıyı küçültmek yerine başlık, açıklama ve buton yeniden yerleşiyor. Ek büyük görsel indirmesi yok.
- Yeşil/mavi platform renkleri, belirgin ikonlar, 27–32 px başlıklar ve 48 px CTA kullanıldı. Klavye odağı görünür; bağlantılar yeni sekmede açılır.
- Footer'ın diğer sosyal ikonları isimli, en az 44 px dokunma alanına sahip bağlantılara dönüştürüldü.
- Facebook hedefi Tanitio'daki haldefiyat Facebook hesabının account_id=1093315187207024 kaydından doğrulandı. Site ayarına eksikse ekleyen script set-facebook.ts; mevcut değerleri ezmez.
- Tıklama social_channel_click olayında platform ve placement olarak ölçülür. Açık çerez izni gerekir; abonelik tamamlandı ya da reklam dönüşümü olarak raporlanmaz.

## Doğrulama

- frontend TypeScript kontrolü geçti.
- Playwright 320 ve 390 px mobil, 1440 px masaüstü: yatay taşma yok. Mobil CTA yüksekliği 48 px.
- Her iki hedef URL DOM üzerinde doğrulandı.
- Reddedilen çerez izninde 0 olay; kabulde 1 social_channel_click olayı doğrulandı.
- Yerel taramada üretim API'sinin localhost origin'ine izin vermemesinden kaynaklanan mevcut popup CORS hataları görüldü; canlı kontrol ayrı yapılır.
- Önizlemeler: output/playwright/social-visibility/mobile.png ve desktop.png.
- Kod commit: b5db84e6ea92. Canlı dağıtım tamamlandı; dağıtım penceresinde nginx 5xx = 0. Health status/db = ok.
- Canlı ana sayfada mobil ve masaüstü kartları/URLleri doğrulandı. /fiyatlar footer: 2 kart, yatay taşma yok, yakalanan JavaScript pageerror sayısı 0. Mevcut font preload uyarıları sürüyor.
- Canlı ekran görüntüleri: output/playwright/social-visibility/live-mobile.png ve live-desktop.png; sonuçlar live-mobile.txt, live-desktop.txt, live-prices.txt.

Takipçi artışı henüz ölçülmedi. Tıklama oranı için kart gösterim sayacı bu değişiklikte eklenmedi; yalnız tıklama sayıları ve platformun kendi takipçi verisi kullanılabilir.
