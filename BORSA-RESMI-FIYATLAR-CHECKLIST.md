# Borsa & Resmi Fiyatlar — Hububat, Sanayi Bitkileri, Yağlı Tohum

> **Fırsat:** Hal'de satılmayan ürünler (buğday, arpa, mısır, pamuk, ayçiçeği,
> zeytin/zeytinyağı, fındık, çeltik, mercimek…) için kullanıcılar "buğday fiyatı
> 2026", "arpa kg fiyatı", "pamuk fiyatı bugün" arıyor — şu an `/urun/bugday`,
> `/urun/arpa`, `/urun/pamuk`, `/urun/zeytin` **404 dönüyor**. Bu ürünlerin
> resmi/borsa fiyat kaynakları var (TMO, Ticaret Borsaları, Bakanlık). Boşluk =
> kayıp yüksek-hacimli SEO trafiği + günlük ziyaret sebebi.
>
> **2026-06-06.** Rol: **Claude** tasarım/karar · **Codex** implement · **Orhan**
> operasyon/kaynak ortaklığı. Kanonik dosya bu (kök, git-tracked). Detay brief'ler
> `docs/codex-briefs/` (local). İlgili memory: `borsa-resmi-fiyatlar-dikeyi`.

---

## 0. Karar özeti (Orhan onayı)

