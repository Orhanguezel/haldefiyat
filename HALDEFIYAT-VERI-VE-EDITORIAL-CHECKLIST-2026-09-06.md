# HaldeFiyat — Veri ve Editoryal Düzeltme Checklist'i

Güncelleme: 6 Eylül 2026. Kullanıcı kararı: önce veri/hesaplama sistemini düzelt,
sonra içerik ve büyüme planını doğrulanmış adımlarla yürüt.

Bu kuyruk, 31 Ağustos aksiyonları ile 6 Eylül aylık/sosyal planlarının yeni kesişimidir.
Eski uygulamaları yeniden yapma. `[x]` tamam, `[~]` teknik hazırlığı tamam, gerçek ölçüm/operasyon bekleniyor, `[ ]` sırada.
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
sağlayıcının gerçek gözlem/indexleme gününü kanıtlamaz. Eksik güne sahte backfill yapılmaz.

## 2. Faz A — Market verisi ve Halden Markete (öncelikli uygulama)

- [x] A1 Canlı DB + sağlayıcı JSON + gerçek cron loguyla kaynağı doğrula.
- [x] A2 Kaynak tarihini `indexTime` üzerinden doğrula; geçersiz, gelecekteki veya üç günden eski gözlemi dışla. Çekim gününü kaynak günü diye yazma.
- [x] A3 `unitPrice` birimini doğrula; adet/paket fiyatını kg sanma; litre eşanlamlılarını birleştir. Koşullu kampanyayı dışla.
- [x] A4 Ürün adının ön sözcüklerini kırparak genel ürüne zorla eşlemeyi kaldır. Bilinen çeşit/işlenmiş ürün ve süt/et varyant yanlışlarını engelle.
- [x] A5 Bir zincir/gün için gerçek, en düşük doğrulanmış teklif sakla; ortalamaya ilk SKU adını takma. Kaynak URL'sini koru. Tarihsel ham satırları silme.
- [x] A6 Ürün API'sinde her zincirin son doğrulanmış tek günlük fiyatını döndür. Atıfsız eski aggregate kayıtları ve karantina kayıtlarını public karşılaştırmadan dışla.
- [x] A7 K4: aynı ürün kimliği, kg, TRY, aynı gün; en az üç hal ve kartta en az üç ürün. Bütün kart için tek ortak gün yoksa kart üretme.
- [x] A8 Pozitif, sıfır ve negatif farkı kapsa; ürün sırası arama ilgisiyle, farkın yönünden bağımsız olsun. Yüzdenin işaretini görselde ve altyazıda koru.
- [x] A9 Kaynak, birim, örneklem ve kâr marjı olmadığı açıklaması görsel/altyazı/API'de tutarlı olsun. Eski kartla karışmayı önlemek için K4 v2 içerik anahtarı kullan.
- [x] A10 Test, typecheck, build; tek normal deploy; yeni ETL ile doğrulanmış gözlemleri çek; public API ve K4 sonucunu canlı doğrula.
- [~] A11 Sonraki üç gerçek zamanlanmış çalışmayı ölç: sıfır veri ve kapsam düşüşü nedenleri, yazılan/doğrulanamayan gözlem, kaynak günleri. Geçmiş 1 Eylül boşluğunun nedeni ayrıca logdan araştırılacak.

- [x] A12 Süt yağ oranı, yoğurt türü/gramajı ve diğer çeşitlerin daha ayrıntılı sınıflandırması; doğrulanmamış eski perakende tarihçesinin kalite referansına etkisi. Yeni ham ürün adı görünür; geniş kategori tek kalite değildir.

**A kabulü:** farklı gün ve birim eşleşmesi 0; doğrulanmayan kaynaktan yayın 0;
negatif/sıfır fark testleri geçer; API çok günlük ortalama üretmez; yeterli ortak veri
yoksa K4 404 verir. Doğru kaynak tarihi nedeniyle görünür kapsam daralması gizlenmez.

## 3. Faz B — Editoryal doğruluk ve tek plan

- [x] B1 Aylık raporun otomatik başlığını “kayıtlarda görünürlük” olarak düzelt. Kaynak kesintisinden sezon bitişi çıkarma.
- [x] B2 Gerçek sezon yorumu için ortak çalışan kaynak grubu, yayın günü kapsamı ve editör kontrolü ekle. Mevcut aylık taslağı onaydan önce yeniden gözden geçir.
- [x] B3 K1–K5 adları, saat dilimi, üretim/yayın ayrımı ve aylık çıktı hesabını aylık ve sosyal planlarda tekleştir.
- [x] B4 Ocak sonu–Şubat 2027 Ramazan hazırlığı; 8 Şubat başlangıç, 9 Mart bayram. Nisan kaydını düzelt.
- [x] B5 “Rakiplerde hiç yok”, “videoyla büyüdü”, “yalnız video kaldı” gibi kanıtı aşan cümleleri kaldır.
- [x] B6 Yeni kartlar için “Verinin Kaynağı”, firma rehberi ve doğrulanmış kullanım örneği içerik briefleri hazırla. K1–K5'i yeniden kurma.

