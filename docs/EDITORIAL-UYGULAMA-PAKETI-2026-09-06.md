# Eylül uygulama paketi — brief, pilot ve ölçüm

6 Eylül 2026. Durum: üretim ve ölçüm hazırlığı tamam; sosyal yayın, müşteri teması,
editör onayı ve gelecekteki sonuçlar gerçekleşmiş sayılmıyor. Ana kuyruk:
[veri ve editoryal checklist](../HALDEFIYAT-VERI-VE-EDITORIAL-CHECKLIST-2026-09-06.md).

## B6 — Onaya hazır üç içerik briefi

### Verinin Kaynağı: “Fiyatın tarihi neden önemli?”

Amaç: okuyucuya bir hal–market karşılaştırmasının sınırlarını öğretmek. Mevcut K4'ü
ve ürün sayfasını kullan; yeni kart motoru kurma. Format: K4 görseli + aşağıdaki altyazı.

> Aynı ürünü aynı gün ve aynı birimde karşılaştırıyoruz.
> 6 Eylül 2026 örneğinde şeftalinin hal ortalaması 37,67 TL/kg; izlenen doğrulanmış
> market örneği Migros'ta 89,50 TL/kg. Hal değeri üç halin eşit ağırlıklı ortalaması;
> bu satırda bir zincir var. Şube, kalite ve ambalaj farklı olabilir. Aradaki fark,
> maliyetleri göstermediği için kâr marjı değildir. Verinin gününü ve kaynağını
> ürün sayfasından kontrol edin: https://haldefiyat.com/urun/seftali

Kanıt: [dondurulmuş K4 cevabı](../artifacts/editorial-ops-2026-09-06/video-source-card.json),
`backend/src/modules/social/cards/gap-policy.ts`. Kaynak gününden sonraki yayında bu
metni “bugün” diye kullanma; tarihli örnek olarak etiketle veya yeni kart üret.
Onay: tarih, TL/kg, 3 hal / 1 zincir ve kâr açıklaması görsel + metinde aynı olmalı.

### Firma ve Piyasa Rehberi: “Firma kaydınızı nasıl güncellersiniz?”

Amaç: mevcut sahiplenme akışına yönlendirmek. Format: metin + mevcut firma sayfası
bağlantısı; hedef segment Demre'deki komisyoncu kayıtları. Kaydın olması doğrulanmış
müşteri veya satış anlamına gelmez.

> Firma rehberindeki bilgilerinizi kontrol edin: https://haldefiyat.com/firmalar
> Firmanızın kaydını bulup sahiplenme başvurusu yapabilir, doğrulamanın ardından
> bilgilerinizi yönetebilirsiniz. İlan açarken ürün çeşidini, birimini, miktarı ve
> teslim bölgesini açık yazın. Rehber kaydı stok, fiyat veya ticaret garantisi değildir.

Kanıt: `backend/src/modules/firms/index.ts` içindeki mevcut `/firms/:id/claim` ve
`/firms/:id/manage` uçları. [On adayın public kayıtları](../artifacts/editorial-ops-2026-09-06/firm-pilot-candidates.json)
ile filtre doğrulandı; iletişim veya ürün uygunluğu henüz doğrulanmadı. Ham telefon
ve kişi bilgileri bu pakete aktarılmadı. CTA hedefini oturumlu gerçek akışla editör
kontrol eder; “hemen doğrulandı” sözü verilmez.

### Doğrulanmış kullanım örneği: “Domates fiyatını doğru okumak”

Amaç: gerçek müşteri hikâyesi uydurmadan doğrulanmış sistem davranışını anlatmak.
Format: metin + ürün bağlantısı, “ürün kullanım örneği” etiketi.

> 5 Eylül 2026 tarihli doğrulanmış market gözleminde “Domates 1 Kg” kaydı ŞOK için
> 39 TL/kg gösteriyor. Ürün sayfasında marketin ham ürün adı, birim ve gözlem günü
> birlikte bulunuyor. Bu fiyat, farklı günlerin ortalaması değil tek günlük bir
> gözlemdir. Yeni fiyat gelmediğinde eski tarihi gizlemiyoruz.
> https://haldefiyat.com/urun/domates

