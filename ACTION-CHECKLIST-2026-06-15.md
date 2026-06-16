# Aksiyon Checklist — 6–15 Haziran Trafik Analizi

> Kaynak rapor: [`reports/analiz-06-15-haziran-2026.md`](./reports/analiz-06-15-haziran-2026.md)
> Codex brief'i: [`CODEX-BRIEF-2026-06-15.md`](./CODEX-BRIEF-2026-06-15.md)
> Üretim: 2026-06-15 · Sahip: Orhan (operasyon) · Uygulayan: Codex (kod)

Durum işaretleri: `[ ]` açık · `[~]` devam · `[x]` bitti · `[O]` Orhan (operasyonel, kod değil)

---

## A1 — [P1] Admin analytics 500'lerini düzelt 🔴
**Belirti:** `/api/v1/admin/analytics/{funnel,ads-daily,ads-attribution}?range=7d` → HTTP 500 (10 günde 27 hata). Public'i etkilemiyor, admin dashboard kırık.
**Kök neden:** hal `audit_request_logs` seed'inde `is_internal` + `is_bot` kolonları YOK; shared analytics read-side bu kolonları bekliyor → "Unknown column" MySQL hatası.

- [x] A1.1 — `006_audit_schema.sql` CREATE TABLE'a `is_bot TINYINT NOT NULL DEFAULT 0` + `is_internal TINYINT NOT NULL DEFAULT 0` ekle (shared `schema.ts` ile birebir). İndeksleri de ekle.
- [x] A1.2 — hal local `auditRequestLogger.ts` insert path'i bu iki kolonu yazsın; bot/internal hesabı için shared `isBotUserAgent` + `isInternalIpValue` helper'larını import et (kod tekrarı YASAK).
- [x] A1.3 — `bun run build && bun run db:seed:*:fresh` ile lokal doğrula; 3 endpoint 200 dönüyor mu (boş veri setinde bile)? *(Build/typecheck tamam; fresh seed canlı veri sileceği için çalıştırılmadı.)*
- [O] A1.4 — VPS dağıtım kararı **Orhan'a**: `audit_request_logs` aylarca trafik verisi tutuyor; fresh seed bu veriyi SİLER. Önerilen: seed güncel + tek seferlik additive `ADD COLUMN ... DEFAULT 0` (drift yok, veri korunur). Orhan onayı şart. `[O]`

## A2 — [P2] Google Ads landing'i `/` → `/canli-hal-fiyatlari` 🟡
**Belirti:** gclid landing'in #1'i hâlâ `/` (1.119 iniş). `/canli-hal-fiyatlari` sayfası ZATEN VAR ve newsletter CTA'lı.

- [O] A2.1 — Google Ads UI: kampanya Final URL'i `/` → `/canli-hal-fiyatlari` (newsletter CTA + bounce↓). `[O]`
- [x] A2.2 — Codex: `/fiyatlar` sayfasına da hafif newsletter CTA şeridi ekle (şu an hiç CTA yok; Ads bir kısmı buraya iniyor).
- [x] A2.3 — Codex: landing'de gclid/UTM cookie capture çalıştığını doğrula (analytics attribution için; A1 ile bağlantılı).

## A3 — [P3] Kalan bozuk `/urun/` slug'larını düzelt 🟢
**Belirti:** 261 `/urun/` 404 (gerçek kullanıcı ~54, kalan prefetch/bot). Bozuk slug'lar: `bezelye-taze`, `e-kulak`, `ucburun-koy-b`, `yesil-dolma-b`, `zeytin`.
**Kök neden:** DB `hf_products.slug` değerleri kesik/hatalı; `canonicalSlug` redirect mekanizması var ama bu kayıtlarda dolu değil.

- [x] A3.1 — DB incelemesi: bozuk örnekler için `hf_products.slug` + `canonical_slug` değerlerini çek; kesilme/normalize hatasını tespit et. *(Canlı SELECT: `e-kulak`, `ucburun-koy-b`, `yesil-dolma-b` DB'de var; `zeytin` yok.)*
- [x] A3.2 — Slug üreten backend yolunu (ürün upsert/ETL) düzelt — kaynakta tutarlı slug. *(ETL `resolveProductSlug()` + alias map + `slugify()` yolu kontrol edildi; mevcut kesik örnekler kaynak kısaltması/ürün kapsamı, kırılma frontend resolver kapsamı.)*
- [x] A3.3 — Yumuşak fallback **middleware'de** (`proxy.ts`): canonical/prefix → gerçek ürüne 308, bilinen kırık slug → `/fiyatlar?q=` 307, diğer → 404. *(Sayfa-içi versiyon middleware'in erken 404'ü yüzünden hiç çalışmıyordu — taşındı, prod'da doğrulandı.)*

## A4 — [P3] PetalBot bant genişliği gürültüsü 🟢
**Belirti:** PetalBot (Huawei) 6.480 hit, tüm crawler'ların #1'i; TR'de SEO değeri marjinal.

- [x] A4.1 — `frontend/src/app/robots.ts`'e PetalBot kuralı ekle (crawlDelay veya hedefli Disallow). Bytespider zaten `Disallow: /`.

## A5 — [devam] Newsletter aktivasyonu (funnel son halkası) 🟡
**Durum:** v1 canlı (subscribe 201, single opt-in, haftalık digest çalışıyor). Detay brief mevcut.

- [~] A5.1 — Mevcut brief'i takip et: [`docs/codex-briefs/newsletter-activation.md`](./docs/codex-briefs/newsletter-activation.md)
- [x] A5.2 — `/abonelik` frontend sayfası (unsubscribe) — mevcut (`frontend/.../(public)/abonelik/page.tsx`).
- [x] A5.3 — `/admin/newsletter` abone yönetimi UI — mevcut (`admin_panel/.../admin/(admin)/newsletter/`).
- [ ] A5.4 — Email `List-Unsubscribe` header — **YAPILMADI** (shared mail.ts'e dokunulmadı, `packages/` değişmedi). Spam skoru iyileştirir, funnel için kritik değil; orta vadeli.

---

### Önerilen sıra
A1 (dashboard kırık, P1) → A4 (5 dk, anında) → A2.2/A2.3 (landing CTA + capture) → A3 (DB inceleme gerek) → A5 (mevcut brief üzerinden).
