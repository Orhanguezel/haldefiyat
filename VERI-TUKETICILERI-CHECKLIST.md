# Audit Komuta Merkezi & Veri Tüketicileri Checklist

> **Oluşturma:** 2026-05-28 • **Genişletme:** 2026-05-28 (komuta merkezi kararı)
> **Bağlam:** `/admin/audit` tek komuta merkezi olacak. Ham loglar + Ads kampanya takibi + gün gün tüm metrikler + mobil/masaüstü oranı + geo harita + veri tüketicileri (API key/widget/scraper) hepsi tek sayfada.
> **Karar (Orhan, 28 May):** **Audit = tek komuta merkezi.** `/admin/analytics` (M11.5) içeriği audit sekmelerine taşınır, sonra `/admin/analytics` kaldırılır. Ortak veri tek backend endpoint'ten beslenir — **kod/sorgu tekrarı YASAK** (tarim CLAUDE.md kuralı).

---

## ⚠️ EN KRİTİK NOT — Veri zaten var, yeniden yazma

İstenen metriklerin **çoğu zaten hesaplanıyor**, sadece başka sayfada (`/admin/analytics`). Codex bunları SIFIRDAN yazmamalı; mevcut endpoint'leri audit sekmelerine **bağlamalı**.

| İstenen | Zaten var mı? | Kaynak endpoint |
|---|---|---|
| Ads kampanya/source/medium | ✅ Var | `GET /admin/analytics/ads-attribution?range=` |
| Mobil/tablet/masaüstü split | ✅ Var | `GET /admin/analytics/overview` → `.devices[]` |
| Gün gün akış (request/insan/ads/uniqueIP) | ✅ Var | `overview.daily[]` **ve** `audit/metrics/daily` (mükerrer!) |
| Özet kartlar (insan/bot, direct%, B2B IP) | ✅ Var | `overview.summary` |
| Top landing / referrer | ✅ Var | `overview.topLandingPages`, `.topReferrers` |
| Funnel / retention / heatmap | ✅ Var | `analytics/funnel`, `/retention`, `/heatmap` |
| Ham request log | ✅ Var | `audit/request-logs` |
| Auth olayları | ✅ Var | `audit/auth-events` |
| Geo (ülke/şehir) | ✅ Var | `audit/geo-stats` |
| **Ads gün gün, kampanya bazlı** | ❌ Yok | YENİ (Bölüm 4.2) |
| **Cihaz gün gün** | ❌ Yok | YENİ (Bölüm 5.2) |
| **Widget gömenler / scraper IP** | ❌ Yok | YENİ (Bölüm 7) |

> **`overview.daily` vs `audit/metrics/daily` mükerrer:** İkisi de `audit_request_logs`'u güne göre toplar. Komuta merkezinde **tek kaynağa** indir (öneri: analytics overview'i ana kaynak yap, audit metrics/daily'yi Günlük sekmesi için genişlet veya emekliye ayır — Bölüm 3).

---

## 🗺️ Hedef Yapı — /admin/audit (Komuta Merkezi)

```
/admin/audit
├─ Genel       → özet kartlar: insan/bot, mobil/masaüstü %, Ads IP, newsletter, direct%, B2B IP
├─ İstekler    → ham request log (mevcut) + referer/bot kolonu (Bölüm 2)
├─ Auth        → giriş/kayıt olayları (mevcut)
├─ Günlük      → gün gün TÜM metrikler: request, insan, bot, ads, uniqueIP, status dağılımı (tablo+grafik)
├─ Ads         → kampanya/source/medium + gclid + gün gün kampanya kırılımı + funnel
├─ Cihaz       → mobil/tablet/masaüstü % (toplam + gün gün) + saatlik heatmap
├─ Harita      → ülke/şehir geo (genişletilmiş: tablo + top liste)
└─ Tüketiciler → API key sahipleri + widget gömenler + yoğun veri çekenler
```

---

## 👥 İş Bölümü

- 🧠 **Claude (Mimar):** Sekme bilgi hiyerarşisi, hangi metrik nerede, mükerrer endpoint konsolidasyonu, yeni SQL aggregation tasarımı, endpoint kontratı, kabul kriterleri.
- 🤖 **Codex (Implementer):** Sekme kodlaması, mevcut analytics endpoint'lerini audit RTK Query'ye bağlama, yeni endpoint + repository SQL, analytics sayfası kaldırma, deploy.
- 👤 **Orhan (Operasyonel):** Scraper eşiği kararı, API key tier kararı, "bu IP partner mı scraper mı" yorumu, sekme önceliği.

**🚫 Codex'e VERİLMEYECEK (Claude/Orhan kararı):**
- Scraper eşiği ("kaç istek/gün üstü scraper")
- IP engelleme / rate-limit düşürme
- API key tier fiyatlandırması
- Mükerrer endpoint'ten hangisinin emekliye ayrılacağı (Claude kararı)

