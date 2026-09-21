# HaldeFiyat — Harmanapps Üstünlüğünü Kapatma Analizi ve Uygulama Checklist'i

**Karar tarihi:** 21 Eylül 2026

**Durum:** Faz 0 kabul edildi; Faz 1 ve ortak Faz 3/4 sunum partisi `27d6511f` ile canlı gözlemde; Faz 2 kurumsal erişime bağlı, Faz 5 rol analizi tamamlandı

**Hedef repo:** `tarim-dijital-ekosistem/projects/hal-fiyatlari`

**Kapsam:** Organik arama görünürlüğü, resmî fiyat kaynağı tazeliği, sayfa performansı ve sorgu–sayfa eşleşmesi

**Kapsam dışı:** Sosyal medya yayını, reklam harcaması, ücretli sıralama/API sağlayıcısı, rakip içeriğini kopyalama ve sıralama garantisi

## Yönetici özeti

Harmanapps ile farkın kapatılma şansı vardır; ancak 24 sorgunun tamamı aynı problem değildir ve tek bir “SEO metni” müdahalesiyle çözülmez.

21 Eylül tarihli Tanitio/Brave keşfinde Harmanapps, karşılaştırılabilen 29 sorgunun 24'ünde HaldeFiyat'ın önündedir; HaldeFiyat 5 sorguda öndedir. Bu, rekabet alarmıdır fakat Google sıralaması değildir. Google için esas ölçüm, Search Console'ın Türkiye + mobil + Web + kesinleşmiş verisidir.

Gerçek öncelik sırası şöyledir:

1. **Üzümdeki ani kaybın kök nedenini bul:** Ortalama konum yaklaşık 4,9'dan 13,6'ya, gösterim 147'den 18'e düştü. Önce teknik/ölçümsel/mevsimsel neden ayrılmadan sayfaya müdahale edilmemeli.
2. **Mersin veri kaynağını çöz veya kurumsal olarak bloke olduğunu belgele:** HaldeFiyat'taki son resmî kayıt 22 Haziran 2026 iken rakip 19 Eylül tarihli liste gösteriyor. Burada içerik değil veri tazeliği kaybettiriyor.
3. **İstanbul/Bayrampaşa sayfasını hafiflet ve cevabı öne taşı:** HaldeFiyat'ın kaynak, yöntem ve karşılaştırma değeri daha yüksek; ancak yaklaşık 1,39 MB sunucu HTML'i ve çok uzun ürün listesi temel cevabı geciktiriyor.
4. **Konya–Denizli–Kocaeli–Bursa–Gaziantep hızlı kazanım paketi:** Bu sorgularda HaldeFiyat Google'da zaten yaklaşık 2–4 bandında. Küçük, ortak ve ölçülebilir bir sunum iyileştirmesi en hızlı getiriyi burada sağlayabilir.
5. **Limon kümesinde sayfa rollerini netleştir:** Genel ürün, şehir+ürün, çeşit ve tarihli piyasa analizi sayfaları aynı sorgularda görünüyor. Bu durum tek başına kanibalizasyon kanıtı değildir; sorgu–sayfa verisiyle yönlendirme yapılmalıdır.

Mevcut sistemde canonical, `robots`, kaynak/tarih, AnswerBlock, SSS, şehir–ürün bağlantıları ve veri güvencesi bileşenleri zaten vardır. Checklist bunları yeniden eklemeyi değil, doğru sayfada doğru niyet ve taze veriyle çalıştırmayı hedefler.

## Onaylanan uygulama sırası

| Sıra | Faz | Karar | Neden |
|---:|---|---|---|
| 0 | Ölçüm sözleşmesi ve başlangıç kaydı | Önkoşul | Sonuçları birbirinden farklı tarih/cihaz/motor verileriyle yanlış yorumlamamak |
| 1 | Üzüm ani kayıp teşhisi | P0 | En sert ve en ani kayıp; kör içerik değişikliği riski yüksek |
| 2 | Mersin resmî veri kaynağı | P0 | Rakiple arasındaki fark doğrudan veri tarihi ve kapsamından geliyor |
| 3 | İstanbul/Bayrampaşa ilk ekran ve sayfa ağırlığı | P1 | En yüksek gösterim kümelerinden biri; mevcut güçlü içeriğin erişilebilirliği zayıf |
| 4 | Hızlı şehir kazanımları | P1 | Konum 2–4 bandında; ilk üç/ilk sıra kazanımı görece yakın |
| 5 | Limon sorgu–sayfa rolleri | P1 | Yüksek gösterim var; trafik birden fazla niyet ve sayfaya dağılıyor |
| 6 | Kaynak gösterilebilir benzersiz veri ürünleri | P2 | Rakibin kolay kopyalayamayacağı kalıcı otorite ve doğal atıf alanı |

Fazlar aynı anda topluca canlıya alınmayacaktır. Faz 1 ve 2 teşhisleri paralel yürütülebilir; kullanıcıya görünen SEO/sunum değişiklikleri ölçülebilir partiler halinde çıkarılacaktır.

## 1. Kanıt ve ölçüm sözleşmesi

### 1.1 Tanitio/Brave karşılaştırması

- Koşu: 21 Eylül 2026, 13:19.
- Arama motoru: Brave.
- Kapsam: 30 sabit sorgu, ilk 20 sonuç.
- Harmanapps: 29 sorguda görünür, ortalama tarama konumu 4,6, ilk üçte 17 sorgu.
- İkili karşılaştırma: rakip 24 sorguda önde, HaldeFiyat 5 sorguda önde.
- Bu sayı **Google sırası, Google trafik payı veya gerçek pazar payı değildir**.
- Yeni koşular yalnız aynı motor, aynı sorgu listesi ve aynı derinlikle önceki koşuyla kıyaslanır.

### 1.2 Google Search Console karşılaştırması

Esas başlangıç penceresi:

- Güncel dönem: **13–18 Eylül 2026**.
- Önceki eş dönem: **6–11 Eylül 2026**.
- Arama türü: Web.
- Ülke: Türkiye.
- Cihaz: Mobil.
- Veri durumu: Final.
- Boyut: Öncelikle `query`; teşhis gerektiğinde `query + page` ve günlük kırılım.

Önemli yorum kuralları:

- GSC ortalama konumu, kullanıcıların her aramasında görülen sabit sıra değildir; en üstte görünen sonucun ortalamasıdır.
- `query + page` kırılımındaki gösterimler sayfalar arasında toplanıp mülk toplamı gibi sunulmaz.
- Rakibin GSC verisi elimizde olmadığı için rakibin tıklaması, CTR'ı veya Google trafiği tahmin edilmez.
- Altı günlük pencere teşhis için hızlı sinyaldir; sonuç kararı için 14 ve 28 günlük eş dönem gerekir.
- 18 Eylül'de çıkan son SEO/veri güvencesi değişikliklerinin etkisi bu başlangıç penceresinden kesin olarak çıkarılamaz.

