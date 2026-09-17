# Rakip görünürlüğü ve içerik çalışması — 8 Eylül 2026

**Canlı uygulama güncellemesi:** Adana akışı, içerikler ve monitör düzeltmeleri yayımlandı. [Uygulama sonucu ve kalan Mersin erişim engeli](UYGULAMA-SONUCU.md). Aşağıdaki sayısal öncelikler ilk inceleme döneminin kayıtlarıdır.

**İlk inceleme sonucu:** Gerçek fırsat var; fakat rakip monitörünün sıralaması Google sıralaması değil. Beş “biz yok” sorgusunun tamamında Google gösterimi ve tıklaması var. Öncelik; yerel veri eksikliği, arama niyetine uygun mevcut sayfa ve güncel listenin görünürlüğü. Aynı anahtar kelimeye yeni haberler açmak tek başına çözüm değil.

## Kapsam ve kanıt

- Canlı veritabanı: son koşu 4, 5 Eylül 2026; Brave, bir sayfa Yandex yedeği; 30 sorgu, 534 sonuç kaydı.
- Tüm 194 dış alan adı, sorgu başına en iyi URL alınarak 403 alan adı–sorgu eşleşmesine indirildi. Rakiplerin sitelerindeki bütün sorgular değil, bu örneklemde görülenlerin tamamı incelendi.
- Canlı Google Search Console: **10 Ağustos–6 Eylül** ve **13 Temmuz–9 Ağustos**, eşit 28 gün; `web`, `final`, ülke/cihaz filtresi yok. Güncel 7.883 sorgu ve 12.302 sorgu–sayfa satırı; önceki 6.307 ve 10.030 satır.
- Yedi temel ürün/hal sayfası, iki piyasa/analiz sayfası ve üç şehir–ürün URL’si HTTP kontrolünden geçirildi.
- Ham kanıt: `live-evidence.json`, `inventory.json`, `page-evidence.json`, `coverage.json`. Ticari/SEO analiz verileri içerir; kamuya açık uploads alanına konmadı.

## “Yok” görünen sorgular gerçekte nerede?

Google konumu sorgunun dönem ortalamasıdır; tek bir URL’nin anlık sırası değildir.

| Sorgu | Google ort. konum | Gösterim | Tıklama | Mevcut ana hedef |
|---|---:|---:|---:|---|
| kocaeli hal fiyatları | 3,87 | 1.093 | 18 | /hal/kocaeli-hal-merkez |
| bayrampaşa meyve sebze hali fiyat listesi | 4,03 | 1.249 | 92 | /hal/istanbul-hal-ibb |
| üzüm fiyatları | 6,10 | 898 | 34 | /urun/uzum |
| adana mayer limon fiyatları | 7,84 | 1.358 | 82 | /urun/limon ve /urun/limon-mayer |
| salçalık domates fiyatları | 7,93 | 1.828 | 37 | /urun/domates-salcalik |

Konya: monitör 18, Google 2,74. Bursa: monitör 11, Google 2,85. Bu sayfalar sırf monitör rakamı nedeniyle yeniden yapılmamalı. Mevcut hal başlıklarına yakın tarihte değişiklik yapılmış olması da 28 günlük ortalamadan hemen etkisinin ölçülemeyeceği anlamına gelir; değişiklik zamanı ve Google yeniden taraması ayrı izlenmeli.

## Rakiplerin tamamına uygulanan yöntem

| Alan adı | Görüldüğü sorgu | Örneklemde önümüzde |
|---|---:|---:|
| harmanapps.com | 28 | 24 |
| tarimziraat.com | 15 | 12 |
| halfiyatlari.tr | 10 | 8 |
| batiakdeniztv.com | 10 | 5 |
| guncelfiyatlari.com | 6 | 2 |
| hal.gov.tr | 17 | 12 |
| tarim.ibb.istanbul | 10 | 7 |
| cimri.com | 11 | 3 |
| akakce.com | 9 | 5 |
| migros.com.tr | 8 | 2 |

