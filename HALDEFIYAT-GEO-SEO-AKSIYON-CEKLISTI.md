# HalDeFiyat — GEO + SEO Tamamlanan Aksiyonlar

> Kaynak: `HalDeFiyat-GEO-SEO-Raporu-2026-07-26.pdf` (GeoSerra, 74/100) +
> `docs/GEO-SEO-RAPORU-2026-07-26-EKSIKLER.md` (iç değerlendirme)
> Hazırlayan: Claude (Mimar) · Tarih: 2026-07-26
> Implementasyon: **Codex** (`docs/codex-briefs/geo-seo-implementation.md`) · Doğrulama: **Claude**

## Güncel durum (2026-07-26)

- **Tamamlanan:** 44/66 checkbox — kapanış kanıtları bu dosyada korunur.
- **Açık:** 22/66 checkbox — birleşik Lighthouse/dependency maddesi kabul ve
  kalan iş olarak ayrıldığı için toplam takip maddesi 66 oldu. Açıklar:
  `HALDEFIYAT-GEO-SEO-ACIK-ISLER.md`.
- Bu dosyaya yeni açık iş eklenmez. Açık dosyada tamamlanan maddeler, kanıtıyla
  birlikte buraya taşınır ve iki dosyanın sayaçları birlikte güncellenir.

## 0. Gerçeklik kontrolü — rapordaki YANLIŞ bulgular (İŞ AÇMA)

Rapor 74/100 verdi ama bazı bulguları canlı site/kodla çelişiyor. Aşağıdakiler
**zaten mevcut** — Codex bunları "ekleme" işi olarak ALMAYACAK, yalnız **kalite doğrulaması** yapılacak:

| Rapor "eksik" dedi | Gerçek (2026-07-26 doğrulandı) | Aksiyon |
|---|---|---|
| NewsArticle/Article schema | VAR: `analiz/[slug]`, `rapor/yillik/[year]`, `metodoloji` | Kalite doğrula (§4.1) |
| BreadcrumbList | VAR: `components/seo/Breadcrumb.tsx` + kullanımlar | Kapsam doğrula (§4.2) |
| CSP başlığı yok | VAR: endpoint'e bağlı enforce `Content-Security-Policy` (26.07.2026) | İzle ve sıkılaştır (§5.1) |
| Dataset schema ekle | VAR: `components/seo/JsonLd.tsx` | Zenginleştir (§4.3) |
| CSS minify edilmemiş | Şüpheli: Next.js prod zaten minify eder | Önce ölç; anlamsızsa DÜŞ (§6) |

İlk denetimde gerçekten eksik/kritik bulunan H1, mobil performans ve citability
uygulamaları aşağıda kapanış kanıtlarıyla yer alır. Açık kalan SPF/DNS kabulü
ayrı açık işler dosyasına taşınmıştır.

---

