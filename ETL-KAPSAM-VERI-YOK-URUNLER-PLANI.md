# ETL Kapsam Planı — Veri-Yok Ürünler (audit `no_price_data`)

> **Bağlam:** dataQuality recalc + index temizliği sonrası ~120 master ürünün son 30 günde
> hiç fiyat verisi yok (audit `no_price_data`). Bunlar fiyat sitesi için thin → noindex.
> Çözüm tek değil; 3 farklı kök neden var. Tespit: Claude, 2026-05-29.

## Kategori dağılımı (canonical=NULL master, son 30g fiyat=0)
| Kategori | Adet |
|---|---|
| sebze | 37 |
| meyve | 34 |
| balik-deniz | 32 |
| balik-donuk | 6 |
| sebze-meyve | 4 |
| balik-tatlisu | 3 / balik-ithal 3 / ithal 1 |

## 3 Kök Neden (kova)

### Kova A — Format/Paketleme Varyantı → CANONICAL MERGE *(yeni kaynak GEREKMEZ)*
Bunlar aslında master ürünün paketleme/kalite varyantı; master'ın verisi VAR, varyant boş.
- **limon:** limon-kasa, limon-sandik, limon-dokme-mayer → canonical=limon
- **mandalina:** mandalin-king, mandalina-dal, mandalina-dokme, mandalina-w-murcott → canonical=mandalina
- **domates:** domates-2, domates-tarla, domates-salcalik-rio → canonical=domates
- **havuc:** havuc-takoz, havuc-beypazari-buzhane, sil-havuc → canonical=havuc
- **salatalik:** salatalik-kornison, salatalik-tursuluk-kornison, salatalik-yerli, salatalik-silor-eskisehir → canonical=salatalik
- **otlar (gramajlı):** dereotu-70-100-gr, feslegem-70-100gr, reyhan-kirmizi-70-100gr → canonical=dereotu/feslegen/reyhan
- **erik:** erik-ankara, erik-aynali, erik-murdum-fireze → canonical=erik

**Aksiyon:** Bu varyantları master-slugs/manual-name-mapping CSV'sine ekle → `apply-seo-master-list --apply`.
Hem "veri-yok master" sayısını düşürür hem master sayfasına trafik toplar. **Hızlı kazanç.**

### Kova B — Balık → ✅ KEŞİF SONUCU: YENİ KAYNAK GEREKMİYOR (mevsimsel)
**Bulgu (2026-05-29):** Balık fiyatları zaten mevcut sebze-meyve hallerinden geliyor —
**İzmir hali 142 balık türü** taşıyor (ETL sağlıklı, son çalışma bugün), Ankara 51, Bursa 8.
TÜM balık kategorisinin son fiyatı **bugün** → haller yıl boyu balık (çiftlik/donuk/ithal) listeliyor.

44 veri-yok balık neden boş: **su ürünleri av yasağı** (~15 Nisan–1 Eylül). Yaban deniz balıkları
(kalkan, kılıç, orfoz, hamsi, lüfer...) yasakta avlanmıyor → halde fiyatı yok. Dağılım:
- **~25 mevsimsel** (son veri Nisan+ / Q1) → **Eylül'de av yasağı kalkınca otomatik döner**
- **~18 gerçekten nadir** (son veri 2025+) → kalıcı noindex (Kova C ile aynı)

**Aksiyon:** Balık scraper'ı YAZMA (gereksiz). Bunun yerine:
1. **Auto-recovery cron** (önerilen) — haftalık `calculate-product-data-quality --apply` + master+editoryel+veri≥70
   için seoIndex flip. Sezonsal ürünler (Eylül balıkları, yaz meyveleri) verisi dönünce otomatik indexlenir.
   Şu an cron.ts'te bu YOK → sezonsal recovery manuel. **Tek gerçek eksik bu.**
2. **Eylül'de balık Round-3** — av yasağı kalkınca top deniz balıkları için editoryel üret + flip
   (şimdi üretme: fiyatsız sayfa thin olur).

### Kova C — Nadir/Egzotik/Sezonluk → KABUL (noindex) *(aksiyon yok / sezonluk re-check)*
ejder-meyvesi, guava, guanabana, curuba, fejoya, ısırgan, semiz-otu, yerelmasi, termiye, hinnap...
Düşük/sıfır piyasa hareketi. Fabrikasyon veri üretilemez. **noindex kalsın.**
İsteğe bağlı: sezonluk ürünler (incir, kayısı, çilek-sera) sezonunda veri gelince recalc otomatik
indexler (formül zaten 30g pencereyle çalışıyor) — ekstra iş yok.

## Faz Planı
| Faz | İş | Etki | Sahip |
|---|---|---|---|
| **A** ✅ | Format varyantlarını canonical-merge | **TAMAM 2026-05-29: 48 varyant merge edildi, veri-yok master 120→72** | Claude |
| **B1** ✅ | Balık kaynağı keşfi | **TAMAM: kaynak GEREKMİYOR — mevsimsel (av yasağı). İzmir 142 balık taşıyor** | Claude |
| **B2** ~~| ~~yeni ETL source~~ | **İPTAL — gereksiz** | — |
| **B3** ✅ | Auto-recovery cron (haftalık recalc+flip/demote) | **TAMAM 2026-05-29: `runSeoIndexMaintenance` + cron pzt 06:40 UTC, runtime doğrulandı (idempotent)** | Claude |
| **C** | Nadir/egzotik (~18 balık + ~28 diğer) noindex bırak; sezonluk otomatik | — | — |

## Sıra
1. **Kova A önce** (hızlı, kaynak gerektirmez, ~40-50 ürünü çözer).
2. **Kova B1 keşif** (balık kaynağı gerçekten var mı — yatırım kararı bundan sonra).
3. B2 ancak kaynak doğrulanırsa.

## Not
Audit sayfası (`/admin/redirects → İçerik/Index Denetimi`) `no_price_data` + `few_markets` ile
bu ürünleri zaten işaretliyor → ilerleme buradan izlenir.
