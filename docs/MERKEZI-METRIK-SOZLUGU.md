# HalDeFiyat Merkezi Metrik Sözlüğü

**Tek kaynak:** `GET /api/v1/prices/overview`

**Cache TTL:** public/CDN ve Next fetch için 300 saniye

**Owner:** Veri operasyonu

| Alan | Tanım | Zaman penceresi |
|---|---|---|
| `totalProducts` / legacy `trackedProducts` | Aktif katalogdaki canonical ürün/varyant sayısı | Anlık |
| `pricedProducts` | En az bir tarihsel fiyat kaydı olan farklı ürün | Tüm dönem |
| `currentProducts` | Yakın dönemde en az bir fiyat kaydı olan farklı ürün | Son 7 gün |
| `activeSources` | Yakın dönemde fiyat üreten farklı `sourceApi` | Son 30 gün |
| `currentCities` / legacy `activeCities` | Aktif hal ve aktif ürün üzerinden yakın dönemde fiyatı olan farklı il | Son 30 gün |
| `activeMarkets` | Konfigürasyonda aktif işaretli hal/kaynak noktası | Anlık |
| `latestRecordedDate` | Public fiyat tablosundaki en yeni kayıt tarihi | Tüm dönem maksimum |
| `lastEtlRunAt` | Başarılı ETL run kaydının en yeni teknik zamanı | Tüm dönem maksimum |
| `freshness` | Son fiyat ≤7 gün `fresh`, daha eski `stale`, yoksa `unknown` | Ölçüm anı |
| `measuredAt` | Endpoint sorgusunun üretildiği ISO zaman | Anlık |

## Gösterim kuralları

- `totalProducts`, “fiyatı güncel ürün” diye sunulmaz; etiketi “izlenen ürün”dür.
- Güncel kapsam için `currentProducts/currentCities/activeSources` kullanılır ve zaman penceresi açıklanır.
- Fallback sıfırları “canlı” olarak etiketlenmez. Topbar bu nedenle nötr “Veri Özeti” dilini kullanır.
- `stale/unknown` durumunda son tarih görünür tutulur; eski değer sessizce güncelmiş gibi gösterilmez.
- Tüm sayaç tüketicileri bu endpoint alanlarını kullanır; sayfa içinde sabit 81/2480/%100 yazılmaz.
