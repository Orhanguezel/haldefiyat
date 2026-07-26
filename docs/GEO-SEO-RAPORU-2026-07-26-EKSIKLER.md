# HalDeFiyat GEO + SEO Raporu — Eksik ve Doğrulama Checklist'i

> İncelenen dosya: `HalDeFiyat-GEO-SEO-Raporu-2026-07-26.pdf`
> İnceleme tarihi: 26.07.2026
> Kapsam: PDF'nin 17 sayfası, canlı ana sayfa/HTTP başlıkları/robots.txt/llms.txt ve ilgili kaynak kod
> Not: Bu belge rapordaki önerileri doğrudan kabul etmez; **doğrulanan site işi**, **yanlış/eskimiş bulgu** ve **rapor kalitesi eksiğini** ayırır.

## 1. Kısa karar

Rapor yararlı bir üst seviye özet sunuyor; ancak mevcut haliyle uygulama backlog'una doğrudan
çevrilmemeli. En önemli sorunlar:

- 14. sayfadaki **30/60/90 günlük yol haritası fiilen boş**.
- Skorlar ve özellikle platform bazlı “alıntılanma olasılığı” puanları için tekrar üretilebilir kanıt yok.
- Bazı öneriler canlı site/kodla çelişiyor: `NewsArticle`, `BreadcrumbList`, CSS minification ve CSP.
- Lighthouse laboratuvar ölçümü “Core Web Vitals” gibi sunulmuş; alan verisi/CrUX ayrımı yapılmamış.
- `Google-Extended` izninin Google AI Overviews için etkisi yanlış tarif edilmiş.
- Marka otoritesi 55/100 deniyor fakat backlink, mention, entity ve rakip verisi gösterilmiyor.
- 74→85 hedefi veriliyor fakat her işin puana katkısı ve hedefin matematiksel köprüsü yok.

Bu nedenle önce aşağıdaki **P0 rapor düzeltmeleri ve ölçüm doğrulamaları**, sonra gerçek site
değişiklikleri yapılmalıdır.

---

## 2. P0 — Raporu güvenilir ve uygulanabilir hale getir

### 2.1 Eksik yol haritasını tamamla

- [ ] PDF sayfa 14'e gerçek 30/60/90 gün tablosunu ekle.
- [ ] Her satıra `iş`, `öncelik`, `sorumlu`, `başlangıç`, `bitiş`, `bağımlılık`, `efor`,
  `beklenen etki`, `kabul kriteri`, `kanıt URL/rapor` alanlarını ekle.
- [ ] Sayfa 8'deki hızlı/orta/stratejik listeyle sayfa 14'ün bire bir tutarlı olmasını sağla.
- [ ] Sayfa 15 KPI'larının her birini yol haritasındaki en az bir işe bağla.
- [ ] 74→85 skor artışının hangi maddelerden kaç puan geleceğini göster.

### 2.2 Ham kanıt ekini yayınla

- [ ] Her test için tam URL, tarih-saat, timezone ve HTTP durumunu yaz.
- [ ] Lighthouse çalışmasının URL'sini, cihaz/ağ profilini, Lighthouse sürümünü ve run sayısını ekle.
- [ ] Tek koşu yerine en az 3 mobil + 3 masaüstü koşu yap; medyanı raporla.
- [ ] LCP elementini, request waterfall'u, render delay/load delay kırılımını ve ekran görüntüsünü ekle.
- [ ] PageSpeed/CrUX origin ve URL-level alan verisini ayrı tabloda göster.
- [ ] CrUX verisi yoksa açıkça “yetersiz alan verisi” yaz; lab sonucunu CWV pass/fail gibi sunma.
- [ ] INP için CrUX/RUM/GA4 web-vitals verisi ekle; Lighthouse'ın INP ölçemediğini belirt.
- [ ] Citability skorlanan 9 pasajın metnini, URL'sini, formülünü ve tekil puanlarını ekle.
- [ ] DNS sorgularını (`dig TXT`, SPF, DKIM selector, DMARC) ham çıktılarıyla ekle.
- [ ] Schema test URL'lerini ve Rich Results/validator çıktılarını ekle.
- [ ] robots.txt bot matrisini yalnız politika olarak değil, loglarda gerçek crawl görülme durumu ile destekle.
- [ ] Sitemap için yalnız URL sayısı değil; 200/redirect/404/noindex/canonical dağılımını ekle.

