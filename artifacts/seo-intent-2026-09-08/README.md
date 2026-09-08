# Sorgu niyeti uygulaması — 8 Eylül 2026

Kullanıcının onayladığı sıra: Adana → kuru üzüm/kekik → Mersin/Erdemli → İzmir/Kayseri → seçilmiş başlık testleri. Strateji karar merkezi Tanitio, teknik uygulama HaldeFiyat.

## Uygulanan değişiklikler

| İş | Sonuç / kapsam |
|---|---|
| Adana limon | Var olan yerel sayfa korundu. Şehir/ürün bağlantıları grafik önüne taşındı ve bağlantı metni şehir+ürün+fiyat oldu. Gerçekleşmeyen haftalık/şehir karşılaştırması vaadi ve market fiyatının daima daha yüksek olduğu iddiası kaldırıldı. |
| Adana mandalina | Resmî belediye arşivi SHA-256 doğrulandı; kaynak yazımları `MANDALİNA(W WMOURKUT)` ve `MANDALİNA(MANDORA)` ayrı ürün kimlikleriyle korundu. 23+1=24 fiyat kaydı kalite hattından geçti. 31 Mayıs–22 Haziran; 90 günlük pencerede 13 gün. Son fiyat 22 Haziran 10–15 TL/kg, orta nokta 12,50. Güncel fiyat değildir. Yerel sayfa noindex, sitemap dışında; kapı düşürülmedi. |
| Kuru üzüm | `/urun/kuru-uzum` ayrı sayfa; yaş üzüm sayfasından bağlantı. İTB tescil kesitinde 13 kayıt; ürün sınıfı ve satış şekli korunuyor. Fiyatlar tek ülke/üretici fiyatına çevrilmedi. |
| Kekik | Demet hal fiyatları ile kg borsa kayıtları ayrı; borsa tablosunda 24 kayıt. Ambalajlı “25 gr” satırının birim belirsizliği açıklandı, kg dönüşümü yapılmadı. Karışık hal örnekleminden tek Türkiye ortalaması ve trend gösterimi kaldırıldı. |
| Mersin/Erdemli | Resmî kaynak canlı VPS’ten tekrar 403. Kaynak açılmış sayılmadı. 5 mevcut bölgesel piyasa sayfasında yerel durum kutusu ve ayrı Türkiye tablosu; “Adana çevrimiçi liste yayımlamıyor”, başka il ürününün kesin Adana/Erdemli menşeli olduğu, sabit ucuzluk ve garantili sezon fiyat yönü iddiaları kaldırıldı. Ulusal sepetten bölgesel haftalık hareket üretilmiyor. |
| İzmir/Kayseri | Hal fiyat listesi hava durumu bileşeninin önüne taşındı; kaynak/tarih, ürün araması ve mevcut URL’ler korundu. Ortak hal bileşeni olduğu için diğer hal sayfaları da aynı sıralamayı kullanır. |
| Başlık testleri | Yalnız `/urun/limon` ve `/urun/mandalina`: “Limon/Mandalina Fiyatları — Hal Listesi ve Çeşitler”. Açıklama şehir/çeşit/tarih/birim ve fiyat türünü anlatır; canonical/robots korunur. Diğer B sorguları ilk dalganın sonucunu bekler. |

## Kaynak ve sınırlar

- İTB: 17 Ağustos–4 Eylül 2026 arasındaki son 15 tescil bülteni, toplam 37 geçerli fiyat satırı, 3 sıfır/miktarsız fiyat farkı satırı dışarıda. `frontend/src/data/itb-specialty.json` her belge için URL ve SHA-256; her satır için tarih/sınıf/satış şekli/fiyat/miktar taşır.
- 7 Eylül salon referans bültenindeki “muamelesiz” kuru üzüm kaydı sıfır fiyat yapılmadı. Referans ve tescil bültenleri aynı seri değildir.
- Borsa tabloları 8 Eylül kontrol tarihli **arşiv kesitidir**; otomatik güncellenen yeni ETL/cron değildir. Tescil fiyatı bahçe veya perakende fiyatı değildir. İleri tarih/mahsul ve satış şekli etiketleri aynen kalır; spot fiyat diye birleştirilmez.
- Adana mandalina mevsimsel eski kaydı, SEO için güncelmiş gibi sunulmadı. Genel mandalina ve farklı Murcott kayıtları üzerine yazılmadı; yeni source-named ürünler mevcut günlük normalizer tarafından birebir eşleşebilir.
- Kekik “25 gr” kaynak birimi ayrıca inceleme gerektirir; bu çalışmada veritabanındaki birim tahmin edilerek değiştirilmedi.
- İlk kullanıcı tablosunun seçili tarih aralığı belirtilmemişti. 10 Ağustos–6 Eylül sorgu–URL arşivi niyet teşhisinde kullanıldı; tabloyla dönem eşitliği varsayılmadı. “Kayıp tıklama” tahmini garanti kazanım değildir.

