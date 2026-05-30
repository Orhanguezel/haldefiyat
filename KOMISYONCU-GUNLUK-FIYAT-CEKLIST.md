# Çeklist — Komisyoncu Günlük Fiyat Girişi (Hal Fiyatı Formatında)

> **Karar:** Orhan, 2026-05-30. Firma formundaki serbest-metin "Ürünler" tablosu yerine,
> komisyoncular **hal fiyatı formatında günlük fiyat** girsin: ürün + birim + min/ort/maks +
> tarih. **Her gün** atılabilsin; aynı ürün+gün yeniden atılınca **tarih güncellensin** (upsert).
> **Düzenleme + silme** olsun. **Rol:** Claude = mimari/plan · **Codex = implementasyon** · Orhan = test.

## Mevcut Gerçekler (bunlara uy)
- **Resmi hal fiyatı formatı = `hf_price_history`:** `product_id`, `market_id`,
  `min_price DECIMAL(12,2) NULL`, `max_price NULL`, `avg_price DECIMAL(12,2) NOT NULL`,
  `unit VARCHAR(32) DEFAULT 'kg'`, `recorded_date DATE`, UNIQUE `(product_id, market_id, recorded_date)`.
  Frontend gösterim alanları: `minPrice / maxPrice / avgPrice / unit / recordedDate / marketSlug`
  ("En düşük / Ortalama / En yüksek"). Resmi veride birim hep `kg`.
- `hf_products`: katalog (slug, name, unit, category_slug). Komisyoncu ürünü buna **eşlenebilir** (opsiyonel).
- **Mevcut firma ürün yapısı (DEĞİŞECEK):** `hf_firm_products(product_slug, product_name, note, price VARCHAR, display_order)`
  + Excel import + `FirmProductsTable` (Codex yeni yaptı). Bu **serbest metin** → hal formatı **değil**.
- Firma endpoint guard'ı: owner-only (`onRequest:[requireAuth]` + `firm.ownerUserId === userId`).
- İl/ilçe dropdown + `firm-product-validation` + lazy `xlsx` import altyapısı **mevcut** (yeniden kullan).

## 🔑 KARAR GEREKİR (Orhan onayı) — varsayılan öneri işaretli
- **K1. Komisyoncu fiyatları nerede görünür?**
  - ✅ **ÖNERİ:** YALNIZ firma profilinde ayrı "Günlük Fiyatlarım" bölümü. Resmi ürün/hal
    sayfalarındaki **agregalı veriye KARIŞTIRILMAZ** (veri bütünlüğü + güven; resmi ETL ayrı kalır).
  - Alternatif (sonraki faz): moderasyon + "komisyoncu kaynağı" etiketiyle ürün sayfasına ayrı sekme.
- **K2. hf_firm_products ne olacak?** ✅ **ÖNERİ:** Fiyat amacıyla **emekliye ayrılır**; yeni
  `hf_firm_prices` birincil olur. İstenirse "sattığı ürünler" etiket listesi olarak fiyatsız kalabilir
  (opsiyonel). Excel import + tablo yeni fiyat yapısına taşınır.

---

## FAZ 1 — DB: `hf_firm_prices` (dated, hal formatı) `[Codex]`
- [ ] `backend/src/db/seed/sql/034_firms_schema.sql` **CREATE TABLE'a ekle** (ALTER YOK — seed'e ekle, fresh seed):
  ```sql
  CREATE TABLE IF NOT EXISTS hf_firm_prices (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    firm_id       INT NOT NULL,
    product_slug  VARCHAR(128) NULL,             -- hf_products eşleşmesi (opsiyonel)
    product_name  VARCHAR(255) NOT NULL,         -- gösterilecek ad
    unit          VARCHAR(32)  NOT NULL DEFAULT 'kg',
    min_price     DECIMAL(12,2) NULL,
    max_price     DECIMAL(12,2) NULL,
    avg_price     DECIMAL(12,2) NOT NULL,        -- ana fiyat
    recorded_date DATE NOT NULL,
    created_by    VARCHAR(36) NULL,
    created_at    DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    updated_at    DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    CONSTRAINT hf_firm_prices_firm_fk FOREIGN KEY (firm_id) REFERENCES hf_firms(id) ON DELETE CASCADE,
    UNIQUE KEY hf_firm_prices_uq (firm_id, product_name, recorded_date),
    KEY hf_firm_prices_firm_date_idx (firm_id, recorded_date),
    KEY hf_firm_prices_product_idx (product_slug)
  );
  ```
  > UNIQUE `(firm_id, product_name, recorded_date)` → aynı ürün+gün tekrar atılınca **upsert** (tarih güncellenir).
