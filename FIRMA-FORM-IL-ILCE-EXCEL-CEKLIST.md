# Çeklist — Firma Formu: İl/İlçe Dropdown + Excel Ürün İçe Aktarma + Doğrulama

> **Karar:** Orhan, 2026-05-30. `/firmalar/ekle` (ve `/hesabim/firmam`) formunda il/ilçe
> serbest metin yerine **aramalı dropdown** (Türkiye 81 il + ilçe). Ürünler **Excel/CSV ile
> toplu** eklenebilsin, **tablo** olarak gösterilsin, **doğrulama** her yerde aynı standartta.
> **Rol:** Claude = mimari/plan · **Codex = implementasyon** · Orhan = test/moderasyon.

İlgili mevcut dosyalar (değişecek):
- Form: [`frontend/src/components/firms/owner/FirmOwnerForm.tsx`](./frontend/src/components/firms/owner/FirmOwnerForm.tsx)
- Sayfa: `frontend/src/app/[locale]/(public)/firmalar/ekle/page.tsx`, `.../hesabim/firmam`
- Backend firms: [`backend/src/modules/firms/index.ts`](./backend/src/modules/firms/index.ts) (zod şemalar + route'lar),
  `backend/src/modules/firms/repository.ts`, `service.ts`
- Şema: `backend/src/db/seed/sql/034_firms_schema.sql` (`hf_firms`, `hf_firm_products`)
- Kaynak dataset: `vps-guezel/kamanilan/frontend/src/data/turkey-cities.ts`
  (81 il, `{ value, label, districts: string[] }`)

Mevcut alan gerçekleri (değiştirme, bunlara uy):
- `hf_firms.city_slug VARCHAR(96)`, `district_slug VARCHAR(128)`, `categories JSON` → **slug** saklanıyor
  (ör. `adana` / `seyhan`). DB'de 63 distinct city_slug var, hepsi ASCII slug.
- `firmWriteBodySchema`: `name(2-255)`, `contactPerson?`, `phone?`, `address?(≤5000)`,
  `citySlug?(≤96)`, `districtSlug?(≤128)`, `description?(≤5000)`, `categories?(string[], ≤30, her biri ≤80)`
- `firmProductBodySchema`: `productSlug?(≤128)`, `productName(1-255)`, `note?(≤500)`, `price?(≤128)`, `displayOrder?`
- Ürün endpoint'leri **owner-only** (`onRequest:[requireAuth]` + `firm.ownerUserId === userId`):
  `POST /firms/:id/products`, `PATCH/DELETE /firms/:id/products/:productId`

---

## FAZ 1 — İl/İlçe Aramalı Dropdown (cascading combobox)

### 1.1 Dataset'i hal-fiyatlari'ya taşı `[Codex]`
- [x] `frontend/src/data/turkey-cities.ts` oluştur — kamanilan'daki `TURKEY_CITIES` (81 il + ilçe) **birebir kopyala**.
  Tip: `export interface TurkeyCity { value: string; label: string; districts: string[]; }`
- [x] Türkçe-duyarlı slug üretici ekle: `frontend/src/lib/tr-slug.ts` → `slugifyTr(s: string): string`.
  Kurallar: `İ/ı→i, ş→s, ç→c, ğ→g, ü→u, ö→o`, lowercase (`toLocaleLowerCase("tr")`), boşluk→`-`,
  alfanümerik dışını sil, çoklu `-` tek `-`. **Mevcut `FirmOwnerForm.slugifyNullable`'ı bununla değiştir**
  (kod tekrarını önle — tek slug fonksiyonu).
- [x] Yardımcılar: `provinceBySlug(slug)`, `districtsOfProvinceSlug(slug)`, `findProvinceByDistrictSlug(...)`
  (manage modunda slug→display geri eşleme için).

> **Slug uyumu (kritik):** `slugifyTr(label)` çıktısı mevcut DB slug'larıyla örtüşmeli
> (doğrulandı: `Aydın→aydin`, `Şanlıurfa→sanliurfa`, `İstanbul→istanbul`, `Seyhan→seyhan`).
> **Doğrulama görevi:** `SELECT DISTINCT city_slug, district_slug FROM hf_firms` çek, `slugifyTr` ile
> üret, **eşleşmeyenleri listele**. Sapma varsa `frontend/src/data/slug-overrides.ts`'e
> `{ "afyon": "afyonkarahisar" }` gibi manuel override map ekle (filtreler bozulmasın).

### 1.2 Aramalı combobox bileşeni `[Codex]`
- [x] `frontend/src/components/ui/Combobox.tsx` — **bağımlılık eklemeden** (yeni npm yok) hafif combobox:
  - Props: `options: {value,label}[]`, `value`, `onChange`, `placeholder`, `disabled`, `emptyText`.
  - Yazınca filtreler (label üzerinde TR-insensitive arama), klavye (↑↓ Enter Esc), dışarı tıkla kapat.
  - Erişilebilir (`role="combobox"`, `aria-expanded`, `aria-activedescendant`), tema token'ları,
    mobil dokunmatik uyumlu. `HeaderNavDropdown` desenindeki dışarı-tıkla/Escape mantığını referans al.
- [x] `frontend/src/components/firms/owner/CityDistrictSelect.tsx`:
  - İki bağlı Combobox: **İl** (81 seçenek) → seçilince **İlçe** aktifleşir (o ilin ilçeleri).
  - İl değişince ilçe sıfırlanır. Props: `citySlug`, `districtSlug`, `onChange({citySlug, districtSlug})`.
  - Görünen: display label; dışarı veren: **slug** (`slugifyTr`).

### 1.3 Forma entegre et `[Codex]`
- [x] `FirmOwnerForm.tsx`: "İl slug" + "İlçe slug" serbest `Field`'lerini **kaldır**, yerine `CityDistrictSelect`.
- [x] **create** modu: il **zorunlu** (submit guard + görsel `*`), ilçe opsiyonel.
- [x] **manage** modu: mevcut `firm.citySlug/districtSlug`'dan il/ilçe'yi **önseç** (slug→display).
  Slug listede yoksa: ilk açılışta uyarı göster, kullanıcı yeniden seçsin (eski serbest veri için).
- [x] Submit'te `citySlug`/`districtSlug` zaten slug → `normalizeFirmPayload`'daki ekstra slugify gereksiz, sadeleştir.

### 1.4 Backend doğrulama (sunucu tarafı allowlist) `[Codex]`
- [x] `backend/src/data/turkey-city-slugs.ts` — il→ilçe **slug seti** (frontend dataset'ten türetilmiş;
  build script veya elle senkron). Tek kaynak ideal; pratikte mirror + kısa not.
- [x] `firmWriteBodySchema`'ya `.superRefine`: `citySlug` doluysa geçerli il slug'ı olmalı; `districtSlug`
  doluysa o ilin ilçesi olmalı. Geçersizse `invalid_city` / `invalid_district` döndür.
- [x] (Opsiyonel) create'te `citySlug` zorunlu kuralını backend'de de uygula (frontend ile paralel).

---

## FAZ 2 — Excel/CSV ile Ürün İçe Aktarma + Tablo + Doğrulama

### 2.1 Ürünleri gerçek **tablo** olarak göster `[Codex]`
- [x] Mevcut `divide-y` liste yerine `<table>`: kolonlar **Ürün Adı · Fiyat/Not · Açıklama · İşlem(Sil)**.
  Hem **create** (draftProducts) hem **manage** (products) için aynı tablo bileşeni:
  `frontend/src/components/firms/owner/FirmProductsTable.tsx`.
- [ ] Boş durum: "Henüz ürün eklenmedi." satırı korunur. Responsive (mobilde yatay scroll veya stack).

### 2.2 İçe aktarma UI `[Codex]`
- [x] Ürünler bölümüne **"Excel/CSV ile içe aktar"** butonu + gizli `<input type="file" accept=".xlsx,.xls,.csv">`.
- [x] **Şablon indir** linki: başlıklı örnek dosya (`Ürün Adı, Fiyat/Not, Açıklama, Katalog Slug(ops.)`).
  `public/templates/firma-urun-sablonu.csv` (ve istenirse .xlsx). Buton bu dosyaya link verir.
- [x] Parse **client-side, lazy**: `const XLSX = await import("xlsx")` (yalnız butona basınca yüklensin —
  initial bundle'ı şişirmesin). `xlsx` (SheetJS) bağımlılığı eklenir; .xlsx/.xls/.csv hepsini okur.
  > Alternatif (Codex tercih ederse): multipart upload → backend parse. Ama client-side + lazy import
  > daha basit (storage/multipart yok, anında önizleme). Client-side seçildi.
- [x] Başlık eşleme toleransı: TR + EN başlıklar (`Ürün Adı|Urun Adi|name`, `Fiyat|Fiyat/Not|price`,
  `Açıklama|Aciklama|note`, `Katalog Slug|product_slug`). Trim, boş satır atla.

### 2.3 Önizleme + doğrulama tablosu `[Codex]`
- [x] Parse sonrası **önizleme tablosu** (modal veya bölüm): her satır + **durum** (✓ geçerli / ✗ hata).
- [x] Satır doğrulama (frontend, 2.5'teki ortak limitlerle):
  - `productName` zorunlu, 1–255; `price` ≤128; `note` ≤500; `productSlug` ≤128.
  - Aynı dosyada **yinelenen ürün adı** → uyar (atla veya işaretle).
  - Hatalı satırlar kırmızı; **sadece geçerli satırlar** içe aktarılır.
- [x] Özet: "X geçerli, Y hatalı satır" + **"Geçerli satırları ekle"** onay butonu.

### 2.4 Toplu ekleme endpoint'i `[Codex]`
- [x] **Yeni:** `POST /firms/:id/products/bulk` (owner-only, mevcut ürün route'larıyla aynı guard).
  Body: `{ products: FirmProductBody[] }` (max 500). Her öğe `firmProductBodySchema` ile doğrulanır;
  geçersizler atlanır. Repository'de **tek transaction / batch insert** (`createFirmProductsBulk`).
  Dönen: `{ inserted: number, skipped: number }`. Rate-limit (ör. 5/dk).
- [x] **create** akışı: firma oluşunca draft ürünleri **tek bulk çağrısıyla** ekle (mevcut for-loop yerine).
- [x] **manage** akışı: import onayı → bulk endpoint → listeyi `/firms/me` ile tazele.

### 2.5 Doğrulama standardı (tek kaynak) `[Codex]`
- [x] `frontend/src/lib/firm-product-validation.ts` — limitler + `validateProductRow(row)` (tekil ekleme,
  Excel import, tablo edit hepsi bunu kullansın). Limitler backend `firmProductBodySchema` ile **birebir**.
- [x] Tekil "Ekle" ve Excel import aynı doğrulamadan geçsin (kod tekrarı yok).

---

## FAZ 3 — Genel Doğrulama & Cila `[Codex]`
- [x] Telefon: opsiyonel TR normalize (sadece rakam + format) — zorlama yok, boş bırakılabilir.
- [x] Firma adı `min 2`, il zorunlu; tüm alanlarda trim + boşsa `null`.
- [x] Kullanıcıya dönük TR hata mesajları (backend `issues` → okunur mesaj eşleme).
- [x] KVKK/onay notu mevcut akışta korunur.

### Uygulama Notu (Codex, 2026-05-30)
- [x] Canlı DB slug doğrulaması yapıldı: 145 distinct il/ilçe çifti kontrol edildi. İl slug'ları dataset ile uyumlu; 58 sapma eski scraped `district_slug` değerlerinde (`sevkiyat`, `karpuz`, `merkez`, belde/hal alt alanı vb.). Yeni form resmi ilçe slug'ı üretir; manage modunda eski ilçe listede yoksa kullanıcıya uyarı gösterilir.
- [x] Doğrulama: backend `bun run typecheck`, frontend `bun x tsc --noEmit`, backend build, frontend build temiz.

---

## Kabul Kriterleri (Orhan testi)
1. `/firmalar/ekle` → İl yazınca filtreli liste, seç → İlçe aktif, seç → kaydet → `hf_firms.city_slug/district_slug`
   doğru slug (`adana`/`seyhan`).
2. `/firmalar?city=adana` filtresi yeni eklenen firmayı getiriyor (slug uyumu çalışıyor).
3. `/hesabim/firmam` mevcut firmada il/ilçe **önseçili** geliyor.
4. Excel şablonu indir → 10 ürün doldur (2'si hatalı) → import → önizlemede "8 geçerli, 2 hatalı" →
   onayla → tabloda 8 ürün, profil sayfasında görünür.
5. Geçersiz il slug'ı (elle API) → backend `invalid_city` reddediyor.
6. Tüm sayfalar 200, typecheck temiz, mobilde dropdown + tablo kullanılabilir.

## Dosya Özeti (yeni/değişen)
**Yeni:** `frontend/src/data/turkey-cities.ts`, `lib/tr-slug.ts`, `components/ui/Combobox.tsx`,
`components/firms/owner/CityDistrictSelect.tsx`, `components/firms/owner/FirmProductsTable.tsx`,
`lib/firm-product-validation.ts`, `public/templates/firma-urun-sablonu.csv`,
`backend/src/data/turkey-city-slugs.ts`
**Değişen:** `components/firms/owner/FirmOwnerForm.tsx`, `backend/src/modules/firms/index.ts`
(bulk route + superRefine), `backend/src/modules/firms/repository.ts` (`createFirmProductsBulk`)
**Bağımlılık:** `xlsx` (SheetJS) — frontend, lazy `import()`. Root'tan `bun install` (monorepo kuralı).

## Notlar
- Şema değişikliği **yok** (mevcut `hf_firms`/`hf_firm_products` yeterli). ALTER gerekmez.
- `xlsx` eklerken **root** `package.json`/install kuralına uy (proje altında ayrı install YASAK).
- İl/ilçe dataset ileride filtre sidebar + harita için de kullanılabilir (yatay kazanım).