**B kabulü:** iki aktif planda seri adı/takvim çelişkisi yok; sezon iddiası insan
doğrulaması gerektirir; mevcut URL'ler korunur. Kaynak:
[Diyanet 2027](https://vakithesaplama.diyanet.gov.tr/icerik.php?icerik=154).

## 4. Faz C — Gerçek yayın ve ölçüm (A/B sonrası)

- [x] C1 Tanitio'da seri bazında son üretim, onay, yayın URL'si ve ölçüm tarihi envanteri çıkar. Telegram/WhatsApp'ın otomatik veya elle yayın durumunu ayrıca doğrula.
- [x] C2 Eski K4 taslaklarını yeni veriyle tekrar üret; eski içerik anahtarlarını mükerrer yayın oluşturmayacak şekilde eşleştir. Bu görev yayın izni değildir.
- [~] C3 Onay sahibi ve zamanını belirle; geciken taslağı eski tarihiyle otomatik yayımlama. IG/FB taslak modu mevcut kararda kalır.
- [~] C4 20 Eylül: yalnız erişim değil, en az 10 kontrol edilmiş kartta tarih/birim/anlam hatası 0 ve planlanan/başarılı yayın oranı değerlendirilsin. Otomatik yayın ayrı karar.
- [~] C5 UTM ve mevcut analitik üzerinden ürün takibi, alarm, 7 günlük geri dönüş, ilan/teklif ve ödeme sonuçlarını seri bazında bağla.
- [~] C6 3 Ekim SEO: mevcut pilotun URL listesini sabitle; indekslenebilir uygun URL payı, sorgu/pozisyon kırılımı ve mevcut ürün sayfalarındaki tıklama kaybını ölç. %4 CTR bütün URL'lere kör eşik değildir.
- [~] C7 Aylık/haftalık yazıları ilk 28 günlük eşit pencerelerde karşılaştır. Rehber başına 300 oturum doğrulanmış beklenti değil deney hedefidir.

## 5. Faz D — İlan ve gelir (sonraki uygulama)

- [x] D1 Prova alım ilanını gerçek ilan sayımından ve normal vitrinden ayır; mevcut gerçek aktif ilan bazını çıkar.
- [x] D2 Arama hacmi, fiyat takipçisi, alım ilanı ve yanıtlanan teklif ayrı sinyallerle etiketlensin. Arama ilgisi satın alma talebi diye sunulmasın.
- [~] D3 Tek ürün/bölgede pilot: firma erişimi → sahiplenme → gerçek ilan → yanıtlanan talep → doğrulanmış görüşme. 15 Ekim hedefi 25 gerçek aktif ilan; tek başına sayı başarı değildir.
- [~] D4 İlk ücretli reklam/API pilotunda teklif, tahsilat, kullanım ve yenileme kanıtını kaydet. Yeni abonelik sistemi kurma.
- [~] D5 İki kısa video denemesi: aynı ürün/mesajı kartla eşit süreli karşılaştır; erişim, kaydetme ve site eylemlerini ölç.

## 6. Çalıştırma ve kapanış

Backend klasöründe salt okunur durum: `bun scripts/qa/retail-audit.ts`.
Sağlayıcı önizlemesi: `bun scripts/qa/retail-refresh.ts` (varsayılan dry-run).
Normal ETL üzerinden doğrulanmış yeniden çekim: `bun scripts/qa/retail-refresh.ts --apply`.
Test: `bun test test/retail-comparison-evidence.test.ts test/etl/retail-price-quality-guard.test.ts`.
Deploy: commit + push → VPS `bash deploy.sh`; canlıda elle SQL/şema değişikliği yok.

### Bu turda kapanan uygulama ve canlı kabul

- Kod: `75dd7569`; görsel kaynak dipnotu: `6ed03fd8`.
- İlk build denemesi servis geçişinden önce durduruldu; son commit tek servis geçişiyle normal `deploy.sh` üzerinden yayınlandı. Dağıtım penceresinde **5xx = 0**.
- 49 test / 132 assertion; backend typecheck/build, frontend typecheck ve hedefli lint geçti (api.ts:332'de önceden var olan kullanılmayan ApiEnvelope uyarısı). VPS frontend/admin production build ve health kapıları geçti.
- Üç boyutta görsel üretimi: IG 1080×1350, geniş 1200×675, TG 1200×1800; K4 IG kaynak/tarih/fiyat dipnotu görüntüden kontrol edildi.
- Gerçek ETL yeniden çekimi: **149 doğrulanmış teklif, 143 yazım, 6 atlama**. Kaynak gözlem günü **5 Eylül**. **305 çağrıda 53 arama hatası** var: dış kaynak bütünüyle sağlıklı değildir, A11 açık kalır. Atlanan yazımların ayrıntılı neden kırılımı takipte doğrulanacak.
- [Canlı yeniden çekim sonucu](artifacts/retail-2026-09-06/refresh-live.json), [DB seçim/API doğrulaması](artifacts/retail-2026-09-06/verified-after-refresh.json).
- [Domates API](https://haldefiyat.com/api/v1/prices/retail/domates): **ŞOK 39 TL/kg, 5 Eylül**, ham ad `Domates 1 Kg`, kaynak marketfiyati.org.tr. Eski birkaç gün ortalaması yok. [Kaydedilen cevap](artifacts/retail-2026-09-06/public-domates.json).
- [Domates sayfası](https://haldefiyat.com/urun/domates) aynı 39 TL/kg ve 5 Eylül tarihiyle HTTP 200. [HTTP/HTML kabulü](artifacts/retail-2026-09-06/http-check.json).
- [K4 JSON](https://haldefiyat.com/api/v1/social/cards/today?series=k4&size=ig): `k4:v2:2026-09-06`, aynı gün üç ürün, ürün başına 3–4 hal. Bugünkü ortak kapsam yalnız Migros: bu durum altyazıda **1 zincir** diye açıkça yazıyor. 5 Eylül market örnekleri 6 Eylül hal fiyatına eklenmedi. [Kaydedilen cevap](artifacts/retail-2026-09-06/public-k4.json).
- [Üretilmiş K4 görseli](https://haldefiyat.com/uploads/social-cards/k4-v2-2026-09-06-ig.png) HTTP 200. Sosyal hesaba yayın yapılmadı.
- Takvim toplamı düzeltildi: 30 + 5 + 4 + 1 + 1 = **41 kart**. Önceki konuşmadaki 42 hesabı aritmetik hatasıydı.

## 7. Checklist uygulama turu — 6 Eylül

Bu bölüm ilk dağıtımdan sonraki devam işidir. Teknik tamamlanma, ölçüm ve insan kararı ayrı izlenir.

- **A11:** Cron artık yalnız gerçek zamanlanmış çalışmaları `backend/logs/retail-scheduled-runs.jsonl` dosyasına ekler. Zincir kapsamı, önceki koşuya göre %30'dan fazla düşüş, sıfır yazım, arama hataları (anahtar kelime bazında), birim/tarih/kampanya ret nedenleri ve karantina/yazım hataları ayrı kaydedilir. Elle ETL üç günlük kabulü doldurmaz. `bun scripts/qa/retail-scheduled-evidence.ts` gerçek gün sayısını döndürür. 1 Eylül retained PM2 loglarında marketfiyati kaydı bulunamadı; neden kesinleştirilmedi.
- **A12:** API ve ürün sayfasında süt yağ oranı/işlem türü, yoğurt türü ve paket miktarı ayrıdır. Bilinmeyen alan “belirtilmemiş”tir. Tarihsel perakende kalite referansı yalnız güvenilir kaynaklı, birimi ve ürün adı doğrulanmış, aynı markalı ürün/paket adını taşıyan, gelecekten gelmeyen gözlemlerden alınır. Eski karantina kayıtları topluca açılmaz.
- **B2:** Ağustos taslağı eski 8 giren + 8 çıkan sezon iddiasıyla kalmıştı. Aynı kaynakta her iki ay en az %65 takvim günü ve en fazla 15 puan kapsam farkı; en az üç ayrı hal kapısı eklendi. Sekiz ortak kaynakla hesaplanan yeni metinde bu iddialar desteklenmedi. Kaynak günleri tabloda görünür. Yenileme editör onayını siler; onaysız taslak zamanlanmış yayınla çıkamaz.
- **B6:** [Üç içerik briefi ve uygulama paketi](docs/EDITORIAL-UYGULAMA-PAKETI-2026-09-06.md) hazır. Doğrulanmış teknik kullanım örneği müşteri başarısı olarak sunulmaz.
- **C1/C2:** [Canlı Tanitio başlangıç envanteri](artifacts/checklist-closeout-2026-09-06/tanitio-before.json): 15 posted, 20 cancelled, eski K4 yok. K1 6 Eylül 07:35 UTC otomatik yayınlanmış; planla çelişen durum HaldeFiyat'a özel zorunlu taslak kuralıyla düzeltildi. Diğer tenantların global ayarı değişmedi. K4 v2, `social_posts.id=1621`, `status=draft`, `scheduled_at/posted_at/IG/FB kimlikleri=null` olarak hazırlandı; ikinci önizleme `refresh-draft` döndü, ikinci kayıt oluşturulmadı. Sabit seri/gün/platform anahtarı korunur; eski/yayımlanmış kaydı ikinci kez yayınlama yolu kapalıdır. Platform kimliği açık permalink veya editör onayı değildir; IG permalink kanıtı eksik olarak envanterde kalır. Telegram otomatik kanal paylaşımı; WhatsApp son adımı manueldir (Telegram yönetici taslağı).
- **C3:** Teknik kapı hazır: üç günden eski/gelecek tarihli kart ve v2 öncesi K4 zamanlamada ve gerçek gönderim aşamasında engellenir. İnsan onay sahibi/zamanı henüz atanmış değil. Öneri: Orhan, günlük 18:00 Europe/Istanbul; görevlendirme onayı bekliyor. Gerçek kart üretim saati Eylül'de 09:30 Berlin = 10:30 İstanbul; planın 09:30 İstanbul hedefiyle karıştırılmaz.
- **C4:** 20 Eylül için [10 kart inceleme formu](artifacts/editorial-ops-2026-09-06/card-review.csv) hazır; boş satırlar kontrol edilmiş kart sayılmaz.
- **C5:** Meta kart linki ve altyazısında seri/gün/kanal UTM; fiyat takibi/alarm mevcut dönüşüm hattı; yeni başarılı ilan/teklif olayları; izinli tarayıcıda ilk gelişten sonraki farklı bir günde, en fazla 7 gün içinde tek geri dönüş olayı hazır. `content_series=k1..k5`. İlk temas atfı korunur; çoklu cihaz veya çerez reddi ölçülmez. Gerçek ödeme ile seri eşleştirme ve analitik alım kanıtı henüz kapanmadı; model dönüşüm değeri tahsilat değildir.
- **C6:** [241 canlı eligible URL](artifacts/editorial-ops-2026-09-06/seo-pilot-urls.txt) SHA256 ile sabitlendi. Eligible olmak Google indekslendi demek değildir. 3 Ekim GSC URL/sorgu/pozisyon ve mevcut ürün sayfası kayıp ölçümü bekleniyor.
- **C7:** İlk 28 günlük eşit pencere yöntemi ve [ölçüm formu](artifacts/editorial-ops-2026-09-06/content-28day.csv) hazır; gerçek yayın tarihinden önce sayaç başlamaz.
- **D1/D2:** Açıkça “PROVA ILANI — gerçek bir alım değildir” yazan #21; liste, detay, sayım, talep sinyali ve K5 seçkisinden dışlanır. Canlı baz: 5 aktif onaylı kaydın 1’i prova; gerçek public aktif ilan **4**. Salt okunur detay kontrolünde #21 public değil. İç yönetim kaydı silinmez. Takipçi sayısında aynı kişinin favori+alarmı iki kişi sayılmaz; alım ilanı, fiyat takipçisi, arama ilgisi ve iletişime geçilen teklif ayrı etiketlerdir. “Bugünkü” fiyat yerine gerçek son gözlem tarihi gösterilir.
- **D3:** Demre/domates, 10 public firma adayı, hazır ilk temas metni ve huni defteri. Mesaj gönderilmedi; firma sahiplenmesi/görüşme/25 gerçek aktif ilan hedefi operasyon bekler.
- **D4:** Mevcut reklam/API billing akışına bağlı teklif–tahsilat–kullanım–yenileme defteri hazır. Trial, satış ve ödeme diye sayılmadı; gerçek ücretli pilot bekleniyor.
- **D5:** İki 20 saniyelik 1080×1920 [video taslağı](artifacts/editorial-ops-2026-09-06/video-experiment.json), kaynak kart ve eşit 7 günlük kontrol yöntemi hazır. 6 Eylül arşiv verisidir; yayın gününde yeniden üretilecek. Yayın/erişim/kaydetme sonuçları henüz yok.

**Zamanlı kalanlar:** A11 üç gerçek cron günü; C3 editör görevlendirmesi; C4 20 Eylül kalite/yayın sonucu; C6 3 Ekim SEO; C7 gerçek yayınlardan sonra 28 gün; D3/D4 müşteri ve ödeme kanıtları; D5 onaylı yayın sonrası 7 günlük deney. Bunlar tamamlandı diye işaretlenmez.

