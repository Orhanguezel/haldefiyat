# haldefiyat.com — Repo Denetim & İyileştirme Raporu

**Tarih:** 2026-06-10
**Kapsam:** `projects/hal-fiyatlari/` (backend, frontend, admin_panel, docs, deploy)
**Yöntem:** 4 fazlı denetim (Keşif → Denetim → Strateji → Görev Planı), 4 paralel inceleme + manuel doğrulama. Kod DEĞİŞTİRİLMEDİ, salt analiz.
**Not:** Bulgular dosya:satır ile kanıtlandı. Doğrulanamayanlar açıkça "doğrulanamadı" olarak işaretlendi.

---

## 1. Yönetici Özeti

**Genel sağlık notu: C+** — İş mantığı ve mimari olgun (B+), ancak **public repoda commit edilmiş canlı credential'lar** (Kritik) ve **neredeyse sıfır test + sıfır CI** notu aşağı çekiyor.

Sistem üretimde stabil çalışan, config-driven, iyi tasarlanmış bir ETL + REST API + SSR platformu. Dokümantasyon kalitesi sektör ortalamasının çok üstünde. Buna karşılık üç yapısal risk var:

**En büyük 3 risk:**
1. **Canlı JWT secret + MySQL şifresi PUBLIC GitHub reposunda** — 4 takip edilen dosyada ve git geçmişinde. Admin API forge edilebilir, DB'ye doğrudan erişim mümkün (lokal bind olsa da savunma katmanı tek).
2. **Kritik iş mantığı (30+ HTML parser, fiyat normalizasyonu) tamamen testsiz** — kaynak siteler HTML değiştirdiğinde regresyon ancak üretimde fark ediliyor; tüm repoda 1 test dosyası var.
3. **CI/CD yok** — lint/typecheck/test hiçbir yerde zorlanmıyor; deploy disiplini tamamen insan hafızasına (CLAUDE.md kurallarına) bağlı.

**En büyük 3 fırsat:**
1. Secret rotasyonu + git geçmişi temizliği — 1 günlük iş, Kritik riski sıfırlar.
2. ETL parser'larına fixture-tabanlı test — kaydedilmiş HTML örnekleriyle ucuz, getirisi çok yüksek.
3. `force-dynamic` → seçici ISR — sunucu yükünü ciddi azaltır, %78 mobil Ads trafiğinde TTFB iyileşir.

---

## 2. Repo Haritası

**Amaç:** Türkiye hal (toptancı) fiyatlarını 22+ resmi/yarı-resmi kaynaktan günlük ETL ile toplayıp haldefiyat.com'da yayınlayan platform. Gelir öncesi "mükemmelleştirme" fazında; SEO + Google Ads trafiği aktif. Olgunluk: **üretimde canlı servis** (prototip değil).

**Stack:** Bun + Fastify 5 + Drizzle ORM + MySQL (backend) · Next.js 16 + React 19 + Tailwind v4 + next-intl (frontend) · Next.js + Redux Toolkit/RTK Query + Biome (admin) · PM2 + Nginx + VPS deploy · Monorepo workspace (`@agro/shared-*` paketleri ayrı git reposunda).

| Dizin | Açıklama |
|---|---|
| `backend/src/modules/etl/` | ETL çekirdeği: fetcher (2.305 satır), scraper-client, normalizer |
| `backend/src/config/etl-sources.ts` | 22+ kaynağın merkezi tanımı (564 satır) |
| `backend/src/modules/prices/` | Fiyat sorgu katmanı (repository 1.324 satır) |
| `backend/src/cron.ts` | 14+ zamanlanmış iş (ETL, alerts, health, rapor) |
| `frontend/src/app/[locale]/(public)/` | 65 sayfa/layout, 13 dinamik route |
| `frontend/src/lib/api.ts` | Fallback'li fetch wrapper'ları |
| `admin_panel/src/integrations/` | RTK Query endpoint'leri + 1.092 satırlık shared barrel |
| `docs/`, kök `*.md` | Checklist/plan/rapor arşivi (çok zengin) |
| `mcp/`, `sosialmedia/` | Yan araçlar (MCP server, sosyal medya operasyonu) |

