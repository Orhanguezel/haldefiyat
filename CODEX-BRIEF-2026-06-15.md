# Codex Brief — 6–15 Haziran Aksiyonları

> Checklist: [`ACTION-CHECKLIST-2026-06-15.md`](./ACTION-CHECKLIST-2026-06-15.md) · Rapor: [`reports/analiz-06-15-haziran-2026.md`](./reports/analiz-06-15-haziran-2026.md)
> Repo kuralları: NO ALTER TABLE (local) · hard-code YASAK · kod tekrarı YASAK (ortak iş → shared helper) · dosya < 200 satır · deploy SADECE git.
> Paths: hal backend = `projects/hal-fiyatlari/backend`, frontend = `projects/hal-fiyatlari/frontend`, shared = `packages/shared-backend`.

---

## Görev A1 — Admin analytics 500 fix (P1) 🔴

### Kök neden (doğrulandı)
Shared analytics read-side, `audit_request_logs` üzerinde `is_internal` + `is_bot` kolonlarını filtreliyor:
- `packages/shared-backend/modules/audit/filters.ts:138-139` → `COALESCE(is_internal, 0) = 0`, `COALESCE(is_bot, 0) = 0`
- Çağıran zincir: `modules/analytics/repo-extra.ts` (`repoGetFunnel` L139-174, `repoGetAdsDaily` L65-99, `repoGetAdsAttribution` L31-63) → `humanPageviewWhere`/`realPageviewWhere` (`modules/analytics/sql.ts`) → `realVisitorWhere` (filters.ts).

