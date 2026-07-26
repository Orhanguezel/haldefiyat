# Codex Brief — HalDeFiyat GEO/SEO Implementasyonu

> Master checklist: `HALDEFIYAT-GEO-SEO-AKSIYON-CEKLISTI.md` (kök)
> Implementasyon oturumu ve çapraz kontrol kaydı:
> `docs/geo-seo/IMPLEMENTASYON-OTURUMU-2026-07-26.md`
> Bu brief SADECE Codex'in kod/config ile yapacağı işleri kapsar. DNS (SPF/DMARC),
> GSC, AI benchmark, backlink baseline, iş geliştirme → Codex'e VERİLMEZ.
> Kontrol/doğrulama: Claude. Her görev bittiğinde Claude kabul kriterini çalıştırır.

## Genel kurallar (HER görevde geçerli)
- **Zaten var olanı yeniden yazma.** NewsArticle, BreadcrumbList, Dataset, CSP-Report-Only MEVCUT. Rapor "eksik" dese de ekleme; yalnız istenen alanları doğrula/tamamla.
- **SSR & indexlenebilirlik regresyonu YASAK.** SEO-kritik içerik server-render kalır; `dynamic import` yalnız above-the-fold-dışı / masaüstü-only ağaçlar için.
- **Tasarım korunur.** H1 dönüşümü dahil, CSS sınıfları birebir taşınır; görünüm değişmez.
- **Hardcode YOK** (dil, URL, tarih). Tarih/fiyat DB'den; metin i18n/config'den.
- **Her PR küçük ve tek konulu.** Görev başına ayrı commit; dosya 200 satırı geçerse böl.
- **Doğrulama komutu** her görevin sonunda çalışır (aşağıda). Geçmeden "bitti" deme.
- Frontend değişiklik → `bun run build` + `pm2 restart hal-frontend` (reload DEĞİL). Detay: proje CLAUDE.md.

---

## GÖREV 1 — Ana sayfa H1 (P0, en hızlı)
**Durum:** Ana sayfada `<h1>` YOK; hero başlığı H2. (Claude doğruladı 2026-07-26.)
**Dosya:** `frontend/src/app/[locale]/(public)/page.tsx` + hero bileşeni (`components/sections/Hero*`).
**Yapılacak:**
- Hero'nun en üst görünür başlığını `<h2>` → `<h1>` yap. **className'i birebir koru.**
- Metin (Orhan onaylayana kadar öneri): `Türkiye Hal Fiyatları — Günlük Sebze ve Meyve Fiyatları`. i18n key ile.
- Sayfada başka görünür/gizli `<h1>` OLMASIN (mobil + masaüstü SSR).
**DOKUNMA:** Diğer başlık seviyeleri, hero tasarımı, alt bölümler.
**Kabul (Claude çalıştırır):** `curl -s https://haldefiyat.com/ | grep -o '<h1' | wc -l` = 1; Lighthouse SEO/a11y skoru düşmez.

---