Tam 194 alan adı ve her biri için sorgu, en iyi URL, bizim Google performansımız, hedef sayfa ve önerilen iş Excel’de. Belediyeler/resmi kaynaklar içerik yayıncısıyla aynı şekilde değerlendirilmemeli; perakende siteleri de hal fiyatı niyetinden farklı niyeti karşılayabilir. `tarimpiyasa.com` ve `halfiyat.vercel.app` izlenen sitelerde olmasına karşın bu son örneklemde görünmüyor; bu durum tüm Google sorgularında başarısız oldukları anlamına gelmez.

Harman’da şehir ve ürün/çeşit URL’leri; Tarımziraat’ta şehir–ürün ve genel piyasa URL’leri; halfiyatlari.tr’de şehir dizinleri; haber sitelerinde şehir fiyat listesi başlıkları görülüyor. Rakip metnini kopyalamak yerine aynı kullanıcı ihtiyacını kaynağı doğrulanmış verimizle karşılamalıyız. Rakip sayfa başlığındaki tarih, veri doğruluğunun kanıtı değildir.

## Uygulama sırası

### P0 — Yerel veri ve ölçüm

1. **Mersin kaynağı:** /hal/mersin-hal sayfasındaki son yerel kayıt 22 Haziran 2026; 8 Eylül itibarıyla 78 gün eski. Haziran–Eylül yerel limon kayıtları sorgusunda Mersin’de yalnız bir tarih çıktı. Mevcut şehir–ürün API’si en az 10 gün veri olmadan çift üretmediği için /fiyat/mersin/limon 404. Önce resmi bültenin yeni tarihleri erişilebilir mi, ETL neden ilerlemiyor, ürün eşleşmesi ve karantina durumu araştırılmalı. Rakibin güncel başlığı veri yerine kullanılamaz.
2. **Adana kaynağı:** incelenen son 90 günlük aralıkta Adana yerel limon kaydı bulunmadı; /fiyat/adana/limon ve /fiyat/adana/limon-mayer 404. 4.403 gösterimli Adana limon sorgusu genel /urun/limon sayfasına gidiyor. Kaynak edinimi olmadan bu URL’leri indeksletmek doğru olmaz.
3. **Monitör:** “biz yok” yerine “taranan sonuçlarda görülmedi”; gösterimleri “bizim GSC gösterimimiz” olarak adlandır. Google konumunu ayrı sütun yap; GSC tarih aralığını sakla. Fallback motorunu her sonuç/sayfa ile kaydet; farklı motorlar arasında pozisyon farkı üretme. Eksik/hatalı koşuları sıralama kaybı sayma. İlk beş rakibi domain başına tekilleştir; domain penceresinde bir sorgunun diğer URL’lerini ayrı alt listeye taşı. Bunlar tespit edilmiş işlerdir, bu incelemede canlı uygulama koduna geçirilmedi.

### P1 — Mevcut sayfalara içerik

- **Limon/Mayer:** Adana bağlamı ile ulusal örneklemi ayır, çeşidi koru. Genel limon → Mayer ve bölgesel piyasa bağlantıları. Kaynaksız üretim miktarları ve sabit fiyat bantlarını temizle.
- **Salçalık domates:** 1.828 gösterim, 37 tıklama, ortalama 7,93. Mevcut URL’yi Rio/çeşit ve hal–fabrika alım ayrımıyla güçlendir. 100 kg hesap örneği; tarih/kaynak/yöntem yanında verilsin.
- **Üzüm:** mevcut URL’yi taze–kuru ayrımı ve çeşit karşılaştırmasıyla güçlendir. “2026 üzüm” sorgularında zaten yaklaşık 3. sırada; yeni yıllı URL yerine mevcut sayfa korunmalı.
- **Yerel yeni sayfalar:** Adana limon/Mayer ve Mersin limon için içerik şablonu hazır. Mevcut indeksleme kapısı 45 veri günü, ürün düzeyinde 5.000 arama metriği, 14 gün içinde kayıt. Bu ürün metriği şehir sorgusunun talebi değildir; ileride şehir sorgusu GSC sinyaliyle gözden geçirilebilir. Eşiği veri yokluğunu gizlemek için düşürme.

### P2 — Mevcut şehir sayfaları ve izleme kapsamı

