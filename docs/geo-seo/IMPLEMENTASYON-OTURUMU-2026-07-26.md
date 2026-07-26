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
- Canlı canonical'ı `/tr/...` olan üç sayfanın sitemap URL'si canonical ile eşleştirildi:
  - `/tr/borsa`
  - `/tr/canli-hayvan-fiyatlari`
  - `/tr/et-fiyatlari`
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

Değişiklikler:

- Yeni endpoint: `POST /api/v1/csp-reports`
- Kabul edilen content type:
  - `application/csp-report`
  - `application/reports+json`
- Eski `csp-report` ve yeni Reporting API envelope formatları normalize ediliyor.
- Tek istekte en fazla 20 rapor işleniyor.
- String alanları sınırlandırılıyor.
- Payload ham biçimde loglanmıyor.
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
- [ ] Rate-limit çalışıyor.

### 3.9 ETL Akış Sorunlarının Kaydı

Commit: `5961e1bf docs(etl): track stalled Kocaeli Mersin Canakkale feeds`

`KALAN-ISLER.md` içine eklendi:

- Kocaeli son başarılı: 08.05.2026.
- Mersin son başarılı: 19.05.2026; 26.07.2026 HTTP 403.
- Çanakkale son başarılı: 26.05.2026.
- Her kaynak için teşhis yönü ve kabul kriteri yazıldı.

## 4. Doğrulama Kayıtları

Bu oturumda çalıştırılan kontroller:

- Frontend `bunx tsc --noEmit`: geçti.
- Backend `bunx tsc --noEmit`: geçti.
- Frontend `bun run test`: 2 dosya, 7 test geçti.
- Backend `bun run test`: 2 dosya, 8 test geçti.
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

### S-07 — Canonical locale tutarsızlığı

- Canlı kontrolde `/borsa`, `/canli-hayvan-fiyatlari`, `/et-fiyatlari` sayfaları
  `/tr/...` canonical döndürüyor.
- Diğer varsayılan Türkçe sayfalar prefixsiz canonical kullanıyor.
- Sitemap mevcut canlı canonical'a uyduruldu; kök locale politikasının kendisi ayrıca
  düzeltilmelidir.

### S-08 — RUM event teslimi canlı doğrulanmadı

- Kod `dataLayer` event'i üretiyor.
- GTM container içinde `web_vitals` trigger/tag eşlemesi kontrol edilmedi.
- Kodun varlığı, GA4 raporuna event düştüğünü tek başına kanıtlamaz.

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

## 8. Riskler

- Şeffaflık sayfalarını nihai içerik olmadan canlıya almak ince içerik üretir.
- CSP header endpoint'e bağlanmadan gözlem başlamaz.
- CSP enforce'a erken geçmek GTM/GA/Ads/harita/video akışlarını kırabilir.
- RUM event'i GTM tarafında yapılandırılmadan veri rapora düşmeyebilir.
- Sitemap canonical'ı mevcut `/tr/...` davranışına uydurmak locale tutarsızlığını kalıcılaştırabilir.
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
