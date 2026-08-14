# Firma Rehberi ve Firma Detayı Kabul Kaydı — 2026-08-14

## Kapsam

- `/firmalar` ana dizini
- `/firmalar/[şehir]`, `/firmalar/[tür]` ve `/firmalar/[şehir]/[tür]` hub'ları
- `/firma/[slug]` tekil firma profili
- Firma iletişim, lead, sahiplenme ve firma ekleme sözleşmeleri
- `/firma` ile `/firmalar` SEO rol ayrımı

## Uygulama sonucu

- Firma liste, şehir/tür hub ve ilgili firma blokları aynı `FirmCard` bileşenini kullanıyor.
- Kartlar firma türü, Türkçe konum, sınırlı anlamıyla doğrulama ve tek `Firmayı incele` aksiyonuna indirildi; telefon kart yüzeyinden çıkarıldı.
- Sponsorlu durum doğrulanmış firma durumundan ayrı gösteriliyor.
- Detay sayfasındaki telefon ve OCR iletişimleri, ilanlardaki özel satıcı telefonundan ayrı bir ticari iletişim politikasıyla açıklandı.
- Telefon, WhatsApp, harita ve form dönüşümleri mevcut reklam ölçüm altyapısını kullanmaya devam ediyor.
- Lead API'si açık gizlilik onayı, gerçek bir iletişim kanalı ve seçilen dönüş kanalının karşılığını zorunlu tutuyor; saatte 10 istek IP sınırı uyguluyor.
- Sahiplenme API'si yetki beyanı ile gizlilik onayı olmadan talep kabul etmiyor.
- Firma ekleme akışında ticari telefon yayın onayı hem istemci hem API sınırında zorunlu.
- Lead, sahiplenme ve firma ekleme akışları ortak `FirmFormHeader`, `Input`, `TextArea` ve `Button` tasarım parçalarına geçirildi.
- `/firma` kalıcı 308 ile `/firmalar`a yönleniyor. Çoğul yol dizin/hub, tekil `/firma/[slug]` ise profil rolünde.

## Otomatik doğrulama

- Backend: `JWT_SECRET=... COOKIE_SECRET=... bun test --max-concurrency=1` — 28 dosya, 119 test, 264 assertion geçti.
- Backend TypeScript ve production build geçti.
- Frontend: 29 dosya, 84 test geçti.
- Frontend TypeScript, ESLint (0 hata; kapsam dışı mevcut uyarılar) ve Next production build geçti.
- Yeni sözleşme testleri:
  - `backend/test/firm-contact-validation.test.ts`
  - `frontend/src/components/firms/FirmCard.test.tsx`
  - `frontend/src/components/firms/FirmContactPolicy.test.tsx`

## Canlı kabul

- Commit/release: `18cf68b2` (`.next-release-18cf68b2fae9`)
- Canlı firma toplamı: 1.335.
- `/firmalar` 390x844: tek H1, 48 profil bağlantısı, doğrulama etiketi, `q/city/type` filtre sözleşmesi ve sıfır yatay taşma.
- `/firma/156-acar-kardesler-komisyon-evi` 390x844: tek H1, firma iletişim politikası, telefon/WhatsApp, sahiplenme ve lead bölümleri, zorunlu gizlilik checkbox'ı, dönüş kanalı seçimi ve sıfır yatay taşma.
- Aynı profil 1280x900: tek H1, birincil telefon aksiyonu, politika ve formlar görünür; sıfır yatay taşma.
- Tarayıcı konsolunda hata/uyarı yok.
- Gizlilik onayı bulunmayan ve iletişim kanalı bulunmayan iki ayrı lead isteği canlı API'de `400` ile reddedildi; kalıcı test verisi oluşturulmadı.
- `/firma` canlıda `308 Location: /firmalar` döndürüyor.
- `/firmalar`, `/firmalar/adana`, `/firmalar/adana/komisyoncu` ve tekil profil kendi ayrı canonical URL'lerini döndürüyor.
- Backend ve frontend sağlık kontrolleri `200`; iki PM2 süreci online, unstable restart `0`.

## Görsel kanıtlar

- `output/playwright/theme-clean-data/firmalar-liste-mobile-2026-08-14.png`
- `output/playwright/theme-clean-data/firma-detay-mobile-2026-08-14.png`
- `output/playwright/theme-clean-data/firma-detay-desktop-2026-08-14.png`
