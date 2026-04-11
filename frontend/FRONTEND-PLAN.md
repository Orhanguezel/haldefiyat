# HalDeFiyat — Frontend Yapılandırma Planı

**Referans Tasarım:** `haldefiyat.html`
**Stack:** Next.js 16, TypeScript, Tailwind CSS v4, next-intl (tr-only), Framer Motion, Recharts
**Backend API:** `http://localhost:8088/api/v1`
**Port:** 3033

---

## Mevcut Durum

```
frontend/src/
├── app/
│   ├── globals.css          ✅ Dark lime theme token'ları hazır
│   ├── layout.tsx           ✅ Outfit + IBM Plex Sans, data-theme="dark"
│   └── [locale]/(public)/
│       ├── layout.tsx       ⚠️  Header/Footer iskelet (içerik boş)
│       ├── page.tsx         ⚠️  Section iskelet (veri bağlantısı yok)
│       ├── fiyatlar/        ⚠️  Boş iskelet
│       ├── hal/[slug]/      ⚠️  Boş iskelet
│       ├── urun/[slug]/     ⚠️  Boş iskelet
│       ├── karsilastirma/   ⚠️  Boş iskelet
│       ├── hakkimizda/      ⚠️  Boş iskelet
│       ├── iletisim/        ⚠️  Boş iskelet
│       └── gizlilik-politikasi/ ⚠️ Boş iskelet
├── components/
│   ├── Header.tsx           ⚠️  Nav linkleri var, arama yok
│   ├── Footer.tsx           ⚠️  Temel iskelet
│   └── seo/ ui/             ✅  VistaSeed'den devralındı
└── lib/ config/ i18n/       ✅  Yapılandırıldı
```

---

## Tasarım Referansı — Bölüm Analizi

