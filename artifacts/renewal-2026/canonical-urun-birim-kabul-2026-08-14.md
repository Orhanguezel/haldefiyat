# Canonical ürün, kategori ve birim kabulü — 14 Ağustos 2026

## Canlı veri sonucu

- Canlı fiyat geçmişi: **1.055.622** satır.
- Ürün sözleşmesiyle aynı birimde ve public kullanıma uygun: **908.461** satır.
- Tarihsel birim kanıtı bulunmadığı için korunup public hesaplardan dışlanan: **147.161** satır (**%13,94**).
- Kaynak×ham birim×ürün birimi frekans export'u: **93** uyumsuz kohort.
- En büyük kohortlar Bursa `kg→adet` 14.258, Konya `kg→adet` 14.194 ve Konya `kg→bag` 11.925 satırdır.

`backend/scripts/qa/unit-frequency-export.ts` sorguyu kaynak indeksini kullanarak kaynak kaynak çalıştırır; küçük VPS'de global milyon-satır `GROUP BY` geçici dosyası üretmez.

## Uygulanan güvenlik sözleşmesi

- Migration 091 yalnız kanıtlanabilir yazım eşdeğerlerini (`kg.`, `kilogram`, `bağ`, `lt` vb.) canonical birime dönüştürür.
- Semantik olarak belirsiz geçmiş satırların birimi tahmin edilmez ve ham kayıt silinmez.
- Ürün birimiyle uyuşmayan geçmiş satırlar fiyat listesi, son fiyat, grafik, harita, trending, widget, sayaç ve SEO uygunluk hesaplarından merkezi olarak dışlanır.
- Yeni yazımlar `UNKNOWN_PRODUCT_UNIT` veya `PRODUCT_UNIT_MISMATCH` ile yayın öncesi karantinaya düşer.

## Tek ürün kimliği

Migration 090 sonrasında canlı invariant sorgusu:

```json
{"variantFavorites":0,"variantAlerts":0,"variantFirmProducts":0,"variantFirmPrices":0}
```

Favori, alarm, firma ürünleri ve firma fiyatları canonical ürün kimliği/slug'ı kullanır. Arama, kategori, borsa, hal mover, ticker ve favori bağlantıları ortak `productHref` sözleşmesine geçti. ETL IndexNow bildirimi de yalnız canonical ürün URL'si üretir.

## Yazım ve kategori kabulü

- 1.235 aktif ürün, 634 canonical master.
- Canonical master `normalize(name)+unit` kopya anahtarı: **0**.
- Migration 092 canonical çocukların kategorisini hedef master kategorisine hizalar.
- Public arama, karşılaştırma ve alarm ürün seçicileri `canonicalOnly=true` ile aynı master listesini kullanır; farklı paket birimli ürünler migration 085 gereği ayrı master olarak korunur.

## Canlı URL ve servis kabulü

- `GET /api/health` → 200 `ok:true`.
- `/urun/domates-koy` → tek adım 301, `Location: /urun/domates`.
- Ana sayfa → 200, yaklaşık 260 ms kabul isteği.
- Canonical tüketici invariant'ları ve birim frekans export'u canlı DB üzerinde çalıştı.

## Değişiklikler

- `c26a3dda` — canonical ürün ve birim kimliği.
- `e7bc74b2` — bellek/disk sınırlı birim frekans export'u.
- Migration 090–092 — tüketici kimlik göçü, güvenli birim normalizasyonu ve kategori hizalama.
