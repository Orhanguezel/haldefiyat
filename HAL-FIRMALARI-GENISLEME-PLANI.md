# Genişleme Planı — Hal Firmaları / Komisyoncu Rehberi + B2B Müşteri Tabanı

> **Karar:** Orhan, 2026-05-29. Kaynak incelemesi: [hal-yeni-kaynaklar.md](./hal-yeni-kaynaklar.md)
> **Rol:** Claude = mimari/plan/strateji · Codex = implementasyon · Orhan = operasyon/satış/hukuki
> **Microservis:** GEREKMEZ (halkatalogu.com anti-bot'suz, server-rendered; düz fetch + parse).

## 1. Vizyon & İş Modeli

halkatalogu.com'daki **tüm hal komisyoncu/firmalarını** (~2.500–4.000) çekip, sitemizde yeni bir
başlık altında **firma kartları** ile yayınlamak. Bu firmalar aynı zamanda **müşteri/lead havuzumuz**:
- **Reklam** (sponsorlu kart, öne çıkarma, banner)
- **Sponsorluk** (kategori/il sponsorluğu, "bu hali X sundu")
- **Premium profil** (genişletilmiş bilgi, galeri, doğrudan iletişim)
- **Diğer anlaşmalar** (veri/lead paylaşımı, ortak içerik)

Yani: SEO/trafik motoru (dizin) + B2B satış hunisi (CRM) + monetizasyon (sponsorluk) tek genişlemede.

## 2. Kaynak Özeti (doğrulandı)

| Konu | Bulgu |
|---|---|
| Erişim | Anti-bot YOK, server-rendered, `fetch` + gzip yeter |
| İl listesi | `/il/{slug}` (81 il, dropdown slug'ları) |
| **Pagination** | ⚠️ `?sayfa=N` **SAHTE** (aynı 39 firma döner). Tam kapsama → ilçe+kategori alt-sayfaları taranır |
| İlçe/kategori | `/il/{slug}/{ilce}`, `/il/{slug}/{kategori}` (firma süper-kümesi burada) |
| Firma detay | `/hal/{id}-{slug}` → ad, yetkili, adres, telefon (METİN), foto `/img/hal/{id}.jpg` |
| Ek dizinler | `/soguk-hava-depolari`, `/nakliyeciler`, `/zirai-ilac` (firma tipleri) |

## 3. Mimari

**Microservis yok.** hal-fiyatlari backend'inde 2 yeni modül (firms ETL + firms CRM), frontend'de
yeni public bölüm, admin_panel'de CRM. Fiyat ETL pattern'i birebir.

### DB (seed SQL'e CREATE — ALTER yok)
- `hf_firms` — id, external_id (UNIQUE, /hal/{id}), slug, name, contact_person, phone, address,
  city_slug, district_slug, photo_url, source_url, firm_type ENUM(komisyoncu/soguk_hava/nakliye/zirai_ilac),
  categories JSON, is_active, first_seen_at, last_seen_at, raw JSON, created/updated.
- `hf_firm_deals` (CRM) — id, firm_id FK, status ENUM(lead/contacted/negotiating/won/lost),
  deal_type ENUM(reklam/sponsorluk/premium/diger), value DECIMAL, currency, owner, notes TEXT,
  contacted_at, next_action_at, created/updated.
- `hf_firm_sponsorships` (aktif ödemeli yerleşim) — id, firm_id, tier, placement (il/kategori/global),
  starts_at, ends_at, is_active.

### Backend modülleri
- `modules/firms/` — fetcher (il+ilçe+kategori tarama, dedup external_id, upsert, last_seen stale),
  repository, public router (`GET /firms`, `/firms/:slug`, `/firms?city=&district=&type=&q=`),
  admin (`POST /admin/firms/etl/run`, CRM CRUD, sponsorship CRUD).

### Frontend (public)
- `/firmalar` — dizin (il/ilçe/kategori filtre + arama + harita)
- `/firma/{slug}` — firma profil/kart sayfası (LocalBusiness schema)
- Her `/hal/{market}` sayfasına "Bu haldeki firmalar" bölümü
- `FirmaKarti` component (logo, ad, il/kategori, iletişim CTA, **sponsorlu rozeti**)

### Admin (CRM + monetizasyon)
- Firma listesi + ETL tetik + stale (kaybolan firma) raporu
- Firma → deal paneli (status funnel, deal_type, value, notes, next action)
- Sponsorluk yönetimi (öne çıkarma süresi/yerleşimi)
- Dashboard: lead funnel + aktif sponsorluk geliri

---

## 4. FAZLAR + ÇEKLİST

### Uygulama Durumu (Codex, 2026-05-29)

- [x] FAZ 1 veri modeli eklendi: `hf_firms`, `hf_firm_deals`, `hf_firm_sponsorships`.
- [x] FAZ 1 backend modülü eklendi: `backend/src/modules/firms/`.
- [x] Halkatalogu liste parser dry-run doğrulandı: Adana ana sayfasından firma linkleri çıkarılıyor.
- [x] Halkatalogu detay parser dry-run doğrulandı: ad, yetkili, adres, şehir/ilçe ve foto alanları çıkarılıyor.
- [x] Public API eklendi: `GET /api/v1/firms`, `GET /api/v1/firms/:slug`.
- [x] Admin API eklendi: `POST /api/v1/admin/firms/etl/run`, stale raporu, temel deal kayıt uçları.
- [x] Cron eklendi: haftalık delta + aylık tam firma rehberi taraması.
- [x] Backend typecheck temiz: `bun run typecheck`.
- [x] FAZ 2 public frontend eklendi: `/firmalar`, `/firma/{slug}`, `FirmaKarti`, nav, sitemap ve `/hal/{market}` firma bölümü.
- [x] Frontend typecheck temiz: `bun x tsc --noEmit`.
- [x] FAZ 3 başlangıç admin paneli eklendi: `/admin/firmalar` liste, filtre, ETL dry-run/il tetik, stale raporu.
- [x] Admin panel typecheck temiz: `bun x tsc --noEmit`.
- [x] Canlı deploy yapıldı: yeni DB tabloları oluşturuldu, backend/frontend/admin build alındı ve `hal-backend`, `hal-frontend`, `hal-admin` restart edildi.
- [x] Canlı smoke: Adana limit=5 ETL başarılı (`inserted=5`), `/api/v1/firms?city=adana` veri döndü, `/firmalar` 200, örnek `/firma/3063-adana-hal-adana-sebze-hali` 200, `/admin/firmalar` 200, sitemap firma URL içeriyor.

### FAZ 0 — Keşif & Doğrulama *(önce bu; planın temelini kesinleştirir)*
- [ ] **[Claude]** Gerçek pagination/load-more mekanizmasını çöz: il sayfasının JS'inde AJAX endpoint var mı? `?page=`/`?p=`/`offset=` çalışıyor mu? Yoksa kapsama yalnızca ilçe+kategori union'ı ile mi tam olur?
- [ ] **[Claude]** İlçe + kategori alt-link setini bir il için çıkar → union firma sayısı ana sayfadan fazla mı (kapsama testi)
- [ ] **[Claude]** Firma detay alan haritası (HTML selector'leri: ad/yetkili/adres/telefon/foto/kategori) — parser spec
- [ ] **[Claude]** Tüm 81 il slug + 3 ek dizin (`soguk-hava/nakliye/zirai-ilac`) enumerasyon listesi
- [ ] **[Orhan]** ToS/hukuki: kamuya açık dizin ama 3. taraf içeriği — toplu çekim + ticari yayın + atıf kararı. Marka konumlandırma ("HalDeFiyat Firma Rehberi" başlığı)
- [ ] **[Claude]** Bu plana göre Codex implementasyon brief'i (FAZ 1-2) yaz

### FAZ 1 — Veri Modeli + ETL *(backend)*
- [x] **[Codex]** Seed SQL: `hf_firms` + `hf_firm_deals` + `hf_firm_sponsorships` (CREATE TABLE)
- [x] **[Codex]** schema.ts drizzle tabloları
- [x] **[Codex]** `modules/firms/fetcher.ts` — il+ilçe+kategori tarama, external_id dedup, nazik rate-limit (~500ms), gzip, retry, UA
- [x] **[Codex]** `repository.ts` — external_id upsert (idempotent), last_seen_at, stale tespiti
- [x] **[Codex]** Admin ETL endpoint `POST /admin/firms/etl/run` (il bazlı + all)
- [x] **[Codex]** `cron.ts` — aylık tam tarama + haftalık delta
- [ ] **[Claude]** ETL çıktısını review (kapsama, dedup, alan kalitesi)

### FAZ 2 — Public Frontend *(dizin + kart)*
- [x] **[Codex]** `/firmalar` dizin sayfası (il/ilçe/kategori filtre, arama, sayfalama, harita opsiyonel)
- [x] **[Codex]** `FirmaKarti` component (logo, ad, il/kategori, iletişim CTA, sponsorlu rozeti)
- [x] **[Codex]** `/firma/{slug}` profil sayfası + `LocalBusiness`/`Organization` JSON-LD
- [x] **[Codex]** `/hal/{market}` sayfasına "Bu haldeki firmalar" bölümü
- [x] **[Codex]** Nav'a "Firmalar" başlığı + PageContainer standardı
- [x] **[Codex]** Sitemap'e firma URL'leri (interlock: boş/eksik firma noindex — thin guard)
- [ ] **[Claude]** SEO/altitude review (başlık/şema/iç link)

### FAZ 3 — CRM / İş Geliştirme *(admin_panel)*
> ⚠️ admin_panel Codex'in aktif alanı — yeni route'lar AYRI dosyalarda
- [x] **[Codex]** Admin `/admin/firmalar` liste + filtre + ETL tetik + stale raporu
- [ ] **[Codex]** Firma → deal paneli (status funnel: lead→contacted→negotiating→won/lost, deal_type, value, notes, next_action)
- [ ] **[Codex]** CRM API (deal CRUD) + dashboard (funnel + aktif gelir) — ilk create/list deal endpoint'leri ve özet sayaçları backend'de hazır; admin UI detay paneli eksik.
- [ ] **[Orhan]** İlk outreach listesi (görüşülen firmalar) + deal kayıtları

### FAZ 4 — Monetizasyon
- [ ] **[Codex]** Sponsorluk yönetimi (öne çıkarma: il/kategori/global, süre)
- [ ] **[Codex]** Sponsorlu kart sıralaması + rozet (dizinde üst sıra)
- [ ] **[Codex]** Premium profil (genişletilmiş bilgi/galeri) + reklam alanı slotları
- [ ] **[Codex]** "İletişime geç" lead capture formu (firma → bize, veya kullanıcı → firma)
- [ ] **[Orhan]** Fiyatlandırma paketleri (reklam/sponsorluk/premium) + sözleşme şablonu

### FAZ 5 — Launch & Büyütme
- [ ] **[Orhan]** GSC: firma sitemap'i gönder + ilk sayfalar request indexing
- [ ] **[Orhan]** Satış: sponsorluk outreach (Atakan sektör ağı ile)
- [ ] **[Claude/Codex]** İzleme: indexlenme + lead funnel + sponsorluk geliri

---

## 5. Riskler / Dikkat
- **Kapsama:** pagination sahte → ilçe+kategori union'ı şart; FAZ 0'da kapsama testi yapılmadan ETL'e geçme.
- **ToS/hukuki:** toplu çekim + ticari kullanım Orhan onayı + atıf gerektirir.
- **Veri tazeliği:** firmalar kapanır/değişir → last_seen stale tespiti + aylık tam tarama.
- **Kalite:** eksik/boş firma kayıtları noindex (thin guard) — dizini sulandırmasın.
- **CRM gizliliği:** deal/iletişim verisi admin-only, KVKK uyumu (firma iletişim verisi).
- **admin_panel çakışması:** Codex audit'te aktif → firma admin'i ayrı dosyalarda.

## 6. Sonraki Adım
FAZ 0 (keşif) — pagination/kapsama mekanizmasını ben çözeyim + Codex FAZ 1-2 brief'ini yazayım.
Orhan paralelde ToS/marka kararını versin. Onay sonrası Codex FAZ 1 (DB+ETL) ile başlar.