- [ ] `backend/src/db/schema.ts` drizzle tanımı + tipler.
- [ ] **Canlı DB:** tablo populated → seed fresh veri kaybı riskli; bu tablo **yeni/boş** olduğundan
  `CREATE TABLE` additive uygulanabilir (mevcut kuralla tutarlı, sadece yeni tablo).

## FAZ 2 — Backend endpoint'leri `[Codex]`
- [ ] Zod: `firmPriceBodySchema` → `productName(1-255)`, `productSlug?(≤128)`, `unit(enum allowlist)`,
  `avgPrice(>0)`, `minPrice?(≥0)`, `maxPrice?(≥0)`, `recordedDate(YYYY-MM-DD, gelecek tarih YASAK)`.
  Kural: min ≤ avg ≤ max (verilmişse). Birim allowlist: `kg, kasa, adet, demet, bağ, çuval, kg/kasa`.
- [ ] **Owner-only** route'lar (mevcut ürün guard deseni):
  - `POST   /firms/:id/prices`            → tek satır **upsert** (firm_id+product_name+recorded_date)
  - `POST   /firms/:id/prices/bulk`       → toplu upsert `{ prices: [...] }` (max 500, transaction)
  - `PATCH  /firms/:id/prices/:priceId`   → düzenle
  - `DELETE /firms/:id/prices/:priceId`   → sil
  - `GET    /firms/:id/prices?date=`      → owner; tarih filtreli (default bugün), gün listesi
- [ ] **Public:** `GET /firms/:slug/prices` → o firmanın **en güncel tarihteki** fiyatları (firma profili için).
  `getFirmBySlug` cevabına `latestPrices` + `latestPriceDate` ekle.
- [ ] Repository: `upsertFirmPrice`, `bulkUpsertFirmPrices`, `updateFirmPrice`, `deleteFirmPrice`,
  `getFirmPricesByDate`, `getLatestFirmPrices`. Upsert = `INSERT ... ON DUPLICATE KEY UPDATE` (avg/min/max/unit/updated_at).
- [ ] Rate-limit (bulk 5/dk, tekil 60/dk).

## FAZ 3 — Form: Günlük fiyat girişi `[Codex]`
- [ ] `FirmOwnerForm.tsx` "Ürünler" bölümü → **"Günlük Fiyatlar"**. Giriş satırı **hal formatı**:
  **Ürün** (katalog combobox `hf_products` + serbest metin) · **Birim** (select, default kg) ·
  **En düşük** · **Ortalama*** · **En yüksek** · **Tarih** (default **bugün**, date picker).
  (`*` = avg zorunlu; min/max opsiyonel.)
- [ ] **Düzenle + Sil** her satırda (manage modunda PATCH/DELETE; create modunda yerel draft düzenle/sil).
- [ ] "Bugünün fiyatlarını gir" akışı: tarih default bugün; aynı ürünü tekrar girersen **uyar + üzerine yaz** (upsert).
- [ ] Tablo (`FirmPricesTable.tsx`, mevcut `FirmProductsTable` yerine/yanına): kolonlar
  **Ürün · Birim · Min · Ort · Maks · Tarih · İşlem(Düzenle/Sil)**. Boş durum + responsive korunur.
- [ ] Doğrulama: `firm-product-validation`'ı **fiyat alanlarına** genişlet (`firm-price-validation.ts`):
  sayısal avg>0, min≤avg≤max, tarih ≤ bugün, birim allowlist. Backend zod ile **birebir**.

