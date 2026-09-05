# harmanapps.com bizden öndeyken — 24 sorgu, başlık analizi (2026-09-06)

Kaynak: rakip keşfi 3. koşusu (Brave, 5 Eyl), GSC 28 gün gösterim. "h" = harmanapps pozisyonu, "biz" = bizim pozisyon.

## Örüntü

harmanapps'in 24 sorgunun 24'ünde aynı başlık kalıbı var: **`{Şehir} Hal Fiyatları Bugün {GG.AA.YYYY} | Harman App`** ve **`{Ürün} Fiyatları Bugün Kaç TL {yıl} | Harman App`**. Sorgu kelimeleri ("hal fiyatları", "bugün", "kaç TL") başlığın başında ve aynı sırada; tarih her gün değişiyor (tazelik sinyali + "bugün" sorgusuna birebir).

Bizim kalıplar: **`{Hal adı} Fiyatları 2026 — Güncel Toptan Liste`** ve **`{Ürün} Fiyatları 2026 — Güncel Hal ve Toptan Fiyat`**. Sorunlar:
1. "hal fiyatları" ifadesi hal sayfası başlığında **yok** ("Toptancı Hali Fiyatları" var). 8 şehir sorgusunun hepsi "X hal fiyatları" diye aranıyor.
2. "bugün" ve "kaç TL" yok; tarih yok (statik "2026").
3. Yanlış sayfa yarışıyor: "bursa hal fiyatları" → /firmalar/bursa (komisyoncu listesi, #11), "mersin hal fiyatları" ve "istanbul sebze hali fiyatları" → ana sayfa, "istanbul hal fiyatları bugün" → /fiyatlar. Hal sayfası kendi sorgusunu almıyor.
4. "Limon (Kg) Fiyatları" — birim parantezi başlıkta (aile içinde koli/sandık varyantı olduğu için görünen ada ekleniyor).

## Sorgu tablosu

| Sorgu | Gösterim | h | biz | Bizim sayfa | Not |
|---|---:|---:|---:|---|---|
| istanbul hal fiyatları | 6.413 | 2 | 3 | /hal/istanbul-hal-ibb | başlığa "İstanbul Hal Fiyatları" |
| limon fiyatları | 5.233 | 3 | 5 | /urun/limon | "(Kg)" kaldır, "Bugün Kaç TL" |
| limon piyasası | 4.450 | 5 | 6 | /urun/limon | piyasa sayfaları var, ürün sayfasına "piyasa" |
| adana limon fiyatları | 4.251 | 2 | 6 | /urun/limon | /piyasa/adana-limon yeni (5 Eyl) |
| mersin limon fiyatları | 3.525 | 2 | 3 | /urun/limon | /piyasa/mersin-limon yeni |
| hal fiyatları | 3.299 | 10 | 12 | /fiyatlar | "Bugün" + tarih |
| ankara hal fiyatları | 3.083 | 2 | 10 | /hal/ankara-hal | başlık kalıbı |
| kayseri hal fiyatları | 2.219 | 3 | 8 | /hal/kayseri-hal | başlık kalıbı |
| mersin hal fiyatları | 1.983 | 1 | 9 | **/** | Mersin hali kuru (veri yok) → ana sayfa yarışıyor; /hal/mersin-hal noindex mi kontrol |
| konya hal fiyatları | 1.982 | 2 | 18 | /hal/konya-hal | başlık kalıbı |
| bursa hal fiyatları | 1.944 | 4 | 11 | **/firmalar/bursa** | hal sayfası başlığı sorguyu almalı |
| bayrampaşa hal fiyatları | 1.938 | 1 | 13 | /hal/istanbul-hal-ibb | "Bayrampaşa" 5 Eyl eklendi |
| salçalık domates fiyatları | 1.669 | 3 | — | /urun/domates-salcalik (Google #8,6) | ad düzeltildi 5 Eyl |
| denizli hal fiyatları | 1.387 | 2 | 6 | /hal/denizli-hal | başlık kalıbı |
| adana mayer limon fiyatları | 1.373 | 3 | — | /piyasa/adana-mayer-limon yeni | — |
| soğan fiyatları | 1.313 | 3 | 4 | /urun/sogan-kuru | "Bugün Kaç TL" |
| gaziantep hal fiyatları | 1.229 | 2 | 4 | /hal/gaziantep-hal | başlık kalıbı |
| ankara hal fiyatları bugün | 1.225 | 2 | 3 | /hal/ankara-hal | "bugün" başlıkta yok |
| bayrampaşa … fiyat listesi | 1.206 | 10 | — | /hal/istanbul-hal-ibb (Google #4) | — |
| istanbul hal fiyatları bugün | 1.082 | 2 | 9 | **/fiyatlar** | hal sayfası almalı |
| kocaeli hal fiyatları | 1.064 | 6 | — | /hal/kocaeli-hal-merkez (Google #3,6) | veri bugün tazelendi |
| istanbul sebze hali fiyatları | 1.056 | 3 | 8 | **/** | hal sayfası almalı |
| üzüm fiyatları | 896 | 2 | — | /urun/uzum (Google #5,9) | "Bugün Kaç TL" |
| ankara meyve sebze hali fiyatları | 826 | 2 | 4 | /hal/ankara-hal | "meyve sebze hali" açıklamada |

## Uygulanan (6 Eyl)

- Hal sayfası başlığı: **`{Şehir} Hal Fiyatları Bugün {tarih} — {Hal adı}`** (tarih = son veri günü; yoksa yıl). Açıklamaya "meyve sebze hali" ifadesi.
- Ürün sayfası şablonu (site_settings `seo_pages.urun`): **`{{nameClean}} Fiyatları Bugün Kaç TL? {{dateTr}} — Hal ve Toptan`**; `nameClean` birim parantezini atar, `dateTr` son veri günü.
- Pazar/hal sayfası olmayan şehir sorguları (Mersin) için hal sayfası veri gelene kadar noindex kalır; ana sayfa yarışması kabul.

## Ölçüm
19 Eylül: bu 24 sorgunun GSC pozisyon ve CTR'si (taban: yukarıdaki tablo, 28 gün 5 Eyl). Başlık değişikliği Google'a yeniden tarama ile 1–2 haftada yansır.
