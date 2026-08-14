# Ana sayfa arama, gerçek fiyat ve analytics kabulü

Tarih: 14 Ağustos 2026

Canlı sürüm: `df06a181`

Hedef: `https://haldefiyat.com`

## Sonuç

Ana sayfanın birincil görevi ürün/hal arayıp güncel fiyat kaydına ulaşmak olarak sabitlendi. Mobil ve masaüstü hero alanı gerçek API satırından ürün, ortalama fiyat, birim, kayıt tarihi, public kaynak adı, kaynak sayısı ve tazelik durumunu gösteriyor. Widget API boş dönerse sahte fiyat kartı üretilmiyor.

Arama hunisi canlı tarayıcıda dört adımıyla doğrulandı:

1. `search_opened`
2. `search_submitted`
3. `search_result_selected`
4. `price_viewed`

## Mobil kabul

- Cihaz/UA: Android 14, Pixel 7 Chrome Mobile
- Viewport: `390x844`
- H1: 1 adet
- Yatay taşma: yok
- Tarayıcı konsolu: 0 hata, 0 uyarı
- Birincil arama kontrolü ilk ekranda.
- Gerçek fiyat kartı ilk ekranın içinde başlıyor; fiyat sonucuna 1–1,5 ekran sınırı içinde ulaşılıyor.
- Kayan fiyat ticker'ı yok; API'den gelen kısa popüler fiyat sırası var.
- Mobil ana görevden önce reklam gösterilmiyor.

Ekran kanıtı:

- `output/playwright/theme-clean-data/anasayfa-arama-fiyat-mobile-2026-08-14.png`
- SHA-256: `10c4e69c873e55c60330061f0695f48b12dd91a7953076f242ded53f569fd54f`

## Masaüstü kabul

- Viewport: `1440x1000`
- H1: 1 adet
- Yatay taşma: yok
- Birincil arama kontrolü hero içinde; görünür kutusu `x=373`, `y=528,67`, `w=521,91`, `h=48`.
- Gerçek fiyat kaydı hero içinde arama kontrolünün hemen altında.
- İlk reklam, hero ve `Bugünkü Hal Fiyatları` fiyat panosundan sonra; reklam etiketiyle ayrı bir slotta.
- Harita/endeks, ilan, analiz, SSS ve alarm alanları ana fiyat görevinden sonra kısa özet ve ilgili rota bağlantılarıyla yer alıyor.
- Tarayıcı konsolu: 0 hata, 0 uyarı.

Ekran kanıtı:

- `output/playwright/theme-clean-data/anasayfa-arama-fiyat-desktop-2026-08-14.png`
- SHA-256: `9672ecc7c61be9415f7c0092d26608adce02f82a8fb823a3272ead6bc3690f40`

## Analytics payload kabulü

Canlıda `domates` araması ve ilk sonuç seçimiyle yakalanan izinli alanlar:

```text
search_opened:
  event_category=product_discovery
  trigger=programmatic

search_submitted:
  query_length=7
  product_results=52
  market_results=0
  result_count=52
  zero_results=false

search_result_selected:
  result_type=product
  result_position=1
  item_slug=domates-tarla

price_viewed:
  product_slug=domates
  market_count=13
  source_count=13
```

Arama metni, e-posta, telefon veya serbest not event payload'larında bulunmuyor. Uygulama katmanındaki allowlist/PII deseni koruması ve unit testleri bu sözleşmeyi fail-closed uygular.

## Yapılandırılmış veri kabulü

Aşağıdaki canlı rotaların `Dataset.license` değeri görünür API/veri politikasıyla aynıdır:

| Rota | Dataset lisansı |
|---|---|
| `/` | `https://haldefiyat.com/api-policy` |
| `/fiyatlar` | `https://haldefiyat.com/api-policy` |
| `/urun/domates` | `https://haldefiyat.com/api-policy` |

Bu sayfalarda Dataset için geniş CC BY iddiası kalmadı. Kendi dokümantasyon/editoryal içeriğinin lisansı ile kaynak fiyat kayıtlarının kullanım koşulları ayrı tutuluyor.

## Otomasyon kapısı

- Frontend: 26 test dosyası, 76 test geçti.
- Backend: test ortamı secret'larıyla 25 test dosyası, 111 test geçti.
- Frontend ve backend TypeScript: geçti.
- Frontend ESLint `--quiet`: geçti.
- Frontend production build: geçti.

Test ortamında katı env doğrulaması nedeniyle `JWT_SECRET`, `COOKIE_SECRET` ve `NEWSLETTER_TOKEN_SECRET` yalnız test sürecine geçici test değerleriyle verildi; production secret'ları okunmadı veya değiştirilmedi.
