# HalDeFiyat GEO/SEO Implementasyon Oturumu — 26.07.2026

> Durum: GEO/SEO uygulaması canlı; dış veri/ölçüm ve sahiplik girdisi bekleyen maddeler sürüyor
> Uygulama brief'i: `docs/codex-briefs/geo-seo-implementation.md`
> Kaynak rapor v1: `HalDeFiyat-GEO-SEO-Raporu-2026-07-26.pdf`
> Kaynak rapor v2: `HalDeFiyat-GEO-SEO-Raporu-2026-07-26 copy.pdf`
> Amaç: Yapılan değişikliklerin Claude/Orhan tarafından çapraz kontrol edilebilmesi için
> uygulama, kanıt, sorun, soru ve blokajları tek yerde tutmak.

## 1. Çalışma Kuralları

- Her görev küçük ve tek konulu commit olarak tutulur.
- Kullanıcıya her küçük adımdan sonra dönülmez; anlamlı çalışma paketi tamamlanana kadar devam edilir.
- Sorunlar, sorular ve uygulama dışı bulgular bu dosyada ayrı başlıklara yazılır.
- Canlı deploy ayrıca belirtilmedikçe yapılmaz.
- GÖREV 2 ve GÖREV 3'te brief'in bloklayıcı ön koşulları aşılmaz.
- SEO-kritik içerik SSR olarak korunur.
- Mevcut schema türleri yeniden yazılmaz; yalnız kalite alanları geliştirilir.
- CSP gözlemden enforce moduna açık onay olmadan geçirilmez.

## 2. Genel Durum

| Brief görevi | Durum | Commit / not |
|---|---|---|
| GÖREV 1 — Ana sayfa H1 | Kod tamamlandı | `c8600951` |
| GÖREV 2 — Citability cevap blokları | Yerelde tamamlandı | Ürün → hal → genel → analiz şablonları uygulandı |
| GÖREV 3 — Mobil LCP/FCP | Yerelde tamamlandı | Metin LCP teşhisine göre Google tag zinciri ertelendi; SSS hidrasyonu kaldırıldı |
| GÖREV 4a — Article/NewsArticle kalite | Büyük ölçüde tamamlandı | `35ab742f`, `c21c4a1e` |
| GÖREV 4b — Breadcrumb kalite | Hedef şablonlarda tamamlandı | `62e71ca5` |
| GÖREV 4c — Dataset kalite | Ana sayfa/ürün/hal tamamlandı | `35ab742f` |
| GÖREV 5 — E-E-A-T iskele | Kod iskeleti tamamlandı | `820c58d2`; CMS metinleri bekleniyor |
| GÖREV 6 — CSP gözlem ve enforce | Canlı tamamlandı | Endpoint + Nginx reporting + enforce; canlı Chrome regresyonu temiz (3.54) |
| GÖREV 7 — Web Vitals RUM | Kod tamamlandı | `ccaf86ae`; canlı event doğrulaması bekliyor |
| GÖREV 8 — Sitemap doğruluğu | Kod tamamlandı | `a9620c9a`; canlı tam crawl bekliyor |

## 3. Tamamlanan İşler

### 3.1 Ana sayfa H1

Commit: `c8600951 fix(seo): add localized homepage h1`

Değişiklikler:

- Masaüstü hero başlığı aynı CSS sınıfları korunarak `h2` → `h1` yapıldı.
- Başlık ve alt başlık mevcut `home.hero` i18n alanlarından besleniyor.
- Mobil hero H1'i aynı i18n kaynağına bağlandı.
- Mobil ve masaüstü ağaçları UA bazlı ayrı SSR edildiği için her yanıtta tek H1 hedeflendi.

Dosyalar:

- `frontend/messages/tr.json`
- `frontend/src/components/sections/HeroSection.tsx`
- `frontend/src/components/sections/HeroSectionClient.tsx`
- `frontend/src/components/sections/MobileHomeHero.tsx`

Çapraz kontrol:

- [ ] Deploy sonrası masaüstü UA ile SSR HTML'de tam 1 `<h1>`.
- [ ] Deploy sonrası mobil UA ile SSR HTML'de tam 1 `<h1>`.
- [ ] H1 metni: “Türkiye Hal Fiyatları — Günlük Sebze ve Meyve Fiyatları”.
- [ ] Lighthouse SEO ve accessibility regresyonu yok.

### 3.2 Gerçek Kullanıcı Web Vitals

Commit: `ccaf86ae feat(analytics): report sampled real-user web vitals`

Değişiklikler:

- `next/web-vitals` üzerinden INP, LCP, CLS, FCP ve TTFB ölçülüyor.
- Event adı `web_vitals`.
- Event alanları:
  - `metric_id`
  - `metric_name`
  - `metric_value`
  - `metric_delta`
  - `metric_rating`
  - `navigation_type`
  - `page_path`
  - `non_interaction`
- Bot, crawler, headless, Lighthouse ve PageSpeed UA'ları dışlanıyor.
- Örnekleme oturum boyunca sabit.
- Varsayılan örnekleme oranı `%10`.
- `NEXT_PUBLIC_WEB_VITALS_SAMPLE_RATE` ile 0–1 arasında değiştirilebilir.

Dosyalar:

- `frontend/src/components/analytics/WebVitals.tsx`
- `frontend/src/app/layout.tsx`

Çapraz kontrol:

- [ ] GTM Preview veya GA4 DebugView'da `web_vitals` görünüyor.
- [ ] Gerçek kullanıcıdan `INP` ve `LCP` eventi geliyor.
- [ ] Aynı oturumda örnekleme kararı değişmiyor.
- [ ] Lighthouse çalışması RUM event'i oluşturmuyor.
- [ ] 28 günlük p75 raporunun veri kaynağı tanımlanıyor.

### 3.3 Sitemap

Commit: `a9620c9a fix(seo): keep sitemap canonical and use real lastmod dates`

Değişiklikler:

- `noindex` olduğu canlı kontrolde doğrulanan `/api-docs` sitemap'ten çıkarıldı.
- İlk aşamada canlı canonical'ı `/tr/...` olan üç sayfanın sitemap URL'si mevcut
  canonical ile eşleştirildi.
- Sonraki kök neden düzeltmesinde `localePrefix: "as-needed"` politikasına aykırı
  manuel canonical'lar kaldırıldı ve üç URL yeniden prefixsiz hale getirildi:
  - `/borsa`
  - `/canli-hayvan-fiyatlari`
  - `/et-fiyatlari`
- Statik sayfalardaki uydurma günlük `lastmod` değerleri kaldırıldı.
- Ürün/hal/firma sayfalarında yalnız geçerli gerçek tarih varsa `lastModified` yazılıyor.
- Fiyat hub'larında ürün/hal güncellemelerinin en yeni tarihi kullanılıyor.
- Firma hub'larında gerçek firma güncelleme/son görülme tarihi kullanılıyor.
- Analiz index'i ve yazılar gerçek rapor tarihinden besleniyor.
- Geçersiz tarihler sitemap'e yazılmıyor.

Dosya:

- `frontend/src/app/sitemap.ts`

Çapraz kontrol:

- [ ] Canlı sitemap'teki tüm URL'ler 200.
- [ ] Tüm URL'ler self-canonical.
- [ ] Tüm URL'ler indexable.
- [ ] Redirect/noindex/404 oranı sıfır.
- [ ] Dinamik ürün/hal `lastmod` değerleri gerçek veri tarihiyle eşleşiyor.
- [ ] Statik sayfalarda her gün değişen sahte `lastmod` yok.

### 3.4 Dataset ve Tarih Schema Kalitesi

Commit: `35ab742f feat(seo): improve schema dates and dataset metadata`

Değişiklikler:

- Otomatik analiz raporlarının gerçek DB `updatedAt` alanı public API modeline eklendi.
- `NewsArticle.dateModified`, yalnız gerçek `updatedAt` varsa yazılıyor.
- Statik analizlerde bilinmeyen değişiklik tarihi üretilmiyor.
- Metodoloji sayfasının her request/build'de “bugün” üreten sahte `dateModified` alanı kaldırıldı.
- Gerçek güncelleme tarihi analiz byline alanında görünür hale getirildi.
- Ana sayfa Dataset:
  - `dateModified`
  - `measurementTechnique`
  - `distribution/DataDownload`
- Ürün Dataset:
  - `dateModified`
  - `spatialCoverage`
  - `isAccessibleForFree`
  - `measurementTechnique`
- Hal Dataset:
  - `dateModified`
  - `isAccessibleForFree`
  - `measurementTechnique`

Dosyalar:

- `backend/src/modules/analysis/weekly-report.ts`
- `frontend/src/lib/api.ts`
- `frontend/src/lib/analiz.ts`
- `frontend/src/app/[locale]/(public)/page.tsx`
- `frontend/src/app/[locale]/(public)/urun/[slug]/page.tsx`
- `frontend/src/app/[locale]/(public)/hal/[slug]/page.tsx`
- `frontend/src/app/[locale]/(public)/analiz/[slug]/page.tsx`
- `frontend/src/app/[locale]/(public)/metodoloji/page.tsx`

Çapraz kontrol:

- [ ] Schema.org validator ana sayfa/ürün/hal örneklerinde temiz.
- [ ] Dataset `dateModified` görünür veri tarihiyle tutarlı.
- [ ] DataDownload URL'si 200 ve beklenen JSON formatında.
- [ ] Statik metodoloji sayfasında yapay güncel tarih yok.

### 3.5 Article Görsel Oranları ve Yıllık Rapor

Commit: `c21c4a1e feat(seo): add article image variants and truthful report dates`

Değişiklikler:

- Dinamik analiz OG endpoint'i üç oran üretiyor:
  - `?ratio=1x1` → 1200×1200
  - `?ratio=4x3` → 1200×900
  - `?ratio=16x9` → 1200×675
- Dinamik kapak kullanan NewsArticle schema üç URL'yi `image` dizisi olarak yazıyor.
- Özel CMS kapağı varsa tek gerçek özel görsel korunuyor; olmayan varyant uydurulmuyor.
- Yıllık raporda yapay `${year + 1}-01-01` yayın tarihi kaldırıldı.
- Yıllık raporda gerçek `overview.newestDate`, `dateModified` olarak kullanılıyor.
- `mainEntityOfPage`, `url`, `image`, `inLanguage`, `isAccessibleForFree`, `about` eklendi.
- Veri dönemi görünür `<time>` elemanlarıyla gösteriliyor.
- Yinelenen yıllık rapor breadcrumb satırı temizlendi.

Çapraz kontrol:

- [ ] Üç OG URL'si 200 ve doğru piksel boyutunda.
- [ ] Rich Results Test NewsArticle görsellerini okuyor.
- [ ] Yıllık rapor `dateModified` değeri en yeni veri tarihiyle aynı.
- [ ] Yıllık raporda yapay yayın tarihi yok.

### 3.6 Görünür ve Yapısal Breadcrumb Eşleşmesi

Commit: `62e71ca5 feat(seo): align visible and structured breadcrumbs`

Değişiklikler:

- `Breadcrumb` bileşenine opt-in `visible` modu eklendi.
- Görünür `<nav aria-label="Sayfa yolu">` ve JSON-LD aynı `items` dizisinden üretiliyor.
- Son öğe `aria-current="page"` olarak gösteriliyor.
- Yalnız brief kapsamındaki hedef şablonlarda açıldı:
  - analiz detayı
  - yıllık rapor
  - metodoloji
- Site genelindeki diğer kullanımlar görsel tasarım etkisini sınırlamak için değiştirilmedi.

Çapraz kontrol:

- [ ] Görünür breadcrumb ile JSON-LD adları/sırası aynı.
- [ ] Ara öğe linkleri 200.
- [ ] Mobilde taşma veya layout shift yok.
- [ ] Accessibility tree içinde nav ve current page doğru.

### 3.7 E-E-A-T Şeffaflık İskeleti

Commit: `820c58d2 feat(trust): scaffold editorial transparency pages`

Eklenen rotalar:

- `/editoryal-politika`
- `/duzeltme-politikasi`
- `/veri-kaynagi-politikasi`
- `/sahiplik-finansman`

Değişiklikler:

- Sayfalar `customPages` CMS modülünden slug ile içerik çekiyor.
- CMS içeriği yoksa route ve başlık iskeleti çalışıyor.
- Dört sayfa footer “Kurumsal” kolonuna eklendi.
- Dört sayfa sitemap'e eklendi.
- Otomatik DB haftalık raporları görünür biçimde:
  - otomatik oluşturulmuş
  - yayın öncesi insan editoryal kontrolünden geçirilmiş
  olarak etiketleniyor.
- Analizlerde mevcut yazar byline/profil bağlantısı korundu.

Dosyalar:

- `frontend/src/components/TransparencyPolicyPage.tsx`
- `frontend/src/app/[locale]/(public)/editoryal-politika/page.tsx`
- `frontend/src/app/[locale]/(public)/duzeltme-politikasi/page.tsx`
- `frontend/src/app/[locale]/(public)/veri-kaynagi-politikasi/page.tsx`
- `frontend/src/app/[locale]/(public)/sahiplik-finansman/page.tsx`
- `frontend/src/components/Footer.tsx`
- `frontend/src/app/sitemap.ts`
- `frontend/src/app/[locale]/(public)/analiz/[slug]/page.tsx`

Çapraz kontrol:

- [ ] Dört route canlıda 200.
- [ ] Footer linkleri doğru route'a gidiyor.
- [ ] Sitemap dört URL'yi içeriyor.
- [ ] CMS'de nihai içerikler girildiğinde fallback kayboluyor.
- [ ] Otomatik rapor etiketi yalnız DB otomatik raporlarında görünüyor.

### 3.8 CSP İhlal Toplama

Commitler:

- `88bde326 feat(security): collect CSP violation reports`
- `86be72df test(security): cover CSP report normalization`
- `8cb88095 fix(security): cap CSP report request bodies`
- `99bcee1a fix(security): redact URL queries from CSP logs`

Değişiklikler:

- Yeni endpoint: `POST /api/v1/csp-reports`
- Kabul edilen content type:
  - `application/csp-report`
  - `application/reports+json`
- Eski `csp-report` ve yeni Reporting API envelope formatları normalize ediliyor.
- Tek istekte en fazla 20 rapor işleniyor.
- İstek gövdesi route seviyesinde 64 KB ile sınırlı.
- String alanları sınırlandırılıyor.
- Payload ham biçimde loglanmıyor.
- HTTP(S) URL'lerinin query string ve fragment bölümleri loglanmıyor.
- Yapılandırılmış log olayı: `event=csp_violation`.
- Endpoint rate-limit: 60 istek/dakika.
- Başarılı cevap: 204.
- Legacy ve Reporting API normalizasyonu, batch/string sınırları ve bilinmeyen
  alanların loga taşınmaması otomatik testlerle kapsandı.
- Enforce modu açılmadı.

Dosyalar:

- `backend/src/modules/csp-reports/index.ts`
- `backend/src/routes/project.ts`
- `backend/src/app.ts`
- `backend/test/csp-reports.test.ts`

Çapraz kontrol:

- [ ] `application/csp-report` örnek payload → 204.
- [ ] `application/reports+json` örnek payload → 204.
- [ ] PM2 logunda sanitize edilmiş `csp_violation` kaydı var.
- [ ] Bozuk JSON backend'i düşürmüyor.
- [ ] 64 KB üzeri gövde 413 dönüyor.
- [ ] Rate-limit çalışıyor.

### 3.9 ETL Akış Sorunlarının Kaydı

Commit: `5961e1bf docs(etl): track stalled Kocaeli Mersin Canakkale feeds`

`KALAN-ISLER.md` içine eklendi:

- Kocaeli son başarılı: 08.05.2026.
- Mersin son başarılı: 19.05.2026; 26.07.2026 HTTP 403.
- Çanakkale son başarılı: 26.05.2026.
- Her kaynak için teşhis yönü ve kabul kriteri yazıldı.

