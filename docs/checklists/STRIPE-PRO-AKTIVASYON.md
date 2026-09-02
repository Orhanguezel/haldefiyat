# Pro API aboneliğini açma — Stripe kurulumu

Kod tarafı **bitti ve canlıda**; ödeme akışı yalnızca üç env değeri girilene kadar
kapalı duruyor. Kapalıyken davranış bilinçli olarak şöyle: `/pro` eski manuel talep
CTA'sını gösterir, `POST /billing/checkout` **503** döner, webhook **503** döner.
Yarım yapılandırmayla "çalışıyor gibi" görünen bir durum yok.

Aşağıdaki üç adım **Orhan'da** — Stripe paneline erişim gerekiyor.

## 1. Ürün ve yinelenen fiyat oluştur

Stripe panelinde (goldmoodastro hesabı) → **Products → Add product**

| Alan | Değer |
|---|---|
| Name | HaldeFiyat Pro API |
| Pricing model | Standard pricing |
| Price | **2.999 ₺** (kodda `PRO_PRICE_MONTHLY_TL` ile aynı olmalı) |
| Billing period | Monthly / Recurring |
| Currency | TRY |
| Tax behavior | Inclusive (sayfada "KDV dahil" yazıyor) |

Kaydettikten sonra fiyatın **`price_...` id'sini** kopyala.

> Tutar koda yazılmaz; kod bu id üzerinden Stripe'ın fiyatını kullanır. Fiyatı
> değiştirmek deploy gerektirmez — ama `/pro` sayfasında görünen rakam
> `PRO_PRICE_MONTHLY_TL` env'inden geldiği için **ikisini birlikte** güncelle,
> yoksa sayfadaki fiyat ile tahsil edilen tutar ayrışır.

## 2. Webhook uç noktası ekle

**Developers → Webhooks → Add endpoint**

- URL: `https://haldefiyat.com/api/webhooks/stripe`
- Dinlenecek olaylar (dördü de gerekli):
  - `checkout.session.completed` — erişimi açar
  - `customer.subscription.updated` — dönem sonu, iptal işareti, `past_due`
  - `customer.subscription.deleted` — erişimi kapatır
  - `invoice.payment_failed` — ödeme alınamayınca anahtarları düşürür

Oluşturunca **Signing secret**'ı (`whsec_...`) kopyala.

## 3. VPS env'ine yaz ve yeniden başlat

```bash
ssh vps-vistainsaat
cd /var/www/tarim-dijital-ekosistem/projects/hal-fiyatlari/backend
# .env içine (mevcut boş satırları doldur):
#   STRIPE_SECRET_KEY=sk_live_...
#   STRIPE_PRO_PRICE_ID=price_...
#   STRIPE_WEBHOOK_SECRET=whsec_...
pm2 restart hal-backend --update-env
```

Doğrulama:

```bash
curl -s https://haldefiyat.com/api/v1/keys/plans | grep pricingMode
# "self_service" görünmeli — "manual_approval" ise env okunmamış demektir.
```

## 4. Müşteri portalini aç (iptal/fatura ekranı)

**Settings → Billing → Customer portal → Activate**. Açık değilse "Aboneliği
yönet" düğmesi 502 verir. İptal, kart değişikliği ve fatura geçmişi bilinçli
olarak Stripe'ta bırakıldı — kendi faturalama ekranımızı yazmıyoruz.

---

## Test modunda denemek istersen

Canlı hesapta test yapmak yerine Stripe'ın test moduna geç (panelde sağ üst
**Test mode**), aynı üç adımı orada tekrarla ve `sk_test_` / `price_` (test) /
`whsec_` (test) değerlerini gir. Test kartı: `4242 4242 4242 4242`, ileri bir
son kullanma tarihi, herhangi bir CVC.

## Sunucu tarafı neyin kanıtlandı (2026-09-02)

Stripe'a hiç dokunmadan, kendi imzamızla sentetik webhook olayları gönderilerek
uçtan uca doğrulandı:

| Senaryo | Sonuç |
|---|---|
| Geçersiz imza | 400 reddedildi |
| Aynı olayın ikinci teslimatı | `duplicate: true`, tekrar işlenmedi |
| `checkout.session.completed` | Anahtarlar `free`/100 → **`pro`/10.000** |
| Pro iken açılan yeni anahtar | Doğrudan `pro`/10.000 doğuyor |
| Zaten aboneyken checkout | 409 |
| `past_due` (ödeme alınamadı) | Anahtarlar `free`/100'e düştü |
| `customer.subscription.deleted` | Tüm anahtarlar `free`/100 |
| Stripe yapılandırılmamışken checkout | 503 (fail-closed) |

Kalan tek belirsizlik Stripe'ın kendi tarafı: gerçek kart akışı ve panel
yapılandırması. Onlar yukarıdaki adımlardan sonra test kartıyla doğrulanmalı.
