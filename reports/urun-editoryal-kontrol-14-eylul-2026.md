# Ürün editoryal kontrolü — 14 Eylül 2026

Paylaşılan 50 satır üretim veritabanıyla karşılaştırıldı. Kapsam ve gün sayısı, ürünün aktif kanonik ailesinde birimi eşleşen fiyat kayıtları üzerinden değerlendirilir. Sistem “30 gün” filtresi bugünden 30 gün öncesini de içerdiği için en fazla 31 farklı tarih sayabilir. Arama sütunu saklanan arama hacmi sinyalidir; tıklama sayısı değildir.

## Tamamlanan değişiklikler

- `enginar-taze`: 90 kalite puanı, 5 hal, 26 farklı kayıt günü. Altı bölümlü, kaynak kontrolü yapılmış editoryal yayımlandı. Standart kapsam/kalite koşulları doğrulandıktan sonra yalnız bu üründe SEO index izni açıldı. Google'ın indekslemesi ve sıralaması ayrı süreçtir.
- `enginar`: mevcut altı bölüm düzeltildi. Doğrulanmayan 650–700 bin ton üretim, bölgesel yüzde, kesin fiyat zirvesi, sera takvimi ve tüketim miktarı iddiaları kaldırıldı. Kilogram/adet ayrımı ve fiyat karşılaştırma koşulları açıklandı.
- İki ürün birbirine ilgili ürün olarak bağlandı. Diğer ürünlerin SEO ayarı değiştirilmedi. Önceki içerik ve ürün sinyalleri `before.json`, yeni metin `content.json` dosyasında saklandı.

## Öncelik önerisi

1. Ahududu (29 gün) ve beyaz alabaş (29 gün): güncel fiyat sürekliliği var, editoryal yok. Kaynaklı içerik hazırlanabilecek temiz adaylar.
2. Tatlı patates: 2 hal / 31 gün, editoryal zaten var, kalite 65. Yeniden yazı eklemek yerine puan bileşenleri ve ad/alias verisi incelenmeli; 70 kalite eşiğini geçmeden indeks açılmamalı.
3. Taze kekik: 2 hal / 14 gün, kalite 75, editoryal var. Niş ürünlerin 15 farklı gün eşiğine yakın; yeni veri geldiğinde yeniden kontrol edilmeli. Bir gün geçmesi tek başına eşik geçileceği anlamına gelmez.
4. Maydanoz (Bağ/Kg), ithal mango (Adet/Kg), paketli ürünler: önce kaynak ürün adı, birim ve ambalaj içeriği doğrulanmalı. Varsayımla kg/adet dönüşümü yapılmamalı.

Panelin “Veri bekliyor” sınıflandırması, bakım sürecindeki 15 gün süreklilik yolunu tam yansıtmıyor. Tek/iki halli ürünler editoryal açısından otomatik olarak elenmemeli. Buna karşılık yeni editoryal tek başına Google görünürlüğü sağlamaz; yayımlanmış içerik, kalite ve güncel kapsam birlikte değerlendirilir.

## Editoryali eksik, en az 15 kayıt günü olan ek adaylar

| Ürün | Hal/kaynak sayısı | Farklı kayıt günü | Kalite |
|---|---:|---:|---:|
| Dut (Paket) (`dut-paket`) | 1 | 31 | 65 |
| Fesleğen 25 Gr (`feslegen-25-gr`) | 1 | 31 | 65 |
| Mantar Pk 300 Gr (`mantar-pk-300-gr`) | 1 | 31 | 65 |
| Soğan Yeşil Adet (`sogan-yesil-adet`) | 1 | 31 | 65 |
| Ananas (Normal) (`ananas-normal`) | 2 | 30 | 65 |
| Maydanoz (Kg) (`maydanoz-bag`) | 2 | 30 | 65 |
| Ahududu (Frambuaz) (`ahududu-frambuaz`) | 1 | 29 | 65 |
| Alabaş (Kohlrabi) Beyaz (`alabas-kohlrabi-beyaz`) | 1 | 29 | 65 |
| Limon Sandık (`limon-sandik`) | 1 | 22 | 65 |
| Adaçayı (`adacayi`) | 1 | 21 | 65 |
| Kolyoz (`kolyoz`) | 2 | 20 | 65 |
| Limon Otu (Limon Grass) (`limon-otu`) | 1 | 20 | 65 |
| Hardal Otu (Yaş-Taze) (`hardal-otu-yas-taze`) | 1 | 19 | 65 |
| İthal Kalamar (`ithal-kalamar`) | 1 | 19 | 65 |
| Alabaş (Kohlrabi) Kırmızı (`alabas-kohlrabi-kirmizi`) | 1 | 17 | 65 |
| Akya (`akya`) | 2 | 16 | 65 |

Bu tablo içerik adayı listesidir; toplu indeks açma listesi değildir. Akya/kolyoz gibi balıklarda tür kimliği, paketli ürünlerde ambalaj birimi ayrıca kontrol edilmelidir. Kalite hesabında yayımlanmış editoryal 10 puanlık bileşendir; diğer bileşenler değişirse toplam puan da değişebilir.

## Editoryal kaynakları

- [Atatürk Bahçe Kültürleri Merkez Araştırma Enstitüsü — Enginar yetiştiriciliği](https://arastirma.tarimorman.gov.tr/yalovabahce/Belgeler/brosurler/Enginar.pdf): yenilen kısım, çeşit/bölge, hasat olgunluğu ve liflenme.
- [İzmir İl Tarım ve Orman Müdürlüğü — İzmir'de Enginar Mesaisi, 8 Nisan 2026](https://izmir.tarimorman.gov.tr/Haber/1201/Izmirde-Enginar-Mesaisi): 2026 hasat zamanlaması. Yıllık duyurunun takvimi tüm Türkiye ve tüm yıllara genellenmedi.
- HalDeFiyat üretim veritabanı: birim, kapsam, kayıt günleri ve içerik durumu. Canlı fiyatlar sürekli değiştiğinden editoryale sabit fiyat yazılmadı.

## Canlı doğrulama

Önbellek yenilendikten sonra her iki normal ürün URL'si dörder kez kontrol edildi: yeni içerik görünür, robots `index, follow`, eski üretim iddiası yok. API yanıtları da yeni altı bölümü döndürüyor. Kanıt: `artifacts/enginar-editorial-2026-09-14/verification.json` ve `*-live-api.json`.
