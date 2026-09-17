# Canlı uygulama sonucu — 8 Eylül 2026

## Tamamlananlar

- **Adana resmi kaynak bağlandı:** 10 Haziran–7 Eylül 2026, 90 bülten günü. 6.070 geçerli fiyat adayından 5.044 kayıt işlendi; 996 eşleşmeyen satır atlandı/inceleme kuyruğuna bırakıldı, 30 fiyat kalite korumasına takıldı. Sıfır bülten fiyatları bu aday sayısına dahil değildir. Koruma kuralları aşılmadı.
- **Günlük akış:** canlı VPS backend mevcut ETL planına `adana_resmi` dahil. Tekrar çalışmada toplam 5.044 kaldı; son kayıt tarihi yine gerçek bülten tarihi 7 Eylül. Günlük son denemede greyfurt ve avokado korumaya takıldığı için çalışma `partial`; limon/Mayer satırları işlendi. Bu nedenle tüm ürünleri eksiksiz topluyor iddiası yok.
- **Yeni yerel sayfalar:** `/fiyat/adana/limon` HTTP200/index ve sitemap’te. `/fiyat/adana/limon-mayer` HTTP200/noindex; yalnız 22 fiyat günü ve ürün arama metriği 3.137 olduğu için mevcut indeksleme kapısını geçmiyor. Mayer ülke ürün sayfası index kalır.
- **Mayer kanıtı:** Adana Belediyesi 7 Eylül bülteni, 25–30 TL/kg; 27,50 TL/kg hesaplanmış orta nokta. Gerçek işlem hacmi ortalaması değildir. Genel limon görünümünde Yatak/Mayer ve diğer limon kayıtlarının bileşimi değişebilir; haftalık artış ve şehir ucuzluk çıkarımları kapalıdır.
- **Yedi mevcut sayfa:** limon, Mayer, salçalık domates, üzüm metinleri DB’de güncellendi; Kocaeli, Bayrampaşa ve Mersin metinleri ve liste sunumu canlıya alındı. Üretim miktarı/sabit fiyat bandı gibi doğrulanmamış eski iddialar bu dört ürün metninden kaldırıldı.
- **Hal listesi:** varsayılan sıra en yeni tarih. Kocaeli mobil kontrolde ilk beş kayıt 7 Eylül. Bayrampaşa fiyat listesi başlığı görünür. Mersin’in eski verisine “bugün” başlığı veya güncel hareket yüzdesi uygulanmıyor.
- **Rakip monitörü:** ayrı Google konumu, Google gösterim/tıklama, en çok gösterimli Google URL’si ve GSC dönemi. “Yok” yerine taranan sonuçlarda görülmedi açıklaması. Domain ayrıntısı sorgu başına en iyi URL’ye tekilleştirildi; Harman’ın eski koşusunda 28 sorgu/28 satır.
- **Yeni keşif:** koşu 5, 30/30 sorgu, 543 kayıt, `ok`; bütün kayıtların gerçek motoru Brave. GSC dönem başlangıç/bitişi ve derinlik saklandı. Artık otomatik Yandex karışımı yok; hata olduğunda kısmi kapsam belirtilir. Önceki karışık koşu ile kayıp/kazanç kıyası üretilmedi.

## Açık kalan dış bağımlılık

**Mersin resmi kaynak erişimi:** doğrudan HTTPS, mevcut scraper ve gerçek Chromium tarayıcısı HTTP403 veriyor. Tarayıcı başlığı “Turk Telekom Waf by Altosec”. Yanlış Mersin form alanları düzeltildi, ancak erişim açılmış gibi kaynak etkinleştirilmedi. Belediye kaynağına çalışan erişim sağlanınca yeni bültenler doğrulanıp aynı kalite hattından geçirilmeli. Son yerel kayıt 22 Haziran. `/fiyat/mersin/limon` yeterli yerel seri olmadığı için 404 kalıyor.

## Doğrulama

- Backend TypeScript üretim derlemesi başarılı; frontend/admin tip kontrolleri ve üretim derlemeleri başarılı.
- Adana resmi HTML fixture’ı ile 3 test: tarih ve sayısal ayrıştırma, soft404/geçersiz tarih reddi, resmi alan adı sınırı. Mayer 25–30 aralığı ayrıca doğrulandı.
- Canlı API, veri tabanı, robots/canonical ve sitemap kontrolleri.
- Playwright ile admin Google sütunları ve Kocaeli/Adana mobil görünümü: 390px sayfada yatay taşma yok. Yeni salçalık metni görünüyor, eski üretim iddiası görünmüyor.
- Mevcut PM2 süreçleri online, nginx yapılandırması geçerli. İlgisiz web-connection/pamuk dosyaları deploy kapsamına alınmadı.
- `live-recovery-validation.json`, `content-validation.json`, `adana-city-final.json`, `monitor-live.json`, `page-check-after.txt`, `page-evidence-after.json` kanıtları. `page-evidence.json` de uygulama sonrası tekrar taranmıştır; ilk sorgu/DB karşılaştırmasının kanıtı `live-evidence.json` ve `inventory.json` olarak korunur. Excel ilk inceleme önceliklerini temsil eder; yeni sıralama kazanımı ölçümü değildir.

## Sonraki ölçüm

Yayın tarihi başlangıç alınarak 7 günlük tarama/indeks kontrolü ve 28 günlük eşit dönem GSC karşılaştırması yapılmalı. İlk sıralara çıkıldığı veya tıklama artışı gerçekleştiği henüz iddia edilmiyor. Bu belge takip planıdır; ayrıca bir gelecekte çalışma görevi kurulmadı.
