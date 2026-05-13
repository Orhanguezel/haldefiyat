# HalDeFiyat — GEO & Ekosistem Eksikler Çeklistesi

**Kaynak:** GEO Raporu 08.05.2026 (22/100) + Peer review 12.05.2026 + devam-not-13mayis.md + EKOSISTEM-PLAN.md  
**Son güncelleme:** 2026-05-13 (oturum 7)  
**Hedef skor:** 65+/100

> Tamamlananlar ✅, açık olanlar `[ ]` ile işaretli.  
> Oturum 5'te peer review'dan yeni teknik hatalar ve stratejik öncelikler eklendi.

---

## 🔴 ACİL — Teknik Hatalar & Veri Kalitesi (Peer Review)

> Bunlar kullanıcı güvenini ve algılanan veri kalitesini doğrudan etkiliyor.  
> GEO skoru bağımsız — ancak bounce rate artarsa organik sıralamayı düşürür.

| # | Hata | Etki | Çözüm | Durum |
|---|------|------|-------|-------|
| 49 | ~~Marquee outlier değerler~~ — TICKER_MAX_CHANGE 200→80, brokoli +%198 gibi değerler gizleniyor | Güven kırıcı, "site bozuk" izlenimi | ✅ Giderildi |
| 50 | ~~min/max boş değerler~~ — PriceCard'da ikisi de null ise "yalnızca ort. fiyat mevcut" gösteriliyor | "Eksik veri çekiyor" izlenimi | ✅ Giderildi |
| 51 | ~~StatsBar counter SSR hydration~~ — `useState(target)` ile başlatıldı, crawler artık 81/2480 görüyor | SEO + ilk izlenim kötü | ✅ Giderildi |
| 52 | **Marquee DOM duplication** — iki kopya CSS infinite scroll için intentional (translateX -50%) | Gerçek bug değil, doğru pattern | ✅ Zaten doğru |
| 59 | ~~PriceTable 502 hatası~~ — nginx `/api/` `proxy_read_timeout 180s` eklendi (60s default'tan yukseltildi). Tum buyuk range query'leri 200-400ms (ce750fe). | Fiyat tablosu sayfalari acildi | nginx config + CLAUDE.md notu | ✅ |
| 60 | **Fiyat artış/azalış % hesabı doğrulama** — "artı/azalı yüzde tam belli değil, hatalı olabilir". Dış sitelere de bu veri veriliyor (API üzerinden). Hesaplama bug'ı dış platformlara yanlış veri yayıyor. | Veri güvenilirliği — marka itibarı riski | `/api/v1/prices/trending` ve `changePct` hesaplama mantığını denetle; referans noktası, sıfır/null koruması, yuvarlama | [ ] |

---

## 🔴 KRİTİK — Schema & Teknik SEO

| # | Görev | Sayfa | Durum |
|---|-------|-------|-------|
| 1 | ~~JSON-LD~~ Organization + WebSite + Dataset | Anasayfa | ✅ |
| 2 | ~~JSON-LD~~ Dataset schema | /fiyatlar | ✅ |
| 3 | ~~JSON-LD~~ Product schema | /urun/[slug] | ✅ |
| 4 | ~~JSON-LD~~ Place schema | /hal/[slug] | ✅ |
| 5 | ~~PriceSpecification schema~~ — min/ort/maks + birim + para birimi | /urun/[slug] | ✅ |
| 6 | ~~FAQPage schema~~ — SSS bölümü ile birlikte | Anasayfa + /urun/[slug] | ✅ |
| 7 | ~~BreadcrumbList schema~~ — tüm iç sayfalar | Tüm sayfalar | ✅ |
| 8 | ~~DataCatalog schema~~ — veri kataloğu | /fiyatlar | ✅ |
| 9 | ~~SiteLinksSearchBox schema~~ — WebSite potentialAction | Anasayfa | ✅ |

### Sitemap

| # | Görev | Durum |
|---|-------|-------|
| 10 | ~~Dinamik sitemap~~ — hal + ürün sayfaları | ✅ |
| 11 | ~~Sitemap image entries~~ — 489 görsel | ✅ |
| 12 | ~~IndexNow~~ — key dosyası + ETL sonrası POST | ✅ |

### Güven / E-E-A-T

| # | Görev | Durum |
|---|-------|-------|
| 13 | ~~Gerçek telefon numarası~~ — +90 530 048 41 83 | ✅ |
| 14 | ~~Gerçek e-posta~~ — atakan07sahin@gmail.com | ✅ |

---

## 🟠 YÜKSEK — Bu Ay

### Meta / Open Graph

| # | Görev | Durum |
|---|-------|-------|
| 15 | ~~og:image~~ — ürün fotoğrafı (68 ürün), logo fallback | ✅ |
| 16 | ~~Twitter Card~~ `summary_large_image` + product photo | ✅ |
| 17 | ~~Meta description şablon~~ — hal + urun sayfaları | ✅ |

### İçerik & E-E-A-T

| # | Görev | Detay | Durum |
|---|-------|-------|-------|
| 18 | ~~llms.txt format~~ — plain-text, doğru content-type | | ✅ |
| 19 | ~~llms-full.txt~~ — 1128 ürün + 29 hal dinamik | | ✅ |
| 20 | ~~Ürün sayfaları editoryal içerik~~ — about + priceFactors + season + productionRegion, 27 ürün | /urun/[slug] | ✅ |
| 21 | ~~Hal sayfaları editoryal içerik~~ — description + coverage + specialties, 29 hal | /hal/[slug] | ✅ |
| 22 | ~~Hakkımızda genişlet~~ — ~1100 kelime, veri kalitesi + API + misyon | /hakkimizda | ✅ |
| 23 | ~~SSS bölümü~~ — FAQPage schema + görünür içerik | Anasayfa + /urun/[slug] | ✅ |

### Canonical & Teknik

| # | Görev | Durum |
|---|-------|-------|
| 24 | ~~Canonical URL tutarlılığı~~ — /tr/ prefix standart, audit temiz | ✅ |
| 25 | ~~CCBot Allow~~ — robots.txt | ✅ |

### Sosyal Medya & Marka — Mevcut Skor: 12/100

| # | Görev | Detay | Durum |
|---|-------|-------|-------|
| 26 | ~~Twitter/X hesabi~~ `@haldefiyat` — Hesap acildi, paylasimlar baslamis. Gunluk otomatik tweet ileride (cron). | ✅ |
| 27 | ~~Instagram hesabi~~ `@haldefiyat` — Hesap acildi, gorsel paylasimlar baslamis. | ✅ |
| 28 | ~~Footer sosyal medya linkleri~~ — DB `site_settings` `social_twitter`+`social_instagram` eklendi. Footer ikonlari canli (Twitter/X + Instagram). Iletisim sayfasinda kontrol gerek. | ✅ Footer / [ ] Iletisim |
| 29 | **Telegram kanalı + bot** | Kanal: günlük hal bülteni (backend cron). Bot: kullanıcı `/domates` yazar → o günün min/ort/maks fiyatı döner. Viral potansiyeli yüksek. | [ ] kanal cron'u var, bot yok |
| 30 | ~~sameAs property~~ — `(public)/layout.tsx` Organization schema'da `sameAs` array'i DB social_* keys'ten doluyor. | ✅ |

---

## 🟡 ORTA — Bu Çeyrek

### Analitik Özellikler

| # | Özellik | Öncelik | Durum |
|---|---------|---------|-------|
| 31 | ~~Geçen yıl karşılaştırması~~ — /urun/[slug] fiyat tablosunda `+%X geçen yıla` badge | P1 | ✅ |
| 32 | ~~Haftalik e-bulten~~ — HTML mail digest modulu + cron (pazartesi 09:00 TRT) + preview/test endpoint'leri. SMTP credentials + ilk abone bekleme. (7f02ef7, 3512cc3) | P1 | ✅ kod / 🚧 SMTP+abone bekleme |
| 33 | ~~Sezonluk rehber bölümü~~ — anasayfada "Şu an mevsimi olan ürünler" kartları | P1 | ✅ |
| 34 | **Türkiye interaktif haritası** — il bazında fiyat haritası, SVG + renk skalası | P2 | [ ] |
| 35 | **ÜFE/TÜFE entegrasyonu** — fiyat artışını enflasyona karşı göster | P2 | [ ] |
| 36 | ~~İl bazında üretim notu~~ — 27 üründe "Başlıca üretim bölgesi" alanı | P2 | ✅ |

### İçerik Genişletme — Google News / Discover Kapısı (YENİ)

> **Peer review notu:** Site şu hâliyle Google News'e uygun değil (tablo/fiyat listesi ≠ haber).  
> Ancak `/analiz` altında editöryal yazı yayınlanırsa Publisher Center'a **ayrı path** olarak sunulabilir.  
> Elimizde kimsenin sahip olmadığı veri var — bu yazılar otomatik alıntılanabilir içerik üretir.

| # | Görev | Format | Durum |
|---|-------|--------|-------|
| 53 | **`/analiz` bölümü aç** — haftalık fiyat yorumları, Google News/Discover hedefi | BlogPosting + Article schema, yazar byline, tarih satırı. Örnek: "Mayıs 2. Hafta: Domates fiyatları neden %18 düştü?" | [ ] |
| 54 | **Haftalık endeks raporu yazısı** — her Pazartesi /analiz altında otomatik publish (ETL verisiyle) | ~300 kelime, en çok artan/düşen 3 ürün, sezon notu, YoY karşılaştırma | [ ] |
| 55 | **Google Publisher Center başvurusu** — /analiz path'i için | /analiz en az 5 yayında gerekli, sonra başvuru | [ ] |

### API & Monetization (YENİ)

> **Peer review notu:** "%100 Ücretsiz" sürdürülebilir değil. B2B kullanıcılar (restoran zincirleri, market zincirleri, gıda toptancıları) veri için ödüyor.

| # | Görev | Detay | Durum |
|---|-------|-------|-------|
| 56 | **API rate limiting implementasyonu** — Free tier: 100 req/gün/IP, Pro: sınırsız | Nginx `limit_req_zone` veya backend middleware; 429 response + "Pro için kayıt ol" mesajı | [ ] |
| 57 | **API key sistemi** — kayıt → token → rate limit bypass | Users tablosuna `api_key` kolon, `/api/v1/keys` endpoint | [ ] |
| 58 | **Pro üyelik sayfası** — fiyatlandırma, özellikler, kayıt formu | 99 TL/ay: 30+ gün geçmiş, API key, CSV export, öncelikli destek | [ ] |

### Marka Otoritesi & GEO

| # | Görev | Durum |
|---|-------|-------|
| 37 | **Google News başvurusu** — #55 tamamlanınca | [ ] |
| 38 | **Tarım yayınlarına basın bülteni** — Dünya Gazetesi, Tarım TR, Ziraat Odaları | [ ] |
| 39 | **Yıllık fiyat raporu PDF** — "Türkiye Hal Fiyatları 2025 Yıllık Raporu" | [ ] |
| 40 | ~~API dokümantasyon sayfası~~ — DataFeed schema, robots:noindex kaldırıldı | ✅ |
| 41 | **Embed widget** — endeks veya fiyat tablosu, `<iframe>` kodu, backlink kaynağı | [ ] |

### Ekosistem Entegrasyon

| # | Görev | Durum |
|---|-------|-------|
| 42 | **Ekosistem auth SSO** — `hf_user_favorites` seed'e ekle, `registerAuth` aktif et | [ ] |
| 43 | ~~Haftalik e-bulten backend~~ — `weekly-mail-digest.ts`, cron, admin endpoint'leri. SMTP+abone canliya gecince calisir. | ✅ kod |
| 44 | **Ziraat Haber Portali entegrasyonu** — `/api/v1/prices/weekly-summary` otomatik haber? | [ ] kontrol et |

### Rakip İzleme (Competitor Monitor)

| # | Görev | Detay | Durum |
|---|-------|-------|-------|
| 61 | ~~Competitor-monitor backend~~ — DB tabloları, checker, router, cron (her Pazartesi 07:00 UTC) | tarimpiyasa, guncelfiyatlari, halfiyat.vercel.app izleniyor | ✅ |
| 62 | **Competitor-monitor admin panel sayfası** — sites listesi + son snapshot + manuel run butonu | `admin_panel/src/app/.../competitor-monitor/page.tsx` — `/api/v1/admin/competitor-monitor/sites` endpoint'i hazır | [ ] |

---

## 🟢 DÜŞÜK — Yıl İçi

| # | Özellik | Durum |
|---|---------|-------|
| 45 | **Ücretsiz Geliştirici API** — açık dokümantasyon, Agrimetre'den farklılaşma | [ ] |
| 46 | **Pro üyelik** — 99 TL/ay (#58 altyapısı hazır olunca) | [ ] |
| 47 | **Mobil uygulama** — PWA hazır, native adım | [ ] |
| 48 | **Kurumsal raporlar** — market zincirleri / ihracatçılar | [ ] |

---

## 🔵 STRATEJİK — Tedarik Zinciri Şeffaflık Platformu

> **Vizyon (13.05.2026):** "Hal fiyatları takibi" → "Türkiye'nin gıda tedarik zinciri şeffaflık platformu"  
> Hedef: Çiftçi → Hal → Manav/Pazar → Market → Tüketici zincirini tek platformda görselleştirmek.  
> Örnek çıktı: *"Domates: Hal ₺25 → Pazar ₺45 → Migros ₺72 → CarrefourSA ₺68 → BİM ₺55"*  
> **Önce hal pipeline'ını mükemmelleştir (#59, #60), sonra market, en son pazar.**

### Altyapı

| # | Görev | Detay | Durum |
|---|-------|-------|-------|
| 63 | **DB `source_type` kolonu** — `hf_prices` tablosuna `source_type ENUM('hal','market_chain','pazar','market_online')` ekle | Mevcut veriler `hal`, yeni market verisi kendi tipini alır; seed SQL'e ekle | [ ] |

### Market Zinciri Fiyatları (Kolay → Zor)

| # | Görev | Detay | Zorluk | Durum |
|---|-------|-------|--------|-------|
| 64 | **BİM haftalık broşür PDF scraper** — `bim.com.tr/Categories/643/aktuel-urunler.aspx` | PDF indirme + `pdfplumber`/`pdf-parse` ile ürün-fiyat parse; scraper-service'e entegre | 🟢 Kolay | [ ] |
| 65 | **A101 haftalık broşür PDF scraper** — `a101.com.tr/aktuel-urunler` | BİM ile aynı yaklaşım; PDF regex veya LLM ile çıkarım | 🟢 Kolay | [ ] |
| 66 | **CarrefourSA online fiyat scraper** — `carrefoursa.com` | Playwright; lokasyon bazlı fiyatlandırma; Rate limit: 1 req/sn max, gece tarama | 🟡 Orta | [ ] |
| 67 | **ŞOK / A101 online fiyat scraper** — `sokmarket.com.tr`, `a101.com.tr` | Playwright veya cheerio; PDF'ye ek olarak güncel raf fiyatı | 🟡 Orta | [ ] |
| 68 | **Migros Sanal Market scraper** — `sanalmarket.migros.com.tr` | JS-heavy + Cloudflare anti-bot; scraper-service `dynamic: true` gerekebilir | 🔴 Zor | [ ] |

### Market UI

| # | Görev | Detay | Durum |
|---|-------|-------|-------|
| 69 | **"Hal vs Market" karşılaştırma sayfası** — `/karsilastir` | Aynı ürün için hal, BİM, Migros, CarrefourSA yan yana; zincir marjını görselleştir | [ ] |
| 70 | **Fiyat zinciri şelale grafiği** — "Domates: Hal → Pazar → Market" waterfall chart | Gazetecilerin alıntılayacağı, paylaşılacak görsel; recharts/D3 | [ ] |

### Pazar Fiyatları

| # | Görev | Detay | Durum |
|---|-------|-------|-------|
| 71 | **Belediye pazar fiyat verileri scraping** — İBB, ABB, İzBB haftalık pazar fiyat raporları | Düzensiz yayın; scraper + normalize; coverage düşük ama başlangıç için yeterli | [ ] |
| 72 | **Crowd-sourcing — pazar fiyat katkı sistemi** — mobile-first fiyat ekleme akışı | GPS + ürün adı + fiyat formu; 3+ kullanıcı girişi → "doğrulanmış"; gamification (puan/badge) | [ ] |
| 73 | **Pazar OCR yardımı** — fiyat tabelası fotoğrafından otomatik fiyat çıkarımı | Tesseract Türkçe veya Claude API; crowd-sourcing formuna entegre | [ ] |

### Fiş OCR

| # | Görev | Detay | Durum |
|---|-------|-------|-------|
| 74 | **Receipt/Fiş OCR** — kullanıcı market veya pazar fişi yükler | Google Vision API veya Claude API; ürün-fiyat + tarih + lokasyon damgası çıkar; ~₺0.05/fiş maliyet | [ ] |

### Partnership & Regülatör

| # | Görev | Detay | Durum |
|---|-------|-------|-------|
| 75 | **İBB / Ankara BB / İzmir BB partnership yazısı** — belediyeye açık veri + dashboard teklifi | Karşılık: zabıtadan veri girişi + "Resmi Veri Partneri" rozeti + PR desteği | [ ] |
| 76 | **Ticaret Bakanlığı açık veri partnership başvurusu** — "kamu yararına şeffaflık platformu" olarak tanıt | Haksız Fiyat Değerlendirme Kurulu bu veriyi resmi kullanabilir; yazılı başvuru yap | [ ] |

---

## 📊 Skor Durumu & Hedefler

| Kategori | Rapor (08.05) | Oturum 4 Tahmin | Hedef |
|---|---|---|---|
| AI Alıntılanabilirlik & Görünürlük | 28/100 | ~42 | 65/100 |
| Marka Otoritesi Sinyalleri | 12/100 | ~15 | 45/100 |
| İçerik Kalitesi & E-E-A-T | 25/100 | ~45 | 60/100 |
| Teknik Altyapı | 38/100 | ~50 | 65/100 |
| Yapılandırılmış Veri | 2/100 | ~55 | 75/100 |
| Platform Optimizasyonu | 15/100 | ~30 | 50/100 |
| **GENEL** | **22/100** | **~52** | **65/100** |

### Hızlı Kazanım Sıralaması — Güncel (Efor / Etki)

| Sıra | Görev | Efor | Etki |
|---|---|---|---|
| 1 | #49 — Marquee outlier cap | 1 saat | Güven +++ |
| 2 | #51 — StatsBar SSR (0 sorunu) | 30 dk | SEO + ilk izlenim |
| 3 | #50 — min/max null gizle | 30 dk | Veri kalitesi |
| 4 | #53 — /analiz bölümü aç | 2 saat | Google Discover kapısı |
| 5 | #26/#29 — Twitter + Telegram hesabı | 1 saat | Marka otorite +5 puan |
| 6 | #52 — Marquee duplication düzelt | 30 dk | Perf |
| 7 | #54 — Haftalık endeks yazısı (ilk 5 adet) | 3 saat | Google News zemin |
| 8 | #34 — Türkiye fiyat haritası (SVG) | 4 saat | Görsel etki, paylaşım |
| 9 | #56 — API rate limiting | 2 saat | Monetization altyapısı |
| 10 | #41 — Embed widget | 2 saat | Backlink + marka |

---

## Notlar & Kararlar

- **Yapılan (08.05 sonrası):** JSON-LD anasayfa/fiyatlar/hal/urun/endeks/metodoloji ✅ | Sitemap dinamik ✅ | GA4 ✅ | Hava widget ✅
- **Yapılan (12.05 oturum 2):** PriceSpecification (#5) ✅ | DataCatalog (#8) ✅ | CCBot Allow (#25) ✅ | İletişim bilgileri (#13/#14) ✅ | FAQPage (#6/#23) ✅ | llms-full.txt dinamik (#19) ✅
- **Yapılan (12.05 oturum 3):** Sitemap image 489 adet (#11) ✅ | Meta description (#17) ✅ | Hakkımızda ~1100 kelime (#22) ✅ | Canonical audit (#24) ✅ | IndexNow (#12) ✅ | og:image + Twitter Card (#15/#16) ✅
- **Yapılan (12.05 oturum 4):** YoY badge /urun/[slug] (#31) ✅ | Sezonluk rehber (#33) ✅ | Üretim bölgesi notu (#36) ✅ | API docs DataFeed schema (#40) ✅
- **Peer review (12.05 oturum 5):** 4 teknik hata eklendi (#49-52) | /analiz stratejisi eklendi (#53-55) | API monetization planı eklendi (#56-58) | Skor tahmini ~48 → ~52 revize edildi
- **Yapılan (12.05 oturum 5):** StatsBar SSR 0 sorunu (#51) ✅ | Marquee outlier cap 80% (#49) ✅ | PriceCard min/max null gizlendi (#50) ✅ | #52 incelendi — intentional CSS pattern
- **Yapılan (13.05 oturum 6):** Competitor-monitor backend (#61) ✅ — DB tabloları, checker, cron, API endpoint'leri. PM2 bash launcher fix (bun workspace resolution). devam-not-13mayis.md stratejik analiz → çekliste eklendi (#59-60, #62-76).
- **Yapılan (13.05 oturum 7):**
  - **Migros perakende karsilastirma** (#68 kismi) ✅ — `hf_retail_prices` tablo, `runMigrosEtl` (scraper-service DynamicFetcher + JSON-LD), RetailComparison karti /urun/[slug]'de, 46 urun canlida, cron 09:00 UTC (bc04b21, df5a275, 23721d9).
  - **Migros unmatched alias temizlik** — 53 → 1 unmatched (regex'i guclendir, hf_products alias'lar, Kg-only filter).
  - **/karsilastirma 0,00 bug fix** — useEffect race + .env.production.local fix (25225cf).
  - **PriceTable 502 fix** (#59) ✅ — nginx proxy_read_timeout 180s (ce750fe).
  - **Geçen yil karsilastirmasi anasayfada** (#31 genisletildi) — SeasonalGuide kartlarinda "Gecen yil: +%X" rozeti, widget endpoint'inde `yoyChangePct` field (42b9846).
  - **Haftalik e-bulten** (#32, #43) ✅ kod hazir — HTML mail + cron + preview/test endpoint'leri (7f02ef7, 3512cc3). SMTP+abone bekleme.
  - **Sezonluk rehber canli fiyat** (#33 genisletildi) — anasayfa kartlarinda guncel fiyat + 7g degisim (76a6f49).
  - **Sosyal medya** (#26, #27, #28, #30) ✅ — Twitter/X + Instagram hesaplari acildi, footer'da ikonlar (DB `site_settings` `social_twitter`+`social_instagram` keys), sameAs schema otomatik dolduruluyor.
  - **/analiz layout fix** — `max-w-4xl + px-4` → `max-w-[1400px] + px-8` + 3 sutun grid (33883d3).
  - **Bolu ETL fix** — kategori sayfasi + `haftalik-fiyat-listesi` pattern, 50 urun (519f6f4).
  - **Kocaeli site DOWN** — gecici disable, CLAUDE.md notu (b941d4f).
  - **Wayback monitor + Telegram** — 6 saatte bir probe, online'a gectiginde tek Telegram bildirimi (3d58cbb). Backfill scripti `wayback-migros-backfill.ts` hazir.
  - **Pilot deploy** — 1. release SUPERSEDED + rollback, 2. release `/var/www/releases/hal-fiyatlari-20260513-222637` AKTIF.
- **Google News yolu:** /analiz path'inde 5+ yayın → Publisher Center başvurusu. Site şu hâliyle haber sitesi değil; editoryal içerik olmadan News'e giremez.
- **Marquee outlier kararı:** `changePct > 80` VE `dataPointCount < 3` ise marquee'den çıkar. Sadece cap koymak yeterli değil — gerçek veri varsa +%100 doğru olabilir (kavun sezon açılışı).
- **Monetization stratejisi:** Ücretsiz API devam eder, Pro tier = API key + 30+ gün geçmiş + CSV export. Rakip Agrimetre API'yi ücretli tutuyor — ücretsiz API güçlü farklılaşma olmaya devam eder.
- **Tedarik zinciri öncelik sırası:** Önce #59 (502 fix) + #60 (% bug) → sonra #64-65 (BIM/A101 PDF, kolay) → sonra #66-67 (online market) → en son #71-74 (pazar/crowd). Scope creep riskine dikkat: hal tarafı sağlam olmadan yeni katman ekleme.
- **Market scraping yasal çerçeve:** robots.txt'e uy, 1 req/sn max, gece tara. User-Agent: `HalDeFiyatBot/1.0 (+https://haldefiyat.com/bot)`. Sadece public listing fiyatları — kullanıcı verisi, kampanya kodu yok. Türkiye'de fiyat verisi public bilgi, telif altında değil.
