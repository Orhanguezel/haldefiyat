# Banner standardı denetimi — 16 Eylül 2026

Durum: ortak yerleşim altyapısı var; bütün reklamları kapsayan, yayın sırasında zorunlu tutulan ortak kreatif standardı yok. Bu belge denetim ve hedef standardıdır; aşağıdaki eksikler uygulanmış sayılmaz.

## Kapsam ve yöntem

Canlı veritabanındaki 23 banner kaydı incelendi: 15 aktif, 8 pasif. Aktifler VistaSeeds (2), Bereket Fide (4), GZL Teknoloji (4), İhracat Radarı (5). Hostinger kayıtları pasif; yeni GZL kayıtları 29, 30, 31 aktif.

Aktif 15 kaydın tamamı canlı `/reklam-onizleme/:id` bileşeninde ölçüldü. Masaüstü viewport 1440 px iken içerik genişlikleri 1120 / 552 / 363 px olarak ayarlandı; bunlar tam / yarım / üçte bir satır koşullarını temsil eder. Mobil 390 ve 320 px viewport kullanıldı. Toplam 75 ölçüm. Bu, 3 sütunun canlı envantere açıldığı anlamına gelmez; kontrollü genişlik testidir. Browser plugin mevcut olmadığından Playwright kullanıldı. Önizleme üzerinden ölçüldüğü için kampanyalara gösterim yazılmadı.

Ayrıca sekiz genel şablon (`image`, `firm`, `listing`, `sponsorship`, `leaderboard`, `split`, `mpu`, `mobile`) `/ad-preview` üzerinden örnek içerikle dar masaüstü ve mobilde incelendi. Bunlar 16 sentetik önizleme ölçümüdür; canlı ilan/firma kaynak verilerinin doğrulandığı anlamına gelmez. Kod/HTML reklamlar kaynak incelemesine dahil; aktif bir kod reklamı olmadığı için gerçek üçüncü taraf kreatif görüntü testi yapılmadı.

Ham ölçümler `/tmp/banner-standard-measurements.json`, envanter `/tmp/banner-standard-inventory.json`; örnek ekran görüntüleri `/tmp/banner-audit-{id}-{three|mobile390}.png` altında. Denetim sırasında site veya banner verileri değiştirilmedi.

## Bulgular

