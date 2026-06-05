# İlan + Canlı Borsa Modülü — Detaylı Çeklist

> **Durum:** Tasarım onaylandı (2026-06-05). Veri modeli yazıldı
> (`backend/src/db/seed/sql/035_listings_schema.sql`).
> Codex brief: Faz 0 → [`ILAN-BORSA-CODEX-BRIEF.md`](./ILAN-BORSA-CODEX-BRIEF.md) · Faz 1-2 → [`ILAN-BORSA-CODEX-BRIEF-2.md`](./ILAN-BORSA-CODEX-BRIEF-2.md)
>
> **Rol etiketleri:** 🟣 **Claude** (mimari/karar/review) · 🟢 **Codex** (implementasyon) ·
> 🔵 **Orhan/Atakan** (operasyon, seed, saha ağı, sağlayıcı kararı)
>
> Bir madde tamamlandığında `[ ]` → `[x]` yap ve yanına tarih düş.

## 0. Tez (değişmez referans)

Resmi hal fiyatı **referanstır** ve dokunulmazdır. Modül, bu resmi veri çerçevesinde
**üretici ile komisyoncuyu buluşturan ayrı bir ilan/teklif katmanıdır.**

**Somut senaryo:** Antalya'da serada 100 ton karpuzu olan çiftçi ürününü satamıyor.
Kars'taki komisyoncu o karpuzu görse alacak — ama birbirlerinden haberleri yok.
Modülün işi: bu ikisini **ürün + bölge** üzerinden bir araya getirmek.

**İki hedef:**
1. **Buluşturma (matchmaking):** Coğrafyalar arası arz↔talep. Üretici=satış ilanı,
   komisyoncu/alıcı=alım ilanı (örn. Karslı komisyoncu "Antalya'da 100 ton karpuz alırım").
