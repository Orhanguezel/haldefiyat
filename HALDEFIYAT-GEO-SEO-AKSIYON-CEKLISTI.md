# HalDeFiyat — GEO + SEO Aksiyon Checklist'i

> Kaynak: `HalDeFiyat-GEO-SEO-Raporu-2026-07-26.pdf` (GeoSerra, 74/100) +
> `docs/GEO-SEO-RAPORU-2026-07-26-EKSIKLER.md` (iç değerlendirme)
> Hazırlayan: Claude (Mimar) · Tarih: 2026-07-26
> Implementasyon: **Codex** (`docs/codex-briefs/geo-seo-implementation.md`) · Doğrulama: **Claude**

## 0. Gerçeklik kontrolü — rapordaki YANLIŞ bulgular (İŞ AÇMA)

Rapor 74/100 verdi ama bazı bulguları canlı site/kodla çelişiyor. Aşağıdakiler
**zaten mevcut** — Codex bunları "ekleme" işi olarak ALMAYACAK, yalnız **kalite doğrulaması** yapılacak:

| Rapor "eksik" dedi | Gerçek (2026-07-26 doğrulandı) | Aksiyon |
|---|---|---|
| NewsArticle/Article schema | VAR: `analiz/[slug]`, `rapor/yillik/[year]`, `metodoloji` | Kalite doğrula (§4.1) |
| BreadcrumbList | VAR: `components/seo/Breadcrumb.tsx` + kullanımlar | Kapsam doğrula (§4.2) |
| CSP başlığı yok | VAR: `Content-Security-Policy-Report-Only` (tam policy) | Enforce'a geçir (§5.1) |
| Dataset schema ekle | VAR: `components/seo/JsonLd.tsx` | Zenginleştir (§4.3) |
| CSS minify edilmemiş | Şüpheli: Next.js prod zaten minify eder | Önce ölç; anlamsızsa DÜŞ (§6) |

**Gerçekten eksik/kritik olanlar** (canlı doğrulandı): ana sayfa H1 yok, SPF TXT yok,
mobil LCP 6.7 sn, citability blokları dar. Bunlar aşağıda P0/P1.

---