### 3.10 Dataset Zaman Kapsamı ve Görünür Veri Tazeliği

Commitler:

- `865ee9ff fix(seo): bound dataset temporal coverage to real dates`
- `857d6e00 fix(seo): derive dataset freshness from database bounds`

Değişiklikler:

- Ürün ve hal Dataset `temporalCoverage` alanındaki yanlış
  `en-yeni-tarih/..` gösterimi kaldırıldı.
- Veri yokken uydurulan `2025/..` fallback'i ürün ve hal şablonlarından çıkarıldı.
- Ortak `schemaDateRange` yardımcısı yalnız geçerli ISO tarihleri kabul ediyor ve
  gerçek `en-eski/en-yeni` aralığını üretiyor.
- `/prices/overview` cevabına DB `MIN(recorded_date)` üzerinden
  `earliestRecordedDate` eklendi.
- Ana sayfa, fiyatlar hub'ı ve canlı fiyat sayfası Dataset tarihleri gerçek DB
  alt/üst sınırlarından besleniyor.
- Fiyatlar ve canlı fiyat Dataset'lerine eksik `DataDownload`,
  `measurementTechnique`, `license` ve `isAccessibleForFree` alanları tamamlandı.
- Canlı fiyat sayfasındaki sunucu saatinden üretilen “Bugün güncellendi” ifadesi
  kaldırıldı; görünür “Son veri” tarihi Dataset `dateModified` ile aynı kaynaktan
  geliyor.

Çapraz kontrol:

- [ ] Ürün ve hal örneklerinde `temporalCoverage` en eski/en yeni gerçek satırla aynı.
- [ ] Veri olmayan sayfada `temporalCoverage` ve `dateModified` uydurulmuyor.
- [ ] Ana sayfa/fiyatlar/canlı fiyat schema tarihleri `/prices/overview` ile aynı.
- [ ] Canlı fiyat görünür “Son veri” tarihi ile JSON-LD `dateModified` aynı.
- [ ] DataDownload URL'leri 200 ve JSON döndürüyor.

### 3.11 Hal Sitemap Tarihlerinin Düzeltilmesi

Commit: `f46eeb93 fix(seo): omit misleading market sitemap dates`

Değişiklikler:

- Hal sitemap URL'lerinde fiyat güncellemesi sanılarak kullanılan
  `hf_markets.updated_at` kaldırıldı.
- Bu alan hal master kaydının düzenleme tarihidir; hal fiyat listesinin son veri
  tarihi değildir.
- Hal bazlı gerçek `MAX(recorded_date)` sitemap API'sine eklenene kadar `lastmod`
  üretmemek, yanlış tarih üretmekten daha doğru kabul edildi.
- Ana fiyat hub'larının `lastmod` değeri ürün endpoint'indeki gerçek
  `MAX(recorded_date)` üzerinden gelmeye devam ediyor.

Çapraz kontrol:

- [ ] Hal URL'lerinde master kayıt tarihinden üretilmiş `lastmod` yok.
- [ ] Ürün URL'lerinde `lastmod` gerçek son fiyat kaydıyla aynı.
- [ ] Ana sayfa/fiyatlar/harita hub tarihleri gerçek ürün fiyat üst sınırıyla aynı.

### 3.12 News Sitemap Gelecek Tarih Koruması

Commit: `5822f519 fix(seo): reject future dates from news sitemap`

Değişiklikler:

- News sitemap'in negatif yaş nedeniyle gelecek tarihli yazıları kabul etmesi engellendi.
- Yalnız geçerli `YYYY-MM-DD` takvim tarihleri kabul ediliyor.
- Gelecek takvim günleri reddediliyor.
- Mevcut 48 saatlik Google News penceresi korunuyor.
- Bugün, 48 saat içi, süresi geçmiş, gelecek ve geçersiz tarih senaryoları test edildi.

Çapraz kontrol:

- [ ] Gelecek tarihli analiz news sitemap'e girmiyor.
- [ ] Son 48 saatteki gerçek analiz URL'si sitemap'te bulunuyor.
- [ ] 48 saatten eski URL news sitemap'te bulunmuyor.
- [ ] XML Google News sitemap doğrulamasından geçiyor.

### 3.13 RUM Örnekleme Testleri

Commit: `ad6f5be4 test(analytics): cover Web Vitals sampling rules`

Değişiklikler:

- Web Vitals örnekleme ve sentetik UA kontrolü tarayıcı bileşeninden ayrılarak
  test edilebilir yardımcı fonksiyonlara taşındı.
- Varsayılan `%10` oranı ve 0–1 sınırlandırması test edildi.
- İlk örnekleme kararının session storage içinde sabit kalması test edildi.
- Session storage kapalı/hatalı olduğunda rastgele fallback davranışı test edildi.
- Lighthouse, Google Inspection Tool ve bot UA dışlamaları test edildi.

Çapraz kontrol:

- [ ] Üretim bundle'ında ayarlanmamış oran `%10`.
- [ ] `0` oranında event yok; `1` oranında gerçek kullanıcı event'i var.
- [ ] Aynı oturumda karar değişmiyor.
- [ ] Lighthouse ve Google Inspection Tool event oluşturmuyor.

### 3.14 Sitemap `lastmod` Tarih Sağlamlığı

Commit: `fe7dbfa4 fix(seo): reject invalid and future sitemap dates`

Değişiklikler:

- Sitemap tarih doğrulaması ortak, testli yardımcıya taşındı.
- Gelecek UTC takvim günleri reddediliyor.
- JavaScript'in başka güne normalize ettiği `2026-02-31` gibi geçersiz takvim
  tarihleri reddediliyor.
- Bozuk tarihlerin en yeni tarih hesabını zehirlemesi engellendi.
- Ürün, firma, analiz ve hub `lastmod` değerleri aynı doğrulayıcıdan geçiyor.

### 3.15 Yıllık Rapor Görsel Varyantları

Commit: `6a8e723c feat(seo): add annual report image variants`

Değişiklikler:

- Yeni endpoint: `/og/rapor/yillik/[year]`.
- Desteklenen oranlar:
  - `?ratio=1x1` → 1200×1200
  - `?ratio=4x3` → 1200×900
  - `?ratio=16x9` → 1200×675
- Yıllık rapor JSON-LD `image` dizisi aynı üç kanonik URL'yi kullanıyor.
- Open Graph metadata 16:9 yıllık rapor görselini kullanıyor.
- Görsel üzerinde güncel tarih uydurulmuyor; yalnız rapor yılı gösteriliyor.

Çapraz kontrol:

- [ ] Üç URL 200 ve doğru piksel boyutunda.
- [ ] Yıllık rapor JSON-LD üç görseli içeriyor.
- [ ] `og:image` 16:9 yıllık rapor görseline gidiyor.
- [ ] Rich Results Test Article görsellerini kabul ediyor.

### 3.16 Dinamik OG Tarih Doğruluğu

Commit: `27b09bba fix(seo): use real data dates in OG images`

- Ürün OG görselindeki her istekte “bugün” üreten tarih kaldırıldı.
- Ürün görseli yalnız gerçek son fiyat `updatedAt` değeri varsa tarih gösteriyor.
- Analiz API'si başarısız olduğunda bugünün tarihini gösteren fallback kaldırıldı.
- Geçersiz takvim günlerini normalize etmeyen ortak OG tarih formatlayıcısı eklendi.

### 3.17 Metodoloji Article Kimliği

Commit: `0a637e11 feat(seo): align methodology Article identity`

- Article schema'ya `mainEntityOfPage`, `url`, `image` ve
  `isAccessibleForFree` eklendi.
- Organization author referansıyla eşleşen görünür “Hazırlayan: HalDeFiyat”
  satırı eklendi.
- Gerçek yayın/değişiklik tarihi olmadığı için tarih uydurulmadı.

### 3.18 Metodoloji Görsel Varyantları

Commit: `0dc9dce9 feat(seo): add methodology image variants`

- Yeni endpoint: `/og/metodoloji`.
- 1:1, 4:3 ve 16:9 oranları destekleniyor.
- Metodoloji Article JSON-LD üç görsel URL'sini kullanıyor.
- Open Graph metadata 16:9 metodoloji görselini kullanıyor.
- Görselde güvenilir kaynağı olmayan yayın/değişiklik tarihi gösterilmiyor.

Çapraz kontrol:

- [ ] Üç oran URL'si 200 ve doğru piksel boyutunda.
- [ ] Article JSON-LD üç görseli içeriyor.
- [ ] `og:image` metodoloji 16:9 görseline gidiyor.

### 3.19 RFC Security.txt

Commit: `7cf22f9a feat(security): publish configured security.txt`

- Yeni endpoint: `/.well-known/security.txt`.
- `Contact` adresi hardcode edilmeden DB `siteSettings.contact_email` alanından geliyor.
- `Expires` her yanıtta bir yıl ilerisi olacak şekilde RFC tarih formatında üretiliyor.
- HTTPS `Canonical` ve `Preferred-Languages: tr, en` alanları bulunuyor.
- Eksik/geçersiz e-posta durumunda yanlış iletişim yayınlamak yerine 503 dönüyor.
- Header enjeksiyonuna uygun bozuk e-posta değerleri reddediliyor.

Çapraz kontrol:

- [ ] Canlı endpoint 200 ve `text/plain` dönüyor.
- [ ] Contact kurumsal e-postayla aynı.
- [ ] Canonical HTTPS ve kendi endpoint'i.
- [ ] Expires gelecekte ve bir yıldan uzun değil.

### 3.20 Varsayılan Locale Canonical Düzeltmesi

Commit: `ab012981 fix(seo): canonicalize default locale without prefix`

- Borsa, canlı hayvan ve et fiyatları sayfalarındaki manuel `/tr/...` canonical
  değerleri kaldırıldı.
- Üç sayfa ortak `getPageMetadata` ve `buildLocaleAlternates` yoluna geçirildi.
- Türkçe varsayılan locale için canonical, hreflang `tr` ve `x-default`
  prefixsiz URL kullanıyor.
- Sitemap aynı prefixsiz kanonik URL'lere geri alındı.
- Proxy'nin zaten `/tr/...` isteklerini prefixsiz URL'ye 308 yönlendirmesiyle
  sitemap/canonical çelişkisi giderildi.

### 3.21 Ürün Görsel Alt Metni

Commit: `3dddeb04 fix(a11y): describe product images`

- Ürün fotoğraflarındaki yalnız ürün adından oluşan alt metin
  “{ürün} ürün görseli” biçiminde açıklayıcı hale getirildi.
- Dekoratif emoji fallback'i `aria-hidden` kalmaya devam ediyor.

### 3.22 Boş Hal Sayfasında ETL İddiası

Commit: `955cb6fe fix(content): avoid false ETL status on empty markets`

- Veri bulunmadığında “ETL kaynağı çalışıyor” şeklindeki doğrulanmamış kesin ifade
  kaldırıldı.
- Mesaj; bülten yayımlanmaması, aktarım gecikmesi veya kaynak erişim kesintisi
  olasılıklarını birbirinden ayırıyor.
- Kocaeli, Mersin ve Çanakkale kesintileriyle görünür mesajın çelişmesi engellendi.

### 3.23 Canlı Hayvan ve Et Dataset Zenginleştirmesi

Commit: `50d35c3f feat(seo): enrich category price datasets`

- Ortak kategori fiyat şablonuna gerçek satırlardan `dateModified` ve
  `temporalCoverage` eklendi.
- `creator`, `license`, `spatialCoverage`, `variableMeasured`,
  `isAccessibleForFree`, `measurementTechnique` ve JSON `DataDownload`
  dağıtımı tamamlandı.
- Veri yoksa tarih alanları uydurulmuyor.

### 3.24 AI Crawler API Bağlantıları

Commit: `35f290ed fix(geo): publish canonical API links to crawlers`

- `llms-full.txt` ürün kaynağındaki geçersiz `/api/v1/products` yolu
  `/api/v1/prices/products` olarak düzeltildi.
- Dinamik ürün ve hal listeleri yalnız `seoIndex=true` kayıtlarından üretiliyor;
  AI crawler'a noindex/canonical varyant URL'leri sunulmuyor.
- Yanlış `/openapi.json` bağlantıları Fastify Swagger'ın gerçek
  `/api/docs/json` yoluna taşındı.
- API kullanım politikası sayfasındaki görünür OpenAPI linki de aynı hedefe alındı.

### 3.25 Robots ve LLMS API Erişim Tutarlılığı

Commit: `f2ece31a fix(geo): allow AI crawlers on public data APIs`

- `llms.txt` ajanlara JSON API kullanmalarını söylerken robots tüm `/api/`
  yollarını engelliyordu.
- GPTBot, ChatGPT-User, ClaudeBot, PerplexityBot, Google-Extended ve CCBot için
  yalnız şu read-only veri yüzeyleri daha uzun `Allow` kuralıyla açıldı:
  - `/api/v1/prices`
  - `/api/v1/index`
  - `/api/v1/sources/status`
  - `/api/docs/json`
- Genel `/api/` engeli korunuyor; admin/yazma yüzeyleri açılmadı.
- Robots policy otomatik testle güvenceye alındı.

### 3.26 LLMS Kapsam Verilerinin Canlılaştırılması

Commit: `96bc3b54 fix(geo): derive llms coverage from live data`

- Sabit “250+ ürün”, “16 kaynak” ve “2025'ten itibaren” iddiaları kaldırıldı.
- `llms.txt`; gerçek overview ve source-status cevabından ürün, hal, kaynak ve en
  eski veri tarihini üretiyor.
- `llms-full.txt`; indekslenebilir gerçek ürün/hal sayısı ile DB başlangıç
  tarihini kullanıyor.
- Backend erişilemezse `0` veya uydurma sayı yerine nötr metin gösteriliyor.

### 3.27 Tarihli Ürün Cevap Blokları

Commit: `0614ceb5 feat(geo): add dated product answer summaries`

- Ortak, görünür ve anchor destekli `AnswerBlock` bileşeni eklendi.
- Tüm ürün şablonlarında `#ortalama-fiyat`; kesin kayıt tarihi, baskın birim,
  min–maks, ortalama, hal örneklemi, kaynak ve veri tazeliğini gösteriyor.
- Görünür değerler Product schema ve perakende kıyasının kullandığı aynı
  `offerLow`, `offerHigh`, `offerAvg`, `offerCount` kaynağından geliyor.
- Piyasa niyeti için günlük ortalamalardan birbirini izleyen 7 ve 30 günlük
  pencere değişimleri hesaplanıyor.
- Trend hesapları otomatik testle kapsandı.

### 3.28 Tarihli Hal Cevap Blokları

Commit: `6e05be62 feat(geo): add dated market answer summaries`

- Tüm hal şablonlarında `#bugunun-hal-fiyatlari` SSR bloğu eklendi.
- Son kayıt tarihindeki gerçek ürün sayısı, kaynak ve kesin güncelleme tarihi
  gösteriliyor.
- Son 90 günlük gerçek seriden her ürünün en yeni iki yayın günü kıyaslanıyor;
  mutlak değişimi en yüksek üç ürün özetleniyor.
- Veri yoksa “bugün” veya çalışan ETL iddiası üretilmiyor.

### 3.29 Genel Fiyat ve Analiz Özetleri

Commitler:

- `33200273 feat(geo): summarize current national price coverage`
- `139b8c88 feat(geo): anchor analysis finding summaries`
- `aff495ac fix(geo): bound analysis finding summaries`

Yapılanlar:

- `/fiyatlar#turkiye-hal-fiyatlari-ozeti` gerçek son veri kesitindeki ürün ve
  hal/kaynak kapsamını gösteriyor; öncelikli ürün ve İstanbul hal sayfasına
  görünür iç link veriyor.
- Analizlerde mevcut CMS/rapor özeti `#bulgu-ozeti` içine alındı; rapor tarihi,
  yöntem/sınır bağlantısı ve kapsam uyarısıyla 2–4 cümlelik giriş sağlandı.
