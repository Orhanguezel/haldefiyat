# Citability ve Schema Canlı Kabulü — 2026-07-26

## Yöntem

Canlı SSR HTML indirildi; görünür cevap bloğu metni ile aynı HTML içindeki
`application/ld+json` Dataset/NewsArticle nesnesi birlikte parse edildi.
Script, style, istemci hydration sonucu veya API varsayımı kullanılmadı.

## Ürün — Domates

- URL: `https://haldefiyat.com/urun/domates`
- Stabil cevap anchor'ı: `#ortalama-fiyat`
- Görünür blok:
  - Tarih: 26 Temmuz 2026
  - Kapsam: Türkiye, 13 hal
  - Ortalama: 34,8 TL/kg
  - Minimum/maksimum: 5/150 TL
  - Kaynak ve 7/30 günlük trend görünür
- Dataset:
  - `url`: aynı kanonik ürün URL’si
  - `temporalCoverage` ve `dateModified`: `2026-07-26`
  - `spatialCoverage`: Türkiye
  - `variableMeasured`: `minPrice`, `avgPrice`, `maxPrice`
  - DataDownload: ürünle filtrelenmiş public API

Sonuç: Görünür tarih, kapsam ve ölçüm semantiği Dataset ile uyumlu. Dataset
gözlem değerlerini satış teklifi gibi yayınlamıyor; sayısal değerler görünür
tabloda/cevap bloğunda, ölçüm tanımı Dataset’te tutuluyor.

## Hal — Antalya Serik Hali

- URL: `https://haldefiyat.com/hal/antalya-hal-serik`
- Görünür blok:
  - 26 Temmuz 2026
  - 10 ürün
  - Kaynak: `antalya_serik_antkomder`
- Dataset:
  - `url`: aynı kanonik hal URL’si
  - `temporalCoverage`: `2026-05-13/2026-07-26`
  - `dateModified`: `2026-07-26`
  - `spatialCoverage`: Antalya
  - DataDownload: aynı market slug’ıyla public API

Sonuç: Görünür son tarih, hal kimliği, coğrafya ve kaynak bağlamı Dataset ile
uyumlu.

## Analiz — Kuru soğan fiyat analizi

- URL:
  `https://haldefiyat.com/analiz/kuru-sogan-fiyat-analizi-temmuz-2026`
- Stabil cevap anchor'ı: `#bulgu-ozeti`
- Görünür başlık ile `NewsArticle.headline` birebir aynı.
- Görünür bulgu özeti ile `NewsArticle.description` birebir aynı.
- Görünür rapor tarihi 20 Temmuz 2026; `datePublished` `2026-07-20`.
- `mainEntityOfPage` ve `url` canlı kanonik URL ile aynı.
- Üç en-boy oranındaki analiz görselleri ve publisher/author alanları mevcut.

Sonuç: Article görünürlük ve yapılandırılmış veri eşleşmesi geçti.

## Validator sınırı

Üç sayfadaki JSON-LD blokları yerel parse kontrolünde hatasızdır. Schema.org
Validator’a GET `/validate?url=...` çağrısı 405 döndürdü; servis bu yolu genel
otomasyon API’si olarak sunmuyor. Resmi Schema.org Validator ve Google Rich
Results Test ekran çıktılarının manuel/etkileşimli arşivi bu nedenle ayrı açık
madde olarak korunmuştur.