**Şaşırtan şeyler:** (1) Bu kalitede bir üretim sisteminde tek test dosyası olması; (2) operasyonel dokümantasyonun (CLAUDE.md) credential içerecek kadar "dürüst" olması; (3) kullanılmayan 4 backend bağımlılığı (argon2, fast-jwt, mnemonist, steed).

---

## 3. Denetim Raporu

### 3.1 Güvenlik

| # | Bulgu | Yer | Neden Önemli | Önem |
|---|---|---|---|---|
| G1 | **Canlı JWT secret ve MySQL şifresi PUBLIC repoda commit'liydi** (gerçek — `gh repo view`: `"isPrivate": false` doğrulandı) | `CLAUDE.md:139,263` · `OTURUM-BRIEF-OLCUM-FUNNEL.md:63` · `backend/scripts/firm-contact-vision.py:97` · `backend/scripts/firm-phone-ocr.py:63` + git geçmişi | JWT secret ile admin token forge edilebilir (ETL trigger, fiyat yazma, moderasyon). DB şifresi 127.0.0.1 bind'a rağmen savunmayı tek katmana indirir. | **Kritik** |
| G2 | XSS: `dangerouslySetInnerHTML` ile CMS/makale HTML'i sanitize edilmeden render ediliyor (gerçek) | `frontend/src/components/LegalPageContent.tsx:36` · `frontend/src/app/[locale]/(public)/analiz/[slug]/page.tsx` | İçerik admin kaynaklı olduğundan saldırı yüzeyi dar; ama admin hesabı ele geçirilirse tüm ziyaretçilere stored XSS olur. | Yüksek |
| G3 | Frontend `xlsx ^0.18.5` — bilinen advisory'li sürüm aralığında (prototype pollution / ReDoS, <0.19.3) (gerçek; sömürülebilirlik kullanıcı girdisi XLSX parse edilip edilmediğine bağlı — tam akış doğrulanmadı) | `frontend/package.json:30` | Backend zaten 0.20.3 CDN sürümünde; frontend geride. | Yüksek |
| G4 | Backend'de güvenlik başlıkları yok (X-Frame-Options, X-Content-Type-Options, HSTS, CSP) (gerçek; nginx katmanında ekleniyor olabilir — VPS config repo dışında, doğrulanamadı) | `backend/src/app.ts:27-72` | Defense-in-depth eksiği; clickjacking/MIME sniffing yüzeyi. | Orta |
| G5 | `GET /api/v1/hal/etl/sources` auth'suz — ETL kaynak konfigürasyonunu (URL/endpoint'ler) dışarı veriyor (gerçek) | `backend/src/modules/hal-admin/index.ts:570-572` | Keşif (recon) bilgisi sızıyor; secret yok ama gereksiz görünürlük. | Orta |
| G6 | Localhost rate-limit muafiyeti — VPS'te aynı kutudan sınırsız istek mümkün (gerçek, kasıtlı tasarım) | `backend/src/app.ts:71` | SSR'ın çalışması için gerekli; risk düşük ama bilinçli kabul edilmeli. | Orta/Düşük |
| G7 | JWT TTL değeri shared-backend'de — bu repodan doğrulanamadı | `backend/src/plugins/authPlugin.ts` (re-export) | Uzun TTL çalınan token'ın ömrünü uzatır. Kontrol edilmeli. | Orta (doğrulanamadı) |

**Sağlıklı olanlar:** SQL injection riski pratikte yok (Drizzle ORM + parametrize raw SQL), admin route'lar `requireAuth`/`requireAdmin` ile korunuyor, rate limit + API key tier mevcut, `.env` dosyaları commit edilmemiş, JSON-LD render'ı güvenli desen, upload yüzeyi dar.

### 3.2 Mimari & Tasarım

