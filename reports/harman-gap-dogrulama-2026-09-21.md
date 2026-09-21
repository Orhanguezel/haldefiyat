# Harman farkı — doğrulama ve uygulama raporu

**Tarih:** 21 Eylül 2026
**Kapsam:** Salt-okunur rekabet/GSC/canlı veri doğrulaması; üzüm teşhisi;
Mersin kaynak erişimi; ortak hal sayfası sunumu

## Sonuç

- Tanitio'nun son tamamlanmış Brave koşusu 30/30 sorguyu ve ilk 20 sonucu
  kapsıyor. Harmanapps 29, HaldeFiyat 24 sorguda görünür; ikili sonuçta
  Harmanapps 24 sorguda, HaldeFiyat 5 sorguda önde. Bu Google sırası değildir.
- GSC'nin Türkiye + mobil + Web + final verileri checklist'teki 13–18 Eylül ve
  6–11 Eylül sayılarını doğruladı.
- Üzüm kaybı teknik index/canonical, URL göçü veya veri kapsamı düşüşüyle
  açıklanmıyor. Düşüş 10 Eylül'de keskinleşiyor; en güçlü açıklama kısa pencere,
  mevsimsellik/SERP ve sorgu niyeti bileşimidir. Bu nedenle title/canonical
  deneyi yapılmadı. Yaş/sofralık üzüm ile kuru üzüm ayrımı ilk cevapta görünür
  hale getirildi.
- Mersin'in resmî sayfası gerçek Chromium'da da HTTP 403 ve `Turk Telekom Waf
  by Altosec` döndürüyor. Rakip ya da başka şehir verisi bağlanmadı. Kurumsal
  erişim talebi ayrı raporda hazırlandı; dış iletişim yetkisi olmadığı için
  gönderilmedi.
- Hal sayfalarının ilk tablosu artık yalnız en son resmî yayın günündeki,
  katalog arama talebi en yüksek 15 mevcut ürünü gösteriyor. Tüm güncel ürünler
  server-side ayrı görünümde, eski kayıtlar ise sayfalanmış arşiv görünümünde
  kalıyor.

## Tekrar üretilebilir kanıt

Toplayıcı:

```bash
node scripts/seo/harman-gap-baseline.mjs
```

Yerel ham çıktı dizini (git dışında):
`artifacts/seo/harman-gap-2026-09-21/`

| Dosya | İçerik |
|---|---|
| `competitor-brave.json` | Koşu metadata'sı ve ham Brave sonuçları |
| `gsc-baseline.json` | GSC sorgu, sorgu+sayfa, tarih+sorgu ve URL Inspection yanıtları |
| `technical-baseline.json` | 12 hedef URL için beş tekrarlı HTTP/HTML ölçümü |
| `summary.json` | Gözlem, çıkarım ve hedef ayrımı |
| `validation.json` | Motor/filtre/tamlık/canonical otomatik kontrolleri |
| `product-canonical-map.md` | 1.188 ürün ve 681 varyant canonical denetimi |

`validation.json` kontrollerinin tamamı başarılıdır. Ham GSC verisi
`query + page` satırlarını mülk toplamı olarak kullanmaz.

## Gözlemler

### Canlı çalışma durumu

- Yerel başlangıç HEAD: `1d1a0611`
- Canlı başlangıç HEAD: `2fc0de78`
- Backend, admin ve özel Node 24 frontend süreçleri çevrimiçi.
- Mersin kaynağında başarılı ETL çalışması yok; son hata kaydı 26 Temmuz 2026.
- ETL sağlık kontrolünde ayrıca 775 canonical inceleme kaydı ve bayat kaynaklar
  vardır. Bunlar bu dar SEO partisinin dışında bırakıldı; gizlenmedi.

### Üzüm

- `üzüm fiyatları`: güncel pencerede 1 tıklama / 18 gösterim / 13,56 konum;
  önceki eş pencerede 7 / 147 / 4,87.
- 90 günlük günlük seri düşüşün 10 Eylül civarında keskinleştiğini gösteriyor.
- Sorgunun gösterimleri ezici biçimde `/urun/uzum` üzerinde kalıyor; başka bir
  HaldeFiyat URL'sine anlamlı göç yok.
- URL Inspection: `/urun/uzum` gönderilmiş ve indexli, tarama başarılı,
  canonical kendisi. `/urun/kuru-uzum` Google için henüz bilinmiyor.
