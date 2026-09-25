# SEO Fırsat Takip ve Uygulama Checklist'i — Canlı

Başlangıç: 25 Eylül 2026  
Kapsam: HaldeFiyat rakip izleme panelindeki 30 sorgu  
Aktif kaynak: Google Search Console, Türkiye + mobil + Web + `final`  
Keşif kaynağı: Brave/Yandex; yalnız rakip ve motor farkı teşhisi için

## Çalışma kuralı

- Maddeler sırayla uygulanır; bir aşamanın kabul kanıtı yazılmadan sonraki aşamaya geçilmez.
- Brave/Yandex tarama konumu Google sırası veya arama hacmi olarak raporlanmaz.
- Toplam KPI'lar sorgu boyutundan hesaplanır; sorgu + sayfa satırları mülk toplamı olarak toplanmaz.
- Aynı kümeye birden çok büyük değişiklik aynı anda yapılmaz. Her uygulama için önceki değer, değişiklik tarihi ve hedef URL kaydedilir.
- İlk okuma 14 gün, kalıcılık okuması 28 gün sonra aynı GSC kapsamıyla yapılır.
- Verisi bayat veya kaynağı doğrulanmamış sayfada güncellik iddiası üretilmez.

## Başlangıç ölçümü

| Dönem | Sorgu | Gösterim | Tıklama | CTR |
|---|---:|---:|---:|---:|
| 27 Ağustos–23 Eylül 2026 | 30 | 57.666 | 2.324 | %4,03 |
| 30 Temmuz–26 Ağustos 2026 | 30 | 57.398 | 1.617 | %2,82 |

Not: Bunlar HaldeFiyat'ın GSC gösterimleridir; Google Ads arama hacmi değildir.

## Aşama 0 — Canlı takip panosu

- [x] GSC son 28 gün ve önceki 28 gün karşılaştırması eklendi.
- [x] GSC kapsamı Türkiye + mobil + Web + kesinleşmiş veri olarak sabitlendi.
- [x] P1, P2, Koru ve İzle sınıfları tanımlandı.
- [x] Gösterim, tıklama, CTR, Google pozisyonu, tarama pozisyonu ve hedef URL aynı tabloda gösterildi.
- [x] Düşük CTR, sıra boşluğu, büyüyen/düşen talep, URL dağılımı, yanlış hedef ve motor farkı sinyalleri eklendi.
- [x] Mevcut gösterimlerde %3 CTR senaryosu ayrı ve açık biçimde etiketlendi.
- [x] Birim testleri ve TypeScript kontrolleri geçti.
- [x] Canlı admin panelinde masaüstü ve dar ekran görsel kabulü yapıldı.
- [x] Canlı API toplamları GSC kaynak sorgusuyla geri okundu.

Kabul: `/admin/competitor-monitor` varsayılan olarak SEO Fırsatları sekmesini açar; 30 sorgu ve dönem toplamları kaynak sorguyla uyuşur; filtreler ve bağlantılar çalışır.

Canlı kabul kanıtı — 25 Eylül 2026:

- Yetkili API isteği `200`: 30 sorgu, 57.666 gösterim, 2.324 tıklama, %4,03 CTR; önceki dönem 57.398 gösterim, 1.617 tıklama, %2,82 CTR.
- API kapsamı `country=tur`, `device=MOBILE`, `type=web`, `dataState=final`; dönem 27 Ağustos–23 Eylül, karşılaştırma 30 Temmuz–26 Ağustos.
- Varsayılan SEO Fırsatları sekmesi, P1 filtresinin 13 sorguya inmesi ve hedef sayfanın yeni sekmede açılması gerçek tarayıcıda doğrulandı.
- 390 × 844 dar ekranda belge genişliği görünüm genişliğini aşmadı; tablo ve sekmeler kendi yatay kaydırma alanlarında kaldı.
- Backend 9 ilgili testten geçti; backend ve admin TypeScript kontrolleri ile üretim derlemeleri geçti; `hal-backend` ve `hal-admin` PM2 süreçleri çevrimiçi.

## Aşama 1 — Limon sorgu–sayfa sahipliği

Durum: Uygulama canlıda; 14/28 günlük GSC kabul ölçümü bekleniyor. Bu aşama kabul edilmeden Aşama 2 başlamaz.

