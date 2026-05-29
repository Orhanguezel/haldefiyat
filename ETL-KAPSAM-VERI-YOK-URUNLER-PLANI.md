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

### Kova B — Balık (su ürünleri) → YENİ ETL KAYNAĞI *(gerçek kapsam boşluğu)*
~44 deniz/tatlısu/donuk balık (kalkan, kılıç, orfoz, orkinoz, lakerda, hamsi, sardalya, pisi...).
Mevcut ETL **sebze-meyve halleri**ni tarıyor; balık fiyatları **ayrı su ürünleri toptan halleri**nden gelir.

**Araştırma hedefleri (Faz B-keşif):**
- **İstanbul Su Ürünleri Hali** — IBB tarım portalı (sebze-meyve için zaten taranıyor: `tarim.ibb.istanbul`) balık fiyatı da yayınlıyor mu? Aynı AJAX pattern'le yeni kategori olabilir.
- **hal.gov.tr** — ulusal sistemde su ürünleri kategorisi var mı? (sebze-meyve baskın; kontrol et)
- İl bazlı su ürünleri halleri (İzmir, Trabzon, Mersin balık halleri) — site/yayın var mı?
- **Not:** "hamsi-yem", "sardalya-yem" (yem balığı) perakende fiyatı olmayabilir — bunları noindex bırak.

**Aksiyon:** Önce kaynak VAR MI keşfi (1-2 il + hal.gov.tr kontrolü). Kaynak bulunursa
`etl-sources.ts`'e yeni `responseShape` + parser; bulunamazsa balık kategorisi kalıcı noindex.

### Kova C — Nadir/Egzotik/Sezonluk → KABUL (noindex) *(aksiyon yok / sezonluk re-check)*
ejder-meyvesi, guava, guanabana, curuba, fejoya, ısırgan, semiz-otu, yerelmasi, termiye, hinnap...
Düşük/sıfır piyasa hareketi. Fabrikasyon veri üretilemez. **noindex kalsın.**
İsteğe bağlı: sezonluk ürünler (incir, kayısı, çilek-sera) sezonunda veri gelince recalc otomatik
indexler (formül zaten 30g pencereyle çalışıyor) — ekstra iş yok.

## Faz Planı
| Faz | İş | Etki | Sahip |
|---|---|---|---|
| **A** | Format varyantlarını canonical-merge (CSV + apply) | ~40-50 "veri-yok master" eriyip master'a katlanır | Claude/Codex |
| **B1** | Balık kaynağı keşfi (IBB balık + hal.gov.tr + 2 il) | Kaynak var/yok kararı | Claude + Orhan |
| **B2** | Kaynak bulunursa: yeni ETL source + parser | ~44 balık ürünü veri kazanır → indexlenebilir | Codex |
| **C** | Nadir/egzotik noindex bırak; sezonluk otomatik | — | — |

## Sıra
1. **Kova A önce** (hızlı, kaynak gerektirmez, ~40-50 ürünü çözer).
2. **Kova B1 keşif** (balık kaynağı gerçekten var mı — yatırım kararı bundan sonra).
3. B2 ancak kaynak doğrulanırsa.

## Not
Audit sayfası (`/admin/redirects → İçerik/Index Denetimi`) `no_price_data` + `few_markets` ile
bu ürünleri zaten işaretliyor → ilerleme buradan izlenir.