2. **Gelir:** Komisyonculardan **reklam/sponsorluk** + ilan sahibinden **öne çıkarma ücreti.**
   (Bir komisyoncuya teklif verildi, olumlu yaklaştı — gelir hattı Faz 0'dan aktif.)

### ⛔ KESİN AYRIM — ilan fiyatı ≠ hal fiyatı
Çiftçi/komisyoncunun ilana girdiği fiyat **resmi hal fiyat istatistiklerine ASLA
karışmaz.** `hf_price_history`/ETL'e yazılmaz, hal ortalamalarını etkilemez. İlanlar
resmi hal verisinin **yanında, açıkça ayrı etiketle** ("İlan/Teklif") gösterilir.
Resmi hal fiyatı her zaman bağımsız referans kalır.

**Onaylanan kararlar:** İki taraflı İlan+Buluşturma · Giriş: Web+Telegram+Asistanlı ·
Fiyat: Hibrit (sabit/pazarlik/hal_endeksli) · Gelir: sponsorluk + öne çıkarma (Faz 0'dan).

**Çerçeve:** Tek `ilan` havuzu — üretici=satış, komisyoncu/alıcı=alım. **Yeni rol yok**:
herhangi bir üye ilan açar, taraf ayrımı `hf_listings.party_role` ile (shared `user_roles`'a dokunma).
Reuse: `auth`, `profiles`, `telegram`, `newsletter`, `notifications`, `orders`;
modül iskeleti + **sponsorluk/CRM** `backend/src/modules/firms/`
(`hf_firm_sponsorships`, `hf_firm_deals`) birebir kardeşi.

---

## Faz 0 — Temel pazar (ilan CRUD + birleşik il sayfası)

### 0.1 Veritabanı & üyelik
- [x] 🟣 `035_listings_schema.sql` yazıldı (hf_listings, images, inquiries, phone_verifications) — 2026-06-05
- [x] 🟣 **Karar (2026-06-05): yeni rol YOK.** `user_roles` shared enum'a DOKUNULMAZ (cross-project risk yok). Herhangi bir **üye** ilan açabilir; üretici/komisyoncu/alıcı ayrımı ilan bazında `hf_listings.party_role` ile tutulur. Mevcut `customer` rolü/standart üyelik yeterli.
- [ ] 🟢 `bun run build && db:seed:*:fresh` ile 035 şemayı lokalde doğrula (FK'ler hf_products/hf_firms'e bağlanıyor mu) — 2026-06-05 not: 3 build geçti; fresh seed yıkıcı olduğu için çalıştırılmadı. `--no-drop --only=035,036` geçti; FK zinciri (`hf_products`, `hf_firms`), `hf_listings_borsa_idx` ve `listing_featured_pricing` DB'den doğrulandı.
- [ ] 🔵 Lokal doğrulama sonrası VPS deploy kararı (git akışı, fresh seed = veri kaybı → onay gerek)

### 0.2 Backend — `modules/listings/` (firms modülü kardeşi)
- [x] 🟣 Endpoint kontratı + validation şeması review — 2026-06-05 (kod review ile birlikte onaylandı)
- [x] 🟢 `schema.ts` — Drizzle tablo tipleri (hf_listings + 3 yardımcı tablo) — 2026-06-05
- [x] 🟢 `repo.ts` — list (filtre: il/ilçe/ürün/tip/durum + pagination), getBySlug, create, update, softClose, incrementView — 2026-06-05
- [x] 🟢 `controller.ts` — public + owner + admin handler'ları, `handleRouteError`/`parsePage` reuse — 2026-06-05
- [x] 🟢 `router.ts` — `/api/v1/listings` (public) + `/api/v1/admin/listings` (requireAuth+requireAdmin) — 2026-06-05
- [x] 🟢 `slug.ts` — `{urun}-{il}-{id}` üretimi, çakışma guard — 2026-06-05
- [x] 🟢 Fiyat sıhhat kapısı: create/update'te hal fiyatından %X sapan ilan → `is_suspicious=1` (eşik brief'te) — 2026-06-05
- [x] 🟢 `registerListings` route'u `src/routes.ts`/`app.ts`'e ekle (v1 prefix kuralı) — 2026-06-05
- [x] 🟢 Cron: süresi geçen ilanları `expired` yap (`backend/src/cron.ts`'e job) — 2026-06-05
- [x] 🟣 Kod review (firms deseninden sapma, kod tekrarı, 200 satır/dosya kuralı) — 2026-06-05: kesin kurallar tutuldu (v1 prefix, hal'e yazma yok, yeni rol yok, hardcode yok, admin guard routes.ts:13-14). Owner-patch ürün-sıfırlama bug'ı + minor'lar (sabit→priceMin zorunlu, priceMax≥priceMin, inquiries try/catch) **düzeltildi ve doğrulandı** — 2026-06-05. ✅ Faz 0 backend deploy'a hazır.

### 0.3 Frontend — public sayfalar
- [x] 🟣 Wireframe / UX kararları — 2026-06-05 (Brief #2 §UX): mobil tek sütun kart, sıralama fiyat+miktar+il öne; telefon CTA büyük "Ara/WhatsApp" buton; `hide_phone` ise "Teklif Ver" formu. Filtre: il+ürün+tip chip'leri, mobilde collapse.
- [x] 🟢 `/[locale]/(public)/ilanlar/page.tsx` — liste + filtre (il/ilçe/ürün/tip), `<PageContainer>` kullan — 2026-06-05
- [x] 🟢 `/[locale]/(public)/ilan/[slug]/page.tsx` — detay + teklif/iletişim formu (`hide_phone` ise telefon gizli) — 2026-06-05
- [x] 🟢 `/[locale]/(public)/ilan-ver/page.tsx` — ilan verme formu (Faz 0: auth'lu, OTP Faz 1) — 2026-06-05
- [x] 🟢 `/[locale]/(public)/(dashboard)/hesabim/ilanlarim` — kullanıcının ilanları + durum — 2026-06-05
- [x] 🟢 **Birleşik il sayfası**: mevcut il sayfasına ilan bloğu (resmi hal fiyatı + komisyoncu + ilan tek sayfada, ilanlar **ayrı etiketli**) — modülün vitrin değeri — 2026-06-05
- [x] 🟢 **Coğrafyalar arası keşif**: ürün bazlı görünüm — bir ürün için TÜM bölgelerdeki satış + alım ilanları (Antalya karpuzu ↔ Kars komisyoncusu). Alım ilanında `city_slug`=hedef bölge (ürünün olduğu yer), alıcının kendi konumu firmadan gelir. — 2026-06-05
- [x] 🟣 Eşleştirme bildirimi tasarımı — 2026-06-05 (Brief #2 §Eşleştirme): moderation APPROVE anında tetik; eşleşme anahtarı `product_id + city_slug` + zıt `listing_type`. Kanal: telegram (chat_id varsa) + newsletter segment; opt-in; kullanıcı başına günlük cap. Faz 1'de implement.

### 0.4 Admin panel
- [x] 🟢 `/admin/(admin)/ilanlar/` — liste + moderasyon (pending→approved/rejected), öne çıkarma toggle, sil — 2026-06-05
- [x] 🟢 İlan istatistik özeti (active/pending/rejected sayıları) — firms admin deseni — 2026-06-05
- [x] 🟢 Inquiry (teklif) listesi görüntüleme — 2026-06-05

### 0.5 SEO
- [x] 🟣 İndexleme stratejisi — 2026-06-05 (Brief #2 §SEO): tekil `/ilan/[slug]` → **`noindex, follow`** (ince/uçucu içerik, süresi dolunca kaybolur; follow ile equity birleşik sayfaya akar). `/hal/[slug]` + ürün sayfaları index (ilan bloğu zenginleştirir). `/ilanlar` index ama filtreli URL (`?city=&product=`) → canonical base + noindex. Tekil ilan sitemap'e GİRMEZ (Codex zaten eklemedi ✅).
- [x] 🟢 İlan detayına JSON-LD (`Offer`/`Product`) + canonical — 2026-06-05
- [x] 🟢 sitemap'e ilan içeren birleşik il/ürün sayfaları — 2026-06-05 (tekil ilan eklenmedi; mevcut hal sitemap'i birleşik il sayfalarını kapsamaya devam ediyor)

### 0.6 Operasyon — soğuk start
- [ ] 🔵 Atakan ağıyla ilk 200-300 ilanı `source='assisted'` seed (likiditeyi "dolu" göster)
- [ ] 🔵 Mevcut firma dizinine (~3-4K komisyoncu) "claim et + alım ilanı ver" daveti
- [x] 🟣 Asistanlı seed admin akışı — 2026-06-05 (Brief #2 §Asistanlı): admin `POST /admin/listings` zaten var (source='assisted', createdBy=admin, status=approved seçilebilir). Owner `user_id=NULL`, kişi üye değil → `contactName/contactPhone` zorunlu; kişi sonra üye olursa firma-claim deseniyle sahiplenebilir. Admin panele "İlan adına gir" formu eklenir.

### 0.7 Gelir hattı (🔵 birincil hedef — Faz 0'dan aktif)
> Komisyoncudan **sponsorluk/reklam** + ilan sahibinden **öne çıkarma ücreti**.
> Bireysel premium/AdSense gated kalır — bu B2B gelir ondan ayrı, şimdi açık (firma sponsorluk planının devamı).
- [ ] 🔵 İlk sponsorluk teklifini kapat (olumlu yaklaşan komisyoncu) → `hf_firm_deals` CRM kaydı
- [x] 🟢 Öne çıkarma satışı **manuel akış**: offline ödeme alınınca admin `is_featured`+`featured_until` set eder (online ödeme Faz 1) — 2026-06-05
- [x] 🟢 Öne çıkan ilanlar liste/anasayfa/il sayfasında üstte + "Sponsorlu/Öne çıkan" rozeti — 2026-06-05 (liste/il sayfası)
- [x] 🟢 Sponsorluk yerleşimi: `hf_firm_sponsorships` (il/kategori/global) reuse — komisyoncu reklamı il/ürün sayfasında — 2026-06-05 (mevcut firma sponsorluk sorgusu korunarak birleşik il sayfasında reuse)
- [x] 🟣 Öne çıkarma paketleri — 2026-06-05: `site_settings.listing_featured_pricing` JSON şekli: `{"daily":{"days":1,"price":<TL>},"weekly":{"days":7,"price":<TL>},"monthly":{"days":30,"price":<TL>}}`. `featured_until` = pakete göre +1/+7/+30 gün (Codex `days` map'i hazır). TL fiyatlarını Orhan girer.
- [ ] 🔵 Paket TL fiyatlarını belirle (günlük/haftalık/aylık) → site_settings'e gir

---

## Faz 1 — Düşük sürtünme & büyüme

- [ ] 🔵 SMS sağlayıcı kararı (Netgsm/İletimerkezi) + maliyet onayı — kod sağlayıcı-agnostik adapter ile hazır, **canlıya alma sana bağlı**
- [x] 🟣 OTP akış tasarımı — 2026-06-05 (Brief #2 §OTP): 6 hane kod, TTL 5dk, kod **hash'li** saklanır; rate-limit aynı telefona 60sn'de 1 / günde 5; max 5 yanlış deneme; doğrulama → kısa ömürlü imzalı token → ilan POST `phone_verified=1`. Telefon TR-normalize. Sağlayıcı adapter `SMS_PROVIDER`/`SMS_API_KEY` env; sağlayıcı yoksa dev-log.
- [x] 🟢 OTP endpoint'leri (`/listings/otp/send`, `/listings/otp/verify`) + web formu entegrasyonu — 2026-06-05
- [x] 🟣 Telegram parse tasarımı — 2026-06-05 (Brief #2 §Telegram): serbest metin → ürün (`hf_products.aliases` eşleme) + il (`turkey-city-slugs`) + miktar/birim (regex sayı+ton/kg/kasa) + fiyat (sayı+TL); "alıyorum/alım" → `alim`, varsayılan `satis`. Eksik alanda bot format mesajı döner. `source='telegram'`, `status='pending'`, chat_id→profil eşleşirse `user_id` bağla.
- [x] 🟢 Telegram bot handler: serbest metin → `source='telegram'` taslak ilan (`status='pending'`) — 2026-06-05
- [x] 🟢 Öne çıkarma **self-serve online ödeme** (Faz 0 manuel akışını otomatikleştir) — `orders` modülü reuse. ⚠️ Ödeme sağlayıcı (Iyzipay) bağımlılığı 🔵 — kod hazır olur, canlıya alma sağlayıcı onayına bağlı. — 2026-06-05
- [x] 🟢 İlan alarmı / **eşleştirme bildirimi**: ürün+bölge bazlı newsletter+telegram (yeni satış→arayan komisyoncuya, yeni alım→o bölgedeki üreticiye) — 2026-06-05

---

## Faz 2 — Canlı arz/talep panosu (resmi hal'den AYRI katman)

> Bu pano **ilanların özetidir**, hal fiyatını değiştirmez. Resmi hal fiyatı üstte
> bağımsız referans; altında ilan arz/talep özeti **ayrı etiketle** gösterilir.
```
DOMATES — Antalya
├─ Resmi hal fiyatı (ETL):  18–22 ₺/kg     ← dokunulmaz referans
├─ Satış ilanları:          medyan + en iyi 3   (listing_type='satis')   ┐ AYRI
├─ Alım ilanları:           medyan + en iyi 3   (listing_type='alim')    ┘ katman
└─ İlan arz/talep makası + ilan sayısı + son güncelleme
```
- [x] 🟣 Pano tasarımı — 2026-06-05 (Brief #2 §Pano): aggregation `product_id + city_slug + listing_type`, sadece `status='approved'` + `valid_until>=today` + `is_suspicious=0` + `price_type IN ('sabit','hal_endeksli')` (pazarlık/fiyatsız medyana girmez). Hal tablolarına YAZMA yok, sadece okuma.
- [x] 🟣 **Manipülasyon eşiği kararı** — 2026-06-05: Medyan ancak **≥3 aktif fiyatlı ilan** varsa gösterilir (ürün+bölge+tip); <3 ise medyan yok, sadece tekil ilanlar + "N ilan" sayacı (tek-ilan manipülasyonu engellenir). `is_suspicious` eşiği Faz 0'daki **%60** korunur; suspicious ilanlar medyandan **hariç** + panoda gösterilmez (yalnız admin görür). Makas = satış medyanı vs alım medyanı, ikisi de ≥3 ise.
- [x] 🟢 İlan aggregation query (`hf_listings_borsa_idx`): ürün+il için satış/alım medyan + en iyi 3 (sadece `hf_listings`, hal tablolarına dokunmaz) — 2026-06-05
- [x] 🟢 Ürün/il sayfasına ilan arz/talep bloğu (resmi hal referans + satış + alım, ayrı kutular) — 2026-06-05
- [x] 🟢 Ana sayfa ilan vitrini (öne çıkan/sponsorlu ilanlar) — 2026-06-05

---

## Faz 3 — İşlem komisyonu (🔒 düşünce, açılmadı)

> Reklam/sponsorluk + öne çıkarma geliri zaten Faz 0/1'de aktif. Faz 3 yalnızca
> **işlem üzerinden komisyon** (alıcı-satıcı eşleşmesinden pay) — bu hukuki risk taşır.
- [ ] 🔵 Hukuki değerlendirme: işlem komisyonu/aracılık → 5957 sayılı Hal Kanunu kapsamı
- [ ] İşlem komisyonu / teklif-onay akışı (yalnızca hukuki yeşil ışıkla)

---

## Riskler (sürekli akılda)

| Risk | Önlem | Sorumlu |
|---|---|---|
| Hukuki (aracılık) | "İlan platformu" konumu koru, komisyon kapalı | 🔵 |
| Fiyat manipülasyonu | hacim eşiği + medyan + `is_suspicious` | 🟣🟢 |
| Moderasyon ölçeklenmesi | otomatik kural + "şikayet et" | 🟢 |
| İnce içerik SEO | birleşik sayfa indexle, tekil ilan değil | 🟣 |
| İlan bayatlaması | `valid_until` zorunlu + expire cron | 🟢 |

---

## Çakışma kuralı (Codex ↔ Claude)

- Aynı dosyada **aynı anda** ikimiz çalışmayız. Backend modül dosyalarını (`modules/listings/*`)
  Codex yazar; Claude şema + brief + review yapar.
- Codex deploy ettikten sonra Claude VPS'te `grep` ile doğrular (geçmişte Codex paralel deploy override yaşandı).
- Deploy **sadece git** ile (rsync/scp YASAK). ALTER YASAK — şema değişikliği seed SQL'de.
- `bun install` sadece monorepo root'tan. Proje altında `node_modules` YASAK.