### 2.3 Skorlama metodolojisini denetlenebilir yap

- [ ] Altı ana kategorinin tüm alt metriklerini ve ağırlıklarını yayınla.
- [ ] Her alt metriğin 0–100 puanlama kuralını örnekle.
- [ ] Platform skorlarının “alıntılanma olasılığı” olmadığını veya olasılık kalibrasyon kanıtını göster.
- [ ] ChatGPT 82, Perplexity 82, Gemini 78 gibi skorların hangi gerçek sorgu setinden geldiğini yaz.
- [x] En az 30–50 hedef sorguluk Türkçe benchmark seti tanımla.
- [x] Her sorgu için platform, tarih, konum/hesap durumu, cevapta marka geçişi, link/citation ve sıra kaydet.
- [ ] Skorların hata payını ve test tekrarındaki oynaklığını raporla.
- [ ] “85+” hedefinin iş sonucuna bağını kur: AI citation, organik tıklama, branded search veya lead KPI.

---

## 3. P0 — Raporun yanlış veya eskimiş bulgularını düzelt

### 3.1 Article / NewsArticle

- [ ] “Analiz raporlarında Article/NewsArticle eksik” bulgusunu geri çek veya URL bazında yeniden test et.
- [ ] Kaynak kodda `frontend/src/app/[locale]/(public)/analiz/[slug]/page.tsx` içindeki
  `NewsArticle` şemasını rapora işle.
- [ ] Yıllık rapor sayfasındaki `Article` şemasını ayrıca kaydet.
- [ ] Şemanın varlığından sonra gerçek eksikleri test et: `headline`, üç en-boy oranında görsel,
  `datePublished`, gerçek `dateModified`, `author.url`, `publisher`, görünür byline/tarih.
- [ ] Google News uygunluğunu yalnız schema varlığına bağlama; Article işaretlemesi Google News için
  zorunlu değildir.

### 3.2 BreadcrumbList

- [ ] “BreadcrumbList eksik” genellemesini kaldır.
- [ ] `frontend/src/components/seo/Breadcrumb.tsx` ve sayfa bazlı kullanımları URL envanteriyle doğrula.
- [ ] Gerçekten eksik olan indekslenebilir şablonları tek tek listele; site geneli “eksik” deme.
- [ ] Schema ile görünür breadcrumb içeriğinin eşleştiğini test et.

### 3.3 CSS minification

- [ ] “2 harici CSS dosyası minify edilmemiş” iddiasında dosya URL'lerini, byte boyutunu ve audit
  kaynağını göster.
- [ ] Bunların first-party Next.js production chunk'ı mı, third-party CSS mi olduğunu ayır.
- [ ] Next.js production build'in minification davranışını kontrol etmeden “build çıktısında aç” işi oluşturma.
- [ ] Gerçek kazancı byte ve milisaniye olarak ölç; anlamsızsa backlog'dan çıkar.

### 3.4 CSP

- [ ] “CSP yok” bulgusunu “CSP Report-Only var, enforce değil” şeklinde düzelt.
- [ ] Canlı `Content-Security-Policy-Report-Only` başlığını kanıta ekle.
- [ ] Enforce'a geçmeden ihlal raporlama endpoint'i ve 1–2 haftalık gözlem planı oluştur.
- [ ] `unsafe-inline` ve `unsafe-eval` kaldırma planını ayrı güvenlik işi olarak tanımla.
- [ ] GTM/GA/Ads/harita/video gibi üçüncü tarafları staging'de regresyon testine al.

### 3.5 Google-Extended

- [ ] “Google-Extended izni Google AI eğitimi ve AI Overviews için ideal” ifadesini düzelt.
- [ ] Google-Extended'ın Google Search'e ve Search sıralamasına etkisi olmadığını belirt.
- [ ] Google Search AI özelliklerinin uygunluğunu Search Console'daki ilgili generative AI kontrolü
  ve Googlebot indekslenebilirliği üzerinden ayrı doğrula.