- CMS özeti en fazla ilk üç cümleyle sınırlandı; kapsam uyarısıyla blok en fazla
  dört cümle kalıyor.
- Özet metni içerikten bağımsız üretilmedi; `makale.ozet` tek kaynak kaldı.

### 3.30 Ölçüme Dayalı Mobil LCP Hazırlığı

Commitler:

- `b507c516 perf(lcp): defer Google tags until idle or interaction`
- `085c7681 perf(lcp): render homepage FAQ without hydration`

Yapılanlar:

- GTM, GA4 ve Ads dış scriptleri pencere `load` sonrasındaki idle anına veya ilk
  kullanıcı etkileşimine ertelendi.
- Consent Mode küçük başlangıç kodu etiketlerden önce kalıyor.
- Etiket yüklenmeden oluşan conversion ve RUM event'leri `dataLayer` kuyruğunda
  korunuyor.
- GTM mevcutsa GA4 ayrıca yüklenmiyor; Ads etiketi aynı gecikmeli yükleyicide
  başlatılıyor.
- Mobil/masaüstü UA sunucu ayrımı ve statik hero metni korundu.
- Ana sayfa SSS, React state ve ikon JS'i yerine native `<details>` kullanıyor;
  içerik SSR'da görünür kalırken bu bölüm artık hydrate edilmiyor.
- Outfit denetiminde tüm 300–900 ağırlıklarının aynı iki değişken WOFF2 dosyasını
  kullandığı, `font-display: swap` ve Next font preload'un etkin olduğu görüldü;
  bu nedenle ek font preload veya görsel preload eklenmedi.

### 3.31 Düşük Anahtar Kelime Tutarlılığı ve Hal Tablosu Tekrarları

Commitler:

- `a0aae0bf fix(seo): remove repeated market terms from detail tables`
- `a55ddb1f fix(seo): remove repeated product terms from detail tables`

Kaynak:

- Kullanıcının paylaştığı YourSeoBoard ekran görüntüsü.
- Görünen kelime dağılımı: “antalya” 120, “serik” 72, “hali” 72 ve bu
  sözcüklerden oluşan ikili/üçlü ifadeler 48–72 tekrar.
- Hedef URL görüntüde yazmadığı için kelime örüntüsünden
  `/hal/antalya-hal-serik` şablonu olduğu çıkarımı yapıldı.

Uygulama:

- Hal detayındaki her fiyat satırı aynı `marketName` ve `cityName` değerini
  tekrar basıyordu.
- Market ve şehir bilgisi H1, metadata, breadcrumb, cevap bloğu ve editoryal
  bölümde zaten mevcut olduğundan detay tablosundaki değişmeyen iki sütun
  gizlendi.
- Ürün, min/ortalama/maks, tarih ve kaynak sütunları korunuyor.
- Cevap bloğu H2'si tüm market adını doğal sorgu biçiminde kullanıyor:
  “{Hal adı} fiyatları bugün ne durumda?”
- Ortak `PriceTable` yalnız hal detayında yeni sütun gizleme prop'larını alıyor;
  ürün ve genel fiyat tablolarının şehirler arası karşılaştırma bağlamı korunuyor.
- Ürün detayında da her hal satırında değişmeyen ürün sütunu gizlendi; hal ve
  şehir sütunları fiyat karşılaştırması için görünür bırakıldı.
- Master checklist'e keyword density/tutarlılık için ayrı teşhis ve kabul
  maddeleri eklendi.

### 3.32 Ana Sayfa FAQ Kapsam Doğruluğu

Commit: `ce97793f fix(content): derive homepage FAQ coverage from live data`

- Ana sayfa SSS ve FAQPage schema aynı `buildFaqItems` çıktısından üretiliyor.
- Sabit “16 resmi ETL kaynağı” ve “250’den fazla ürün” ifadeleri kaldırıldı.
- Gerçek `activeCities`, `activeMarkets`, `trackedProducts` ve son fiyat tarihi
  ana sayfanın zaten çektiği overview verisinden aktarılıyor.
- Backend erişilemezse `0` veya eski sayı yerine nötr kapsam metni gösteriliyor.
- “Her gün 06:15” ve “manuel müdahale yok” yerine kaynak yayın takvimi,
  normalizasyon ve kalite kontrolü açıklandı.
- Canlı kapsam ve nötr fallback iki otomatik testle güvenceye alındı.

### 3.33 Site Genelinde Kapsam ve ETL Takvimi Tutarlılığı

Commit: `ab0b923b fix(content): replace stale coverage and ETL schedule claims`

- `/fiyatlar` metadata, görünür giriş, FAQ ve DataCatalog açıklamasındaki sabit
  ürün sayısı/saat iddiaları gerçek overview veya nötr fallback'e geçirildi.
- Ürün ve hal metadata/FAQ/editoryal metinlerindeki tek saat iddiası kaldırıldı;
  ürün FAQ'sı gerçek son kayıt tarihini kullanıyor.
- `llms.txt` ve `llms-full.txt` aynı kaynak yayın takvimi tanımına geçirildi.
- `getCoverage`; gerçek ürün, kaynak, en eski ve en yeni kayıt alanlarıyla
  genişletildi.
- Hakkımızda istatistikleri gerçek il, hal, ürün ve izlenen kaynak sayılarını
  kullanıyor; “boş sayfa asla olmaz” gibi ETL kesintileriyle çelişen iddia
  kaldırıldı.
- Metodoloji metadata ve genel bakış kartları izlenen kaynak sayısı ile gerçek
  veri başlangıcını kullanıyor; sabit 16 kaynak/2025/06:15 kaldırıldı.
- Statik kaynak tablosu eksiksiz aktif envanter gibi sunulmayıp “Başlıca Veri
  Kaynakları” olarak doğru sınırlandı.

### 3.34 Endeks Dataset Tarihlerinin Canlılaştırılması

Commit: `52115e13 fix(seo): derive index dataset dates from history`

- Endeks sayfası schema için API'nin izin verdiği 104 haftalık kayıt penceresini
  çekiyor; görünür grafik ve tablo son 26 haftada kalıyor.
- Dataset `temporalCoverage` ve `dateModified` gerçek `weekStart`/`weekEnd`
  sınırlarından üretiliyor.
- `/fiyatlar` DataCatalog içindeki endeks kaydında doğrulanamayan `2025/..`
  sabiti kaldırıldı; ayrı endeks sayfası gerçek tarih aralığının kanonik kaynağı.
- Veri yoksa schema tarih alanı uydurulmuyor.

### 3.35 Canlı Hal Landing Kapsamı ve Breadcrumb Tutarlılığı

Commit: `e3c1776b fix(content): remove stale live coverage claims`

- `/canli-hal-fiyatlari` title ve hero içindeki sabit `22+` kapsam iddiası
  kaldırıldı; aktif hal sayısı overview verisinden geliyor.
- Ürün ve hal KPI'ları backend erişilemediğinde `250`/`22` uydurmak yerine nötr
  `—` gösteriyor.
- “Anlık” ve tarihten bağımsız “bugün” kesinliği azaltıldı; görünür son veri
  tarihi korunuyor.
- Elle yazılmış yalnız-schema breadcrumb yerine ortak `Breadcrumb` bileşeni
  kullanıldı; görünür sayfa yolu ve BreadcrumbList aynı item kaynağından çıkıyor.
- Web manifest içindeki sabit `22+` iddiası tarihsiz, nötr kapsam metnine
  geçirildi.
- Aynı sabit fallback'leri kullanan mobil ana sayfa KPI'ları da düzeltildi.

### 3.36 Eksik Breadcrumb Şablonlarının Tamamlanması

Commitler:

- `ee8de6bd fix(seo): add comparison breadcrumb schema`
- `d241af55 fix(seo): align policy page breadcrumbs`

Yapılanlar:

- Sitemap'teki `/karsilastirma` görünür breadcrumb'ı elle yazılmış nav yerine
  ortak bileşene geçirildi; aynı item dizisi artık BreadcrumbList de üretiyor.
- Ortak `LegalPageContent` bileşeni pathname alarak görünür ve yapısal sayfa
  yolunu birlikte üretiyor.
- Gizlilik Politikası, Kullanım Koşulları ve KVKK şablonları bu ortak kapsama
  alındı.
- Dört editoryal şeffaflık sayfasındaki yalnız-schema breadcrumb da aynı ortak
  görünür yapıya taşındı.
- Sitemap'teki İletişim sayfasına görünür + yapısal breadcrumb eklendi.

### 3.37 İndekslenebilir Şablonlarda Görünür Breadcrumb Kapsamı

Commit: `5a204511 fix(seo): show breadcrumbs on indexed templates`

- BreadcrumbList zaten üretildiği halde görünür sayfa yolu olmayan sitemap
  şablonları tek tek envanterlendi.
- Ürün ve hal detayları; hal, fiyat, analiz, endeks, borsa, harita, embed,
  basın ve hakkımızda hub'ları görünür breadcrumb'a geçirildi.
- Firma detay/şehir/tür kombinasyonları ve firma hub'ı aynı kapsama alındı.
- Canlı hayvan ve et fiyatlarının ortak `CategoryPriceLanding` şablonu
  görünürleştirildi.
- Boş veri dönen hal detay dalı da normal hal detayıyla aynı görünür/schema
  breadcrumb kaynağını kullanıyor.
- Noindex veya sitemap dışı ilan/sosyal/yazar şablonları bu commitin kapsamına
  alınmadı; indekslenebilir şablon denetimiyle karıştırılmadı.
- `8a44624e test(seo): verify breadcrumb content parity` ile görünür navigation
  ve JSON-LD sırası/adları/URL'leri ortak test altında doğrulandı.

### 3.38 Dinamik Canonical, Hreflang ve Open Graph URL Tutarlılığı

Commitler:

- `1a3027f5 fix(seo): add hreflang to dynamic content`
- `0f900081 fix(seo): align open graph urls with canonicals`

Yapılanlar:

- İndekslenebilir analiz ve yazar detay şablonları yalnız canonical üretmek
  yerine ortak locale alternates yardımcısına geçirildi.
- Dinamik URL'ler artık prefixsiz Türkçe canonical ile `tr` ve `x-default`
  hreflang değerlerini aynı kaynaktan üretiyor.
- Noindex ilan detayı hreflang kapsamına alınmadı.
- Ortak `getPageMetadata` akışında Open Graph `url`, sayfanın canonical
  değerinden türetiliyor; statik/hub sayfalarında `og:url` boşluğu kapatıldı.
- Dinamik yol alternates ve `og:url === canonical` eşitliği otomatik testlere
  eklendi.

### 3.39 Tamamlanmış Yıllık Raporların Keşfi ve Index Politikası

Commit: `32feeed0 fix(seo): publish completed annual reports`

- Backend'e fiyat geçmişindeki gerçek `YEAR(recorded_date)` değerlerini,
  satır sayısını ve yılın min/max tarihini döndüren
  `/reports/annual/years` endpoint'i eklendi.
- Envanter yalnız veri içeren ve tamamlanmış yılları döndürüyor; devam eden
  2026 yılı “yıllık rapor” olarak yayımlanmıyor.
- Sitemap yalnız endpoint'in doğruladığı yıllık rapor URL'lerini gerçek en yeni
  kayıt tarihiyle ekliyor.
- Analiz hub'ı aynı envanterden yıllık raporlara görünür iç link veriyor; orphan
  durumu giderildi.
- Yıllık rapor metadata'sı veri bulunmayan, backend'den yüklenemeyen veya henüz
  tamamlanmamış yıl için `noindex,follow` üretiyor.
- Analiz girişindeki sabit `28+` hal iddiası canlı `activeMarkets` veya nötr
  fallback ile değiştirildi.

### 3.40 Yayımlanmış Yazar Profillerinin Sitemap Kapsamı

Commit: `0d70eb33 fix(seo): include published authors in sitemap`

- Frontend API katmanına aktif public yazar envanteri eklendi.
- Sitemap, aktif bütün yazarları körlemesine yayımlamıyor; yalnız statik veya
  otomatik yayımlanmış analizlerde `authorProfile.slug` ile gerçekten referans
  verilen ve public envanterde bulunan profilleri ekliyor.
- Profil `lastModified` değeri ilgili yazarın en yeni yayımlanmış makale
  tarihinden türetiliyor.
- Yazar profil breadcrumb'ı görünür hale getirildi; schema ile kullanıcıya
  gösterilen sayfa yolu eşlendi.
- Backend erişilemezse yazar listesi boş fallback döndürüyor; doğrulanamayan
  profil sitemap'e eklenmiyor.

### 3.41 “Anlık/Günlük” ve Sabit Kaynak İddialarının Temizlenmesi

Commit: `ccb21d00 fix(content): remove stale realtime data claims`

- Locale layout description, Open Graph ve Twitter fallback'lerindeki “anlık”
  iddiası “tarihli hal fiyatları” diline geçirildi.
- Masaüstü ve mobil hero “canlı/anlık” yerine kayıt tarihi belli veri akışını
  anlatıyor; “Günlük Fiyat Verileri” etiketi “Tarihli Fiyat Verileri” oldu.
- Ana sayfa son veri tarihi yokken “Bugün” uydurmak yerine “Bilinmiyor”
  gösteriyor.
- Ana sayfa Dataset yöntem açıklaması, LLMS Full ve basın kiti güncelleme dili
  kaynakların yayın takvimine bağlandı.
- Hakkımızda metadata, değer kartları ve fallback uzun metindeki `2025'ten bu
  yana`, “her sabah”, “insan müdahalesi gerektirmez”, “tüm hal verileri” ve
  “anlık” kesinlikleri kaldırıldı.
- Yıllık rapor metodoloji notundaki sabit `30+ resmi belediye hal API'si`
  iddiası, rapor kapsamı ve metodoloji sayfasına atıfla değiştirildi.

### 3.42 Ürün Fiyatlarında Product/Offer Semantiğinin Kaldırılması

Commit: `4556608c fix(schema): model product prices as dataset only`

- `/urun/[slug]` üzerindeki hal, borsa ve resmi alım fiyatlarını satın alınabilir
  teklif gibi yayımlayan `Product/AggregateOffer` JSON-LD kaldırıldı.
- Aynı sayfadaki zengin `Dataset` korunarak ürün adı, görseli ve kategorisi
  `Dataset.about` altında `Thing` olarak tanımlandı.
- Görünür cevap bloğundaki min/ortalama/maks ve hal örneklemi hesapları
  korunuyor; yalnız yanlış satış teklifi semantiği kaldırıldı.
- Gerçek satın alınabilir Pro aboneliği ile gerçek kullanıcı ilanlarındaki
  `Product/Offer` schema'larına dokunulmadı.

### 3.43 Liste Schema Türü ve URL Tutarlılığı

Commit: `2d497832 fix(schema): align list types and canonical urls`

- Analiz hub'ındaki `numberOfItems` ve `itemListElement` taşıyan nesne yanlışlıkla
  `Dataset` olarak yayımlanıyordu; gerçek semantik türü olan `ItemList` yapıldı.
- Firma şehir, tür ve şehir+tür ItemList schema'larındaki sayfa/firma URL'leri
  relative path yerine `NEXT_PUBLIC_SITE_URL` tabanlı mutlak canonical URL'lere
  geçirildi.
- Görünür analiz/firma listelerine ve navigasyona dokunulmadı; yalnız
  makine-okunur tür ve URL kimliği düzeltildi.

### 3.44 JSON-LD Script Bağlamı Güvenliği

Commit: `abf83083 fix(schema): safely serialize json-ld`

- Ortak `JsonLd` emitter'ına HTML script bağlamına uygun serializer eklendi.
  `<`, `>`, `&`, U+2028 ve U+2029 karakterleri JSON'un anlamını değiştirmeden
  Unicode escape biçiminde yayımlanıyor.
- Böylece ürün adı veya API/CMS metni `</script>` içerdiğinde JSON-LD script
  etiketini erken kapatamıyor ve ardından HTML/JavaScript enjekte edemiyor.
