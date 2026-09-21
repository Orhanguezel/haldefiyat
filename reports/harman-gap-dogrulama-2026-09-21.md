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

Canlı kabul, deploy commit'i, son ölçümler ve 320 px görsel kontrol sonuçları
deploy sonrasında bu rapora eklenecektir.
