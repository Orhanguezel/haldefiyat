# Sosyal kartlar ve sponsor reklamları — 8 Eylül 2026

## Değişiklik

- Telegram: canlı social_telegram ayarındaki https://t.me/haldefiyat bağlantısı ana sayfa ve footer takip kartlarına eklendi.
- WhatsApp, Facebook ve Telegram kartlarında özgün HaldeFiyat logo dosyası ve 64 px alan içinde 40 px platform işaretleri kullanıldı. Facebook çizgi ikon yerine dolu f işaretine geçti. Kartlar geniş ekranda üç sütun, mobilde tek sütun.
- VistaSeeds ve Bereket Fide aynı SeedSponsorBanner bileşeniyle çiziliyor. Aynı yerleşim genişliğinde eşit kart ve medya ölçüleri var. Masaüstünde yatay 240 px yükseklik; mobil/kenar sütununda dikey 400 px yükseklik ve 160 px medya alanı. Farklı sayfa kapsayıcılarının genişlikleri doğal olarak değişebilir.
- VistaSeeds özel animasyonlu renderer istisnaları ortak düzenle değiştirildi; CANKAN F1 fotoğrafı kırpılmadan gösteriliyor. Mevcut tıklama yönlendirmesi, sponsor etiketi, device görünürlüğü korunuyor.
- Bereket Fide 13 ve 15 numaralı reklamlarda kırpılan yazılı marka karesi yerine mevcut fide serası fotoğrafı kullanılıyor. Logo ayrı alanda.
- 16 numaralı genel reklamın belirli bir ürünü ima eden başlığı “Sebze fidesi için Bereket Fide” oldu. Eski metin kalırsa renderer da aynı genel ifadeyi kullanıyor. Görsel belirli bir ürün çeşidi/stoğu iddiası taşımıyor.
- Veritabanı düzeltmeleri yalnız beklenen eski değerlerle eşleşen kayıtlara uygulanır. Önce/sonra kayıtları caption.json ve images.json içinde.

## Kontroller

- TypeScript geçti. BannerVisual: 8 test geçti; genel başlık, ürün görseli, link korunması ve mevcut dayanıklılık testleri.
- Yerel tarayıcı fiyat sayfasında aynı satırdaki iki sponsor: masaüstü 552×240, mobil 326×400. Her iki fotoğraf ve logo yüklendi.
- Üç sosyal kanalın hedefleri ve HaldeFiyat logolarının yüklendiği tarayıcıda doğrulandı.
- Önizlemeler output/playwright/banner-consistency/ altında prices-desktop.png, prices-mobile.png, social-desktop.png.
- Kod commit 4be2cc17ee6a; canlı dağıtım tamamlandı. Nginx dağıtım penceresinde 5xx = 0; health status/db = ok.
- Canlı /fiyatlar: iki sponsor da 552×240 masaüstü, 326×400 mobil; medya 160 px mobil. Fotoğraflar ve logolar yüklenmiş durumda.
- Canlı /urun/limon: yeni genel başlık mevcut, eski başlık 0 eşleşme; yatay taşma yok. Tarayıcıda 0 hata, mevcut font preload uyarıları sürüyor.
- Canlı sosyal kartlarda üç hedef bağlantı ve üç HaldeFiyat logosunun naturalWidth=1230 olduğu doğrulandı.
- Canlı kanıtlar: live-desktop.txt, live-mobile.txt; output/playwright/banner-consistency/live-ads-desktop.png, live-ads-mobile.png, live-social-desktop.png.

Hiçbir sosyal gönderi yayımlanmadı veya reklam bütçesi değiştirilmedi.