- Fiyatlar sayfasındaki elle yazılmış DataCatalog ve FAQPage ile ürün
  sayfasındaki dinamik FAQPage scriptleri ortak güvenli emitter'a taşındı.
- Kötücül script-kapanış girdisinin serialize edilmesi, JSON ile geri
  okunabilmesi ve tek geçerli schema scripti üretilmesi iki testle kapsandı.

### 3.45 Ana Aksiyon Checklist'i Durum Uzlaştırması

- Ana checklist'te uygulaması bitmiş olmasına rağmen boş duran H1, ürün/hal/
  analiz cevap blokları, Article kalitesi, breadcrumb kapsamı, Dataset
  zenginleştirme, fiyat schema semantiği, CSP rapor toplama ve RUM maddeleri
  ilgili commit kimlikleriyle tamamlandı olarak işaretlendi.
- Canlı SSR/Lighthouse, Schema.org/Rich Results, GSC/CrUX, DNS, staging ve
  gözlem süresi gerektiren kabul maddeleri açık bırakıldı. Böylece yerel kod
  tamamlanması canlı operasyon doğrulaması gibi gösterilmedi.

### 3.46 Kök Schema Çağrı Sözleşmesi

Commit: `23cf57e2 fix(schema): declare root entity types explicitly`

- Global public layout'taki Organization ve WebSite çağrıları tür bilgisini
  veri nesnesiyle örtük biçimde ezmek yerine `JsonLd` bileşenine açıkça veriyor.
- Yinelenen `@context`/`@type` alanları veri nesnelerinden kaldırıldı; tüm
  uygulamada JSON-LD script üretimi artık yalnız ortak güvenli emitter'dan
  geçiyor.
- Değişiklik sonrası typecheck, 14 dosya/38 test ve `git diff --check` geçti.

### 3.47 Otomatik Analiz Kaynağı ve İnceleme İddiası

Commit: `8610e751 fix(content): label automated reports truthfully`

- Public analiz API yanıtına rapor tablosundaki gerçek `source` (`auto` veya
  `manual`) alanı eklendi.
- Analiz sayfası artık `totalRecords` varlığından otomasyon sonucu çıkarmıyor;
  yalnız açıkça `source=auto` olan rapora otomatik üretim etiketi gösteriyor.
- Veri modelinde `reviewed_by`/`reviewed_at` kanıtı olmadığı için “insan
  editoryal kontrolünden geçirilmiştir” kesin iddiası kaldırıldı.
- Kaynak ayrımı otomatik, manuel ve eski/kaynaksız içerik senaryolarıyla test
  edildi.

### 3.48 İletişim Bilgilerinin Gerçek Ayarlara Bağlanması

Commit: `3fc97d80 fix(trust): use configured contact details`

- İletişim sayfası e-posta, telefon ve adresi mevcut `site_settings`
  kaynağından alıyor; boş telefon/adres görünür kart üretmiyor.
- Kodda doğrulanabilir kaynağı olmayan “Antalya Toptancı Hali” adresi ve sabit
  çalışma saatleri kaldırıldı.
- E-posta için mevcut kurumsal `iletisim@haldefiyat.com` güvenli fallback'i
  korundu; yapılandırılmış adresin harita bağlantısı adres sorgusundan üretiliyor.
- Sorumlu tüzel kişi/kurum bilgisi hâlâ sahiplik girdisi beklediği için checklist
  maddesi tamamen kapatılmadı.

### 3.49 Özel/İşlem Route'ları İndeks Politikası ve Kök JSON-LD

Commit: `6ca33051 fix(seo): noindex private action routes`

- Hesap dashboard layout'una merkezi `noindex,nofollow` metadata eklendi; dokuz
  hesap alt sayfası artık genel public metadata'yı miras alıp indekslenebilir
  görünmüyor.
- `/ilan-ver` ve kimlik doğrulaması isteyen `/firmalar/ekle` için özgün
  title/description/canonical ile `noindex,nofollow` politikası eklendi.
- Public layout'taki Organization/WebSite schema'ları güvensiz
  `@agro/shared-ui` emitter'ı yerine bu projede sertleştirilen ortak `JsonLd`
  emitter'ına geçirildi.
- Typecheck, 15 dosya/39 test ve `git diff --check` geçti.

### 3.50 Widget Route'ları İndeks Politikası

Commit: `edc43c6d fix(seo): noindex embeddable widgets`

- Fiyat, endeks ve hava iframe route'larını kapsayan widget layout'una merkezi
  `noindex,follow` politikası eklendi.
- Widget'ların kendi landing sayfalarıyla ince/parametreli kopya olarak rekabet
  etmesi engellenirken ana fiyat/endeks sayfalarına kaynak bağlantıları korundu.
- Fiyat widget'ındaki veri tarihi veya akış durumu kanıtlamayan “Canlı veri”
  rozeti nötr “Fiyat verisi” metnine çevrildi.

### 3.51 Master Checklist Tam Durum Uzlaştırması

- 65 checkbox'ın tamamı uygulama günlüğü ve commit dizisiyle yeniden
  karşılaştırıldı.
- Yerel kod/test/build veya dokümantasyon kanıtı olan 33 madde `[x]` olarak
  işaretlendi; kısmi maddeler “uygulama tamamlandı” ve “canlı kabul bekliyor”
  biçiminde ayrı satırlara bölündü.
- Kalan 32 madde açık bırakıldı: Orhan/DNS/kurumsal içerik/strateji 10,
  deploy-staging-canlı doğrulama 14, GSC/CrUX/KPI ölçümü 6, insan-inceleme veri
  modeli 1 ve eksik denetim URL/tarih girdisi 1.
- Böylece canlıya çıkmamış kod, dış validator sonucu veya 28 günlük ölçüm
  tamamlanmış gibi işaretlenmedi.

### 3.52 Otomatik Analizlerde Denetlenebilir İnsan İncelemesi

Commit: `c4897cba feat(trust): record analysis human reviews`

- `hf_analysis_reports` tablosuna `reviewed_by` ve `reviewed_at` alanlarını
  ekleyen 054 migration'ı ve Drizzle schema karşılığı eklendi.
- Admin publish ve schedule eylemleri kimliği doğrulanmış kullanıcı ile inceleme
  kaydı oluşturuyor; cron yalnız önceden planlanıp incelenmiş raporu yayımlıyor.
- Yayımlanmış otomatik raporun başlık, slug, özet, içerik, etiket veya yazarı
  değiştirilirse önceki inceleme geçersiz sayılıyor ve rapor taslağa dönüyor.
- Public API yalnız inceleme zamanını yayımlıyor; dahili kullanıcı kimliği
  public yanıta çıkmıyor. Görünür insan kontrolü iddiası yalnız geçerli
  `reviewedAt` olduğunda gösteriliyor.
- Eski yayımlanmış raporlar geriye dönük olarak incelenmiş varsayılmıyor.
  Otomatik/manuel/kaynaksız ve kanıtlı/kanıtsız durumlar test edildi.

### 3.53 Git Push, Migration ve Canlı Deploy

Canlı kaynak commit'i: `85dd633b`

- Çalışma ağacındaki iki GEO/SEO raporu, backlink notu, firma exportları ve
  Lighthouse JSON'u `85dd633b` ile commit edildi; 27 yerel commit `main`
  branch'ine push edildi.
- VPS'teki 609 untracked operasyonel dosyanın hiçbiri gelen 114 tracked yolla
  çakışmıyordu; `git clean` çalıştırılmadı ve upload/env yedekleri korunarak
  tracked kaynak `origin/main` commit'ine sabitlendi.
- `hf_analysis_reports` tablosu 14 kayıtla
  `/tmp/hal-db-backups/hf_analysis_reports-pre-geo-20260726T122500Z.sql.gz`
  dosyasına `--no-tablespaces --single-transaction` ile yedeklendi.
- 054 migration uygulandı; `reviewed_by varchar(36)` ve
  `reviewed_at datetime(3)` kolonları doğrulandı, 14 mevcut rapor korundu.
- Backend build sonrası `pm2 reload hal-backend --update-env`; frontend 65
  route build sonrası zorunlu `pm2 restart hal-frontend --update-env` ile
  yayımlandı. Admin değişmediği için build/restart edilmedi.
- Backend health DB dahil `ok`; backend/frontend/admin PM2 servisleri online ve
  unstable restart sayıları sıfır.
- Canlı smoke sonuçları:
  - `/`, `/fiyatlar`, `/urun/domates`, `/hal/izmir-hal`, `/analiz`,
    `/iletisim` ve dört şeffaflık route'u 200.
  - Ana sayfa, ürün, hal ve genel fiyat sayfalarında tek H1; cevap anchor'ları
    mevcut; örnek sayfalardaki JSON-LD bloklarının tamamı parse edildi.
  - `/ilan-ver` `noindex,nofollow`; widget `noindex,follow`; `/hesabim`
    `noindex,nofollow`.
  - Sitemap 345 URL, `/tr/` canonical varyantı sıfır; robots AI crawler
    allow kuralları, security.txt 200 ve CSP rapor endpoint'i 204.
  - HTTP, www, `/tr/fiyatlar` ve trailing-slash varyantları tek yönlendirmeyle
    canonical URL'ye gidiyor.
- Bu deploy anında Nginx CSP Report-Only başlığı henüz endpoint'e bağlı değildi;
  takip eden 3.54 çalışmasında raporlama bağlantısı ve enforce tamamlandı.

### 3.54 Nginx CSP Raporlama Bağlantısı ve Canlı Enforce

- Orhan'ın açık canlı erişim ve enforce onayıyla VPS Nginx yapılandırması
  değişiklik öncesi yedeklendi. `sites-enabled/haldefiyat` dosyasının symlink
  değil bağımsız kopya olduğu saptandı; hem aktif kopya hem
  `sites-available/haldefiyat` aynı snippet kullanımına geçirildi.
- `/etc/nginx/snippets/haldefiyat-csp.conf` içinde modern
  `Reporting-Endpoints` ile geriye uyumlu `report-uri`, mevcut
  `/api/v1/csp-reports` endpoint'ine bağlandı.
- Eski `Content-Security-Policy-Report-Only` kaldırıldı ve
  `Content-Security-Policy` enforce açıldı. GTM/GA/Ads, Google,
  OneSignal, Tarımİklim hava widget'ı, Sentry, YouTube ve mevcut embed
  akışları için gözlenen origin'ler allowlist'e alındı.
- `nginx -t` geçti ve servis reload edildi. Sunucudaki diğer sitelere ait,
  önceden var olan çakışan server-name uyarıları bu değişiklikten bağımsızdır.
- Public ve localhost/Host yanıtlarında tek enforce CSP ile
  `Reporting-Endpoints` görüldü; eski Report-Only başlığı artık dönmüyor.
- Headless Chrome ile `/`, `/giris`, `/uyarilar`, `/embed` ve
  `/hava/widget?location=antalya` tarandı: tamamı 200, DOM üretimi başarılı,
  CSP engeli ve Report-Only konsol mesajı sıfır.
- CSP endpoint sentetik canlı rapora 204 verdi; backend DB health `ok`,
  Nginx aktif, `hal-backend`, `hal-frontend` ve `hal-admin` online kaldı.
- 7–14 günlük pasif gözlem beklenmeden enforce açılması kullanıcının açık
  kararıdır. İlk çok-rotalı tarama temizdir; gerçek trafik raporları izlenmeye
  devam etmeli, `unsafe-inline`/`unsafe-eval` kaldırma ise ayrı sıkılaştırma
  çalışması olarak korunmalıdır.

## 4. Doğrulama Kayıtları

Bu oturumda çalıştırılan kontroller:

- Frontend `bunx tsc --noEmit`: geçti.
- Backend `bunx tsc --noEmit`: geçti.
- Frontend `bun run test`: 15 dosya, 40 test geçti.
- Backend `bun run test`: 2 dosya, 11 test geçti.
- Frontend `bun run build`: geçti; son durumda 65 route üretildi.
- Backend `bun run build`: geçti.
- `git diff --check`: değişiklik paketlerinde geçti.
- Canlı public URL örneklerinde status/canonical/noindex kontrolü yapıldı.
- PDF v1 ve v2 metin bazlı diff ile karşılaştırıldı.

Bilinen build uyarısı:

- Yerel backend `127.0.0.1:8091` kapalıyken statik sayfa üretiminde API fetch
  `ECONNREFUSED` logları oluşuyor.
- Fetch yardımcıları fallback döndürdüğü için build başarıyla tamamlanıyor.
- Bu hata yapılan GEO/SEO kodundan kaynaklanmıyor; yine de CI/build ortamında backend
  bağımlılığı ayrıca iyileştirilebilir.

## 5. Sorunlar

### S-01 — GÖREV 2 sorgu haritası — Çözüldü

- GSC sorgu kümeleri brief'e eklendi.
- Ürün, hal ve genel şablonlar belirtilen sırayla uygulandı.
- Firma/komisyoncu şablonlarına, güçlü mevcut performansı korumak için dokunulmadı.

### S-02 — GÖREV 3 gerçek LCP teşhisi — Çözüldü

- Gerçek LCP elementinin hero metni olduğu ve ana yükün Google tag zincirinden
  geldiği brief'e eklendi.
- Görsel preload eklenmedi; tag zinciri idle/etkileşim sonrasına alındı.
- Nihai field p75 sonucu yalnız deploy sonrası 28 günlük RUM/CrUX ile kanıtlanabilir.

### S-03 — CSP header repo dışında — Çözüldü

- Nginx config repo dışında kaldığı için canlı VPS üzerinde yedekli değiştirildi.
- `Reporting-Endpoints` ve `report-uri` endpoint'e bağlandı; Report-Only
  kaldırılıp enforce açıldı.
- Aktif `sites-enabled` dosyasının bağımsız kopya olması nedeniyle iki Nginx
  config kopyası eşitlendi. Canlı header ve headless Chrome kanıtı 3.54'tedir.

### S-04 — Şeffaflık sayfalarının nihai içeriği yok

- Route/CMS/footer/sitemap iskeleti hazır.
- Nihai editoryal, düzeltme, veri kaynağı ve sahiplik/finansman metinleri verilmedi.
- İletişim sayfasında `iletisim@haldefiyat.com` kurumsal e-postası mevcut; brief'in
  istediği “sorumlu kurum” bilgisi ise sahiplik girdisi olmadığı için eklenmedi.
- CMS içeriği yoksa sayfa “yakında güncellenecektir” fallback'i gösterir.
- İnce içerik olarak uzun süre canlı bırakılmamalıdır.

### S-05 — Yerel build backend bağımlılığı

- Build sırasında bazı route'lar yerel backend'e erişmeye çalışıyor.
- Backend kapalıysa gürültülü `ECONNREFUSED` logları oluşuyor.
- Build başarısız değil; fakat gerçek içerikle prerender doğrulamasını zorlaştırıyor.

### S-06 — Product/Offer semantik kararı — Çözüldü

- Brief yeni fiyat verisini `Product/Offer` yapmayı yasaklıyor.
- Hal ve borsa gözlemlerini satış teklifi gibi sunan mevcut
  `Product/AggregateOffer` kaldırıldı; Dataset korundu.
- Gerçek abonelik ve ilan teklifleri semantik olarak ayrı tutuldu.
- Deploy sonrası GSC Product snippet görünürlüğündeki değişim izlenmelidir.

### S-07 — Canonical locale tutarsızlığı — Çözüldü

- Canlı kontrolde `/borsa`, `/canli-hayvan-fiyatlari`, `/et-fiyatlari` sayfaları
  `/tr/...` canonical döndürüyor.
- Diğer varsayılan Türkçe sayfalar prefixsiz canonical kullanıyor.
- Kök neden üç sayfadaki manuel `/${locale}/...` canonical üretimiydi.
- `ab012981` ile ortak as-needed locale politikasına geçirildi; sitemap de prefixsiz
  URL'lere döndürüldü.
