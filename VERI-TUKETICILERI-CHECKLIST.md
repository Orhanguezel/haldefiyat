# Veri Tüketicileri & Audit/Analytics Checklist

> **Oluşturma:** 2026-05-28
> **Bağlam:** Admin panelde "bizden hizmet alan / widget koyan / veri çeken kim varsa" görünür olsun. Ayrıca `/admin/audit` ve `/admin/analytics` sayfalarını iyileştir.
> **Neden:** Monetizasyon fazına (MONETIZASYON-CHECKLIST.md) hazırlık + B2B lead tespiti. Kim verimizi çekiyor / widget'ımızı sitesine koyuyor bilmeden ne fiyatlandırma ne de partner ilişkisi kurulabilir.

---

## 🎯 Stratejik Bağlam

"Bizden veri alan" üç ayrı kanaldan gelir; üçü de **zaten kayıt altında**, sadece admin panelde **toplu görünüm yok**:

| Kanal | Kim | Veri kaynağı (mevcut) | Admin UI |
|---|---|---|---|
| **A. API key sahipleri** | Kayıtlı tüketiciler (free/pro tier) | `hf_api_keys` tablosu + `GET /admin/api-keys` | ❌ Yok |
| **B. Widget gömenler** | Sitesine `/prices/widget` koyanlar | `audit_request_logs.referer` (path=`/api/v1/prices/widget`) | ❌ Yok |
| **C. Anonim scraper / veri çeken** | API key'siz yüksek hacimli IP'ler | `audit_request_logs` (path `/api/v1/prices*`, `/prices/export`) | Kısmi (genel top-ips var, path-filtreli yok) |

**Önemli teknik gerçek:** `audit_request_logs`'ta `api_key` kolonu YOK — bir isteği doğrudan API key'e bağlayamıyoruz. API key kullanımı ayrı izlenir (`hf_api_keys.last_used_at`, `used_today`). Korelasyon istenirse şema değişikliği gerekir (bkz. Bölüm 6).

---

## 👥 İş Bölümü

- 🧠 **Claude (Mimar):** Veri modeli kararları, hangi metrik/eşik scraper sayılır, SQL aggregation tasarımı, endpoint kontratı, UI bilgi hiyerarşisi, kabul kriterleri.
- 🤖 **Codex (Implementer):** Spec'lenmiş backend endpoint + repository SQL, admin panel sayfa/tab kodlaması, RTK Query endpoint, deploy.
- 👤 **Orhan (Operasyonel):** "Bu IP scraper mı yoksa partner mı" yorumu, API key tier yükseltme kararı, partner ile iletişim, fiyatlandırma kararı (Faz 2).

**🚫 Codex'e VERİLMEYECEK (Claude/Orhan kararı):**
- "Kaç istek/gün üstü scraper sayılır" eşiği (iş kararı)
- Bir IP'yi engelleme / rate-limit düşürme kararı (operasyonel risk)
- API key tier fiyatlandırması ve free/pro limitleri (monetizasyon kararı)

---

## 0. Acil Fix ✅ TAMAMLANDI 2026-05-28

- [x] **Audit sayfası çöküyordu, tablar gezilemiyordu** — `admin-audit-client.tsx`'te `const ALL` render sırasında çalışan `authParams` useMemo'sundan SONRA tanımlıydı → TDZ "Cannot access 'ALL' before initialization" → tüm sayfa render'da crash. Sabit ilk kullanımdan öne taşındı. (commit `5370600`, canlıda)
- [x] Backend audit endpoint'leri doğrulandı: `auth-events`, `request-logs`, `metrics/daily`, `geo-stats` → hepsi 200.
- [x] Backend analytics endpoint'leri doğrulandı: `overview`, `ads-attribution`, `funnel`, `retention`, `heatmap` → hepsi 200.

---

## 1. Audit + Analytics Sayfa İyileştirmeleri 🔧

