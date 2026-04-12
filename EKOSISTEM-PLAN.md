# Hal Fiyatlari — Ekosistem Entegrasyon Plani

**Durum:** Planlama asamasi
**Katman:** Katman 1 — Icerik (Gorunurluk & Guven)
**Faz:** Faz 1 (Ay 1-2)

---

## Ekosistem Icerisindeki Rol

Hal Fiyatlari, ekosistemin **gunluk ziyaret sebebi**. Ciftciler her gun fiyat kontrol eder — bu aliskanlik tum ekosisteme surekli trafik saglar.

```
Hal Fiyatlari (BU PROJE)
├── Veri Kaynaklari (giris)
│   ├── Hal veri API'leri       -> Resmi hal verileri
│   ├── Tarim Bakanligi         -> Gunluk fiyat verileri
│   └── Kullanici bildirimleri  -> Community fiyat girdisi
├── Tuketiciler (cikis)
│   ├── Ziraat Haber Portali    -> Haftalik fiyat analizi haberi
│   ├── Maliyet Analizi         -> Satis fiyati referansi
│   ├── Verim Tahmini           -> Fiyat trendi verisi
│   ├── B2B Pazaryeri           -> Piyasa fiyati benchmark
│   └── Sera SaaS               -> Hasat zamanlama karari icin fiyat
└── Kullanici Akisi
    ├── -> B2B Pazaryeri         (fiyat goren -> satin al/sat)
    ├── -> Tarim Ansiklopedisi   (urun ismi -> bilgi sayfasi)
    └── -> Bereketfide/VistaSeed (urun adi -> fide/tohum sayfasi)
```

## Diger Modullerle Iletisim

| Modul | Yon | Iletisim Sekli | Detay |
|-------|-----|----------------|-------|
| **Ziraat Haber Portali** | -> veri verir | REST API | Haftalik fiyat ozeti haber olarak yayinlanir |
| **Maliyet Analizi** | -> veri verir | REST API | Guncel satis fiyatlari kar/zarar hesabinda kullanilir |
| **Verim Tahmini** | -> veri verir | REST API | Fiyat trendleri karar motorunda girdi |
| **B2B Pazaryeri** | <-> cross-link | REST API + link | Piyasa fiyati gostergesi + "satin al" yonlendirmesi |
| **Sera SaaS** | -> veri verir | REST API | Hasat zamanlama karari icin fiyat verisi |
| **Bereketfide** | -> yonlendirir | Link | Urun ismine tiklaninca fide sayfasina git |
| **VistaSeed** | -> yonlendirir | Link | Urun ismine tiklaninca tohum sayfasina git |
| **Tarim Ansiklopedisi** | -> yonlendirir | Link | Urun ismine tiklaninca ansiklopedi sayfasina git |
| **Hava Durumu** | <- veri alir | REST API | Hava -> fiyat korelasyonu analizi |

## Yapilacak Isler

### Teknik Stack
```
Frontend : Next.js 16 + TypeScript + Tailwind CSS v4
Backend  : Fastify + Drizzle ORM + MySQL
Cache    : Redis (fiyat verisi cache)
Cron     : BullMQ (gunluk fiyat cekme)
Deploy   : Docker + Nginx + PM2
Port     : Frontend 3033, Backend 8088
```

### P0 — MVP (Ay 1-2)
- [x] Proje iskeletini olustur
- [x] DB semalari: `hf_markets`, `hf_products`, `hf_price_history`, `hf_alerts`, `hf_etl_runs`
- [x] Veri toplama servisi:
  - [x] IBB (İstanbul) + İzmir hal API entegrasyonu
  - [x] Gunluk otomatik cekme — `node-cron` 06:15 UTC+3 (`src/cron.ts`)
  - [x] Veri normalizasyonu — Türkçe karakter normalize + alias map (`src/modules/etl/normalizer.ts`)
- [x] Frontend sayfalari:
  - [x] Anasayfa: hero, ticker, fiyat kartlari, sehir secici, stats, features, CTA
  - [x] /fiyatlar: filtrelenebilir fiyat tablosu (sehir, kategori, siralama)
  - [x] /urun/[slug]: fiyat grafigi (7/30/90 gun) + sezonluk karsilastirma
  - [x] /hal/[slug]: hale ozel fiyat tablosu
  - [x] /hal: tum haller bölgesel liste sayfasi
  - [x] /karsilastirma: 4'e kadar urun overlay grafigi
  - [x] SearchModal (⌘K): urun + hal autocomplete
- [x] Fiyat degisim alarmi:
  - [x] AlertModal UI (urun/market secimi, esik fiyat, yon, email/Telegram)
  - [x] Backend checker cron — 06:30 UTC+3 (`src/modules/alerts/checker.ts`)
  - [x] Telegram bildirim (`src/modules/alerts/telegram.ts`)
  - [x] Email bildirim — SMTP/nodemailer (`src/modules/alerts/email.ts`)
- [x] SEO: JSON-LD Dataset (anasayfa) + Product schema (/urun), generateMetadata tum sayfalarda