Kanıt: [API kaydı](../artifacts/retail-2026-09-06/public-domates.json) ve
[HTTP kabulü](../artifacts/retail-2026-09-06/http-check.json). Bu metin müşteri tasarrufu,
memnuniyeti veya satın alma kanıtı değildir. Müşteri hikâyesi için gerçek kullanıcı
onayı, kullanım tarihi ve kanıtlanan sonuç ayrıca gerekir.

## C4 — 20 Eylül kalite ve yayın kararı

[İnceleme defteri](../artifacts/editorial-ops-2026-09-06/card-review.csv) on satırlık
boş kabul formudur; hiçbir satır kontrol edildi diye işaretlenmedi. K1–K5 dağılımı
4/2/2/1/1; yeterli K4/K5 verisi yoksa gerekçeli atlama yazılır, uygun başka gerçek
kartla on kontrol tamamlanır. Her satır: içerik anahtarı, kaynak gözlem günleri,
birim, ham ürün/çeşit, fiyat hesabı, kaynak URL, altyazı/görsel tutarlılığı, editör,
kontrol zamanı ve hata adedi. On benzersiz kartta sıfır hata olmadan otomatik yayın
kararı çıkmaz. Sonradan düzeltilmiş hata ilk inceleme tarihçesinden silinmez.

Yayın oranı iki ayrı payda ile raporlanır: başarılı yayın / planlanan slot ve başarılı
yayın / onaylanıp yayın denenen içerik. Geçmiş 1–5 Eylül slotları yayımlanmış sayılmaz.
Eksik veri, onay bekleme ve kanal hataları ayrı sayılır; erişim sadece URL'si ve
ölçüm zamanı bulunan gönderilerde raporlanır. Ölçüm penceresi her gönderide ilk 7 gün.

## C6 — 3 Ekim SEO pilotu

Canlı `/api/v1/prices/city-products?eligible=1` cevabından **241 benzersiz URL**
6 Eylül'de sabitlendi: [liste](../artifacts/editorial-ops-2026-09-06/seo-pilot-urls.txt),
[kaynak](../artifacts/editorial-ops-2026-09-06/seo-pilot-source.json),
[zaman ve SHA256](../artifacts/editorial-ops-2026-09-06/seo-pilot-manifest.json).
Bu uygunluk sayısıdır; Google'da indeksli URL sayısı değildir. 3 Ekim'de listeyi
sonradan uygunlaşan URL'lerle değiştirme. Yeni URL'leri ayrı kohortta izle.

GSC dışa aktarımı: property `https://haldefiyat.com/`, günlük veri, `page`, `query`,
`country`, `device`, `date`, `clicks`, `impressions`, `position`. 6 Eylül–3 Ekim
28 günlük kohort; GSC gecikmesi nedeniyle 3 Ekim raporunda eksik son günleri işaretle,
tam 28 gün geldiğinde sonucu tamamla. URL Inspection: son inceleme zamanı,
Google canonical, user canonical, verdict, coverageState, robotsTxtState,
indexingState, lastCrawlTime. URL sayımını güncel kaynak yeterliliğinden ayır.

Rapor sütunları: sabit 241 içinden hâlâ uygun sayısı, uygun+indeksli / uygun,
indeks durumu bilinmeyen sayısı, toplam tıklama/gösterim. Inspection alınamayanı
“indeksli değil” sayma. CTR = toplam tıklama / toplam gösterim; konum gösterimle
ağırlıklı. Sorgu niyeti ve konum 1–3 / 4–10 / 11–20 / 21+ ile mobil/masaüstü
ayrı. Az gösterimli satırların CTR'ından sonuç çıkarma; genel %4 barajı yok.

