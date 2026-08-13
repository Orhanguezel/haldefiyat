# Çoklu Birim Ürün Denetimi — 13 Ağustos 2026

## Uygulanan kural

- Aynı temel ürün adı yalnız tek gerçek birimdeyse isim olduğu gibi kalır: `Domates`.
- Aynı temel ad birden fazla gerçek birimdeyse ölçü isme eklenir: `Avokado (Kg)` / `Avokado (Adet)`.
- Paket ölçüsü yalnız kaynak birimi gerçekten paket olduğunda kullanılır: `Limon (Kasa)`, `Muz (Koli)`.
- `kasa`, `koli`, `adet`, `kg`, `bağ`, `demet`, `paket`, `çuval` birbirine çevrilmez ve aynı fiyat ortalamasında birleştirilmez.
- Etiketleme public ürün API’sinde merkezi yapıldığı için arama, ilan verme, karşılaştırma, favori ve alarm seçicileri aynı adı kullanır.

## Katalog taraması

Aktif katalogda farklı birim içeren 46 aday temel-ad grubu bulundu. Otomatik etiketleyici
yalnız aynı temiz temel ada sahip ve birim kümesi birden büyük kayıtları değiştirir. Böylece
`Limon (Kg) / Limon (Kasa)`, `Muz (Kg) / Muz (Koli)`, `Nane (Demet) / Nane (Bağ)` gibi
gerçek ayrımlar görünür olur; farklı ürün ailesi olan benzer ilk kelimeler birleştirilmez.

## Canlı kabul örnekleri

| Slug | Canlı etiket | Birim |
|---|---|---|
| `avakado` | Avokado (Adet) | adet |
| `avokado` | Avokado (Kg) | kg |
| `limon` | Limon (Kg) | kg |
| `limon-kasa` | Limon (Kasa) | kasa |
| `muz` | Muz (Kg) | kg |
| `muz-koli` | Muz (Koli) | koli |
| `nane` | Nane (Demet) | demet |
| `nane-bag` | Nane (Bağ) | bağ |

Backend unit testleri kg/adet ve kg/kasa ayrımlarını doğruluyor. VPS TypeScript build’i
başarılı, backend reload sonrası public ürün API’sinde yukarıdaki etiketler doğrulandı.