---

## 0. Acil Fix ✅ TAMAMLANDI 2026-05-28
- [x] Audit TDZ çökmesi (`const ALL` taşındı) — commit `5370600`, canlıda. Tablar artık geziliyor.
- [x] Tüm audit + analytics backend endpoint'leri 200 doğrulandı.

---

## 1. Komuta Merkezi İskeleti 🏗️

### 1.1 Sekme altyapısı (🧠 Claude → 🤖 Codex)
- [ ] `admin-audit-client.tsx` `normalizeAdminAuditTab`'a yeni tablar ekle: `general`, `daily`, `ads`, `device` (mevcut: requests, auth, metrics→`daily` ile birleştir, map).
- [ ] URL state korunur (`?tab=ads` vb.), her sekme kendi query'sini `skip` ile lazy çeker (mevcut pattern).
- [ ] `range` (7d/30d/90d) ortak filtre — analytics `AnalyticsRange` ile audit `days` paramını tek kontrole indir.

### 1.2 Analytics endpoint'lerini audit'e bağla (🤖 Codex)
- [ ] Mevcut `analytics-admin-endpoints.ts` hook'ları (`useGetAnalyticsOverviewAdminQuery` vb.) audit client'ta kullanılabilir — RTK Query zaten paylaşımlı. **Yeni endpoint yazma**, mevcutları çağır.

---

## 2. "İstekler" Sekmesi — ham log (mevcut, cila) 🔧
- [ ] `referer` ayrı sortable kolon + "sadece dış referer" filtresi (kendi domaini hariç).
- [ ] Bot rozeti: UA regex `bot|crawl|spider|python|curl|wget|http|axios|go-http`.
- [ ] `path_prefix` filtresi (şu an sadece metrics'te) + presetler: "Widget", "Fiyat API", "Export".

---

## 3. "Günlük" Sekmesi — gün gün tüm loglar 📅
> Mevcut `metrics` tab + `overview.daily` birleşir.
- [ ] **Mükerrer çöz:** `overview.daily` ana kaynak; `audit/metrics/daily`'yi ya genişlet ya emekliye ayır (Claude kararı, tek sorgu kalsın).
- [ ] Gün gün tablo kolonları: tarih, toplam request, insan, bot, ads, unique IP, hata (4xx/5xx) sayısı.
- [ ] (🤖 Codex) Günlük status dağılımı kolonu için `getStatusDistributionAdmin` zaten var — güne göre kıran varyant gerekiyorsa Bölüm 3'e SQL ekle.
- [ ] Grafik: mevcut `AuditDailyChart` genişletilir (insan + ads + uniqueIP + hata çizgileri).

---

## 4. "Ads" Sekmesi — kampanya takibi 📣
> En çok istenen: "Ads kampanyalarını burdan kontrol/takip etmeliyim."
- [ ] (🤖 Codex) Mevcut `ads-attribution` (kampanya/source/medium toplam) kartı.
- [ ] **YENİ (4.2):** `GET /admin/analytics/ads-daily?range=` — gün gün, kampanya bazlı pageview + unique IP. SQL: `WHERE gclid<>'' GROUP BY DATE(created_at), utm_campaign`.
- [ ] gclid taşıyan ham istekleri "İstekler" sekmesine derin link (filtre: `utm_campaign=X`).
- [ ] Ads→Newsletter dönüşüm funnel'ı (mevcut `analytics/funnel` + `summary.newsletterAdsCapturePct`).
- [ ] Aktif kampanya özeti: bugün/dün/7g Ads IP, maliyet notu (Orhan manuel girer — Ads API Faz 2).

---

## 5. "Cihaz" Sekmesi — mobil/masaüstü oranı 📱
> "Mobil masaüstü girenlerin yüzdesini göreyim."
- [ ] (🤖 Codex) Mevcut `overview.devices[]` → mobil/tablet/masaüstü pasta/bar + yüzde.
- [ ] **YENİ (5.2):** Cihaz gün gün trend — `GROUP BY DATE(created_at), device` (UA regex mevcut: `mobile|android|iphone|ipod` / `ipad|tablet` / else desktop).
- [ ] Saatlik heatmap (mevcut `analytics/heatmap`) bu sekmeye taşınır.
- [ ] Ads trafiği cihaz kırılımı (gclid + device) — "Ads %78 mobil" doğrulaması canlı görünür.

---

## 6. "Harita" Sekmesi — geo genişletme 🌍
- [ ] Mevcut `AuditGeoMap` + altına **ülke/şehir tablosu** (top 50, istek sayısı, unique IP).
- [ ] Şehir bazlı kırılım (TR içi iller) — `geo-stats` `city` kolonu zaten var.
- [ ] "Sadece insan / sadece bot" toggle (UA regex).

---

## 7. "Tüketiciler" Sekmesi — bizden veri alanlar 🔑🧩🤖

### 7.1 Kanal A — API key sahipleri
> Backend `GET /admin/api-keys` + tier endpoint **zaten var** (`backend/src/modules/api-keys/index.ts`). UI yok.
- [ ] RTK Query: `adminListApiKeys`, `adminSetApiKeyTier` (`endpoints/admin/api-keys-admin-endpoints.ts`).
- [ ] Tablo: kullanıcı (email), key_prefix, tier badge, `used_today/daily_limit`, last_used_at, revoked.
- [ ] Tier free↔pro değiştir. (Revoke endpoint yoksa Bölüm 9.)

### 7.2 Kanal B — widget gömen siteler
- [ ] **YENİ:** `GET /admin/audit/widget-embedders?days=30`. SQL:
  ```sql
  SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(referer,'/',3),'//',-1) AS host,
         COUNT(*) hits, COUNT(DISTINCT ip) unique_ips, MAX(created_at) last_seen
  FROM audit_request_logs
  WHERE path='/api/v1/prices/widget' AND referer<>'' AND created_at>=NOW()-INTERVAL ? DAY
  GROUP BY host ORDER BY hits DESC LIMIT 100;
  ```
- [ ] Kendi domainleri (haldefiyat/bereketfide/vistaseeds) "iç" işaretle.

### 7.3 Kanal C — anonim scraper / yoğun veri çeken
- [ ] Eşik kararı (🧠 öner → 👤 Orhan onay): örn. 7g'de >500 fiyat-endpoint isteği VEYA bot-UA.
- [ ] **YENİ:** `GET /admin/audit/data-pullers?days=7&min_hits=500`. SQL: `WHERE path LIKE '/api/v1/prices%' GROUP BY ip,user_agent HAVING hits>=? ` + bot flag + `/prices/export` sayacı + geo.

---

## 8. Analytics Sayfası Kaldırma + Temizlik 🧹
> Tüm içerik audit sekmelerine taşındıktan SONRA.
- [ ] `/admin/analytics/page.tsx` sil.
- [ ] Sidebar'dan "Analytics" item kaldır; "Audit" → "Audit & Analytics" (veya "Komuta Merkezi") olarak yeniden adlandır.
- [ ] `permissions.ts` + locale temizliği (admin_panel/CLAUDE.md §11 — nav/permission senkron).
- [ ] Backend analytics endpoint'leri KALIR (audit sekmeleri onları kullanıyor) — sadece frontend sayfa kalkar.
- [ ] Dashboard'da analytics linki varsa audit'e yönlendir.

---

## 9. Opsiyonel — Derin Korelasyon (Faz 2) 🔬
- [ ] `audit_request_logs`'a `api_key_id` kolonu (**ALTER YASAK** — seed CREATE TABLE'a ekle + `db:seed:fresh`). `apiKeyAuthHook` key id'sini `req`'e koyuyor.
- [ ] API key revoke endpoint'i.
- [ ] Per-key günlük kullanım grafiği (Tüketiciler sekmesi).