## Doğrulama ve takip

- 23 Bun testi, 3 Vitest SEO testi ve 3 Python kaynak testi geçti (29 toplam). İlk SEO test denemesi yanlış Bun çalıştırıcısı nedeniyle başarısızdı; doğru Vitest çalıştırıcısında 3/3 geçti.
- Frontend/backend tip kontrolleri geçti.
- İki normal deploy tamamlandı: `3b6a6767a520`, ardından başlık kırpılma düzeltmesi `be8d6b3b894e`. Backend/frontend/admin üretim derlemeleri geçti. Her iki dağıtım penceresinde nginx 5xx sayısı 0; son health db=ok.
- 14 farklı değişen/hedef sayfa HTTP200; yerel mandalina noindex. Kuru üzüm sitemap’te, yerel mandalina sitemap dışında; 37 satırlı CSV HTTP200. Bölgesel 5 başlık artık kırpılmıyor.
- Playwright mobil 390px: kuru üzüm, kekik, Adana mandalina, Erdemli, İzmir ve Kayseri sayfalarında belge düzeyinde yatay taşma yok. Kuru üzüm 13, kekik 24 borsa satırı. Tarayıcı konsolunda hata yok; mevcut font preload uyarıları var. İzmir/Kayseri fiyat listesinin hava durumundan önce olduğu HTML sırasıyla ayrıca doğrulandı.
- Tanitio strateji revizyonu 2 → 3, kaydetme sonrası yeniden okundu; sonuçlar/bağımlılıklar/ölçüm adımları işlendi.
- 13 uygun URL için IndexNow HTTP200 döndü. Bu yalnız bildirim kabulüdür; Google indeksleme veya sıralama kazanımı değildir. Noindex Adana mandalina gönderilmedi.
- Başlıklar öncesi: `before-pages.json`. Teknik yayın günü ilk ölçüm başlangıcıdır; GSC’de yeni başlığın görünmesi ayrıca kontrol edilir. 7 gün sonra tarama/indeks kontrolü, 28 gün sonra aynı sorgu/URL, ülke/cihaz ve eşit dönem CTR karşılaştırması. 3 Ekim mevcut SEO ara kontrolü korunur; 28 günlük deney sonucu yerine geçmez.
- Otomatik sosyal paylaşım, reklam bütçesi değişikliği veya gelecek tarihli çalışma görevi oluşturulmadı.


## CTR deneyi başlangıç kaydı

GSC ilk istek 11 Ağustos–7 Eylül içindi; `final` tarih kapsamı kontrolünde 7 Eylül henüz yoktu. Bu istek nihai 28 günlük taban olarak kullanılmadı. Başlangıç tabanı **10 Ağustos–6 Eylül 2026** olarak tekrar çekildi; limon fiyatları, limon piyasası ve mandalina fiyatları için sorgu/URL/cihaz/ülke kırılımında 54 satır arşivlendi. Kaynak dosyaları `title-test-baseline.json`, `title-test-date-coverage.json`. Karşılaştırma için önerilen yayın sonrası dönem 9 Eylül–6 Ekim; veriler kesinleştikten sonra değerlendirilir. Aynı gün yapılan diğer sayfa değişiklikleri ve Google'ın yeniden tarama tarihi olası etkenlerdir; CTR değişikliği başlığa tek başına nedensel olarak atfedilmez.

## Açık kapılar

- Mersin resmî erişim 403; güncel yerel seri tamamlanmadı.
- Adana mandalinada yeni pozitif bülten yok: arşiv hazır, güncel veri/index yeterliliği bekleniyor.
- Kekik “25 gr” satırının kaynak birimi belirsizliği açıklanıyor; ham birim doğrulanmadan dönüştürülmüyor.
- Borsa sayfası kaynaklı kesittir; yeni kesimlerin otomatik güncellenmesi bu çalışmada kurulmadı.
- CTR ve sıralama sonuçları gerçek gözlem dönemini bekler. Diğer B sorgularının başlıkları sonraki kontrollü dalgaya bırakıldı.
