# HaldeFiyat — Veri ve Editoryal Düzeltme Checklist'i

Güncelleme: 6 Eylül 2026. Kullanıcı kararı: önce veri/hesaplama sistemini düzelt,
sonra içerik ve büyüme planını doğrulanmış adımlarla yürüt.

Bu kuyruk, 31 Ağustos aksiyonları ile 6 Eylül aylık/sosyal planlarının yeni kesişimidir.
Eski uygulamaları yeniden yapma. `[x]` tamam, `[~]` uygulanıyor, `[ ]` sırada.
Kodun varlığı, yayının gerçekleştiği veya ticari sonuç alındığı anlamına gelmez.

## 1. Canlı baz çizgisi — 6 Eylül 14:43 UTC

Kanıt: [DB sayımı](artifacts/retail-2026-09-06/baseline.json),
[sağlayıcının ham fiyat/tarih örnekleri](artifacts/retail-2026-09-06/provider-sample.json).

| Bulgu | Sonuç |
|---|---|
| Toplam perakende tarihçesi | 18.021 kayıt, altı zincir |
| 6 Eylül etiketli kayıtlar | 179 satır, 55 ürün, altı zincir |
| Son 14 günlük aralık | 1 Eylül hiç kayıt yok; 24 Ağustos yalnız bir zincir |
| 1–6 Eylül kayıtları | 973 satır; 825 satırda kaynak URL'si yok |
| Kaynak tarih hatası | Sağlayıcı `indexTime=05.09.2026`; ETL bugünün tarihiyle yazıyordu |
| Sade ürün eşleşmesi | Şeker/kokteyl domates → domates; parmak patates → patates; dana-kuzu → dana kıyma; meyveli yoğurt → yoğurt örnekleri var |
| API tarih hatası | Birkaç günün AVG fiyatı, MAX tarih etiketiyle sunuluyordu |
| Karantina | 131 pending kayıt; yalnız sayısal anomali filtresi anlam/birim hatasını çözmüyor |
| Kaynak çalışması | PM2 `hal-backend` online; 09:30 UTC cron, 09:32 bitiş, 833 arama çağrısı, 166 yazım, 6 atlama |

Bu sayımlar çekim öncesi durumdur. `recorded_date` hatası nedeniyle geçmiş etiketler
sağlayıcının gerçek gününü kanıtlamaz. Eksik güne sahte backfill yapılmaz.

## 2. Faz A — Market verisi ve Halden Markete (öncelikli uygulama)

- [x] A1 Canlı DB + sağlayıcı JSON + gerçek cron loguyla kaynağı doğrula.
- [~] A2 Kaynak tarihini `indexTime` üzerinden doğrula; geçersiz, gelecekteki veya üç günden eski gözlemi dışla. Çekim gününü kaynak günü diye yazma.
- [~] A3 `unitPrice` birimini doğrula; adet/paket fiyatını kg sanma; litre eşanlamlılarını birleştir. Koşullu kampanyayı dışla.
- [~] A4 Ürün adının ön sözcüklerini kırparak genel ürüne zorla eşlemeyi kaldır. Bilinen çeşit/işlenmiş ürün ve süt/et varyant yanlışlarını engelle.
- [~] A5 Bir zincir/gün için gerçek, en düşük doğrulanmış teklif sakla; ortalamaya ilk SKU adını takma. Kaynak URL'sini koru. Tarihsel ham satırları silme.
- [~] A6 Ürün API'sinde her zincirin son doğrulanmış tek günlük fiyatını döndür. Atıfsız eski aggregate kayıtları ve karantina kayıtlarını public karşılaştırmadan dışla.
- [~] A7 K4: aynı ürün kimliği, kg, TRY, aynı gün; en az üç hal ve kartta en az üç ürün. Bütün kart için tek ortak gün yoksa kart üretme.
- [~] A8 Pozitif, sıfır ve negatif farkı kapsa; ürün sırası arama ilgisiyle, farkın yönünden bağımsız olsun. Yüzdenin işaretini görselde ve altyazıda koru.
- [~] A9 Kaynak, birim, örneklem ve kâr marjı olmadığı açıklaması görsel/altyazı/API'de tutarlı olsun. Eski kartla karışmayı önlemek için K4 v2 içerik anahtarı kullan.
- [ ] A10 Test, typecheck, build; tek normal deploy; yeni ETL ile doğrulanmış gözlemleri çek; public API ve K4 sonucunu canlı doğrula.
- [ ] A11 Sonraki üç gerçek zamanlanmış çalışmayı ölç: sıfır veri ve kapsam düşüşü nedenleri, yazılan/doğrulanamayan gözlem, kaynak günleri. Geçmiş 1 Eylül boşluğunun nedeni ayrıca logdan araştırılacak.

**A kabulü:** farklı gün ve birim eşleşmesi 0; doğrulanmayan kaynaktan yayın 0;
negatif/sıfır fark testleri geçer; API çok günlük ortalama üretmez; yeterli ortak veri
yoksa K4 404 verir. Doğru kaynak tarihi nedeniyle görünür kapsam daralması gizlenmez.

