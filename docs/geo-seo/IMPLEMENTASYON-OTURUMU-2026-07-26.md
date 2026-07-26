# HalDeFiyat GEO/SEO Implementasyon Oturumu — 26.07.2026

> Durum: Devam ediyor
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
| GÖREV 2 — Citability cevap blokları | Bloklu | Hedef sorgu–sayfa haritası bekleniyor |
| GÖREV 3 — Mobil LCP/FCP | Bloklu | Gerçek LCP elementi ve waterfall bekleniyor |
| GÖREV 4a — Article/NewsArticle kalite | Büyük ölçüde tamamlandı | `35ab742f`, `c21c4a1e` |
| GÖREV 4b — Breadcrumb kalite | Hedef şablonlarda tamamlandı | `62e71ca5` |
| GÖREV 4c — Dataset kalite | Ana sayfa/ürün/hal tamamlandı | `35ab742f` |
| GÖREV 5 — E-E-A-T iskele | Kod iskeleti tamamlandı | `820c58d2`; CMS metinleri bekleniyor |
| GÖREV 6 — CSP gözlem hazırlığı | Backend tamamlandı | `88bde326`; nginx header bağlantısı bekliyor |
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

## 4. Doğrulama Kayıtları

Bu oturumda çalıştırılan kontroller:

- Frontend `bunx tsc --noEmit`: geçti.
- Backend `bunx tsc --noEmit`: geçti.
- Frontend `bun run test`: 9 dosya, 25 test geçti.
- Backend `bun run test`: 2 dosya, 11 test geçti.
- Frontend `bun run build`: geçti; son durumda 63 route üretildi.
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

### S-01 — GÖREV 2 sorgu haritası yok

- Brief “harita gelmeden mekanik blok ekleme” diyor.
- `docs/codex-briefs/geo-seo-implementation.md` içinde harita hâlâ yok.
- GSC sorgu verisi bu çalışma bağlamında sunulmadı.
- Sonuç: AnswerBlock ve sayfa değişiklikleri bilinçli olarak yapılmadı.

### S-02 — GÖREV 3 gerçek LCP teşhisi yok

- Gerçek LCP elementi belirtilmedi.
- Lighthouse waterfall ve LCP phase breakdown yok.
- Tek koşu 6682 ms değer var; medyan yok.
- Sonuç: preload, font veya cache değişikliği varsayımla yapılmadı.

### S-03 — CSP header repo dışında

- Canlı `Content-Security-Policy-Report-Only` nginx üzerinde set ediliyor.
- Nginx config repo içinde değil.
- Endpoint kodu hazır; header henüz endpoint'e bağlanmadı.

Gerekli canlı header ekleri:

```text
report-uri https://haldefiyat.com/api/v1/csp-reports;
```

Modern Reporting API için ayrıca nginx `Report-To` veya `Reporting-Endpoints`
başlığının tarayıcı uyumluluğu değerlendirilmelidir.

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

### S-06 — Product/Offer semantik kararı

- Brief yeni fiyat verisini `Product/Offer` yapmayı yasaklıyor.
- Mevcut ürün sayfasında daha önce oluşturulmuş `Product/AggregateOffer` var.
- GSC Product snippets süreci ve geçmiş kararlar nedeniyle bu oturumda kaldırılmadı.
- Kaldırma/koruma kararı ayrıca GSC görünürlüğü ve semantik uygunlukla değerlendirilmelidir.

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

### S-10 — CSP nonce/hash geçişi için runtime engeller

- `Analytics.tsx` içinde Consent Mode, GTM, GA4 ve Ads için dört inline script var.
- Next.js runtime inline bootstrap scriptleri request bazlı nonce gerektiriyor.
- JSON-LD scriptleri de `script-src` kapsamındadır.
- `BannerSlot`, CMS'den değişken ham reklam HTML'i render edebiliyor; sabit hash
  yaklaşımı bu içerik için uygun değil.
- GTM custom HTML tag envanteri repo dışındaki GTM workspace'ten çıkarılmalıdır.
- OneSignal SDK origin'i allowlist içinde korunmalıdır.

