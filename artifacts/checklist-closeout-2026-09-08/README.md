# HaldeFiyat checklist uygulaması — 8 Eylül 2026

Dört kaynak belge yeniden değerlendirildi; uygulanabilir veri/SEO/monitör düzeltmeleri canlıya alındı. Gerçek kaynak erişimi, takvim, insan incelemesi, fiziksel cihaz ve ödeme kanıtı gerektiren maddeler açık tutuldu. Bu rapor tüm ticari hedeflerin gerçekleştiğini söylemez.

## Canlı sonuçlar

| İş | Doğrulanan sonuç |
|---|---|
| Rakip ölçümü | #6: 30/30 sorgu, 570 sonuç, tek motor Brave; 187 web alan adı |
| Sosyal fırsatlar | 27 sorgu–URL eşleşmesi: 3 hesap sonucu, 17 grup sonucu (8 ayrı grup), 7 gönderi sonucu (6 ayrı URL); gruplar web rakibi toplamından ayrı |
| Karşılaştırma | #5 ile aynı motor/derinlik/sorgu kümesi: 2 yeni, 1 kaybolan alan adı; Google değişimi değildir |
| Seed | MySQL 8.0.46, geçici tablolarda 097+099 iki tekrar başarılı; canlı veritabanı drop/seed edilmedi |
| Snapshot | DOM sayımları toplam ürün/hal diye sunulmuyor; JSON-LD yalnız çekilen sayfa kapsamında. Eski sezgisel kayıtlar DB’de korunup public admin çıktısında doğrulanmamış etiketleniyor |
| Adana | 90 kaynak günü / 5.044 kayıt; genel limon canlı ve indexlenebilir. Mayer 22 gün, noindex |
| Kayseri | Son kaynak 7 Eylül; 1 Haziran sonrası 97 gün / 11.367 kayıt; sayfada 115 ürün |
| Mersin | Çözülmedi: resmî kaynak WAF 403, son yerel kayıt 22 Haziran. Eski tarih “bugün” yapılmadı |
| Eski elma analizi | Yönetilen 301 → `/urun/elma`; Mayıs taslağı yeniden yayımlanmadı |
| Yazılar | 25 yayının meta alanları dolu; nar/turşuluk ve iki son haftalık rapor canlı |
| Google | Sitemap PUT 204; mevcut GA4 property 538279658 / G-YHLL9WK7ML doğru alan adına bağlı, Admin API 200 |
| IndexNow | Rehberler, nar/turşuluk analizleri ve Adana limon dahil 7 URL, HTTP 200 |
| İlanlar | 5 gerçek aktif public ilan; 1 prova kayıt public dışı. Süreler yapay uzatılmadı |
| Git / dağıtım | Kaynaklar bağımlılıklarıyla commit/push edildi; normal deploy.sh; canlı çalışma ağacı temiz. 19 runtime logo/OG dosyası Git’ten çıkarılırken SHA-256 ile korunarak doğrulandı |

Kod commit’leri: `6cdaf140` (veri/monitör/atomik kaynak), `89a381d2` (çerez SSR), `0fbbeaad` (eski snapshot etiketi), `986aed44` (font ön yükleme). Normal dağıtımların 5xx sayıları sırasıyla **0 / 0 / 2 / 0**. Aynı gün içindeki dört dağıtım, S6’nın “üç ayrı dağıtım günü” kabulünün yerine geçirilmez.

## Sorgu ve içerik ölçümü

**Öncelik dönemi 10 Ağustos–6 Eylül 2026** olarak korundu. Pozisyon ≤10, gösterim ≥100, CTR <%3 kapısından **232 sorgu** geçiyor: [aday CSV](gsc-candidates.csv). Bunlar otomatik 232 yeni URL kararı değildir. Güncel uygun şehir–ürün çiftleri [ayrı envanterde](eligible-pairs.json); mevcut sayfa ve kaynak güncelliği önce gelir. Adana yeni seriyle açıldı, Mersin ve Mayer eşikleri atlanmadı. Ürün sayfası → uygun şehir serisi iç linki canlı doğrulandı; yalnız bir uygun şehir olduğunda da gösterilir.