### P1 — Kisa Vade (Ay 2-3)
- [x] Sezonluk karsilastirma grafikleri — yillik overlay chart (`SeasonCompare.tsx`)
- [x] Bolgesel piyasa analizi sayfasi — `/hal` index, bolgeye gore gruplu
- [x] Fiyat alert sistemi: `POST /api/v1/alerts` + `GET/DELETE` endpoints
- [x] REST API: diger ekosistem platformlari icin fiyat verisi
  ```
  GET /api/v1/prices?product=domates&city=antalya&range=7d     ✅
  GET /api/v1/prices/trending                                   ✅
  GET /api/v1/prices/products                                   ✅
  GET /api/v1/prices/markets                                    ✅
  GET /api/v1/prices/history/:slug                              ✅
  GET /api/v1/prices/weekly-summary                             ✅
  GET /api/v1/prices/widget                                     ✅
  ```
- [x] Haber portali entegrasyonu: `GET /api/v1/prices/weekly-summary` (JSON ozet)
- [x] Widget embed kodu: `GET /api/v1/prices/widget?limit=6` (CORS: *, 5 dk cache)

### Rakip Analiz Notlari — Agrimetre.com (12 Nisan 2026)

**Agrimetre nedir:** Türkiye'nin lider tarımsal veri zekası platformu (B2B odaklı).
900+ ürün, 200+ ülke, 15 yıl geçmiş veri. USDA/FAO/TÜİK kaynaklı makro veri.
Abonelik: 449 TL/ay (Standard) → 4.259 TL/ay (Premium). Hal verisi premium arkasında.

**Stratejik Fark:**
- Agrimetre: makro tarım datası, B2B, kurumsal, ücretli
- HaldeFiyat: hal fiyatları, B2C + küçük üretici/esnaf, ücretsiz, gerçek zamanlı
- Rakip değil — konumlanma farkı büyük. Agrimetre'nin hal verisi 4.259 TL/ay arkasında,
  bizimki ücretsiz + daha iyi UX → güçlü farklılaşma.

**Agrimetre'den Alınacak İlham:**

| Öncelik | Özellik | Açıklama | Durum |
|---------|---------|----------|-------|
| P1 | Geçen hafta / geçen yıl karşılaştırması | Fiyat kartlarında `+%18 geçen yıla göre` etiketi | [ ] |
| P1 | Haftalık e-bülten | "Bu hafta en çok değişen 10 ürün" otomatik mail | [ ] |
| P1 | Sezonluk rehber | "Şu an mevsimi olan ürünler" anasayfa bölümü | [ ] |
| P2 | Türkiye interaktif haritası | İl bazında fiyat haritası, SVG, renk skalası | [ ] |
| P2 | ÜFE/TÜFE entegrasyonu | Fiyat artışını enflasyona karşı göster | [ ] |
| P2 | İl bazında üretim notu | `/urun/[slug]` → "Bu ürün en çok Antalya'da yetişir" | [ ] |
| P2 | CSV export | Ücretsiz indirme — agrimetre bunu ücretli yapıyor | [x] `GET /api/v1/prices/export` |
| P3 | Ücretsiz Geliştirici API | Açık API dokümantasyonu — agrimetre kapalı tutuyor | [ ] |
| P3 | Pro üyelik | Daha fazla geçmiş veri, API key, öncelikli destek — 99 TL/ay | [ ] |
| P3 | Telegram botu | Sabah 09:30 otomatik hal bülteni kanalı | [ ] |
| P3 | Mobil uygulama | Agri Wise benzeri ama hal odaklı | [ ] |
| P3 | Kurumsal raporlar | Zincir marketler / ihracatçılar için özel rapor | [ ] |

**HaldeFiyat'ın üstün olduğu alanlar:**
1. Hız — Next.js standalone vs. ağır WordPress tabanlı Agrimetre
2. Ücretsiz hal verisi — Agrimetre 4.259 TL/ay premium arkasında saklıyor
3. Günlük güncelleme — Agrimetre raporları haftalık/aylık
4. UX — modern dark theme, mobil-first, anlık arama
5. PWA — offline çalışma, anasayfaya ekle desteği

---

### P2 — Orta Vade (Ay 3-6)
- [ ] Ekosistem auth entegrasyonu (SSO) — `registerAuth` shared-backend'de hazir, `hf_user_favorites` tablosu seed'e eklenince aktif edilecek (`src/modules/favorites/README.md`)
- [x] Kullanici favori urunleri — localStorage MVP (`src/lib/favorites.ts` + `/favoriler` sayfasi + FavoriteButton PriceCard'da)
- [x] CSV fiyat raporu indirme — `GET /api/v1/prices/export?format=csv` (BOM, UTF-8, TR basliklar) + ExportButton frontend
- [x] Fiyat tahmin modeli — lineer regresyon (`src/lib/trend.ts` + `GET /api/v1/prices/forecast/:slug`) + PriceChart'ta tahmin cizgisi (kesik, soluk lime)
- [x] Mobil PWA — `src/app/manifest.ts` (standalone, theme #84f04c, shortcuts: fiyatlar/favoriler) + viewport themeColor