### 1.1 Audit sayfası — UX (🧠 Claude tasarım → 🤖 Codex)
- [ ] `requests` tab'inde `referer` kolonu şu an satır altında küçük metin; veri-çeken tespiti için **ayrı sortable kolon** + "sadece dış referer" filtresi (kendi domaini hariç).
- [ ] `user_agent` kolonu sadece `lg:` ekranda görünür — bot tespiti için mobilde de erişilebilir bir "bot mu?" rozeti (UA'da `bot|crawl|spider|python|curl|wget|http` regex).
- [ ] `path_prefix` filtresini `requests` tab'ine de ekle (şu an sadece metrics'te) — `/api/v1/prices` ile filtreleme tek tık olsun.
- [ ] Hızlı preset butonları: "Widget istekleri", "Fiyat API", "Export indirenler".

### 1.2 Analytics sayfası — eksik kırılımlar (🧠 Claude → 🤖 Codex)
- [ ] Mevcut sayfa Ads/funnel/retention odaklı (M11.5). "Veri tüketimi" kırılımı yok. Bölüm 2-4'teki yeni veriyi **buraya yeni kart/sekme** olarak mı ekleyeceğiz yoksa ayrı `/admin/data-consumers` sayfası mı → **Orhan kararı** (öneri: ayrı sayfa, audit'e tab eklemek karmaşıklaştırır).

---

## 2. Kanal A — API Key Sahipleri (Kayıtlı Tüketiciler) 🔑

> Backend `GET /api/v1/admin/api-keys` + `POST /api/v1/admin/api-keys/:id/tier` **zaten var** (`backend/src/modules/api-keys/index.ts`). Sadece admin UI eksik.

### 2.1 RTK Query endpoint (🤖 Codex)
- [ ] `admin_panel/src/integrations/endpoints/admin/` altına `api-keys-admin-endpoints.ts`: `adminListApiKeys` (query), `adminSetApiKeyTier` (mutation).
- [ ] Tip + normalize `shared/api-keys/` altında (proje barrel disiplinine uy — admin_panel/CLAUDE.md §3-4).
- [ ] `hooks.ts` explicit export.

