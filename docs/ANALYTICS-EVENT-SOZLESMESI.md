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

## Çağrı talebi hunisi

| Event | Anlam | İzinli temel alanlar |
|---|---|---|
| `call_request_view` | Arama talebi formu görüntülendi | `listing_id`, `source_page` |
| `call_request_submit` | Talep başarıyla oluşturuldu | `listing_id`, `preferred_slot` |
| `call_request_accepted` | Satıcı talebi kabul etti | `listing_id`, `request_id` |
| `call_request_declined` | Satıcı talebi reddetti | `listing_id`, `request_id` |
| `call_request_cancelled` | Alıcı talebi iptal etti | `listing_id`, `request_id` |
| `call_request_completed` | Talep tamamlandı | `listing_id`, `request_id` |

## Regresyon kapısı

- `frontend/src/lib/analytics.test.ts` discovery event allowlist'ini ve arama metni/e-posta/telefon taşınmadığını doğrular.
- Eventler `window.gtag` yokken sessizce no-op olur.
- Tarayıcı kabulünde event adı ve izinli alanlar dataLayer/gtag stub ile doğrulanır; gerçek kişisel veri kullanılmaz.
