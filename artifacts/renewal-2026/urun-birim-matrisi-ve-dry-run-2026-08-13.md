# Ürün–birim matrisi ve geçmiş dry-run — 13 Ağustos 2026

## Canlı kök neden

`upsertPriceRow` birim verilmediğinde sabit `kg` kullanıyordu. Ürün kaydı `adet`, `demet`, `bağ`, `kasa` veya `koli` olsa bile fiyat satırı kg yazılabiliyordu.

Canlı geçmişte görülen başlıca uyumsuzluklar:

- adet ürün → kg fiyat: 79.940 satır
- demet ürün → kg fiyat: 40.254 satır
- bağ ürün → kg fiyat: 21.192 satır
- koli ürün → kg fiyat: 2.877 satır
- paket ürün → kg fiyat: 1.689 satır
- kasa ürün → kg fiyat: 929 satır
- kg ürün → koli fiyat: 295 satır
- adet ürün → koli fiyat: 3 satır
- Toplam potansiyel uyumsuz: 147.179 satır

## Canlı izin matrisi

- Her public ürün/varyant tek bir canonical default birime sahiptir: `kg`, `adet`, `kasa`, `bag`, `demet`, `koli`, `ton`.
- Birim değişiyorsa aynı ürün satırında karıştırılmaz; ayrı varyant/ürün kimliği gerekir. Örnek: `Muz` ve `Muz (Koli)`.
- Birim verilmemiş ETL satırı ürünün canonical birimini devralır.
- Açıkça gelen birim ürün birimiyle çelişirse `PRODUCT_UNIT_MISMATCH` karantinasına gider.
- Ürünün kendi birimi canonical değilse `UNKNOWN_PRODUCT_UNIT` karantinasına gider.
- Karantina reason code’ları admin fiyat inceleme kuyruğunda Türkçe gösterilir.

## Canlı kabul

İzmir sebze-meyve kaynağı yeniden çalıştırıldı: 97 yazım, 0 skip, 0 hata.

- 79 kg
- 10 adet
- 5 demet
- 3 bağ
- Legacy kalan tek `Y.MAYDONOZ` satırı merkezi yazım fonksiyonundan yeniden geçirilerek `kg` → `demet` düzeltildi.
- Guard/canonical testleri VPS’de 8/8 geçti.

## Geçmiş göç kararı

147.179 satır topluca çevrilmedi. Ürün default birimi tek başına tarihsel kaynağın gerçekten adet mi kg mı yayımladığını kanıtlamaz; kör dönüşüm fiyat serisini bozabilir.

Onaylı göç öncesi kohortlar:

1. Kaynak ham birimi veya parser fixture’ı kanıtlı satırlar otomatik düzeltilebilir.
2. Aynı ürün–hal–gün içinde kg ve paket çakışan kayıtlar ayrı varyanta taşınmalıdır.
3. Kanıtsız legacy satırlar public YoY/endeks kullanımından işaretlenmeli veya karantinaya alınmalıdır.
4. Her kohort için önce satır sayısı ve örnek CSV, sonra transaction göçü ve rollback SQL’i hazırlanmalıdır.
