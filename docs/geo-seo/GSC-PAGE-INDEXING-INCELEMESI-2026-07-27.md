# HalDeFiyat GSC Page Indexing İncelemesi — 2026-07-27

## Kapsam ve veri kaynağı

- Kaynak: canlı `gsc_url_index` URL Inspection cache'i.
- GSC property: canlı `gsc_site_url` ayarı yapılandırılmış.
- Google OAuth client, secret ve refresh token yapılandırılmış; gizli değerler
  rapora alınmadı.
- Toplam denetlenmiş URL: **1.503**
- Kontrol aralığı: **30 Haziran–26 Temmuz 2026**
- En yeni cache kontrolü: **26 Temmuz 2026 02:02:53 UTC**
- Bu veri URL bazlı Google URL Inspection sonucudur. GSC arayüzündeki Page
  Indexing grafik geçmişi veya “validation started” durumu değildir.

## Coverage dağılımı

| GSC coverage_state | URL | Değerlendirme |
|---|---:|---|
| Submitted and indexed | 277 | Sağlıklı |
| Discovered - currently not indexed | 12 | 10 indekslenebilir takip, 2 güncel noindex hal |
| Crawled - currently not indexed | 3 | 1 indekslenebilir analiz, 2 güncel 301 ürün |
| Excluded by ‘noindex’ tag | 600 | 576 ürün, 23 hal, 1 diğer; çoğu bilinçli dışlama |
| Page with redirect | 310 | Ürün varyantı/master konsolidasyonu; sitemap dışı |
| URL is unknown to Google | 300 | 294'ü `seo_index=0` ürün; crawl talebi yok |
| Not found (404) | 1 | Eski `fejoya`; bugün bilinçli HTTP 410 |

Toplam verdict: **277 PASS**, **1.226 non-PASS**, null verdict **0**.

## Gerçek indekslenebilir takip kümesi

### Crawled - currently not indexed

- `/analiz/mayis-4-hafta-2026-hal-raporu`

Sayfa bugün HTTP 200, self-canonical, indexlenebilir ve sitemap içindedir.

### Discovered - currently not indexed

- `/analiz/mayis-5-hafta-2026-hal-raporu`
- `/analiz/nisan-3-hafta-2026-endeks-analizi`
- `/analiz/nisan-son-hafta-2026-hal-raporu`
- `/basin`
- `/firmalar/antalya/komisyoncu`
- `/firmalar/sanliurfa`
- `/firmalar/van`
- `/urun/dereotu-yas-taze`
- `/urun/karalahana`
- `/urun/misir-taze`

Bu 10 URL bugün HTTP 200, self-canonical, indexlenebilir ve sitemap içindedir.
Tam canlı crawl'da orphan veya redirect zinciri bulunmadığından teknik
keşfedilebilirlik engeli yoktur. Google yeniden tarama/index seçimi izlenmelidir.

## Beklenen veya artık geçersiz non-index kayıtları

- `/urun/k-sogan` bugün `/urun/sogan-kuru` hedefine tek 301; sitemap dışı.
- `/urun/mandalina-mersin` bugün `/urun/mandalina` hedefine tek 301; sitemap dışı.
- `/hal/eregli-konya-ticaret-borsasi` ve
  `/hal/gaziantep-ticaret-borsasi` bugün `noindex,follow`; sitemap dışı.
- `/urun/fejoya` aktif olmayan eski kayıt; bugün HTTP 410 ve sitemap dışı.

Bu beş URL için indeks talebi yapılmamalıdır.

## Stale noindex kümesi

GSC cache'inde “Excluded by ‘noindex’ tag” görünen **24 ürün**, bugün
`seo_index=1`, yayımlanmış editoryel içerikli ve canonical master olmayan
ürünlerdir:

`arpa`, `bal-kabagi`, `domates-ayas`, `dut-kara`, `elma-arjantin`,
`erik-papaz`, `frenk-uzumu`, `incir`, `incir-siyah`, `kamkat`,
`kavun-kirkagac`, `kayisi-mut`, `kestane`, `kiraz-napolyon`,
`kirmizi-lahana`, `mantar`, `patlican-topak`, `reyhan`, `roka-bag`, `turp`,
`turp-findik`, `turp-kirmizi`, `turp-siyah`, `zencefil`.

Google'ın kaydettiği son crawl tarihleri 25 Mayıs–14 Temmuz arasındadır.
26 Temmuz URL Inspection kontrolü eski crawl sonucunu döndürmektedir; bu,
canlı sayfanın bugün hâlâ noindex olduğu anlamına gelmez. Sitemap ve canlı robots
durumu korunmalı, Google yeniden taraması sonrası coverage değişimi izlenmelidir.

## Duplicate/canonical ve hata kırılımı

- Coverage adında `duplicate`: **0**
- Coverage adında `canonical`: **0**
- Soft 404: **0**
- Server error: **0**
- “Page with redirect”: **310**; 301'i ürün tablosunda canonical master'a bağlı,
  kalanları tam canlı crawl kabulünde tek nihai hedefe indirgenmiş eski URL'ler.
- Son tam SSR iç-link kabulünde 1.959/1.959 hedef 2xx; redirect, 4xx, 5xx ve uzun
  zincir **0**. Bu nedenle GSC'nin tarihsel redirect kümesi güncel iç-link hatası
  değildir.

## Sonuç ve izleme

Page Indexing kırılımı tamamlandı. Bugünkü gerçek aksiyon:

1. 11 indekslenebilir takip URL'sinin Google yeniden tarama/index sonucunu izle.
2. 24 stale-noindex ürünün coverage değişimini sonraki crawl sonrası karşılaştır.
3. Bilinçli 301/noindex/410 URL'lerini sitemap'e geri ekleme veya indeks talebi
   yapma.
4. Duplicate/canonical, soft-404 veya server-error sayısı sıfırdan yükselirse
   URL bazlı regresyon incelemesi aç.