## GÖREV 2 — Tarihli citability cevap blokları (P0)
**Durum:** `urun/[slug]` kısmen var ("kilosu ne kadar"). Hal + analiz + hedef sorgular eksik.
**Ön koşul:** Claude hedef-sorgu ↔ sayfa haritasını verir (bu brief'e eklenecek). Harita gelmeden mekanik blok EKLEME.
**Dosyalar:** `urun/[slug]/page.tsx`, `hal/[slug]/page.tsx`, `analiz/[slug]/page.tsx`, ortak bir `AnswerBlock` bileşeni (`components/seo/`).
**Yapılacak:**
- **Ürün:** "Bugün {ürün}'ün Türkiye ortalama hal fiyatı nedir?" → görünür yanıt: **tarih + birim + min–max/ortalama + örneklem sayısı + kaynak + veri tazeliği**. Değerler DB'den (mevcut fiyat sorguları), hardcode yok.
- **Hal:** şehir/hal kapsamı + son güncelleme tarihi + öne çıkan fiyat değişimi özeti.
- **Analiz:** yazının başına 2–4 cümlelik bulgu özeti (TL;DR); devamı yöntem/sınır.
- Her bloğa **stabil `id` anchor** (ör. `#ortalama-fiyat`). "bugün/güncel" → görünür kesin tarih.
- Blok içi rakamların sayfadaki tablo ve JSON-LD (Dataset/Article) ile **tutarlılığını** koruyan tek kaynak kullan (aynı değer iki yerde ayrı hesaplanmasın).
**DOKUNMA:** Mevcut fiyat tablosu/grafik; SSR'da kalması gereken içerik.
**Kabul:** Hedef sayfalarda blok SSR HTML'de görünür; anchor'lar çalışır; blok değeri = sayfa tablosu değeri; Claude AI-sorgu kıyasını (öncesi/sonrası) çalıştırır.

---

## GÖREV 3 — Mobil LCP/FCP optimizasyonu (P0)
**Durum:** Mobil Lighthouse 64, LCP 6682ms, FCP 3316ms (masaüstü 98). Kök: [[anasayfa-mobil-lcp]] — masaüstü ağacı `hidden md:block` mobilde de hydrate ediliyor (~505KB RSC).
**Ön koşul:** Claude gerçek LCP elementini + waterfall teşhisini verir. **Varsayımla preload EKLEME.**
**Dosyalar:** `page.tsx` + above-the-fold bileşenleri (ticker, ilan vitrini, rapor kartları), font setup.
**Yapılacak (teşhise göre):**
- Masaüstü-only / fold-altı ağaçları `next/dynamic` (ssr kontrollü) + viewport-gate ile mobilde yükleme; **SEO-kritik içerik SSR'da kalır.**
- Font preload'ları yalnız kullanılan weight; kullanılmayan JS/CSS kaldır.
- LCP görselse: doğru `sizes`, AVIF/WebP, `priority`/preload, responsive source. LCP metinse: font + render-blocking zincir.
**DOKUNMA:** SEO içeriğinin server-render'ı; ana sayfa veri doğruluğu.
**Kabul:** Mobil Lighthouse medyan (3+ koşu) perf ≥85; lab LCP <2.5s, FCP <1.8s; SSR/index regresyonu yok. Claude PSI ile ölçer ([[pagespeed-api-key-location]]).

---

## GÖREV 4 — Schema kalite (zaten VAR — zenginleştir)
**Dosyalar:** `components/seo/JsonLd.tsx`, `Breadcrumb.tsx`, `analiz/[slug]`, `rapor/yillik/[year]`, `metodoloji`.
**4a Article/NewsArticle:** `headline`, 3 en-boy görsel, `datePublished`, **gerçek `dateModified`** (datePublished'a yapay eşitleme YOK — içerik gerçekten değişince güncellensin), `author.url`, `publisher`, görünür byline+tarih. Var olanı silme, eksik alanı tamamla.
**4b BreadcrumbList:** Site-geneli değil — indekslenebilir şablonlarda gerçekten eksik olanı ekle; schema ↔ görünür breadcrumb eşleşsin.
**4c Dataset:** `dateModified`, `temporalCoverage`, `spatialCoverage`, `distribution`/`DataDownload` (API/CSV), `license`, `isAccessibleForFree`, `creator`, `measurementTechnique`. **Fiyatı `Product/Offer` YAPMA** (hal fiyatı perakende teklif değil — semantik yanlış).
**Kabul:** Google Rich Results Test + schema.org validator temiz; Claude URL bazında arşivler.

---

## GÖREV 5 — E-E-A-T şeffaflık sayfaları (iskele)
**Dosyalar:** yeni CMS/statik sayfalar (`customPages` modülü veya route), analiz sayfası byline.
**Yapılacak (iskele; içerik metnini Orhan verir):**
- Editoryal politika / düzeltme politikası / veri-kaynağı politikası / sahiplik-finansman sayfaları (route + iskele içerik + footer link).
- Analizlerde görünür byline + yazar profil linki.
- Otomatik haftalık raporlara görünür "otomatik üretildi + insan kontrolü" etiketi ([[haftalik-analiz-raporu]]).
- İletişim sayfasında kurumsal e-posta + sorumlu kurum.
**Kabul:** Sayfalar 200 + footer'dan erişilir + sitemap'te; byline analiz sayfalarında görünür.

---

## GÖREV 6 — CSP Report-Only → Enforce hazırlığı
**Durum:** `Content-Security-Policy-Report-Only` VAR (tam policy, `unsafe-inline`+`unsafe-eval` script-src'de). Enforce DEĞİL.
**Dosya:** CSP başlığının set edildiği yer (Next middleware VEYA nginx — Codex bulur; nginx ise repo-dışı, VPS config, Claude'a bildir).
**Yapılacak:**
- İhlal toplama endpoint'i (`report-to`/`report-uri`) ekle; Report-Only'de gözlem başlat.
- `unsafe-inline`/`unsafe-eval` kaldırma fizibilitesi (nonce/hash) — GTM/GA/Ads uyumu.
- **Enforce'a Codex TEK BAŞINA GEÇMEZ.** Staging test + gözlem sonrası Orhan/Claude onayıyla enforce.
**Kabul:** report endpoint çalışıyor; ihlal logları toplanıyor; enforce ayrı ve onaylı adımda.

---

## GÖREV 7 — web-vitals RUM (KPI ölçüm altyapısı)
**Durum:** INP/CWV gerçek-kullanıcı verisi yok; Lighthouse INP ölçemez.
**Dosya:** yeni client bileşeni (`components/analytics/WebVitals.tsx`) + layout entegrasyonu.
**Yapılacak:** `web-vitals` (INP, LCP, CLS, FCP, TTFB) → GA4 event VEYA kendi `/api/v1/rrum` endpoint'i (audit altyapısı var). Örnekleme + is_bot dışlama.
**DOKUNMA:** mevcut GA4/GTM kurulumu (yalnız ek event).
**Kabul:** Canlıda gerçek kullanıcıdan INP/LCP event'i düşüyor; admin panelde 28-gün p75 görülebilir (opsiyonel).

---

## GÖREV 8 — Sitemap doğruluğu (P2)
**Dosya:** frontend sitemap route(ları).
**Yapılacak:** Sitemap yalnız **200 + kanonik + indexable** URL içersin; noindex/redirect/404 URL çıkar; `<lastmod>` gerçek içerik değişikliğinden gelsin (uydurma "bugün" değil). News sitemap yaş/tarih kuralı + yalnız uygun analiz URL'leri.
**Kabul:** Claude sitemap'i çeker; 200/canonical/indexable oranı %100; lastmod tutarlı.

---

## Sıra (Codex)
1. GÖREV 1 (H1) — bağımsız, hemen.
2. GÖREV 4 (schema kalite) + GÖREV 8 (sitemap) — bağımsız.
3. GÖREV 7 (web-vitals) — bağımsız, ölçüm için erken kur.
4. GÖREV 2 (citability) — Claude'un sorgu haritasını bekler.
5. GÖREV 3 (LCP) — Claude'un teşhisini bekler.
6. GÖREV 5 (şeffaflık) — Orhan içeriğini bekler (iskele önce).
7. GÖREV 6 (CSP) — son; enforce ayrı onaylı adım.

## Claude'un sağlayacakları (bloklayıcı girdiler)
- GÖREV 2: hedef-sorgu ↔ sayfa haritası (GSC query verisi [[gsc-query-data-fetch]] + [[analiz-seo-takip-metrikleri]]).
- GÖREV 3: gerçek LCP elementi + waterfall + RSC/hydration ölçümü.
- Her görev: kabul kriteri doğrulaması + AI-sorgu öncesi/sonrası kıyası.

---

# EK: Claude girdileri hazır (2026-07-26) — Codex GÖREV 2 ve 3'e başlayabilir

## GÖREV 2 girdisi — Sorgu haritası (GSC gerçek verisi, son 90 gün, tıklamaya göre)

**Kaynak:** GSC searchAnalytics/query, `sc-domain:haldefiyat.com`, 2026-04-27→07-25.
Aşağıdaki kümeler gerçek arama verisinden; blok metni bu niyeti karşılamalı.

### Küme A — Ürün fiyatı (`/urun/[slug]`) → EN YÜKSEK ÖNCELİK
Sorgu kalıbı: `{ürün} fiyatları`, `{ürün} fiyatları 2026`, `{ürün} piyasası`, `{ürün} kaç para`.
Gerçek veriden öncelik ürünleri (tıklama): **limon** (225 + "limon piyasası" 107, 8841 impr, CTR %1.2 ⚠️), **patates** (112), **soğan** (91), **kayısı** (71, pos 2.4), **karpuz** (60), **kiraz** (44), **şeftali** (31), **erik** (23), **taze fasulye** (25).
- **Answer block (ürün):** "Bugün {ürün} Türkiye ortalama hal fiyatı ne kadar?" → **kesin tarih + birim + min–max + ortalama + örneklem (kaç hal) + kaynak + veri tazeliği**.
- **"piyasa" niyeti** (limon piyasası 8841 impr, CTR %1.2 = en büyük fırsat): bloğa "piyasa/genel eğilim" cümlesi ekle (son 7/30 gün yön + değişim %). "piyasası" kelimesi görünür geçsin.
- **"2026" varyantı:** blokta yıl + kesin tarih makine-okunur olsun (kayısı/karpuz/kiraz/şeftali/erik hepsi "2026" ile aranıyor).
- Şablon TÜM ürünlere; ama yukarıdaki 9 üründe metin+değeri **elle doğrula** (Claude AI-sorgu kıyası bunlarla yapılır).

### Küme B — Şehir hal fiyatı (`/hal/[slug]`)
Sorgu kalıbı: `{şehir} hal fiyatları`, `{şehir} hal fiyatları bugün`.
Öncelik (impression/tıklama): **istanbul** (4340 impr, CTR %1.4 ⚠️ en büyük fırsat), **konya** (1924 impr, pos 2.7, CTR %1.2 ⚠️), kahramanmaraş/maraş (86+40+34), ankara (48+23 "bugün"), bursa, balıkesir, gaziantep, eskişehir, çanakkale, çorum.
- **Answer block (hal):** "{şehir} halinde bugün ({tarih}) fiyatlar" → kapsanan ürün sayısı + son güncelleme tarihi + öne çıkan 2–3 fiyat değişimi. "bugün" → görünür kesin tarih.
- **Düşük-CTR + yüksek-impression** (istanbul %1.4, konya %1.2): sorun snippet kalitesi; blok başı özet meta description/başlıkla hizalı olsun.

### Küme C — Komisyoncu/firma (`/firma`, `/firmalar/{şehir}`) → BLOK EKLEME, snippet KORU
Sorgu: `{şehir} hal komisyoncuları`. malatya CTR %34.7, konya %35.2, bursa %23.9 — **zaten güçlü** (B2B niyet, [[monetizasyon-sponsor-haric-yonu]]). Buraya mekanik cevap bloğu EKLEME; mevcut liste/snippet netliğini koru, olsa olsa "{şehir} halinde {n} komisyoncu" tek satır özet.

### Küme D — Genel (`/` ve `/fiyatlar`)
`hal fiyatları` (52 tıklama, **pos 11.7 = 2. sayfa**): ana sayfa/fiyatlar özet answer block + güçlü iç link. Öncelik düşük (tek sorgu), ama H1 + özet bloğu pozisyonu 1. sayfaya taşıyabilir.

**Sıra:** Küme A (ürün) → Küme B (hal) → Küme D (genel). Küme C'ye dokunma.

---

## GÖREV 3 girdisi — LCP teşhisi (PSI mobil + CrUX, 2026-07-26)

**KRİTİK — lab vs field ayrımı (rapor bunu karıştırmıştı):**
| Metrik | Lab (Lighthouse mobil) | Field (CrUX p75, gerçek kullanıcı) |
|---|---|---|
| LCP | 6.8 s (kötümser/throttled) | **3.08 s — AVERAGE** |
| FCP | 3.5 s | 2.42 s — AVERAGE |
| INP | — (lab ölçemez) | **170 ms — FAST ✅** |
| CLS | 0 | **0 — FAST ✅** |
| Perf | 60 | — |

**Gerçek hedef: field LCP 3.08 → ≤2.5 s (~0.6 s kırp).** INP/CLS zaten iyi — sadece KORU, bozma. Alarm 6.8s lab; gerçek kullanıcı 3.08s.

**LCP elementi:** **METİN** (hero başlık — CLS=0, image-LCP değil). → **Görsel preload EKLEME.** Fix = render-blocking + font zinciri.

**Kök neden — 518 KiB unused JS (ana fırsat ~900ms):**
| Kaynak | Boyut | Tür |
|---|---|---|
| Google tag'ları (GTM `gtm.js` 61KB + GA4 `G-YHLL9WK7ML` 75KB + Ads `AW-18007572524` 121+69KB) | **~326 KiB** | 3rd-party |
| First-party Next chunk (`0e5hl~zyne1tl.js` 71KB + `139~irplfi2a-.js` 50KB) | **~121 KiB** | 1st-party |
| main-thread work 1.7 s · bootup 1.0 s | — | JS exec |

**Fix önceliği (bu sıra):**
1. **Google tag yüklemesini daha da geciktir** — en büyük (326KB), **SEO'ya etkisiz**. Şu an `lazyOnload` ([[anasayfa-mobil-lcp]]); LCP sonrası / ilk kullanıcı etkileşimi / `requestIdleCallback`'e taşı. Consent-gated zaten; conversion event'leri kaybetme.
2. **First-party unused chunk azalt (121KB):** fold-altı & masaüstü-only bileşenleri `next/dynamic`. **UA-split zaten var** (`if(isMobile)`); mobil ağaçta gereksiz masaüstü chunk kalmadığını doğrula — kalıyorsa import'u mobil daldan çıkar.
3. **Font:** hero başlık fontunu preload + `font-display: swap` (metin-LCP hızlanır). Yalnız kullanılan weight.
4. main-thread 1.7s: 1+2 yeterli; ekstra long-task varsa profiler ile.

**Kabul (revize — field öncelikli):** field p75 LCP ≤2.5 s (28 gün, GÖREV 7 RUM ile izle); lab mobil perf ≥85 hedef ama field belirleyici; INP ≤200ms + CLS ≤0.1 KORUNUR; SSR/index regresyonu yok. **Preload görsel eklenmez (LCP metin).**

**Not:** GÖREV 7 (web-vitals RUM) zaten kuruldu → LCP/INP'yi gerçek kullanıcıdan izlemek için kullan; PSI tek koşu, RUM 28-gün p75 belirleyici.