- **Kocaeli:** 116 satırın 59’u güncel, 57’si eski. Fiyat listesi varsayılan olarak pahalıdan ucuza başlayınca eski ürünler üstte görünüyor. Güncel gün önce, arşiv ayrı. Bu, yeni Kocaeli haberi yazmaktan daha doğrudan fayda sağlar.
- **Bayrampaşa:** İstanbul hal URL’sinde “Bayrampaşa meyve sebze hali fiyat listesi” açıklaması ve doğrudan güncel tablo. Yeni ilçe URL’sine bölme.
- **Diğer şehirler:** sorgu başına mevcut Google açılış sayfasını koruyarak tarih/ürün kapsamı, iç bağlantı ve açıklama kontrolü. Konya/Bursa gibi güçlü sonuçları ikincil sıraya koy.
- **İzleme dışı 33 fırsat:** mevcut 30 sorgu dışında en az 300 gösterim ve ortalama konumu 7’den kötü olan sorgular ayrıca listelendi. Kuru üzüm, İzmir hali, Adana mandalina, elma ve diğer konular bu listede. Bu eşik araştırma önceliğidir; içerik açma kararı veri ve mevcut sayfa kontrolünden sonra verilir.

## Sonuç nasıl ölçülecek?

- Yayın/onarım tarihi ve hedef URL kaydedilir. Önce HTTP200, robots/canonical, sitemap, iç bağlantı ve son gerçek kaynak tarihi doğrulanır.
- İlk 7 gün teknik görünürlük ve yeniden tarama; 28 gün sonra eşit 28 günlük Google sorgu/URL gösterim, tıklama, CTR ve konum karşılaştırması.
- Ülke/cihaz kırılımı ikinci analizdir; bu rapor tüm ülke/cihaz ortalamasını kullanır.
- Örnek hedef senaryosu: Adana limon sorgusunda mevcut 4.403 gösterim sabitken CTR %0,64’ten %1,5’e çıksa yaklaşık 66 tıklama, yani 28’e göre yaklaşık 38 ek tıklama olur. Bu bir aritmetik senaryo, tahmin veya vaat değildir.
- Mevsimsellik dikkate alınmalı: Adana limon gösterimi önceki dönemde 1.663, şimdi 4.403; tıklama 9→28. Salçalık domates gösterimi 355→1.828; tıklama 13→37. Trafik değişiminin tamamı SEO düzenlemesine atfedilemez.

## Teslim edilenler ve açık kalan işler

- [x] Canlı kaynak ve hesaplama yolu incelendi; Google/Brave ayrımı doğrulandı.
- [x] Tüm 194 domain ve 403 eşleşme tekilleştirildi.
- [x] 30 sorgu mevcut Google sayfalarıyla eşleştirildi; 33 ek fırsat çıkarıldı.
- [x] Excel, CSV, ham kanıt ve tekrar üretim betiği oluşturuldu.
- [x] Yedi mevcut sayfa için metin, üç yeni yerel URL için veri koşullu tasarım hazırlandı: `icerik-taslaklari.md`.
- [x] Adana resmi arşivi ve günlük ETL bağlandı.
- [ ] Mersin kaynak WAF erişimi açılmalı; sözleşme düzeltildi, ancak HTTP403 sürüyor.
- [x] Monitör alanlarının ve karşılaştırma mantığının düzeltilmesi.
- [x] Metinlerin mevcut sayfalara uygulanması, tarih sırası ve canlı kontrol.
- [x] Adana limon sayfası index; Mayer erişilebilir/noindex. Mersin veri koşulunu karşılamıyor.
- [ ] 28 günlük sonuç ölçümü (yayın sonrası dönem henüz oluşmadı).

**Uygulama canlıdır; dış kaynak nedeniyle açık kalan Mersin ve henüz oluşmayan yayın sonrası ölçüm dönemi uygulama sonucu belgesinde belirtilmiştir.**

Dosyalar: `rakip-seo-oncelikleri.xlsx`, dört CSV, `icerik-taslaklari.md`, ham JSON’lar. `build-report.py` mevcut snapshot’tan Excel’i yeniden üretir. `export-live.ts` backend kökünden Bun ile çalıştırılan salt okunur sorgu betiğinin kaydıdır; tarih aralıkları bu çalışmaya sabittir. API kimlik bilgileri dosyalara yazılmadı.