- Veri kapsamı düşüş günü daralmadı: 9 Eylül 49 satır/15 hal/16 ürün, 10 Eylül
  48/15/16, 11 Eylül 48/15/17. 21 Eylül'de 40/12/14 kayıt vardır.
- Ürün canonical haritasında üzüm ve limon hedeflerinde eksik hedef, döngü veya
  zincir bulunmadı.

**Çıkarım:** Teknik hata, URL göçü ve ETL kesintisi hipotezleri elendi. Kesin
nedensellik rakip GSC verisi olmadan kurulamaz; 14 günlük final pencere
beklenmelidir. İlk cevapta niyet ayrımı yapmak kanıtla uyumlu, geri alınabilir
bir düzeltmedir.

### Hedef sayfaların değişiklik öncesi medyanı

Beş ardışık canlı istekten medyan değerler:

| URL | HTML bayt | TTFB ms | Toplam ms |
|---|---:|---:|---:|
| `/urun/uzum` | 605.914 | 273 | 427 |
| `/urun/kuru-uzum` | 124.445 | 149 | 195 |
| `/hal/mersin-hal` | 2.306.742 | 1.019 | 1.120 |
| `/hal/istanbul-hal-ibb` | 1.385.406 | 525 | 636 |
| `/hal/konya-hal` | 2.187.057 | 722 | 899 |
| `/hal/denizli-hal` | 1.383.992 | 724 | 804 |
| `/hal/kocaeli-hal-merkez` | 1.234.068 | 418 | 456 |
| `/hal/bursa-hal` | 1.858.974 | 1.359 | 1.717 |
| `/hal/gaziantep-hal` | 563.008 | 1.125 | 1.183 |
| `/urun/limon` | 664.336 | 227 | 317 |
| `/fiyat/adana/limon` | 201.775 | 88 | 154 |
| `/urun/limon-mayer` | 302.021 | 144 | 395 |

Kocaeli'nin gerçek canlı slug'ı `/hal/kocaeli-hal-merkez`dir;
`/hal/kocaeli-hal` 404 döndürür.

Değişiklik öncesi tek mobil Lighthouse laboratuvar koşusu: performans 94,
FCP 1.452 ms, LCP 2.085 ms, TBT 234 ms, CLS 0, Speed Index 2.165 ms ve toplam
transfer 736.516 bayt. HTML karşılaştırması beş tekrarlı medyanla, Lighthouse
ise aynı mobil profil ile önce/sonra guardrail olarak değerlendirilecektir.

### Limon rol denetimi

- `limon fiyatları` ve `limon piyasası` sorgularında birincil URL açık biçimde
  `/urun/limon`dur; analiz sayfaları destek rolündedir.
- `adana limon fiyatları`nda genel ürün sayfası şehir+ürün sayfasından daha çok
  görünürlük alıyor; bu, şehir sayfasının rolünün henüz güçlenmediğini gösterir.
- Mayer ve Mersin sorgularında genel ürün, çeşit ve tarihli analiz URL'leri niyete
  göre birlikte görünür. Kanıtsız canonical/redirect yapılmadı.

## Uygulama sınırı

Bu partide title, H1, canonical, robots, redirect, noindex veya veri kaynağı
değiştirilmedi. Ortak hal şablonundaki sunum değişikliği tüm hedef şehirlerde
aynı kod yolunu kullanır. 14 günlük final veri oluşmadan Parti B için ayrı bir
title/H1 deneyi yapılmayacaktır.

Yerel doğrulama:

- Frontend TypeScript: geçti.
- Frontend Vitest: 67 dosya, 365 test geçti.
- Frontend üretim derlemesi: geçti. Mevcut oluşturulmuş CSS seçici uyarısı ve
  yerel backend'in kapalı olmasına bağlı build-time fallback logları sürüyor.
- Backend typecheck: geçti.
- Backend Bun test: 79 dosya, 378 test geçti.
- Frontend lint: değişmeyen `src/hooks/useVoiceSearch.ts:74` satırındaki
  `react-hooks/refs` hatası nedeniyle başarısız; bu parti o dosyayı değiştirmedi.

## Canlı kabul

**Uygulama commit'i:** `0beddb94`
**Güncel satır bütünlüğü düzeltmesi ve son canlı commit:** `27d6511f`