- Canlı deploy sonrası canonical ve 308 davranışı yeniden doğrulanmalıdır.

### S-08 — RUM event teslimi canlı doğrulanmadı

- Kod `dataLayer` event'i üretiyor.
- GTM container içinde `web_vitals` trigger/tag eşlemesi kontrol edilmedi.
- Kodun varlığı, GA4 raporuna event düştüğünü tek başına kanıtlamaz.

### S-09 — Yıllık rapor ve metodoloji gerçek yayın tarihi bilinmiyor

- Yıllık raporda gerçek veri son tarihi `dateModified` olarak bulunuyor.
- Raporun ilk yayın anını gösteren kalıcı `publishedAt` alanı backend modelinde yok.
- Metodoloji sayfasında da gerçek yayın/değişiklik tarihi kaynağı yok.
- Brief'in yasakladığı yapay tarih üretimi yapılmadı; gerçek CMS/DB tarihleri
  sağlanana kadar `datePublished` eklenmedi.

### S-10 — CSP nonce/hash geçişi için runtime engeller — Enforce çözüldü, sıkılaştırma açık

- `Analytics.tsx` içinde Consent Mode, GTM, GA4 ve Ads için dört inline script var.
- Next.js runtime inline bootstrap scriptleri request bazlı nonce gerektiriyor.
- JSON-LD scriptleri de `script-src` kapsamındadır.
- `BannerSlot`, CMS'den değişken ham reklam HTML'i render edebiliyor; sabit hash
  yaklaşımı bu içerik için uygun değil.
- GTM custom HTML tag envanteri repo dışındaki GTM workspace'ten çıkarılmalıdır.
- OneSignal SDK origin'i allowlist içinde korunmalıdır.

Enforce 3.54'te açık kullanıcı onayıyla tamamlandı. Kalan sıkılaştırma sırası:

1. Gerçek trafik CSP raporları izlenir.
2. GTM custom HTML ve CMS banner kodları envanterlenir.
3. Ham banner HTML'i tanımlı reklam sağlayıcı bileşenlerine dönüştürülür.
4. Request bazlı nonce staging'de Next scriptleri ve JSON-LD ile doğrulanır.
5. Production build'de önce `unsafe-eval`, sonra uygun olduğunda
   `unsafe-inline` kaldırılır.

### S-11 — Yerel standalone smoke test redirect döngüsü

- Production standalone sunucu yerelde `127.0.0.1:3133` üzerinde başladı.
- Proxy `/` isteğini dahili `/tr` yoluna rewrite ederken aynı yanıtta tekrar `/`
  konumuna 308 döndürüyor; `curl -L` 50 yönlendirmede duruyor.
- Bu nedenle yeni answer anchor'larının gerçek backend verisiyle yerel SSR curl
  kontrolü tamamlanamadı.
- TypeScript, test ve production build temizdir; canlı deploy sonrası URL bazlı
  SSR/canonical kontrolü zorunlu kalır.

### S-12 — Keyword density aracı tablo içeriğini editoryal içerikle birleştiriyor

- YourSeoBoard ekranındaki 72 adet “Serik” ve “hali” tekrarı, fiyat tablosundaki
  aynı hal/şehir hücre sayısıyla uyumludur.
- Bu sayı hedef kelimenin doğal metinde yetersizliğini tek başına kanıtlamaz;
  şablon tekrarı sayfa içi dağılımı bozuyordu.
- Yapay kelime tekrarı eklemek yerine değişmeyen tablo bağlamı tekilleştirildi.

### S-13 — Analizlerde insan incelemesi kayıt altına alınmıyor — Çözüldü

- Otomatik raporlar taslak üretiliyor ve admin yayın/planlama uçları üzerinden
  yayımlanıyor; ancak `hf_analysis_reports` tablosunda inceleyen kişi ve
  inceleme zamanı alanları yok.
- Bu nedenle yayımlanmış olmak, tek başına insan incelemesinin denetlenebilir
  kanıtı değildir. Görünür “insan kontrolü” iddiası şimdilik kaldırıldı.
- `c4897cba` ile `reviewed_by`, `reviewed_at`, publish/schedule kaydı, değişiklik
  sonrası inceleme geçersizleştirme ve public provenance çıktısı eklendi.
- 054 migration deploy sırasında backend'den önce uygulanmalıdır.

## 6. Açık Sorular

### Q-01 — Hedef sorgu–sayfa haritası — Yanıtlandı

- Brief'in 2026-07-26 ekinde ürün, hal, firma ve genel sorgu kümeleri sağlandı.

### Q-02 — LCP teşhisi — Yanıtlandı

- LCP'nin hero metni olduğu, field p75'in 3,08 saniye olduğu ve ana fırsatın
  326 KiB Google tag zinciri olduğu brief'e eklendi.
- Deploy sonrası 28 günlük p75 hâlâ kabul kanıtı olarak bekleniyor.

### Q-03 — Şeffaflık metinleri

Orhan'dan beklenen:

- Platformun hukuki/kurumsal sahibi kim?
- Finansman modeli nasıl açıklanacak?
- Editoryal son onayı kim veriyor?
- Düzeltme talepleri hangi e-postaya gönderilecek?
- Düzeltme SLA'i var mı?
- Otomatik raporların insan kontrol süreci gerçekte her raporda uygulanıyor mu?

### Q-04 — CSP rapor saklama

- PM2 logu yeterli mi?
- DB tablosu veya Sentry entegrasyonu isteniyor mu?
- Saklama süresi ne olmalı?
- Raporlarda olası URL query/PII nasıl maskelenmeli?

### Q-05 — Deploy kapsamı

- Bu dosyadaki yerel commit dizisi birlikte mi deploy edilecek?
- Önce staging/ayrı branch kabulü yapılacak mı?
- Canlı deploy sonrası Claude hangi URL örneklerini doğrulayacak?

### Q-06 — YourSeoBoard denetim hedefi

- Ekran görüntüsündeki tam URL ve tarama tarihi görünmüyor.
- Kelime örüntüsü `/hal/antalya-hal-serik` olarak yorumlandı.
- Çapraz kontrolde gerçek URL ve aracın hedef anahtar kelime ayarı teyit edilmeli.

## 7. Bulgular

### F-01 — Yeni PDF v2 belirgin biçimde daha güvenilir

- Metadata doldurulmuş.
- Letter → A4 düzeltilmiş.
- İçindekiler eklenmiş.
- Boş 30/60/90 sayfası doldurulmuş.
- Article/Breadcrumb eksik iddiası geri çekilmiş.
- CSS minify yanlış alarmı geri çekilmiş.
- CSP Report-Only doğru tanımlanmış.
- Google-Extended açıklaması düzeltilmiş.
- Lighthouse lab/field ayrımı eklenmiş.
- Skor 74 → 75 olarak revize edilmiş.

### F-02 — V2 raporda kalan metodoloji açığı

- Platform skorları hâlâ kalibre edilmemiş tahmin.
- Citability yalnız ana sayfada ölçülmüş.
- LCP tek koşu lab ölçümü.
- Marka otoritesi için backlink/mention baseline henüz yok.

### F-03 — Canlı API docs noindex

- `/api-docs` 200 fakat `noindex, follow`.
- Bu nedenle sitemap'ten çıkarıldı.

### F-04 — CSP tamamen eksik değil

- Canlıda Report-Only policy var.
- Eksik olan enforce ve rapor toplama/gözlem süreci.

### F-05 — ETL sağlık

- Genel ETL akışı çalışıyor.
- Kocaeli, Mersin ve Çanakkale uzun süreli kesinti.
- Mersin güncel hata: HTTP 403.
- Bazı kaynaklarda ayrıca donmuş seri işaretleri var; bu çalışma kapsamına alınmadı.

### F-06 — Dataset zaman aralığı ters ve açık uçlu yazılıyordu

- Ürün ve hal sayfalarında `temporalCoverage`, en yeni kayıttan geleceğe doğru
  açık aralık olarak üretiliyordu.
- Bu gösterim geçmiş veri kapsamını ifade etmiyor ve veri setinin gelecekteki
  tarihleri kapsadığı izlenimini veriyordu.
- Ana hub sayfalarında ayrıca gerçek DB başlangıç tarihi yerine sabit `2025/..`
  kullanılıyordu.

### F-07 — Canlı fiyat sayfası veri tazeliğini sunucu saatinden üretiyordu

- Sayfada “Bugün güncellendi” ve “Son veri” metinleri gerçek fiyat kaydından
  bağımsız olarak her render'da güncel görünüyordu.
- ETL kaynağı durmuş olsa bile kullanıcıya taze veri izlenimi verebilirdi.
- Görünür tarih artık `/prices/overview` içindeki gerçek son kayıt tarihidir.

### F-08 — Hal sitemap `lastmod` fiyat tarihi değildi

- `/prices/markets` içindeki `updatedAt`, hal master kaydının düzenleme tarihidir.
- Sitemap bunu hal sayfasındaki fiyat içeriğinin değişiklik tarihi gibi kullanıyordu.
- Hal bazlı fiyat üst sınırı mevcut endpoint'te olmadığı için yanlış `lastmod`
  kaldırıldı ve ayrı geliştirme gereksinimi olarak bırakıldı.

### F-09 — News sitemap gelecek tarihleri kabul ediyordu

- Önceki kontrol yalnız `şimdi - yayın <= 48 saat` koşulunu kullanıyordu.
- Gelecek bir yayın tarihi negatif fark ürettiği için koşulu geçiyordu.
- Gelecek takvim günü ve geçersiz takvim tarihi kontrolleri eklendi.

### F-10 — Yıllık rapor Article görsel seti eksikti

- Analiz NewsArticle şablonu üç oran kullanırken yıllık rapor yalnız genel
  `og-default.png` görselini kullanıyordu.
- Yıllık rapora özel üç oranlı dinamik görsel endpoint'i eklendi.

### F-11 — OG görselleri veri yokken güncel tarih iddia ediyordu

- Ürün OG görseli gerçek son veri tarihinden bağımsız olarak sunucu gününü basıyordu.
- Analiz OG endpoint'i rapor alınamazsa sunucu gününü yayın tarihi gibi gösteriyordu.
- Tarih artık yalnız doğrulanmış kaynak kaydı varsa gösteriliyor.

### F-12 — CSP log URL'leri query verisi taşıyordu

- `documentURL`, `blockedURL` ve `sourceFile` query içinde kullanıcı veya kampanya
  verisi taşıyabilir.
- HTTP(S) URL query ve fragment bölümleri log öncesinde kaldırılıyor.
- `inline` ve `data` gibi CSP tanımlayıcıları korunuyor.

### F-13 — Security.txt mevcut değildi

- `/.well-known/security.txt` route veya statik dosyası yoktu.
- Kurumsal güvenlik bildirim kanalı artık mevcut site settings e-postasından
  dinamik ve RFC biçiminde yayınlanıyor.

### F-14 — Sitemap URL'leri proxy tarafından redirect ediliyordu

- Üç sitemap URL'si `/tr/...` biçimindeydi.
- Proxy varsayılan Türkçe locale prefix'ini kaldırdığı için bu URL'ler 308 ile
  prefixsiz karşılıklarına yönleniyordu.
- Canonical'ın kök nedeni düzeltilip sitemap doğrudan 200 hedeflere çevrildi.

### F-15 — Boş hal mesajı ETL durumunu yanlış kesinlikle bildiriyordu

- Sayfa, fiyat yoksa kaynağın çalıştığını varsayıyordu.
- Operasyonel sağlık kaydı üç kaynakta bunun tersinin mümkün olduğunu gösteriyor.
- Mesaj artık gözlenen sonuç ile olası nedenleri birbirinden ayırıyor.

### F-16 — Soft-404/index politikası yalnız veri varlığına bağlı değil

- Ürün ve hal sayfaları `seoIndex` ile özgün editoryel içerik birlikte yoksa
  `noindex` oluyor.
- Hiç fiyatı olmayan fakat özgün içerik taşıyan hal sayfası otomatik 404 yapılmıyor;
  hava, firma, ilan ve kaynak açıklaması gibi ek değerler korunuyor.
- Tam crawl/GSC verisi olmadan boş fiyat tablosu nedeniyle toplu 404/410 uygulanmadı.

### F-17 — LLMS dosyası geçersiz ürün ve OpenAPI yolları yayımlıyordu

- `/api/v1/products` public backend route'u yoktu.
- `/openapi.json` repo ve Fastify Swagger config'inde tanımlı değildi.
- Gerçek yollar sırasıyla `/api/v1/prices/products` ve `/api/docs/json`.

### F-18 — Robots politikası LLMS yönlendirmesiyle çelişiyordu

- LLMS ajanları JSON API'ye yönlendiriyordu.
- Aynı ajan user-agent grubu `/api/` altında tamamen engelleniyordu.
- Yalnız belgelenmiş okuma yüzeyleri açılarak çelişki giderildi.

### F-19 — Makine-okunur kapsam sayıları hardcode edilmişti

- Ürün, kaynak ve veri başlangıç bilgileri gerçek DB kapsamından bağımsızdı.
- ETL/kapsam değişimlerinde AI ajanlarına bayat bilgi sunma riski vardı.
- Kapsam metinleri artık API verisinden, hatada ise nötr fallback'ten geliyor.

### F-20 — Mevcut ürün fiyat hesapları citability için yeniden kullanılabilirdi

- Product schema, görünür perakende kıyası ve güncel tablo için baskın birim,
  min–maks, ortalama ve hal sayısı zaten tek akışta hesaplanıyordu.
- AnswerBlock bu değerleri yeniden hesaplamadan kullandığı için görünür metin ile
  schema ayrışma riski azaltıldı.

### F-21 — Hal “güncel liste” satırları aynı tarihte olmak zorunda değildi

- API varsayılanı her ürün–hal çifti için kendi en yeni satırını döndürüyor.
- Bu kümenin tamamını “bugünkü ürün sayısı” saymak durmuş ürünleri de kapsayabilirdi.
- Cevap bloğunda yalnız hal veri setinin gerçek en yeni tarihindeki satırlar sayıldı.

### F-22 — Google tag `lazyOnload` LCP sonrası garantisi vermiyordu

- `lazyOnload`, pencere yüklemesinden sonra üçüncü taraf zinciri hemen
  başlatabiliyordu.
- Yeni yükleyici ilk etkileşim veya `requestIdleCallback` ile başlıyor; conversion
  event'leri yükleme öncesinde kuyruklanabiliyor.

### F-23 — Font ağırlıkları ayrı dosya yükü oluşturmuyordu

- Outfit 300–900 tanımları iki değişken font dosyasını ortak kullanıyor.
- Hero metninde `swap` ve preload zaten mevcut; teşhise aykırı görsel preload
  veya yinelenen font preload eklenmedi.

### F-24 — “Düşük yoğunluk” uyarısının kökü az içerik değil, tekrar dağılımıydı

- Hal detay şablonu market ve şehir adını her ürün satırında yeniden yazıyordu.
- Ürün detay şablonu da ürün adını her hal satırında yeniden yazıyordu.
- Serik örneğinde 72 tekrar, aracın en yaygın iki/üç kelimeli ifade tablolarını
  tamamen aynı hal adına ayırmasına neden olmuş görünüyor.
- Hedef ifade metadata, H1 ve editoryal içerikte zaten vardı; doğru müdahale
  metni şişirmek değil, tablodaki sabit bağlamı tekilleştirmekti.

### F-25 — Makine ve insan yüzeylerinde aynı bayat kapsam iddiaları kalmıştı

- LLMS kapsamı daha önce canlılaştırılmış olsa da görünür SSS, fiyatlar,
  hakkımızda, metodoloji, ürün ve hal içeriklerinde `16`, `250+` ve `06:15`
  sabitleri yaşamaya devam ediyordu.
- Antalya kaynaklarının öğleden sonra yayın takvimi ve uzun süre durmuş ETL
  kaynakları tek saat/tazelik iddiasını yanlış yapıyordu.
