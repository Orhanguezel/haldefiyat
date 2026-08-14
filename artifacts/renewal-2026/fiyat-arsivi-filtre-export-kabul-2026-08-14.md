# Fiyat arşivi filtre, URL, export ve durum kabulü

Tarih: 14 Ağustos 2026

Canlı sürümler: `bead0d3c`, `4bd08add`, `9bd168b4`

Hedefler:

- `https://haldefiyat.com/fiyatlar`
- `https://haldefiyat.com/canli-hal-fiyatlari`
- `https://haldefiyat.com/api/v1/prices`
- `https://haldefiyat.com/api/v1/prices/export`

## Sayfa rolleri

- `/canli-hal-fiyatlari`: son veri kesiti, popüler fiyat hareketleri ve bülten için kısa canlı özet.
- `/fiyatlar`: arama, hal/il, kategori, birim, tarih aralığı, sıralama, sayfalama ve CSV içeren ayrıntılı fiyat arşivi.

Canlı özet sayfası kapsamını açık metinle belirtiyor ve filtreli arşive bağlanıyor; iki rota aynı tablo deneyimini kopyalamıyor.

## Filtre ve URL kabulü

Canlı mobil kabul URL'si:

```text
/fiyatlar?q=domates&city=ankara&category=sebze&unit=kg&range=7d
```

Doğrulanan durum:

- H1: 1 adet
- Viewport: `390x844`
- Yatay taşma: yok
- Konsol: 0 hata, 0 uyarı
- Şehir: Ankara
- Kategori: Sebze
- Birim: Kg
- Tarih: Son 7 gün
- Sıralama: En güncel kayıt tarihi
- Arama sorgusu: `domates`
- Sonuç: 12 kayıt, 1–12 gösteriliyor
- Son kayıt tarihi: 13 Ağustos 2026
- Gecikmeli/güncel durumu sonuç özetinde ayrı gösteriliyor.

Ekran kanıtı:

- `output/playwright/theme-clean-data/fiyatlar-filtre-mobile-2026-08-14.png`
- SHA-256: `3c1f8993cf9bc65d42be9796f32b74d659c69e753afbfe3632e1616692cf64e7`

## Analytics kabulü

Kontrollü filtre değişimleri:

```text
price_filter_changed filter_name=city filter_value=ankara active_filter_count=3
price_filter_changed filter_name=unit filter_value=kg active_filter_count=4
price_filter_changed filter_name=query filter_value=7_chars query_length=7 active_filter_count=5
```

Sıfır sonuç deneyi:

```text
price_filter_zero_results
filter_name=query
query_length=14
active_filter_count=5
result_count=0
zero_results=true
```

Gerçek arama metni event payload'ına yazılmadı. E-posta/telefon desenleri discovery allowlist'inden fail-closed düşürülüyor.

## CSV ve API kabulü

Filtreli CSV linki istemci durumuyla aynı sorguyu üretti:

```text
/api/v1/prices/export?format=csv&q=domates&city=ankara&category=sebze&unit=kg&range=7d&latestOnly=false
```

CSV sütunlarında aşağıdaki metadata var:

- ürün/kategori/hal/şehir
- min/maks/ortalama ve ortalama yöntemi
- birim, para birimi ve kayıt tarihi
- public kaynak adı, kaynak URL'si, kaynak türü ve resmi kaynak durumu
- makine için kaynak kodu
- uygulanan filtreler ve dışa aktarım zamanı

Yanıt başlıkları sıfır satırda dahi `X-HalDeFiyat-Row-Count`,
`X-HalDeFiyat-Exported-At` ve URL-encoded `X-HalDeFiyat-Filters` döndürüyor.

## Durum ayrımı

- Yeni filtre isteği: mevcut layout içinde loading progress.
- Filtreli sıfır sonuç: “Filtrelere uyan kayıt bulunamadı” ve filtreleri değiştirme önerisi.
- Gerçek veri yok: “Henüz fiyat verisi yok” ve yeni kaynak verisi açıklaması.
- Gecikmeli/partial: özet satırında tümü gecikmeli veya gecikmeli/güncel adetleri.
- API hatası: eski sonuçlar korunarak ayrı error alert ve “Yeniden dene” aksiyonu.

## Otomasyon

- Frontend TypeScript: geçti.
- Frontend ESLint `--quiet`: geçti.
- Frontend tam suite: 26 dosya, 79 test geçti.
- Frontend production build: geçti.
- Backend TypeScript: geçti.
- Backend tam suite: 26 dosya, 113 test ve 243 assertion geçti.
- Yeni CSV sözleşmesi bu suite içinde 2 test ve 10 assertion ile korunuyor.
- Canlı backend health: `ok=true`.
- Canlı CSV: HTTP 200, UTF-8 CSV, filtre/row-count/export-time başlıkları doğrulandı.