---

## Önerilen Sıra
1. **Bölüm 0** ✅ (bitti)
2. **Bölüm 1** (sekme iskeleti) — temel, her şey buna oturur
3. **Bölüm 5 (Cihaz) + Bölüm 4 (Ads)** — en çok istenen, veri zaten var, hızlı kazanım
4. **Bölüm 3 (Günlük)** — mükerrer konsolidasyon
5. **Bölüm 7 (Tüketiciler)** — yeni backend endpoint'ler; A (API key) en hızlı
6. **Bölüm 6 (Harita) + Bölüm 2 (İstekler cila)**
7. **Bölüm 8** (analytics kaldırma) — EN SON, taşıma bitince
8. **Bölüm 9** — faturalama gündeme gelirse

## İlgili Dosyalar
- Audit UI: `admin_panel/src/app/(main)/admin/(admin)/audit/_components/admin-audit-client.tsx`
- Audit alt bileşen: `.../audit/_components/{audit-daily-chart,audit-geo-map}.tsx`
- Analytics UI (kaldırılacak): `admin_panel/src/app/(main)/admin/(admin)/analytics/page.tsx`
- Analytics endpoint (frontend): `admin_panel/src/integrations/endpoints/analytics-admin-endpoints.ts`
- Analytics backend: `backend/src/modules/analytics/index.ts` (overview/ads/funnel/retention/heatmap)
- Audit modülü (shared): `packages/shared-backend/modules/audit/` (`admin.routes.ts`, controller, schema)
- API key backend: `backend/src/modules/api-keys/` + şema `backend/src/db/seed/sql/026_api_keys_schema.sql`
- Widget endpoint: `backend/src/modules/prices/router.ts:225`
- Audit şema kolonları: gclid, utm_source/medium/campaign/content, user_agent, referer, country, city, status_code, response_time_ms
- İlgili: `MONETIZASYON-CHECKLIST.md`