- Görünür içerik, FAQ schema, metadata ve LLMS artık aynı veri gerçeğini anlatıyor.

### F-26 — Endeks schema gerçek kayıtları kullanırken sabit tarih yayımlıyordu

- Endeks sayfasında haftalık `weekStart`/`weekEnd` kayıtları zaten mevcuttu.
- Buna rağmen Dataset ve katalog kaydı açık uçlu `2025/..` kullanıyordu.
- Gerçek geçmiş penceresi schema tarih kaynağına dönüştürüldü.

### F-27 — Canlı fiyat landing ve manifest eski kapsamı yayımlamaya devam ediyordu

- Site-geneli taramada `/canli-hal-fiyatlari` metadata, H1 ve KPI'larında `22+`,
  `250` ve `22` sabitleri bulundu.
- Aynı fallback'ler mobil ana sayfada, `22+` ifadesi ise web manifest
  açıklamasında da bulunuyordu.
- Bu yüzeyler overview/gerçek koleksiyon sayıları veya nötr fallback kullanacak
  şekilde hizalandı; taramada ilgili sabitlerin kalmadığı doğrulandı.

### F-28 — Karşılaştırma sayfasında breadcrumb yalnız görseldi

- `/karsilastirma` sitemap'te indekslenebilir olmasına ve görünür sayfa yolu
  taşımasına rağmen BreadcrumbList üretmiyordu.
- Yasal sayfalar ise ne görünür ne yapısal breadcrumb taşıyordu; şeffaflık
  sayfalarında schema vardı fakat görünür karşılığı yoktu.
- Ortak bileşene geçiş, görünür ad/sıra/link ile JSON-LD item'larının farklılaşma
  riskini kaldırdı.

### F-29 — BreadcrumbList kapsamı görünür breadcrumb kapsamından genişti

- Yüksek değerli ürün, hal ve fiyat şablonlarının çoğu ortak `Breadcrumb`
  bileşenini kullanıyor fakat `visible` varsayılanı kapalı olduğu için yalnız
  JSON-LD yayımlıyordu.
- Eksik yeni schema eklemek yerine var olan tek kaynak görünürleştirildi; böylece
  schema adı, sırası ve URL'si kullanıcıya gösterilen sayfa yoluyla aynı kaldı.
- Canlı doğrulamada mobil taşma, current-page accessibility ve ara link 200
  kontrolleri hâlâ yapılmalıdır.

### F-30 — Dinamik içerik alternates alanları ortak metadata akışını atlıyordu

- Statik sayfalar `getPageMetadata` ile canonical, `tr` ve `x-default` üretirken
  analiz/yazar detayları elle yalnız canonical tanımlıyordu.
- Ortak metadata yardımcısı canonical üretmesine rağmen bu URL'yi Open Graph
  metadata'sına taşımıyordu.
- Canonical, hreflang ve paylaşım URL'si aynı locale/path kaynağına bağlandı;
  canlıda `/tr/...` redirect varyantlarının prefixsiz canonical'a döndüğü ayrıca
  doğrulanmalıdır.

### F-31 — Yıllık rapor route'u orphan ve veri yokken indexlenebilirdi

- `/rapor/yillik/[year]` kaliteli Article/Dataset içeriği taşımasına rağmen
  sitemap veya analiz hub'ından keşfedilmiyordu.
- Geçerli yıl formatında veri bulunamazsa route 200 açıklama döndürüyor fakat
  metadata indexlenebilir kalıyordu; bu soft-404 riskiydi.
- Yıl aralığını tahmin etmek yerine veritabanı envanteri kullanıldı. Devam eden
  yıl tamamlanmış rapor sayılmadığı için sitemap/hub dışında ve noindex kalıyor.
- Canlı deploy sonrasında yıl envanteri endpoint'i, sitemap URL'leri ve örnek
  tamamlanmış yılın 200/self-canonical/indexable durumu birlikte doğrulanmalıdır.

### F-32 — Yazar profilleri iç linkli fakat sitemap dışında kalıyordu

- Analiz Article schema ve görünür byline yazar profil URL'si yayımlıyordu;
  profil route'u indexlenebilir olmasına rağmen sitemap üretimi yazarları
  kapsamıyordu.
- Yalnız aktif yazar listesini sitemap'e almak, henüz makalesi olmayan ince
  profilleri yayımlayabilirdi. Bu nedenle aktif envanter ile yayımlanmış makale
  referansı kesiştirildi.
- Canlı doğrulamada sitemap'teki her yazar URL'sinin 200, self-canonical ve
  en az bir yayımlanmış analiz bağlantısı taşıdığı kontrol edilmelidir.

### F-33 — Tazelik iddiası sayısal kapsamdan daha geniş bir yüzeye yayılmıştı

- Önceki kapsam taramaları ürün/hal/kaynak sayılarını düzeltmişti; fakat layout,
  hero, basın kiti, Hakkımızda fallback'i ve yıllık rapor metodolojisi hâlâ
  gerçek zamanlı veya tek ritimli veri akışı izlenimi veriyordu.
- En kritik hata, overview tarihi yokken ana sayfa istatistiğinin “Bugün”
  göstermesiydi.
- Görünür içerik, sosyal metadata, Dataset yöntemi ve LLMS güncelleme dili artık
  kaynak bazlı yayın takvimi ve tarihli kayıt modelinde birleşiyor.

### F-34 — Hal fiyatı gözlemleri satın alınabilir AggregateOffer değildi

- Ürün sayfası aynı değerleri hem doğru Dataset hem de `AggregateOffer` olarak
  yayımlıyordu.
- Hal satırları satıcı, stok, teslimat veya satın alma eylemi içeren perakende
  teklifler değil; kaynak ve tarihe bağlı referans fiyat gözlemleridir.
- Gerçek teklif schema'ları korunurken referans fiyatlar yalnız Dataset
  modelinde bırakıldı. Rich Results/GSC değişimi semantik düzeltmenin beklenen
  etkisi olarak ayrıca izlenmelidir.

### F-35 — Analiz listesi Dataset etiketiyle yayımlanıyordu

- Analiz hub schema nesnesinin adı `itemListSchema`, alanları da ItemList
  alanlarıydı; çağrıda `JsonLd type="Dataset"` seçilmişti.
- Firma ItemList öğeleri ise site genelindeki mutlak URL yaklaşımından farklı
  olarak relative URL kullanıyordu.
- Tür ve URL kimlikleri schema içeriğiyle hizalandı; canlı schema.org validator
  çıktısı analiz ve örnek firma hub URL'leri için arşivlenmelidir.

### F-36 — JSON.stringify tek başına güvenli JSON-LD HTML üretmiyordu

- React'in `dangerouslySetInnerHTML` alanına doğrudan `JSON.stringify` sonucu
  veriliyordu. JSON geçerli olsa da dinamik bir değerdeki `</script>` dizisi
  HTML ayrıştırıcısı tarafından script etiketi kapanışı olarak yorumlanabilirdi.
- Risk ortak emitter'da merkezi olarak kapatıldı; elle yazılmış dinamik FAQ
  scriptleri de bu güvenli yola alındı.
- Canlı doğrulamada örnek ürün ve fiyatlar sayfası kaynak kodundaki JSON-LD
  bloklarının Google Rich Results Test ve schema.org validator ile okunması
  ayrıca arşivlenmelidir.

### F-37 — Otomatik rapor etiketi yanlış sinyale ve kanıtsız iddiaya dayanıyordu

- Public DB raporlarının manuel olanlarında da `totalRecords` bulunduğundan,
  alan varlığı otomatik üretim kanıtı değildi.
- Public API gerçek kaynak alanını iletmiyordu; sayfa ayrıca kalıcı inceleme
  kaydı olmadan insan kontrolünü tamamlanmış gösteriyordu.
- Etiket artık yalnız veritabanındaki açık kaynak değerinden türetiliyor ve
  inceleme iddiası kanıt üretilecek iş akışına kadar yayımlanmıyor.

### F-38 — İletişim sayfası yapılandırılmamış adres ve saat yayımlıyordu

- Site ayarlarında iletişim alanları bulunmasına rağmen form bileşeni sabit bir
  Antalya adresi ve çalışma saatleri gösteriyordu.
- Bu değerlerin işletme kaydı veya CMS doğrulaması yoktu; E-E-A-T amacıyla
  eklenen bir yüzeyde yanlış kurumsal sinyal üretme riski taşıyordu.
- Sayfa artık yalnız yapılandırılmış telefon/adresi yayımlıyor; sahiplik ve
  sorumlu kurum bilgisi Orhan'ın nihai girdisine bağlı kalıyor.

### F-39 — Özel hesap ve içerik oluşturma route'ları noindex miras almıyordu

- Dashboard layout robots metadata yayımlamıyordu. Hesap sayfaları da tek tek
  metadata tanımlamadığından public kök metadata'sıyla taranabiliyordu.
- İlan ve firma oluşturma sayfaları arama niyeti taşıyan landing page değil,
  kullanıcı işlemi/form yüzeyidir; buna rağmen açık robots politikaları yoktu.
- Politika route grubunda merkezi, bağımsız iki işlem sayfasında açık metadata
  ile düzeltildi. Canlı deploy sonrası meta robots kontrolü gerekir.

### F-40 — Kök schema güvenli serializer'ı atlıyordu

- Proje içindeki JSON-LD kullanımları güvenli emitter'a bağlanmıştı; public
  layout ise farklı workspace bileşenini import ediyor ve doğrudan
  `JSON.stringify` kullanıyordu.
- Site adı, logo ve iletişim ayarları dinamik olduğundan kök Organization/
  WebSite scriptleri de aynı HTML script-context riskini taşıyordu.
- Layout proje içindeki testli güvenli emitter'a geçirildi; paylaşılan pakete
  diğer projeleri etkileyen kapsam dışı değişiklik yapılmadı.

### F-41 — Parametreli iframe widget'ları robots politikası taşımıyordu

- `/fiyatlar/widget`, `/endeks/widget` ve `/hava/widget` sitemap'te değildi ama
  meta robots politikaları da yoktu.
- Tema, ürün, kategori, limit, konum ve özel başlık parametreleri çok sayıda ince
  URL varyantı üretebilir; bunların indekslenmesi landing sayfalarına değer katmaz.
- Route grubu seviyesindeki `noindex,follow` tüm mevcut ve yeni widget'lar için
  politikayı tek noktadan uygular.

### F-42 — Yayın durumu insan incelemesinin denetlenebilir kanıtı değildi

- Admin veya cron tarafından `published` durumuna geçmek, incelemeyi kimin ne
  zaman yaptığını göstermiyordu; içerik sonradan değiştiğinde de önceki kontrol
  iddiasının geçerliliği izlenemiyordu.
- İnceleme artık ayrı alanlarla kaydediliyor ve otomatik içerikte editoryal
  değişiklik yapıldığında geçersizleştiriliyor.
- Eski kayıtlar için backfill yapılmadı; gerçek inceleme yapılmadan geçmiş
  raporlara yeni güven iddiası eklenmiyor.

### F-43 — Geçici ürün/hal API hatası 404 olarak maskelenebiliyor

- İlk sitemap crawl'ında yüksek eşzamanlılık altında 123 ürün/hal URL'si 404,
  üç yıllık rapor URL'si 500 ve 39 URL timeout verdi.
- `acur`, `ahududu`, `armut`, `domates`, `ayva` ve `bakla` düşük hacimli
  tekrarda 200 döndü; dolayısıyla ilk 404 kümesi kalıcı “kayıt yok” sonucu değil.
- Ürün route'u `fetchProducts()` hata halinde boş fallback döndürdüğü için
  geçici backend/timeout ile gerçekten bulunmayan slug'ı ayıramıyor ve
  `notFound()` çağırıyor. Bu davranış arama motoruna yanlış kalıcı 404 sinyali
  verme riski taşır.
- Tam crawl sonucu retry/backoff ve düşük eşzamanlılıkla yeniden doğrulanıyor.
  Kalıcı çözümde ürün/hal varlık sorgusu “bulunamadı” ile “upstream hata”
  durumlarını tipli sonuçla ayırmalı; upstream hatada 404 üretmemelidir.

### F-44 — Güncel Lighthouse a11y ve performans regresyonu

- 26 Temmuz canlı ana sayfa Lighthouse sonucu: performans 59, a11y 96,
  best-practices 79, SEO 100; lab LCP 11,1 sn ve LCP öğesi hero H1.
- LCP süresinin %94'ü render delay olarak raporlandı.
- Altı contrast kaybının dördü düşüş rozetindeki sınırda kalan kırmızı ton,
  ikisi tanımsız `--color-navy` token'ını kullanan CTA/cookie butonlarıydı.
- Ana sayfadaki üç bileşen tanımlı `--color-brand-fg` ve daha açık düşüş
  rengine geçirildi. Typecheck, 15 dosya/40 test ve 65-route build geçti.
- İlk deploy sonrası koşuda buton sorunları kapandı, kalan dört öğenin
  `PopularProductsCarousel` danger rozetleri olduğu belirlendi. Açık/koyu tema
  için `text-red-700`/`text-red-300` uygulanıp ikinci kez build/deploy edildi.
- Nihai canlı Lighthouse'ta accessibility 100, color-contrast 1.0 ve sorunlu
  öğe sayısı sıfır; SEO 100. Ara koşuda LCP 3,0 sn, nihai koşuda 10,9 sn
  ölçüldüğü için lab performansının oynaklığı ayrıca kayıtlıdır.
- Best-practices kayıpları OneSignal üçüncü taraf cookie/Inspector issue ile
  source map eksikliğidir. Dependency audit registry yanıtı 60 saniyeyi aştığı
  için tamamlanmış sayılmadı.
- Deploy sonrası Lighthouse tekrarında contrast kabulü ve LCP ayrıca
  doğrulanmalıdır; açık checklist maddesi o zamana kadar açık kalır.

### 3.55 Lighthouse Best Practices 100

Commit: `7a343b4a fix(perf): defer OneSignal outside push flows`

- OneSignal SDK ana sayfada koşulsuz yüklenmek yerine push alarm rotaları veya
  daha önce bildirim izni verilmiş tarayıcılarla sınırlandı.
- Ana sayfada SDK isteği/cookie/Inspector issue sıfırlandı; `/uyarilar`
  rotasında SDK yüklenmeye ve CSP hatası olmadan çalışmaya devam ediyor.
- Public repo ve client-only kapsam dikkate alınarak production browser source
  map açıldı.
- Canlı Lighthouse: Accessibility 100, Best Practices 100, SEO 100; başarısız
  Best Practices audit’i sıfır.
- Performance 63 ve lab LCP 10,5 sn olduğundan performans/CWV maddesi bu
  başarıyla karıştırılmadı ve açık kalmaya devam ediyor.
- Dependency registry audit’i ayrı açık satıra bölündü.

### 3.56 Production Dependency Audit

- `bun audit --production` 180 saniyede yanıt vermediği için frontend
  production manifesti izole npm lockfile ile registry advisory denetiminden
  geçirildi; ham JSON artefaktı saklandı.
- İlk denetimdeki doğrudan `next-intl` advisory'leri 4.13.4 güncellemesiyle
  kapatıldı.
- Sonuçta critical 0, high 3, moderate 2 kaydedildi. Kalanların tamamı Next.js
  16.2.3'ün `postcss`/`sharp` zincirinden geliyor; audit'in önerdiği Next 9.3.3
  downgrade'i uyumsuz ve güvenli bir düzeltme olmadığı için uygulanmadı.
- `postcss` yalnız güvenilir proje CSS'iyle build-time çalışıyor;
  `images.unoptimized: true` nedeniyle Next'in canlı image optimizer/`sharp`
  yüzeyi kullanılmıyor. Risk ve upstream izleme kararı ayrı kabul belgesinde.
- Typecheck, 15 dosyada 40 test ve production build temiz geçti.

Kanıt:
`docs/geo-seo/PRODUCTION-DEPENDENCY-AUDIT-2026-07-26.md`.

