# Prices Overview Performans Kabulü

**Tarih:** 14 Ağustos 2026

**Ortam:** Canlı `vps-vistainsaat`, backend 8091

## Kök neden

Frontend izole release build'i 68 sayfayı prerender ederken `/api/v1/prices/overview`
çağrıları 30–48 saniyeye uzuyor ve frontend'in 5 saniyelik fetch timeout'una düşüyordu.
İşlem bazlı ölçümde ana darboğaz bulundu:

| Özet sorgusu | Önceki süre |
|---|---:|
| Aktif ürünler | 7 ms |
| Fiyatı olan ürünler `COUNT(DISTINCT)` | 13.037 ms |
| Son 7 gün ürünleri | 46 ms |
| Son 30 gün şehirleri | 772 ms |
| Son 30 gün kaynakları | 155 ms |
| Tarih alt/üst sınırı | 633 + 643 ms |

Sekiz sorgunun aynı anda başlaması, 1,04 milyon satırlık distinct taramasının DB
çekişmesini büyütüyordu. Aynı release build'i 2,4 dakikada tamamlandı fakat overview
timeout fallback'leri üretti.

## Uygulanan düzeltme

- `pricedProducts`, bütün fiyat geçmişinde `COUNT(DISTINCT)` yapmak yerine 1.235 aktif
  ürün üzerinden product-leading indeksli `EXISTS` probe kullanıyor.
- Blackout/Wayback istisna semantiği korunuyor; sonuç önce ve sonra `1.227`.
- En erken ve en geç kayıt tarihi aynı aggregate sorgusunda alınıyor; ikinci tam tarama kaldırıldı.
- Özet 5 dakika process içi cache'leniyor.
- Aynı anda gelen cache-miss istekleri tek `overviewInFlight` Promise'i paylaşarak DB'de
  duplicate sorgu başlatmıyor.

## Canlı kabul

Commit: `57833488`

Backend build ve PM2 reload sonrası:

| Koşu | HTTP | Toplam/TTFB |
|---|---:|---:|
| Soğuk cache | 200 | 2,556 sn |
| Sıcak 1 | 200 | 9,5 ms |
| Sıcak 2 | 200 | 3,0 ms |
| Sıcak 3 | 200 | 2,8 ms |
| Sıcak 4 | 200 | 4,9 ms |

20 paralel soğuk çağrı tek proses içinde 2.582 ms'de tamamlandı; `uniqueMeasuredAt=1`
ve `pricedProducts` sonucu bütün çağrılarda aynıydı. Bu, in-flight tekilleştirmenin
çalıştığını doğrular.

Yanıt doğruluğu:

- `totalProducts=1235`
- `pricedProducts=1227`
- `currentProducts=838`
- `activeSources=46`
- `activeCities=29`
- `activeMarkets=63`
- `latestRecordedDate=2026-08-13`
- `freshness=fresh`

## Araç sınırlaması

web-perf becerisinin zorunlu Chrome DevTools MCP sunucusu bu oturumda kurulu değildi.
Bu nedenle browser trace/LCP breakdown yapılmadı; ilgili Lighthouse/CrUX maddeleri açık
kalmaya devam eder. Bu kabul backend waterfall/cache darboğazını kapatır.