Ama hal'in **local** seed'i bu kolonları içermiyor:
- `projects/hal-fiyatlari/backend/src/db/seed/sql/006_audit_schema.sql` → CREATE TABLE'da `is_admin` var, `is_bot`/`is_internal` YOK.
- hal kendi yazıcısını kullanıyor: `projects/hal-fiyatlari/backend/src/plugins/auditRequestLogger.ts` (shared `service.ts` insert path'ini kullanmıyor) → kolonları yazmıyor.

Karşılaştırma referansı (kolonların DOĞRU hali): `packages/shared-backend/modules/audit/schema.ts:31-32,58-59` ve insert `repository.ts:603-609`, hesaplama `service.ts:233-234`.

### Yapılacaklar
**A1.1 — Schema** (`006_audit_schema.sql`):
- CREATE TABLE içine ekle (shared `schema.ts` ile birebir tip/default):
  - `is_bot TINYINT NOT NULL DEFAULT 0`
  - `is_internal TINYINT NOT NULL DEFAULT 0`
- İlgili indeksleri ekle: `audit_request_logs_bot_idx (is_bot)`, `audit_request_logs_internal_idx (is_internal)`.
- ALTER kullanma — sadece CREATE TABLE tanımını düzenle.

**A1.2 — Write path** (`plugins/auditRequestLogger.ts`):
- Insert'e `is_bot` + `is_internal` ekle.
- Hesaplama için shared helper'ları import et (yeniden yazma YOK):
  - `import { isBotUserAgent, isInternalIpValue } from '@eco/shared-backend/modules/audit/filters'` (veya helpers/index.ts barrel'ı).
  - `is_bot = isBotUserAgent(ua) ? 1 : 0`
  - `is_internal = (isSelf || isInternalIpValue(ip, country)) ? 1 : 0` — `isSelf` için mevcut vs_self cookie mantığına bak (`service.ts:326` yorumu referans).

**A1.3 — Lokal doğrulama:**
```bash
cd projects/hal-fiyatlari/backend && bun run build && bun run db:seed:hal:fresh   # gerçek script adını package.json'dan al
```
- 3 endpoint'i admin JWT ile çağır, hepsi 200 dönmeli (boş veri setinde bile, hata değil). Funnel/ads boş array dönebilir — bu normal, 500 olmamalı.

**A1.4 — VPS (Orhan kararı, kod değil):**
- `audit_request_logs` aylarca üretim trafik verisi tutuyor — fresh seed bunu siler. Codex bu kararı VERMEZ; checklist A1.4'te Orhan'a bırakıldı. Önerilen yol seed güncel + non-destructive `ADD COLUMN`. Sen sadece seed + write path'i hazırla.

### Kabul kriteri
- Fresh seed sonrası 3 endpoint 200. `realOnly=true` (default) ile sorgu "Unknown column" vermiyor. Yeni audit kayıtlarında `is_bot`/`is_internal` doğru doluyor (bot UA → 1, normal → 0).

---

## Görev A2 — Ads landing CTA (P2) 🟡

`/canli-hal-fiyatlari` ZATEN VAR ve newsletter CTA'lı (`frontend/src/app/[locale]/(public)/canli-hal-fiyatlari/page.tsx`, `LivePriceNewsletter` bileşeni). Final URL değişimi Orhan'da (A2.1, Google Ads UI).

### Codex yapılacaklar
**A2.2 —** `/fiyatlar` sayfasına (`frontend/src/app/[locale]/(public)/fiyatlar/page.tsx`) hafif newsletter CTA şeridi ekle. Mevcut `LivePriceNewsletter` bileşenini REUSE et (yeni bileşen yazma). Sayfanın üstüne/altına yerleştir, tabloyu bozma.
**A2.3 —** gclid/UTM cookie capture'ı doğrula: landing'e `?gclid=...&utm_*` ile gelen ziyaretçide değerler cookie'ye yazılıyor ve `/api/v1/track/pageview` beacon'ına aktarılıyor mu? (A1 analytics attribution bu veriye bağlı.) Capture eksikse ekle; varsa dokunma.

### Kabul kriteri
- `/fiyatlar` üzerinde çalışan abonelik formu. `?gclid=test` ile inişte beacon payload'ında gclid görünüyor.

---

## Görev A3 — Bozuk `/urun/` slug'ları (P3) 🟢

### Bilinenler
- Link üretimi: `frontend/src/components/ui/PriceTable.tsx:512` → `/urun/${row.productSlug}` (slug API'den geliyor, frontend üretmiyor).
- Resolver: `frontend/src/app/[locale]/(public)/urun/[slug]/page.tsx:118-127` → `products.find(p => p.slug === slug)`, `canonicalSlug` farklıysa 301.
- Frontend slugify (`frontend/src/lib/tr-slug.ts`) yalnız arama için; kanonik slug DB'de (`hf_products.slug`).
- Bozuk örnekler kesik görünüyor: `e-kulak`, `ucburun-koy-b`, `yesil-dolma-b` → muhtemelen isim kısaltma/normalize hatası ürün upsert sırasında.

### Yapılacaklar
**A3.1 —** DB incele: bozuk örnekler için `SELECT name, slug, canonical_slug FROM hf_products WHERE slug IN (...)`. Kesilme paternini bul.
**A3.2 —** Slug üreten backend yolunu (ürün upsert / ETL ingest) bul ve düzelt; üretimde tutarlı, kesilmemiş slug. `tr-slug.ts` mantığıyla aynı normalize kuralını backend'de TEK kaynaktan uygula (kod tekrarı YASAK — gerekiyorsa shared util'e taşı).
**A3.3 —** `/urun/[slug]` resolver'a yumuşak fallback: tam eşleşme yoksa `canonicalSlug`/normalize ile en yakını bul → 301; o da yoksa anlamlı 404 sayfası (öneri linkleriyle), hard ölü sayfa değil.

### Kabul kriteri
- Eski bozuk linkler 301 ile doğru ürüne gidiyor veya öneri içeren 404 gösteriyor. Yeni üretilen slug'lar `/fiyatlar` link'i ile `/urun` resolver arasında %100 eşleşiyor.

---

## Görev A4 — PetalBot robots kuralı (P3) 🟢

Dosya: `frontend/src/app/robots.ts` (Next.js route handler). Bytespider zaten `Disallow: /`.

### Yapılacaklar
- `"*"` kuralından ÖNCE PetalBot bloğu ekle. Karar Orhan/Claude: tamamen kapatmak yerine crawlDelay tercih (içerik AI/arama için açık kalsın ama yavaşlasın):
```ts
{ userAgent: "PetalBot", allow: "/", disallow: ["/api/", "/_next/", "/*?_rsc="], crawlDelay: 5 },
```
- Not: Next.js `MetadataRoute.Robots` `crawlDelay`'i destekler; üretilen `/robots.txt` çıktısını doğrula.

### Kabul kriteri
- `/robots.txt` çıktısında `User-agent: PetalBot` + `Crawl-delay: 5` görünüyor.

---

## Görev A5 — Newsletter (devam) 🟡

v1 canlı. Bu görev için YENİ spec yazma — mevcut brief'i uygula:
- [`docs/codex-briefs/newsletter-activation.md`](./docs/codex-briefs/newsletter-activation.md)

Kalan açık işler (oradaki sıraya göre): `/abonelik` unsubscribe sayfası (A5.2) · `/admin/newsletter` UI (A5.3) · email `List-Unsubscribe` header (A5.4, shared mail.ts upgrade). Shared `subscribe`'a DOKUNMA — hal local newsletter modülü üzerinden git (Bereketfide/VistaSeed izolasyonu).

---

## Genel notlar
- Her görev ayrı commit; commit mesajında checklist ID'si (A1, A2...).
- Schema değişikliğinden sonra MUTLAKA `db:seed:*:fresh` ile doğrula, ALTER kullanma.
- Deploy git ile: local push → VPS `git reset --hard origin/main` → `bun run build` → backend `pm2 reload`, frontend/admin `pm2 restart --update-env`.
- shared-backend değiştirirsen `packages/` ayrı repo + `bun run build:shared`.
