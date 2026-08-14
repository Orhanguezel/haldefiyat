# HalDeFiyat Analytics Event Sözleşmesi

Son güncelleme: 14 Ağustos 2026

## Değişmez kurallar

- Event payload'ına arama sorgusu, ad-soyad, e-posta, telefon, serbest not, adres, JWT, OTP veya çerez değeri yazılmaz.
- Arama metni yerine yalnız `query_length`; sonuçlar yerine sayılar ve kontrollü public slug kullanılır.
- String alanlar 100 karakterle sınırlıdır; e-posta/telefon desenine benzeyen değerler gönderimden çıkarılır.
- Attribution yalnız izinli `gclid`, `utm_*` ve ilk public path alanlarından gelir.
- Dönüşüm eventleri ile ürün keşif eventleri ayrı kategori taşır.
- Yeni event veya alan önce bu sözleşmeye, sonra allowlist'e ve PII regresyon testine eklenir.

## Ürün keşif hunisi

| Event | Tetik | İzinli alanlar |
|---|---|---|
| `search_opened` | Global ürün/hal arama dialogu açıldı | `trigger` |
| `search_submitted` | Debounce sonrası ürün ve hal sonuçları alındı | `query_length`, `product_results`, `market_results`, `result_count`, `zero_results` |
| `search_result_selected` | Kullanıcı ürün veya hal sonucunu seçti | `result_type`, `result_position`, `item_slug` |
| `price_viewed` | Canonical ürün fiyat sayfası istemcide görüntülendi | `product_slug`, `market_count`, `source_count` |

Temel huni: `search_opened → search_submitted → search_result_selected → price_viewed`.

## Fiyat filtresi hunisi

| Event | Tetik | İzinli alanlar |
|---|---|---|
| `price_filter_changed` | Arama, il, hal, kategori, birim, tarih aralığı, sıralama veya sayfa boyutu değişti | `filter_name`, kontrollü public `filter_value`, `query_length`, `active_filter_count` |
| `price_filter_zero_results` | Aktif filtre bileşimi sıfır kayıt döndürdü | `filter_name`, `query_length`, `active_filter_count`, `result_count=0`, `zero_results=true` |

Serbest arama metni `filter_value` olarak gönderilmez; yalnız `N_chars`
biçiminde uzunluk kategorisi ve sayısal `query_length` kullanılır. İl, hal,
kategori, birim, tarih aralığı ve sıralama değerleri yalnız uygulamanın
kontrollü seçeneklerinden gelir.

## Çağrı talebi hunisi

| Event | Anlam | İzinli temel alanlar |
|---|---|---|
| `call_request_view` | Arama talebi formu görüntülendi | `listing_id`, `source_page` |
| `call_request_submit` | Talep başarıyla oluşturuldu | `listing_id`, `preferred_slot` |
| `call_request_notified` | Telegram teslimi başarıyla sonuçlandı ve talep `notified` oldu | `listing_id` |
| `call_request_accepted` | Satıcı talebi kabul etti | `listing_id`, `request_id` |
| `call_request_declined` | Satıcı talebi reddetti | `listing_id`, `request_id` |
| `call_request_cancelled` | Alıcı talebi iptal etti | `listing_id`, `request_id` |
| `call_request_completed` | Talep tamamlandı | `listing_id`, `request_id` |

## Birinci taraf ürün KPI kaydı

Analytics izni verildiğinde discovery eventleri aynı anda `hf_cta_events`
tablosuna `placement=product_search` ve kontrollü kısa olay adıyla yazılır:
`opened`, `submitted`, `selected`, `price_viewed`, `zero_results`. Payload yalnız
mevcut path ve cihaz sınıfını taşır; sorgu, ürün adı, iletişim alanı veya kalıcı
ziyaretçi kimliği taşımaz. Tekillik IP + user-agent + gün + sunucu sırrından
üretilen 16 karakterlik günlük hash ile hesaplanır; gün değişince bağlantı kopar.

Bu kayıt `/admin/analytics/product-kpis` için fiyat bulma süresi, arama başarısı
ve sıfır sonuç oranını üretir. 30 tamamlanmış yolculuk ve 100 gönderilmiş arama
öncesinde panel değeri "veri birikiyor" diye gösterir; sıfır performans sonucu
olarak yorumlamaz.

## Ayrı ürün/gelir hunileri

| Huni | Başlangıç | Ana dönüşüm | Kaynak |
|---|---|---|---|
| Bülten | CTA `impression` | `newsletter_signup` / CTA `success` | `hf_cta_events` + newsletter DB |
| Sosyal | onaylı taslak/kanal görüntüleme | content-guard sonrası dış yayın kimliği | ekosistem-sosyal-medya tek poster + social analytics |
| Reklam | sponsorlu slot impression | click, doğrulanmış talep/rezervasyon | canlı banner impression/click/audit |
| API Pro | `/api-docs` veya `/pro` ziyareti | `pro_inquiry`, sonra onaylı API key kullanımı | audit + API key usage |
| Kurumsal rapor | rapor/kurumsal CTA ziyareti | nitelikli iletişim, manuel teklif ve ödeme kanıtı | audit + iletişim/gelir operasyon kaydı |

Huniler tek bir "conversion" toplamında birleştirilmez. Bülten abonesi reklam
rezervasyonu, API talebi ücretli müşteri veya sosyal yayın gelir sayılmaz.

## KPI ve rollback eşikleri

- Fiyat bulma süresi: en az 30 yolculukta ortalama **15 saniye üzeri** inceleme.
- Arama başarısı: en az 100 aramada **%40 altı** inceleme; kontrol kohortuna göre
  **%20 göreli düşüş** rollout durdurma nedeni.
- Toptan fiyat anomalisi: **%1 uyarı**, **%3 yayın durdurma/veri kapısı**.
- Arama talebi: ilk 30 talep tamamlanmadan kabul/tamamlama oranına ürün kararı
  bağlanmaz; sonrasında kontrol kohortuna göre %20 göreli düşüş incelenir.
- 5xx oranı **%0,10** üstünde veya yeni public PII bulgusu >0 ise tema/özellik
  cohort'u genişletilmez.

Tema cohort ve karar akışı `docs/TEMA-ROLLOUT-VE-KPI-KAPISI.md` içinde tanımlıdır.

## Regresyon kapısı

- `frontend/src/lib/analytics.test.ts` discovery event allowlist'ini ve arama metni/e-posta/telefon taşınmadığını doğrular.
- Eventler `window.gtag` yokken sessizce no-op olur.
- Tarayıcı kabulünde event adı ve izinli alanlar dataLayer/gtag stub ile doğrulanır; gerçek kişisel veri kullanılmaz.