Yeni monitörün GSC etiketi çalışma anındaki son kesinleşmiş dönem olan **9 Ağustos–5 Eylül**dür. Bu dönemi araştırmanın 10 Ağustos–6 Eylül dönemiyle aynı diye sunmuyoruz. Eski #4’ün 194 alan adı / 403 eşleşme araştırma dosyaları değiştirilmedi. Yeni #6’nın 187 alan adı, tek başına “7 Google rakibi kayboldu” anlamına gelmez.

Mevcut `published_at` tarihinden ilk 28 günü dolmuş 15 yayında [eşit yaş penceresi ölçümü](editorial-28day.json) yapıldı. 10 yayın henüz süre bekliyor. URL formatı slug’dan sınıflandırıldı:

| Format | Yazı | Gösterim | Tıklama | CTR |
|---|---:|---:|---:|---:|
| Haftalık | 11 | 161 | 0 | %0 |
| Aylık | 2 | 143 | 3 | %2,10 |
| Diğer analiz | 2 | 3.740 | 44 | %1,18 |

Bu küçük örneklem ve farklı yayın takvimleri formatın nedensel etkisini kanıtlamaz. Dönmeyen günlük GSC satırları, eksiksiz veri toplandığının kanıtı değildir. En fazla ilgi alan tek yazı soğan analizi olduğundan format ortalamasını genellemek özellikle yanıltıcıdır.

## ETL sıçraması

`run_date` yerine gerçek `created_at` zamanıyla eşit 12 günlük pencereler kullanıldı; sonradan yapılan arşiv çekimleri geçmiş çalışma gününe yazılmadı.

| Dönem | Tüm koşular | Kısmi | Oran | Hata |
|---|---:|---:|---:|---:|
| 7–18 Ağustos | 659 | 59 | %8,95 | 13 |
| 19–30 Ağustos | 710 | 169 | %23,80 | 5 |

Eski rapordaki **59/659 = %11** hesabı yanlış. Güncel sayım ile eski dondurulmuş 708/168 sayımındaki fark gizlenmedi. [Kaynak kırılımı](etl-partial-causes.csv) ve [canlı SQL çıktısı](live-audit.json) birlikte saklandı. Artışta İzmir balık, Kayseri ve Eskişehir +9’ar; Hal.gov.tr, Kütahya ve Manisa +8’er kısmi koşu öne çıkıyor. Her kaynak grubunun hata örneğinde fiyat karantinası veya sıhhat reddi var; örnek hata bütün grubun tüm satırlarını açıklamaz. Bu nedenle “partial = kaynak sayfası çekilemedi” denmez.

Kayseri koli/kg ve “Domates Kasa Salkım” sınıflandırması için mevcut 2 Eylül düzeltmesi korundu. Paket ağırlığı bulunmayan diğer koli satırları, birim uyuşmazlıkları ve fiyat sıçramaları kontrol dışı yazılmadı. Kısmi koşunun kaç satır kaybettiği fetched/inserted/skipped ile birlikte incelenmelidir; normalleştirme nedeniyle atlanan satırların hepsi karantina değildir.

Perakendede **1/3 gerçek zamanlanmış gün**: 7 Eylül 09:30 UTC, 149 doğrulanmış teklif / 149 yazım, altı zincir, kaynak günü 7 Eylül; 50 arama bağlantı hatası, yazım hatası yok. [Cron kanıtı](retail-scheduled.json). 1 Eylül için mevcut loglardan kesin kök neden kurulamadı; yok satır “cron çalışmadı” kanıtı değildir.

## Performans ve kabul

Ana sayfanın tüm fetch önbelleklerini iptal eden `force-dynamic` kaldırıldı. Mevcut fiyat önbelleği/revalidation yolu korunuyor. Çerez kutusu, geç hydration yerine ilk HTML’de gerçek kabul/ret çerezine göre gösteriliyor. Yerel depolama kapalı olsa da açık seçim çerekte saklanabiliyor. Mevcut IBM Plex Latin ve Türkçe alt kümeleri önceden yükleniyor; yavaş bağlantıda geç font değişimi önleniyor. Font lisansı kaynak dosyalarıyla tutuluyor.