- [x] `limon fiyatları` ana hedefi `/urun/limon` olarak netleştirildi.
- [x] `adana limon fiyatları` ana hedefi `/fiyat/adana/limon` olarak netleştirildi.
- [x] `adana mayer limon fiyatları` ana hedefi `/piyasa/adana-mayer-limon` olarak netleştirildi.
- [x] `mayer limon fiyatı` ürün/çeşit niyeti `/urun/limon-mayer` üzerinde korundu.
- [x] `mersin limon fiyatları` için tarihli analiz ile güncel piyasa sayfasının rolleri ayrıldı.
- [x] İç bağlantı metinleri doğru hedeflere yöneltildi; gereksiz canonical/noindex uygulanmadı.

Başlangıç kanıtı:

| Sorgu | Gösterim | CTR | Pozisyon | Sorun |
|---|---:|---:|---:|---|
| adana limon fiyatları | 5.498 | %1,00 | 6,65 | Dört hedef URL'ye dağılıyor |
| limon fiyatları | 3.731 | %2,06 | 6,45 | Genel ve yerel sayfalar birlikte görünüyor |
| mersin limon fiyatları | 2.177 | %1,06 | 6,00 | Tarihli analiz güncel hedefin önünde |

Kabul: Her sorguda birincil hedef sayfa GSC query + page görünümünde baskın hâle gelir; kümenin toplam tıklaması düşmez; sayfa rolleri kullanıcıya da açık olur.

Uygulama kanıtı — 25 Eylül 2026:

- `/urun/limon`, `/fiyat/adana/limon`, `/piyasa/adana-limon`, `/piyasa/adana-mayer-limon`, `/urun/limon-mayer`, `/piyasa/mersin-limon` ve tarihli Mersin–Erdemli analiz sayfası canlıda `200`, kendine canonical ve indexlenebilir durumda doğrulandı.
- Limon ürün sayfası Adana, Mersin ve Erdemli'nin güncel niyet sayfalarına ayrı bağlantılar veriyor. Adana fiyat sayfası artık yanlışlıkla Erdemli'ye değil `/piyasa/adana-limon` destek sayfasına bağlanıyor.
- Tarihli Mersin–Erdemli analizi güncel fiyat yerine geçmediğini açıklıyor ve `/piyasa/mersin-limon` sayfasına yönlendiriyor. Güncel piyasa sayfalarındaki “Bu sayfanın kapsamı” kutusu rolleri kullanıcıya açıklıyor.
- Canonical birleştirme veya `noindex` eklenmedi. İlgili 18 test, TypeScript kontrolü ve üretim derlemesi geçti; Node 24 frontend PM2 kümesi çevrimiçi.
- Gerçek tarayıcıda masaüstü bağlantı akışları ve 390 × 844 mobil Adana Mayer görünümü doğrulandı; mobil belgede yatay taşma `0 px`.

Dağılım tabanı — GSC query + page, 25 Eylül 2026 canlı okuması:

| Sorgu | Mevcut baskın sayfa | Hedef sayfa | Gösterim / tıklama notu |
|---|---|---|---|
| limon fiyatları | `/urun/limon` | `/urun/limon` | Sorgu 3.875 / 81; hedef 3.527 / 66 |
| adana limon fiyatları | `/urun/limon` | `/fiyat/adana/limon` | Sorgu 5.767 / 56; mevcut 5.190 / 38, hedef 1.542 / 9 |
| adana mayer limon fiyatları | `/urun/limon-mayer` | `/piyasa/adana-mayer-limon` | Sorgu 1.472 / 115; mevcut 1.274 / 86, hedef 321 / 8 |
| mayer limon fiyatı | `/urun/limon-mayer` | `/urun/limon-mayer` | Sorgu 534 / 6; hedef 453 / 2 |
| mersin limon fiyatları | tarihli analiz | `/piyasa/mersin-limon` | Sorgu 2.224 / 23; analiz 1.869 / 14, güncel hedef ilk 5 sayfada değil |

Ölçüm kapıları:

- [ ] 9 Ekim 2026: 14 günlük erken GSC query + page okuması kaydedilecek.
- [ ] 23 Ekim 2026: 28 günlük kalıcılık okuması kaydedilecek.
- [ ] Birincil hedefler baskın hâle gelecek ve limon kümesinin toplam tıklaması başlangıca göre düşmeyecek.

Aşama 1 kabulü henüz kapalıdır; arama sonucu sahipliği ancak yukarıdaki GSC ölçüm kapıları geçildiğinde tamamlanmış sayılır.

