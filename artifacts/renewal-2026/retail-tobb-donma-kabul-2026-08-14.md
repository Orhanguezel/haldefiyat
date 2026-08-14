# Perakende, TOBB Birim ve Donma Denetimi Kabulü — 14 Ağustos 2026

## Kapsam

Bu kabul E19, E20 ve E21 maddelerini doğrular: marketfiyati çağrı sınırı ve perakende
gösterimi, TOBB TL/ton normalizasyonu ile yüksek değerli negatif kontroller, Iceberg
ailesinin canonical birleşimi ve kaynağın kendi geçmişine göre çalışan donma denetimi.

## E19 — perakende veri yolu

- Kürasyonlu `RETAIL_EXTRA` ürünleri geniş fresh-produce taramasından önce çalışır.
- Gerçek HTTP sayfa çağrıları sayılır; 403/429 görülürse sonraki çağrılar durdurulur ve
  sonuç `throttled` olarak işaretlenir.
- Perakende görünümünde verinin HalDeFiyat Endeksi'ni veya hal ortalamasını sürmediği,
  kaynak çağrı limiti nedeniyle günlük eksik olabileceği ve kayıt tazeliği açıkça yazılır.
- 14 Ağustos canlı `/api/v1/prices/retail/domates` cevabı 13 Ağustos tarihli altı zincir
  döndürdü. Eski 546,21 TL Migros kaydı ham API'de korunmasına rağmen kalite kapısı onu
  public karşılaştırmadan çıkardı; mobil sayfada A101, BİM, CarrefourSA, ŞOK ve Tarım
  Kredi kartları gösterildi.
- 390 x 844 canlı tarayıcı kabulünde `scrollWidth=clientWidth=390`, konsol hatası sıfır,
  beş kartın her birinde `1 gün önce güncellendi` etiketi görüldü.

Görsel kanıt:
`output/playwright/e19-e21/domates-retail-mobile-2026-08-14.png`

## E20 — TOBB TL/ton normalizasyonu

Parser kabul fixture'ları:

- Açık `TL/TON` buğday 35.000–37.000 → 35–37 TL/kg.
- Birimi boş toplu buğday 12.000 → 12 TL/kg.
- Açık `KG` sofralık zeytin 100–350 aynen korunur.
- Açık `KG` zeytinyağı 800–900 aynen korunur.

Canlı veri denetimi:

- TOBB toplam kayıt: 15.391.
- 500 TL üzeri kayıt: 607.
- Et/canlı hayvan ve zeytin/zeytinyağı dışındaki açıklanamayan 500 TL üzeri kayıt: **0**.
- Zeytin: 477 kayıt, 4,12–270 TL.
- Zeytinyağı: 1.366 kayıt, 13,98–850 TL.

Bu sonuç yüksek değerli gerçek ürünlerin ton heuristiğiyle yanlışlıkla 1000'e
bölünmediğini, toplu emtianın ise doğru birime getirildiğini doğrular.

## E21 — Iceberg ailesi ve donma dedektörü

Canlı canonical durum:

- `/urun/marul-iceberg` → tek adım 301 → `/urun/marul-aysberg`.
- `/urun/marul-aysberg-adet` → tek adım 301 → `/urun/marul-aysberg`.
- Master `marul-aysberg`: adet, 1.025 doğrudan tarihçe satırı.
- `marul-iceberg`: adet, canonical mastera bağlı, 3.476 tarihçe satırı.
- `marul-aysberg-adet`: adet, canonical mastera bağlı, 72 tarihçe satırı.

Donma denetimi 45 günlük canlı pencerede 45 kaynağı değerlendirdi. Mutlak gün eşiği
yerine her kaynağın geçmişteki en uzun sabit bloğu baz alındı; altı güncel aday kendi
baz çizgisini aştığı için raporlandı. Tarihler MySQL `DATE` nesnesinden ISO biçimine
normalize edildi. Karantinaya alınmış market-tarih aralıkları yeniden alarm üretmiyor.

## Otomatik doğrulamalar

- Backend parser/freshness/blackout odaklı testleri: 11/11.
- Frontend perakende tazelik/kalite kapısı testleri: 6/6.
- Backend TypeScript ve production build: geçti.
- Frontend TypeScript, ESLint ve production build: geçti.
- Canlı backend/frontend reload sonrası health ve ürün sayfası: HTTP 200.

İlgili kod commitleri: `7a62b234`, `9612d265`.
