SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- Manuel analiz: Elma Fiyat Analizi — Mayıs 2026.
-- icerik içinde [[CHART:elma]] token'ı frontend'de canlı grafiklere dönüşür
-- (analiz/[slug]/page.tsx -> AnalizElmaCharts). **...** = başlık/kalın.

INSERT INTO hf_analysis_reports
  (slug, title, summary, content, author, tags, iso_week, week_start, week_end,
   report_date, source, status, total_records, published_at)
VALUES (
  'elma-fiyat-analizi-mayis-2026',
  'Elma Fiyat Analizi — Mayıs 2026: Don Şoku, Rekor Makas ve Bölgesel Parçalanma',
  'Don kaynaklı arz şoku ile talep yıkımı aynı anda yaşanıyor: elma, Nisan TZOB raporunda %393,7 ile tüm yaş meyve-sebzede en geniş üretici–market makasına sahip ürün oldu. Mayıs sonunda kaliteli stok eridikçe Golden yukarı dönerken ulusal ortalama gerçeği gizliyor; asıl tablo bölgesel parçalanmada.',
  'Türkiye elma piyasası Mayıs 2026''da görünürde çelişkili bir tablo veriyor: arz nesnel olarak kıt, ama ulusal ortalama fiyat sakin. Bu paradoksu çözmek için üç katmana birlikte bakmak gerekiyor — don kaynaklı arz şoku, talep yıkımı ve fiyat zincirindeki yapısal makas. Aşağıdaki grafikler canlı hal verisi ile resmi referansları (TZOB Nisan 2026) yan yana koyuyor.

[[CHART:elma]]

**Mevsimsel ayrışma: çeşitler ikiye bölündü**

Çeşit bazında hareket net biçimde ikiye ayrılmış durumda. Mayıs sonu artık soğuk hava deposu sezonunun sonu: kaliteli Golden stoğu eridikçe fiyatı yukarı gidiyor, buna karşılık elden çıkarılan düşük kaliteli "diğer" elmalar geriliyor. İthal Arjantin elması ile yerli Golden arasındaki fark da ithalat maliyeti ve kur etkisini gösteriyor. Bu, Nisan tablosuyla birebir tutarlı — TZOB''un "talep düşüşü üretici fiyatını çekti" tespiti ile şimdiki "kaliteli stoğun azalmasıyla Golden yükseliyor" sinyali aynı sezonun iki ayrı evresi.

**Don şoku: arz nesnel olarak kıt**

2025-26 sezonu Nisan 2025 zirai donuyla vuruldu. Isparta''da rekolte beklentisi yaklaşık %40 azalarak 1,25 milyon tondan ~800 bin tona düştü; Türkiye elmasının dörtte birini Isparta üretiyor. Karaman''da don hasarı %90''a varırken üretim 50-100 bin ton seviyesine indi. 13 Mayıs 2026 itibarıyla Isparta''da geçen sezondan kalan yaklaşık 50 bin ton elma soğuk hava depolarında alıcı bekliyor. Risk bitmedi: Tarım ve Orman Bakanlığı Isparta''da yeni bir zirai don riski uyarısı yaptı — 2026-27 sezonu da tehdit altında.

**Fiyat makası: kazanan çiftçi değil zincir**

TZOB Genel Başkanı Şemsi Bayraktar, üretici ile market arasındaki fiyat farkının %393,7 ile en fazla elmada gerçekleştiğini bildirdi. Üreticide 18 TL 75 kuruş olan elma markette 92 TL 58 kuruşa, yani yaklaşık 5 katına yükseldi. Kritik nokta: Nisan''da makas çiftçi kazandığı için değil, market fiyatı yapışkan biçimde yüksek kalırken talep düşüşü üretici fiyatını aşağı çektiği için rekor kırdı. Şişkinlik tarlada değil aşağı halkalarda — komisyon, lojistik, perakende marjı.

**Bölgesel parçalanma: ulusal ortalama yanılsaması**

Asıl hikâyeyi "ulusal ortalama" gizliyor. Golden ortalaması yıllık bazda neredeyse yatay görünse de altında sert sıçramalar ve düşüşler yan yana duruyor. Karaman''ın mahsulü %90 silindiği için ona yakın haller ucuz elma bulamıyor, fiyat patlıyor; büyük ithal ve çok kaynaklı haller ise hâlâ gevşek. Aynı gün şehirler arası fark 2 katını aşabiliyor. Bu, "Türkiye elma fiyatı şu kadar" cümlesinin neredeyse anlamsız olduğunu, gerçek piyasanın bölgesel olarak parçalandığını gösteriyor.

**İhracat kayda bağlama: iki ucu keskin bıçak**

Mart 2026''da Ticaret Bakanlığı elma ve limonu Kayda Bağlı Mallar Listesi''ne aldı; gerekçe fiyat hareketlerinin iç piyasa dengesini zorlaması. Kıt arz yılında üretici fiyatını yukarı çekebilecek en güçlü talep kaynağı ihracattı; o kısılınca tarla fiyatı bastırılıyor, ama tüketici fiyatı düşmüyor çünkü şişkinlik aşağı halkalarda. Sonuç: don üreticinin hacmini kesiyor, ihracat tedbiri fiyatını sınırlıyor, tüketici ise yüksek rafa bakmaya devam ediyor.

**İleriye dönük okuma**

Erimekte olan ~50 bin tonluk depo, Mayıs''ta Golden''ın yukarı dönmesi ve 2026 donunun yeni sezonu da tehdit etmesi — yaz boyunca (yeni hasat Eylül''e kadar) yukarı yönlü baskı anlamına geliyor. İthal Arjantin elmasının yüksek tutunması da yerli kaliteli arzın inceldiğinin sinyali. Takip edilecek üç eşik: TZOB Mayıs raporu (~1 Haziran), Isparta depo stoğunun erime hızı ve yeni don uyarıları.

**Veri ve metodoloji notu**

Çeşit, trend ve bölgesel grafikler HaldeFiyat canlı hal verisinden (81 il, günlük ETL) türetilmiştir. Fiyat zinciri (tarla → hal → market) TZOB Nisan 2026 üretici–market raporuna dayanır; bu aylık resmi referans olup Mayıs verisi ~1 Haziran''da kesinleşir. Arz ve politika verileri kamuya açık kurum açıklamalarından derlenmiştir.',
  'HaldeFiyat Veri Ekibi',
  JSON_ARRAY('elma', 'analiz', 'don', 'fiyat makası', 'ihracat', 'mevsim', 'TZOB'),
  '2026-W21',
  '2026-05-18',
  '2026-05-24',
  '2026-05-18',
  'manual',
  'published',
  0,
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  summary = VALUES(summary),
  content = VALUES(content),
  tags = VALUES(tags),
  iso_week = VALUES(iso_week),
  week_start = VALUES(week_start),
  week_end = VALUES(week_end),
  report_date = VALUES(report_date),
  status = VALUES(status),
  published_at = VALUES(published_at),
  updated_at = CURRENT_TIMESTAMP(3);