### 3.6 FAQPage etkisi

- [ ] FAQPage için “AI cevap kutuları için ideal” gibi garanti çağrışımlı dili yumuşat.
- [ ] Google FAQ rich result görünürlüğünün ağırlıkla otoriter sağlık/devlet siteleriyle sınırlı olduğunu not et.
- [ ] FAQ işaretlemesinin görünür sayfa içeriğiyle bire bir eşleştiğini doğrula.
- [ ] FAQ schema'yı bir GEO başarı KPI'ı saymak yerine yardımcı makine-okunurluk sinyali olarak ele al.

---

## 4. P1 — Gerçek ve doğrulanmış site işleri

### 4.1 Ana sayfa H1

- [ ] Ana sayfaya tam olarak bir görünür, konu odaklı H1 ekle.
- [ ] Önerilen H1: `Türkiye Hal Fiyatları — Günlük Sebze ve Meyve Fiyatları`.
- [ ] Mevcut hero H2'yi H1'e dönüştürürken tasarımı CSS sınıflarıyla aynen koru.
- [ ] Mobil ve masaüstünde duplicate/gizli H1 oluşmadığını SSR HTML üzerinden doğrula.
- [ ] Deploy sonrası `curl` ve browser accessibility tree ile kontrol et.
- [ ] H1 değişikliğini tek başına büyük sıralama kazanımı gibi KPI'laştırma; hijyen düzeltmesi olarak izle.

**Kabul kriteri**

- [ ] SSR HTML'de 1 adet `<h1>` var.
- [ ] H1 ana sayfanın görünür ana başlığı.
- [ ] Lighthouse SEO/accessibility regresyonu yok.

### 4.2 Mobil LCP/FCP teşhisi ve iyileştirme

- [ ] Önce gerçek LCP elementini belirle; “muhtemel görsel” varsayımıyla preload ekleme.
- [ ] LCP'yi TTFB, resource load delay, resource load duration ve element render delay olarak parçala.
- [ ] Ana dokümanın boyutunu, RSC payload'unu ve hydration maliyetini ölç.
- [ ] Above-the-fold ticker, ilan vitrini ve rapor kartlarının SSR/client maliyetini profiler ile ölç.
- [ ] Kullanılmayan JS/CSS, long task ve main-thread sürelerini çıkar.
- [ ] Font preload'larının gerçekten kullanılan font/weight'lerle sınırlı olduğunu doğrula.
- [ ] LCP görselse doğru `sizes`, AVIF/WebP, preload/priority ve responsive source uygula.
- [ ] LCP metinse font ve render-blocking CSS/JS zincirini optimize et.
- [ ] Aşağı katmanları lazy render/dynamic import ile geciktir; SEO-kritik içeriği SSR'da koru.
- [ ] Production koşullarında 3+ tekrar ve medyan ile tekrar ölç.
- [ ] Search Console CWV/CrUX verisini 28 günlük pencereyle takip et.
- [ ] INP için gerçek kullanıcı web-vitals telemetry kur veya mevcut RUM'u raporla.

**Kabul kriteri**

- [ ] Mobil Lighthouse medyan performans ≥85.
- [ ] Lab LCP <2,5 sn; FCP <1,8 sn.
- [ ] Varsa p75 field LCP ≤2,5 sn, INP ≤200 ms, CLS ≤0,1.
- [ ] Ana SEO içeriğinde SSR veya indekslenebilirlik regresyonu yok.

### 4.3 E-posta güvenliği