## Aşama 2 — Şehir hal sayfaları

Durum: Açık.

- [ ] Ankara hal sayfasının başlık, açıklama, H1 ve ilk ekranı sorguyla uyumlu hâle getirildi.
- [ ] Kayseri hal sayfasının düşük CTR nedeni sayfa/snippet düzeyinde giderildi.
- [ ] Mersin hal sayfasında hedef URL ve veri tazeliği doğrulandı.
- [ ] Şehir sayfalarında H1 standardı `{Şehir} Hal Fiyatları`; kurum/hal adı alt başlık olarak uygulandı.
- [ ] Konya, Kahramanmaraş ve diğer çalışan ilk 3 sayfalar geniş değişiklikten korundu.

Kabul: Değişen her URL 200, self-canonical, index/follow ve doğru sitemap kaydı verir; canlı H1/meta okunur; 14 ve 28 günlük GSC sonucu kaydedilir.

## Aşama 3 — Ürün fırsatları

Durum: Açık.

- [ ] `/urun/mandalina` başlık/snippet ve ilk ekran teklifi iyileştirildi.
- [ ] `/urun/domates-salcalik` ile şehir bazlı salçalık domates sayfalarının rolleri ayrıldı.
- [ ] Elma ana ürün ve çeşit sayfalarının sorgu sahipliği doğrulandı.
- [ ] Patates sayfasının güçlü CTR'ı korunarak yalnız sıra fırsatı değerlendirildi.

Başlangıç kanıtı:

| Sorgu | Gösterim | CTR | Pozisyon |
|---|---:|---:|---:|
| mandalina fiyatları | 2.005 | %1,25 | 5,59 |
| salçalık domates fiyatları | 1.562 | %1,54 | 7,64 |
| elma fiyatları | 1.007 | %2,38 | 11,12 |

Kabul: Ürün ana sorgusu doğru ürün sayfasında yoğunlaşır; çeşit/şehir sayfaları farklı niyet taşır; toplam ürün kümesi tıklaması düşmez.

## Aşama 4 — Genel `hal fiyatları` merkezi

Durum: Açık.

- [ ] Ana sayfa genel `hal fiyatları` sorgusunun ülke merkezi olarak güçlendirildi.
- [ ] `/fiyatlar` filtrelenebilir veri tablosu rolünde tutuldu.
- [ ] Şehir sayfalarının genel sorguyu gereksiz sahiplenmesi iç bağlantılarla azaltıldı.
- [ ] Körlemesine canonical veya yeni anahtar kelime sayfası açılmadı.

Kabul: Ana sayfanın sorgu payı ve tıklaması yükselirken `/fiyatlar` ve şehir sorgularının toplam organik trafiği korunur.

## Aşama 5 — Rakip izleme temizliği

Durum: Açık.

- [ ] Doğrudan veri/içerik rakipleri ayrı gruba alındı: Harmanapps, HalFiyatlari.tr, TarımZiraat, hal.gov.tr.
- [ ] Resmî belediye kaynakları ayrı “özgün kaynak” grubu olarak izlendi.
- [ ] Perakende, sosyal ağ ve haber sonuçları ana rakip KPI'ından ayrıldı.
- [ ] Panelde alan adının en iyi sonucu ile hedef URL sırası ayrı gösterildi.

Kabul: Rakip özeti aksiyon üretmeyen SERP gürültüsünü ana KPI'a katmaz; resmî kaynak, doğrudan rakip ve niyet komşusu ayrımı görünürdür.

## Aşama 6 — Sonuç değerlendirmesi

Durum: Uygulamalar tamamlandıktan sonra başlayacak.

- [ ] Her değişiklik için 14 günlük erken okuma kaydedildi.
- [ ] Her değişiklik için 28 günlük kalıcılık okuması kaydedildi.
- [ ] Gösterim, tıklama, CTR, ortalama pozisyon ve birincil hedef URL payı karşılaştırıldı.
- [ ] Kazanan değişiklikler korundu; olumsuz veya belirsiz değişiklikler ayrı ayrı geri değerlendirildi.
- [ ] Checklist son durum ve canlı kanıt bağlantılarıyla kapatıldı.

Kabul: Sonuçlar aynı kapsam ve eşit dönemlerle ölçülür; Brave/Yandex keşif verisi Google sonucu diye sunulmaz; tamamlandı işaretleri canlı kanıta dayanır.
