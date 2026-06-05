# Codex Brief #2 — İlan + Borsa Modülü (Faz 1 + Faz 2)

> Çeklist: [`ILAN-BORSA-MODULU-PLAN.md`](./ILAN-BORSA-MODULU-PLAN.md) · Faz 0 brief: [`ILAN-BORSA-CODEX-BRIEF.md`](./ILAN-BORSA-CODEX-BRIEF.md)
> Faz 0 bitti ve review geçti. Bu brief kalan **Faz 1 + Faz 2** implementasyonudur.
> Tüm 🟣 tasarım kararları verildi (aşağıda). Faz 3 (işlem komisyonu) DONDURULMUŞ — dokunma.

## 0. Kesin kurallar (Brief #1'den aynen geçerli)

- API v1 · İlan fiyatı hal verisine ASLA yazılmaz (sadece okuma) · Yeni rol YOK (party_role)
- ALTER YASAK (şema 035'e) · bun install root'tan · Hard-code yok (config/DB/site_settings)
- Dosya 200 satırı geçmez · shared modülleri import et · Deploy sadece git
- Mevcut `modules/listings/` desenini sürdür; yeni alt-modüller aynı stilde.

## 1. OTP — telefon doğrulama (Faz 1)

**Karar:** 6 haneli kod, TTL 5dk, kod **hash'li** saklanır (`hf_phone_verifications` hazır).
Rate-limit: aynı telefona 60sn'de 1, günde 5. Max 5 yanlış deneme → kilit. Telefon TR-normalize (+90).

- `POST /api/v1/listings/otp/send` `{phone}` → kod üret, hash'le `hf_phone_verifications`'a yaz (purpose='listing'), SMS gönder. Rate-limit aşılırsa 429.
- `POST /api/v1/listings/otp/verify` `{phone, code}` → doğrula, `verified_at` set, kısa ömürlü **imzalı token** döndür (JWT veya HMAC, 15dk).
- İlan POST'ta (`createOwnerListing`) opsiyonel `otpToken` → geçerliyse `phone_verified=1` + `contactPhone=token.phone`.
- **SMS adapter:** `src/modules/listings/sms.ts` — sağlayıcı-agnostik. `env.SMS_PROVIDER` (`netgsm`|`iletimerkezi`|`none`) + `SMS_API_KEY`/`SMS_SENDER`. `none`/eksikse dev modda kodu log'la (canlıya alınca env doldurulacak). Shared bir sms/notification util varsa onu tercih et.
- Frontend `ilan-ver`: telefon alanına "Doğrula" → kod input → verify → token'ı form submit'e ekle.

> ⚠️ Sağlayıcı kredansiyeli (🔵 Orhan) sonra girilecek; kod adapter ile eksiksiz olmalı.

## 2. Telegram ile ilan girişi (Faz 1)

**Karar (parse):** Mevcut `telegram` modülü webhook handler'ına ilan komutu ekle.
Serbest metin → alanlar:
- **ürün**: `hf_products.aliases` JSON ile eşle (normalizer mevcut, reuse et)
- **il**: `turkey-city-slugs` ile eşle
- **miktar/birim**: regex `(\d+([.,]\d+)?)\s*(ton|kg|kasa|adet|çuval|kg/kasa)`
- **fiyat**: regex `(\d+([.,]\d+)?)\s*(tl|₺)`
- **tip**: metinde "alıyorum|alım|alacağım" → `alim`, yoksa `satis`
- Eksik zorunlu alan (ürün/il) → bot kullanıcıya format mesajı döner, ilan açılmaz.
- Başarılı → `createListing(..., { source:'telegram', status:'pending' })`. Telegram chat_id `profiles`/user ile eşleşirse `user_id` bağla; yoksa `contactName`=telegram adı, raw'a chat_id.
- Moderasyon: admin onaylar (mevcut moderate akışı).

## 3. Eşleştirme bildirimi (Faz 1)

**Karar:** `moderateListing` APPROVE olduğunda tetikle (yeni fonksiyon `notifyMatches(listing)`).
- Eşleşme: aynı `product_id` + aynı `city_slug` + **zıt** `listing_type`, `status='approved'`, `valid_until>=today`.
- Yeni **satış** onaylandı → o ürün+bölgede **alım** ilanı verenlere bildir (komisyoncu/alıcı).
- Yeni **alım** onaylandı → o ürün+bölgede **satış** ilanı veren üreticilere bildir.
- Kanal: telegram (`telegramNotify`, chat_id varsa) + newsletter segment. Opt-in (kullanıcı tercihi); kullanıcı başına **günlük cap** (örn. 5) — spam önleme.
- Hal verisine dokunmaz; sadece `hf_listings` okur.

## 4. Öne çıkarma — self-serve online ödeme (Faz 1)

**Karar:** Faz 0 manuel admin toggle'ı korunur; buna ek self-serve akış.
- Owner kendi ilanında `POST /api/v1/listings/:id/feature-checkout` `{package}` → `orders` modülü reuse ile ödeme başlat. Fiyat `site_settings.listing_featured_pricing`'ten.
- Ödeme başarılı webhook/callback → `featureListing(id, days)` (mevcut repo fonksiyonu).
- **Ödeme sağlayıcı (Iyzipay) bağımlılığı 🔵** — `orders` modülünün mevcut sağlayıcısını kullan; sağlayıcı env eksikse akış "pending payment"te kalır. Kod hazır olur, canlıya alma Orhan onayına bağlı.

## 5. Canlı arz/talep panosu (Faz 2) — resmi hal'den AYRI

**Karar (aggregation + manipülasyon eşiği):**
- Sorgu: `product_id + city_slug + listing_type` grupla; filtre `status='approved'` + `valid_until>=today` + `is_suspicious=0` + `price_type IN ('sabit','hal_endeksli')`. `hf_listings_borsa_idx` kullanılır.
- **Medyan yalnızca ≥3 aktif fiyatlı ilan varsa** gösterilir (o ürün+bölge+tip). <3 → medyan yok, sadece tekil ilanlar + "N ilan" sayacı. (tek-ilan manipülasyonu engellenir.)
- `is_suspicious=1` ilanlar panoda **gösterilmez** (yalnız admin), medyana girmez.
- Makas (spread) = satış medyanı − alım medyanı, **ikisi de ≥3 ise**.
- `GET /api/v1/listings/board?product=<slug>&city=<slug>` → `{ sell:{median,count,top3}, buy:{median,count,top3}, spread, updatedAt }`.
- **Hal tablolarına YAZMA yok**, sadece `hf_listings` okuma.

**Frontend:**
- Ürün/il sayfasına "İlan arz/talep" bloğu: üstte resmi hal fiyatı (mevcut, dokunma), altında **ayrı kutularda** satış/alım özeti + makas. "Resmi hal fiyatından ayrı ilan/teklif katmanı" etiketi (Faz 0'daki gibi).
- Ana sayfa **ilan vitrini**: öne çıkan/sponsorlu (`is_featured` + `featured_until>now`) ilanlar bandı.

## 6. SEO uygulaması (Faz 0 kararı, şimdi uygula)

- `/ilan/[slug]` → `robots: { index:false, follow:true }` (noindex,follow). JSON-LD `Offer` kalır.
- `/ilanlar` → index; filtreli URL (`?city=&product=&type=`) → `canonical` base `/ilanlar` + `noindex` (faceted duplicate önleme).
- Tekil ilan sitemap'e EKLENMEZ (mevcut durum doğru).

## 7. Config / seed

- `site_settings`'e `listing_featured_pricing` default kaydı (seed SQL — `004_site_settings`'e değil, idempotent INSERT ... ON DUPLICATE; veya admin default). Şekil:
  `{"daily":{"days":1,"price":0},"weekly":{"days":7,"price":0},"monthly":{"days":30,"price":0}}` (TL=0 placeholder, Orhan dolduracak).
- Yeni env'ler `.env.example`'a: `SMS_PROVIDER`, `SMS_API_KEY`, `SMS_SENDER`.

## 8. Tamamlanınca

- `bun run build` (backend+frontend+admin) temiz.
- Lokal `db:seed:*:fresh` ile doğrula (root erişimi çözülünce).
- Çeklistteki 🟢 maddeleri `[x]` + 2026-06-05 işaretle.
- Claude review (🟣) + VPS route doğrulama bekler. **Deploy edilmez** — tüm fazlar bitince topluca deploy (Orhan kararı).

## 9. Kapsam dışı (yapma)

Faz 3 işlem komisyonu/aracılık · "şikayet et" moderasyon (Faz 2+ opsiyonel, istenmedi) · hal ETL/fiyat tablolarına herhangi bir yazma.