- [ ] Kullanılan tüm gönderici servislerini ve domain/subdomain'leri envanterle.
- [ ] Root domain için tek, birleşik SPF kaydı oluştur; birden fazla SPF TXT bırakma.
- [ ] SPF lookup sayısının 10'u aşmadığını kontrol et.
- [ ] DKIM selector ve alignment'ı gerçek test e-postasıyla doğrula.
- [ ] DMARC `rua` mailbox/aggregate report işleme sürecini kur.
- [ ] Önce raporları gözle; sonra `pct=25` quarantine → `pct=100` quarantine → gerekirse reject aşamalarına geç.
- [ ] `adkim`/`aspf` politikasını gerçek gönderim mimarisine göre seç; körlemesine örnek kayıt kopyalama.
- [ ] Google Postmaster Tools/mail-tester ve DMARC raporlarıyla teslimatı izle.

**Kabul kriteri**

- [ ] SPF pass, DKIM pass, DMARC aligned pass.
- [ ] Yetkili tüm göndericiler çalışıyor; yetkisiz gönderim quarantine/reject oluyor.
- [ ] En az 7 günlük DMARC raporlarında beklenmeyen meşru kaynak yok.

### 4.4 CSP enforce geçişi

- [ ] Report-Only ihlallerini merkezi olarak topla.
- [ ] Gerekli origin'leri kullanım amacı ve sahibiyle envanterle.
- [ ] Nonce/hash tabanlı script politikasına geçiş fizibilitesini incele.
- [ ] Staging'de login, kayıt, fiyat alarmı, GTM/GA4, Ads ve embed akışlarını test et.
- [ ] İlk aşamada küçük trafik yüzdesinde enforce et; hata oranını izle.
- [ ] Sorunsuzsa `Content-Security-Policy` enforce başlığına geçir.

---

## 5. P1 — GEO ve içerik görünürlüğü için eksik ölçüm/üretim işleri

### 5.1 Alıntılanabilir cevap blokları

- [ ] Önce hedef sorgu ve sayfa eşlemesi çıkar; her sayfaya mekanik 40–60 kelimelik blok ekleme.
- [ ] Ürün sayfasında “Bugün X ürününün Türkiye ortalama hal fiyatı nedir?” sorusuna tarihli yanıt ver.
- [ ] Yanıtta ürün, tarih, birim, min–max/ortalama, örneklem/kaynak ve veri tazeliği yer alsın.
- [ ] Hal sayfasında şehir/hal kapsamını, son güncellemeyi ve öne çıkan fiyat değişimlerini özetle.
- [ ] Analiz yazısında başta 2–4 cümlelik bulgu özeti; devamında yöntem/kaynak sınırları ver.
- [ ] Cevap bloklarına stabil HTML anchor/ID ekle.
- [ ] İstatistiklerin görünür tablo ve Dataset/Article verileriyle tutarlı olmasını otomatik test et.
- [ ] “Bugün”, “güncel” gibi ifadeleri makine-okunur kesin tarihle destekle.
- [ ] AI platform benchmark'ını değişiklik öncesi/sonrası aynı sorgularla çalıştır.

### 5.2 Yazar ve yayın şeffaflığı

- [ ] Tüm analizlerde görünür byline, yazar profil bağlantısı ve uzmanlık alanını doğrula.
- [ ] `dateModified` gerçek değişiklik tarihinden gelsin; `datePublished` ile yapay olarak eşitlenmesin.
- [ ] Editoryal politika, düzeltme politikası, veri kaynağı politikası ve sahiplik/finansman açıklaması ekle.
- [ ] Otomatik üretilen haftalık raporları görünür biçimde etiketle; insan kontrol sürecini açıkla.
- [ ] İletişim sayfasında kurumsal e-posta ve sorumlu kişi/kurum bilgilerini netleştir.

### 5.3 Veri ürünleri ve schema kalitesi

- [ ] Ürün sayfalarındaki mevcut `Dataset` şemasını URL örneklemiyle doğrula; rapordaki “ekle” önerisini güncelle.
- [ ] Dataset'te `dateModified`, `temporalCoverage`, `spatialCoverage`, `distribution`,
  `license`, `isAccessibleForFree`, `creator`, `measurementTechnique` alanlarını değerlendir.