## Sahiplik lejantı
- 🤖 **Codex** — kod/config implementasyonu (brief'te detay)
- 🧑 **Orhan** — DNS, GSC, satın alma, iş geliştirme, içerik onayı
- 🔎 **Claude** — teşhis, ölçüm doğrulama, kabul kriteri kontrolü, brief

---

## P0 — Kesin site düzeltmeleri (bu hafta)

### 0.1 Ana sayfa H1 — 🤖 Codex → 🔎 Claude doğrular
- [x] Hero'daki H2 ("Türkiye Hal Fiyatları Tek Ekranda") → tek görünür `<h1>`; tasarım/CSS sınıfları AYNEN korunur. (`c8600951`)
- [x] Önerilen metin uygulandı: `Türkiye Hal Fiyatları — Günlük Sebze ve Meyve Fiyatları`. (`c8600951`)
- [ ] SSR HTML'de tam **1** `<h1>`; mobil/masaüstünde duplicate/gizli H1 yok.
- **Kabul:** `curl -s https://haldefiyat.com/ | grep -c '<h1'` = 1; Lighthouse SEO/a11y regresyonu yok.

### 0.2 SPF kaydı + DMARC kademeli sıkılaştırma — 🧑 Orhan (DNS) → 🔎 Claude doğrular
- [ ] Gönderen envanteri: Resend (`smtp-email-alerts-deferred` hafızası) + varsa diğerleri.
- [ ] **Tek** birleşik SPF TXT (`v=spf1 include:... -all` / `~all`); birden fazla SPF TXT bırakma; lookup ≤10.
- [ ] DKIM selector + alignment gerçek test e-postasıyla doğrula (Resend DKIM zaten var).
- [ ] DMARC `rua` mailbox ekle; rapor gözlem → `p=quarantine; pct=25` → `pct=100` → gerekirse reject.
- **Kabul:** mail-tester/Postmaster'da SPF pass + DKIM pass + DMARC aligned pass; 7 gün raporda beklenmedik meşru kaynak yok.
- **Not:** Kod değil — DNS işi. Codex'e verilmez.

### 0.3 Mobil LCP/FCP teşhis + optimizasyon — 🔎 Claude teşhis → 🤖 Codex → 🔎 Claude ölçer
- [ ] Gerçek LCP elementini belirle (varsayımla preload EKLEME). Bağlam: [[anasayfa-mobil-lcp]] — masaüstü ağacı `hidden md:block` mobilde hydrate ediliyordu (505KB RSC).
- [ ] LCP'yi TTFB + resource load delay/duration + render delay olarak parçala; RSC payload + hydration maliyetini ölç.
- [ ] Above-the-fold ticker / ilan vitrini / rapor kartlarının SSR-vs-client maliyeti; kullanılmayan JS/CSS + long task.
- [ ] Viewport-gated dynamic import ile masaüstü-only ağaçları mobilde yükleme; SEO-kritik içeriği SSR'da KORU.
- [ ] Font preload'ları yalnız kullanılan weight'lerle sınırla.
- **Kabul:** Mobil Lighthouse medyan (3+ koşu) perf ≥85; lab LCP <2.5s, FCP <1.8s; SSR/indexlenebilirlik regresyonu yok.

### 0.4 Ürün/hal/analiz — tarihli "cevap bloğu" (citability) — 🤖 Codex → 🔎 Claude
- [x] ÖNCE hedef sorgu ↔ sayfa haritası (§ brief). Mekanik her sayfaya blok EKLEME.
- [x] Ürün: tarih + birim + min–max/ortalama + örneklem/kaynak + veri tazeliği. (`0614ceb5`)
- [x] Hal: şehir/hal kapsamı + son güncelleme + öne çıkan değişim özeti. (`6e05be62`)
- [x] Analiz: başta bulgu özeti; sonra yöntem/sınırlar. (`139b8c88`, `aff495ac`)
- [ ] Stabil HTML anchor/ID; "bugün/güncel" ifadeleri makine-okunur kesin tarihle; görünür tablo ile Dataset/Article tutarlılığı otomatik test.
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
- [ ] Schema.org validator + Rich Results Test çıktılarını URL bazında arşivle.

---

## P1 — İçerik & yayın şeffaflığı (E-E-A-T) — 🤖 Codex iskele + 🧑 Orhan içerik

### 4.4 Editoryal şeffaflık
- [ ] Editoryal politika + düzeltme politikası + veri-kaynağı politikası + sahiplik/finansman açıklaması sayfaları.
- [ ] Tüm analizlerde görünür byline + yazar profil linki + uzmanlık.
- [ ] Otomatik haftalık raporları "otomatik üretildi + insan kontrolü" olarak görünür etiketle ([[haftalik-analiz-raporu]]).
- [ ] İletişim sayfasında kurumsal e-posta + sorumlu kişi/kurum.

---

## P1 — Güvenlik: CSP enforce geçişi — 🤖 Codex config + 🧑 Orhan gözlem

### 5.1 Report-Only → Enforce
- [x] Report-Only ihlalleri boyut sınırlı ve URL sorguları redakte edilen merkezi endpoint'te toplanıyor. (`88bde326`, `8cb88095`, `99bcee1a`)
- [ ] Gerekli origin'leri amaç+sahiple envanterle; `unsafe-inline`/`unsafe-eval` azaltma planı (nonce/hash).
- [ ] Staging'de login/kayıt/fiyat alarmı/GTM-GA4/Ads/embed regresyon testi.
- [ ] Küçük trafik yüzdesinde enforce → sorunsuzsa `Content-Security-Policy` enforce.
- **Kabul:** enforce CSP aktif; 1–2 hafta ihlal raporu temiz; 3P akışlar (GTM/GA/Ads/harita/YouTube) çalışıyor.

---

## P2 — Teknik SEO denetimi (raporun atladığı) — 🔎 Claude/🧑 ölçer, 🤖 Codex düzeltir

- [ ] Sitemap: yalnız 200 + kanonik + indexable URL; gerçek `<lastmod>`; 200/redirect/404/noindex/canonical dağılımı.
- [ ] GSC Page Indexing: keşfedildi-taranmadı / tarandı-indekslenmedi / duplicate-canonical.
- [ ] Orphan ürün/hal/analiz sayfaları; iç link derinliği + anchor dağılımı.
- [ ] 3xx/4xx/5xx iç link + redirect chain (tam crawl).
- [ ] Duplicate/missing/truncated title-description-H1 envanteri; canonical + hreflang self/reciprocal.
- [ ] `www`/HTTP/trailing-slash/locale/case varyantları; soft-404 + boş fiyat sayfası index politikası ([[410-yanlis-pozitif-aile-basi]]).
- [ ] Ana sayfa cache politikası (`private, no-cache, no-store`) perf maliyetini ölç; Brotli/HTTP-3/immutable assets fırsatı.
- [ ] Log analiziyle Googlebot/Bingbot/AI-bot crawl sıklığı + 4xx/5xx (audit_request_logs zaten var).
- [ ] a11y 97 / best-practices 96 kayıplarının tekil audit maddeleri; security.txt + SRI + dependency audit.

### 6.1 Anahtar kelime yoğunluğu ve sayfa içi tutarlılık

- [ ] Denetim URL'si, hedef sorgu ve aracın tarama tarihi kaydedilsin; yalnız
  “düşük yoğunluk” puanından hareketle metin çoğaltılmasın.
- [ ] Hedef ifade title, meta description, tek H1, en az bir açıklayıcı H2 ve
  görünür giriş/cevap bloğında doğal biçimde mevcut mu kontrol edilsin.
- [ ] Kelime sayımını şişiren tekrarlar ayrı ölçülsün: tablo satırları, select
  option'ları, menü/footer, kaynak rozetleri, gizli/mobil kopyalar ve fiyat
  para birimi karakterleri ana editoryal içerik sayılmasın.
- [ ] İl/ilçe/hal detay tablolarında her satırda değişmeyen şehir ve hal adı
  sütunları tek bağlam başlığına indirgensin; ürün/fiyat verisi korunmalı.
- [ ] Hedef sorgunun eş anlamlı ve yakın niyetleri kapsansın: “hal fiyatları”,
  “toptan fiyat”, “güncel fiyat listesi”, kesin veri tarihi ve kaynak.
- [ ] Keyword stuffing kontrolü yapılsın: yapay tekrar, anlamsız alt etiketi,
  gizli metin veya yalnız araç puanı için başlık çoğaltması eklenmesin.
- [ ] En az bir yüksek gösterimli ürün, şehir hali ve genel fiyat sayfası
  karşılaştırılsın; şablon kaynaklı sorun ile URL'ye özgü içerik açığı ayrılsın.
- [ ] Değişiklik sonrası görünür metin, title/meta/H1-H2 dağılımı ve SSR HTML
  yeniden taransın; GSC sorgu/CTR etkisi 28 gün izlenerek sonuç kaydedilsin.
- **Kabul:** hedef terim title/meta/H1 ve doğal açıklayıcı içerikte tutarlı;
  tablo/boilerplate tekrarı editoryal metni baskılamıyor; yoğunluk için yapay
  tekrar yok; sayfa tasarımı ve fiyat verisi değişmemiş.

---

## P2 — Ölçüm / KPI baseline — 🔎 Claude + 🧑 Orhan (Codex: yalnız RUM kurulumu)

- [x] **INP/CWV RUM:** örneklemeli web-vitals telemetry GA4 veri katmanına bağlandı ve test edildi. (`ccaf86ae`, `ad6f5be4`)
- [ ] CrUX/GSC origin+URL alan verisi baseline (28 gün).
- [ ] **AI sorgu benchmark'ı:** 30–50 TR hedef sorgu; platform×tarih×marka-geçişi×citation kaydı; aylık tekrar.
- [ ] Backlink/referring-domain + unlinked mention + branded search baseline; 5 gerçek rakip gap analizi.
- [ ] Operasyonel KPI: schema-valid URL oranı, indexable sitemap oranı, CWV-good URL oranı, AI-referrer trafiği (ayrı kanal).
- [ ] Her KPI: baseline + hedef + kaynak + owner + kontrol sıklığı. "GEO skoru"nu tek metrik yapma.

---

## Stratejik (bu çeyrek) — 🧑 Orhan iş geliştirme (kod değil)

- [ ] Marka otoritesi (en zayıf, 55/100): veri kataloğu (data.gov.tr/Kaggle — önce lisans/güncelleme/doğruluk süreci), tarım/ekonomi basınında mention, ölçülebilir YouTube/Reddit planı. Wikipedia'yı KPI yapma.
- [ ] Açık veri API pazarlama: GitHub örnek istemci/notebook, Postman collection + OpenAPI + changelog + versioning → geliştirici + makine-ajanı trafiği. (→ monetizasyon kanal C, [[monetizasyon-sponsor-haric-yonu]])
- [ ] Haftalık/aylık özgün endeks bülteni + basın listesi (veri gazeteciliği).
- [ ] İngilizce genişleme fizibilitesi ("Turkey vegetable prices") — uluslararası AI sorguları.

---

## Önerilen sıra
1. **P0 kesin düzeltmeler:** H1 → citability blokları → mobil LCP → SPF/DMARC (paralel: Orhan DNS).
2. **P1 schema kalite + şeffaflık + CSP enforce.**
3. **P2 teknik audit + KPI baseline.**
4. **Stratejik otorite** (süregelen).
5. **90 gün:** teknik KPI + organik sonuç + gerçek AI görünürlüğü birlikte yeniden ölç.

## İlgili
- Codex brief: `docs/codex-briefs/geo-seo-implementation.md`
- Değerlendirme: `docs/GEO-SEO-RAPORU-2026-07-26-EKSIKLER.md`
- Rapor: `HalDeFiyat-GEO-SEO-Raporu-2026-07-26.pdf`
