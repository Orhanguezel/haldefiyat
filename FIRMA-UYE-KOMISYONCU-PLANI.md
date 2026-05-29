# Plan & Çeklist — Üye/Komisyoncu Firma Yönetimi

> **Karar:** Orhan, 2026-05-29. Kullanıcılar üye olup kendi firmalarını ekleyebilsin;
> komisyoncu rolü; firma = komisyoncu profil sayfası (iletişim, adres, açıklama, ürün listesi).
> **Rol:** Claude = mimari/plan · Codex = implementasyon · Orhan = moderasyon/karar.

## 1. Vizyon
- `/firmalar` sayfasına **"Firmanı Ekle"** butonu. Üye olmadan eklenemez.
- Kullanıcı **komisyoncu olarak** kaydolabilir (self-register).
- Komisyoncu kendi firma sayfasını yönetir: iletişim, adres, **açıklama**, **sattığı ürün listesi**.
- Firma sayfası = komisyoncu profil/vitrin sayfası.
- 1318 scraped firma zaten var → komisyoncu önce **kendi firmasını arar → sahiplenir (claim)**; yoksa yeni ekler.

## 2. Roller (ortak paket + proje)

**Mevcut (shared-backend `Role`):** `admin | editor | carrier | customer | dealer`
(carrier=Taşıyıcı, customer=Müşteri/Kullanıcı, dealer=Bayi).

**Hedef (hal-fiyatlari'ya özel görünür roller):** Admin · Editör · Kullanıcı · **Komisyoncu**
- [ ] **[Claude/Codex]** Ortak pakete `komisyoncu` rolü ekle — additive (diğer projeleri kırmaz):
  - `packages/shared-backend/modules/auth/helpers/core.ts` → `Role` tipine `'komisyoncu'`
  - `modules/auth/admin.validation.ts` `adminRoleFilter` enum
  - `modules/userRoles` → `RoleName` + getPrimaryRole sıralaması
  - **DB:** `user_roles.role` kolonu ENUM mu VARCHAR mı? ENUM ise seed SQL'e `komisyoncu` ekle (CREATE TABLE'da), fresh seed. VARCHAR ise kod yeter. **Önce kontrol.**
- [ ] **[Codex]** hal-fiyatlari rol UI'ında sadece admin/editor/customer(Kullanıcı)/komisyoncu göster; **carrier(Taşıyıcı) + dealer(Bayi) gizle** (proje-özel allowlist).
- [ ] **[Codex]** Public signup'ta seçilebilir rol: yalnızca **Kullanıcı** veya **Komisyoncu** (admin/editor asla self-grant — mevcut güvenlik korunur).

> Not: shared paket `github.com/Orhanguezel/shared-ecosystem-packages` ayrı repo — değişiklik orada commit+push, VPS'te `build:shared`. Bereketfide/VistaSeed regresyonu için additive kalmalı.

## 3. DB Modeli (seed SQL — ALTER yok)

