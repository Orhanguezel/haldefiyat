# Hal Fiyatları — Admin Paneli & Üye Dashboardu Checklist

## Mevcut Durum

| Özellik | Backend | Frontend |
|---|---|---|
| Auth (login/register) | ✅ | ✅ |
| Profil (adres, avatar, biyografi) | ✅ | ❌ |
| Fiyat Uyarıları (alerts) | ✅ | ✅ anonim |
| Favoriler | ❌ 501 stub | ✅ localStorage |
| Bildirimler | ✅ tablo var | ❌ |
| Destek (support tickets) | ✅ | ❌ |
| Bülten aboneliği | ✅ | ❌ |
| Korumalı route | ❌ | ❌ |

---

## BÖLÜM A — Admin Paneli Kurulumu (VistaSeed'den Kopyalama)

> Codex'e verilecek iş. Kaynak: `projects/vistaseeds/admin_panel/` → Hedef: `projects/hal-fiyatlari/admin_panel/`

### A1 — Kopyalama & Temel Yapı

- [x] `projects/vistaseeds/admin_panel/` dizinini `projects/hal-fiyatlari/admin_panel/` olarak kopyala
- [x] Root `package.json` workspaces listesine `"projects/hal-fiyatlari/admin_panel"` ekle
- [x] `admin_panel/package.json` → `name` alanını `"hal-fiyatlari-admin"` olarak güncelle, versiyon `"1.0.0"`
- [x] `admin_panel/package.json` → `dev` script portunu `3030` → `3031` olarak güncelle
- [x] Root'tan `bun install` çalıştır, bağımlılıkların çözüldüğünü doğrula

### A2 — Ortam Değişkenleri

- [x] `admin_panel/.env.example` oluştur:
  ```
  NEXT_PUBLIC_API_URL=http://localhost:8088/api/v1
  PANEL_API_URL=http://localhost:8088
  NEXT_PUBLIC_PANEL_API_URL=http://localhost:8088
  ```