| Karar | Öneri | Onay |
|---|---|---|
| Yeni tablo mu? | **Hayır** — mevcut `hf_products`+`hf_price_history`+`hf_markets` reuse | ☐ |
| Market tipi | `hf_markets.market_type` ENUM `hal\|borsa\|resmi\|kooperatif` (seed CREATE TABLE'a) | ☐ |
| Fiyat tipi taşıma | Market üzerinden (her kaynak tek tip); fiyat satırına yeni kolon YOK | ☐ |
| MVP kapsam | buğday · arpa · mısır · ayçiçeği · pamuk (5 ürün) | ☐ |
| Birincil kaynak | **TMO Günlük Piyasa Bülteni PDF** (çok-ürün, çok-borsa, resmi) + TMO alım fiyatı | ☐ |
| Bölüm/URL | `/borsa` landing + mevcut `/urun/{slug}` (kategori: hububat/yagli-tohum/sanayi-bitkisi) | ☐ |
| MCP | `hal-borsa-mcp` — fetcher'ları MCP tool olarak aç (dev + içerik + gelecek API) | ☐ |

---

## 1. Kapsam — ürün listesi (öncelik sıralı)

**Faz A (MVP):** buğday (ekmeklik+makarnalık), arpa, mısır, ayçiçeği (yağlık), pamuk (kütlü+lif)
**Faz B:** çeltik/pirinç, mercimek (kırmızı+yeşil), nohut, zeytin+zeytinyağı, soya, kanola, aspir
**Faz C:** fındık, antep fıstığı, şeker pancarı, yaş çay, çiğ süt *(bonus, çok yüksek arama)*

> Çakışma: mercimek/nohut/fasulye hal'de de olabilir → TEK ürün, iki market tipi (hal+borsa). Slug unique.

---

## 2. Resmi kaynak haritası (ARAŞTIRILDI — Orhan canlı teyit eder)

### 🥇 Birincil: TMO Günlük Piyasa ve Borsa Fiyatları Bülteni
- **URL:** `https://www.tmo.gov.tr/Upload/Document/piyasabulteni/piyasabulteni_tr.pdf`
- **Format:** PDF, günlük, **çok-ürün + çok-borsa tek dosyada** (resmi devlet derlemesi).
- **Kapsam:** hububat + yağlı tohum + bakliyat borsa fiyatları (min/max/ort, şehir/borsa bazlı).
- **ETL:** PDF parse adımı gerekir (büyük dosya, 60s+ fetch). → `responseShape: tmo_pdf_bulten`.
- **Değer:** Tek kaynaktan MVP'nin çoğu + resmi atıf. **Bunu önce çöz.**

### 🥈 TMO Resmi Alım Fiyatları (taban/devlet alımı)
- **URL:** `https://www.tmo.gov.tr/` → Güncel/Alım Fiyatları sayfası.
- **2026 teyitli değerler:** ekmeklik & makarnalık buğday **16.500 TL/ton**, arpa **12.750 TL/ton**
  (TMO satış 1 Ekim'den: buğday 18.500, arpa 14.000 TL/ton). Destek hariç.
- **Format:** statik/yıllık (hasat dönemi açıklanır) → seed/elle güncelle veya yıllık scrape.
- **Tip:** `resmi` (alım). Sayfada "TMO 2026 Alım Fiyatı" kutusu olarak vurgulanır.

### 🥉 Ticaret Borsaları (günlük serbest piyasa)
| Borsa | URL | Ürün | Erişim notu |
|---|---|---|---|
| **Polatlı TB** | `bulten.polatliborsa.org.tr/gunluk-bulten.html` | buğday/arpa/mısır | **JS-render** → Scrapling dynamic mode (altyapı hazır) |
| Polatlı TB (alt) | `polatliborsa.org.tr/tr-hububat-bulteni/` | hububat | HTML, dene |
| **İzmir TB** | `itb.org.tr/GunlukBultenler/2-pamuk-bulteni` | **pamuk** | günlük PDF + salon HTML |
| İzmir TB | `itb.org.tr/GunlukBultenler/1-tescil-bulteni` | zeytinyağı, üzüm, incir | günlük tescil PDF |
| Konya TB | `ktb.org.tr` | hububat | HTML/PDF, teyit |
| Şanlıurfa TB | — | pamuk, mısır, mercimek | teyit |
| Aydın TB | `aydinticaretborsasi.org.tr/borsa-urun-fiyatlari` | pamuk, zeytin, incir | HTML |
| Gaziantep TB | — | antep fıstığı, kırmızı mercimek | teyit |

### Diğer resmi
- **Bakanlık destekleme primi** (pamuk/ayçiçeği/soya/zeytinyağı/hububat) — Resmi Gazete tebliği, yıllık. **Tip: prim — FİYAT DEĞİL.**
- **UZZK** (uzzk.org) — zeytin/zeytinyağı tavsiye. **ÇAYKUR** — yaş çay alım. **Ulusal Süt Konseyi** (ulusalsutkonseyi.org.tr) — çiğ süt tavsiye.

> **☑ Orhan:** her satır için canlı URL + format (HTML/PDF/JS) + robots/ToS + güncelleme sıklığı teyit.
> **Atakan ağı:** borsalardan **resmi veri feed/ortaklığı** (scrape yerine) en temiz yol.

---

## 3. Fiyat tipi & doğruluk kuralları (GÜVEN = HER ŞEY)

- [ ] **3 tip ASLA karışmaz:** ① TMO alım (taban) ② Borsa serbest (günlük) ③ Destekleme primi (kg-başı ek ödeme, fiyat değil).
- [ ] Her satır **kaynak + tip + tarih** etiketli (market adı taşır: "TMO Resmi Alım", "Polatlı Ticaret Borsası", "Bakanlık Destekleme Primi").
- [ ] **Birim normalizasyonu:** borsalar genelde **TL/ton** → site TL/kg gösterir, parser çevirir, birim açıkça yazılır.
- [ ] Stale filter: sezon dışı veri "güncel" gösterilmez (>45 gün → "geçen sezon" rozeti).
- [ ] Pamuk lif USD/lb referanslıysa TL'ye çevir + notla.

---

## 4. Veri modeli & mimari (Claude → Codex)

- [ ] `hf_markets` seed SQL CREATE TABLE'ına: `market_type ENUM('hal','borsa','resmi','kooperatif') NOT NULL DEFAULT 'hal'` (**ALTER YASAK** — seed'e ekle, `db:seed:*:fresh`).
- [ ] Yeni market seed kayıtları: "TMO Resmi Alım", "TMO Piyasa Bülteni", "Polatlı Ticaret Borsası", "İzmir Ticaret Borsası", "Bakanlık Destekleme" — uygun `market_type`/`region_slug`/`source_key`.
- [ ] `hf_products` yeni kategoriler: `hububat`, `yagli-tohum`, `sanayi-bitkisi`, `bakliyat-kuru`; ürünler seo_index=1, editorial dolu.
- [ ] `listProducts`/`listPriceRows`/`listPriceRowsPage`'e opsiyonel `marketType` param (borsa sayfası sadece borsa, hal sayfası sadece hal). **Not: is_active filtresi yeni eklendi (commit ea368d04) — yeni ürünler is_active=1 olmalı.**
- [ ] Fiyat satırına yeni kolon YOK — tip market_id üzerinden.

---

## 5. ETL tasarımı

- [ ] `etl-sources.ts` RAW_SOURCES'a kayıtlar: `tmo_piyasa_bulteni` (pdf), `tmo_alim_resmi` (yıllık), `polatli_borsa` (scrapling dynamic), `izmir_borsa_pamuk` (pdf).
- [ ] Yeni `responseShape`: `tmo_pdf_bulten`, `borsa_html`, `borsa_pdf` → `parseResponse()` switch + parser fonksiyonları.
- [ ] PDF parse: TMO/İzmir bülten PDF → text → satır eşleştirme (ürün/borsa/min/max/ort/birim). PDF zorsa o kaynağı HTML veren alternatifle değiştir.
- [ ] Scrapling: Polatlı JS-render → `HF_SCRAPER_DYNAMIC` (mevcut altyapı).
- [ ] Cron: borsa günlük (mevcut `30 7 * * *`), TMO alım yıllık/manuel.
- [ ] `etl-health.sh`'e ekle (oturum-başı izleme).
- [ ] Backfill: TMO yıllık alım fiyatı serisi (CSV/elle) → "yıllara göre buğday fiyatı" grafiği = güçlü SEO.

---

## 6. MCP Planı — `hal-borsa-mcp`

> **Amaç:** Resmi fiyat kaynaklarını **MCP tool** olarak açmak — üç fayda: (1) Claude/Codex
> geliştirme + editorial içerik yazarken canlı resmi fiyatı çekebilir, (2) parser'lar tek
> yerde test edilir, (3) gelecekte public "Resmi Fiyat API" / AI asistan entegrasyonu için temel.
> Ekosistemdeki **scraper-service** (Scrapling) ile aynı desende; ayrı küçük MCP server.

**Konum:** `projects/hal-fiyatlari/mcp/` (yeni) veya scraper-service yanında.
**Transport:** stdio (Claude Code/Codex için) + opsiyonel HTTP (backend ETL çağırır).

**Araçlar (tools):**
- [ ] `tmo_alim_fiyatlari()` → güncel TMO resmi alım fiyatları (ürün, TL/ton, dönem, tip=resmi).
- [ ] `tmo_piyasa_bulteni(date?)` → günlük PDF parse edilmiş borsa fiyatları (ürün×borsa×min/max/ort).
- [ ] `borsa_gunluk(borsa, date?)` → tek borsa günlük bülteni (polatli|izmir|konya|aydin…).
- [ ] `urun_fiyat(urun, kaynak?)` → normalize edilmiş ürün fiyatı (tüm kaynaklar, etiketli).
- [ ] `kaynak_durum()` → her kaynağın son başarı/erişim sağlığı (etl-health benzeri).

**Karar:** MCP, ETL'in YERİNE geçmez — backend ETL DB'yi besler (kanonik). MCP, parser
mantığını paylaşır (kod tekrarı yok: ortak `fetcher`/parser modülü hem ETL hem MCP'den çağrılır)
ve agent/dev erişimi sağlar.

**Adımlar:**
1. [ ] Ortak parser modülü `modules/etl/sources/borsa/*` (ETL + MCP paylaşır).
2. [ ] MCP server iskeleti (`@modelcontextprotocol/sdk`, stdio).
3. [ ] 5 tool'u parser'lara bağla, JSON schema ile.
4. [ ] `.mcp.json` / Claude config'e ekle (dev erişimi).
5. [ ] Test: `tmo_piyasa_bulteni` bugünün PDF'ini doğru parse ediyor mu.

---

## 7. Frontend & SEO (Claude wireframe → Codex)

- [ ] `/borsa` landing — hububat/yağlı tohum/pamuk kartları + "bugünün borsa fiyatları" + TMO alım vurgusu.
- [ ] `/urun/{slug}` reuse, ürüne uyarlı bölümler: TMO Alım kutusu · Borsa Günlük tablosu · Destekleme Primi bilgi kutusu (ayrı) · yıllık grafik · editorial.
- [ ] Ana sayfa + `/fiyatlar`'a "Borsa/Resmi Fiyatlar" iç linki.
- [ ] **404→200:** `/urun/bugday|arpa|misir|aycicegi|pamuk` ürün eklenince otomatik dolar.
- [ ] Title: "{Ürün} Fiyatları {yıl} — Güncel TMO Alım & Borsa Fiyatı". Özgün editorial (template değil → index). Schema `Product`+tarihli `priceSpecification`+kaynak. IndexNow ping. Mevsimsel tazeleme.
- [ ] Mobil-öncelikli (trafik %78 mobil) — kart düzeni.

---

## 8. Yasal / atıf
- [ ] Her değerde kaynak adı + tarih + "resmi olmayan bilgilendirme / yatırım tavsiyesi değildir".
- [ ] TMO/Bakanlık kamu verisi — atıfla. Borsa verisi ToS/robots kontrol; ortaklık en temiz.

---

## 9. GÖREVLER

### 🧠 Claude (tasarım/karar — sonraki oturum)
- [ ] **C1.** Orhan §2 teyidinden sonra `hf_markets` seed şemasını (market_type + market kayıtları) net SQL olarak yaz.
- [ ] **C2.** TMO PDF bülten yapısını çöz (örnek PDF indir, ürün/borsa/fiyat sütun haritası) → parser sözleşmesi (input→output JSON) tanımla.
- [ ] **C3.** `/borsa` landing + `/urun/{slug}` borsa-varyant wireframe (bölüm sırası, fiyat-tipi etiketleme UI).
- [ ] **C4.** Codex brief'ini yaz: `docs/codex-briefs/borsa-resmi-fiyatlar.md` (C1–C3 çıktısıyla).
- [ ] **C5.** MCP tool şemalarını (input/output JSON schema) tanımla (§6).
- [ ] **C6.** Fiyat-tipi doğruluk kurallarını (§3) UI kabul kriteri olarak netleştir (QA checklist).

### 🛠️ Codex (implement — C4 brief'i sonrası)
- [ ] **X1.** Seed: `hf_markets.market_type` kolonu (CREATE TABLE) + market kayıtları + yeni kategoriler + MVP 5 ürün (seo_index=1, is_active=1). `db:seed:*:fresh` ile doğrula.
- [ ] **X2.** Ortak borsa parser modülü `modules/etl/sources/borsa/` — TMO alım (statik/yıllık) parser.
- [ ] **X3.** `tmo_piyasa_bulteni` PDF parser (`responseShape: tmo_pdf_bulten`) — ürün×borsa×min/max/ort/birim, TL/ton→TL/kg normalize.
- [ ] **X4.** Polatlı borsa (Scrapling dynamic) + İzmir pamuk parser.
- [ ] **X5.** `etl-sources.ts` kayıtları + `parseResponse()` switch + cron entegrasyonu + etl-health.
- [ ] **X6.** Repo katmanı: `marketType` opsiyonel param (`listProducts`/`listPriceRows`/`listPriceRowsPage`).
- [ ] **X7.** Frontend: `/borsa` landing + `/urun/{slug}` borsa bölümleri (wireframe'e göre) + iç linkler.
- [ ] **X8.** `hal-borsa-mcp` server iskeleti + 5 tool (ortak parser'a bağlı).
- [ ] **X9.** Editorial: MVP 5 ürün özgün içerik (template değil) + schema markup.
- [ ] **Doğrulama:** `/urun/bugday` 404→200, TMO alım + borsa serbest ayrı etiketli, kaynak+tarih görünür, mobil düzgün.

### 👤 Orhan (operasyon)
- [ ] **O1.** §2 kaynak URL + format + robots/ToS teyidi (önce MVP 5 ürün).
- [ ] **O2.** Atakan ile borsa/TMO **resmi veri ortaklığı/feed** görüşmesi (scrape alternatifi).
- [ ] **O3.** TMO alım fiyatı yıllık değerleri doğrula (hasat dönemi güncellenince).

---

## 10. Faz planı
| Faz | İçerik | Tahmin |
|---|---|---|
| A — MVP | 5 ürün, TMO alım + TMO piyasa bülteni + Polatlı/İzmir, `/borsa` landing | 1-2 sprint |
| B | +çeltik/bakliyat/zeytin/yağlı tohum, ek borsalar, MCP | 1-2 sprint |
| C | fındık/fıstık/şeker/çay/çiğ süt, yıllık seri backfill+grafik | mevsimsel |

---

## 11. Riskler & açık sorular
- [ ] TMO PDF parse zorluğu (büyük dosya, format değişimi) → fallback HTML kaynak.
- [ ] Fiyat tipi karışıklığı (en büyük güven riski) — §3 kabul kriteri.
- [ ] Borsa siteleri JS/PDF/robots — kaynak-bazlı strateji.
- [ ] Birim (TL/ton↔kg↔kental) normalizasyon doğruluğu.
- [ ] Bakanlık/borsa resmi feed ortaklığı mümkün mü (Atakan).
