# API Pro, Bülten ve Reklam Kabul Kaydı — 2026-08-14

## Kapsam

- `/pro`, `/api-docs`, `/api-policy` ve `/abonelik` ürün bilgi mimarisi
- API plan, fiyat, kota, sürüm ve rate-limit sözleşmesi
- API anahtarı oluşturma, listeleme, kota görme ve iptal onboarding'i
- `/reklam-ver` fiyat, envanter, ölçüm ve manuel onay sınırları

## Uygulama sonucu

- Dört API/bülten yüzeyi ortak `ApiProductNav` ile birbirine bağlandı; bülten aboneliği API planından açıkça ayrıldı.
- Plan, fiyat, günlük kota ve anonim dakika limiti backend `env`/`/api/v1/keys/plans` sözleşmesinden geliyor. Sözleşme alınamazsa eski veya mock rakam göstermek yerine sayfa fail-closed durumuna geçiyor.
- Backend sözleşmesi `apiVersion`, anonim limit, UTC günlük kota penceresi, manuel onay fiyat modu ve public SLA bulunmadığını yayınlıyor.
- Anahtarlı API cevaplarının günlük tier header'ları anonim dakika header'larıyla artık ezilmiyor; `X-API-Key` CORS izin listesine eklendi.
- Oturum açmış kullanıcı mevcut `/keys` API'si üzerinden anahtar oluşturabiliyor, bir kez gösterilen ham anahtarı alabiliyor, tier/kullanım/kota durumunu görebiliyor ve anahtarı iptal edebiliyor. Oturumsuz kullanıcı giriş/kayıt yoluna yönlendiriliyor.
- Gerçek endpoint kullanan kod örneği tek düğmeyle kopyalanabiliyor; sürümleme, changelog, lisans, düzeltme ve destek yolları görünür.
- Kurumsal örnek, 2025 dönemindeki 167.933 fiyat satırına dayanan canlı yıllık rapora bağlandı; sonuç/tahmin garantisi verilmedi.
- Reklam sayfası sabit örnek fiyat yayınlamıyor. Format, yerleşim, hedefleme, süre, cihaz ve canlı envanter değerlendirmesi sonrası yazılı teklif; ödeme/kreatif/yayın kapıları ve ölçüm sınırları açıklanıyor.
- Reklam talebinin rezervasyon olmadığı, ilk fazın manuel onaylı olduğu ve satış/tıklama/ticari sonuç garantisi verilmediği açıkça yazıldı; sahte logo veya kanıtsız başarı iddiası eklenmedi.

## Otomatik doğrulama

- Backend: 28 dosya, 119 test ve 264 assertion geçti; TypeScript ve production build başarılı.
- Frontend: 31 dosya ve 86 test geçti; TypeScript ve production build başarılı.
- ESLint 0 hata ile geçti; kapsam dışı mevcut 32 uyarı değişmedi.
- Yeni UI sözleşme testleri:
  - `frontend/src/components/api/ApiProductNav.test.tsx`
  - `frontend/src/components/api/CopyCodeBlock.test.tsx`

## Canlı kabul

- Commit/release: `32358fcd` (`.next-release-32358fcda130`).
- `/api/v1/keys/plans`, canlıda `v1`, `600/dk`, UTC günlük pencere, `manual_approval`, Free 100/gün ve Pro 10.000/gün sözleşmesini tek cevapta yayınlıyor.
- Anahtarsız `/api/v1/prices` isteği `200`, `x-ratelimit-tier: anonymous` ve `x-ratelimit-limit: 600`; geçersiz API anahtarı `401 invalid_api_key` döndürüyor.
- `/pro` 390x844: canlı plan değerleri, sıfır yatay taşma, API key giriş/onboarding alanı, gerçek rapor örneği ve çalışan kopyalama aksiyonu doğrulandı. Tarayıcı konsolunda hata/uyarı yok.
- `/api-docs`: canlı `600/dk` değeri, v1 changelog ve yeni politika bağlantıları; eski `120/dk` ifadesi bulunmuyor.
- `/api-policy`: canlı sözleşmeden `dakikada 600` ve eski `120` değerinin bulunmadığı doğrulandı.
- `/abonelik`: haftalık bülten rolü ve ayrı API Pro bağlantısı doğrulandı.
- `/reklam-ver` 390x844: manuel onay, yazılı teklif, envanter/ölçüm sınırı, garanti yasağı ve sıfır yatay taşma doğrulandı. Tarayıcı konsolunda hata/uyarı yok.
- Backend ve frontend sağlık kontrolleri `200`; iki PM2 süreci online ve unstable restart `0`.
- Sunucudaki Tanıtio/ETL/route/frontend WIP değişiklikleri korundu; deploy commit'ine veya build temizliğine dahil edilmedi.

## Görsel kanıtlar

- `output/playwright/theme-clean-data/api-pro-mobile-2026-08-14.png`
- `output/playwright/theme-clean-data/api-docs-mobile-2026-08-14.png`
- `output/playwright/theme-clean-data/reklam-ver-mobile-2026-08-14.png`