## Sahiplik lejantı
- 🤖 **Codex** — kod/config implementasyonu (brief'te detay)
- 🧑 **Orhan** — DNS, GSC, satın alma, iş geliştirme, içerik onayı
- 🔎 **Claude** — teşhis, ölçüm doğrulama, kabul kriteri kontrolü, brief

---

## P0 — Kesin site düzeltmeleri (bu hafta)

### 0.2 SPF ve gönderen envanteri — DNS doğrulandı

- [x] Canlı backend ve kod yollarında gönderen envanteri çıkarıldı: tek sağlayıcı Resend SMTP, görünür gönderen `noreply@haldefiyat.com`; ikinci SMTP/API sağlayıcısı bulunmadı. (`docs/geo-seo/DNS-MAIL-AUTH-DENETIMI-2026-07-26.md`)
- [x] Resend’in gerçek Return-Path alanı `send.haldefiyat.com` üzerinde tek SPF (`include:amazonses.com ~all`) ve bölge MX kaydı doğrulandı; köke ikinci SPF eklenmemesi kayda alındı. (`docs/geo-seo/DNS-MAIL-AUTH-DENETIMI-2026-07-26.md`)

### 0.1 Ana sayfa H1 — 🤖 Codex → 🔎 Claude doğrular
- [x] Hero'daki H2 ("Türkiye Hal Fiyatları Tek Ekranda") → tek görünür `<h1>`; tasarım/CSS sınıfları AYNEN korunur. (`c8600951`)
- [x] Önerilen metin uygulandı: `Türkiye Hal Fiyatları — Günlük Sebze ve Meyve Fiyatları`. (`c8600951`)
- [x] Canlı SSR HTML'de ana sayfada tam **1** görünür `<h1>` doğrulandı. (2026-07-26 deploy smoke)
- **Kabul:** `curl -s https://haldefiyat.com/ | grep -c '<h1'` = 1; Lighthouse SEO/a11y regresyonu yok.

### 0.3 Mobil LCP/FCP teşhis + optimizasyon — 🔎 Claude teşhis → 🤖 Codex → 🔎 Claude ölçer
- [x] Gerçek LCP elementinin hero metni olduğu belirlendi; varsayımsal görsel preload eklenmedi. (S-02, `b507c516`)
- [x] LCP/field p75 ve Google tag zinciri maliyeti ayrıştırıldı; 326 KiB tag zinciri ana kod fırsatı olarak kaydedildi. (S-02)
- [x] Above-the-fold ve hydration yüzeyleri denetlendi; ana sayfa FAQ hydration'sız native HTML'e geçirildi. (`085c7681`)
- [x] Mobilde masaüstü ağacının gönderilmemesi UA-bazlı sunucu ayrımıyla korundu; SEO-kritik hero SSR kaldı. Viewport dynamic import yerine mevcut daha erken sunucu ayrımı kullanıldı. (3.30)
- [x] Outfit ağırlıklarının aynı iki variable WOFF2 kullandığı ve Next preload'un etkin olduğu doğrulandı; gereksiz ek preload yapılmadı. (3.30)
- **Kabul:** Mobil Lighthouse medyan (3+ koşu) perf ≥85; lab LCP <2.5s, FCP <1.8s; SSR/indexlenebilirlik regresyonu yok.

### 0.4 Ürün/hal/analiz — tarihli "cevap bloğu" (citability) — 🤖 Codex → 🔎 Claude
- [x] ÖNCE hedef sorgu ↔ sayfa haritası (§ brief). Mekanik her sayfaya blok EKLEME.
- [x] Ürün: tarih + birim + min–max/ortalama + örneklem/kaynak + veri tazeliği. (`0614ceb5`)
- [x] Hal: şehir/hal kapsamı + son güncelleme + öne çıkan değişim özeti. (`6e05be62`)
- [x] Analiz: başta bulgu özeti; sonra yöntem/sınırlar. (`139b8c88`, `aff495ac`)
- [x] Stabil anchor/ID ve kesin tarihli görünür bloklar tamamlandı; trend, kapsam ve breadcrumb tutarlılığı otomatik testlerle kapsandı. (`0614ceb5`, `6e05be62`, `33200273`, `139b8c88`)
- [x] Canlı SSR üzerinde Domates ürün, Antalya Serik Hali ve kuru soğan analiz şablonlarında görünür cevap/tablo bağlamı ile Dataset/NewsArticle URL, tarih, kapsam, başlık ve özet eşleşmesi doğrulandı. (`docs/geo-seo/CITABILITY-SCHEMA-CANLI-KABUL-2026-07-26.md`)
- **Kabul:** citability blokları hedef sorgu sayfalarında; anchor'lar stabil; değişiklik öncesi/sonrası aynı AI sorgu setiyle kıyas (Orhan/Claude ölçer).

---

## P1 — Schema kalite (zaten var → zenginleştir) — 🤖 Codex → 🔎 Claude

### 4.1 Article / NewsArticle kalite doğrulama
- [x] Var olan schema'yı geri çekmeden `headline`, 3 en-boy oranında görsel, gerçek tarihler, `author.url`, `publisher` ve görünür byline/tarih tamamlandı. (`c21c4a1e`, `6a8e723c`, `0a637e11`, `0dc9dce9`)
- [x] Google News uygunluğu schema varlığına indirgenmedi; sitemap yalnız geçerli, gelecekte olmayan yayın tarihlerini kabul ediyor. (`5822f519`)

### 4.2 BreadcrumbList kapsam
- [x] İndekslenebilir şablonlar tek tek tarandı; eksik olanlara breadcrumb eklendi. (`ee8de6bd`, `d241af55`, `5a204511`)
- [x] Schema ile görünür breadcrumb eşleşmesi otomatik testle kapsandı. (`8a44624e`)

### 4.3 Dataset zenginleştirme
- [x] Dataset tarih, coğrafya, dağıtım, lisans, erişim, üretici ve yöntem alanları gerçek veri sınırlarıyla zenginleştirildi. (`35ab742f`, `865ee9ff`, `857d6e00`, `50d35c3f`)
- [x] Hal fiyatının `Product/Offer` semantiği uygun bulunmadı; referans fiyat gözlemleri yalnız Dataset bırakıldı. (`4556608c`)

---

## P1 — İçerik & yayın şeffaflığı (E-E-A-T) — 🤖 Codex iskele + 🧑 Orhan içerik

### 4.4 Editoryal şeffaflık
- [x] Editoryal politika + düzeltme politikası + veri-kaynağı politikası + sahiplik/finansman route/CMS/footer/sitemap iskeleti tamamlandı. (`820c58d2`)
- [x] Analizlerde görünür byline; atanmış yazarlarda profil linki, unvan, uzmanlık ve profil schema'sı tamamlandı. (`c21c4a1e`, `0d70eb33`)
- [x] Otomatik haftalık raporlarda kaynak ve insan kontrolü görünür/kanıtlı: `source=auto` etiketi ile admin publish/schedule işleminde yazılan `reviewed_by/reviewed_at` kaydı birlikte kullanılıyor. (`8610e751`, `c4897cba`)

---

## P1 — Güvenlik: CSP enforce geçişi — 🤖 Codex config + 🧑 Orhan gözlem

### 5.1 Report-Only → Enforce
- [x] Report-Only ihlalleri boyut sınırlı ve URL sorguları redakte edilen merkezi endpoint'te toplanıyor. (`88bde326`, `8cb88095`, `99bcee1a`)
- [x] Mevcut inline script, GTM/GA/Ads, OneSignal, JSON-LD ve CMS banner bağımlılıkları ile nonce/hash azaltma sırası çıkarıldı. (S-10)
- [x] Ayrı staging bulunmadığı için canlıda kontrollü `/`, login, fiyat alarmı, embed ve hava widget headless Chrome regresyon taraması yapıldı; GTM/GA4/Ads, OneSignal ve Tarımİklim izinleriyle CSP engeli görülmedi. (3.54)
- [x] Orhan'ın açık canlı yetkisiyle `Content-Security-Policy` enforce edildi; `Reporting-Endpoints` ve geriye uyumlu `report-uri` canlı rapor endpoint'ine bağlandı. (3.54)
- **Kabul:** enforce CSP aktif; 1–2 hafta ihlal raporu temiz; 3P akışlar (GTM/GA/Ads/harita/YouTube) çalışıyor.

---

## P2 — Teknik SEO denetimi (raporun atladığı) — 🔎 Claude/🧑 ölçer, 🤖 Codex düzeltir

- [x] Sitemap üretimi kanonik/indexlenebilir kayıtlar ve gerçek, geçerli, gelecekte olmayan `lastmod` tarihleriyle düzeltildi. (`a9620c9a`, `f46eeb93`, `fe7dbfa4`, `32feeed0`, `0d70eb33`)
- [x] Analiz iç-link havuzu genişletildi; indekslenebilir ürün/hal/yazar keşif listeleri sitemap ve LLMS yüzeylerine bağlandı. (`35f290ed`, `0d70eb33`)
- [x] Varsayılan locale canonical/hreflang politikası ve boş ürün/hal/yıllık rapor index koşulları kodda düzeltildi. (`ab012981`, `32feeed0`, `6ca33051`, `edc43c6d`)
- [x] RFC uyumlu, yapılandırılmış `security.txt` ve açıklayıcı ürün görsel alt metinleri tamamlandı. (`7cf22f9a`, `3dddeb04`)
- [x] Ana sayfa cache/transport maliyeti ölçüldü: sıcak TTFB 178–236 ms, Brotli ve hash'li assetlerde bir yıllık immutable cache aktif; UA/locale bağımlı SSR nedeniyle public HTML cache güvenli bulunmadı, HTTP/3 ayrı fırsat olarak kaydedildi. (`docs/geo-seo/CACHE-TRANSPORT-DENETIMI-2026-07-26.md`)
- [x] 07–26 Temmuz Nginx loglarında Googlebot, Bingbot, GPTBot, ChatGPT-User, ClaudeBot, CCBot ve PerplexityBot status dağılımı çıkarıldı; kendi audit crawler'ı hariç tutuldu, 4xx/5xx yolları ve spoofed user-agent sınırı kaydedildi. (`docs/geo-seo/BOT-CRAWL-LOG-ANALIZI-2026-07-07-26.md`)
- [x] Canlı Lighthouse Accessibility 100, Best Practices 100 ve SEO 100 kabulü geçti; OneSignal ana sayfa kritik yolundan push akışına ertelendi, first-party source map yayımlandı ve SRI uygunluğu değerlendirildi. (`7a343b4a`, `docs/geo-seo/LIGHTHOUSE-BEST-PRACTICES-100-2026-07-26.md`)

### 6.1 Anahtar kelime yoğunluğu ve sayfa içi tutarlılık

- [x] Ekran görüntüsündeki denetim URL'si `https://haldefiyat.com/hal/antalya-hal-serik`, hedef sorgu `Antalya Serik Hali fiyatları` ve oturum tarihi 2026-07-26 olarak kaydedildi; araçta ayrı crawl timestamp'i görünmediği açıkça belirtildi. (`docs/geo-seo/ANAHTAR-KELIME-CANLI-DENETIMI-2026-07-26.md`)
- [x] Hedef ifade title, meta description, tek H1, en az bir açıklayıcı H2 ve
  görünür giriş/cevap bloğında doğal biçimde mevcut mu kontrol edilsin.
- [x] Kelime sayımını şişiren tekrarlar ayrı ölçülsün: tablo satırları, select
  option'ları, menü/footer, kaynak rozetleri, gizli/mobil kopyalar ve fiyat
  para birimi karakterleri ana editoryal içerik sayılmasın.
- [x] İl/ilçe/hal detay tablolarında her satırda değişmeyen şehir ve hal adı
  sütunları tek bağlam başlığına indirgensin; ürün/fiyat verisi korunmalı.
- [x] Hedef sorgunun eş anlamlı ve yakın niyetleri kapsansın: “hal fiyatları”,
  “toptan fiyat”, “güncel fiyat listesi”, kesin veri tarihi ve kaynak.
- [x] Keyword stuffing kontrolü yapılsın: yapay tekrar, anlamsız alt etiketi,
  gizli metin veya yalnız araç puanı için başlık çoğaltması eklenmesin.
- [x] Ürün, Serik/Antalya hal şablonu ve genel fiyat şablonu karşılaştırılarak
  şablon kaynaklı tekrar ile URL'ye özgü içerik ayrıldı; ayrıntılar 3.31/S-12'de.
- **Kabul:** hedef terim title/meta/H1 ve doğal açıklayıcı içerikte tutarlı;
  tablo/boilerplate tekrarı editoryal metni baskılamıyor; yoğunluk için yapay
  tekrar yok; sayfa tasarımı ve fiyat verisi değişmemiş.

---

## P2 — Ölçüm / KPI baseline — 🔎 Claude + 🧑 Orhan (Codex: yalnız RUM kurulumu)

- [x] **INP/CWV RUM:** örneklemeli web-vitals telemetry GA4 veri katmanına bağlandı ve test edildi. (`ccaf86ae`, `ad6f5be4`)

---

## İlgili
- Açık işler: `HALDEFIYAT-GEO-SEO-ACIK-ISLER.md`
- Codex brief: `docs/codex-briefs/geo-seo-implementation.md`
- Değerlendirme: `docs/GEO-SEO-RAPORU-2026-07-26-EKSIKLER.md`
- Rapor: `HalDeFiyat-GEO-SEO-Raporu-2026-07-26.pdf`