## FAZ 4 — Excel/CSV import (hal formatına uyarla) `[Codex]`
- [ ] Mevcut lazy `xlsx` + önizleme + "X geçerli / Y hatalı" altyapısını **yeniden kullan**; kolonları değiştir:
  **Ürün Adı · Birim · En Düşük · Ortalama · En Yüksek · Tarih** (+ ops. Katalog Slug).
- [ ] Şablon güncelle: `public/templates/firma-urun-sablonu.csv` → yeni kolon başlıkları + örnek satır
  (`Domates, kg, 18, 22, 26, 2026-05-30`).
- [ ] Başlık eşleme toleransı (TR/EN): `Ürün/name`, `Birim/unit`, `En Düşük/min`, `Ortalama/avg`,
  `En Yüksek/max`, `Tarih/date`. Tarih boşsa **bugün** varsay. Önizlemede sayısal/tarih doğrulaması.
- [ ] Onay → `POST /firms/:id/prices/bulk` (upsert).

## FAZ 5 — Public firma profili gösterimi `[Codex]`
- [ ] `firma/[slug]/page.tsx`: "Firma Ürünleri" yerine/yanına **"Günlük Hal Fiyatları"** bölümü —
  `latestPrices` tablosu (Ürün · Birim · Min · Ort · Maks) + **"Veri tarihi: {latestPriceDate}"** rozeti.
- [ ] Fiyat yoksa bölüm gizli. Tasarım resmi fiyat tablolarıyla görsel tutarlı.
- [ ] (K1 önerisi gereği) bu veri resmi ürün/hal sayfalarına **karışmaz**; yalnız firma profilinde.

## FAZ 6 — Opsiyonel / sonraki `[Claude+Codex, sonra]`
- [ ] Günlük hatırlatma: komisyoncuya "bugünkü fiyatları gir" Telegram/e-posta nudge (mevcut telegram/mail modülü).
- [ ] Moderasyon/şüpheli fiyat işareti (resmi ortalamadan çok sapan değer uyarısı).
- [ ] (İleride, K1 alternatifi) ürün sayfasında ayrı "Komisyoncu fiyatları" sekmesi + kaynak etiketi.
- [ ] hf_firm_products → fiyatsız "sattığı ürünler" etiketine indir veya kaldır (K2).

---

## Kabul Kriterleri (Orhan testi)
1. `/hesabim/firmam` → Günlük Fiyatlar'a Domates / kg / 18-22-26 / bugün gir → kaydet → tabloda görünür.
2. Aynı ürünü bugün tekrar 20-24-28 ile gir → **yeni satır değil, güncellenir** (upsert), tarih bugün.
3. Bir satırı **düzenle** (ort 25 yap) + başka satırı **sil** → kalıcı.
4. Excel şablonu indir → 5 ürün (1 tarihsiz, 1 hatalı) → import → önizleme "4 geçerli, 1 hatalı" → ekle.
5. `/firma/{slug}` → "Günlük Hal Fiyatları" tablosu + "Veri tarihi" rozeti; resmi ürün sayfası **etkilenmemiş**.
6. Gelecek tarih / avg≤0 / min>max reddediliyor. Typecheck temiz, mobil uyumlu.

## Dosya Özeti
**Yeni:** `backend` repo: `hf_firm_prices` (034 sql + schema.ts), `firmPriceBodySchema` + 6 route (`index.ts`),
repository fonksiyonları · `frontend`: `components/firms/owner/FirmPricesTable.tsx`,
`lib/firm-price-validation.ts`
**Değişen:** `FirmOwnerForm.tsx` (Ürünler→Günlük Fiyatlar + hal-format satır + edit/delete),
Excel import kolonları, `public/templates/firma-urun-sablonu.csv`, `firma/[slug]/page.tsx`,
`lib/api.ts` (Firm tipine `latestPrices`/`latestPriceDate`)
**Korunur:** İl/ilçe dropdown (FAZ 1 önceki çeklist), Combobox, lazy xlsx altyapısı.

## Notlar
- ALTER YOK: yalnız **yeni tablo** CREATE (additive, mevcut kuralla uyumlu).
- Tek doğrulama kaynağı (frontend ↔ backend zod birebir). Birim allowlist tek yerde.
- Resmi ETL verisine dokunma; komisyoncu verisi ayrı tabloda, ayrı gösterim (K1).