Önerilen geçiş:

1. Report-Only header yeni endpoint'e bağlanır ve 7–14 gün veri toplanır.
2. GTM custom HTML ve CMS banner kodları envanterlenir.
3. Ham banner HTML'i tanımlı reklam sağlayıcı bileşenlerine dönüştürülür.
4. Request bazlı nonce staging'de Next scriptleri ve JSON-LD ile doğrulanır.
5. Production build'de önce `unsafe-eval`, sonra uygun olduğunda
   `unsafe-inline` kaldırılır.
6. Enforce yalnız ayrı Orhan/Claude onayıyla açılır.

## 6. Açık Sorular

### Q-01 — Hedef sorgu–sayfa haritası

Claude/Orhan'dan beklenen:

- Hangi ürün sorguları?
- Hangi hal/şehir sorguları?
- Hangi analiz sorguları?
- Öncelik ve mevcut GSC impression/position değerleri?

### Q-02 — LCP teşhisi

Claude'dan beklenen:

- Mobil LCP elementi nedir?
- TTFB, load delay, load duration, render delay değerleri?
- Üç koşu medyan sonuç?
- Ana sayfanın mobil ve masaüstü UA SSR response boyutları?
- Cache önerisi UA-bazlı farklı HTML nedeniyle güvenli mi?

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

- Dokuz yerel commit birlikte mi deploy edilecek?
- Önce staging/ayrı branch kabulü yapılacak mı?
- Canlı deploy sonrası Claude hangi URL örneklerini doğrulayacak?

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

## 8. Riskler

- Şeffaflık sayfalarını nihai içerik olmadan canlıya almak ince içerik üretir.
- CSP header endpoint'e bağlanmadan gözlem başlamaz.
- CSP enforce'a erken geçmek GTM/GA/Ads/harita/video akışlarını kırabilir.
- RUM event'i GTM tarafında yapılandırılmadan veri rapora düşmeyebilir.
- Ürün sayfasındaki Product/Offer kaldırılırsa mevcut GSC Product snippet görünürlüğü etkilenebilir.
- Ana sayfa UA-bazlı farklı SSR ürettiği için körlemesine public edge cache yanlış cihaz ağacını sunabilir.

## 9. Sonraki Uygulama Sırası

1. Claude hedef sorgu–sayfa haritasını brief'e ekler.
2. GÖREV 2 ortak `AnswerBlock` ile hedef sayfalarda uygulanır.
3. Claude gerçek LCP element/waterfall ölçümünü ekler.
4. GÖREV 3 yalnız ölçümün gösterdiği kök nedene göre uygulanır.
5. Orhan dört şeffaflık metnini sağlar; CMS içerikleri doldurulur.
6. Yerel commitler çapraz kod incelemesinden geçer.
7. Commitler push edilir.
8. Backend + frontend canlı deploy edilir.
9. Nginx CSP Report-Only header endpoint'e bağlanır.
10. En az 7–14 gün CSP ve RUM veri gözlemi yapılır.
11. Enforce kararı ayrı onayla alınır.

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
```

## 11. Canlıya Çıkış Öncesi Kontrol

- [ ] Claude kod diff'lerini brief maddeleriyle karşılaştırdı.
- [ ] Orhan açık soruları değerlendirdi.
- [ ] Şeffaflık CMS metinleri hazır.
- [ ] Frontend tests/typecheck/build temiz.
- [ ] Backend typecheck/build temiz.
- [ ] Staging veya lokal gerçek backend ile smoke test yapıldı.
- [ ] Push kapsamı yalnız ilgili commitlerden oluşuyor.
- [ ] Backend deploy sonrası CSP endpoint 204 doğrulandı.
- [ ] Frontend deploy sonrası H1, schema, sitemap, yeni route'lar doğrulandı.
- [ ] Nginx Report-Only header rapor endpoint'e bağlandı.
- [ ] PM2 frontend için `restart --update-env` kullanıldı; reload kullanılmadı.
- [ ] CSP enforce açılmadı.
