# Fiyat kalite guard kabulü — 13 Ağustos 2026

## Uygulanan yayın kapısı

- Bütün hal ETL yazımları merkezi `upsertPriceRow` sınırında değerlendirilir.
- Sıfır/negatif fiyat, bozuk min–max, aralık dışı ortalama ve birim/kategori bazlı mutlak tavan kontrol edilir.
- En az 5 tarih-yakın emsal varsa medyanın 4 kat üstü veya dörtte bir altı değer karantinaya alınır.
- Şüpheli satır `hf_price_history` tablosuna yazılmaz; ham değer ve karar metadatası `hf_price_quarantine` tablosunda korunur.
- Karar kaydında reason code, severity, confidence, peer median, sapma oranı ve review durumu bulunur.

## Test ve dry-run kanıtı

- VPS Bun testleri: 7/7 geçti (canonical contract 3, price guard 4).
- Fixture: 546 TL domates `PEER_MEDIAN_DEVIATION` ile engellendi.
- Negatif fixture: emsallerine yakın 350 TL zeytin yayınlandı.
- Koli fiyatı ayrı 15.000 TL tavanıyla değerlendirildi.
- Son 60 gün / 15.000 kayıt üstünden 869 ürün-birim grubunun 862’si yayınlanabilir, 7’si medyan sapması çıktı.
- Potansiyel karantina oranı: %0,81. Mutlak tavan kaynaklı blok: 0.

## Kalan kapsam

- Admin inceleme kuyruğu ve onay/ret/düzeltme aksiyonları.
- Ürün-varyant-birim izin matrisi ve yanlış adet/kg fixture’ı.
- `hf_retail_prices` yazım sınırında eşdeğer guard; frontend türev guard’ı hâlihazırda %200 üstünü göstermiyor.
- Önceki gün sıçraması, kaynaklar arası fark ve stale reason code’ları.
