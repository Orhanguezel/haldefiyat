# Yasal ve Kurumsal Sayfalar Kabul Kaydı — 2026-08-14

## Kapsam

- `LegalPageContent` ve `TransparencyPolicyPage` ortak politika şablonu
- KVKK, gizlilik, kullanım, düzeltme, editoryal, veri kaynağı ve sahiplik politikaları
- `/iletisim` formu, spam tuzağı ve açık kişisel veri onayı
- `/hakkimizda`, `/iletisim` ve `/sahiplik-finansman` kurumsal kayıt tutarlılığı

## Uygulama sonucu

- Politika sayfaları Temiz Veri temasının yüzey, sınır, radius, tipografi ve renk tokenlarına geçirildi.
- CMS içeriği sanitize edildikten sonra `h2`/`h3` başlıklarından Türkçe karakterleri destekleyen, kararlı ve çakışmasız anchor kimlikleri üretiliyor.
- En az iki alt başlığı olan uzun metinlere masaüstünde sticky içindekiler eklendi; aktif politika bağlantısı `aria-current=page` ile işaretleniyor.
- Geçerli CMS tarihi Türkçe “Son güncelleme” alanında gösteriliyor. Print görünümünde içerik tablosu ve politika navigasyonu gizleniyor, makale sınırı kaldırılıyor.
- Ortak politika navigasyonu metodoloji, veri kaynağı, editoryal, düzeltme, KVKK, gizlilik, kullanım, API ve sahiplik sayfalarını birbirine bağlıyor.
- Sahiplik sayfasındaki güncel kurumsal kayıt ile Hakkımızda ve İletişim yüzeyleri aynı `site_settings` kaynağından besleniyor; boş değer durumunda kontrollü kurumsal fallback kullanılıyor.
- İletişim formu ham backend hatasını göstermiyor; 400, 429 ve servis hatalarını güvenli Türkçe durumlara eşliyor. Başarı metni yanıt süresi garantisi vermiyor.
- Form başarı alanı `role=status`, hata alanı `role=alert`; durum değiştiğinde odak ilgili alana taşınıyor. Bekleme durumu form ve butonda erişilebilir biçimde yayınlanıyor.
- KVKK ve Gizlilik Politikası bağlantılı açık onay kutusu istemcide zorunlu. İstemci `privacyAccepted: true` gönderiyor; backend yalnız gerçek boolean `true` kabul ediyor.
- Honeypot form kontrolü gönderime dahil kalırken görsel ve erişilebilirlik ağacından gizli, odak sırasından çıkarılmış ve autocomplete kapalı.

## Otomatik doğrulama

- Backend: 29 dosyada 121 test ve 272 assertion geçti; TypeScript ve production build başarılı.
- Frontend: 34 dosyada 90 test geçti; TypeScript, ESLint ve production build başarılı.
- `prepareLegalDocument` sanitize, Türkçe slug ve tekrar eden başlıklarda benzersiz anchor üretimini test ediyor.
- `ContactForm` testleri açık onayın boolean gönderildiğini, güvenli başarı metnini ve ham sunucu hatasının sızmadığını doğruluyor.
- Backend onay testi string/false/eksik değerleri reddedip yalnız boolean `true` değerini kabul ediyor.

## Canlı kabul

- Uygulama commitleri: `38a69e57`, `080231c4`, `90aa8b12`.
- Frontend release: `.next-release-90aa8b12`; backend ve frontend PM2 süreçleri online, unstable restart `0`.
- `/iletisim`, `/kvkk`, `/gizlilik-politikasi`, `/kullanim-kosullari`, `/duzeltme-politikasi`, `/editoryal-politika`, `/veri-kaynagi-politikasi`, `/sahiplik-finansman` ve `/hakkimizda` canlıda `200` döndü.
- Politika sayfalarında tek H1 ve tek canonical doğrulandı. Uzun politika içeriğinde içindekiler, anchor kimlikleri, son güncelleme ve aktif politika bağlantısı canlı DOM'da mevcut; yinelenen kimlik yok.
- Politika navigasyonundaki dokuz hedefin tamamı canlı ve aynı ortak navigasyonda görünür.
- 390x844 iletişim ve sahiplik ekranlarında yatay taşma `0`, konsol hata sayısı `0`.
- İletişim formunda zorunlu onay, `/kvkk` ve `/gizlilik-politikasi` bağlantıları görünür; honeypot erişilebilirlik snapshot'ında bulunmuyor.
- Print media kabulünde içindekiler ve politika navigasyonu `display:none`, makale sınırı `0px`.
- Açık onaysız canlı POST `400 privacy_consent_required`; onaylı fakat eksik POST şema kapısında `400 INVALID_BODY`. Geçerli mesaj gönderilmedi; kayıt, e-posta veya Telegram bildirimi üretilmedi.
- Canlı `site_settings` değerleri: `GZL Teknoloji`, `Atakan Şahin`, `Orhan Güzel`, `iletisim@haldefiyat.com`; sahiplik kartı aynı dört değeri gösteriyor.
- Deploy sırasında sunucudaki Tanıtio/ETL/route/frontend WIP değişiklikleri korundu.

## Görsel kanıtlar

- `output/playwright/theme-clean-data/legal-contact-mobile-2026-08-14.png`
- `output/playwright/theme-clean-data/legal-ownership-mobile-2026-08-14.png`