İki sürüm de repo standardı `bash deploy.sh` ile git üzerinden dağıtıldı. Son
dağıtımda backend, admin ve iki Node 24 frontend worker çevrimiçi; dağıtım
penceresinde 5xx sayısı sıfırdır. Canlı tarayıcı isteklerinde 4xx/5xx ve konsol
hatası görülmedi.

İlk canlı kabulte API'nin yedi günlük `latestOnly` sonucu 102 satır bildirirken
sayfanın 98 göstermesi ayrıca incelendi. Dört satır önceki yayın günlerine aitti;
API'nin bu parametresi her ürünün aralıktaki son kaydını döndürür. Sayfanın
“güncel” sözleşmesi ise kaynağın en son takvim günündeki satırları gösterir;
doğru sayı 21 Eylül için 98'dir. Yine de tarihsel ilk 500 kayda bağımlılığı
kaldırmak için güncel havuz doğrudan `latestOnly=true` ile alınmakta ve ardından
katı son yayın günü filtresi uygulanmaktadır.

### İstanbul önce/sonra

Beş tekrarlı canlı medyan:

| Görünüm | HTML bayt | TTFB ms | Toplam ms | Satır |
|---|---:|---:|---:|---:|
| Değişiklik öncesi | 1.385.406 | 525 | 636 | tarihsel karma liste |
| Kompakt güncel | 363.766 | 586 | 703 | 15 |
| Tüm güncel | 1.072.701 | 506 | 825 | 98 |
| Arşiv ilk sayfa | 1.091.101 | 704 | 1.189 | 100 / 76 sayfa |

Kompakt görünümde sunucu HTML'i **%73,7 azaldı**; %40 operasyonel hedefi
karşılandı. TTFB medyanı 61 ms ve toplam süre 67 ms yükseldi. Tek değişiklik
öncesi mobil Lighthouse koşusu ile üç değişiklik sonrası koşunun medyanı:

| Metrik | Önce | Sonra medyan | Yorum |
|---|---:|---:|---|
| Performans skoru | 94 | 91 | laboratuvar koşusu dalgalı |
| FCP | 1.452 ms | 1.354 ms | iyileşti |
| LCP | 2.085 ms | 3.332 ms | kötüleşti; T+3 teknik takip açık |
| TBT | 234 ms | 97 ms | iyileşti |
| CLS | 0 | 0 | korundu |
| Speed Index | 2.165 ms | 1.803 ms | iyileşti |
| Transfer | 736.516 bayt | 702.844 bayt | azaldı |

LCP sonucu nedeniyle “sayfa performansı bütünüyle iyileşti” denmez. HTML hedefi
tutmuş, ana iş parçacığı ve görsel hız metrikleri iyileşmiş olsa da LCP'nin
T+3'te aynı profille yeniden ölçülmesi gerekir.

### Görsel ve semantik kabul

- 320 px gerçek Chromium: temel, tüm güncel ve arşiv görünümünde global yatay
  taşma yok.
- Temel fiyat tablosu 15, tüm güncel tablo 98, arşiv sayfası 100 SSR satırı
  gösteriyor; arşivde önceki/sonraki denetimi ve `1 / 76` sayfa göstergesi var.
- Canonical kendisi, robots `index, follow`; Place, Dataset, BreadcrumbList ve
  görünür SSS ile eşleşen FAQPage JSON-LD korunuyor.
- Üzüm ilk cevabı yaş/sofralık ürünü kuru üzüm borsa serisinden ayırıyor; iki
  sayfa karşılıklı semantik bağlantı veriyor.
- İstanbul API'si ve sayfa son veri tarihi 21 Eylül 2026 olarak eşleşiyor.

## Açık işler

1. Mersin kurumsal veri erişim talebinin yetkili kişi tarafından gönderilmesi;
   yanıt/izin sonrası parser ve fixture işi.
2. T+3'te LCP, URL Inspection, 4xx/5xx ve render kontrolü.
3. T+14 ve T+28'de final GSC eş dönemleri; üzüm ve şehir kümesi için erken
   sıralama iddiası yapılmayacak.
4. Limon şehir+ürün hedef payı kanıtla güçlenmeden canonical/title deneyi yok.
5. Faz 6 veri ürünleri bu partide başlatılmadı.