| Aynı yerel mobil Lighthouse | İlk ölçüm | Son ölçüm |
|---|---:|---:|
| Skor | 52 | 72 |
| Simüle FCP | 3,68 sn | 2,33 sn |
| Simüle LCP | 6,04 sn | 4,69 sn |
| Doğrudan gözlenen LCP | 2,43 sn | 1,01 sn |
| TBT | 606 ms | 371,5 ms |
| CLS | 0 | 0 |

**Performans hedefi tamamlanmadı.** Simülasyon/gözlem ayrı; ara ölçümler ve oynaklık [tam tabloda](performance-summary.json). İlk/son fark tek başına nedensel veya tüm kullanıcılar için hız garantisi değildir. Anahtarsız PSI çağrısı 429 döndü; bu sonuç kimliği doğrulanmış bir hesabın kotası hakkında iddia değildir. Bağımsız runner ve gerçek kullanıcı CrUX p75/28 günlük kabulü açık.

23 Bun testi / 59 assertion ve 8 pamuk parser testi geçti. Backend/frontend/admin typecheck ve production build başarılı. İki tekrar seed denemesi bağlantıya özel geçici tablolarda yapıldı. 390 px’de yatay taşma yok, son public tarayıcı oturumunda konsol hatası yok. Çerez yok/kabul/ret durumları SSR’de; ret ve yeniden yükleme tarayıcıda doğrulandı. [Sosyal sekme görüntüsü](../../output/playwright/checklist-closeout/social-opportunities.png), [mobil son görünüm](../../output/playwright/checklist-closeout/home-mobile-final.png).

## Gerçek açık bağımlılıklar

| Maddeler | Eksik koşul / sıradaki gerçek kanıt |
|---|---|
| Mersin, A7.2 / S20 | Resmî kaynağın erişilebilir bülteni; Mayer için tarih ve arama hacmi eşikleri |
| Veri A11 | İki ek gerçek cron günü, kapsam ve sağlayıcı bağlantı hatalarının takibi |
| C3; F1.38/G1.5 | Editör/saat ve resmî açık adres kullanıcıdan istendi; cevap gelmediği için atanmış/verilmiş sayılmadı |
| C4 / C6 | 20 Eylül kart kalitesi; 3 Ekim dondurulmuş SEO pilotu |
| C5 / D4 / F10.5 / S25 | Üç canlı Stripe ayarı yok; reklam ödeme/talep/bekleme tabloları boş. Gerçek tahsilat yok |
| D3 / F10.4–F10.7 / S9 / S10 / A4 | Gerçek müşteri, fiyat kararı, Atakan’ın temas listesi, görevlendirilmiş dış temas; koddan müşteri sonucu uydurulamaz |
| D5 | Onaylı gerçek yayın ve eşit yedi günlük video/kart sonucu |
| F0.23/F0.24/F7.19/D14/S28/A12.2 | Performans/CrUX kabulü; yerel sonuçlar iyileşse de hedef tamamlanmadı |
| S6 | Üç ayrı dağıtım günü <20 hata kabulü; geçmiş 1–7 Eylül logu hedefin sağlandığını kanıtlamıyor |
| F0.25/F7.8/F7.10 | Gerçek NVDA/VoiceOver/Safari/Firefox cihaz kabulü; Chromium emülasyonu yerine sayılmadı |
| E9 | Önceki fotoğrafların lisans/eser sahibi/kaynak arşivi |
| E14 | Bu görev dışındaki web-connection WIP’i sahibinde korunuyor |
| S13 / S24 | Kasım karar penceresi |

[İş başlamadan açık maddeler](open-items-before.csv), [iş sonu madde envanteri](item-disposition.csv). Yeni kaynak kodu işi ile gerçek dünyada oluşması gereken sonucu ayrı tuttuk; dört ana belge bu ayrımı yansıtacak şekilde güncellendi.

Not: nginx 7 Eylül satırı çekim anına kadarki gündür; gün sonu tamamlanmış dönem sayılmaz. Ham fiyat ve GSC kanıtları bu çalışma alanında saklanır.

**A7.3 toplu son bildirim:** 224 uygun şehir–ürün URL’si (Adana: 16) IndexNow’a gönderildi; HTTP 200. Noindex Mayer ve verisiz Mersin bu listeye katılmadı.