### HTML'deki Bölümler (sırasıyla)
| # | Bölüm | HTML ID/Class | Durum |
|---|-------|---------------|-------|
| 1 | Ambient arka plan (orb'lar + grid) | `.ambient`, `.grid-bg` | — |
| 2 | Topbar (canlı veri, istatistik, tarih) | `.topbar` | — |
| 3 | Header (logo, nav, arama, butonlar) | `header` | ⚠️ Eksik |
| 4 | Hero (h1, chip, CTA butonları, özellik ikonları) | `.hero` | — |
| 5 | Live Ticker (kayan fiyat bandı) | `.ticker-section` | — |
| 6 | Price Dashboard (4'lü kart grid, mini sparkline) | `#fiyatlar` | — |
| 7 | City Selector (6'lı grid, featured badge) | `#sehirler` | — |
| 8 | Stats Bar (81 il, 2480+ ürün, 2x güncelleme) | `.stats-section` | — |
| 9 | Features (3x2 özellik kartları) | `#hakkinda` | — |
| 10 | How It Works (4 adım, numbered cards) | `.steps-grid` | — |
| 11 | CTA + Newsletter (e-posta abonelik formu) | `.cta-section` | — |
| 12 | Footer (2fr+1fr+1fr+1fr grid) | `footer` | ⚠️ Temel |

---

## Görev Listesi

### 🔴 P0 — Temel Altyapı

- [ ] **`src/lib/api.ts`** — API client hook'ları
  - `usePrices(params)` — fiyat listesi
  - `useProducts()` — ürün listesi
  - `useMarkets()` — hal listesi
  - `useTrending()` — trend verisi
  - `usePriceHistory(slug, range)` — grafik verisi
  - Tüm fetch'ler `revalidate: 300` (5 dk cache)
  - Hata durumunda fallback: boş array

- [ ] **`src/components/ui/AmbientBackground.tsx`**
  - 3 adet fixed `orb` (lime, blue, amber renk)
  - `grid-bg` dot pattern overlay
  - `pointer-events: none`, `z-index: 0`

- [ ] **`src/components/Header.tsx`** güncelle
  - Topbar şeridi ekle: "🟢 Canlı Veri", ürün sayısı, son güncelleme saati, tarih
  - Arama input'u: `⌘K` kısayol badge, focus'ta lime border glow
  - "Giriş Yap" (outline) + "Ücretsiz Başla" (lime/primary) butonları
  - Mobile hamburger toggle
  - Sticky + `backdrop-filter: blur(24px)`

---

### 🟠 P1 — Ana Sayfa Bölümleri

#### Hero Section
- [ ] **`src/components/sections/HeroSection.tsx`**
  - Chip badge: pulse dot + "Canlı Veri Akışı · 81 İl" (mono font, lime)
  - H1: "Türkiye Hal Fiyatları" + `<br>` + gradient text "Tek Ekranda"
  - Subtitle metni (slate-400, 19px, max-w-[600px])
  - İki CTA butonu: "📊 Fiyatları Keşfet" (lime/lg) + "Nasıl Çalışır?" (ghost)
  - 4 özellik ikonu satırı: 📊 📍 📈 🔔
  - Framer Motion: fadeInUp animasyonları (0.1s stagger)

#### Live Ticker
- [ ] **`src/components/sections/PriceTicker.tsx`** — client component
  - `/api/v1/prices/trending?limit=20` → veri çek
  - CSS `@keyframes tickerMove` ile sonsuz kayan band
  - Hover'da duraklama (`animation-play-state: paused`)
  - Her item: emoji + ürün adı + avg fiyat + % değişim badge (yeşil/kırmızı)
  - `mask-image` ile kenar fade efekti

#### Price Dashboard (4'lü kart grid)
- [ ] **`src/components/sections/PriceDashboard.tsx`**
  - `/api/v1/prices?range=1d&limit=8` → API'den canlı çek
  - **`src/components/ui/PriceCard.tsx`**
    - Emoji + ürün adı + şehir (üst sol)
    - UP/DOWN/STABLE badge (sağ üst, mono font)
    - Büyük avg fiyat (mono, 30px) + birim
    - % değişim satırı (yeşil/kırmızı)
    - Mini SVG sparkline chart (40px yükseklik, alan dolgusu)
    - Footer: min/max fiyat + hal adı
    - Hover: `translateY(-4px)` + lime border gradient
  - Responsive: 4 col → 2 col (tablet) → 1 col (mobile)

#### City Selector
- [ ] **`src/components/sections/CitySelector.tsx`**
  - `/api/v1/prices/markets` → hal listesi çek
  - 6 sütun grid (tablet: 3, mobile: 2)
  - "Popüler" badge → `featured` prop (İstanbul, Ankara, İzmir)
  - Kart tıklama → `/fiyatlar?city=istanbul` yönlendir

#### Stats Bar
- [ ] **`src/components/sections/StatsBar.tsx`**
  - 4 stat: 81 İl · 2480+ Ürün · 2x Güncelleme · %100 Ücretsiz
  - Gradient `slate-850 → slate-800` kart arkaplanı
  - Gradient text (lime-500 → lime-300) sayı değerleri
  - Framer Motion `useInView` ile sayaç animasyonu

#### Features Grid
- [ ] **`src/components/sections/FeaturesGrid.tsx`**
  - 6 özellik kartı (3x2 grid)
  - Her kart: renkli ikon kutu + başlık + açıklama
  - İkon renkleri: g(lime) b(blue) a(amber) r(red) p(purple) t(teal)

#### How It Works
- [ ] **`src/components/sections/HowItWorks.tsx`**
  - 4 adım kartı (4 col grid)
  - Büyük numara watermark (top-right, slate-800)
  - Adım: 🌐 Hal Verisini Topla → 🧹 Normalize Et → 📊 Analiz Et → 🔔 Bildir

#### CTA + Newsletter
- [ ] **`src/components/sections/CtaNewsletter.tsx`**
  - Lime/blue gradient bordered kart
  - Radial glow overlay (top center)
  - E-posta input + "Alarm Kur" butonu
  - Alt kısım: Telegram 📱 + E-posta 📧 kanal linkleri
  - `/api/v1/newsletter/subscribe` POST bağlantısı

---

### 🟡 P2 — Sayfa İçerikleri

#### `/fiyatlar` sayfası
- [ ] **`src/app/[locale]/(public)/fiyatlar/page.tsx`**
  - Filtre bar: Şehir dropdown + Kategori dropdown + Sıralama + Tarih picker
  - `usePrices()` hook ile canlı tablo
  - **`src/components/ui/PriceTable.tsx`**
    - Ürün | Hal | Şehir | Min | Maks | Ort | Değişim | Tarih sütunları
    - Renk kodlu değişim sütunu (▲ yeşil / ▼ kırmızı)
    - Satır hover highlight
    - Sayfalama (100 kayıt / sayfa)
  - Kategori filtreleri: Tümü | Sebze | Meyve | Bakliyat
  - URL senkronizasyonu: `?city=istanbul&category=sebze&range=7d`

#### `/hal/[slug]` sayfası
- [ ] **`src/app/[locale]/(public)/hal/[slug]/page.tsx`**
  - Hal başlık kartı: isim + şehir + bölge + kaynak (IBB/İzmir vb.)
  - O hale ait bugünkü fiyat tablosu
  - Son 7/30 günlük en aktif ürünler

#### `/urun/[slug]` sayfası
- [ ] **`src/app/[locale]/(public)/urun/[slug]/page.tsx`**
  - Ürün başlık: emoji + isim + kategori badge
  - Fiyat geçmiş grafiği (Recharts LineChart)
    - 7d / 30d / 90d toggle
    - Tüm hallerden çizgiler veya seçili hal filtresi
    - Min/Max band (area chart), Avg çizgi (line)
  - Tüm hallerdeki bugünkü fiyat tablosu
  - Fiyat alarm kurma formu (threshold + email)

#### `/karsilastirma` sayfası
- [ ] Çoklu ürün seçimi (maks 4 ürün)
- [ ] Aynı grafikte karşılaştırmalı çizgiler (farklı renkler)
- [ ] Recharts ile overlay chart

---

### 🟢 P3 — Detay & Kalite

#### Arama
- [ ] **`src/components/ui/SearchModal.tsx`** — `⌘K` ile açılan modal
  - Ürün adı autocomplete → `/api/v1/prices/products?q=`
  - Hal adı arama → `/api/v1/prices/markets`
  - Sonuca tıklayınca `/urun/[slug]` veya `/hal/[slug]`

#### Fiyat Alarm Modali
- [ ] **`src/components/ui/AlertModal.tsx`**
  - Ürün + hal seçimi
  - Hedef fiyat + yön (above/below)
  - E-posta veya Telegram
  - `/api/v1/alerts` POST

#### Responsive & Mobile
- [ ] Topbar mobile'da gizle
- [ ] Header mobile: hamburger menü drawer
- [ ] Ticker mobile'da çalışmalı
- [ ] Price cards: mobile'da 1 sütun
- [ ] City grid: mobile'da 2 sütun
- [ ] Fiyat tablosu: mobile'da yatay scroll

#### SEO & Performans
- [ ] `generateMetadata()` — her sayfada dinamik title/description
- [ ] JSON-LD `Dataset` schema (fiyat verisi için)
- [ ] `sitemap.ts` — ürün + hal URL'leri dahil
- [ ] Image yok, tüm ikonlar emoji veya SVG inline → LCP minimal
- [ ] API fetch'ler `next: { revalidate: 300 }` ile edge cache

---

## Bileşen Hiyerarşisi

```
app/[locale]/(public)/
├── layout.tsx              → <Header /> + <main> + <Footer />
└── page.tsx (Ana Sayfa)
    ├── <AmbientBackground />
    ├── <HeroSection />
    ├── <PriceTicker />        ← client, /trending
    ├── <PriceDashboard />     ← server, /prices?range=1d
    ├── <CitySelector />       ← server, /markets
    ├── <StatsBar />
    ├── <FeaturesGrid />
    ├── <HowItWorks />
    └── <CtaNewsletter />

components/
├── Header.tsx               → Topbar + Nav + SearchBar + CTA butonlar
├── Footer.tsx               → Brand + Links + Copyright
├── sections/
│   ├── HeroSection.tsx
│   ├── PriceTicker.tsx      (client)
│   ├── PriceDashboard.tsx
│   ├── CitySelector.tsx
│   ├── StatsBar.tsx
│   ├── FeaturesGrid.tsx
│   ├── HowItWorks.tsx
│   └── CtaNewsletter.tsx
└── ui/
    ├── AmbientBackground.tsx
    ├── PriceCard.tsx
    ├── PriceTable.tsx
    ├── SearchModal.tsx      (client)
    └── AlertModal.tsx       (client)

lib/
└── api.ts                   → fetch wrappers (server + client)
```

---

## Renk & Token Referansı (globals.css'ten)

| Token | Değer | Kullanım |
|-------|-------|---------|
| `--color-brand` | `hsl(102 85% 57%)` `#84f04c` | Lime — primary accent |
| `--color-background` | `hsl(225 30% 6%)` `#0a0e1a` | Sayfa arka planı |
| `--color-surface` | `hsl(225 28% 9%)` `#0f1424` | Kart yüzeyi |
| `--color-bg-alt` | `hsl(225 26% 11%)` `#131a2e` | Elevated kart |
| `--color-foreground` | `hsl(225 30% 95%)` | Birincil metin |
| `--color-muted` | `hsl(225 20% 55%)` | İkincil metin |
| `--color-border` | `hsl(225 20% 18%)` | Kenarlık |
| `--color-success` | `hsl(142 76% 36%)` | Fiyat ▲ |
| `--color-danger` | `hsl(0 84% 60%)` | Fiyat ▼ |
| `--font-display` | Outfit | Başlıklar, logo |
| `--font-sans` | IBM Plex Sans | Gövde metni |
| `--font-mono` | IBM Plex Mono | Fiyat, badge, ticker |

---

## Uygulama Sırası

```
1. lib/api.ts                     ← tüm bölümler bu dosyaya bağlı
2. AmbientBackground.tsx          ← layout'a eklenecek
3. Header.tsx (topbar + arama)    ← her sayfada görünür
4. HeroSection.tsx                ← ana sayfa üstü
5. PriceTicker.tsx                ← canlı veri bandı
6. PriceCard.tsx + PriceDashboard ← ana içerik
7. CitySelector.tsx               ← kullanıcı yönlendirme
8. StatsBar.tsx + FeaturesGrid    ← bilgi
9. HowItWorks.tsx + CtaNewsletter ← dönüşüm
10. Footer.tsx                    ← tamamla
11. /fiyatlar sayfası + PriceTable
12. /urun/[slug] + Recharts grafik
13. /hal/[slug]
14. SearchModal (⌘K)
15. AlertModal + /karsilastirma
```

---

## Notlar

- Tüm fiyat değerleri `toLocaleString('tr-TR')` ile formatla
- Emoji'ler ürün `slug`'a göre sabit map'ten gel (domates→🍅, biber→🫑 vb.)
- `PriceTicker` client component — SSR'da verisi olmadan render edilmeli (skeleton)
- Recharts sadece `/urun/[slug]` sayfasında lazy import et (bundle boyutu)
- Fiyat değişim yüzdesi: backend `trending` endpoint'inden geliyor, manuel hesaplama yok
