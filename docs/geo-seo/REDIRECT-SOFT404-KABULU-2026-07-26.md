# Redirect ve Soft-404 Canlı Kabulü — 2026-07-26

## Test matrisi

26 Temmuz 2026'da düşük eşzamanlılıkla canlı `haldefiyat.com` üzerinde
redirect zinciri, son HTTP durumu ve kanonik hedef kontrol edildi.

| İstek | Zincir | Sonuç |
|---|---:|---|
| `http://haldefiyat.com/` | 1 | `https://haldefiyat.com/` → 200 |
| `http://www.haldefiyat.com/` | 1 | `https://haldefiyat.com/` → 200 |
| `https://www.haldefiyat.com/` | 1 | `https://haldefiyat.com/` → 200 |
| `/fiyatlar/` | 1 | `/fiyatlar` → 200 |
| `/tr/fiyatlar` | 1 | `/fiyatlar` → 200 |
| `/TR/FIYATLAR` | 2 | `/FIYATLAR` → gerçek 404 |
| `/urun/Domates` | 1 | `/urun/domates` → 200 |
| `/URUN/DOMATES` | 0 | gerçek 404 |
| rastgele olmayan genel URL | 0 | gerçek 404 |
| rastgele olmayan ürün URL'si | 0 | gerçek 404, 9 bayt gövde |
| rastgele olmayan hal URL'si | 0 | gerçek 404, 9 bayt gövde |

## Değerlendirme

- HTTP ve `www` varyantları tek adımda HTTPS kök domaine birleşiyor.
- Trailing slash ve varsayılan `/tr` locale tek adımda kanonik URL'ye gidiyor.
- Geçerli ürün slug'ındaki baş harf varyantı küçük harf kanoniğine birleşiyor.
- Tamamen büyük harf route/path varyantları yanlış bir 200 üretmiyor; 404 ile
  kapanıyor.
- Olmayan genel, ürün ve hal ailelerinde HTTP 200 dönmediği için test edilen
  örneklerde soft-404 bulunmadı.

Bu kabul örneklem matrisidir. Tüm iç URL envanterinin 3xx/4xx/5xx dağılımı ve
tam sitemap crawl'ı, veri tabanını zorlayan F-43 yüksek eşzamanlılık problemi
nedeniyle ayrı açık maddeler olarak kalır.
