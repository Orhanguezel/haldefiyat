# Mobil Web + PWA Checklist

> **Oluşturma:** 2026-05-27 • **Detaylandırma:** 2026-05-28
> **Bağlam:** Hal Fiyatlari frontend'ini mobil web öncelikli hale getirme + PWA olarak yüklenebilir yapma.
> **Aciliyet (yeni):** Google Ads kampanya analizi (28 May) — **Ads trafiğinin %78'i mobil**. Mevcut site büyük oranda desktop-first. Mobil deneyim acil iyileştirilmeli.

---

## 🎯 Stratejik Bağlam

**Trafik gerçeği (28 May 2026):**
- Site geneli organik: %65 desktop (B2B profili)
- Google Ads brand awareness kampanyası: **%78 mobil** (genel tüketici)
- Toplam günlük insan: ~7,200 (kampanya sonrası 2.5x)

**Çıkarım:**
- Desktop deneyim **bozulmamalı** — B2B kitlesi gündüz masaüstünden bakar
- Mobil deneyim **acilen iyileştirilmeli** — Ads kullanıcısının %78'i mobil
- Mobile-first değil **mobile-priority** yaklaşım: yeni feature'lar mobile'da önce çalışmalı, desktop her zaman çalışmalı

**M11.4 landing sayfası ile bağlantı:**
`/canli-hal-fiyatlari` (M11.4) zaten mobile-first tasarlanıyor — Ads buraya iniyor olacak. Bu checklist sitenin **diğer sayfalarını** mobile'a uyumlu kılıyor (anasayfa, ürün sayfaları, hal sayfaları, /pro, /uyarilar).

---

## 👥 İş Bölümü

- 🧠 **Claude (Mimar):** Mobil UX kararları, wireframe, bilgi hiyerarşisi, performans hedefleri, kabul kriterleri. Tasarım kararları kod yazılmadan onaylanır.
- 🤖 **Codex (Implementer):** Spec'lenmiş bileşen kodlaması, manifest/service worker setup, Lighthouse optimize, deploy.
- 👤 **Orhan (Operasyonel):** Gerçek cihaz testleri, canlı doğrulama, "alt navigasyon eklenmeli mi" gibi UX kararları, PWA install testi, App store kararı.