Google'ın metrik tanımları:

- [Search Console performans raporu](https://support.google.com/webmasters/answer/7576553?hl=tr)
- [Gösterim, konum ve tıklama tanımları](https://support.google.com/webmasters/answer/7042828?hl=tr)
- [Arama analizi veri farklılıkları](https://support.google.com/webmasters/answer/17011364?hl=tr)

### 1.3 Teknik başlangıç

- Yerel belge hazırlanırken repo HEAD: `1d1a0611`.
- İncelenen canlı kod HEAD: `2fc0de78`.
- Son canlı değişiklikler; trend kararlılığı, ürün sayfasındaki çelişkili hareket verisi, kaynak güvencesi ve alıntılanabilir cevap bloklarını içeriyor.
- İstanbul canlı sayfası tek HTTP ölçümünde yaklaşık **1.392.111 bayt**, TTFB **1,043 sn**, toplam **1,324 sn** verdi. Bu bir laboratuvar serisi değil, optimizasyon gereğini gösteren başlangıç sondasıdır.
- Harmanapps doğrudan HTTP istemcisine 403 döndürdüğü için rakibin HTML ağırlığı veya TTFB değeri hakkında adil kıyas kurulamaz.

## 2. Mevcut Google başlangıç tablosu

| Sorgu | Tıklama | Gösterim | CTR | Ort. konum | Önceki konum | Yorum |
|---|---:|---:|---:|---:|---:|---|
| bayrampaşa hal fiyatları | 45 | 402 | %11,19 | 2,73 | 2,91 | Güçlü; ilk sıra fırsatı |
| istanbul hal fiyatları | 48 | 1.280 | %3,75 | 4,30 | 3,99 | Yüksek hacim; sayfa sunumu P1 |
| istanbul hal fiyatları bugün | 17 | 275 | %6,18 | 4,86 | 4,55 | Hafif gerileme |
| istanbul sebze hali fiyatları | 20 | 244 | %8,20 | 4,58 | 4,67 | Stabil/ufak iyileşme |
| bayrampaşa meyve sebze hali fiyat listesi | 21 | 164 | %12,80 | 3,07 | 3,38 | Güçlü niyet eşleşmesi |
| konya hal fiyatları | 28 | 396 | %7,07 | 2,12 | 2,12 | Hızlı kazanım adayı |
| denizli hal fiyatları | 5 | 228 | %2,19 | 3,01 | 2,93 | Hızlı kazanım adayı |
| kocaeli hal fiyatları | 3 | 194 | %1,55 | 3,28 | 3,29 | Konum iyi, CTR zayıf |
| bursa hal fiyatları | 11 | 197 | %5,58 | 3,60 | 3,32 | Hızlı kazanım, hafif gerileme |
| gaziantep hal fiyatları | 19 | 239 | %7,95 | 3,81 | 3,88 | Hızlı kazanım adayı |
| ankara hal fiyatları | 11 | 595 | %1,85 | 4,29 | 3,92 | Yüksek gösterim, CTR zayıf |
| ankara hal fiyatları bugün | 7 | 259 | %2,70 | 4,74 | 4,87 | Ayrı niyet izlenecek |
| mersin hal fiyatları | 4 | 601 | %0,67 | 8,39 | 7,62 | Veri tazeliği kritik |
| üzüm fiyatları | 1 | 18 | %5,56 | 13,56 | 4,87 | Ani görünürlük kaybı; P0 teşhis |
| adana limon fiyatları | 15 | 1.370 | %1,09 | 6,10 | 6,22 | Çok yüksek gösterim, rol dağılımı |
| adana mayer limon fiyatları | 23 | 331 | %6,95 | 6,29 | 6,08 | Çeşit/şehir/analiz ayrımı |
| mersin limon fiyatları | 4 | 472 | %0,85 | 5,85 | 5,86 | Mersin tazeliğinden etkilenebilir |
| limon fiyatları | 15 | 847 | %1,77 | 6,58 | 6,33 | Genel ürün hedefi |
| limon piyasası | 36 | 794 | %4,53 | 5,79 | 5,82 | Ürün + analiz niyeti |
| soğan fiyatları | 5 | 151 | %3,31 | 7,36 | 6,52 | Sonraki ürün paketi |
| elma fiyatları | 3 | 285 | %1,05 | 13,47 | 15,71 | Konum iyileşiyor, CTR düşük |
| salçalık domates fiyatları | 3 | 294 | %1,02 | 7,45 | 7,34 | Çok sayıda şehir sayfası var |
| ankara balık fiyatları bugün | 9 | 292 | %3,08 | 5,02 | 4,31 | Hal sayfasından ayrı niyet kontrolü |
| hal fiyatları | 21 | 730 | %2,88 | 6,30 | 6,49 | Ülke merkezi; P2 |

Not: “Üzüm fiyatları” önceki dönemde 7 tıklama, 147 gösterim ve 4,87 ortalama konumdaydı. Güncel dönemde 1 tıklama, 18 gösterim ve 13,56 konuma düşmesi, listedeki en belirgin alarmdır.

## 3. Rakip farkı: neyi taklit etmeli, neyi etmemeli?

### Harmanapps'ın gözlenen güçlü tarafları

1. **Cevap ilk ekranda:** İstanbul sayfasında tarih, şehir ve kompakt ürün tablosu erken görünür.
2. **Geniş yerel kapsama görünümü:** Mersin örneğinde 19 Eylül tarihli 253 ürün gösterir.
3. **Ürün sayfalarında alıcı niyeti:** Patates ve üzüm sayfalarında şehir karşılaştırmaları, ilan/alıcılık sinyalleri, alarm/aksiyonlar ve SSS birlikte sunulur.
4. **Sorgu başlığına yakın sayfa üretimi:** Şehir, çeşit ve ürün terimleri başlık/H1 ve iç bağlantılarda açık görünür.

### HaldeFiyat'ın korunacak güçlü tarafları

1. **Kaynak ve yöntem şeffaflığı:** Resmî kaynak, kayıt tarihi, çeşit ve ölçüm kapsamı açıklanır.
2. **Güvenli güncellik dili:** Bayat veriye “bugün” denmez; Mersin gibi sayfalarda “Son Liste” korunur.
3. **Ulusal karşılaştırma ve tarihçe:** Şehir/ürün/çeşit ayrımıyla daha derin veri ürünü vardır.
4. **Teknik SEO zemini hazır:** Canonical/redirect, index kapıları, Dataset ve FAQ şemaları, AnswerBlock ve iç bağlantı altyapısı mevcuttur.
5. **Veri kalitesi korumaları:** Bilinmeyen birim ve ürünün otomatik eşleştirilmemesi, kayıt tarihi ve kaynak sağlığı denetimleri vardır.

### Yapılmayacaklar

- [ ] Brave sonucu Google sırası olarak raporlanmayacak.
- [ ] “Şu tarihte #1 olacağız” şeklinde sıralama garantisi verilmeyecek.
- [ ] Rakibin tablosu, fiyatı, metni veya ilanı kopyalanmayacak.
- [ ] Resmî kaynağı bulunmayan fiyat “bugün” veya “güncel” diye yayımlanmayacak.
- [ ] Her sorgu için ince/kapı sayfası açılmayacak.
- [ ] Sorgu–sayfa kanıtı olmadan canonical, redirect, noindex veya sayfa silme yapılmayacak.
- [ ] Farklı tarih, çeşit, kalite veya birimlerden “en ucuz şehir” sonucu çıkarılmayacak.
- [ ] Ücretli API, kredi veya bakiye tüketen sıralama/AI sağlayıcısı kullanılmayacak.
- [ ] Sosyal yayın, reklam veya dış iletişim bu checklist kapsamında yapılmayacak.
- [ ] Bütün başlıklar ve sayfa şablonları tek seferde değiştirilerek ölçüm bozulmayacak.

## FAZ 0 — Başlangıç kaydı ve ölçüm kapısı

**Amaç:** Her değişikliğin öncesi/sonrası aynı tanımla ölçülebilsin.

### İş listesi

- [x] `artifacts/seo/harman-gap-2026-09-21/` altında tarihli çalışma klasörü aç.
- [x] 30 sabit Tanitio sorgusunu ve 21 Eylül Brave sonucunu JSON/CSV olarak sakla.
- [x] GSC 13–18 Eylül ve 6–11 Eylül sorgu snapshotlarını ham JSON olarak sakla.
- [x] Hedef sorgular için `query + page` ve `date + query` kırılımlarını ayrı dosyalara kaydet.
- [x] Her snapshotta property, ülke, cihaz, arama türü, veri durumu, başlangıç ve bitiş tarihi metadata'sı bulunsun.
- [x] Canlı frontend/backend commitlerini, PM2 servislerini ve ölçüm zamanını rapora yaz.
- [x] Hedef URL'lerin canonical, robots, HTTP durum, title, H1, son veri tarihi ve HTML bayt başlangıç kaydını çıkar.
- [x] İstanbul için en az 5 tekrarlı curl ölçümü ve mobil Lighthouse/Chrome ölçümü al; curl medyanını kullan.
- [x] Search Console verisinde sayfa boyutlarını mülk toplamı gibi toplamadığını otomatik kontrol eden küçük doğrulama notu/scripti ekle.

### Kabul kriteri

- [x] Aynı sorgu listesi ve filtrelerle yeniden üretilebilir başlangıç dosyaları var.
- [x] Ölçüm raporunda “gözlem”, “çıkarım” ve “hedef” ayrı etiketlenmiş.
- [x] GSC ve Brave sonuçları aynı metrikte birleştirilmemiş.
- [x] Her hedef sayfa için değişiklik öncesi teknik kayıt mevcut.

### Çıkış kapısı

Faz 0 tamamlanmadan kullanıcıya görünen SEO değişikliği canlıya alınmaz.

## FAZ 1 — Üzüm ani kayıp kök neden analizi

**Hedef URL:** `/urun/uzum`

**Alarm:** Gösterim 147 → 18, ortalama konum 4,87 → 13,56

**İlgili özel sayfa:** `/urun/kuru-uzum` yaş/sofralık üzümden ayrı tutulmalıdır.

### Teşhis hipotezleri

1. **Sorgu karışımı/mevsimsellik:** Kullanıcı niyeti “yaş üzüm”, “kuru üzüm”, çeşit veya üretici fiyatına kaymış olabilir.
2. **Sayfa hedefi değişimi:** Google aynı sorguyu başka HaldeFiyat URL'sine taşımış olabilir.
3. **Index/canonical/redirect problemi:** Ana ürün veya varyant URL'si yanlış canonical, noindex ya da redirect almış olabilir.
4. **Veri tazeliği/kapsam daralması:** Güncel şehir/çeşit sayısı azalmış veya kritik kayıtlar karantinaya alınmış olabilir.
5. **Sunucu/render sorunu:** Bot ve kullanıcı aynı başlık, fiyat, kaynak ve içerik bloklarını alamıyor olabilir.
6. **SERP/rekabet değişimi:** Rakibin güncel şehir karşılaştırması ve alıcı içeriği sorgu niyetini daha iyi karşılıyor olabilir.
7. **Kısa pencere anomalisi:** Altı günlük dönem tek başına yapısal kaybı kanıtlamıyor olabilir.

### İş listesi

- [x] GSC'de son 90 günü günlük `query` kırılımıyla çıkar; düşüşün başladığı günü belirle.
- [x] `üzüm fiyatları`, `uzum fiyatlari`, `yaş üzüm fiyatları`, `sofralık üzüm fiyatları`, `kuru üzüm fiyatları` ve öne çıkan çeşitleri ayrı izle.
- [x] `query + page` kırılımında `/urun/uzum`, `/urun/kuru-uzum`, şehir+ürün ve analiz URL'lerinin payını incele.
- [x] URL Inspection veya mevcut GSC index uçlarıyla canlı/indexlenmiş canonical, son tarama ve index durumunu kaydet.
- [x] Sunucu HTML'inde title, description, H1, canonical, robots, AnswerBlock, güncel tarih, fiyat ve kaynak alanlarını doğrula.
- [x] `/urun/uzum` ile `/urun/kuru-uzum` arasında niyet ayrımının title/H1/ilk cevap/iç bağlantıda açık olduğunu kontrol et.
- [x] Üzüm ürün ailesi, canonical varyant ve `familySlug` kayıtlarını DB'de doğrula; yanlış birleşme veya alias zinciri arama.
- [x] Son 30 günlük üzüm ETL satır sayısını; şehir, çeşit, kaynak, birim ve karantina nedeni bazında karşılaştır.
- [x] Sitemapte URL'nin bulunduğunu, `lastModified` değerinin gerçek veri güncelliğini aşmadığını kontrol et.
- [ ] Erişim loglarında Googlebot 4xx/5xx, timeout ve anormal yanıt boyutu olup olmadığını incele.
- [ ] Aynı tarihte Harmanapps üzüm sayfasının görünen şehir/kapsam/cevap yapısını yalnız ürün kararı açısından kaydet; içerik kopyalama.

### Karar ağacı

- [ ] **Teknik index/canonical hatası bulunursa:** Önce onu düzelt, içerik değişikliğini ertele.
- [ ] **Veri kapsamı düşmüşse:** ETL/kaynak sorunu çözülmeden başlık/metin değişikliği yapma.
- [ ] **Sorgu başka doğru URL'ye kaymışsa:** Küme toplam tıklamasını kontrol et; yalnız URL değişti diye sorun ilan etme.
- [x] **Mevsimsellik/ölçüm anomalisi baskınsa:** 14 günlük final veriyi bekle, kör patch çıkarma.
- [x] **Niyet açığı doğrulanırsa:** İlk cevapta yaş/sofralık üzüm, çeşitler, güncel şehir sayısı ve kaynak tarihini kompaktlaştır; yeni ince sayfa açma.

### Kabul kriteri

- [x] Kayıp nedeni `teknik`, `veri`, `niyet`, `mevsimsellik/SERP` veya `ölçüm anomalisi` sınıflarından biri/birkaçıyla kanıtlanmış.
- [x] Teşhis dosyasında günlük tablo, hedef URL dağılımı ve index kanıtı var.
- [x] Yapılan düzeltme, teşhis edilen nedenle doğrudan eşleşiyor.
- [x] `/urun/uzum` ve `/urun/kuru-uzum` birbirinin niyetini çalmıyor; canonical'ları kendilerine ait ve semantik ayrım görünür.
- [x] Canlı kabulde HTTP 200, doğru canonical, indexlenebilirlik ve gerçek son veri tarihi doğrulanmış.

## FAZ 2 — Mersin resmî veri kaynağı ve tazelik

**Hedef URL:** `/hal/mersin-hal`

**Mevcut HaldeFiyat verisi:** 22 Haziran 2026, 106 ürün; bayat olduğu açıkça işaretli.

**Rakip gözlemi:** Harmanapps 19 Eylül 2026 tarihli, 253 ürünlük liste gösteriyor.

**Kod gerçeği:** `mersin_resmi` adaptörü WAF 403 nedeniyle `defaultEnabled: false`; ev/VPS/bulut/gerçek Chromium denemelerinin 403 verdiği kaynak kod notlarında kayıtlı.

### Temel karar

Rakibin sayfasını veri kaynağı yapmayacağız. Önce Mersin Büyükşehir Belediyesi veya yetkili HKS/kurumsal veri yolu bulunacak. Resmî güncel akış elde edilemiyorsa sayfa eski veriyi dürüstçe göstermeye devam edecek; “bugün” iddiası üretilmeyecek.

### İş listesi — kaynak keşfi

- [x] Mersin Belediyesi sayfasını gerçek Chromium ile yeniden incele; WAF ana belgeyi HTTP 403 ile engellediği için ağ/form keşfi bu noktada bloke.
- [x] `backend/src/config/source-urls.ts`, `backend/src/config/etl-sources.ts` ve `backend/src/modules/etl/fetcher.ts` içindeki mevcut sözleşmeyi doğrula.
- [x] Eski `/hal-fiyatlari-day` POST akışının alanlarını ve kategori kodlarını mevcut kaynak kodu/notlarla karşılaştır; çalışan sayfa WAF nedeniyle alınamadı.
- [x] Belediye tarafından yayımlanan PDF, XLS/XLSX, CSV, açık veri portalı, e-belediye veya arşiv uçlarını ara; doğrulanabilir alternatif bulunamadı.
- [ ] `hal.gov.tr` ve Ticaret Bakanlığı HKS'nin şehir/hal kırılımını gerçekten verip vermediğini güncel olarak doğrula; yalnız ulusal seri varsa Mersin yerine kullanma.
- [ ] Rakibin görünen “kaynak” beyanını kaydet; fakat rakip HTML/API'sini kalıcı veri kaynağı olarak bağlama.
- [x] Teknik erişim hâlâ kapalıysa Mersin Belediyesi/Hal Müdürlüğü için IP izin listesi, veri paylaşım talebi veya bilgi edinme başvuru metni hazırla.
- [x] Her denemeyi tarih, URL, yöntem, HTTP durumu ve sonuçla repo raporuna yaz; proxy denemesini varsayılan çözüm sayma.

### İş listesi — akış bulunursa

- [ ] Yeni erişim yolunu mevcut `EtlSourceConfig` ve `FetchOutcome` sözleşmesine bağla; paralel ayrı ETL kurma.
- [ ] Ham tarih, ürün adı, çeşit, min, max, birim, kategori ve kaynak URL'sini koru.
- [ ] “İstek tarihi”ni “kayıt tarihi” diye yazma; tarih kaynaktan doğrulanamıyorsa güncel veri olarak kabul etme.
- [ ] Bilinmeyen birim/ürünleri mevcut canonical review kuyruğuna gönder; otomatik `kg` tahmini yapma.
- [ ] Boş/eksik kategori yanıtını tam başarı sayma; sebze ve meyve kapsamını ayrı doğrula.
- [ ] Fiyat uç değerlerini kalite filtresinden geçir; karantina nedeniyle tüm akışın sessizce sıfırlanmadığını raporla.
- [ ] Aynı tarih ve kaynak için idempotent yeniden çalıştırmayı doğrula.
- [ ] Backfill yapılıyorsa her günün gerçek kaynak tarihini koru ve yeni veriyle eski veriyi ezme.
- [ ] `backend/test/etl/` altında parser fixture'ı, tarih ve kategori kapsamı testi ekle.
- [x] `backend/test/source-health.test.ts` ile halka açık sağlık özetinin ham hata/sır sızdırmadığını doğrula.

### Bloke kalırsa yapılacaklar

- [x] Kaynağın erişim engelini ve son başarılı kayıt tarihini görünür biçimde koru.
- [x] Sayfa title/description/H1'de “Bugün” kullanma; “Son Liste” sözleşmesini bozma.
- [ ] Başka şehrin veya Türkiye ortalamasının verisini Mersin diye göstermeme testini ekle.
- [x] Kurumsal erişim talebi için sahibi, gönderim durumu ve takip aralığını repo raporuna yaz.
- [x] “Teknik olarak bloke” sonucu, “iş yapılmadı” olarak değil kanıtlı durum olarak kapatılabilir; sahte veriyle geçici çözüm üretilemez.

### Kabul kriteri

- [ ] Başarılı senaryoda canlı sayfada resmî, doğrulanmış, tarihli ve birimli Mersin satırları var.
- [ ] Kaynak URL'si, veri tarihi, çekim zamanı ve satır sayısı ETL logunda izlenebilir.
- [x] Başarısız senaryoda son resmî tarih dürüstçe gösteriliyor ve engel/kurumsal takip kanıtı mevcut.
- [x] Hiçbir senaryoda rakip sayfa kaynak olarak kullanılmıyor veya eski satırlar bugünün tarihiyle yeniden yazılmıyor.

## FAZ 3 — İstanbul/Bayrampaşa ilk ekran ve sayfa ağırlığı

**Hedef URL:** `/hal/istanbul-hal-ibb`

**Mevcut değer:** 18 Eylül doğrulaması, 94 ürün, 21 hal ile ulusal karşılaştırma, resmî kaynak ve ayrıntılı SSS.

**Sorun:** Cevap ve güven içeriği var; fakat çok uzun ürün/listing içeriği içinde temel fiyat cevabı geç görünür ve HTML ağırdır.

### Tasarım ilkesi

SEO içeriğini silmek değil, kullanıcı görevini katmanlandırmak:

1. H1 + gerçek veri tarihi + resmî kaynak.
2. En çok aranan 10–15 üründen kompakt tablo.
3. Tüm güncel ürünlere erişim.
4. Eski/arşiv kayıtları ayrı görünüm.
5. Ulusal karşılaştırma, yöntem, SSS ve iç bağlantılar.

### İş listesi

- [x] Sunucu HTML'ini blok/görünüm bazında ölç: kompakt güncel görünüm, tüm güncel kayıtlar ve 100 satırlık arşiv ayrı kaydedildi.
- [x] İlk 10–15 ürün seçimini sabit editoryal tahminle değil, doğrulanmış arama talebi + mevcut güncel kayıt kapsamasıyla yap.
- [x] Kompakt tabloda ürün/çeşit, min–maks, birim, kayıt tarihi ve kaynak bağlamını koru.
- [x] Aynı ürün ailesindeki çeşitleri tek fiyat gibi birleştirme; özet ile ayrıntı arasındaki yöntem farkını açıkla.
- [x] Eski kayıtları güncel tablodan ayır; arşiv erişilebilir ve taranabilir kalsın.
- [x] Tüm güncel ürün listesini server-side erişilebilir tut; yalnız istemci JavaScript'ine bağlı görünmez içerik üretme.
- [x] Çok uzun alt listeler için server pagination ve ayrı sorgu-parametreli arşiv görünümünü uygula.
- [x] Ana fiyat cevabı, tarih ve kaynak mobilde ilk anlamlı bölümde görünsün.
- [x] 320 px genişlikte tablo, başlıklar ve aksiyonlar global yatay taşma üretmesin.
- [x] Klavye erişimi, başlık hiyerarşisi ve tablo semantiğini koru.
- [x] Canonical, robots, Dataset/FAQ şeması ve görünür SSS birebirliğini canlı SSR kabulünde doğrula.
- [x] Değişiklikten önce/sonra 5 tekrarlı HTML baytı/TTFB ve mobil performans ölçümü al.

### Önerilen performans koridoru

- İlk iterasyonda hedef: sunucu HTML ağırlığını **en az %40 azaltmak** veya neden azaltılamadığını blok bazında kanıtlamak.
- Bu oran bir Google sıralama garantisi değildir; mevcut yaklaşık 1,39 MB başlangıç değerine karşı operasyonel guardrail'dir.
- İçerik kaybı, yanlış tarih veya yalnız JS ile erişilen temel fiyat tablosu pahasına hedef tutturulmaz.

### Kabul kriteri

- [x] Mobil ilk bölümde şehir, son resmî tarih, kaynak ve kompakt fiyat cevabı görünür.
- [x] Güncel ve eski kayıtlar görsel/semantik olarak ayrılmış.
- [x] Sunucu HTML'inde temel fiyat tablosu ve kaynak bilgisi var.
- [x] HTML ağırlığı/TTFB/LCP önce–sonra aynı koşullarda raporlanmış; HTML %73,7 azalırken Lighthouse LCP medyanı kötüleştiği için teknik takip açık.
- [x] HTTP 200, doğru canonical, indexlenebilirlik, JSON-LD doğruluğu ve 320 px görünüm doğrulanmış.
- [x] Bayrampaşa sorgularında iyi çalışan SSS, kaynak ve iç bağlantılar kaybolmamış.

## FAZ 4 — Konya, Denizli, Kocaeli, Bursa ve Gaziantep hızlı kazanım paketi

### Hedef sayfalar

- `/hal/konya-hal`
- `/hal/denizli-hal`
- `/hal/kocaeli-hal-merkez`
- `/hal/bursa-hal`
- `/hal/gaziantep-hal`

Sluglar canlı market kaydıyla ayrıca doğrulanacak; varsayılan isimle kör deploy yapılmayacaktır.

### Neden bu grup?

- Konya 2,12; Denizli 3,01; Kocaeli 3,28; Bursa 3,60; Gaziantep 3,81 ortalama konumdadır.
- Kocaeli'nin %1,55 CTR'ı konumuna göre özellikle zayıftır.
- Bu sayfalar sıfırdan otorite inşa etmek yerine mevcut güçlü konumu tıklama ve cevap kalitesiyle büyütme fırsatı verir.

### Uygulama modeli

Tek tek kopyalanmış şehir metinleri yerine `hal/[slug]/page.tsx` içindeki ortak veri/sunum sözleşmesi geliştirilecek. Şehre özel editoryal bilgi yalnız doğrulanabilir kaynak varsa `market-content.ts` üzerinden korunacaktır.

### Parti A — Konya, Denizli, Kocaeli

- [x] Her sayfanın gerçek son kayıt tarihini, ürün sayısını ve kaynak sağlığını doğrula.
- [x] İlk cevapta şehir, tarih, fiyat aralığının ölçüm kapsamı ve kaynak açık olsun.
- [x] En çok talep gören güncel ürünler kompakt sunulsun; bayat/eksik ürünler “bugün” tablosuna karışmasın.
- [x] Title/H1 değişikliği ancak GSC sorgu niyeti mevcut metinle uyuşmuyorsa yapılsın; bu partide değiştirilmedi.
- [ ] Kocaeli için snippet/CTR hipotezi yaz; title değişikliği tek değişkenli ölçülsün.
- [ ] Ulusal karşılaştırmada aynı ürün/çeşit/birim/tarih koşulunu doğrula.
- [ ] İlgili şehir–ürün bağlantıları gerçek index eşiğini geçen sayfalara gitsin.
- [ ] Parti A'yı canlıya aldıktan sonra 14 günlük final veri oluşmadan Parti B'nin title/H1 değişikliklerini canlıya alma.

### Parti B — Bursa, Gaziantep

- [ ] Parti A'nın teknik ve organik guardrail'lerini incele.
- [x] Ortak bileşeni Bursa ve Gaziantep'e aynı şablon yoluyla uygula; şehir bazlı kopya kod üretme.
- [x] Kaynak tazeliği, kayıt sayısı ve sayfa ağırlığını başlangıç kaydında doğrula.
- [ ] Bursa'nın 3,32 → 3,60 gerilemesini günlük seriyle kontrol et.
- [x] Gaziantep'in güçlü CTR'ını bozacak gereksiz title deneyi yapma.

### Kabul kriteri

- [x] Her sayfada görünen tarih gerçek kaynak tarihiyle aynı.
- [x] Farklı birim ve çeşitlerden sahte tek fiyat üretilmiyor.
- [x] Ortak kod yolu kullanılıyor; şehir başına şablon kopyası yok.
- [ ] 14 gün sonra eş günlerle ilk okuma, 28 gün sonra ana değerlendirme yapılmış.
- [ ] Küme toplam gösterim/tıklaması, sayfa bazlı CTR ve ilk üçte kalıcılık birlikte raporlanmış.

## FAZ 5 — Limon sorgu–sayfa rolü ve iç bağlantı sözleşmesi

### Önerilen niyet haritası

| Kullanıcı niyeti | Birincil sayfa türü | Örnek hedef |
|---|---|---|
| Türkiye genelinde limon fiyatı | Genel ürün | `/urun/limon` |
| Belirli şehirde limon | Şehir + ürün | `/fiyat/adana/limon` |
| Belirli çeşit | Çeşit ürün | `/urun/limon-mayer` |
| Belirli şehir + çeşit / piyasa yorumu | Tarihli piyasa/analiz | `/piyasa/adana-mayer-limon`, ilgili Erdemli analizi |
| Belediye hal listesi | Hal sayfası | İlgili `/hal/...` sayfası |

### Mevcut kanıt

- `adana limon fiyatları` sorgusunda `/fiyat/adana/limon`, `/urun/limon` ve `/urun/limon-mayer` birlikte görünüyor.
- `adana mayer limon fiyatları` sorgusunda çeşit, genel ürün, piyasa analizi ve şehir sayfaları birlikte görünüyor.
- `limon piyasası` sorgusunda genel ürün ve tarihli piyasa/analiz sayfaları birlikte görünüyor.
- Bu dağılım tek başına kanibalizasyon değildir; Google farklı kullanıcı niyetlerine farklı sayfalar gösterebilir.

### İş listesi

- [x] Son 90 günlük `query + page + date` verisiyle her limon sorgusunun baskın URL'sini ve zaman içindeki değişimini çıkar.
- [x] Mülk toplamı, küme toplamı ve URL payını ayrı hesapla; sayfa gösterimlerini yanlış toplama.
- [x] Her sayfanın title, H1, ilk cevap, breadcrumb ve iç bağlantı metninin yukarıdaki role uyduğunu denetle.
- [ ] `/urun/limon` içinde şehir ve çeşit seçimini; `/fiyat/adana/limon` içinde şehir bağlamını; `/urun/limon-mayer` içinde çeşit bağlamını belirginleştir.
- [ ] Tarihli analiz sayfalarını “bugünkü fiyat tablosu” gibi sunma; rapor tarihi ve kapsamı görünür olsun.
- [ ] Genel “limon fiyatları” iç bağlantıları `/urun/limon`a; şehirli metinler şehir+ürün sayfasına; Mayer metinleri çeşit sayfasına gitsin.
- [x] Var olan canonical/redirect zincirlerini `scripts/seo/product-canonical-map.mjs` ile kontrol et.
- [ ] İnce/tekrarlı sayfalarda index kapısını sırf sıralama için açma.
- [ ] Canonical birleştirme veya redirect yalnız iki URL aynı gerçek varlığı temsil ediyorsa uygulanmalı; farklı niyetleri birleştirme.
- [ ] Her title/H1 deneyi tek parti halinde ve geri alınabilir biçimde çıkarılsın.

### Kabul kriteri

- [x] Her ana sorgu için birincil hedef ve ikincil destek sayfaları belgelenmiş.
- [ ] Küme toplam organik tıklaması düşmeden doğru sayfanın tıklama/gösterim payı güçlenmiş veya neden güçlenmediği kanıtlanmış.
- [ ] Canonical, redirect ve noindex değişiklikleri URL bazlı kanıt ve rollback notuyla yapılmış.
- [ ] Şehir, çeşit ve tarihli analiz niyetleri kullanıcıya ilk ekranda anlaşılır.

## FAZ 6 — Taklit edilmesi zor kaynaklı veri ürünleri

Bu faz, önceki teknik ve veri açıkları kapandıktan sonra başlar.

### İş listesi

- [ ] Aynı ürün/çeşit/birim/tarih sözleşmesiyle indirilebilir CSV tabloları sun.
- [ ] Kaynak, güncelleme tarihi, yöntem ve lisans bilgisini Dataset şemasında görünür içerikle eşleştir.
- [ ] Haber, oda ve araştırmacıların alıntılayabileceği tarihli “haftalık şehir farkı” tabloları oluştur.
- [ ] Gömülebilir grafik/tabloda HaldeFiyat kaynak bağlantısını ve ölçüm tanımını koru.
- [ ] Resmî veri olmayan aktif alıcı/satıcı veya ilan varmış gibi örnek içerik üretme.
- [ ] Gerçek kullanıcı varsa fiyat alarmı, takip listesi veya şehir/ürün değişim bildirimi değerlendir; sahte kullanım sayısı gösterme.
- [ ] Doğal atıf ve geri gelen kullanıcıyı ayrı KPI olarak izle.

### Kabul kriteri

- [ ] Her veri ürünü yeniden hesaplanabilir ve kaynak satırlarına kadar izlenebilir.
- [ ] Görünür tablo, indirilebilir veri ve yapılandırılmış veri aynı tarih/birim tanımını kullanıyor.
- [ ] Dış atıf için ücretli/link satın alma veya otomatik spam süreci yok.

## 4. Ölçüm planı ve başarı tanımı

### Birincil KPI'lar

1. Hedef sorgu kümesinin organik tıklaması.
2. Hedef sorgu kümesinin gösterimi.
3. Sorgu ve birincil hedef URL bazında CTR.
4. Ortalama konumun 14/28 günlük eğilimi.
5. Google'ın doğru hedef URL'yi gösterme payı.
6. Taze resmî veri bulunan şehir/ürün sayısı.
7. HTML ağırlığı, TTFB, LCP ve hata oranı gibi teknik guardrail'ler.

### İkincil KPI'lar

- Sabit 30 sorguluk Brave keşfinde görünürlük, ilk üç ve ikili üstünlük sayısı.
- Doğal kaynak gösterilme/backlink sayısı.
- Geri gelen kullanıcı ve fiyat alarmı kullanım oranı; yalnız özellik gerçekten varsa.

### Değerlendirme takvimi

- **T+0:** Canlı kabul ve teknik doğrulama.
- **T+3 gün:** Index/canonical/robots ve hata kontrolü; sıralama kararı verilmez.
- **T+14 gün:** Aynı haftanın günleriyle erken okuma.
- **T+28 gün:** Ana organik değerlendirme.
- **T+56 gün:** Mevsim ve kalıcılık kontrolü; özellikle ürün sorgularında.

### Operasyonel guardrail'ler

- Kritik sayfanın yanlış canonical/noindex alması: **anında rollback**.
- Yanlış tarih, kaynak, birim veya çeşit eşleşmesi: **yayını durdur ve düzelt**.
- Temel fiyat tablosunun sunucu HTML'inden kaybolması: **rollback**.
- 4xx/5xx veya render hatası: **anında rollback**.
- Organik düşüş tek başına otomatik rollback değildir; en az 14 günlük final veri, sezon ve SERP değişimiyle birlikte incelenir.
- Bir partide birden fazla temel değişken değiştiyse sonuç “nedensel kazanım” diye raporlanmaz.

### Faz bazlı başarı

- **Üzüm:** Kök neden kanıtlandı ve doğrudan düzeltildi; hedef URL/index/veri sözleşmesi sağlıklı. Sıralamanın hemen dönmesi tamamlanma koşulu değildir.
- **Mersin:** Taze resmî akış çalışıyor veya kurumsal engel kanıtlı ve dürüst biçimde gösteriliyor. Rakipten veri kopyalamak başarı sayılmaz.
- **İstanbul:** Cevap ilk bölümde, güncel/eski ayrımı açık, sayfa anlamlı biçimde hafiflemiş ve içerik/index kaybı yok.
- **Şehir paketi:** Küme toplam tıklaması ve CTR korunmuş/artmış; ilk üç görünürlüğü daha kalıcı.
- **Limon:** Birincil hedef sayfa payı netleşmiş, küme toplam trafiği korunmuş/artmış.

## 5. Teknik etki haritası

Uygulama sırasında önce bu mevcut yollar kullanılacak; paralel sistem kurulmayacaktır.

| Alan | Mevcut dosya/yol | Beklenen iş |
|---|---|---|
| Hal sayfası sunumu ve metadata | `frontend/src/app/[locale]/(public)/hal/[slug]/page.tsx` | İstanbul katmanlandırma, ortak şehir sunumu, regresyon korumaları |
| Ürün sayfası ve üzüm/limon rolleri | `frontend/src/app/[locale]/(public)/urun/[slug]/page.tsx` | Niyet, canonical, AnswerBlock ve iç bağlantı doğrulaması |
| Şehir + ürün sayfası | `frontend/src/app/[locale]/(public)/fiyat/[sehir]/[urun]/page.tsx` | Şehirli sorgu hedefi ve index eşiği |
| Şehir+ürün veri sözleşmesi | `backend/src/modules/prices/city-product.ts`, `backend/src/modules/prices/city-product-router.ts` | Uygunluk, çeşit ve karşılaştırılabilirlik |
| Frontend şehir+ürün metrikleri | `frontend/src/lib/city-product.ts` | Özet/FAQ/Dataset tutarlılığı |
| Şehir editoryal içeriği | `frontend/src/lib/market-content.ts` | Doğrulanabilir şehir bilgisi; kopya metin yok |
| Ürün editoryal içeriği | `frontend/src/lib/product-content.ts` | Ürün/çeşit niyeti ayrımı |
| Mersin kaynak tanımı | `backend/src/config/etl-sources.ts`, `backend/src/config/source-urls.ts` | Resmî uç, etkinlik ve kaynak sözleşmesi |
| Mersin parser/fetch | `backend/src/modules/etl/fetcher.ts` | Tarihli kategori çekimi, hata ve kısmi başarı |
| Kaynak sağlığı | `backend/src/modules/prices/source-health.ts` | Güvenli tazelik/engel özeti |
| Canonical denetimi | `scripts/seo/product-canonical-map.mjs` | Ürün alias/canonical kontrolü |
| Sitemap | `frontend/src/app/sitemap.ts` | Gerçek URL ve son değişim tarihi |

## 6. Test ve canlı kabul checklist'i

### Backend

- [x] `cd backend && bun test test/etl/canonical-contract.test.ts`
- [x] `cd backend && bun test test/source-health.test.ts`
- [ ] Mersin akışı değişirse yeni parser fixture ve tarih/kategori/kısmi başarı testleri.
- [x] `cd backend && bun test` — 79 dosya / 378 test geçti.
- [x] `cd backend && bun run typecheck`

### Frontend

- [x] Canonical/robots/metadata sözleşmesini canlı SSR'da hedefli olarak doğrula; bu partide metadata değiştirilmedi.
- [x] Kaynak adı ve tarih görünümünü tam frontend test paketi ve canlı SSR/API karşılaştırmasıyla doğrula.
- [x] `cd frontend && bun run test` — proje Vitest scripti; 67 dosya / 365 test geçti.
- [ ] `cd frontend && bun run lint`
- [x] `cd frontend && bun run build`
- [x] 320 px'de İstanbul temel/tüm güncel/arşiv görünümlerini gerçek Chromium ile kontrol et; diğer hedefler HTTP/SSR kabulünden geçti.

### Canlı kabul

- [x] İzole release diziniyle önceki canlı sürüm rollback için korunmuş.
- [x] Repo standardı `deploy.sh` çalıştırılmış; backend, iki frontend worker ve admin kontrollü yenilenmiş.
- [x] PM2 servisleri `online`, yeni hata döngüsü yok.
- [x] Hedef URL'ler HTTP 200; tarayıcı asset ve API isteklerinde 4xx/5xx yok.
- [x] View-source/server HTML'de H1, fiyat cevabı, tarih, kaynak, canonical ve robots doğru.
- [x] Yapılandırılmış veri görünür içerikle aynı.
- [x] Gerçek son veri tarihi sayfada ve API'de aynı.
- [x] GSC URL Inspection başlangıç kaydı alındı; T+3 kontrolü planlandı ve anlık sıralama kazanımı tamamlanma kanıtı sayılmadı.
- [x] Canlı kabul sonucu ve kullanılan commit repo raporuna eklenmiş.

## 7. Uygulama takip tablosu

| Faz | Sahip | Başlangıç | Durum | Kanıt yolu | Canlı commit | T+14 | T+28 |
|---|---|---|---|---|---|---|---|
| 0 — Baseline | Codex | 2026-09-21 | ✅ | `artifacts/seo/harman-gap-2026-09-21/`, `reports/harman-gap-dogrulama-2026-09-21.md` | `0beddb94` | 2026-10-05 | 2026-10-19 |
| 1 — Üzüm teşhis/düzeltme | Codex | 2026-09-21 | 🟦 | `reports/harman-gap-dogrulama-2026-09-21.md` | `27d6511f` | 2026-10-05 | 2026-10-19 |
| 2 — Mersin kaynak | Operasyon | 2026-09-21 | ⛔ | `reports/mersin-resmi-veri-erisim-talebi-2026-09-21.md` | — | erişim sonrası | erişim sonrası |
| 3 — İstanbul/Bayrampaşa | Codex | 2026-09-21 | 🟦 | `reports/harman-gap-dogrulama-2026-09-21.md` | `27d6511f` | 2026-10-05 | 2026-10-19 |
| 4A — Konya/Denizli/Kocaeli | Codex | 2026-09-21 | 🟦 | ortak hal şablonu + canlı HTTP/SSR kabulü | `27d6511f` | 2026-10-05 | 2026-10-19 |
| 4B — Bursa/Gaziantep | Codex | 2026-09-21 | 🟦 | ortak hal şablonu + canlı HTTP/SSR kabulü; title/H1 deneyi yok | `27d6511f` | 2026-10-05 | 2026-10-19 |
| 5 — Limon rol ayrımı | Codex | 2026-09-21 | 🟨 | 90 günlük GSC ve canonical haritası; şehir sayfası payı takipte | — | 2026-10-05 | 2026-10-19 |
| 6 — Kaynaklı veri ürünleri |  |  | ⬜ |  |  |  |  |

Durum sözlüğü: `⬜ başlamadı`, `🟨 analiz/uygulama sürüyor`, `🟦 canlı gözlem`, `✅ kabul edildi`, `⛔ bloke`.

## 8. Faz kapanış şablonu

Her faz kapatılırken aşağıdaki blok doldurulacaktır:

```md
### FAZ X kapanış — YYYY-MM-DD

- Karar:
- Kök neden / hipotez sonucu:
- Değişen dosyalar:
- Yerel testler:
- Canlı commit ve servis:
- Canlı URL kontrolleri:
- Veri kaynağı ve son kayıt tarihi:
- Başlangıç metriği:
- T+14 sonucu:
- T+28 sonucu:
- Eksik / bloke:
- Sonraki karar:
```

### FAZ 0 kapanış — 2026-09-21

- Karar: Kabul edildi.
- Kanıt: Tekrar üretilebilir collector, ham Brave/GSC/teknik snapshotlar ve doğrulama JSON'u üretildi.
- Canlı commit ve servis: Başlangıç `9025ef1b`; uygulama öncesi servisler çevrimiçiydi.
- Eksik / bloke: Yok; ham veri git dışında tutuluyor, collector repoda.
- Sonraki karar: Aynı filtreleri T+14 ve T+28'de yeniden çalıştır.

### FAZ 1 kapanış — 2026-09-21

- Karar: Düzeltme canlı, organik sonuç gözlemde.
- Kök neden / hipotez sonucu: Index/canonical, URL göçü ve veri kesintisi elendi; kısa pencere + mevsimsellik/SERP ve niyet bileşimi baskın.
- Değişen dosyalar: Üzüm genel ve kuru üzüm özel sayfasında ilk cevap/karşılıklı bağlantı.
- Yerel testler: Frontend 365 test, TypeScript ve build geçti.
- Canlı commit ve servis: `27d6511f`; iki frontend worker çevrimiçi.
- Canlı URL kontrolleri: İki URL HTTP 200, self-canonical; semantik ayrım SSR HTML'de.
- Eksik / bloke: 14 günlük final veri oluşmadı.
- Sonraki karar: 5 Ekim erken okuma; kör title/canonical değişikliği yok.

### FAZ 2 kapanış — 2026-09-21

- Karar: Teknik kol kanıtlı bloke; faz tamamlanmadı.
- Kök neden / hipotez sonucu: Mersin BB gerçek Chromium dahil HTTP 403 WAF uyguluyor; resmî alternatif bulunamadı.
- Canlı URL kontrolleri: Mersin HTTP 200, son resmî tarih 22 Haziran 2026 ve “Son Liste” dili korunuyor.
- Eksik / bloke: Kurumsal talebin gönderimi dış iletişim yetkisi gerektiriyor.
- Sonraki karar: Operasyon sahibi hazırlanan talebi gönderir; erişim gelirse mevcut ETL sözleşmesi içinde parser/fixture geliştirilir.

### FAZ 3/4 kapanış — 2026-09-21

- Karar: Ortak sunum partisi canlı gözlemde.
- Değişen dosyalar: Ortak hal sayfası; son yayın günü filtresi, arama talebine göre ilk 15, tüm güncel ve sayfalanmış arşiv görünümü.
- Yerel testler: Frontend 365 test, backend 378 test, iki typecheck ve üretim build'i geçti; lint yalnız değişmeyen `useVoiceSearch.ts:74` hatasında kaldı.
- Canlı commit ve servis: `27d6511f`; backend/admin ve iki frontend worker çevrimiçi; deploy penceresi 5xx = 0.
- Canlı URL kontrolleri: Hedeflerin tümü HTTP 200; canonical/robots/JSON-LD/SSR ve 320 px kabulü geçti.
- Başlangıç metriği: İstanbul 1.385.406 bayt; kompakt canlı görünüm 363.766 bayt, %73,7 düşüş.
- Eksik / bloke: Lighthouse LCP 2.085 ms'den üç koşu medyanı 3.332 ms'ye kötüleşti; T+3 tekrar ölçümü açık.
- Sonraki karar: T+3 teknik kontrol, T+14/T+28 GSC; bu arada title/H1 partisi yok.

### FAZ 5 analiz kapanışı — 2026-09-21

- Karar: Rol haritası doğrulandı; canonical/redirect değişikliği gerekmedi.
- Kök neden / hipotez sonucu: Genel sorgularda `/urun/limon` baskın; Adana şehir sayfasının payı zayıf, çeşit ve tarihli analiz sayfaları destek niyetinde.
- Veri kaynağı: 90 günlük GSC query+page+date ve ürün canonical haritası.
- Eksik / bloke: Rol payının organik etkisi için T+14/T+28 final veri gerekli.
- Sonraki karar: İç bağlantı/şehir rolü kanıtla güçlenmeden URL birleştirme yok.

## 9. İlgili mevcut raporlar

- `reports/rakip-izleme-birincilik-aksiyonlari-2026-09-14.md` — önceki rakip görünürlüğü ve birincilik planı.
- `HALDEFIYAT-AI-GORUNURLUK-BULGULARI-2026-09-17.md` — AI alıntılanabilirliği, kaynak ve cevap blokları.
- `HALDEFIYAT-VERI-KALITESI-CEKLIST-2026-09-17.md` — kaynak, tarih, birim ve kalite kapıları.

Bu belge, önceki raporları geçersiz kılmaz. 21 Eylül rakip kartı ve güncel GSC kanıtıyla uygulama sırasını daraltır: **önce ani kayıp ve veri kaynağı; sonra performans ve yakın sıralama kazanımları; ardından sorgu–sayfa rolü ve kalıcı otorite.**
