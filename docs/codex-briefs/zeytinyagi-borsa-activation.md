# Codex Brief — Zeytinyağı + Sofralık Zeytin (borsa dikeyi)

> Fizibilite: [`docs/ZEYTIN-ZEYTINYAGI-FIZIBILITE.md`](../ZEYTIN-ZEYTINYAGI-FIZIBILITE.md) · Onaylandı 2026-06-16
> Kaynak doğrulandı (server-side 200, session yok): TOBB portalı, Edremit `borsakod=5ED20`.
> Pattern referansı: **pamuk** (`izmir_borsa_pamuk`) — tüm borsa dikeyi adımları orada.
> Kurallar: NO ALTER · hard-code YASAK · kod tekrarı YASAK · dosya <200 satır · deploy git.

## Doğrulanmış kaynak yapısı
`https://borsa.tobb.org.tr/fiyat_borsa.php?borsakod=5ED20` → temiz UTF-8 `<table class="table">`.
Kolonlar: **Ürün Adı · Birim · Son İşlem Tarihi · En Az (TL) · En Çok (TL) · Ortalama (TL) · İşlem Miktarı · İşlem Adeti · İşlem Tutarı**. Canlı satırlar (Edremit):
```
ZEYTİNYAĞI SIZMA      KG  15.06.2026  250 / 300 / 274
ZEYTİN YAĞI YEMEKLİK  KG  03.06.2026  245 / 250 / 245,85
ZEYTİN YAĞI HAM       KG  02.06.2026  150
ZEYTİN YAĞLIK         KG  04.05.2026  51,02
ZEYTİN SİYAH SALAMUR  KG  12.05.2026  150
ZEYTİN YEŞİL HUSUSİ   KG  15.06.2026  100
```
⚠️ "Son İşlem Tarihi" = **son işlem**, bugünün değil (yağlık 04.05 gibi eski olabilir) → `recordedDate` olarak bu tarihi geç, mevcut **borsa stale guard** (commit 36e80979) gösterimi yönetir.

## Ürün taksonomisi (v1 — KARAR VERİLDİ, flat, search-intent odaklı)
| Slug | Ad | Kategori | TOBB kaynağı | Arama hedefi |
|---|---|---|---|---|
| `zeytinyagi` | Zeytinyağı | yagli-tohum | **ZEYTİNYAĞI SIZMA** (natürel sızma) | "zeytinyağı fiyatları" (yüksek) |
| `zeytin` | Sofralık Zeytin | sebze-meyve* | ZEYTİN SİYAH SALAMUR + YEŞİL HUSUSİ | "zeytin fiyatları" / "sofralık zeytin" |

\* kategori repo'daki mevcut borsa kategori setine göre seç; yoksa `yagli-tohum`/yeni `zeytin` — kararı kod sahibi netleştirir.

- **v1'de sadece sızma → `zeytinyagi`** (yemeklik 245 / ham 150 karışırsa fiyat çarpılır; ayrı tip = v2 varyant).
- Yemeklik/ham/yağlık → **v2** (canonicalSlug varyant modeli, `zeytinyagi-yemeklik` vb.).

## Görevler