- [x] `admin_panel/.env.production.example` oluştur (hal-fiyatlari domain'i ile)
- [x] `admin_panel/.env.local` oluştur (gitignore'da olduğundan emin ol)

### A3 — API Bağlantısı

- [x] `src/integrations/base-api.ts` → base URL'i hal-fiyatlari backend'ine yönlendir (`http://localhost:8088`)
- [x] `next.config.mjs` → `rewrites()` içindeki backend URL'lerini güncelle
- [x] `next.config.mjs` → `images.remotePatterns` içindeki vistaseeds host'larını temizle, hal-fiyatlari host'larını ekle

### A4 — Marka & Kimlik Temizleme

- [x] `src/config/app-config.ts` → `brandName`, `brandSlug`, logo URL'lerini hal-fiyatlari için güncelle
- [x] `src/app/layout.tsx` → metadata `title`, `description` güncelle
- [x] `public/` dizinindeki favicon ve logo dosyalarını değiştir
- [x] `src/app/(main)/admin/_components/sidebar/admin-brand-title.tsx` → marka başlığını güncelle
- [x] Admin logo/favicon/OG görsellerini backend `site_settings` şemasından (`site_logo`, `site_favicon`, `site_apple_touch_icon`, `site_og_default_image`) çek ve panelde kullan

### A5 — Sidebar Navigasyon (Hal Fiyatları'na Özgü)

- [x] `src/navigation/sidebar/sidebar-items.ts` → VistaSeed modüllerini temizle, hal-fiyatlari modüllerini ekle:

  **Genel:**
  - Dashboard

  **Fiyat Verileri:**
  - Fiyatlar (hf_price_history)
  - Ürünler (hf_products)
  - Haller (hf_markets)
  - ETL Logları (hf_etl_runs)

  **Uyarılar:**
  - Uyarı Listesi (hf_alerts)

  **Üretim Verileri:**
  - Yıllık Üretim (hf_annual_production)

  **İçerik:**
  - Özel Sayfalar
  - E-posta Şablonları
  - Destek Talepleri

  **Sistem:**
  - Kullanıcılar
  - Site Ayarları
  - Depolama
  - Telegram
  - Audit Log

### A6 — VistaSeed'e Özgü Modülleri Kaldır

Aşağıdaki sayfalar/modüller hal-fiyatlari için gereksiz, silinecek:

- [x] `src/app/(main)/admin/(admin)/products/` — VistaSeed ürün yönetimi kaldır
- [x] `src/app/(main)/admin/(admin)/categories/` — kaldır
- [x] `src/app/(main)/admin/(admin)/blog/` — kaldır
- [x] `src/app/(main)/admin/(admin)/gallery/` — kaldır
- [x] `src/app/(main)/admin/(admin)/references/` — kaldır
- [x] `src/app/(main)/admin/(admin)/library/` — kaldır
- [x] `src/app/(main)/admin/(admin)/job-listings/` — kaldır
- [x] `src/app/(main)/admin/(admin)/job-applications/` — kaldır
- [x] `src/app/(main)/admin/(admin)/offers/` — kaldır
- [x] `src/app/(main)/admin/(admin)/popups/` — kaldır
- [x] `src/app/(main)/admin/(admin)/payment-attempts/` — kaldır
- [x] Silinen modüllere ait `integrations/endpoints/` dosyalarını temizle
- [x] Silinen modüllere ait `locale/tr/admin/*.json` dosyalarını temizle

### A7 — Hal Fiyatları Admin Modülleri (Yeni Sayfa Oluşturma)

- [x] **Fiyatlar** — `src/app/(main)/admin/(admin)/prices/`
  - `page.tsx` — liste (ürün, hal, tarih, fiyat aralığı filtresi)
  - `[id]/page.tsx` — detay / düzenleme
  - `_components/prices-list-panel.tsx`
  - `_components/price-detail-client.tsx`

- [x] **Ürünler (hf_products)** — `src/app/(main)/admin/(admin)/hf-products/`
  - `page.tsx`, `[id]/page.tsx`
  - Alan: slug, nameTr, categorySlug, unit, aliases (JSON), is_active

- [x] **Haller (hf_markets)** — `src/app/(main)/admin/(admin)/markets/`
  - `page.tsx`, `[id]/page.tsx`
  - Alan: slug, name, cityName, regionSlug, sourceKey, is_active, displayOrder

- [x] **Uyarılar (hf_alerts)** — `src/app/(main)/admin/(admin)/alerts/`
  - `page.tsx` — liste (ürün, eşik, yön, kanal, son tetiklenme)
  - Soft delete, aktif/pasif toggle

- [x] **ETL Logları** — `src/app/(main)/admin/(admin)/etl-logs/`
  - `page.tsx` — sadece okuma, rows_fetched / status / duration_ms

- [x] **Yıllık Üretim** — `src/app/(main)/admin/(admin)/production/`
  - `page.tsx`, `[id]/page.tsx`

### A8 — Integrations (RTK Query Endpoint'leri)

- [x] `src/integrations/endpoints/prices-admin-endpoints.ts` — CRUD + filtreler
- [x] `src/integrations/endpoints/hf-products-admin-endpoints.ts`
- [x] `src/integrations/endpoints/markets-admin-endpoints.ts`
- [x] `src/integrations/endpoints/alerts-admin-endpoints.ts`
- [x] `src/integrations/endpoints/etl-logs-admin-endpoints.ts`
- [x] `src/integrations/endpoints/production-admin-endpoints.ts`
- [x] `src/integrations/tags.ts` → yeni cache tag'leri ekle: `Prices`, `HfProducts`, `Markets`, `Alerts`, `EtlLogs`, `Production`

### A9 — Çeviriler

- [x] `src/locale/tr/admin/prices.json` — fiyat yönetimi metinleri
- [x] `src/locale/tr/admin/markets.json`
- [x] `src/locale/tr/admin/alerts.json`
- [x] `src/locale/tr/admin/production.json`
- [ ] `src/locale/tr/admin/common.json` → genel metinleri hal-fiyatlari'na uyarla

### A10 — Build & Test

- [x] `bun run dev` başarıyla açılıyor (port 3031)
- [ ] Login sayfası hal-fiyatlari backend'ine bağlanıyor
- [x] Sidebar doğru modülleri gösteriyor
- [ ] En az bir modül (fiyatlar) liste + detay çalışıyor
- [x] `bun run build` hatasız tamamlanıyor

---

## BÖLÜM B — Üye Dashboardu (Frontend)

> Kaynak: `projects/hal-fiyatlari/frontend/src/app/[locale]/`

### B1 — Temel Altyapı

- [x] `src/app/[locale]/(dashboard)/layout.tsx` — korumalı layout, auth guard, sidebar
- [x] `src/app/[locale]/(dashboard)/hesabim/page.tsx` — dashboard ana sayfası
- [x] `src/app/[locale]/(dashboard)/hesabim/profil/page.tsx`
- [x] `src/app/[locale]/(dashboard)/hesabim/uyarilar/page.tsx`
- [x] `src/app/[locale]/(dashboard)/hesabim/favoriler/page.tsx`
- [x] `src/app/[locale]/(dashboard)/hesabim/bildirimler/page.tsx`
- [x] `src/app/[locale]/(dashboard)/hesabim/guvenlik/page.tsx`
- [x] `src/app/[locale]/(dashboard)/hesabim/destek/page.tsx`
- [x] `src/components/providers/AuthGuard.tsx` — giriş yoksa `/giris`'e yönlendir
- [x] `src/components/dashboard/DashboardSidebar.tsx`
- [x] `src/components/dashboard/DashboardMobileNav.tsx`

### B2 — Profil

- [x] `src/components/dashboard/profile/ProfileForm.tsx`
- [x] `src/components/dashboard/profile/AvatarUpload.tsx`
- [x] `src/lib/hooks/useProfile.ts`

### B3 — Fiyat Uyarıları (Üyeye Bağlama)

**Backend:**
- [x] `hf_alerts` tablosuna `user_id` kolonu ekle → `020_hal_domain_schema.sql` + `schema.ts`
- [x] `GET /api/v1/user/alerts` — auth required
- [x] `PATCH /api/v1/user/alerts/:id`
- [x] `DELETE /api/v1/user/alerts/:id` — sahiplik kontrolü
- [ ] `db:seed:fresh` çalıştır — tablo şemasını sıfırdan oluştur

**Frontend:**
- [x] `src/components/dashboard/alerts/AlertsList.tsx`
- [x] `src/components/dashboard/alerts/AlertEditModal.tsx`
- [x] `src/lib/hooks/useUserAlerts.ts`

### B4 — Favoriler (Backend Sync)

**Backend:**
- [x] `hf_user_favorites` tablosu oluştur → `020_hal_domain_schema.sql` + `schema.ts`
- [x] `GET /api/v1/favorites` — auth required
- [x] `POST /api/v1/favorites` — implement edildi
- [x] `DELETE /api/v1/favorites/:slug`
- [x] `POST /api/v1/favorites/sync` — localStorage → DB toplu aktarım
- [ ] `db:seed:fresh` çalıştır

**Frontend:**
- [x] `src/lib/hooks/useFavorites.ts` — auth varsa backend, yoksa localStorage
- [x] `src/components/dashboard/favorites/FavoritesList.tsx`
- [x] `FavoriteButton` bileşenini auth-aware yaptı

### B5 — Bildirimler

**Backend:**
- [x] `GET /api/v1/notifications` — `registerNotifications` shared.ts'e eklendi
- [x] `PATCH /api/v1/notifications/:id` — mark read
- [x] `POST /api/v1/notifications/mark-all-read`
- [x] `GET /api/v1/notifications/unread-count`
- [ ] `checker.ts` → alert tetiklenince `notifications` tablosuna kayıt düş

**Frontend:**
- [x] `src/components/dashboard/notifications/NotificationList.tsx`
- [x] `src/components/dashboard/notifications/NotificationBell.tsx` — okunmamış badge
- [x] `src/lib/hooks/useNotifications.ts`

### B6 — Güvenlik

**Backend:**
- [x] `POST /api/v1/user/change-password` — `modules/user/router.ts` oluşturuldu

**Frontend:**
- [x] `src/components/dashboard/security/ChangePasswordForm.tsx`
- [x] E-posta doğrulama durumu göster (ChangePasswordForm içinde)

### B7 — Destek

**Backend:**
- [x] `GET /api/v1/support/tickets/my` — `registerSupport` shared.ts'e eklendi
- [x] `POST /api/v1/support/tickets`
- [x] `POST /api/v1/support/tickets/:id/messages`

**Frontend:**
- [x] `src/components/dashboard/support/TicketList.tsx`
- [x] `src/components/dashboard/support/NewTicketForm.tsx`
- [x] `src/components/dashboard/support/TicketDetail.tsx`

### B8 — Dashboard Özet Sayfası

- [x] Aktif uyarı sayısı kartı
- [x] Favori ürün sayısı
- [x] Okunmamış bildirim sayısı
- [x] Açık destek bileti sayısı
- [x] Hızlı eylem: "Yeni Uyarı Ekle", "Fiyatlara Bak", "Ürün Karşılaştır"
- [x] `src/components/dashboard/overview/DashboardOverview.tsx`

### B9 — UX & Kalite

- [x] Loading skeleton'ları (tüm listelerde)
- [x] Boş durum UI'ları (favori yok, uyarı yok, bildirim yok, bilet yok)
- [x] Toast bildirimleri (başarı / hata)
- [x] Mobil uyumluluk (DashboardMobileNav bottom bar)
- [x] `messages/tr.json` → `dashboard` bölümü eklendi

---

## Önerilen Geliştirme Sırası

```
1. [A1–A5]  Admin panel kopyala, port/env/marka ayarla
2. [A6]     VistaSeed modüllerini temizle
3. [A7–A9]  Hal fiyatları admin modüllerini yaz (Codex)
4. [A10]    Build doğrula
5. [B1]     Üye dashboard route altyapısı + auth guard
6. [B2]     Profil sayfası (backend hazır, hızlı kazanım)
7. [B4]     Favoriler backend sync (localStorage'ı kurtarma kritik)
8. [B3]     Uyarılar user_id bağlantısı
9. [B5]     Bildirimler
10. [B6–B7] Güvenlik + Destek
11. [B8–B9] Dashboard özet + UX polish
```
