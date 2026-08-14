# Auth ve Kullanıcı Dashboard Kabul Kaydı — 2026-08-14

## Kapsam

- `/giris`, `/kayit` ve oturum koruma/yönlendirme durumları
- İlan telefonu için OTP gönderme, bekleme, yeniden gönderme ve doğrulama arayüzü
- `/hesabim` kabuğu, desktop sidebar ve mobil hesap navigasyonu
- Hesap özeti, profil, güvenlik, favori, uyarı, bildirim ve ilan boş/durum yüzeyleri
- `/hesabim/arama-talepleri` gelen kutusu ve iletişim özeti
- `/hesabim/ilanlarim` talep sayısı ve ilan bazlı iletişim tercihleri
- Public/yetkili veri sınırları

## Uygulama sonucu

- Giriş/kayıt paneli Temiz Veri temasının yüzey, sınır, radius ve tipografi diline geçirildi; koyu promosyon bloğu ve etkinleşmemiş OneSignal iddiası kaldırıldı.
- Güven mesajları parola istememe, public telefon sınırı ve kullanıcının yönetebildiği gerçek hesap işlevleriyle sınırlandı.
- Auth API hatası `role=alert` ve `aria-live` ile duyuruluyor; hata oluştuğunda odak doğrudan hata alanına taşınıyor. Form bekleme durumu `aria-busy` olarak yayınlanıyor.
- AuthGuard oturum kontrolünü görünür `role=status` ile gösteriyor ve giriş yönlendirmesinde kullanıcının hedef dashboard yolunu `next` parametresinde koruyor.
- İlan formuna gerçek `/listings/otp/send` ve `/listings/otp/verify` endpoint'lerini kullanan telefon doğrulama bileşeni eklendi. Gönderme, altı haneli kod, 60 saniye bekleme, yeniden gönderme, hata, süre/deneme sınırı ve doğrulandı durumları erişilebilir canlı bölgede sunuluyor.
- Dashboard mobil navigasyonu, public mobil alt barla çakışan ikinci fixed-bottom bardan çıkarıldı; 44 px hedefli, yatay kaydırılabilir yerel hesap navigasyonuna dönüştürüldü. Genel Bakış alt sayfalarda yanlışlıkla aktif görünmüyor.
- Sidebar ve mobil navigasyona `İlanlarım` ile `Arama Talepleri` eklendi; aktif yol `aria-current=page` ile işaretleniyor.
- Hesap özeti ilan ve açık arama talebi sayılarını mevcut yetkili API'lerden alıyor. Uyarı, favori, bildirim, ilan ve arama talebi boş durumları ortak açıklayıcı bileşene geçirildi.
- Arama talepleri gelen/gönderilen filtreleri, durum aksiyonları ve yalnız maskeli telefon/e-posta doğrulama özetiyle ayrı gelen kutusunda sunuluyor.
- İlanlarım her ilan için moderasyon durumu, toplam/açık talep sayısı, talep kabul anahtarı ve uygun geri dönüş saatlerini gösteriyor.
- İletişim ayarı için ayrı sahiplik kontrollü `/listings/:id/call-settings` endpoint'i eklendi. Bu endpoint yalnız iletişim alanlarını güncelliyor; içerik değişikliği olmadığı için ilanı yanlışlıkla `pending` durumuna çekmiyor.
- Browser API hata ayrıştırması hem `{error:{message}}` hem `{error:"code"}` sözleşmelerini destekliyor; OTP rate-limit ve servis hataları doğru kullanıcı mesajına dönüşüyor.

## Otomatik doğrulama

- Backend: 28 dosya, 120 test ve 267 assertion geçti; TypeScript ve production build başarılı.
- Frontend: 32 dosya ve 87 test geçti; TypeScript ve production build başarılı.
- ESLint 0 hata ile geçti; kapsam dışı mevcut uyarılar dışında yeni hata oluşmadı.
- `listingCallSettingsSchema`, boş/uygunsuz saat listesini reddeden regresyon testiyle kapsandı.
- `PhoneOtpVerification` gönderim, 60 saniye bekleme, doğrulama ve token teslimini UI testiyle kapsıyor.
- Mevcut public ilan redaksiyon testleri sahip adı, telefon, e-posta, raw veri ve bilinmeyen uygunluk slotlarının public DTO'ya sızmadığını doğruluyor.

## Canlı kabul

- Commit/release: `4a7fe5de` (`.next-release-4a7fe5de1ac6`).
- `/giris` ve `/kayit` 390x844 görünümünde tek H1 ve sıfır yatay taşma; güven metni görünür, kaldırılan OneSignal iddiası yok, hesap tipi seçimi `aria-pressed` ile doğrulandı.
- Kalıcı kayıt oluşturmayan hatalı giriş denemesi doğru Türkçe mesajı gösterdi ve odak `role=alert` alanına taşındı.
- Oturumsuz `/hesabim/arama-talepleri` ziyareti `/giris?next=%2Fhesabim%2Farama-talepleri` yoluna yönlendi.
- Canlı frontend, yalnız tarayıcı ağı içinde sahte kullanıcı/listing cevaplarıyla ve kalıcı veri oluşturmadan test edildi: mobil dashboard navigasyonu, hesap sayaçları, gelen/gönderilen talep filtreleri, maskeli telefon, ilan durumu, `2 toplam · 2 açık` özeti ve iletişim ayarları render edildi; üç ekranda yatay taşma ve konsol hatası yoktu.
- OTP yüzeyi canlı `/ilan-ver` sayfasında, yalnız tarayıcı ağı içinde oturum cevabı taklit edilerek doğrulandı; profil telefonu doğru doldu, `Kod gönder` kullanılabilir ve yatay taşma/konsol hatası yoktu. Gerçek SMS gönderilmedi ve test hesabı oluşturulmadı.
- Yeni call-settings endpoint'i ile `/listings/me`, `/listings/call-requests/me` ve contact-summary endpoint'leri oturumsuz isteği canlıda `401` ile reddediyor.
- Public ilan cevabında `contactPhone:null`, `raw:null`; `buyerUserId`, `sellerUserId`, `ownerUserId` ve admin alanları bulunmuyor.
- Backend ve frontend sağlık kontrolleri `200`; iki PM2 süreci online ve unstable restart `0`.
- Sunucudaki Tanıtio/ETL/route/frontend WIP değişiklikleri korundu.

## Görsel kanıtlar

- `output/playwright/theme-clean-data/auth-login-error-mobile-2026-08-14.png`
- `output/playwright/theme-clean-data/auth-register-mobile-2026-08-14.png`
- `output/playwright/theme-clean-data/dashboard-overview-mobile-2026-08-14.png`
- `output/playwright/theme-clean-data/dashboard-call-requests-mobile-2026-08-14.png`
- `output/playwright/theme-clean-data/dashboard-listings-mobile-2026-08-14.png`
- `output/playwright/theme-clean-data/listing-otp-mobile-2026-08-14.png`
