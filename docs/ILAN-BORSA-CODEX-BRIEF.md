# Codex Brief — İlan + Canlı Borsa Modülü (Faz 0)

> Çeklist: [`ILAN-BORSA-MODULU-PLAN.md`](../ILAN-BORSA-MODULU-PLAN.md)
> Şema (yazıldı, dokunma): `backend/src/db/seed/sql/035_listings_schema.sql`
>
> **Bu brief Faz 0 kapsamıdır.** OTP, Telegram parse, canlı borsa = Faz 1-2 (kapsam dışı).
> Referans desen olarak `backend/src/modules/firms/` modülünü birebir takip et.

## 0. Kesin kurallar (ihlal = red)

- **⛔ İlan fiyatı ≠ hal fiyatı:** İlan verisi `hf_price_history`/ETL/hal istatistik tablolarına
  **ASLA yazılmaz.** İlanlar tamamen `hf_listings` katmanında kalır; resmi hal ortalamalarını
  etkilemez. Frontend'de ilanlar resmi hal fiyatından **ayrı etiketle** ("İlan/Teklif") gösterilir.
- **Yeni rol YOK:** `user_roles` shared enum'a DOKUNMA (cross-project). Herhangi bir `requireAuth` üyesi ilan açabilir. Üretici/komisyoncu/alıcı ayrımı SADECE `hf_listings.party_role` (ilan bazında) ile yapılır.
- **API v1:** Tüm iş endpoint'leri `/api/v1/...`. Public `/api/v1/listings`, admin `/api/v1/admin/listings`.
- **ALTER YASAK:** Şema değişikliği SADECE `035_listings_schema.sql` CREATE TABLE içine. Sonra `db:seed:*:fresh`.
- **Deploy SADECE git** (rsync/scp YASAK). `bun install` sadece monorepo root'tan, proje altında `node_modules` açma.
- **Hard-code YASAK** (il/ürün/birim/dil config veya DB'den). **Kod tekrarı YASAK** (shared modülleri import et).
- **Dosya 200 satırı geçmez** → böl. Gereksiz "ne yapıyor" yorumu yazma, sadece "neden".
- Şehir/ilçe doğrulama: `backend/src/data/turkey-city-slugs.ts` → `isValidCitySlug`/`isValidDistrictSlug`.

## 1. Backend modülü — `backend/src/modules/listings/`

`firms/` modülünün dosya yapısını taklit et:
```
modules/listings/
├── index.ts        # registerListings(app) — route ağacı
├── controller.ts   # handler'lar (public/owner/admin)
├── repo.ts         # DB sorguları (drizzle)
├── schema.ts       # drizzle tablo tanımları (035 SQL'i yansıtır)
├── slug.ts         # {urun}-{il}-{id} slug üretimi
└── validation.ts   # zod/şema doğrulama (create/update body)
```

### 1.1 Reuse (import et, yeniden yazma)
```ts
import { requireAuth } from '@eco/shared-backend/middleware/auth';
import { requireAdmin } from '@eco/shared-backend/middleware/roles';
import { getAuthUserId, handleRouteError, sendNotFound, parsePage } from '@eco/shared-backend/utils/http';
```

### 1.2 Endpoint kontratı

**Public** (`/api/v1/listings`):
| Method | Path | Açıklama |
|---|---|---|
| GET | `/listings` | Liste + filtre: `?type=satis\|alim&product=<slug>&city=<slug>&district=<slug>&page=&limit=`. Sadece `status='approved'` + `valid_until>=today`. Öne çıkanlar (`is_featured`+`featured_until>now`) en üstte. **Coğrafyalar arası:** `city` boşsa ürün için TÜM bölgelerdeki ilanlar gelir (Antalya karpuzu ↔ Karslı alıcı eşleşmesi bu sayede çalışır). |
| GET | `/listings/:slug` | Detay. `hide_phone=1` ise `contact_phone` döndürme. `view_count++`. |
| POST | `/listings/:id/inquiry` | Teklif/iletişim (`name`, `phone`, `message`, `offer_price?`) → `hf_listing_inquiries`. Public form. |

**Owner** (`/api/v1/listings`, `requireAuth`):
| Method | Path | Açıklama |
|---|---|---|
| GET | `/listings/me` | Kullanıcının kendi ilanları (tüm status). |
| POST | `/listings` | İlan oluştur → `status='pending'`, `source='user'`, `user_id`=auth. Fiyat sıhhat kapısı çalışır. |
| PATCH | `/listings/:id` | Owner günceller → tekrar `status='pending'` (re-moderation). |
| POST | `/listings/:id/close` | Owner kapatır → `status='closed'`. |

**Admin** (`/api/v1/admin/listings`, `requireAuth`+`requireAdmin`):
| Method | Path | Açıklama |
|---|---|---|
| GET | `/admin/listings` | Tüm ilanlar + sayım özeti (active/pending/rejected). |
| POST | `/admin/listings` | Asistanlı giriş → `source='assisted'`, `created_by`=admin, istenirse `status='approved'`. |
| PATCH | `/admin/listings/:id/moderate` | `status` approved/rejected + `moderation_note`. |
| PATCH | `/admin/listings/:id/feature` | **Ücretli öne çıkarma** — body `package: daily\|weekly\|monthly`. `is_featured=1`, `featured_until = now + (1\|7\|30 gün)`. Faz 0 manuel (offline ödeme sonrası admin); online ödeme Faz 1. Paket fiyatları `site_settings.listing_featured_pricing` JSON'dan (hard-code yok). |
| GET | `/admin/listings/inquiries` | Teklif listesi. |
| DELETE | `/admin/listings/:id` | Sil. |

### 1.3 İş kuralları
- **product bağlama:** body `product_slug` gelir → `hf_products`'tan `id`+`name_tr`+`category_slug` çöz, `product_id`/`product_name`/`category_slug` doldur. Eşleşmezse `product_id=NULL` ama `product_name` serbest metin kalır.
- **alım ilanı semantiği:** `listing_type='alim'`'de `city_slug` = **alınmak istenen ürünün bulunduğu hedef bölge** (örn. Karslı komisyoncu Antalya karpuzu arıyorsa `city_slug=antalya`). Alıcının kendi konumu `firm_id`/profilden gelir, ayrı tutulur.
- **Yumuşak moderasyon işareti (`is_suspicious`):** SADECE bir spam/outlier sinyalidir — **hal verisini etkilemez, hal istatistiğine yazılmaz.** `price_type='sabit'` ve `product_id` varsa o ürünün son hal `avg_price`'ı ile karşılaştır; **sapma > %60 ise `is_suspicious=1`** (Faz 0 eşiği, Faz 2'de kalibre). İlan yayında kalır, sadece admin panelinde işaretli görünür. Coğrafyalar arası fiyat farkı meşru olabileceğinden bu sadece moderatöre ipucudur, otomatik gizleme YOK.
- **valid_until:** zorunlu, geçmiş tarih reddedilir. Default öneri: +14 gün.
- **slug:** `{product_slug||slug(title)}-{city_slug}-{id}`. Insert sonrası id ile güncellenir (firms slug deseni).

