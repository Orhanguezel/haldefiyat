# GSC Rich Results URL İncelemesi — 27 Temmuz 2026

## Amaç

Google Rich Results Test'in anonim otomasyonda oturum/reCAPTCHA engeline
takılması üzerine, aynı URL'lerin Google Search Console URL Inspection API
tarafından görülen zengin sonuç durumunu resmî ve tekrar üretilebilir ikinci
bir kanıt olarak kaydetmek.

Bu inceleme, checklist'teki etkileşimli Rich Results Test ekran çıktısı
gereksiniminin yerine geçirilmemiştir.

## Canlı sonuçlar

| URL | Dizin kararı | Zengin sonuç kararı | Google'ın algıladığı öğeler |
| --- | --- | --- | --- |
| `/` | PASS | PASS | Dataset: Türkiye Hal Fiyatları |
| `/urun/domates` | PASS | PASS | Breadcrumb, Dataset |
| `/hal/antalya-hal-serik` | PASS | PASS | Breadcrumb, Dataset |
| `/analiz/hal-fiyati-nasil-belirlenir` | PASS | PASS | Breadcrumb |
| `/fiyatlar` | PASS | PASS | Breadcrumb, 3 Dataset |
| `/metodoloji` | PASS | PASS | Breadcrumb |
| `/rapor/yillik/2025` | NEUTRAL | veri yok | Henüz tarama tarihi yok |
| `/yazar/orhan-guzel` | PASS | PASS | Breadcrumb, kişi/öğe |

## Bulgular

- İncelenen sekiz URL'nin yedisi Google dizin kararında `PASS`.
- Bu yedi URL'nin tamamında rich results verdict `PASS`.
- Yıllık 2025 raporu için Google henüz crawl kaydı döndürmedi; bu yüzden
  zengin sonuç kararı üretmedi.
- Analiz ve metodoloji URL'lerinde Breadcrumb algılandı, fakat Article tipi
  URL Inspection çıktısında ayrı bir rich result item olarak görünmedi.
  Bu, tek başına schema hatası anlamına gelmez; Article Google'da bağımsız bir
  zengin sonuç görünümü garantilemez.
- Schema.org Validator'ın aynı sekiz URL için verdiği hata 0/uyarı 0 sonuçları
  ayrı arşivde korunuyor:
  `artifacts/seo/schema-validator-2026-07-27/`.

## Uygulama

- Ortak Search Console servisinin URL inceleme yanıtına
  `rich_results_verdict` ve benzersiz `rich_result_types` alanları eklendi.
- Admin panelindeki `/admin/search-console` URL inceleme kartı zengin sonuç
  kararını ve algılanan türleri rozetlerle gösteriyor.
- Shared packages commit'i: `3c842b6`
- HalDeFiyat admin commit'i: `ade375c1`

## Canlı kabul

- Backend üretim build'i tamamlandı ve `hal-backend` yeniden başlatıldı.
- `GET /api/v1/health`: HTTP 200, `status=ok`, `db=ok`.
- Admin üretim build'i tamamlandı ve `hal-admin` yeniden başlatıldı.
- `https://haldefiyat.com/admin/search-console`: HTTP 200.
- Eski admin standalone paketi geri dönüş için
  `/tmp/hal-admin-standalone-before-rich-results-20260727` altında tutuldu.

## Kalan kabul

- Giriş yapılmış etkileşimli Google Rich Results Test'te URL bazlı sonuçları
  kaydet.
- Özellikle henüz crawl edilmemiş `/rapor/yillik/2025` URL'sini Google
  taradıktan sonra URL Inspection ile yeniden kontrol et.
