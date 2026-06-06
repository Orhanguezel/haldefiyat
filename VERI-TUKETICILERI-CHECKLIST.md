# Veri Tüketicileri Checklist — API · AI Ajan · Görünüm (2026-06-06)

> **Önceki içerik** (Audit Komuta Merkezi, 28 May, %95 TAMAM) → arşivlendi:
> `docs/arsiv/audit-komuta-merkezi-checklist-TAMAM-2026-05-28.md` (3 açık madde Orhan/Faz-2).
>
> **Bu dosya:** HalDeFiyat'ı "fiyat gösteren site"den **"doğrulanabilir, ajan-dostu tarım
> fiyatı veri altyapısı"na** taşıyan tüketici-tarafı işler (API + AI ajan + görünüm).
> Üretici tarafı (ETL kaynak sağlığı, Migros backfill) → [`VERI-SAGLIGI-CHECKLIST.md`](VERI-SAGLIGI-CHECKLIST.md).
> Kaynak: 2 ChatGPT raporu (eleştirel ayıklanmış) + canlı doğrulama.
> İmplementasyon: [`docs/codex-briefs/veri-tuketicileri.md`](docs/codex-briefs/veri-tuketicileri.md).
> **Konvansiyon:** madde bitince ☑ + tarih; tüm fazlar bitince bu dosya `docs/arsiv/`'e taşınır.

> ⚠️ **ZATEN VAR — yapma, sadece doğrula/zenginleştir:** `/openapi.json` · `/api/docs/json`
> · `/llms.txt` + `/llms-full.txt` · `/api/v1/health` · CSV export · varyant infra
> (`canonical_slug`+`aliases`). Raporlar bunları "eksik" sanıyor — yanıltmasın.

---

## FAZ 1 — Güven & Tutarlılık (P0, en hızlı güven kazancı)

- [ ] **T1 · Metrik tutarsızlığı (DOĞRULANDI):** ana sayfada hem "22 il" hem "**81 İl**" geçiyor; "Son veri" ≠ "Son Güncelleme". Tek kaynaktan besle + ayır: `activeCities` (~22-23), `targetCoverage` ("81 il hedef" — çıplak "81 İl" YAZMA), `trackedProducts`, `lastSourceDate`, `lastEtlRunAt`.
- [ ] **T2 · Tazelik görünürlüğü:** her hal/ürün sayfasında "Son güncelleme **N gün önce**" rozeti (bayatsa kırmızı); **"Invalid Date" bug fix**; bugünün verisi yoksa "en son X tarihli veri gösteriliyor".
- [ ] **T3 · `GET /api/v1/prices/latest?city=&product=`** (yok, 404): "bugünkü fiyat" niyeti; veri bayatsa `warnings:[{code:"STALE_DATA", message, asOf}]`. **AI ajan için en kritik endpoint.**
- [ ] **T4 · alerts auth (GÜVENLİK):** `GET /api/v1/alerts?email=...` auth'suz 200 → tercih sızıntısı. Ownership token/oturum. + alert silmede tahmin-edilemez token.

## FAZ 2 — Provenance & Şeffaflık (P1, AI güveni)

- [ ] **T5 · Fiyat satırı provenance:** `sourceName`, `sourceUrl` (kaynak→URL map), `sourceType`, `fetchedAt`, `publishedAt`, `isFresh`/`isStale`, `isOfficialSource`, `qualityFlags`, `recordCount`. (`sourceApi`+`recordedDate`+`marketName`+`marketType` zaten var.)
- [ ] **T6 · Fiyatlar number döndür** (`min/avg/maxPrice` string değil number).
- [ ] **T7 · `/data-health` + `GET /api/v1/sources/status`:** kaynak-bazlı tablo (Kaynak·Şehir·son kaynak tarihi·son çekme·durum·satır·hata) — `hf_etl_runs`'tan. Public şeffaflık.
- [ ] **T8 · Güven etiketleri:** fiyat kartına `Resmi kaynak`/`Gecikmeli`/`Doğrulanabilir` + sabit "Toptancı hal fiyatıdır, perakende değildir".

## FAZ 3 — AI Discoverability & API Olgunluğu (P1-P2)

- [ ] **T9 · Varyant/ürün API:** `GET /api/v1/products/search?q=` + `/api/v1/products/{slug}/aliases`; response'a `rawProductName`+`canonicalProduct`+`varietySlug`. "muhtelif/ortalama" açık yaz.
- [ ] **T10 · `Dataset` structured data** (schema.org) `/hal` + `/urun` (JsonLd).
- [ ] **T11 · `/api-policy` sayfası:** "HTML scraping yasak, API serbest, 120/dk, yüksek hacim→key, atıf, cache≥5dk" + kullanım koşullarına aynı ayrım.
- [ ] **T12 · Standart error formatı** (`{error:{code,message,details,requestId}}`) + rate-limit header'ları (`X-RateLimit-Limit/Remaining/Reset`).
- [ ] **T13 · `llms.txt` zenginleştir:** `/openapi.json`, `/api-policy`, `/data-health`, lisans, atıf.
- [ ] **T14 · Tahmin disclaimer:** tahmin endpoint'ine `disclaimer` alanı. *(Model versiyonlama → DEFER.)*

## Carry-over
- [ ] **T15 · TMO tarih fix:** `tmo-alim.ts` `recordedDate` "2026-06-01" → çalışma tarihi → `/urun/bugday` & `/arpa` `range=1d`'de fiyat görünür. Sonra 1 kez ETL tetikle.

---

## ⏸️ DEFER → `MONETIZASYON-CHECKLIST` (monetizasyon KAPALI, 10K DAU tetiği)
Paket tiers (Free/Dev/Pro/Enterprise) · kurumsal API key/SLA/kota · webhook (`price.changed`) · Parquet/JSONL bulk dump · tahmin model-versiyonlama+güven aralığı · ürün-eşleştirme servisi.

## Önerilen sıra (ilk 4)
**T1** metrik (1-2 saat, en hızlı güven) → **T3** /prices/latest+STALE_DATA → **T4** alerts auth → **T5+T6** provenance+number.

## İş bölümü
- 🧠 **Claude:** kontrat/şema tasarımı, kaynak→URL map, kabul kriterleri (bu dosya + brief).
- 🛠️ **Codex:** T1-T15 implement (brief'e göre), deploy (build temiz → seed gerekmez, çoğu kod).
- 👤 **Orhan:** "81 il" karar (gerçek kapsam metni), kaynak→URL eşleme onayı, /api-policy metin onayı.