## 3. Faz B — Editoryal doğruluk ve tek plan

- [~] B1 Aylık raporun otomatik başlığını “kayıtlarda görünürlük” olarak düzelt. Kaynak kesintisinden sezon bitişi çıkarma.
- [ ] B2 Gerçek sezon yorumu için ortak çalışan kaynak grubu, yayın günü kapsamı ve editör kontrolü ekle. Mevcut aylık taslağı onaydan önce yeniden gözden geçir.
- [~] B3 K1–K5 adları, saat dilimi, üretim/yayın ayrımı ve aylık çıktı hesabını aylık ve sosyal planlarda tekleştir.
- [~] B4 Ocak sonu–Şubat 2027 Ramazan hazırlığı; 8 Şubat başlangıç, 9 Mart bayram. Nisan kaydını düzelt.
- [~] B5 “Rakiplerde hiç yok”, “videoyla büyüdü”, “yalnız video kaldı” gibi kanıtı aşan cümleleri kaldır.
- [ ] B6 Yeni kartlar için “Verinin Kaynağı”, firma rehberi ve doğrulanmış kullanım örneği içerik briefləri hazırla. K1–K5'i yeniden kurma.

**B kabulü:** iki aktif planda seri adı/takvim çelişkisi yok; sezon iddiası insan
doğrulaması gerektirir; mevcut URL'ler korunur. Kaynak:
[Diyanet 2027](https://vakithesaplama.diyanet.gov.tr/icerik.php?icerik=154).

## 4. Faz C — Gerçek yayın ve ölçüm (A/B sonrası)

- [ ] C1 Tanitio'da seri bazında son üretim, onay, yayın URL'si ve ölçüm tarihi envanteri çıkar. Telegram/WhatsApp'ın otomatik veya elle yayın durumunu ayrıca doğrula.
- [ ] C2 Eski K4 taslaklarını yeni veriyle tekrar üret; eski içerik anahtarlarını mükerrer yayın oluşturmayacak şekilde eşleştir. Bu görev yayın izni değildir.
- [ ] C3 Onay sahibi ve zamanını belirle; geciken taslağı eski tarihiyle otomatik yayımlama. IG/FB taslak modu mevcut kararda kalır.
- [ ] C4 20 Eylül: yalnız erişim değil, en az 10 kontrol edilmiş kartta tarih/birim/anlam hatası 0 ve planlanan/başarılı yayın oranı değerlendirilsin. Otomatik yayın ayrı karar.
- [ ] C5 UTM ve mevcut analitik üzerinden ürün takibi, alarm, 7 günlük geri dönüş, ilan/teklif ve ödeme sonuçlarını seri bazında bağla.
- [ ] C6 3 Ekim SEO: mevcut pilotun URL listesini sabitle; indekslenebilir uygun URL payı, sorgu/pozisyon kırılımı ve mevcut ürün sayfalarındaki tıklama kaybını ölç. %4 CTR bütün URL'lere kör eşik değildir.
- [ ] C7 Aylık/haftalık yazıları ilk 28 günlük eşit pencerelerde karşılaştır. Rehber başına 300 oturum doğrulanmış beklenti değil deney hedefidir.

## 5. Faz D — İlan ve gelir (sonraki uygulama)

- [ ] D1 Prova alım ilanını gerçek ilan sayımından ve normal vitrinden ayır; mevcut gerçek aktif ilan bazını çıkar.
- [ ] D2 Arama hacmi, fiyat takipçisi, alım ilanı ve yanıtlanan teklif ayrı sinyallerle etiketlensin. Arama ilgisi satın alma talebi diye sunulmasın.
- [ ] D3 Tek ürün/bölgede pilot: firma erişimi → sahiplenme → gerçek ilan → yanıtlanan talep → doğrulanmış görüşme. 15 Ekim hedefi 25 gerçek aktif ilan; tek başına sayı başarı değildir.
- [ ] D4 İlk ücretli reklam/API pilotunda teklif, tahsilat, kullanım ve yenileme kanıtını kaydet. Yeni abonelik sistemi kurma.
- [ ] D5 İki kısa video denemesi: aynı ürün/mesajı kartla eşit süreli karşılaştır; erişim, kaydetme ve site eylemlerini ölç.

## 6. Çalıştırma ve kapanış

Backend klasöründe salt okunur durum: `bun scripts/qa/retail-audit.ts`.
Sağlayıcı önizlemesi: `bun scripts/qa/retail-refresh.ts` (varsayılan dry-run).
Normal ETL üzerinden doğrulanmış yeniden çekim: `bun scripts/qa/retail-refresh.ts --apply`.
Test: `bun test test/retail-comparison-evidence.test.ts test/etl/retail-price-quality-guard.test.ts`.
Deploy: commit + push → VPS `bash deploy.sh`; canlıda elle SQL/şema değişikliği yok.

Kod/test/deploy kanıtları ve son açık işler bu dosyada güncellenecek.