Kontrol grubu: sabit listedeki ürün slug'larının mevcut `/urun/<slug>` sayfaları.
9 Ağustos–5 Eylül ve 6 Eylül–3 Ekim eşit 28 günde aynı sorgu/ülke/cihaz kümesinin
tıklamalarını karşılaştır. Şehir sayfasındaki artışla ürün sayfasındaki kaybı birlikte
ver; mevsim ve SERP değişimi nedeniyle farkı tek başına nedensel kazanım sayma.
[SEO ölçüm formu](../artifacts/editorial-ops-2026-09-06/seo-review.csv).

## C7 — Yazıların ilk 28 gün karşılaştırması

[İçerik kohort formu](../artifacts/editorial-ops-2026-09-06/content-28day.csv) yalnız
**gerçek published_at** olan aylık/haftalık yazılarla dolar. Taslak oluşturulma tarihi
başlangıç değildir. Saat dilimi Europe/Istanbul; her yazıda `[published_at,
published_at + 28 gün)` aralığı kullan. Henüz olgunlaşmayan yazıyı karşılaştırmaya alma.
Haftalık yazıların medyanı ve dağılımını aylık yazıyla karşılaştır; dört haftalık yazının
oturumunu toplayıp tek aylık yazıyla başa baş başarı gibi sunma.

Mevcut GA4 raporunda landingPage, sessionSource/Medium, sessionCampaignName,
activeUsers, sessions, engagedSessions ve ölçülebilen anahtar olayları al.
Consent/adblock nedeniyle GA4 ve sunucu toplamı eşit olmak zorunda değildir.
Kaynak/cihaz kırılımını eşitle; dönemsel kampanyayı işaretle. GSC için aynı 28 günlük
sayfa/sorgu toplamlarını kullan. Ölçülmeyen okuma, takip, alarm, 7 günlük dönüş ve
ödeme hücreleri NULL/bilinmiyor kalır; olay tetiklenmesini işlem başarısı sayma.
Mevcut günlük tuzlanan visitor_hash ile yedi günlük kullanıcı dönüşü kurulmaz;
C5'in izinli ve sürekliliği doğrulanmış kimliği gerekir. 300 oturum rehber deney
hedefidir; gerçekleşmiş ya da tahmin edilmiş trafik değildir.

## D3 — Antalya / Demre domates pilotu

Seçim kanıtı: sabit SEO örneğinde Antalya/domates, Demre Toptancı Hali kaynağıyla
90 günün 89'unda kayıt taşıyor (son gün 5 Eylül). Bu veri sürekliliğidir; alıcı talebi
kanıtı değildir. Aynı ilçeden 10 rehber adayı donduruldu; domates ticareti, firma
bilgilerinin güncelliği ve iletişim yetkisi görüşmede ayrıca doğrulanmalı.

Operasyon sırası: sorumlu ilk 10 adayı mevcut CRM'ye kaynak ID ile alır; izinli
iletişimde faaliyet/ürün doğrular; sahiplenme linkini paylaşır; gerçek ilanı mevcut
ilan akışından açtırır; karşı taraftan gelen yanıtı ve gerçekleşmiş görüşmeyi bağlar.
İlk kohort tamamlanmadan 100 firmaya toplu mesaj gönderme kararı çıkarılmaz.
Bu paketten hiçbir mesaj gönderilmedi. Sorumlu ve gerçek tarihler henüz atanmadı.

Onaya hazır ilk temas metni:

> Merhaba, HaldeFiyat firma rehberindeki kaydınızın güncelliğini kontrol etmek için
> yazıyoruz. Demre'de domates alım/satımı yapıyor musunuz? Uygunsa firma kaydınızı
> sahiplenme ve gerçek ilanınızı ekleme adımlarını paylaşabiliriz. İstemiyorsanız
> tekrar iletişime geçmeyeceğiz.