- [ ] API/OpenAPI ve indirilebilir CSV/JSON dağıtımlarını `DataDownload` ile bağlamayı değerlendir.
- [ ] Fiyatı `Product/Offer` olarak işaretlemenin semantik uygunluğunu kontrol et; hal fiyatı perakende satış teklifi değildir.
- [ ] Schema.org validator ve Google Rich Results Test sonuçlarını URL bazında arşivle.
- [ ] Search Console enhancement hatalarını haftalık takip et.

### 5.4 Marka otoritesi — kanıta dayalı plan

- [ ] Mevcut referring domains, kaliteli dofollow linkler, unlinked mentions ve branded search baseline'ı çıkar.
- [ ] En az 5 gerçek organik rakiple karşılaştırmalı gap analizi yap.
- [ ] data.gov.tr/Kaggle gibi platformlara veri koymadan önce lisans, güncelleme ve kaynak doğruluğu sürecini hazırla.
- [ ] GitHub'da örnek istemciler, notebook ve API kullanım senaryoları yayınla.
- [ ] Postman collection + OpenAPI doğrulama + changelog + API versioning ekle.
- [ ] Aylık/haftalık özgün veri bültenleri için basın listesi, pitch ve kazanılan mention takibi kur.
- [ ] Wikipedia maddesini hedef/KPI olarak dayatma; bağımsız kayda değerlik oluşmadan promosyonel madde açma.
- [ ] Reddit/YouTube'u yalnız presence için değil, ölçülebilir içerik ve topluluk planıyla ele al.

---

## 6. P2 — Teknik SEO'da raporun hiç ele almadığı kontroller

- [ ] GSC Coverage/Page Indexing: keşfedildi-taranmadı, tarandı-indekslenmedi, duplicate/canonical dağılımı.
- [ ] Sitemap URL'lerinin yalnız kanonik, 200, indexable URL'ler olduğunu doğrula.
- [ ] Sitemap `<lastmod>` değerlerinin gerçek içerik değişikliğiyle güncellendiğini doğrula.
- [ ] Parametreli filtre URL'leri, `_rsc`, pagination ve faceted navigation crawl bütçesini incele.
- [ ] 3xx/4xx/5xx iç linkleri ve redirect chain'leri tam crawl ile çıkar.
- [ ] Orphan ürün/hal/analiz sayfalarını bul.
- [ ] İç link derinliği ve anchor text dağılımını ölç.
- [ ] Title/description/H1 duplicate, missing ve truncation envanteri çıkar.
- [ ] Canonical ve hreflang reciprocal/self-reference doğrulaması yap.
- [ ] `www`, HTTP, trailing slash, locale ve büyük/küçük harf varyantlarını test et.
- [ ] Soft-404, boş fiyat sayfaları ve eski/bayat veri sayfaları için indexleme politikasını tanımla.
- [ ] News sitemap yaş/tarih kurallarını ve yalnız uygun analiz URL'lerini içerdiğini doğrula.
- [ ] Log analiziyle Googlebot/Bingbot/AI bot crawl sıklığı, 4xx/5xx ve response time raporu çıkar.
- [ ] Görsel sitemap/görsel indeksleme ve OG görsellerinin durumunu kontrol et.
- [ ] JavaScript hata oranı, hydration hatası ve client-side navigation regresyonlarını izle.
- [ ] Cache politikasını gözden geçir; ana sayfadaki `private, no-cache, no-store` seçiminin performans maliyetini ölç.
- [ ] Brotli/gzip, CDN/edge cache, immutable static assets ve HTTP/3 fırsatını ölç.
- [ ] Accessibility 97 ve Best Practices 96 kayıplarının tekil audit maddelerini raporla.
- [ ] Güvenlikte TLS sürümü/cipher, SRI, dependency audit ve security.txt kontrollerini ekle.

---

## 7. P2 — KPI ve izleme planı

