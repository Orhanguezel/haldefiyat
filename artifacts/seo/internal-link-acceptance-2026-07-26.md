# İç Link HTTP ve Redirect Zinciri Kabulü — 2026-07-26

## Kapsam

- Sitemap sayfası: **316**
- Son sitemap crawl: **316/316 HTTP 200**
- Son SSR grafiğindeki benzersiz HTML navigasyon hedefi: **1.959**
- Yan etki/indirme riski nedeniyle istek atılmadan ayrı envanterlenen API
  click/CSV hedefi: **179**

## Başlangıç Ölçümü

İlk tam hedef kontrolünde:

- HTML hedef: **2.463**
- 2xx: **2.449**
- 4xx: **14**
- 5xx/ağ hatası: **0**
- Redirect içeren hedef: **511**
- Birden uzun redirect zinciri: **50**

Yoğun paralel HEAD kontrolünün dinamik katalog proxy’sinde geçici 404 üretebildiği
ayrıca saptandı. Bu adaylar tek işçi ve gerçek GET ile yeniden doğrulandı; proxy
backend timeout/5xx ile doğrulanmış “slug yok” sonucunu artık birbirinden ayırıyor.

## Uygulanan Düzeltmeler

- Fiyat satırları ham ETL `productSlug` yerine `canonicalProduct` hedefine bağlandı.
- Varyant karşılaştırmasında aynı master sayfaya dönen alias’lar link olmaktan
  çıkarılıp bilgilendirici metin olarak bırakıldı.
- Widget, ticker, sezon rehberi, pazar hareketleri ve ürün ilişkileri ortak
  kanonik link politikasına bağlandı.
- Varsayılan Türkçe locale için `/tr/...` iç linkleri doğrudan prefixsiz kanonik
  hedeflere çevrildi.
- Aktif `biber → biber-carliston` ve `sarimsak → sarimsak-kuru` redirectleriyle
  çelişen 51 çocuk ürün kaydı nihai master’a doğrudan bağlandı.
- Katalog backend’i geçici yanıt vermediğinde proxy’nin hard 404 üretmesi engellendi.

## Nihai Kabul

- Son SSR grafiği: **1.959** benzersiz HTML hedef
- Sonuç 2xx: **1.959**
- Nihai 3xx: **0**
- 4xx: **0**
- 5xx: **0**
- Ağ hatası: **0**
- Redirect içeren iç hedef: **0**
- Birden uzun redirect zinciri: **0**

Son dokuz pazar hareketi alias’ı, altı kaynak hal sayfasında canlı SSR üzerinden
ayrıca kontrol edildi; alias `href` değeri 0, kanonik hedefler mevcut ve sayfalar
HTTP 200. Beş şehir filtre hedefi de redirect olmadan doğrudan HTTP 200 verdi.

## Kanıtlar

- Başlangıç tam hedef raporu:
  `artifacts/seo/internal-link-status-2026-07-26/report.json`
- GET yeniden doğrulama:
  `artifacts/seo/internal-link-get-acceptance-2026-07-26/report.json`
- Nihai SSR grafiği:
  `artifacts/seo/live-crawl-internal-links-final-2026-07-26/report.json`
- Kod/deploy: `16b48efb`, `6f997811`, `7032275b`, `b7993dfe`, `a2b845a1`