[Huni defteri](../artifacts/editorial-ops-2026-09-06/firm-pilot-funnel.csv): firm_id
ile tekilleştir; erişim, yanıt, uygunluk, sahiplenme, gerçek ilan, yanıtlanan talep ve
iki tarafça doğrulanmış görüşmeyi ayrı tarihler/kanıt referanslarıyla kaydet. Telefon
açılması görüşme başarısı değildir. 15 Ekim'de 25 gerçek aktif ilan hedefiyle birlikte
süresi dolmamış ilan, cevap oranı ve doğrulanmış görüşme sayısı açıklanır. Prova,
aynı ilanın kopyaları ve yetkisiz firmalar paydadan çıkarılır. Bugün ticari sonuç yok.

## D4 — İlk ücretli pilotun kayıt paketi

Yeni abonelik sistemi kurulmaz. Mevcut firma `deals`, `sponsorships`, `ad-campaigns`
yönetimi (`backend/src/modules/firms/index.ts`) ve API billing/Stripe webhook
(`backend/src/modules/billing`) kullanılır. Trial veya checkout açılışı tahsilat değildir.
[Ücretli pilot defteri](../artifacts/editorial-ops-2026-09-06/paid-pilot.csv) boş hazırdır.

Teklif taslağı: “Demre domates pilotunda [reklam yerleşimi / mevcut API paketi],
[başlangıç–bitiş], [mevcut onaylı fiyat] TL + uygulanabilir vergi; teslim kapsamı
[yerleşim ve gösterim raporu / kota ve endpoint kapsamı]. Satış veya gelir garantisi
yok. Kullanım raporu dönem sonunda; yenileme ayrıca onaylanır.” Gerçek fiyat,
muhatap ve dönem kesinleşmeden teklif gönderilmez.

Kanıt zinciri: onaylı teklif/deal ID → mevcut fatura/Stripe payment referansı +
tutar/para birimi/tahsilat zamanı → reklam kampanya ID gösterim/tıklama veya API key
**ID** bazında başarılı istek ve aktif gün (anahtarın kendisini kaydetme) → gerçek
müşteri geri bildirimi → yeni dönem onayı + yeni tahsilat. Başarısız/refund/iptal
ayrı statüdür. Yenileme niyeti yenileme ödemesi değildir. Finans belgeleri ve iletişim
bilgileri private CRM'de; repoda sadece referanslar tutulur.

## D5 — İki video taslağı ve adil deney

[Video 1](../artifacts/editorial-ops-2026-09-06/video-01.mp4) ve
[Video 2](../artifacts/editorial-ops-2026-09-06/video-02.mp4): 20 saniye, 1080×1920,
sessiz H.264. Tam K4 kartı, tarih ve sınırlamalar kırpılmadan korunur. Biri yumuşak
açılış, diğeri ilerleme çizgisi kullanır. [ffprobe kabulü](../artifacts/editorial-ops-2026-09-06/video-validation.json).
Yeniden üretim: `python3 scripts/editorial/render-video-drafts.py` (ffmpeg gerekir).

İkisi de 6 Eylül **arşiv verisinden hazırlanmış taslaktır**, sonraki gün güncel fiyat
reels'i diye kullanılamaz. Yayından önce güncel doğrulanmış kartla yeniden üretim ve
editör onayı gerekir. K4 yoksa bekle, eski veriyle bugünkü slotu doldurma.
[Deney manifesti](../artifacts/editorial-ops-2026-09-06/video-experiment.json).

Her video için kontrol aynı tam kart, aynı ürün/mesaj/tarih, altyazı, CTA ve kanal.
İki testin her kolu gerçek yayından sonraki ilk 7 gün ölçülür; eşit bütçe varsa eşit
bütçe ve aynı hedef kitle, organikte eşleşmiş gün/saat. Organik iki gönderi rastgele
atama değildir; sonuç keşifseldir. `utm_content` kontrol/video ayrımı taşır; mevcut
C5 atfını kullan. Erişim ve kaydetme/erişim yanında doğrulanmış site eylemlerini
raporla; görüntüleme ≠ benzersiz erişim. Az veri veya eksik ölçümde kazanan ilan etme.
Yayın URL'leri, yayın/ölçüm saatleri ve sonuçlar bugün NULL'dır.
