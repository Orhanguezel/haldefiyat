# Faz 0 Canlı Doğrulama — 13 Ağustos 2026

## Ortam

- İlk doğrulama HEAD: `60873b3d09f4d5a7999d015b28e76d1b6d303c4d`
- P0 deploy HEAD: `040eca2a` (`7723e544` uygulama paketi + Fastify route tip düzeltmesi)
- PM2: `hal-backend`, `hal-frontend`, `hal-admin` online.
- Browser eklentisi yok; `playwright-cli` normal Chrome fallback’i kullanıldı.
- WIP koruması: VPS ve localde `core/env.ts`, `etl/fetcher.ts`, `routes/project.ts`, `web-connection/` ve Bursa testi değişiklikleri var. Gelen commit ile kesişim olmadığı makineyle doğrulanıp `git pull --ff-only` uygulandı; WIP korundu.

## Canlı bulgular

| Bulgu | Durum | Kanıt |
|---|---|---|
| Koyu/neon ve yoğun ana sayfa | Devam ediyor | İlk ekran + ticker + emoji özellik satırı; Playwright snapshot/screenshot |
| Bozuk ürün adı | Devam ediyor | `/urun/domates`: `Domates (...)` title, meta, schema ve içerikte |
| 546 TL domates | P0 kapandı | Deploy sonrası `/urun/domates` HTML’inde `546,21` yok |
| Invalid Date | P0 kapandı | Deploy sonrası analiz HTML’inde `Invalid Date` yok |
| Avakado/Avokado | Devam ediyor | Her iki URL 200; ana sayfada `Avokado (Adet)` `/urun/avakado`, birim `/kg` |
| Sayaç çelişkisi | Devam ediyor | Topbar `1.234 ürün`, `29 aktif il`; harita `19 ilde güncel veri` |
| Künye | Devam ediyor | Sorumlu yayıncı yalnız “HalDeFiyat” |
| Açık ilan telefonu | P0 kapandı | Liste/detay API’sinde `contactPhone:null`, `raw:null`; serbest metindeki mobil numara `[telefon gizlendi]`; frontend `tel:` yolu kaldırıldı |
| Newsletter subscribe 404 | Canlıda kapanmış | Geçersiz email POST’u endpoint’e ulaşıp 422 döndü; 404 değil |

## SMS/OTP gerçekliği

- Kod altyapısı mevcut: Netgsm adapter, OTP HMAC/TTL/limit, send/verify endpoint’leri.
- Canlıda `SMS_PROVIDER`, `NETGSM_USERCODE`, `NETGSM_PASSWORD`, `NETGSM_MSGHEADER` ve `LISTING_REQUIRE_PHONE_OTP` tanımlı değil.
- Sonuç: yeni SMS sistemi yazılmayacak; mevcut kod ileride credential ile aktive edilebilir. Arama talebi MVP’si Resend + Telegram + panel üzerinden tasarlanmalı.

## İlk P0 düzeltme paketi

1. Public listing DTO’sunda `contactPhone` ve `raw` daima kaldırıldı.
2. Başlık/açıklama/kalite/paketleme içindeki Türk mobil numaraları redakte edildi.
3. Frontend ilan detayındaki doğrudan `tel:` render yolu kaldırıldı.
4. Analiz tarih formatı date-only ve full ISO için ortak, güvenli yardımcıya taşındı.
5. %200 üzeri türev perakende farkları public karttan filtrelendi; 546,21 TL fixture’ı eklendi.
6. Newsletter unsubscribe imzasındaki sabit production fallback kaldırıldı.

## Testler

- `listings-public-redaction`: 3/3 geçti.
- `newsletter-token-secret`: 2/2 geçti.
- Tarih yardımcı fonksiyonu Node assertion: geçti.
- Retail türev guard Node assertion: geçti.
- VPS backend `bun run build`: geçti.
- VPS frontend `bun run build`: ilk deneme canlı ISR fetch-cache yazma yarışı nedeniyle `ENOTEMPTY` ile durdu; tekrar denemesi geçti. Bu bulgu izole release build gereksinimine kanıt olarak kaydedildi.
- Additive migration uygulandı; `hf_listing_call_requests` tablosunun 12 kolonu doğrulandı.
- `hal-backend` reload ve `hal-frontend` restart sonrası ikisi de online.

## Deploy sonrası canlı kabul

- Ana sayfa, domates ürün, analiz ve ilan detay rotaları: HTTP 200.
- Public listing listesi: 2 kayıt, yapılandırılmış/serbest metin satıcı telefonu sızıntısı 0.
- Maskelenmesi gereken eski serbest metin telefonu: `[telefon gizlendi]` işaretiyle doğrulandı.
- İlan sayfası: “Satıcıyı ara” CTA görünür; doğrudan satıcı `tel:` bağlantısı yok.
- Organization JSON-LD içindeki platformun kurumsal telefonu satıcı telefonu değildir ve korunmuştur.
- Kimliksiz `POST /api/v1/listings/:id/call-requests`: HTTP 401.
- Domates türev perakende anomali guard: geçti.
- Analiz tarih guard: geçti.

## Görsel kanıtlar

- `output/playwright/faz0/home-desktop.png`
- `output/playwright/faz0/home-mobile.png`
- `output/playwright/faz0/domates-desktop.png`
- `output/playwright/faz0/analysis-invalid-date.png`
- `output/playwright/faz0/listing-phone-desktop.png`
