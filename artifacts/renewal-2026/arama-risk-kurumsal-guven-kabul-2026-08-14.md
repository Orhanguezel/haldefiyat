# Arama Riski ve Kurumsal Güven Kabulü

**Tarih:** 14 Ağustos 2026

**Ortam:** Canlı `https://haldefiyat.com` + `vps-vistainsaat`

**Kapsam:** F1.26, F1.40–43, G1.5

## Adaptif arama talebi koruması

Arama talebi formuna normal kullanıcıyı varsayılan olarak durdurmayan üç risk sinyali eklendi:

- Görünmeyen honeypot alanı doluysa istek `400 bot_detected` ile reddedilir.
- Form olağandışı hızlı gönderilmişse veya tarayıcı user-agent bilgisi yoksa kısa süreli güvenlik sorusu istenir.
- Güvenlik tokenı HMAC imzalı, 5 dakika geçerli, kullanıcı ve ilan kimliğine bağlıdır; cevap, süre, imza veya bağlam hatalıysa talep oluşturulmaz.
- Mevcut auth, saatlik IP sınırı, alıcı/ilan/satıcı DB kotaları ve public telefon redaksiyonu korunur.

Canlı yan etkisiz kabul, doğrulanmamış test hesabıyla yapıldı:

| Senaryo | Canlı sonuç |
|---|---|
| 10 ms hızlı gönderim | HTTP 428 `risk_challenge_required`, imzalı challenge mevcut |
| Doğru cevap ve geçerli token | Challenge geçti; sonraki kimlik kapısında HTTP 403 `account_verification_required` |
| Honeypot dolu | HTTP 400 `bot_detected` |
| Arama talebi satır sayısı | Test öncesi 0, test sonrası 0 |

Bu kabul Telegram, satıcı veya üçüncü kişiye bildirim üretmedi ve canlı talep satırı bırakmadı.

Test sonuçları:

- Call-request validation/risk: 7/7.
- Call-request validation + redaction + contact summary: 14/14.
- Backend TypeScript: geçti.
- Frontend TypeScript: geçti.
- Frontend lint: hata 0; repo genelinde bu değişikliklerden bağımsız 32 mevcut uyarı var.

## Tek kurumsal ayar kaynağı

Additive `087_institutional_identity_settings.sql` ile aşağıdaki ayarlar `site_settings` kaynağına eklendi:

- `legal_entity_name = GZL Teknoloji`
- `responsible_publisher_name = Atakan Şahin`
- `technical_contact_name = Orhan Güzel`

Bu üç değer artık Hakkımızda, İletişim, footer ve Organization/publisher şemasında aynı `fetchSiteSettings` sözleşmesinden okunur. Canlı API üç kaydı da döndürdü; ana sayfa JSON-LD içinde `legalName: GZL Teknoloji` ve ortak `#organization` publisher referansı doğrulandı.

Açık adres ayarı boş bırakıldı. Doğrulanmamış adres uydurulmadı; İletişim sayfası doğrulama tamamlanana kadar adresin yayımlanmadığını açıklar.

## Güven ve lisans yüzeyleri

Canlı kontroller:

- `/hakkimizda`: ekip, işletmeci, amaç, veri yaklaşımı ve politika bağlantıları mevcut.
- `/iletisim`: işletmeci, sorumlu yayıncı, teknik sorumlu ve adres doğrulama durumu mevcut.
- Tüm `LegalPageContent` yüzeyleri metodoloji, veri kaynağı, editoryal, düzeltme, KVKK, gizlilik, kullanım, API ve sahiplik sayfalarını ortak navigasyonla çapraz bağlıyor.
- `/metodoloji`: HalDeFiyat'ın kendi metinleri ile üçüncü taraf ham fiyat kayıtlarının hakları ayrıldı; API erişiminin mülkiyet veya sınırsız yeniden satış lisansı vermediği yazıldı.
- `/api-policy`: kaynak hakları, public API'nin SLA vermediği, yüksek hacim/yeniden satış/beyaz etiket/özel SLA/kurumsal rapor için yazılı lisans gerektiği ve konsept fiyatlarının teklif olmadığı açık.

Canlı Playwright kabulü:

- 390×844 Hakkımızda: `output/playwright/theme-clean-data/hakkimizda-kurumsal-mobile-2026-08-14.png`
- API politika: `output/playwright/theme-clean-data/api-policy-mobile-2026-08-14.png`
- Tarayıcı konsolu: 0 hata, 0 uyarı.

## Deploy

- Adaptif risk commit'i: `5f7b2878`.
- Kurumsal kimlik/politika commit'i: `80393735`.
- Backend build ve PM2 reload sonrası health HTTP 200.
- Frontend izole release: `.next-release-80393735`; standalone symlink doğrulandı ve PM2 restart sonrası HTTP 200.

## Kalan dış bağımlılık

Künye adresi/şehir bilgisi işletme sahibinin doğrulanmış kaydı olmadan tamamlanamaz. Bu nedenle G1.5 teknik güven yüzeyleri canlı olsa da künye kabulü adres onayına kadar kısmi tutulur.