### 1.4 Route register
`src/routes.ts` (veya `app.ts` route ağacı) içine, firms ile aynı seviyede:
```ts
import { registerListings } from './modules/listings';
// v1 bloğu içinde:
await registerListings(v1);
```

### 1.5 Cron
`backend/src/cron.ts` → günlük: `UPDATE hf_listings SET status='expired' WHERE status='approved' AND valid_until < CURRENT_DATE()`.

## 2. Frontend — `frontend/src/app/[locale]/(public)/`

- `ilanlar/page.tsx` — liste + filtre (il/ilçe/ürün/tip). `<PageContainer>` zorunlu (max-w 1400). Mobil öncelikli kart.
- `ilan/[slug]/page.tsx` — detay + teklif formu. JSON-LD `Offer`/`Product` + canonical. SSR metadata.
- `ilan-ver/page.tsx` — auth'lu form (OTP Faz 1). Ürün autocomplete `hf_products`'tan.
- `(dashboard)/hesabim/ilanlarim` — owner ilan yönetimi.
- **Birleşik il sayfası:** mevcut il sayfasına "İlanlar" bloğu ekle (hal fiyatı + komisyoncu + ilan tek sayfa). Tekil ilan sayfasını sitemap'e ekleme — **birleşik sayfayı** indexle.

## 3. Admin panel — `admin_panel/src/app/(main)/admin/(admin)/ilanlar/`

`firmalar/` panelini referans al: liste, filtre, moderasyon aksiyonları (approve/reject), öne çıkarma toggle, inquiry görüntüleme, sil. İstatistik özeti kartları.

## 4. Tamamlanınca

- `bun run build` (backend + frontend + admin) hatasız.
- Lokal `db:seed:*:fresh` ile şema doğrula.
- Deploy git ile; Claude VPS'te `grep` ile route varlığını doğrular.
- Çeklistteki ilgili 🟢 maddeleri `[x]` + tarih yap.

## 5. Kapsam dışı (yapma)

OTP gönderimi · Telegram parse · arz/talep panosu aggregation · öne çıkarma **online ödeme**
(Faz 0'da sadece admin manuel toggle var) · işlem komisyonu · ana sayfa vitrini.
Bunlar Faz 1-2; ayrı brief gelecek.