### 3.57 Redirect ve Soft-404 Canlı Matrisi

- HTTP ve `www` varyantları tek adımda HTTPS kök kanoniğine birleşti.
- Trailing slash ve varsayılan `/tr` locale varyantları tek adımda doğru
  kanoniğe ulaştı.
- Geçerli ürün slug'ındaki baş harf varyantı küçük harf kanoniğine yönlendi;
  tamamen büyük harf/geçersiz route örnekleri 404 ile kapandı.
- Olmayan genel, ürün ve hal URL ailelerinde 200 dönmedi; test örneklerinde
  soft-404 bulunmadı.
- F-43 nedeniyle tam envanter crawl'ı bu örneklem kabulüne dahil edilmedi ve
  ilgili tam crawl maddeleri açık bırakıldı.

Kanıt:
`docs/geo-seo/REDIRECT-SOFT404-KABULU-2026-07-26.md`.

### 3.58 Düşük Eşzamanlı Tam Sitemap Crawl ve Düzeltmeler

- F-43 tekrarını önlemek için crawler varsayılanı 6 işçiden 1 işçiye,
  azami işçi 12'den 4'e indirildi; varsayılan 500 ms istek aralığı eklendi.
- Canlı kabul 1 işçi ve 750 ms aralıkla 345 sitemap URL'sini taradı:
  339 HTTP 200, 6 HTTP 500, 34 noindex, 1 canonical farkı, 8 H1 sorunu,
  0 JSON-LD parse hatası.
- Altı 500 yanıtının tamamı 2020–2025 yıllık raporlardı. Backend'in
  `seasonalPeaks` cevabı `monthAvg/peakRatio` döndürürken frontend
  `peakAvg/ratio` bekliyordu; `undefined.toLocaleString()` hatası gerçek API
  sözleşmesine bağlanarak düzeltildi.
- Noindex kümesinin 28'i yalnız şablon içerikli ticaret borsası/ulusal kaynak
  sayfasıydı. Sayfa metadata politikası bunları noindex yaparken sitemap yalnız
  `seoIndex` bayrağına bakıyordu. Sitemap aynı özgün editoryal içerik koşuluna
  bağlandı.
- İki otomatik haftalık raporun CMS HTML'i sayfa şablonundaki H1'e ek ikinci
  H1 üretiyordu. CMS içeriğindeki H1'ler semantik sırayı koruyacak H2'ye
  dönüştürülüyor ve otomatik testle korunuyor.
- Crawl ayrıca bir redirect sitemap URL'si (`/urun/biber`) buldu. Sitemap artık
  aktif redirect envanterini backend'den alıp kaynak yollarını tüm URL
  ailelerinden çıkarıyor.
- İki duplicate title kümesi ve 47 orphan adayı ayrı düşük hacimli
  doğrulanacak; tam crawl maddesi henüz kapatılmadı.

Ham kanıt:
`artifacts/seo/live-crawl-safe-2026-07-26/report.json` ve `report.md`.

### 3.59 Nihai Sitemap Crawl Kabulü

- Düzeltmeler canlıya çıktıktan sonra 1 işçi ve 500 ms istek aralığıyla tüm
  güncel sitemap tekrar tarandı.
- 316/316 URL HTTP 200 döndü.
- Redirect/4xx/5xx, noindex, canonical farkı, eksik title, eksik description,
  H1 sayısı sorunu, JSON-LD parse hatası, duplicate title ve duplicate
  description: **0**.
- `roka-bag` ürününün anlamlı `(Bağ)` varyant niteleyicisi kısa
  `displayName` tarafından silinmediği için önceki duplicate başlık da kapandı.
- İç link grafiğinde azami derinlik 4, orphan adayı 50. Bu küme sitemap kabulünü
  bozmaz; orphan/anchor dağılımı birleşik açık maddesinde ayrıca işlenecek.
- Bu sonuçla sitemap HTTP/indexlenebilirlik/canonical dağılım maddesi kapandı;
  tamamlanan/açık sayaçları 47/66 ve 19/66 olarak güncellendi.

Kanıt:
`artifacts/seo/live-crawl-final-2026-07-26/report.json` ve `report.md`.

### 3.60 Orphan Kümesi İç Link Düzeltmesi

- Nihai sitemap kabulündeki 50 orphan adayı ailelere ayrıldı: 42 firma şehir/
  hizmet hub'ı, 3 eski analiz, 5 üst seviye public landing.
- Firma dizini sitemap ile aynı `total >= 5`, aktif hizmet türü ve üç şehirde
  en az 10 komisyoncu koşullarını kullanarak şehir/hizmet alt sayfalarına
  gerçek HTML navigasyon linkleri yayımlıyor.
- Analiz sayfası yalnız son sekiz otomatik raporu çekmek yerine arşiv
  envanterini alıyor; ilk 20 karttan eski kayıtlar ayrı görünür arşiv
  navigasyonunda bağlanıyor.
- `canli-hal-fiyatlari`, `canli-hayvan-fiyatlari`, `et-fiyatlari`, `embed` ve
  `basin` landing'leri ortak footer navigasyonuna eklendi.
- Değişiklikler tasarım içinde `details`/link dizini kullanır; gizli SEO metni
  veya anahtar kelime tekrarı eklemez.
- Canlı deploy sonrasında önceki rapordaki 50 orphan URL'nin tamamının ana
  sayfa, firma dizini veya analiz arşivi SSR HTML'inde gerçek `href` hedefi
  olduğu doğrulandı; eksik hedef 0.
- Anchor kayıtlı son crawl 316/316 HTTP 200, orphan 0 ve azami link derinliği
  3 sonucunu verdi. 22.738 anchor içinde 3.053 benzersiz metin bulundu; boş
  anchor 0 ve “tıkla/detay/devam/daha fazla/incele/link” genel anchor 0.
- Bu kanıtla birleşik orphan/link derinliği/anchor maddesi kapandı; sayaçlar
  48/66 tamamlanan ve 18/66 açık olarak güncellendi.

Kanıt:
`artifacts/seo/live-crawl-anchor-2026-07-26/report.json` ve `report.md`.

### 3.61 Metadata Uzunluğu, Canonical ve Hreflang Kabulü

- Önceki canlı crawl'daki gerçek SERP kesilme riski şablonlara ayrıldı:
  65 title 60 karakteri, 214 description 160 karakteri aşıyordu.
- Ortak metadata üretiminde boşlukları normalize eden, uygun olduğunda tam
  cümleyi; aksi halde kelime sınırını koruyan 60/160 karakter kısaltması
  uygulandı. Uzun sosyal paylaşım metinleri Open Graph alanlarında korunurken
  arama title/description değerleri sınırlandı.
- Analiz sayfalarının ve yazar profilinin kök title template'iyle ikinci marka
  eki üretmesi `title.absolute` ile engellendi.
- Yardımcı fonksiyon için cümle koruma, kelime sınırı ve değişmeden bırakma
  testleri eklendi; typecheck, testler ve production build geçti.
- `9a34270a` canlı sürümündeki düşük hızlı tam tarama 316/316 HTTP 200 verdi;
  eksik/duplicate title-description, H1, canonical, noindex, JSON-LD, orphan
  ve genel anchor hatalarının tamamı 0 kaldı.
- Hreflang matrisinde self, `tr`, `x-default`, sitemap dışı hedef ve reciprocal
  hata sayıları 0 çıktı.
- Tam taramada kalan tek 63 karakterlik yazar title'ı `9bb063e7` ile
  düzeltildi ve tekrar canlı ölçümde 50 karakter oldu. Böylece nihai title
  `>60` ve description `>160` sayısı 0.
- Bu kanıtla birleşik metadata/canonical/hreflang maddesi kapandı; sayaçlar
  49/66 tamamlanan ve 17/66 açık olarak güncellendi.

Kanıt:
`artifacts/seo/live-crawl-meta-final-2026-07-26/report.json`, `report.md` ve
`metadata-hreflang-acceptance.md`.

### 3.62 Tam İç Link HTTP ve Redirect Zinciri Kabulü

- 316 sitemap sayfasının SSR HTML'inden 2.642 benzersiz iç hedef çıkarıldı;
  179 API click/export hedefi canlı yan etki oluşturmamak için ayrı envanterlendi.
- İlk 2.463 HTML hedef kontrolünde 14 adet 4xx, 511 redirect ve 50 adet birden
  uzun zincir bulundu; 5xx ve ağ hatası yoktu.
- Fiyat tabloları ham ETL slug yerine API `canonicalProduct` hedefine bağlandı.
  Varyant karşılaştırmasındaki aynı master'a dönen alias linkler metne çevrildi.
- Widget, ticker, sezon rehberi, ürün ilişkileri ve pazar hareketleri ortak
  kanonik link politikasına geçirildi; varsayılan locale `/tr` linkleri kaldırıldı.
- Proxy backend timeout/5xx ile doğrulanmış katalog “bulunamadı” sonucunu ayıracak
  şekilde düzeltildi. Geçici backend cevapsızlığı artık hard 404 üretmiyor.
- Aktif `biber` ve `sarimsak` master redirectleriyle çelişen 51 çocuk canonical
  kaydı `055_redirected_master_canonical_alignment.sql` ile canlıda düzeltildi.
- Nihai sitemap crawl 316/316 HTTP 200; noindex/canonical/title/description/H1/
  JSON-LD/duplicate/orphan hataları 0 kaldı.
- Nihai SSR grafiği 1.959 benzersiz HTML hedef içeriyor. Önceki tam sonuçlar,
  GET yeniden doğrulama ve değişen kaynakların hedefli SSR kabulü birleştirildi:
  1.959/1.959 2xx; redirect, 4xx, 5xx, ağ hatası ve uzun zincir 0.
- Bu kanıtla iç link HTTP/redirect-chain maddesi kapandı; sayaçlar 50/66
  tamamlanan ve 16/66 açık olarak güncellendi.

Kanıt:
`artifacts/seo/internal-link-acceptance-2026-07-26.md`,
`artifacts/seo/internal-link-status-2026-07-26/report.json`,
`artifacts/seo/internal-link-get-acceptance-2026-07-26/report.json` ve
`artifacts/seo/live-crawl-internal-links-final-2026-07-26/report.json`.

### 3.63 E-posta Kabul İlerlemesi ve Şeffaflık İçeriklerinin Yayını

- Canlı Resend SMTP ayarlarıyla yönetici Gmail adresine benzersiz kimlik
  doğrulama iletisi gönderildi: `accepted=1`, `rejected=0`; Message-ID
  `<40b5618c-176a-3c08-ba8f-bd2efbff881f@haldefiyat.com>`.
- DNS yeniden ölçüldü: `send` SPF/MX ve `resend._domainkey` DKIM kaydı mevcut;
  DMARC hâlâ `v=DMARC1; p=none;` ve `rua` yok. Gmail ham
  `Authentication-Results` başlığı ve kontrollü DMARC rapor adresi olmadan bu
  iki kabul maddesi açık bırakıldı.
- Canlıda dört şeffaflık sayfasının 200 olmasına rağmen yalnız “Bu sayfa yakında
  güncellenecektir.” gösterdiği doğrulandı.
- `056_transparency_policy_content.sql` ile editoryal politika, düzeltme
  politikası, veri kaynağı politikası ve sahiplik/finansman metinleri CMS'te
  published olarak oluşturuldu.
- İletişim sayfasına “Sorumlu yayıncı: HalDeFiyat” açıklaması ve üç politika
  bağlantısı eklendi. Kişisel isim veya adres uydurulmadı; mevcut kurumsal
  e-posta ve telefon ayarları korundu.
- Yerel frontend testleri 48/48 ve production build geçti. Canlı migration
  sonrasında dört API kaydının içerik uzunluğu ve published durumu doğrulandı.
- Canlı frontend build'in ilk denemesi eski nested standalone dizininde
  `ENOTEMPTY` ile durmuş, PM2 sürecine dokunmamıştı. Eski standalone çıktı
  `/tmp/hal-frontend-build.hVPjN5` altında recoverable yedeklenerek yeni build
  üretildi ve `pm2 restart hal-frontend --update-env` uygulandı.
- Restart readiness penceresinden sonra ana sayfa ve dört politika URL'si 200;
  placeholder 0, “Son güncelleme” 4/4 ve iletişim sorumluluk bloğu 1/1.
- Bu iki kapanışla sayaçlar 52/66 tamamlanan ve 14/66 açık olarak güncellendi.

Commit: `6775780a feat(trust): publish transparency policy content`

### 3.64 Schema.org URL Bazlı Kabul ve Rich Results Engeli

- Resmî Schema.org Validator POST endpoint'i için tekrar çalıştırılabilir
  `scripts/seo/schema-validator-audit.mjs` eklendi.
- Ana sayfa, fiyat listesi, ürün, hal, analiz, yıllık rapor, metodoloji ve yazar
  olmak üzere sekiz temsilî canlı URL denetlendi.
- Sekiz URL'nin tamamında `totalNumErrors=0` ve `totalNumWarnings=0`; ham JSON
  yanıtları ve tip özeti
  `artifacts/seo/schema-validator-2026-07-27/` altında arşivlendi.
- Google Rich Results Test ana sayfa URL modunda headless Chrome ile denendi;
  reCAPTCHA/oturum engeli “Log in and try again” sonucu verdi. Ekran görüntüsü
  `artifacts/seo/rich-results-test-2026-07-27/home-blocked.png`.
- Google sonucu varmış gibi işaretlenmedi. Birleşik Schema/Rich Results
  checklist maddesi etkileşimli Google oturum kanıtı alınana kadar açık.

### 3.65 GSC Page Indexing Kırılımı

- Canlı `gsc_url_index` cache'inde 1.503 URL incelendi; en yeni kontrol
  26 Temmuz 02:02 UTC.
- Dağılım: 277 indexed, 12 discovered-not-indexed, 3 crawled-not-indexed,
  600 noindex, 310 redirect, 300 Google tarafından bilinmeyen ve 1 eski 404.
- URL bazlı canlı HTTP/canonical/robots/sitemap karşılaştırmasıyla 11 gerçek
  indekslenebilir takip URL'si ayrıldı.
- İki crawled ürün bugün bilinçli tek 301; iki discovered hal noindex/sitemap
  dışı; eski `fejoya` bugün 410.
- Cache'te noindex görünen fakat bugün `seo_index=1` ve yayımlanmış editoryelli
  24 ürün, Google'ın eski crawl sonucunu taşıyan stale küme olarak ayrıldı.
- Duplicate/canonical, soft-404 ve server-error coverage sayıları 0.
- Ayrıntılı URL listesi ve izleme kararı
  `docs/geo-seo/GSC-PAGE-INDEXING-INCELEMESI-2026-07-27.md` dosyasına yazıldı.
- Bu kapanışla sayaçlar 53/66 tamamlanan ve 13/66 açık olarak güncellendi.

### 3.66 Anahtar Kelime Yoğunluğu Değişiklik Sonrası Canlı Tarama

- `scripts/seo/keyword-density-audit.mjs` ile görünür tüm metin ve
  boilerplate/tablo/form hariç ana içerik ayrı ölçülebilir hale getirildi.
- Antalya Serik Hali URL'si HTTP 200, self-canonical ve index/follow; title,
  description, tek H1 ve açıklayıcı H2 hedef niyetle tutarlı.
- Tüm görünür metin 379, ana içerik 169 kelime. Tam
  `Antalya Serik Hali fiyatları` ifadesi ana içerikte 1; `Antalya Serik Hali`
  4 kez geçiyor.
- Ham `Serik` tekrarı 30 iken tablo/boilerplate çıkarıldığında 8. Araçtaki ham
  sayım editoryal keyword density olarak kullanılmadı ve yapay tekrar eklenmedi.
- Kanıt `artifacts/seo/keyword-density-2026-07-27/` altında arşivlendi.
- Teknik yeniden tarama tamamlandı; 28 günlük GSC sorgu/CTR penceresi en erken
  24 Ağustos 2026'da dolacağı için birleşik madde açık bırakıldı.