| # | Bulgu | Yer | Neden Önemli | Önem |
|---|---|---|---|---|
| M1 | `fetcher.ts` 2.305 satır — 30+ parser + orkestrasyon + multi-step fetch tek dosyada (gerçek, `wc -l` doğrulandı; CLAUDE.md'nin kendi 200 satır kuralının 11,5 katı) | `backend/src/modules/etl/fetcher.ts` | Her yeni kaynak bu dosyayı büyütüyor; merge çakışması ve yanlış parser'a dokunma riski artıyor. En sıcak değişiklik noktası burası. | Yüksek |
| M2 | `prices/repository.ts` 1.324 satır, `firms/repository.ts` 844, `hal-admin/index.ts` 788 (gerçek) | ilgili dosyalar | Sorgu katmanı tek god-file; okunabilirlik ve test edilebilirlik düşüyor. | Orta |
| M3 | Parser'lar arası yoğun copy-paste (tablo çıkar → satır filtrele → min/max/avg hesapla deseni 30+ kez) (gerçek) | `fetcher.ts:106-1700` | Ortak davranış değişikliği (ör. header filtresi) çok yerde elle güncelleme gerektiriyor. | Orta |
| M4 | `parseResponse()` 40 case'lik dev switch (gerçek) | `fetcher.ts:51-90` | Registry/map deseni ile O(1) eklenebilirlik mümkün; mevcut hali çalışıyor ama büyümeye ters. | Orta |
| M5 | DB'de foreign key yok (`hf_price_history.productId/marketId` → FK tanımsız) (gerçek) | `backend/src/db/schema.ts` | Orphan satır oluşabilir; bütünlük uygulama koduna emanet. | Orta |
| M6 | Cron işlerinde overlap kilidi yok (gerçek; pratikte run süreleri kısa — kanaat: risk düşük) | `backend/src/cron.ts:36-101` | Uzun backfill + ardışık job çakışması teorik olarak çift yazma/yük üretebilir. | Düşük |

### 3.3 Kod Kalitesi & Tip Güvenliği

| # | Bulgu | Yer | Önem |
|---|---|---|---|
| K1 | 8 adet `@ts-expect-error` ile Bun'a özgü TLS opsiyonu — üretim Node.js'te bu ayarlar sessizce yok sayılır; hangi runtime'da çalıştığına göre davranış değişir (gerçek; üretim etkisi doğrulanmadı) | `fetcher.ts:990, 1133, 1159, 1188, 1208, 1633, 1655, 1741` | Orta |
| K2 | `app.ts`'de storage ayarı hatası sessiz yutulur, null fallback belirsiz | `backend/src/app.ts:84-89` | Düşük |
| K3 | `any` kullanımı genel olarak çok az (güçlü yön); birkaç istisna `analysis/weekly-report.ts`, `press-pr/index.ts` | — | Düşük |
| K4 | Frontend'de 600+ satır bileşenler: `PriceTable.tsx` (631), `FirmOwnerForm.tsx` (550) | `frontend/src/components/ui/PriceTable.tsx` vb. | Orta |
| K5 | Auto-register ürün slug'ları varyantları birleştirmiyor ("Domates (Yerli)" / "(İthal)" ayrı ürün açabilir; canonical_slug ile sonradan düzeltiliyor) | `fetcher.ts:2120-2165` | Orta |

### 3.4 Test — **en çıplak alan**

- **Tüm repoda 1 test dosyası:** `frontend/src/lib/analytics.test.ts` (doğrulandı, `find` ile). Backend: 0 test, test runner bile tanımlı değil (`backend/package.json`'da test script yok). Admin: 0 test.
- **En kritik iş mantığı — 30+ HTML/text parser, fiyat normalizasyonu, `fetchWithFallback` tarih geri-gitme mantığı — tamamen testsiz.** Kaynak site HTML'i değiştiğinde tek güvence üretimdeki ETL health script'i (post-mortem tespit, pre-deploy değil). **Önem: Kritik.**
- Vitest altyapısı frontend'de hazır (`vitest.config.ts` + jsdom) — genişletme maliyeti düşük.

### 3.5 Performans

| # | Bulgu | Yer | Önem |
|---|---|---|---|
| P1 | **Layout seviyesinde `force-dynamic`** — root + locale + public layout'larda; tüm public sayfalar her istekte SSR, ISR/static hiç yok (gerçek, 20+ kullanım) | `frontend/src/app/layout.tsx:2`, `[locale]/layout.tsx:1`, `(public)/layout.tsx:1` | Yüksek |
| P2 | Sitemap her istekte canlı API'den üretiliyor (force-dynamic + no-store, 10s timeout); API down → boş sitemap riski | `frontend/src/app/sitemap.ts` | Orta |
| P3 | `hf_etl_runs` için retention/cleanup yok — sınırsız büyüme (~8K+ satır/yıl, firma ETL'le daha fazla) | `backend/src/cron.ts` (eksik job), `db/schema.ts:125` | Orta* |
| P4 | `latestRecordedDate()` aynı istek döngüsünde 4+ kez çağrılabiliyor (memoization yok) | `prices/repository.ts:26,135,212,365,884` | Orta |
| P5 | hal.gov.tr sayfalama sequential await (sayfa başına ~30s Scrapling timeout riski) | `fetcher.ts:1850-1875` | Düşük |
| P6 | `hf_price_history`'de tarih-öncelikli composite index yok (tek kolonlu `recordedDate` index'i geniş range'lerde zayıf) | `db/schema.ts:84` | Düşük |

*P3 backend ajanı "Kritik" dedi; büyüme hızı (yılda on binlerce satır) MySQL için yıllarca sorun değil — **Orta** olarak kalibre edildi. Ucuz çözümü var, yapılmalı ama acil değil.

**İyi yapılmış:** recharts/framer-motion/xlsx dynamic import (bundle dışı), `overviewStats` Promise.all paralel, CTE'li latest-price sorguları, Cloudinary + `images.unoptimized` bilinçli kararı.

### 3.6 Bağımlılıklar

| # | Bulgu | Önem |
|---|---|---|
| B1 | **4 kullanılmayan backend bağımlılığı** (grep ile doğrulandı, import yok): `argon2`, `fast-jwt`, `mnemonist`, `steed` | Orta |
| B2 | `xlsx` iki farklı sürüm/kaynak: backend SheetJS CDN 0.20.3 (güvenli), frontend npm ^0.18.5 (advisory'li) | Yüksek (bkz. G3) |
| B3 | `zod` sürüm ayrışması: backend/shared ^3, frontend ^4 (frontend'de import bulunamadı — muhtemelen ölü bağımlılık) | Düşük |
| B4 | Çift hash kütüphanesi görünümü (argon2 + bcryptjs) — argon2 zaten kullanılmıyor, kaldırınca çözülür | Düşük |

### 3.7 DevEx & Operasyon

| # | Bulgu | Önem |
|---|---|---|
| D1 | **CI/CD yok** — `.github/workflows` ne projede ne monorepo kökünde (doğrulandı). Lint/typecheck/test/build hiçbir kapıda zorlanmıyor. | Yüksek |
| D2 | Frontend Sentry: paket yüklü (`@sentry/nextjs`), init kodu yok → ölü ağırlık + frontend hataları izlenmiyor. Backend Sentry kurulu ama DSN env'de boş görünüyor (VPS .env doğrulanamadı). | Orta |
| D3 | `deploy.sh` sağlam (`set -euo pipefail`, doğru pm2 restart/reload ayrımı) — güçlü yön. Ama tetikleme tamamen manuel. | Düşük |
| D4 | Frontend'de lint zorlaması zayıf (`next lint` minimal); admin Biome ile katı — iki app arasında tutarsızlık. | Düşük |
| D5 | Kök dizin kirliliği: `x.md` (untracked), `xotomasyonu.pdf`, Coverage zip'leri, 10+ checklist/rapor MD kökte. `git status`'ta modified/deleted dosyalar bekliyor. | Düşük |

### 3.8 Dokümantasyon

Bu boyut **sağlıklı ve ortalamanın çok üstünde** — README doğru, CLAUDE.md operasyonel bilgi açısından olağanüstü detaylı, checklist disiplini güçlü. Tek ciddi sorun: dokümanların içine **gerçek credential yazılmış olması** (G1) ve kökteki doküman yığılması (D5).

### 3.9 Güçlü Yönler (korunmalı)

1. **Config-driven ETL** — 22+ kaynak tek merkezi tanımda, env override'lı, hardcoded URL yok; yeni kaynak ekleme yolu net.
2. **Dayanıklılık desenleri** — Scrapling→legacy fallback, tarih geri-gitme (`fetchWithFallback`), hata toplama + partial status, IndexNow/alert hatalarının ETL'i durdurmaması.
3. **Frontend fallback disiplini** — API down olsa sayfa 500 vermez; build-time timeout'lar tanımlı.
4. **SEO altyapısı** — dinamik OG image, JSON-LD (Dataset/FAQ/Breadcrumb/Article), dinamik sitemap, canonical/noindex mantığı.
5. **Tip güvenliği** — `any` neredeyse yok, parser'lar `unknown` + narrowing ile yazılmış.
6. **Operasyonel dokümantasyon ve deploy script kalitesi.**
7. **Ağır paketlerin lazy-load edilmesi** (recharts, framer-motion, xlsx).

---

## 4. İyileştirme Stratejisi

### Tema 1 — "Güvenlik hijyeni dokümantasyon kültürünün kurbanı olmuş"
Olağanüstü doküman disiplini, credential'ların da dokümana yazılmasına yol açmış. **Hedef durum:** Repoda (ve geçmişinde) sıfır canlı secret; komut örnekleri `$DB_PASS` gibi placeholder kullanır. **İlke:** Doküman örnekleri kopyala-çalıştır olabilir ama secret'ı env'den okur.

### Tema 2 — "Tek güvence üretim; güvenlik ağı yok"
Test yok + CI yok + izleme yarım → her değişikliğin doğrulaması üretimde. ETL gibi "dış dünya her an kırabilir" bir sistemde bu en pahalı yer. **Hedef durum:** Parser'lar fixture HTML'lerle test edilir; CI'da typecheck+test+lint kapısı; Sentry frontend dahil aktif. **İlke:** Dış kaynak davranışı kontrol edilemez, ama parser davranışı kayıt altına alınabilir.

### Tema 3 — "Büyüme tek dosyalara akıyor"
fetcher.ts/repository.ts her yeni özellikle büyüyor; 200 satır kuralı kendi reposunda 11x aşılmış. **Hedef durum:** `etl/parsers/<kaynak>.ts` + registry; repository sorgu gruplarına bölünmüş. **İlke:** Yeni kaynak eklemek = yeni dosya eklemek, mevcut dosyayı büyütmek değil.

### Tema 4 — "Her şey her istekte dinamik"
force-dynamic + dinamik sitemap + cache'siz tekrar sorgular → gereksiz sunucu yükü. **Hedef durum:** Fiyat sayfaları kısa ISR (300-900s), statik sayfalar uzun ISR, sitemap cache'li. **İlke:** Veri günde 1-2 kez değişiyorsa sayfanın her istekte üretilmesi gerekmez.

### Bilinçli olarak YAPILMAYACAKLAR
- **FK migration'ları şimdi değil** — ALTER yasağı gereği fresh seed gerektirir; üretimde veri kaybı riski getirisi aşıyor. Bir sonraki zorunlu fresh seed'e iliştirilmeli.
- **Parser'ların tamamını generic factory'ye çevirmek** — kaynak HTML'leri gerçekten farklı; aşırı soyutlama debug'ı zorlaştırır. Sadece dosya bölme + ortak util yeterli.
- **Admin panel state mimarisini değiştirmek** (Redux+Zustand birleştirme) — çalışıyor, ayrım mantıklı, dokunma.
- **Kapsamlı e2e test altyapısı** — bu olgunlukta maliyet/fayda tutmuyor; birim + fixture testleri öncelik.
- **Cron overlap kilidi** — run süreleri kısa, risk teorik; izlemeye devam.

### "Bitti" tanımı (ölçülebilir sinyaller)
- `git grep` + geçmişte canlı secret = 0; VPS'te yeni secret'lar aktif.
- CI: PR'da typecheck + test + lint geçmeden merge yok.
- ETL parser test kapsamı: en az aktif 10 kaynak için fixture testi; `bun test` backend'de çalışır.
- Layout'larda `force-dynamic` yok; Kritik bulgu sayısı 0.

---

## 5. Görev Planı

### Milestone 0 — Güvenlik Ağı (önce bu)

| Görev | Dosyalar | Kabul Kriteri | Efor | Risk |
|---|---|---|---|---|
| **T0.1 Secret rotasyonu** — VPS'te yeni JWT_SECRET + MySQL şifresi üret, .env güncelle, pm2 restart | VPS .env, `backend/scripts/firm-*.py` (env'den okusun) | Eski secret'la üretilen JWT reddediliyor; eski DB şifresi çalışmıyor | S | Orta (oturumlar düşer — planlı yap) |
| **T0.2 Repo temizliği** — 4 dosyadan secret'ları placeholder'a çevir; git geçmişini temizle (BFG/`git filter-repo`) + force push; GitHub secret scanning aç | `CLAUDE.md`, `OTURUM-BRIEF-OLCUM-FUNNEL.md`, `backend/scripts/firm-contact-vision.py:97`, `firm-phone-ocr.py:63` | `git log -S` her iki secret için boş dönüyor | M | Orta (force push — VPS clone'u resetlenmeli) |
| **T0.3 Backend test runner + ilk parser fixture testleri** — `bun test`, 3-5 kaynak için kaydedilmiş HTML fixture + beklenen satır çıktısı | `backend/package.json`, `backend/test/etl/`, fixtures | `bun test` yeşil; en az 3 parser fixture'la doğrulanıyor | M | Düşük |
| **T0.4 CI iskeleti** — GitHub Actions: typecheck (backend+frontend) + test + frontend lint | `.github/workflows/ci.yml` | PR'da pipeline koşuyor, kırmızıda merge engelli | S | Düşük |

### Milestone 1 — Kritik/Yüksek Düzeltmeler

| Görev | Dosyalar | Kabul Kriteri | Efor | Risk | Bağımlılık |
|---|---|---|---|---|---|
| T1.1 frontend `xlsx` → 0.20.3+ (veya export-only kullanımsa exceljs/csv'ye geçişi değerlendir) | `frontend/package.json` | `bun why xlsx` ≥0.20.2; import eden akış manuel test | S | Düşük | — |
| T1.2 HTML sanitizasyonu — CMS/makale render'ına `sanitize-html`/DOMPurify (isomorphic) katmanı | `LegalPageContent.tsx:36`, `analiz/[slug]/page.tsx` | Script tag'li test içeriği render'da etkisiz | S | Düşük (whitelist'i geniş tut, mevcut içerik bozulmasın) | — |
| T1.3 Güvenlik başlıkları — nginx'te veya `app.ts` onSend hook'unda (önce nginx'te var mı doğrula) | VPS nginx / `backend/src/app.ts` | securityheaders.com'da A- üstü | S | Düşük | — |
| T1.4 `GET /hal/etl/sources`'a auth | `hal-admin/index.ts:570` | Endpoint 401 dönüyor (anonim) | S | Düşük (frontend'in kullanmadığı doğrulanmalı) | — |
| T1.5 Frontend Sentry init (veya paketi kaldır — ikisinden biri) + backend DSN aktivasyonu | `frontend/` Sentry config, VPS .env | Test hatası Sentry'de görünüyor | S | Düşük | — |
| T1.6 JWT TTL doğrulaması (shared-backend) | `packages/shared-backend` auth | TTL ≤ 24h ve refresh akışı belgeli | S | Düşük | — |

### Milestone 2 — Yüksek Kaldıraçlı İyileştirmeler

| Görev | Dosyalar | Kabul Kriteri | Efor | Risk | Bağımlılık |
|---|---|---|---|---|---|
| T2.1 `fetcher.ts` bölme — `etl/parsers/<kaynak>.ts` + responseShape registry map | `fetcher.ts` → ~30 dosya | fetcher.ts < 400 satır; tüm parser testleri yeşil; bir ETL cycle'ı VPS'te sorunsuz | L | **Orta-Yüksek** (canlı ETL — parser testleri ÖNCE yazılmalı: T0.3) | T0.3, T0.4 |
| T2.2 ISR stratejisi — layout'lardan `force-dynamic` kaldır; sayfa bazlı revalidate (fiyat: 300-900s, statik: 3600-86400s); sitemap'a revalidate | `app/layout.tsx`, `[locale]/layout.tsx`, `(public)/layout.tsx`, `sitemap.ts` | Layout'larda force-dynamic 0; fiyat tazeliği ETL sonrası ≤15 dk; TTFB düşüşü ölçüldü | M | Orta (cookie/header okuyan sayfalar dynamic kalmalı — tek tek kontrol) | — |
| T2.3 Parser test kapsamını genişlet — aktif tüm kaynaklar için fixture | `backend/test/etl/fixtures/` | Aktif kaynakların ≥%80'i fixture'lı | M | Düşük | T0.3 |
| T2.4 Kullanılmayan bağımlılıkları kaldır (argon2, fast-jwt, mnemonist, steed; frontend zod kontrol) | `backend/package.json`, `frontend/package.json` | Build + typecheck yeşil | S | Düşük | — |
| T2.5 `hf_etl_runs` retention cron'u (90+ gün → sil/arşivle) | `cron.ts`, yeni `etl/maintenance.ts` | Aylık job çalışıyor, tablo satır sayısı sabitleniyor | S | Düşük | — |
| T2.6 SEO page-key ayrıştırma — "firmalar" key'ini liste/detay/tip için ayır (geçmiş hal_detay collision dersinin devamı) | `firmalar/**/page.tsx`, `lib/seo.ts:213`, backend seo_pages seed | 4 sayfa farklı title/description üretiyor | M | Düşük | — |

### Milestone 3 — Kalite & Cila

| Görev | Kabul Kriteri | Efor |
|---|---|---|
| T3.1 `prices/repository.ts` bölme + `latestRecordedDate()` istek-içi memoization | Dosya <500 satır; tek istekte 1 çağrı | M |
| T3.2 `PriceTable.tsx`/`FirmOwnerForm.tsx` alt bileşenlere bölme | Her dosya <300 satır | M |
| T3.3 Kök dizin düzeni — rapor/checklist MD'leri `docs/` altına, `x.md`/zip/pdf temizliği, git status sıfırlama | Kökte yalnız README/CLAUDE/AGENTS + config | S |
| T3.4 Frontend'e Biome (admin ile ortak config) | CI'da frontend lint kapısı | S |
| T3.5 Bun TLS `@ts-expect-error`'ları runtime-guard'a alma (Node fallback'te davranışı netleştir) | Üretim runtime'ında TLS davranışı belgeli/testli | S |
| T3.6 `hf_price_history` composite index — bir sonraki zorunlu fresh seed'e iliştir | Seed SQL'de index tanımlı | S |
| T3.7 Admin panel için minimum test (Zod şema + kritik endpoint happy-path) | ≥10 test yeşil | M |

### ⚡ Hızlı Kazanımlar (hemen yapılabilir, hepsi S efor)
1. **T0.1 Secret rotasyonu** — en yüksek etki/efor oranı.
2. **T1.4** ETL sources endpoint'ine auth (tek satır hook).
3. **T2.4** 4 ölü bağımlılığın silinmesi.
4. **T1.1** frontend xlsx upgrade.
5. **T2.5** hf_etl_runs retention cron'u.
6. **T3.3** kök dizin temizliği.

### İlk 3 Görev — Uygulama Taslağı

**T0.1 + T0.2 (Secret rotasyonu + geçmiş temizliği):**
1. VPS'te yeni secret üret (`openssl rand -hex 32`), MySQL'de `ALTER USER haldefiyat IDENTIFIED BY '<yeni>'` (DDL değil, ALTER TABLE yasağına girmez), backend `.env` güncelle, `pm2 reload hal-backend`.
2. Python script'leri `os.environ["DB_PASS"]` okuyacak şekilde düzelt; MD'lerde şifreyi `$DB_PASS` placeholder yap.
3. `git filter-repo --replace-text` ile iki secret'ı geçmişten sil → force push → **VPS'te `git fetch && git reset --hard origin/main`** (CLAUDE.md deploy akışıyla uyumlu). Dikkat: force push sonrası diğer clone'lar (Codex sandbox vb.) yeniden klonlanmalı.
4. GitHub Settings → Secret scanning + push protection aç.

**T0.3 (Parser fixture testleri):**
1. `backend/test/etl/fixtures/` altına 3-5 kaynağın gerçek HTML yanıtını kaydet (canlı siteden bir defalık çek).
2. Her parser için: fixture'ı oku → `parseXxxHtml()` çağır → beklenen satır sayısı + örnek satırın name/min/max/avg değerlerini assert et.
3. Gotcha: parser'lar şu an `fetcher.ts` içinden export edilmiyor olabilir — önce sadece `export` ekle (davranış değişikliği yok), büyük bölmeyi (T2.1) sonra yap.
4. `backend/package.json`'a `"test": "bun test"` ekle.

**T2.2 (ISR stratejisi):**
1. Önce envanter: hangi sayfalar `cookies()`/`headers()` okuyor (bunlar dynamic kalmak zorunda) — grep ile çıkar.
2. Layout'lardan `force-dynamic`'i kaldır; dynamic kalması gerekenlere sayfa düzeyinde geri ekle.
3. Fiyat sayfalarına `export const revalidate = 600`, statiklere 3600-86400; `sitemap.ts`'e `revalidate = 3600`.
4. Gotcha: ETL günde 1-2 kez koşuyor — ETL bitiminde `revalidatePath`/`revalidateTag` tetiklenirse tazelik anında sağlanır (cron'dan frontend'e bir revalidate webhook'u düşünülebilir). Deploy sonrası `pm2 restart hal-frontend` kuralı geçerli.

---

## 6. Açık Sorular (insan kararı gerekli)

1. **Repo görünürlüğü:** haldefiyat reposunun public olması bilinçli bir tercih mi (portfolyo amaçlı)? Değilse en hızlı risk azaltımı repoyu private yapmaktır — ama secret rotasyonu her durumda şart (geçmiş zaten ifşa olmuş sayılmalı).
2. **Nginx güvenlik başlıkları:** VPS nginx config'inde (repo dışı) güvenlik başlıkları zaten var mı? T1.3'ün nerede uygulanacağını belirler.
3. **Frontend xlsx kullanımı:** xlsx frontend'de yalnız export için mi, kullanıcı dosyası parse ediyor mu? Yanıt G3'ün gerçek şiddetini belirler.
4. **force-dynamic tercihi:** Layout'lardaki force-dynamic geçmiş bir bug'ın (ör. standalone chunk sorunu) workaround'u muydu, yoksa "hep taze veri" tercihi mi? ISR'a geçiş kapsamını etkiler.
5. **FK + index değişiklikleri için fresh seed penceresi:** Üretimde bir sonraki planlı fresh seed ne zaman? T3.6 ve M5 ona iliştirilmeli.
6. **JWT TTL hedefi:** Admin oturumları için kabul edilebilir TTL/refresh politikası nedir? (shared-backend'i etkiler, Bereketfide/VistaSeeds ile ortak karar.)

---

*Denetim ekibi notu: Backend, güvenlik, frontend ve DevEx boyutları derinlemesine incelendi; `mcp/`, `sosialmedia/` ve `docs/` yan klasörleri ile shared-backend paketi (ayrı repo) hafif incelemeden geçti. Shared-backend'in kendi denetimi ayrı bir çalışma gerektirir.*
