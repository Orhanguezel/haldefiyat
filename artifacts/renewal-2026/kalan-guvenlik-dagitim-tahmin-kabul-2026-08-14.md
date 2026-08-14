# Kalan güvenlik, dağıtım ve tahmin kabul paketi — 14 Ağustos 2026

Bu belge kapsamlı uygulama çeklistinin son güvenlik, dağıtım, tahmin, tema ve veri aralığı maddelerinin makineyle tekrarlanabilir kabul kanıtıdır.

## 1. Arama talebi — gerçek DB fixture

Komut:

```bash
QA_ALLOW_MUTATION=1 bun run qa:call-request-db
```

Canlıya eşdeğer izole fixture 22/22 kontrolü geçti ve oluşturduğu bütün geçici kullanıcı, ilan, talep ve audit kayıtlarını temizledi:

- anonim istek `401`;
- cross-site cookie mutation `403` ve sıfır DB yan etkisi;
- geçerli talep `201` ve `Cache-Control: no-store`;
- aynı ilan için açık talep `409`;
- günlük beş farklı ilan talebi başarılı, altıncı talep `429`;
- yalnız ilan sahibi kabul edebiliyor, yalnız alıcı tamamlayabiliyor;
- DB'de tam beş talep ve rıza zamanları saklanıyor;
- public ve dashboard DTO'larında alıcı/satıcı doğrudan iletişim verisi yok;
- `201` ve `429` audit kayıtlarında standart JWT `sub` kimliği var, request body tutulmuyor.

Fixture ilk çalışmada CSRF hook'unun `403` gönderdikten sonra route handler'ını durdurmadığını ve DB mutasyonu yaptığını ortaya çıkardı. Hook status kodlu exception fırlatacak şekilde düzeltildi; tekrar çalıştırmada yan etki sıfırlandı. İlgili commitler: `8e3ac22c`, `baffd0b1`.

## 2. Bildirim ve bülten güvenliği

- Doğrulanmış ve aktif satıcıya, alıcı PII'si taşımayan arama talebi e-postası gönderiliyor.
- Teslim üç denemeyle sınırlı; e-posta veya mevcut Telegram kanalından biri başarı verirse talep bildirilmiş sayılıyor.
- Newsletter single opt-in kararı korunuyor; stateless HMAC unsubscribe aktif.
- Bounce, complaint ve manual suppression kayıtları yeniden aboneliği `409` ile kapatıyor ve dağıtım listesinden çıkarılıyor.
- Pazartesi bülteni eşleşmiş sepet yüzdesi, üç sayı aynı çift kümesinden yeniden hesaplanamıyorsa veya yüzdede sapma varsa yayın öncesi fail-closed oluyor.

İlgili commit: `92fb8962`.

## 3. Sosyal yayın tek sahipliği

- HalDeFiyat günlük işleri yalnız deduplicated taslak üretir.
- Telefon, e-posta, template artığı, harici URL, boş veya 280 karakteri aşan metin content-guard'dan geçmez.
- Hal admin doğrudan `send/publish` endpoint'leri `409 external_publisher_required` döndürür.
- Gerçek yayınlama sahibi yalnız `ekosistem-sosyal-medya` entegrasyonudur; Hal cron ikinci poster çalıştırmaz.

İlgili commit: `10cbdc4c`.

## 4. Tahmin yayın kapısı

Public tahmin için aşağıdaki koşulların tamamı zorunludur:

- en az 21 tarihsel gözlem;
- en az 7 walk-forward backtest noktası;
- MAPE en çok `%25`;
- model MAE, naive “son değer” baseline MAE'den düşük;
- son dönem drift oranı en çok `1.5`.

Koşullardan biri geçmezse endpoint `422` ile fail-closed olur. İstemci tarafındaki doğrulanmamış çizgi tahmini kaldırıldı. Canlı `domates?days=7` kabul örneği: 7 validation noktası, model MAE `0.5`, model MAPE `%1.48`, baseline MAE `0.7`, baseline MAPE `%2.06`, drift `0.86`; cevap `200`.

İlgili commit: `04777aec`.

## 5. Tema ve ortak sayfa kabuğu