1. **3 sütun seçiliyor ama canlı alanlarda kullanılamıyor.** Admin `desktopColumns=1/2/3` sunuyor. Canlı 14 slotun kapasitesi 1 veya 2; hiçbirinin kapasitesi 3 değil. Backend `slotValidationError` kapasiteyi aşan seçimi reddediyor. Üç sütun CSS sınıfı mevcut olması uçtan uca destek anlamına gelmiyor.
2. **Tek sütun × iki satır desteği yok.** `desktopRow` reklamın satır numarası, yüksekliği değil. Şemada `rowSpan` alanı yok; `BannerSlot` her satırı ayrı grid olarak çiziyor. İki satırı kaplayan tek kart için model, grid ve kapasite/çakışma kontrolü birlikte değişmeli.
3. **Mobilde ortak yükseklik ve içerik düzeni yok.** Aşağıdaki ölçümler aynı içerik genişliklerinde alındı. GZL kompakt mobil eşiği 1023 px, İhracat Radarı 767 px. VistaSeeds/Bereket Fide 768 px altında yüksek görsel+metin kartına geçiyor. Tablet davranışı da bu yüzden markaya göre farklı.
4. **Tasarım seçimi marka adına bağlı.** `BannerCreative`, GZL için reklamveren+URL, İhracat Radarı ve fide markaları için reklamveren adına bakarak özel bileşen seçiyor. Genel `creativeTemplate` seçimi bu dallardan sonra çalışıyor. Yeni bir marka aynı seçeneklerden otomatik aynı görünümü alamıyor.
5. **Önizleme kısmen ortak, fakat format matrisi değil.** Kaydedilmiş kampanya çekmecesi gerçek bileşeni ve otomatik iframe yüksekliğini kullanıyor. Düzenleyicide ek bir yerel önizleme var; canlı `/ad-preview` iframe'i aynı bileşeni kullanmasına rağmen sütun sayısı parametresi göndermiyor, iki satır seçeneği yok ve yüksekliği sabit `h-72`. Büyük kartlar kaydırma gerektirebilir. Masaüstü düğmesi gerçek masaüstü viewport'unu garanti etmiyor; iframe bulunduğu panelin genişliğini kullanıyor.
6. **Yayın kontrolü tüm formatları doğrulamıyor.** Görsel/alt metin, URL, kontrast ve yaklaşık görsel oranı kontrolü var; 1/2/3 sütun, iki satır ve mobilin tamamının varlığını/taşmasını kontrol eden kapı yok. Görsel yükleme alanları tek görsel/config; ayrı mobil veya dikey kreatif sözleşmesi yok.
7. **Özel kreatifler panelin kurallarıyla tam uyumlu değil.** İhracat Radarı görselsiz özel bileşenle çiziliyor ama düzenleyici genel custom/image reklamda görsel istiyor (istisna belirli VistaSeeds ID'leri). GZL'nin `/gzl-teknoloji#teklif` göreli bağlantısı genel kalite kontrolündeki `new URL(input.linkUrl)` kuralına ve mevcut `rel` değeri tam eşitlik kontrolüne takılır. Canlı görünmesi, aynı kaydın panelden sorunsuz yeniden yayınlanabildiğini kanıtlamaz. Bu bulgu kod akışı üzerinden doğrulandı; denetimde yayın mutasyonu yapılmadı.

## Temsilî gerçek ölçümler

Yükseklikler px, mevcut metinlerle. Masaüstü testinde sidebar zorlaması yok. Uzun metin/konum farklılığı bazı kampanyalarda yüksekliği değiştirebilir.

| Kreatif (örnek ID) | Tam satır 1120 px | Yarım 552 px | Üçte bir 363 px | Mobil 390 px viewport |
|---|---:|---:|---:|---:|
| VistaSeeds #2 | 280 | 280 | 280 | 495 |
| Bereket Fide #13 | 280 | 280 | 280 | 495 |
| GZL Teknoloji #18 | 210 | 210 | 230 | 90 |
| İhracat Radarı #21 | 289 | 280 | 458 | 106 |

75 aktif-kreatif ölçümünde sayfa yatay taşması ve yüklenemeyen görsel görülmedi. VistaSeeds'in üçte bir genişlikte logo/sponsor satırının iç genişliği 185 px, scroll genişliği 195 px; aynı geometri dar alanda sıkışıyor. İhracat Radarı'nın animasyon katmanındaki taşmalar kontrollü radar kırpmasıdır; bunlar metin veya sayfa taşması olarak raporlanmadı. Genel şablonların örnek mobil yükseklikleri 158–296 px; bunlar da ortak mobil profil kullanmıyor.

## Kullanıcı tarafından istenen format standardı

Her yeni reklam için aynı içerikten üretilen şu görünümler zorunlu hedef:

- Bir satırda tek reklam: tam genişlik.
- Bir satırda iki reklam: yarım genişlik.
- Bir satırda üç reklam: üçte bir genişlik.
- Tek sütun × iki satır: gerçek iki satır kapsayan dikey kreatif.
- Her formatın mobil karşılığı; başlık, marka, sponsor etiketi ve eylem düğmesi korunmalı.

Aynı standart, markaların renklerini ve görsellerini aynı yapmak değildir. Ölçü profili, boşluk, köşe, metin sınırı, düğme alanı, sponsor etiketi, responsive eşikler ve kalite kontrolü ortak olmalıdır. Ayrı görsel dosyası her format için şart değildir; ortak responsive bileşen bütün hedeflerde doğrulanıyorsa yeterlidir. Satır yüksekliği ve mobil yükseklik profili merkezi tanımlanmalı; şu anki 90–495 px fark varsayılan olarak sürdürülmemeli.

## Uygulama sırası / kabul listesi

- [ ] Marka adına bağlı dallar yerine ortak kreatif sözleşmesi ve format profilleri.
- [ ] Tek/yarım/üçte bir genişlik ve iki satır yüksekliği; `desktopRow` ile `rowSpan` ayrımı.
- [ ] Sadece uygun geniş slotlarda 3 sütun kapasitesi; dar sidebar'a üç reklam sıkıştırılmaması.
- [ ] İki satırlı reklamın iki satırın kapasitesini de tüketmesi; çakışma kontrolü.
- [ ] Dört aktif markanın ortak yükseklik/CTA/sponsor/boşluk standardına taşınması.
- [ ] Genel görsel, firma/ilan şablonları ve kod reklamların aynı sınırlar için kontrolü.
- [ ] Panelde dört masaüstü formatı ve mobil karşılıklarını gerçek boyutta, aynı renderer ile önizleme.
- [ ] Özel bileşenler, göreli site içi URL ve genel kalite kontrolleri arasındaki uyumsuzlukların giderilmesi.
- [ ] Yayın öncesi 320/390/768/1024/1440 px, uzun başlık, görsel hatası ve reduced-motion kontrolleri.
- [ ] Eski kampanya ID'leri ve geçmiş istatistikler korunarak canlı doğrulama.


**Denetim sonrası:** Bu belgede tespit edilen format/yerleşim eksikleri aynı gün giderildi. Güncel standart, canlı sürüm ve doğrulama kanıtları [geçiş raporunda](reklam-modulu-standart-gecis-2026-09-16.md).