### 2.2 Admin sayfası (🧠 Claude hiyerarşi → 🤖 Codex)
- [ ] `/admin/api-keys/page.tsx` + `_components/api-keys-client.tsx`.
- [ ] Tablo: kullanıcı (email — user_id join gerekebilir), key_prefix, tier badge, `used_today / daily_limit`, last_used_at, durum (revoked mı).
- [ ] Aksiyon: tier free↔pro değiştir (mevcut endpoint), revoke (endpoint YOKSA Bölüm 6'ya ekle).
- [ ] Sidebar + permission + locale (admin_panel/CLAUDE.md §11) — yeni nav item.

### 2.3 Doğrulama (👤 Orhan)
- [ ] Test API key oluştur (kullanıcı tarafı akışı), panelde göründüğünü + last_used güncellendiğini doğrula.

---

## 3. Kanal B — Widget Gömen Siteler 🧩

> Sinyal: `/api/v1/prices/widget` isteğinin `referer` header'ı = widget'ı barındıran 3. parti sitenin URL'i. En temiz "bizden hizmet alan" sinyali budur.

### 3.1 Backend aggregation endpoint (🧠 Claude SQL → 🤖 Codex)
- [ ] Yeni endpoint: `GET /api/v1/admin/audit/widget-embedders?days=30`.
- [ ] SQL taslağı (referer host'a göre grupla):
  ```sql
  SELECT
    SUBSTRING_INDEX(SUBSTRING_INDEX(referer,'/',3),'//',-1) AS host,
    COUNT(*) AS hits,
    COUNT(DISTINCT ip) AS unique_ips,
    MAX(created_at) AS last_seen
  FROM audit_request_logs
  WHERE path = '/api/v1/prices/widget'
    AND referer IS NOT NULL AND referer <> ''
    AND created_at >= NOW() - INTERVAL ? DAY
  GROUP BY host
  ORDER BY hits DESC
  LIMIT 100;
  ```
- [ ] Kendi domainlerini (haldefiyat.com, bereketfide, vistaseeds) hariç tut / "iç" diye işaretle.

### 3.2 Admin UI (🤖 Codex)
- [ ] `/admin/data-consumers` sayfasında "Widget Gömen Siteler" kartı: host, hit, unique IP, son görülme, dış link.

---

## 4. Kanal C — Anonim Scraper / Veri Çekenler 🤖

> Sinyal: API key'siz, kısa sürede yüksek hacimli `/api/v1/prices*` veya `/prices/export` isteği atan IP'ler. Bot UA + yüksek istek = otomatik veri çekme.

### 4.1 Eşik kararı (🧠 Claude öner → 👤 Orhan onayla)
- [ ] "Scraper şüphesi" eşiği: örn. son 7 günde > 500 fiyat-endpoint isteği YA DA bot-UA. **Orhan onayı gerekli** (yanlış pozitif riski — gerçek yoğun kullanıcı olabilir).

### 4.2 Backend endpoint (🤖 Codex)
- [ ] `GET /api/v1/admin/audit/data-pullers?days=7&min_hits=500`.
- [ ] SQL: `WHERE path LIKE '/api/v1/prices%' GROUP BY ip, user_agent HAVING hits >= ? ORDER BY hits DESC` + bot-UA flag + geo (mevcut country/city kolonları).
- [ ] `/prices/export` indirme sayısı ayrı kolon (en agresif sinyal).

### 4.3 Admin UI (🤖 Codex)
- [ ] `/admin/data-consumers`'ta "Yoğun Veri Çekenler" tablosu: IP, UA (bot rozeti), toplam hit, export sayısı, geo, son görülme.

---

## 5. Birleşik Sayfa (öneri) 📊

- [ ] `/admin/data-consumers` — 3 bölüm: (A) API Key'ler, (B) Widget Gömenler, (C) Yoğun Veri Çekenler. Tek bakışta "bizden kim ne kadar veri alıyor".
- [ ] Sidebar'a "Veri Tüketicileri" item (permission: admin).

---

## 6. Opsiyonel — Derin Korelasyon (Faz 2) 🔬

> Sadece API key bazlı kullanım raporu / faturalama gerekirse.

- [ ] `audit_request_logs`'a `api_key_id` kolonu ekle (seed SQL'e — **ASLA ALTER lokalde**, CREATE TABLE'a ekle + `db:seed:fresh`). `apiKeyAuthHook` doğrulanan key id'sini `req`'e koyuyor, logger oradan yazar.
- [ ] API key revoke endpoint'i (Bölüm 2.2 için gerekiyorsa).
- [ ] Per-key günlük kullanım grafiği.

---

## Önerilen Sıra

1. **Bölüm 0** ✅ (bitti — audit fix canlıda)
2. **Bölüm 2** (API key UI) — backend hazır, en hızlı kazanım, "kayıtlı tüketici" netleşir
3. **Bölüm 3** (widget gömenler) — tek endpoint + tek kart, yüksek değer (partner tespiti)
4. **Bölüm 4** (scraper tespiti) — eşik kararı Orhan'dan gelince
5. **Bölüm 5** (birleşik sayfa) — 2-4 bittikçe doğal olarak oluşur
6. **Bölüm 1** (UX cila) — paralel/sona
7. **Bölüm 6** — sadece faturalama gündeme gelirse

## İlgili Dosyalar
- Audit UI: `admin_panel/src/app/(main)/admin/(admin)/audit/_components/admin-audit-client.tsx`
- Analytics UI: `admin_panel/src/app/(main)/admin/(admin)/analytics/page.tsx`
- API key backend: `backend/src/modules/api-keys/` (`index.ts`, `plugin.ts`, `repository.ts`)
- API key şema: `backend/src/db/seed/sql/026_api_keys_schema.sql`
- Audit modülü (shared): `packages/shared-backend/modules/audit/` (`admin.routes.ts`, schema, controller)
- Widget endpoint: `backend/src/modules/prices/router.ts:225`
- İlgili: `MONETIZASYON-CHECKLIST.md` (bu veri monetizasyon kararlarını besler)