- Ana uygulamadaki hard-coded tema renkleri semantic token/color-mix kaynağına taşındı.
- `bun run check:theme-colors` 140 kontrollü/teknik istisnayı denetleyerek geçti.
- Fiyat kartı gerçek API `recordCount` değerini “N kaynak kaydı” olarak gösteriyor.
- Standart public içerik sayfaları ortak `PageContainer` genişlik ve responsive padding sözleşmesine taşındı. Bölüm bazlı landing sayfası gridleri ile firma detayındaki bilinçli 1180 px medya yerleşimi istisnadır; yeni genel sayfa dış kabuğu oluşturmaz.

İlgili commit: `1f5d4a5c` ve bu kabul paketinin commit'i.

## 6. Ürün/birim fiyat aralığı insan denetimi

Komut:

```bash
bun backend/scripts/qa/product-price-range-matrix.ts
```

Canlı örnek: 15.000 yakın dönem satırı, 608 ürün/birim grubu, 8 review adayı. Otomatik blok yerine insan etiketi:

| Ürün/birim | Son değer | Etiket | Karar |
|---|---:|---|---|
| Domates Salkım/kg | 6 | kaynak/piyasa farkı | Demre kaynağı doğrulanmadan ürün tavanı yapılmaz |
| Kestane/kg | 200 | seyrek-mevsimlik | 25 örnek nedeniyle review |
| Kırmızı Mercimek/kg | 42,3 | tarihsel ton/kg kohort karışımı | güncel değer makul, statik blok false-positive |
| Kuşkonmaz/kg | 11,3 | kirli/karma tarihsel kohort | kaynak ve ürün eşlemesi review |
| Mandalina Rize/kg | 54,29 | seyrek-mevsimlik | 6 örnek nedeniyle review |
| Mangostan/kg | 986,88 | kirli/karma kaynak kohortu | statik ürün tavanı yerine kaynak review |
| Melisa Oğul Otu Yaş Taze/kg | 687,31 | seyrek/yüksek değerli | 9 örnek nedeniyle review |
| Yeşil Mercimek/kg | 18 | tarihsel ton/kg kohort karışımı | güncel değer makul, statik blok false-positive |

Sonuç: ürün özel matris otomatik mutlak engel değildir. Tarih-yakın emsal, önceki gün ve kaynaklar arası medyan kullanan canlı guard otoritedir; bu matris review kuyruğu ve false-positive örneklemidir. İlgili commit: `61845d06`.

## 7. Merkezi dikey metriği

`GET /api/v1/prices/overview` toplam `activeMarkets` yanında `activeMarketsByType` alanını döndürür: `hal`, `borsa`, `resmi`, `kooperatif`. Eksik tür `0` olur. Böylece meyve-sebze hali, ticaret borsası, resmi alım ve kooperatif kaynak noktaları tek bir “hal” sayısı gibi sunulmaz. Sözleşme `docs/MERKEZI-METRIK-SOZLUGU.md` içinde kayıtlıdır.

## 8. İletişim formu gerçek teslim ve gizlilik kabulü

14 Ağustos 2026 11:54 UTC'de `[QA] Form teslim kabulü 2026-08-14` konulu, açıkça yanıtlanmaması istenen test kaydı production endpoint'ine gönderildi ve `201` aldı. Bu test sırasında shared contact handler'ın oluşturulan kaydı e-posta, telefon, mesaj ve IP ile birlikte POST yanıtında döndürdüğü ve `no-store` göndermediği bulundu.

HalDeFiyat route katmanında yanıt sözleşmesi `{ ok, status, requestId }` ile sınırlandı; e-posta, telefon, mesaj ve IP response'tan çıkarıldı. Tüm contact POST yanıtlarına `Cache-Control: no-store, no-cache, must-revalidate, private` ve `Pragma: no-cache` eklendi. Unit test hem PII redaksiyonunu hem validation/honeypot cevaplarının bozulmamasını doğruluyor.

## 9. Otomatik kabul sonucu

- Backend TypeScript: geçti.
- Backend testleri: `141 passed`, `0 failed`, `321 assertions` (izole test secret'larıyla).
- Frontend TypeScript: geçti.
- Frontend ESLint: `0 error` (mevcut warning'ler bloklayıcı değil).
- Frontend Vitest: `41 files`, `116 tests`, tamamı geçti.
- Tema renk denetimi: geçti.