### Z1 — Backend parser + responseShape
- `src/modules/etl/sources/borsa/text-parsers.ts` (veya yeni `tobb.ts`): `parseTobbBorsaHtml(raw): BorsaPriceRow[]`.
  - `.table` satırlarını **yapısal** oku (line-bazlı parseBorsaText'i KULLANMA — TOBB sabit 9 kolon).
  - Sadece zeytin taksonomisine giren satırları al; isim→ürün eşlemesi (regex): sızma→"Zeytinyağı", siyah/yeşil→"Sofralık Zeytin".
  - `recordedDate` = "Son İşlem Tarihi" (DD.MM.YYYY → YYYY-MM-DD). `avg/min/max` = TR sayı (mevcut `parseTrNumber` reuse).
- `src/modules/etl/fetcher.ts`: `responseShape` union'a `"tobb_borsa_html"` + dispatch (`case "tobb_borsa_html": return parseTobbBorsaHtml(String(raw))`) + `HTML_SHAPES` set'ine ekle.

### Z2 — Kaynak config
- `src/config/source-urls.ts`: `tobb_borsa_edremit` kaydı (name "Edremit Ticaret Borsası", url `https://borsa.tobb.org.tr/fiyat_borsa.php?borsakod=5ED20`, type "exchange", official true).
- `src/config/etl-sources.ts` RAW_SOURCES: yeni kayıt `tobb_borsa_edremit` (defaultMarketSlug `edremit-ticaret-borsasi`, baseUrl `https://borsa.tobb.org.tr`, endpoint `/fiyat_borsa.php?borsakod=5ED20`, responseShape `tobb_borsa_html`, unit kg, category yagli-tohum). `defaultEnabled: true`.
- **Gemlik = `5GE10`** (doğrulandı, sofralık zeytin uzmanı, Gemlik zeytini AB tescilli) → sofralık `zeytin` için ikinci kaynak; Edremit(5ED20)=yağ, Gemlik(5GE10)=sofralık. v1'de Edremit yeterli, Gemlik'i hemen ekleyebilirsin (1 satır config).

### Z3 — Seed (markets + products + editorial) — NO ALTER, sadece CREATE/INSERT
- `020_hal_domain_schema.sql`:
  - **market**: `edremit-ticaret-borsasi` satırı (izmir-ticaret-borsasi #166 pattern; source_key `tobb_borsa_edremit`, market_type `borsa`, bölge `marmara`).
  - **products**: `zeytinyagi` + `zeytin` satırları (pamuk #201 pattern). `aliases` JSON TOBB isimlerini KAPSAMALI ki `resolveProductSlug` eşlesin:
    - zeytinyagi: `["zeytinyağı","zeytinyagi","natürel sızma zeytinyağı","sızma zeytinyağı","zeytinyağı sızma","sizma zeytinyagi","olive oil"]`
    - zeytin: `["zeytin","sofralık zeytin","sofralik zeytin","zeytin siyah salamur","zeytin yeşil hususi","yeşil zeytin","siyah zeytin","table olive"]`
- `037_borsa_product_editorial.sql`: **editöryel HAZIR → [`zeytinyagi-editorial-037.sql`](./zeytinyagi-editorial-037.sql)** dosyasındaki 2 VALUES bloğunu 037'nin VALUES listesine ekle (kolon sırası birebir, kendi metnini YAZMA). 7 alan dolu (about/price_factors/season/region/quality/culinary + related_slugs). SEO için ZORUNLU (ince içerik = noindex).
- `src/config/static-editorial-slugs.ts`: `zeytinyagi`, `zeytin` ekle.

### Z4 — Frontend (borsa listelerine ekle + KNOWN_BROKEN'dan çıkar)
- `frontend/src/proxy.ts`: `BORSA_PRODUCT_SLUGS`'a `zeytinyagi` + `zeytin` ekle. **`KNOWN_BROKEN_PRODUCT_SLUGS`'tan `zeytin`'i ÇIKAR** (artık gerçek ürün — yoksa 307'le arama sayfasına gider, sayfa açılmaz!).
- `frontend/src/app/[locale]/(public)/urun/[slug]/page.tsx`: `BORSA_FALLBACK_PRODUCTS`'a `zeytinyagi` + `zeytin` ekle (API boşken bile sayfa render olsun).

### Z5 — Deploy + ETL + doğrula
- Build (backend+frontend) → deploy (git akışı). Seed: yeni market/product satırları VPS'te idempotent eklenmeli — **fresh seed price history'yi siler**, o yüzden Z3 INSERT'leri `INSERT IGNORE`/`ON DUPLICATE` ile VPS'te tek tek çalıştırılır (Orhan onayı; fresh seed YAPMA).
- ETL tetikle: `POST /api/v1/admin/hal/etl/run {"source":"tobb_borsa_edremit"}`.
- Doğrula: `/urun/zeytinyagi` + `/urun/zeytin` 200 + fiyat görünüyor; `hf_price_history`'de zeytin satırları; stale guard eski tarihli yağlık'ı doğru etiketliyor.

## Kabul kriteri
- Edremit ETL zeytinyağı+sofralık satırlarını `hf_price_history`'ye yazıyor.
- `/urun/zeytinyagi` indexlenebilir (özgün editöryel), natürel sızma fiyatı + kaynak/tarih gösteriyor.
- `/urun/zeytin` 307 DEĞİL, gerçek sayfa (KNOWN_BROKEN'dan çıkarıldı).
- Mevcut 5 borsa emtiası bozulmadı (regresyon yok).

## Riskler
- TOBB rate-limit/session → Scrapling fallback (HF_SCRAPER_SOURCES) hazır.
- `resolveProductSlug` eşleşmezse fiyat düşer → aliases'ı TOBB ham isimleriyle test et.
- Stale tarih → guard'a güven, parser'da tarihi UYDURMA (gerçek son işlem tarihi).
