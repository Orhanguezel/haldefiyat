# Ürün sayfaları: alım çağrısı, reklam ve rehberler

14 Eylül 2026. Kapsam: `/fiyat/:sehir/:urun`, `/urun/:slug`, `/ilan-ver`.

Harman'ın İstanbul domates sayfasındaki alım çağrısı ve reklam yerleşimi örnek alındı. HalDeFiyat'ın mevcut ürün fotoğrafları, sponsor envanteri ve rehber sepetleri kullanıldı. Yeni sosyal medya yayını veya ikinci reklam yönetim sistemi oluşturulmadı.

## Görünen değişiklikler

- Ürün fotoğraflı alım çağrısı ürünü, alım türünü ve varsa şehri ilan formuna taşır. Giriş/kayıt dönüş bağlantısı bu seçimleri korur. Alımda rol varsayılanı “Alıcı”dır.
- Mevcut `urun_sidebar` reklam envanteri, hedefleme ve tıklama takibi korunarak yatay alanda gösterilir. Yanında HalDeFiyat reklam seçeneklerine bağlantı bulunur. Reklam yoksa davet alanı genişler. Mevcut satış ilanı çağrısı genel ürün sayfasında korunur.
- Domates sayfasında salça ve turşu rehberleri birlikte görünür. Diğer ürünler, rehber sepetindeki üyeliğe göre eşleşir; ilgisiz rehber gösterilmez. Genel domates/biber sayfaları ilgili çeşitleri de kapsar.
- Rehber fiyatları aynı gün/birimde hal başına çeşit ortalamalarının medyanıdır. Tarih, birim ve hal sayısı görünür. Son yedi günde veri yoksa fiyat yerine açık durum metni çıkar; gelecekteki, geçersiz veya karışık birimli kayıtlar kullanılmaz. Üçten az halde sınırlı kayıt uyarısı vardır.
- Şehir fiyatı ile Türkiye genelindeki rehber fiyatı ayrılır. Hazır salça/turşu maliyeti veya perakende fiyatı iddiası yapılmaz.

## Tasarım kontrolü

Referansın beş ana özelliği korundu: yatay alım çağrısı, ayrık reklam alanı, belirgin yeşil eylem düğmeleri, salça/turşu için iki sütun, mobilde tek sütun. Konseptteki büyük dekoratif kavanozlar yerine sitedeki mevcut ürün fotoğrafları kullanıldı; canlı tarih ve veri kapsamına daha fazla yer ayrıldı. Sponsor varsa reklam daveti yanına yerleşir. Dış sitenin erişim/kullanıcı sayıları taşınmadı.

## Doğrulama

- TypeScript kontrolü ve yeni modüllerin ESLint kontrolü geçti.
- Veri seçimi, alım formu ve reklam bileşenleri: 3 dosyada 13 test geçti.
- Playwright: 1440 px masaüstü, 390 px mobil; yatay taşma yok. Ürün/şehir/alım türü giriş bağlantısında korundu. Genel domates sayfasında reklam daveti bir kez bulunuyor.
- Tarayıcıda anonim oturumun mevcut 401 yanıtları gözlendi; yeni bölümlerde JavaScript çalışma hatası görülmedi.
- Yapılandırılmış veriler, canonical ve index uygunluk kuralları değiştirilmedi.

## Canlı sonuç

Yayımlandı: `.next-release-20260914ba01`. İki frontend worker çevrimiçi. Önceki release korunuyor; backend ve admin yeniden başlatılmadı.

İstanbul/domates, genel domates, iki rehber, reklam ve parametreli ilan sayfaları HTTP 200. İstanbul/domates HTML'indeki ilk 30 benzersiz JS/CSS varlığı HTTP 200; canlı sayfada yeni rehber bölümleri ve tarihli fiyatlar doğrulandı. Giriş bağlantısında `product=domates`, `city=istanbul`, `type=alim` korunuyor.

- https://haldefiyat.com/fiyat/istanbul/domates
- https://haldefiyat.com/urun/domates

Kanıt: `artifacts/product-enrichment-2026-09-14/live-validation.json`.