- [ ] **[Codex]** `hf_firms` genişlet (CREATE TABLE'a kolon ekle + fresh seed):
  - `owner_user_id VARCHAR(36) NULL` — sahiplenen komisyoncu (FK users.id)
  - `source ENUM('halkatalogu','user') DEFAULT 'halkatalogu'` — scraped vs kullanıcı-eklenen
  - `status ENUM('pending','approved','rejected') DEFAULT 'approved'` — scraped=approved, user=pending (moderasyon)
  - `description TEXT NULL` — komisyoncu açıklaması
  - `claim_status ENUM('unclaimed','pending','verified') DEFAULT 'unclaimed'`
- [ ] **[Codex]** `hf_firm_products` (yeni tablo): id, firm_id FK, product_slug NULL (hf_products'a opsiyonel bağ), product_name VARCHAR, note/price VARCHAR NULL, display_order, created_at. (Serbest metin + opsiyonel katalog eşleşmesi.)
- [ ] **[Codex]** `hf_firm_claims` (opsiyonel, sahiplenme talebi): id, firm_id, user_id, status, evidence, created. (Veya owner_user_id + claim_status yeterli — basit tut.)

## 4. Backend (hal-fiyatlari modules/firms)

- [ ] **[Codex]** Public: `POST /firms` — **auth zorunlu** (requireAuth). Komisyoncu kendi firmasını ekler → `source=user, status=pending, owner_user_id=me`. Rate-limit + spam guard.
- [ ] **[Codex]** Public: `PATCH /firms/:id` — sadece `owner_user_id == me` (veya admin). Açıklama/iletişim/adres/ürün düzenleme.
- [ ] **[Codex]** Ürün CRUD: `POST/PATCH/DELETE /firms/:id/products` — owner-only.
- [ ] **[Codex]** Claim: `POST /firms/:id/claim` — komisyoncu mevcut scraped firmayı sahiplenme talebi → admin onayı.
- [ ] **[Codex]** Public list/detail güncelle: `description`, `products`, `ocr_contacts` (vision'dan gelen) döndür; `status=approved` olanları listele (pending'ler herkese görünmez).
- [ ] **[Codex]** Sahiplik guard'ı: owner kontrolü ortak middleware/helper.

## 5. Frontend (public)

- [ ] **[Codex]** `/firmalar` → **"Firmanı Ekle"** butonu. Tıkla → giriş yoksa `/giris?next=/firmalar/ekle` (veya komisyoncu kayıt CTA).
- [ ] **[Codex]** `/firmalar/ekle` — komisyoncu firma ekleme formu: ad, il/ilçe, adres, telefon(lar), iletişim kişisi, açıklama, ürün listesi (ekle/çıkar). **Önce arama:** mevcut firma varsa "bu firma zaten var → sahiplen" akışı.
- [ ] **[Codex]** `/firma/[slug]` genişlet: açıklama bölümü + **ürün listesi** + iletişim/adres + (vision) çoklu komisyoncu ad+telefon + "Bu benim firmam → sahiplen" (giriş varsa).
- [ ] **[Codex]** Komisyoncu kayıt akışı: `/kayit` rol seçimi (Kullanıcı / Komisyoncu) veya ayrı `/komisyoncu-kayit`.
- [ ] **[Codex]** **Komisyoncu dashboard** (`/hesabim/firmam`): kendi firmasını düzenle, ürün yönet, claim durumu.

## 6. Admin (admin_panel)

- [ ] **[Codex]** Firma moderasyon: `pending` firmaları/claim'leri onayla/reddet (mevcut `/admin/firmalar`a sekme).
- [ ] **[Codex]** Rol yönetimi UI: kullanıcıya komisyoncu rolü ata; görünür roller admin/editor/kullanıcı/komisyoncu.

## 7. Güvenlik / Moderasyon
- Üye olmadan ekleme YOK (requireAuth).
- User-eklenen firma `status=pending` → admin onayı sonrası yayında (spam/sahte önleme).
- Claim: scraped firmayı sahiplenme admin onayı + (ileride) telefon/e-posta doğrulama.
- owner-only düzenleme; KVKK: iletişim verisi + kullanıcı izni.
- Rate-limit firma ekleme.

## 8. Fazlar (önerilen sıra)
1. **Faz A — Roller:** ortak pakete komisyoncu + proje rol görünürlüğü + signup rol seçimi.
2. **Faz B — DB + sahiplik:** hf_firms genişletme + hf_firm_products + owner/status/source.
3. **Faz C — Backend API:** firma ekle/düzenle/ürün/claim + moderasyon endpoint'leri.
4. **Faz D — Frontend:** Firmanı Ekle + form + komisyoncu kayıt + dashboard + firma sayfası genişletme.
5. **Faz E — Admin:** moderasyon + rol yönetimi.

## 9. Açık Kararlar (Orhan)
- User-eklenen firma **otomatik mi yayında, yoksa admin onayı mı**? (Öneri: onay = spam koruması)
- Claim doğrulaması: şimdilik sadece admin onayı mı, yoksa telefon/e-posta doğrulama da mı?
- Ürün listesi: serbest metin mi, yoksa hf_products katalogundan seçim mi (ya da ikisi)?
- Komisyoncu sayfası halka açık mı (SEO) yoksa sadece giriş yapınca mı? (Öneri: açık + SEO)