- [x] “GEO skoru”nu tek başarı metriği yapma.
- [ ] GSC generative AI raporu erişilebiliyorsa AI Overviews/AI Mode impression, page, device ve country baseline'ı al.
- [ ] GSC Web arama: non-brand clicks, impressions, CTR ve average position'ı sayfa grubu bazında izle.
- [ ] GA4: organic landing, engaged session, API signup, alarm kurma ve diğer dönüşümleri izle.
- [ ] AI platformlarından gelen referrer trafiğini ayrı kanal grubunda izle.
- [ ] Aylık sabit prompt benchmark'ında citation/link/brand mention oranı tut.
- [x] Schema valid URL oranı, indexable sitemap oranı ve CWV good URL oranını operasyonel KPI yap.
- [ ] Marka otoritesi için kaliteli referring domain, bağımsız mention ve branded query trendini izle.
- [x] Her KPI için baseline, hedef, veri kaynağı, owner ve kontrol sıklığı tanımla.
- [ ] 30/60/90 gün sonunda yalnız skor değil, iş sonucu ve regresyon raporu yayınla.

---

## 8. PDF ve sunum kalitesi eksikleri

- [ ] PDF'ye içindekiler ve tıklanabilir bölüm bağlantıları ekle.
- [ ] Başlık, konu, yazar ve anahtar kelime PDF metadata'sını doldur; mevcut metadata “anonymous”.
- [ ] PDF'yi tagged/accessible üret; mevcut dosya tagged değil.
- [ ] Dil metadata'sını Türkçe olarak tanımla.
- [ ] Letter yerine hedef kitleye uygun A4 sayfa boyutu değerlendir.
- [ ] Sayfa 2'deki aşırı boş alanı azalt veya yönetici skor kartıyla birleştir.
- [ ] Sayfa 14'teki boş içeriği düzelt.
- [ ] Sayfa 16'daki aşırı boş alanı kaldır; sonraki adım/iletişim/teslimatlar ekle veya sayfayı birleştir.
- [ ] Tablo satırlarında kelime bölünmelerini düzelt: `Google-Extende / d`,
  `GELİŞTİRİLEBİ / LİR` vb.
- [ ] Terimler sözlüğündeki kapanmayan parantez ve taşma sorunlarını düzelt.
- [ ] Grafiklerde veri etiketi, açıklama ve erişilebilir alternatif metin sağla.
- [ ] Kaynak standartlarına doğrudan bağlantı ve sürüm/tarih ekle.
- [ ] “Hiçbir bulgu tahmine dayanmaz” ifadesini kaldır; raporda “muhtemel nedenler” ve algoritmik skorlar var.
- [ ] “Gerçek ölçüm” ile “lab/sentetik ölçüm”, “canlı kontrol” ve “algoritmik tahmin” etiketlerini ayır.
- [ ] Kişisel Gmail yerine kurumsal e-posta kullanmayı değerlendir.
- [ ] Revizyon numarası ve change log ekle.

---

## 9. Önerilen uygulama sırası

1. **Rapor doğruluğu:** boş yol haritası, ham kanıt, skor metodolojisi ve yanlış bulgular.
2. **Ölçüm baseline'ı:** CrUX/GSC/RUM, gerçek AI sorgu benchmark'ı, backlink/entity baseline.
3. **Kesin site düzeltmeleri:** tek H1, mobil performans kök nedenleri, SPF/DMARC, CSP geçişi.
4. **İçerik/GEO:** sorgu-sayfa haritası, cevap blokları, editoryal şeffaflık, veri schema zenginliği.
5. **Otorite:** özgün veri dağıtımı, geliştirici ekosistemi, basın/bağımsız mention programı.
6. **90 gün denetimi:** teknik KPI + organik sonuç + gerçek AI görünürlüğü birlikte yeniden ölçülür.

## 10. Temel resmi referanslar

- [Google: Google-Extended'ın Google Search'e etkisi yoktur](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers)
- [Google/web.dev: CWV öncelikle alan metriğidir; Lighthouse INP ölçmez](https://web.dev/articles/vitals)
- [Google/web.dev: Lab ve field verisi neden farklıdır](https://web.dev/articles/lab-and-field-data-differences)
- [Google: Article structured data rehberi](https://developers.google.com/search/docs/appearance/structured-data/article)
- [Google: FAQ rich result kapsam değişikliği](https://developers.google.com/search/blog/2023/08/howto-faq-changes)
- [Google: Generative AI Search performans raporu](https://support.google.com/webmasters/answer/16984139)