### 3.67 CrUX/GSC 28 Günlük Baseline

- Canlı Google OAuth ile GSC Search Analytics API çalıştırıldı.
- Ortak `LAST_28_DAYS` yardımcısının kapsayıcı uçlarla fiilen 29 gün ürettiği
  görüldü; baseline doğrudan 27 Haziran–24 Temmuz tarihleriyle alındı.
- 28/28 veri günü: 9.744 tıklama, 289.062 gösterim, %3,371 CTR ve 6,326
  ortalama konum.
- 26 Temmuz CrUX origin kanıtı ayrıştırıldı: LCP 3.080 ms, FCP 2.420 ms,
  INP 170 ms, CLS 0.
- URL-level alan verisi mevcut kanıtta yoktu; 27 Temmuz PSI tekrar isteği günlük
  proje kotasına takıldı. URL hücreleri Lighthouse lab verisiyle doldurulmadı.
- Kaynak, hedef, tekrar sıklığı ve ölçüm sınırı
  `docs/geo-seo/CRUX-GSC-28-GUN-BASELINE-2026-07-27.md` dosyasına yazıldı.
- Sayaçlar 54/66 tamamlanan ve 12/66 açık olarak güncellendi.

### 3.68 AI Görünürlük Benchmark Baseline'ı

- Yedi niyet grubunda 40 sabit Türkçe sorgu
  `scripts/seo/ai-visibility-queries.json` dosyasında tanımlandı.
- Tarih, platform, model, hesap/konum durumu, cevap, marka geçişi, citation
  URL'si ve citation sırasını kaydeden tekrar çalıştırılabilir
  `scripts/seo/ai-visibility-benchmark.mjs` eklendi.
- OpenAI web-search pilotu `429 insufficient_quota` verdi ve ölçülmüş gibi
  raporlanmadı.
- Anthropic Messages API + web-search, `claude-haiku-4-5` modeliyle 40/40
  sorguyu hatasız tamamladı.
- İlk baseline: marka geçişi 10/40 (%25), haldefiyat.com citation 18/40
  (%45). Citation alan cevapların 10'unda HalDeFiyat ilk kaynaktı.
- Ham yanıt ve citation kanıtları
  `artifacts/seo/ai-visibility-2026-07-27/`, yöntem ve aylık tekrar komutu
  `docs/geo-seo/AI-GORUNURLUK-BASELINE-2026-07-27.md` altında arşivlendi.
- Bu yüzey tüketici Claude.ai/ChatGPT arayüzü olarak etiketlenmedi. İlk gerçek
  aylık değişim karşılaştırması 27 Ağustos 2026 veya sonrasında yapılabilir.
- Sayaçlar 55/66 tamamlanan ve 11/66 açık olarak güncellendi.

### 3.69 Backlink/Marka Baseline'ı — İlk Veri Ayrıştırması

- GSC'de 27 Haziran–24 Temmuz 2026 tam 28 veri günü ve 4.519 sorgu satırı
  tarandı.
- Markalı varyantlardan yalnız `halde fiyat` sorgusu bulundu: 4 tıklama,
  5 gösterim, %80 CTR, 3,2 ortalama konum.
- Canlı ortamda Ahrefs/Semrush/Moz/Majestic/DataForSEO benzeri backlink veri
  sağlayıcısı erişimi bulunmadı. Referring-domain ve dofollow sayıları arama
  sonucu tahminiyle doldurulmadı; birleşik checklist maddesi açık kaldı.
- Organik sonuçlarda beş gerçek karşılaştırma adayı ayrıldı:
  `tarimpiyasa.com`, `pazarmap.com`, `tarim-pazar.com`, `halfiyatlari.co` ve
  `gidaveri.com`. Sayısal gap analizi backlink veri kaynağı olmadan kapanmadı.
- Marka taramasında `haldefiyat.com.tr` ayrı sonuç olarak görüldü. DNS ve canlı
  Nginx kontrolü bunun dış kopya değil, aynı sunucudaki alias olduğunu; ancak
  ana sayfanın 301 yerine 200 döndüğünü gösterdi. Redirect konusu ayrı teknik
  bulgu olarak sorunlar dosyasına kaydedildi.

### 3.70 Operasyonel KPI Sözlüğü

- Schema-valid temsilî şablon, indexable sitemap URL, origin/URL-level
  CWV-good, AI-referrer landing, markalı organik talep ve AI citation
  metrikleri kesin pay/payda ve dışlama kurallarıyla tanımlandı.
- Baseline/hedef/kaynak/owner/sıklık tablosu
  `docs/geo-seo/OPERASYONEL-KPI-TANIMLARI-2026-07-27.md` dosyasına yazıldı.
- Canlı Nginx'in 6–26 Temmuz arasında sakladığı 21 günlük loglarda dış referrer
  hostuna dayalı 28 AI landing görüldü: ChatGPT 18, Gemini 7, Copilot 2,
  Claude 1.
- AI bot user-agent'ları, iç self-referrer ve URL'de kalan UTM parametreleri
  insan referral metriğine katılmadı.
- URL-level CrUX alan verisi yetersiz olduğundan oran uydurulmadı; origin LCP
  3.080 ms nedeniyle CWV-good kabul edilmedi.
- “GEO skoru” operasyonel tek metrik olmaktan çıkarıldı. İki KPI checklist
  maddesi kapandı; sayaçlar 57/66 tamamlanan ve 9/66 açık olarak güncellendi.

### 3.71 Marka Otoritesi ve Topluluk Planı

- Canlı `/basin`, `/endeks`, `/api-docs` ve `/analiz` kaynaklarının 200 olduğu;
  basın CRM tabloları, admin akışı, üç pitch şablonu ve 11 kişilik başlangıç
  listesinin mevcut olduğu doğrulandı.
- Dokuz veri varlığı canonical URL, format, sıklık, hedef kitle, kaynak yöntemi,
  lisans durumu, citation biçimi, owner ve kalite kapısıyla
  `docs/geo-seo/VERI-KATALOGU-2026-07-27.csv` içinde kataloglandı.
- Harici veri platformuna yüklemeden önce kaynak lisansı, veri sözlüğü, kapsam,
  revizyon, checksum/sürüm ve owner onayı kapısı tanımlandı.
- 30/60/90 günlük basın mention, haftalık endeks hikâyesi, YouTube açıklayıcı
  video ve kurallara uygun Reddit topluluk programı hazırlandı.
- YouTube için izlenme yerine retention/referral; Reddit için gönderi sayısı
  yerine silinme, anlamlı yorum ve engaged referral KPI'ları yazıldı.
- Wikipedia hedef veya KPI yapılmadı; bağımsız kayda değerlik olmadan madde
  açılmaması açıkça kaydedildi.
- Hiçbir dış kişiye e-posta gönderilmedi ve sosyal gönderi yayımlanmadı; belge
  operasyon planıdır.
- Sayaçlar 58/66 tamamlanan ve 8/66 açık olarak güncellendi.

### 3.72 Public API Geliştirici Paketi

- `examples/haldefiyat-api/` altında Node.js 20+ istemcisi, standart
  kütüphaneli Jupyter notebook, Postman collection, public OpenAPI,
  changelog ve versioning/sunset politikası oluşturuldu.
- Node istemcisi canlı `domates` sorgusunda 5 satır ve gerçek metadata ile
  başarıyla çalıştı; Postman ve notebook JSON dosyaları parse edildi.
- Redocly doğrulamasında OpenAPI yapısal hata 0; lisans kararı verilmediği ve
  salt GET rotalarda genel 4xx tanımı eklenmediği için 6 kalite uyarısı kaldı.
- Frontend API dokümanındaki eski `{data,total}`, `dateFrom/dateTo` ve yanlış
  haftalık özet sözleşmesi gerçek `{items,meta}`, `range` ve `week` biçimine
  geçirildi.
- Doğru frontend test komutunda 17 dosya/48 test geçti; production build
  tamamlandı. Yerel backend çalışmadığı için prerender fetch'leri fallback
  kullandı, build çıkış kodu 0.
- `/api/v1` runtime sözleşmesi değiştirilmedi; breaking deploy yapılmadı.
- Sayaçlar 59/66 tamamlanan ve 7/66 açık olarak güncellendi.

### 3.73 API Dokümanı Canlı Kabulü

- `05740418` commit'i `main` dalına push edildi ve canlı sunucu
  `git pull --ff-only` ile güncellendi.
- Eski `frontend/.next/standalone` silinmeden version'lı geçici dizine taşındı;
  canlı production build başarıyla tamamlandı.
- `pm2 restart hal-frontend --update-env` sonrası frontend ve backend online.
- Canlı kabul: `/api-docs` 200, `/` 200 ve örnek
  `/api/v1/prices?product=domates&limit=1` 200.
- Canlı SSR dokümanda `latestOnly`, `recordedDate` ve `week=2026-29`
  görünüyor; kaldırılan yanlış `dateFrom` örneği görünmüyor.

## 8. Riskler

- Şeffaflık sayfalarını nihai içerik olmadan canlıya almak ince içerik üretir.
- CSP artık endpoint'e bağlı ve enforce; gerçek trafik ihlal raporları izlenmelidir.
- Allowlist değişikliklerinde GTM/GA/Ads/OneSignal/hava/video akışları yeniden
  headless taramadan geçirilmelidir.
- RUM event'i GTM tarafında yapılandırılmadan veri rapora düşmeyebilir.
- Ürün sayfasındaki yanlış Product/Offer kaldırıldığı için mevcut GSC Product
  snippet görünürlüğü değişebilir; deploy öncesi/sonrası raporlanmalıdır.
- Ana sayfa UA-bazlı farklı SSR ürettiği için körlemesine public edge cache yanlış cihaz ağacını sunabilir.

## 9. Sonraki Uygulama Sırası

1. Orhan dört şeffaflık metnini sağlar; CMS içerikleri doldurulur.
2. Yerel commitler çapraz kod incelemesinden geçer.
3. Commitler push edilir.
4. Backend + frontend canlı deploy edilir.
5. Ürün/hal/genel/analiz anchor'ları canlı SSR HTML'de doğrulanır.
6. Mobil Lighthouse en az üç koşu alınır; RUM/CrUX p75 28 gün izlenir.
7. Tamamlandı: Nginx CSP rapor endpoint'ine bağlandı ve enforce açıldı.
8. CSP ihlal verisi gerçek trafikte izlenir; yeni origin'ler doğrulanmadan eklenmez.
9. Nonce/hash ile `unsafe-inline` ve `unsafe-eval` azaltımı ayrı güvenlik
   sıkılaştırması olarak planlanır.

## 10. Commit Dizisi

Uygulama sırasıyla:

```text
c8600951 fix(seo): add localized homepage h1
ccaf86ae feat(analytics): report sampled real-user web vitals
a9620c9a fix(seo): keep sitemap canonical and use real lastmod dates
35ab742f feat(seo): improve schema dates and dataset metadata
5961e1bf docs(etl): track stalled Kocaeli Mersin Canakkale feeds
c21c4a1e feat(seo): add article image variants and truthful report dates
88bde326 feat(security): collect CSP violation reports
820c58d2 feat(trust): scaffold editorial transparency pages
62e71ca5 feat(seo): align visible and structured breadcrumbs
4808d02d docs(geo-seo): record implementation review ledger
86be72df test(security): cover CSP report normalization
27386209 docs(geo-seo): update CSP verification record
865ee9ff fix(seo): bound dataset temporal coverage to real dates
857d6e00 fix(seo): derive dataset freshness from database bounds
f46eeb93 fix(seo): omit misleading market sitemap dates
8cb88095 fix(security): cap CSP report request bodies
e1b65b4a docs(geo-seo): record data freshness corrections
5822f519 fix(seo): reject future dates from news sitemap
6e8d7965 docs(geo-seo): record sitemap date safeguards
ad6f5be4 test(analytics): cover Web Vitals sampling rules
fe7dbfa4 fix(seo): reject invalid and future sitemap dates
6a8e723c feat(seo): add annual report image variants
36604e09 docs(geo-seo): record RUM and Article hardening
27b09bba fix(seo): use real data dates in OG images
0a637e11 feat(seo): align methodology Article identity
99bcee1a fix(security): redact URL queries from CSP logs
1e04f787 docs(geo-seo): record OG truth and CSP feasibility
0dc9dce9 feat(seo): add methodology image variants
3bf64760 docs(geo-seo): record methodology image coverage
7cf22f9a feat(security): publish configured security.txt
ab012981 fix(seo): canonicalize default locale without prefix
19ed5405 docs(geo-seo): record security contact and canonical fix
3dddeb04 fix(a11y): describe product images
955cb6fe fix(content): avoid false ETL status on empty markets
50d35c3f feat(seo): enrich category price datasets
fa429d11 docs(geo-seo): record P2 content and dataset fixes
35f290ed fix(geo): publish canonical API links to crawlers
f2ece31a fix(geo): allow AI crawlers on public data APIs
96bc3b54 fix(geo): derive llms coverage from live data
1a872976 docs(geo-seo): record crawler API consistency fixes
0614ceb5 feat(geo): add dated product answer summaries
6e05be62 feat(geo): add dated market answer summaries
33200273 feat(geo): summarize current national price coverage
139b8c88 feat(geo): anchor analysis finding summaries
aff495ac fix(geo): bound analysis finding summaries
b507c516 perf(lcp): defer Google tags until idle or interaction
085c7681 perf(lcp): render homepage FAQ without hydration
a0aae0bf fix(seo): remove repeated market terms from detail tables
a55ddb1f fix(seo): remove repeated product terms from detail tables
ce97793f fix(content): derive homepage FAQ coverage from live data
ab0b923b fix(content): replace stale coverage and ETL schedule claims
52115e13 fix(seo): derive index dataset dates from history
e3c1776b fix(content): remove stale live coverage claims
ee8de6bd fix(seo): add comparison breadcrumb schema
d241af55 fix(seo): align policy page breadcrumbs
5a204511 fix(seo): show breadcrumbs on indexed templates
8a44624e test(seo): verify breadcrumb content parity
1a3027f5 fix(seo): add hreflang to dynamic content
0f900081 fix(seo): align open graph urls with canonicals
32feeed0 fix(seo): publish completed annual reports
0d70eb33 fix(seo): include published authors in sitemap
ccb21d00 fix(content): remove stale realtime data claims
4556608c fix(schema): model product prices as dataset only
2d497832 fix(schema): align list types and canonical urls
abf83083 fix(schema): safely serialize json-ld
23cf57e2 fix(schema): declare root entity types explicitly
8610e751 fix(content): label automated reports truthfully
3fc97d80 fix(trust): use configured contact details
6ca33051 fix(seo): noindex private action routes
edc43c6d fix(seo): noindex embeddable widgets
c4897cba feat(trust): record analysis human reviews
```

## 11. Canlıya Çıkış Öncesi Kontrol

- [ ] Claude kod diff'lerini brief maddeleriyle karşılaştırdı.
- [ ] Orhan açık soruları değerlendirdi.
- [x] Şeffaflık CMS metinleri hazır ve canlıda yayımlandı.
- [x] Frontend tests/typecheck/build temiz.
- [x] Backend typecheck/build temiz.
- [x] Canlı gerçek backend ile smoke test yapıldı.
- [x] Tüm çalışma ağacı commitlendi ve `main` push kapsamı doğrulandı.
- [x] Backend deploy öncesi `054_analysis_report_reviews.sql` migration'ı uygulandı.
- [x] Backend deploy sonrası CSP endpoint 204 doğrulandı.
- [x] Frontend deploy sonrası H1, schema, sitemap, yeni route'lar doğrulandı.
- [x] Nginx CSP rapor akışı endpoint'e bağlandı; sentetik rapor 204 doğrulandı.
- [x] PM2 frontend için `restart --update-env` kullanıldı; reload kullanılmadı.
- [x] CSP enforce açıldı; beş kritik rotada headless Chrome CSP regresyonu temiz.
