# Perakende fiyat guard kabulü — 13 Ağustos 2026

- Migros ve MarketFiyatı ETL yazımları merkezi `upsertRetailPriceRow` kapısına bağlandı.
- `hf_retail_price_quarantine` ham fiyat, zincir, ürün, tarih, reason, güven, hal/perakende medyanı ve sapma kanıtını korur.
- 546,21 TL domates hem backend yazım sınırında hem frontend türev gösteriminde fixture ile engellenir.
- İlk `%200` varsayımı canlı veride 284 grubun 54’ünü engellediği için reddedildi; gerçek patates, muz ve biber fiyatları yanlış pozitifti.
- Veriyle kalibre edilen sert eşik `%1000` markup (hal medyanının 11 katı). Hal kapsaması yoksa en az 5 perakende emsalinin 4x/0.25x sapması kullanılır.
- Son dry-run: 284 grubun 276’sı yayınlanabilir, 7 wholesale markup ve 1 retail peer sapması; toplam potansiyel karantina `%2,82`.
- Backend saf testleri 3/3, frontend türev testleri 4/4 geçti.
- Frontend dış Google font bağımlılığı kaldırıldı; yerel Outfit + sistem fontu ile ağdan bağımsız build alındı.
- Canlı mobil kabul: 390 px yatay taşma yok, doğru font yığınları aktif, konsol hata/uyarı 0.