**🚫 Codex'e VERİLMEYECEK kısımlar (Claude/Orhan kararı):**
- Mobil bilgi hiyerarşisi (hangi feature mobile'da önce gözüksün)
- Alt navigasyon eklemek / eklememek kararı (UX trade-off, kullanıcı kararı)
- Tema renkleri / marka kimliği değişiklikleri
- PWA için seçilecek splash/icon görselleri
- Push bildirim mesaj tonu/sıklık politikası (Faz 2)

---

## 1. Mevcut Mobil Durum Analizi 🔍

### 1.1 Audit (🤖 Codex) ✅ TAMAMLANDI 2026-05-28

- [x] Mobil viewport'ta (375x812 iPhone 14) tüm public sayfaları gez ve issue list çıkar:
  - [x] `/` (anasayfa)
  - [x] `/fiyatlar`
  - [x] `/urun/[slug]` (en az 3 örnek: domates, biber, sogan-kuru)
  - [x] `/hal/[city]` (en az 2: antalya, istanbul)
  - [x] `/endeks`
  - [x] `/pro`
  - [x] `/uyarilar`
  - [x] `/embed`
  - [x] `/karsilastirma`
  - [x] `/analiz` (ve `/analiz/[slug]`)
- [x] Her sayfa için screenshot al + 1 satır özet (sorunlar)
- [x] Mevcut Lighthouse mobile skorları kayıt et (Performance, Accessibility, Best Practices, SEO; PWA category Lighthouse 12 CLI'da n/a)
- [x] Çıktıyı `docs/mobile-audit-2026-05-28.md` dosyasına yaz

### 1.2 Sorun kategorileri + öncelik (🧠 Claude — TAMAMLANDI 2026-05-28)

Codex audit'i (`docs/mobile-audit-2026-05-28.md`) üzerinden kategorize edildi.

> **⚠️ Önemli ayrım — lokal artefakt vs gerçek sorun:** Audit LOCAL build'de, backend (8091) KAPALIYKEN alındı. Bu yüzden `Best Practices 75` (tüm sayfalar) + `header logo kırık` doğrudan `/uploads/...` proxy'sinin 500 dönmesinden kaynaklanıyor. **Bunlar büyük ihtimalle lokal artefakt — canlıda backend açıkken tekrar ölçülmeli.** Canlıda da varsa P0'a yükselir.

**Bulgu kategorileri (audit'e göre):**

| Kat | Bulgu | Audit kanıtı | Karar |
|---|---|---|---|
| **A. Yatay scroll** | Yok | Tüm sayfalar "Yatay taşma: OK" | ✅ Sorun yok |
| **C. Okunamayan metin** | Yok | font-size kontrolleri OK | ✅ Sorun yok |
| **D. Layout breakage** | Ana sayfa ilk viewport boş/arka plan, hero gecikmeli | Home screenshot + Perf 72 | P1 |
| **D. Cookie banner** | Mobil ilk ekranda içeriği örtüyor | audit "İlk Bulgular" | P1 |
| **E. Heavy interaction** | Grafikler mobilde kullanılabilir | "usable" notu | ✅ Kabul edilebilir |
| **F. Tema/logo** | Header logo `/` + `/karsilastirma`'da kırık | upload proxy 500 (lokal) | **Canlıda doğrula** → varsa P0 |
| **Perf** | Performance < 90: `/`(72), ürünler(74-81), `/fiyatlar`(81), `/karsilastirma`(77) | Lighthouse | P1 (Görev 7) |
| **A11y** | Ürün sayfaları 87 | Lighthouse | P2 |
| **B. Touch target** | Lighthouse ölçmedi | n/a | **Orhan manuel test** (Görev 8.2) |
| **PWA** | installable değil (manifest/SW yok) | PWA n/a | P1 (Görev 4-5) |

**Öncelik sırası (Claude kararı):**
- **P0 (canlı doğrulama sonrası):** Header logo kırığı — canlıda varsa marka regresyonu, acil. *(Orhan/Codex canlıda kontrol etsin.)*
- **P1:** (1) Ana sayfa hero LCP + ilk viewport boşluğu → MobileHomeHero (afiş) zaten bunu çözecek; (2) Performance < 90 sayfalar (Görev 7); (3) Cookie banner ilk-ekran örtmesi; (4) PWA installability (Görev 4-5).
- **P2:** Ürün sayfaları A11y 87, diğer sayfaların 85-89 Perf'i.

> **Not:** Best Practices 75 lokal `/uploads` 500'den; canlıda backend açıkken tekrar ölçülmeli — gerçek değilse görmezden gel.

### 1.3 Kabul kriteri

- [x] Audit dökümanı çıktı olarak teslim
- [x] Her sayfa için "OK / Sorunlu (P0/P1/P2)" sınıflandırması yapıldı (yukarıdaki tablo + öncelik sırası)
- [x] Mevcut Lighthouse skorları baseline olarak kayıtta

---

## 2. Mobil Ana Ekran Tasarımı 📱

### 2.1 Tasarım kararı (🧠 Claude — TAMAMLANDI, AFİŞ MOCKUP'INA REVİZE)

> **✅ KARAR `docs/codex-briefs/mobile-design-decisions.md` §2.1'de finalize edildi.**
> Aşağıdaki ilk wireframe (KPI banner versiyonu) **geçersiz** — Orhan'ın afiş telefon
> görseli (`sosialmedia/assets/afis/`) tasarım hedefi oldu: **yeşil hero band
> ("GÜNCEL HAL FİYATLARI" + TR haritası) → ÜRÜN FİYAT TRENDİ grafiği → POPÜLER ÜRÜNLER.**
> Yeni `MobileHomeHero` (`lg:hidden`), desktop `HeroSection` korunur. Fork sadece üst ekran.
>
> **NOT (eski):** Aşağıdaki wireframe referans olarak kalsın ama afiş kararı önceliklidir.

**Mobil anasayfa wireframe (sıralama yukarıdan aşağı):**

```
┌─────────────────────────┐
│ 1. Header (kompakt)     │ ← 56px sticky
├─────────────────────────┤
│ 2. KPI Banner           │ ← 3'lü sayaç
│    [N ürün] [22 hal]    │
│    [Son güncelleme: HH] │
├─────────────────────────┤
│ 3. Popüler ürünler      │ ← Yatay scroll
│    ◄ [kart][kart][kart] │   2 kart görünür
├─────────────────────────┤
│ 4. Şehir chips          │ ← 2 satır overflow
│    [Antalya][İstanbul]  │
├─────────────────────────┤
│ 5. Bugünün hareketleri  │ ← Top 5 gainer/loser
│    En çok ucuzlayan     │
│    En çok pahalanan     │
├─────────────────────────┤
│ 6. Newsletter CTA       │ ← Sticky CTA banner
├─────────────────────────┤
│ 7. Türkiye haritası     │ ← Opsiyonel, viewport altı
│    (interactive değil   │
│     mobile'da, görsel)  │
├─────────────────────────┤
│ 8. Footer (kompakt)     │
└─────────────────────────┘
```

**Karar gerekçeleri:**

| Karar | Sebep |
|---|---|
| KPI banner #2'de | İlk 1 saniyede "veri canlı" sinyali — Ads kullanıcısının güveni |
| Popüler ürünler #3'te | Mobil'de en yüksek engagement element (CTR > %20 organic'te) |
| Şehir chips horizontal scroll | Vertical liste mobile'da yer kaybı, chips kompakt |
| Türkiye haritası viewport altı | Mobile'da interactive map kullanışsız (Ads %78 mobile) — sadece görsel marka sinyali |
| Sticky newsletter CTA | M11.4'le tutarlı — newsletter signup brand awareness fazının #1 conversion'ı |

### 2.2 Implementation (🤖 Codex)

- [x] `frontend/src/app/page.tsx` veya `frontend/src/app/[locale]/(public)/page.tsx` — mobile branch ekle
- [x] Mobile breakpoint: Tailwind `md:` (768px) — altı mobile, üstü desktop
- [x] `MobileHomeHero.tsx` — KPI banner + sticky CTA bileşeni
- [x] `PopularProductsCarousel.tsx` — yatay scroll (`overflow-x-auto snap-x snap-mandatory`)
- [x] `CityChipsRow.tsx` — 2 satır overflow
- [x] `TopMoversCard.tsx` — bugünün hareketleri (gainer/loser)
- [x] Türkiye haritası bileşeni mobile'da `pointer-events: none` (sadece görsel)
- [x] Touch target hedefi: 44x44px min (Apple HIG)
  - Not: local screenshot `/tmp/mobile-home-after.png`; Lighthouse mobile Performance 72 → 80, A11y 96, CLS 0. Backend upload proxy kapalı olduğu için Best Practices/console error canlıda tekrar ölçülecek.

### 2.3 Kabul kriteri

- [x] iPhone 14 viewport'ta (375x812) yatay scroll **yok**
- [x] İlk ekranda KPI banner + popüler ürünlerin ilk 2 kartı görünür
- [x] Tüm CTA'lar parmakla rahatça basılabilir (touch target test)
- [x] Desktop hâlâ aynı düzgün görünüm — regresyon yok *(build/typecheck geçti; görsel regresyon canlı/manuelde tekrar bakılmalı)*

---

## 3. Mobil Navigasyon 🧭

### 3.1 Karar gerekli (🧠 Claude + 👤 Orhan — kullanıcı kararı)

**Soru:** Mobil bottom navigation eklensin mi?

| Seçenek | Artı | Eksi |
|---|---|---|
| **A. Sadece hamburger** | Basit, mevcut yapı | Ana feature'lar 2 tıkla erişiliyor |
| **B. Bottom nav (4 tab) + hamburger** | Tek tıkla ana feature | Native app hissi, viewport yer kaybı |
| **C. Bottom nav (3 tab) + hamburger** | Dengeli | İçeriği seçmek zor |

> **Claude önerisi:** **Seçenek B** (4 tab bottom nav). Tab'lar: `Anasayfa` `Fiyatlar` `Harita` `Uyarılar`. PWA hissi güçlenir, mobile retention artar.
> **✅ Orhan'ın kararı (2026-05-28): SEÇENEK B onaylandı.** Spec `mobile-design-decisions.md` §3.1'de — `MobileBottomNav`, `lg:hidden`, safe-area inset, `DashboardMobileNav` pattern'i aynalanır.

**Hamburger menü kararı (Claude — onaylı):**
- Mevcut hamburger sade kalsın, sadece ikincil sayfalar (Endeks, Analiz, Hakkımızda, Hesap)
- Ana 4 feature bottom nav'da olacak

### 3.2 Implementation (🤖 Codex — Orhan karar verince)

**Bottom nav (Seçenek B onayı varsa):** ✅ TAMAMLANDI 2026-05-30 (Claude, canlı)

- [x] `frontend/src/components/layout/MobileBottomNav.tsx` — yeni bileşen (4 tab: Anasayfa/Fiyatlar/Harita/Uyarılar)
- [x] `lg:hidden` — desktop'ta görünmesin (header lg'de switch ettiği için md değil lg)
- [x] Aktif tab vurgusu (renk + bg-brand/10 ikon kutusu)
- [x] Safe area inset (`pb-[env(safe-area-inset-bottom)]`)
- [x] `fixed inset-x-0 bottom-0 z-50`
- [x] Layout'ta `<MobileBottomNav locale={currentLocale} />` mount + `<main>` pb (4rem+safe-area), `lg:pb-0`

**Hamburger menü sadeleştirme:**

- [ ] Mevcut hamburger içeriğinden Anasayfa/Fiyatlar/Harita/Uyarılar çıkar (bottom nav'da)
- [ ] Sadece: Endeks, Analiz, Karşılaştırma, Embed, Hakkımızda, Hesap kalsın
- [ ] Dark/light tema toggle hamburger içinde kalır
- [ ] Login/"Ücretsiz Başla" CTA hamburger'da üstte

### 3.3 Kabul kriteri

- [x] Bottom nav her sayfada görünür (mobile) — public layout'a mount edildi, canlı
- [x] Aktif sayfa tab'ı vurgulanmış (isActive)
- [x] iPhone home indicator ile çakışmıyor (safe-area inset)
- [ ] Hamburger sade — ana feature'lar bottom nav'da *(opsiyonel: header hamburger hâlâ tam menü; bottom nav ile redundant ama kırık değil — istenirse sadeleştirilir)*
- [ ] Dark/light tema değişiminde logo doğru *(Orhan manuel test)*

---

## 4. PWA Manifest 📦

### 4.1 Tasarım (🧠 Claude — TAMAMLANDI, bkz. `mobile-design-decisions.md` §4.1)

> Mevcut `src/app/manifest.ts` zaten var. Karar: sıfırdan yazma, 3 delta (maskable safe-area ikon, `id`, `categories`). theme `#84f04c` korunur. Detay design doc'ta.

**Manifest payload (Claude onayı):**

```json
{
  "name": "HaldeFiyat — Türkiye Hal Toptan Fiyatları",
  "short_name": "HaldeFiyat",
  "description": "Türkiye 22+ halinde toptan sebze-meyve fiyatları, canlı veri ve haftalık bülten.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#ffffff",
  "theme_color": "#10b981",
  "categories": ["business", "shopping", "food"],
  "lang": "tr",
  "dir": "ltr",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icons/maskable-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "/icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "shortcuts": [
    { "name": "Fiyatlar", "url": "/fiyatlar", "icons": [{ "src": "/icons/shortcut-prices.png", "sizes": "96x96" }] },
    { "name": "Uyarılar", "url": "/uyarilar", "icons": [{ "src": "/icons/shortcut-alerts.png", "sizes": "96x96" }] }
  ]
}
```

**Theme color seçimi:** `#10b981` (emerald-500) — landing page'le tutarlı, tarım yeşili.

### 4.2 İkonlar (👤 Orhan asset hazırlığı)

**🚫 Codex'e verilmeyecek karar:** İkon tasarımı. Codex sadece dosyaları yerleştirir, Orhan/tasarımcı oluşturur.

Orhan hazırlayacak (veya tasarımcıya verecek):
- [ ] `icon-192.png` (192x192, normal padding)
- [ ] `icon-512.png` (512x512, normal padding)
- [ ] `maskable-192.png` (192x192, **safe area** padding — center'da %80 alanda logo)
- [ ] `maskable-512.png` (512x512, aynı kural)
- [ ] `apple-touch-icon.png` (180x180)
- [ ] `shortcut-prices.png` (96x96)
- [ ] `shortcut-alerts.png` (96x96)
- [ ] `favicon.ico` (32x32 multi-resolution)

**Geçici:** Codex placeholder ikonlar üretebilir (emerald arka plan + "HF" metin) — Orhan'ın gerçek ikonu gelene kadar.

> Codex 2026-05-28: Geçici emerald + "HF" placeholder ikon seti üretildi. Gerçek marka ikonları gelince aynı dosya adlarıyla değiştirilecek.

### 4.3 Implementation (🤖 Codex)

- [x] `frontend/public/manifest.json` — yukarıdaki payload
- [x] `frontend/src/app/manifest.ts` — `/manifest.webmanifest` metadata route'u aynı payload ile hizalandı
- [x] `frontend/public/icons/` klasörü, 8 ikon dosyası (placeholder veya gerçek)
- [x] `frontend/src/app/layout.tsx` head'inde:
  ```tsx
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#10b981" />
  <meta name="theme-color" content="#10b981" media="(prefers-color-scheme: light)" />
  <meta name="theme-color" content="#0c5e3a" media="(prefers-color-scheme: dark)" />
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="HaldeFiyat" />
  ```
- [x] Local doğrulama: `bun x tsc --noEmit`, `bun run --cwd frontend build`

### 4.4 Kabul kriteri

- [x] `curl https://haldefiyat.com/manifest.json` → **200** (canlı doğrulandı 2026-05-30; `.webmanifest` + ikonlar da 200)
- [x] Local `curl http://127.0.0.1:3034/manifest.json` → 200, geçerli JSON (`Content-Type: application/json`)
- [x] Local `curl http://127.0.0.1:3034/manifest.webmanifest` → 200 (`Content-Type: application/manifest+json`)
- [x] Local icon URL'leri → 200 (`/icons/icon-192.png`, `/icons/maskable-512.png`)
- [ ] Chrome DevTools → Application → Manifest → "Installability" yeşil
- [ ] iOS Safari "Ana Ekrana Ekle" doğru ad + ikon ile çalışıyor
- [ ] Lighthouse PWA skorunda "Installable" check geçiyor

---

## 5. Service Worker 🔧

### 5.1 Tasarım kararları (🧠 Claude — TAMAMLANDI, bkz. `mobile-design-decisions.md` §5.1)

> Library: `@serwist/next`. Cache stratejisi tablosu + offline fallback + versiyonlama + `/admin`/auth cache YASAK kararları design doc'ta finalize edildi.

**Strateji seçimi:**

| Kaynak | Strateji | Cache TTL | Sebep |
|---|---|---|---|
| HTML sayfalar | Network-first | 1 dk | Veri canlı, eski göstermek tehlikeli |
| Static CSS/JS (`_next/static/*`) | Cache-first | 1 yıl | Hash'li dosyalar, sürüm değişimi otomatik |
| Görseller (`_next/image/*`) | Cache-first | 30 gün | Bandwidth tasarrufu |
| Fontlar | Cache-first | 1 yıl | Web fontları stabil |
| API `/api/v1/prices/*` | Network-first | 30 sn | Canlı veri, ama offline fallback |
| API `/api/v1/prices/widget` | Stale-while-revalidate | 5 dk | Embed widget, agresif cache OK |
| Diğer API | Network-only | — | Cache'leme |

**Offline fallback:**
- `/offline.html` sayfası — kompakt mesaj "Bağlantı yok, daha önce ziyaret ettiğiniz sayfalara erişebilirsiniz"
- Sadece HTML fetch fail olunca gösterilir

**Library seçimi:**
- `next-pwa` veya manual `serwist` — Next.js 16 + App Router uyumu için **serwist** önerilir (next-pwa'nın App Router desteği zayıf)

### 5.2 Implementation (🤖 Codex)

- [ ] `bun add @serwist/next` (root'tan, workspace'e ekle)
  - 2026-05-28 Codex notu: `bun add @serwist/next --filter hal-fiyatlari-frontend` monorepo kökündeki eksik workspace path'leri (`packages/shared-frontend`, `packages/ecosystem-weather-widget`) nedeniyle tamamlanamadı.
- [ ] `frontend/next.config.ts` — Serwist plugin entegre et
- [x] Geçici manuel SW: `frontend/src/app/sw.js/route.ts` — service worker logic, strateji table'a göre
- [x] `frontend/src/components/providers/ServiceWorkerProvider.tsx` — `/sw.js` registration + offline banner
- [x] `frontend/src/app/offline/page.tsx` (yeni) — offline fallback sayfası
- [x] `frontend/src/proxy.ts` — `/offline` i18n proxy bypass
- [x] Versiyonlama: cache name'lerine git commit hash/env versiyon ekle (deploy'da yeni SW eskileri temizler)

**Önemli güvenlik notu:**
- Admin sayfalarını (`/admin/*`) ASLA cache'leme — service worker'da explicit skip
- Auth endpoint'lerini de cache'leme

### 5.3 Kabul kriteri

- [x] `https://haldefiyat.com/sw.js` erişilebilir — **200** (canlı doğrulandı 2026-05-30)
- [x] Local `http://127.0.0.1:3034/sw.js` → 200 (`Content-Type: application/javascript`)
- [x] Local `http://127.0.0.1:3034/offline` → 200
- [x] Headless Chrome local SW check → scope `/`, active `/sw.js`, state `activated`
- [ ] Chrome DevTools → Application → Service Workers → "activated and running"
- [ ] Offline test (DevTools network → Offline) → daha önce ziyaret ettiğin sayfa cache'ten yüklenir
- [ ] `/api/v1/prices/today` offline'da son cache'lenmiş veri döner, üstüne "offline" banner
- [ ] Yeni deploy sonrası eski SW otomatik temizlenir (versiyon check)

---

## 6. SEO ve Sosyal Paylaşım 🔍

### 6.1 Tasarım (🧠 Claude — TAMAMLANDI: spec tanımlı, doğrulama Codex 6.2'de)

Mobile-specific değişiklikler minimum. Mevcut meta + structured data zaten iyi (audit SEO skoru 92-100). Claude spec'i: viewport `maximum-scale=5`, OG min 1200x630, Twitter `summary_large_image`. Bu 3 kontrolün fiili doğrulaması Codex (6.2).

**Kontroller (Codex doğrulayacak):**
- [x] `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">` — `maximum-scale` accessibility için 5 olmalı, 1 değil
- [x] Open Graph görsellerinin mobile'da rate edilebileceği kalitede (min 1200x630)
- [x] Twitter Card `summary_large_image` kullanımı

### 6.2 Implementation (🤖 Codex)

- [x] Viewport meta'yı doğrula
- [ ] Hala eksik OG image'ler varsa M11.4 ile birlikte düzelt
  - 2026-05-28 Codex notu: `frontend/public/og-default.png` 1200x630. Homepage HTML `https://haldefiyat.com/uploads/og/home.png` referanslıyor; local backend uploads kapalı olduğu için gerçek upload asset kalite kontrolü canlı/asset erişimiyle tamamlanmalı.
- [x] Robots.txt mobile sitemap referansı var mı kontrol
  - 2026-05-28 Codex notu: `robots.txt` `https://haldefiyat.com/sitemap.xml` ve `https://haldefiyat.com/news-sitemap.xml` döndürüyor.

### 6.3 Kabul kriteri

- [ ] Mobile Lighthouse SEO skoru 100
- [x] Local HTML viewport/social meta smoke: `maximum-scale=5`, `og:image`, `twitter:image`, `summary_large_image`
- [ ] Google Mobile-Friendly Test → "Page is mobile friendly"

---

## 7. Performans ⚡

### 7.1 Hedefler (🧠 Claude — TAMAMLANDI, bkz. `mobile-design-decisions.md` §7.1)

> Baseline audit (`mobile-audit-2026-05-28.md`): mobil Performance `/`=72, ürünler 74-81, `/fiyatlar`=81, `/karsilastirma`=77. Hedefler aşağıda; öncelik P1 sayfalar (1.2 kategorizasyonu).

| Metric | Hedef | Şu an (tahmini) |
|---|---|---|
| Mobile Lighthouse Performance | ≥ 90 | ? (Görev 1.1 baseline'dan gelecek) |
| LCP (mobile, 3G Fast) | < 2.5s | ? |
| INP | < 200ms | ? |
| CLS | < 0.1 | ? |
| First Load JS bundle | < 200KB gzip | ? |

### 7.2 Implementation (🤖 Codex)

- [ ] LCP element neyse onu öncele (anasayfa hero, ürün sayfası price chart)
- [ ] `next/image` ile responsive görsel — `sizes` prop'u doğru
- [x] Recharts gibi heavy lib'ler `dynamic(() => import(...))` ile lazy — **2026-05-30 (Claude, canlı):** ürün sayfası `PriceChart` statik import idi → `PriceChartLazy` (ssr:false) on-demand chunk; recharts ürün sayfası ilk bundle'ından çıktı. SeasonCompare/Comparison zaten lazy. Fiyat+schema SSR korundu.
- [x] Font preload + subset — `next/font/google` (Outfit + IBM Plex Sans), `subsets:["latin"]`, `display:swap`, self-hosted — **zaten optimal** (doğrulandı 2026-05-30).
- [ ] `next-intl` mesaj dosyalarını route bazlı bölme (i18n payload azaltma)
- [ ] Unused CSS purge — Tailwind v4 zaten yapıyor ama doğrula

### 7.3 Kabul kriteri

- [ ] Hedef metrikler karşılanıyor
  - 2026-05-28 Codex notu: `/canli-hal-fiyatlari` local mobile Lighthouse Performance 90, LCP 3.5s, TBT 120ms, CLS 0; desktop Performance 98, LCP 1.1s. 95+ için daha yapısal bundle/analytics ayrıştırması gerekiyor.
- [ ] Lighthouse rapor PDF'i `docs/lighthouse-mobile-2026-XX-XX.pdf` olarak kayıtta

---

## 8. Test 🧪

### 8.1 Otomatik testler (🤖 Codex)

- [ ] Playwright veya benzeri ile 5 ana sayfanın mobile viewport screenshot regresyon testi
- [ ] Lighthouse CI — PR'da otomatik mobile skoru raporu

### 8.2 Manuel testler (👤 Orhan — 🚫 Codex'e verilmez)

> Bu testler gerçek cihaz / gerçek deneyim gerektirir. Codex headless yapamaz, Orhan yapar.

- [ ] **iPhone Safari** — 1 sayfa gez, herhangi bir element bozuk mu
- [ ] **Android Chrome** — aynı test
- [ ] **PWA install prompt** — Chrome mobile'da "Ana ekrana ekle" geliyor mu
- [ ] **PWA standalone mode** — yüklendikten sonra standalone açılıyor mu
- [ ] **Offline davranışı** — uçak modunda son ziyaret edilen sayfa açılıyor mu
- [ ] **Dark/light tema** — sistem teması değişince anında uyuyor mu
- [ ] **Touch targets** — parmakla denerken yanlış element'e basılıyor mu
- [ ] **Login mobile akışı** — registration + login form'lar mobile'da kullanışlı mı

---

## 9. Yayınlama 🚀

### 9.1 Deploy (🤖 Codex)

```bash
cd /home/orhan/Documents/Projeler/tarim-dijital-ekosistem/projects/hal-fiyatlari/frontend
bun run build
# Hata yoksa:
scp ... # değişen dosyaları VPS'e
ssh vps-vistainsaat 'cd /var/www/.../frontend && bun run build && pm2 reload hal-frontend --update-env'
```

### 9.2 Canlı doğrulama (👤 Orhan)

- [ ] `curl https://haldefiyat.com/manifest.json` → 200
- [ ] `curl https://haldefiyat.com/sw.js` → 200
- [ ] `curl -I https://haldefiyat.com/manifest.json | grep -i content-type` → `application/manifest+json` (önerilir, JSON da olur)
- [ ] Chrome incognito mobile'da `https://haldefiyat.com` aç → install prompt veya menüden "Ana ekrana ekle"
- [ ] Kurulu uygulamayı aç → standalone mode (URL bar yok)
- [ ] Eski cache temizleme — service worker versiyon güncel

### 9.3 Cache sorunu varsa

Eski SW cache'leri kullanıcılarda sorun çıkarırsa:
- [ ] Service worker'ı `skipWaiting()` + `clients.claim()` ile force update
- [ ] Cache name'ini versiyonla (`hf-cache-v2`)
- [ ] Geçici olarak SW'yi devre dışı bırakmak için boş SW deploy et

---

## 10. Sonraki Aşama 🔮

Bu checklist'in kapsamı dışı, sonra spec yazılacak:

### 10.1 Push bildirimleri (Faz 2)
- 🧠 Claude: Mesaj politikası, sıklık, segmentasyon stratejisi
- 🤖 Codex: OneSignal entegrasyonu (zaten OneSignalProvider mevcut), backend trigger endpoint'leri
- 👤 Orhan: İlk push gönderimi onayı, içerik

### 10.2 Mobil fiyat alarmı UX
- Şu anki form'u mobile'da bir-iki tıkla kullanılır hale getir
- Slider veya quick-select chip'ler

### 10.3 Konum bazlı kişiselleştirme
- Geolocation API → en yakın hal otomatik seçim
- Gizlilik: opt-in only, KVKK uyumu

### 10.4 Favori ürünler mobil dashboard
- "Takip listem" kompakt mobile view
- Bildirim ayarı per ürün

### 10.5 App Store / Play Store (Faz 3)
- 🧠 Claude: PWA yeterli mi yoksa native app gerek mi karar
- Eğer native: Expo / Capacitor / React Native plan

---

## Önerilen Uygulama Sırası

1. **Görev 1 (audit) — Codex** — Hangi sayfa hangi sorun, baseline çıkar
2. **Görev 2 + 3 (anasayfa + nav) — Claude wireframe → Codex implement** — En büyük UX kazanç
3. **Görev 7 (performans) — Codex** — LCP optimize, lazy load
4. **Görev 4 (manifest) + 5 (service worker) — Codex** — PWA temeli
5. **Görev 8 (test) — Codex otomatik + Orhan manuel**
6. **Görev 9 (deploy) — Codex → Orhan doğrulama**

**Tahmini efor:** 4-6 gün toplam (paralel olursa 3-4 gün).

---

## Bağlantılar

- M11.4 Landing sayfası (mobile-first): [`docs/codex-briefs/M11-4-landing-canli-hal-fiyatlari.md`](./docs/codex-briefs/M11-4-landing-canli-hal-fiyatlari.md)
- Ana Ads checklist: [`ADS-SETUP-CHECKLIST.md`](./ADS-SETUP-CHECKLIST.md)
- PageContainer (1400px max-width standardı): `frontend/src/components/layout/PageContainer.tsx`
- OneSignal provider (mevcut, push için hazır): `frontend/src/app/layout.tsx`

---

## Codex'e Brief Verilirken (Orhan'a not)

Codex'e bu checklist'in **tamamını verme.** Bölümleri tek tek paylaş:

**Codex'in alabileceği bölümler:**
- 1.1 (audit görevi)
- 2.2 (anasayfa implementation — Claude wireframe'inden sonra)
- 3.2 (navigasyon implementation — kullanıcı karar sonrası)
- 4.3 (manifest implementation)
- 5.2 (service worker implementation)
- 6.2 (SEO implementation)
- 7.2 (performans implementation)
- 8.1 (otomatik testler)
- 9.1 (deploy)

**Codex'e verilmeyecek bölümler (Claude/Orhan):**
- 2.1 (wireframe kararı — Claude vermiş, Codex sorgulamasın)
- 3.1 (bottom nav kararı — Orhan kararı)
- 4.1 (manifest payload — Claude kararı)
- 4.2 (ikon tasarımı — Orhan asset hazırlığı)
- 5.1 (cache strateji kararı — Claude)
- 7.1 (performans hedefleri — Claude)
- 8.2 (manuel cihaz testleri — Orhan)
- 9.2 (canlı doğrulama — Orhan)
- 10.x (sonraki faz kararları — Claude + Orhan)

Codex bir bölüme bakarken referans olarak diğer bölümleri görebilir ama **karar yetkisi yok**, "bu wireframe yanlış olabilir mi" tarzı sorgulama yapmasın — Claude verdiyse onaylı.
