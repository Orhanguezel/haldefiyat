# Veri Sağlığı & AI Veri Altyapısı — Master Checklist (2026-06-06)

> Kapsam: (A) çöken ETL kaynakları, (B) Migros Wayback backfill, (C) veri tazeliği/
> şeffaflık, (D) AI veri güveni/provenance, (E) güvenlik, (F) carry-over.
> Kaynaklar: ETL sağlık raporu (`etl-health.sh`) + ChatGPT "AI veri platformu"
> raporu (eleştirel ayıklanmış) + bu oturum bulguları.
> Rol: **Claude** teşhis/tasarım · **Codex** implement · **Orhan** operasyon/kaynak.

---

## 🔥 ÖNCELİK SIRASI (özet)
1. **C0 metrik tutarsızlığı** ("22 il" vs "**81 İl**" ana sayfada — DOĞRULANDI, kapsam abartısı = en hızlı güven kaybı)
2. **A5 hal_gov_tr_ulusal** (ulusal HKS — düzelirse çok il tek seferde, Mersin dahil) — en yüksek kaldıraç
3. **A1 mersin_resmi** (18 gün bayat, en büyük il 240 firma)
4. **C1-C2 tazelik görünürlüğü** (bayat veriyi "güncel" göstermeyi durdur)
5. **D3 /prices/latest + STALE_DATA warning** (AI ajan + "bugünkü fiyat" niyeti)
6. **E1 alerts auth** (gizlilik sızıntısı)
7. Gerisi sırayla.

---

## A. ETL Sağlık — Çöken Kaynaklar

> Teşhis: Mersin/Manisa VPS'ten **HTTP 000** (TLS reset/IP-block?). kütahya zaten
> Scrapling'de ama hâlâ 000 → bu belediyeler **VPS IP'sini bloklamış olabilir**
> (Scrapling/curl-cffi bile geçemez). Önce ulusal kaynağı (A5) dene.

| # | Kaynak | Durum | Kök neden | Aksiyon | Öncelik |
|---|---|---|---|---|---|
| A1 | `mersin_resmi` | error, 0 satır, **18g bayat** | socket closed (legacy) | HF_SCRAPER_SOURCES'a ekle → test; 000 sürerse IP-block → A5/alternatif | 🔴 P0 |
| A2 | `manisa_resmi` | error, 0 satır | socket closed (legacy) | HF_SCRAPER_SOURCES'a ekle → test | 🟠 P1 |
| A3 | `kutahya_resmi` | error, 0 satır | socket closed (**zaten Scrapling**) | Scrapling bile ulaşmıyor → site down/IP-block; bekle + alternatif kaynak | 🟡 P2 |
| A4 | `canakkale_resmi` | error, 0 satır | timeout (zaten Scrapling, **regresyon**) | Scrapling timeout artır / retry; site yavaş mı kontrol | 🟡 P2 |
| A5 | `hal_gov_tr_ulusal` | error, 0 satır | timeout (Aşama 3'te çözülmüştü, **regresyon**) | **Multi-step ASP.NET ViewState yeniden; çözülürse çok il kapsar** | 🔴 P0 |
| A6 | `tekirdag_resmi` | error, 0 satır | listing sayfası boş (yapı değişti) | Parser fix: yeni `/hal_fiyat_gunluk` yapısı; Wayback ile eski yapı kıyas | 🟡 P2 |
| A7 | `denizli/bursa/balikesir/yalova` | **partial** (veri GİRİYOR) | sıhhat filtresi birkaç ürünü reddediyor | Düşük: filtre işini yapıyor; tekrar eden üründe parser kolon-hizası bak | ⚪ P3 |
| A8 | `corum/kahramanmaras/trabzon` | ok ama 0 satır | kaynak yayınlamıyor (HTTP 200, 7g boş) | İzle: mevsimsel mi, kaynak durdu mu | ⚪ P3 |

**A genel notu (Orhan/Claude kararı):** Tek tek belediye scrape kırılgan. Atakan ağı
+ ulusal HKS (A5) ile **resmi feed/ortaklık** uzun vadede en sağlam çözüm (bkz. borsa
checklist Atakan maddesi). VPS IP-block hipotezi doğrulanırsa: farklı egress IP / proxy.

---

## B. Migros Wayback Backfill
- [ ] **B1.** Wayback Machine geri geldi → çalıştır:
  `ssh vps-vistainsaat 'cd .../backend && bun scripts/wayback-migros-backfill.ts --dry-run'`
  → çıktı OK ise `--dry-run` kaldır + gerçek backfill. (Detay: CLAUDE.md Aktif Hatırlatmalar)

---

## C. Veri Tazeliği, Tutarlılık & Şeffaflık (her iki ChatGPT raporu — DOĞRULANDI)
> Mersin sayfası 18 günlük veriyi "güncel" gibi gösteriyor + "Invalid Date". Güven riski.
- [ ] **C0. 🔴 Metrik tutarsızlığı (DOĞRULANDI):** ana sayfada hem "22 il" hem "**81 İl**" geçiyor; "Son veri" ile "Son Güncelleme" farklı tarihler. **Tek kaynaktan besle + ayır:** `activeCities` (gerçek=22-23), `targetCoverage` ("81 il hedef" — abartı YAZMA), `trackedProducts`, `lastSourceDate` (son kaynak tarihi), `lastEtlRunAt` (son başarılı ETL). "81 il" sadece gerçekse, yoksa "22 il aktif · 81 il hedef".
- [ ] **C1.** API + DB: `isStale`/`isFresh` hesabı (satır `recordedDate` vs o hal'in son tarihi / global anchor). Backend hesaplar, API döner.
- [ ] **C2.** UI: "Son güncelleme **N gün önce**" belirgin rozet (bayatsa kırmızı); **"Invalid Date" bug fix**; eski veri gösterirken "Bugünün verisi yok, en son X tarihli veri" notu.
- [ ] **C3.** Public veri sağlık paneli **`/data-health`**: kaynak-bazlı tablo (Kaynak · Şehir · son kaynak tarihi · son çekme · durum · satır · hata). `etl-health.sh` mantığı → sayfa. "Biz saklamıyoruz, şeffafız" sinyali.
- [ ] **C4.** Fiyat kartına güven etiketi: `Resmi kaynak` / `Gecikmeli` / `Kaynak doğrulanabilir`; sabit "Toptancı hal fiyatıdır, perakende değildir" uyarısı.

---

## D. AI Veri Güveni / Provenance (ChatGPT raporu — eleştirel ayıklanmış)

> ⚠️ Rapor "eksik" dediklerinin bir kısmı **ZATEN VAR** (yanıltmasın):
> - **OpenAPI VAR** (`/openapi.json`, `/api/docs/json` 200) — yapma, sadece doğrula/linkle.
> - **llms.txt VAR** (`/llms.txt` 200) — yapma, **zenginleştir** (API+lisans+önemli sayfa).
> - **Varyant infra VAR** (`canonical_slug`+`aliases`) — API'de daha görünür yap.

**Gerçekten eksik (DOĞRULANDI) + ucuz + AI-talebine uygun** *(trafik: AI crawler 3,5× Googlebot)*:
- [ ] **D1.** Fiyat API satırına ekle: `sourceName`, `sourceUrl` (kaynak→URL map), `sourceType` (municipality/borsa/resmi), `fetchedAt`, `publishedAt`, `isFresh`/`isStale`, `isOfficialSource`, `qualityFlags`, `recordCount`. (`sourceApi`+`recordedDate`+`marketName`+`marketType` zaten var.)
- [ ] **D2.** Fiyatları **string değil number** döndür (`minPrice`/`avgPrice`/`maxPrice`) — BI/pipeline/AI için. *(meta'da `hasMore` zaten var.)*
- [ ] **D3.** **`/api/v1/prices/latest?city=&product=`** endpoint (DOĞRULANDI 404 — yok). "Bugünkü fiyat" niyeti; bugünün verisi yoksa `warnings:[{code:"STALE_DATA",message:"... en son X tarihli"}]` döndür. **AI ajan için en kritik endpoint.** → **D6 ile aynı, P0.**
- [ ] **D4.** **`/api/v1/sources/status`** endpoint (DOĞRULANDI 404) → `/data-health` (C3) panelini besler: sourceId, sourceName, city, status, lastSourceDate, lastFetchedAt, rowsInserted, rowsRejected, errorMessage.
- [ ] **D5.** Varyant/ürün sözlüğü endpoint: **`/api/v1/products/search?q=`** + **`/api/v1/products/{slug}/aliases`**. API'de `rawProductName` + `canonicalProduct` + `varietySlug` + `normalizationConfidence` ayrımı (infra `canonical_slug`+`aliases` var → response'a ve endpoint'e taşı). "Domates muhtelif/ortalama" olduğunu açık yaz.
- [ ] **D7.** `Dataset` structured data (schema.org) `/hal` + `/urun` — AI + Google için güçlü.
- [ ] **D8.** **`/api-policy` sayfası:** "HTML scraping yasak, belgelenmiş API serbest, 120/dk, yüksek hacim→API key, atıf formatı, cache≥5dk". + kullanım koşullarına aynı ayrım (rapor haklı: çelişki var). llms.txt'ten linkle.
- [ ] **D9.** Standart **error formatı** (`{error:{code,message,details,requestId}}`) tüm endpoint'lerde + **rate-limit header'ları** (`X-RateLimit-Limit/Remaining/Reset`).
- [ ] **D10.** `llms.txt` **zenginleştir**: `/openapi.json`, `/api-policy`, `/data-health`, lisans (CC BY 4.0 kapsamı), "API kullan, HTML scrape etme", atıf. *(llms.txt + openapi.json + /api/v1/health ZATEN VAR — sadece içerik+link.)*

---

## E. Güvenlik
- [ ] **E1.** `GET /api/v1/alerts?email=...` **auth'suz 200 dönüyor** → herhangi bir e-postanın uyarı tercihleri sızar (enumeration). Ownership token / oturum şartı ekle. *(Bkz. memory signup-default-admin-vuln pattern.)*
- [ ] **E2.** Alert silme: tahmin-edilemez token + sahiplik kontrolü.
- [ ] **E3.** Rate limit IP/API-key/kullanıcı bazlı (sadece dakika değil); CSV export kota+cache.

---

## F. Carry-over (önceki oturum)
- [ ] **F1.** `tmo-alim.ts` `recordedDate` hard-coded `"2026-06-01"` → **çalışma tarihi** yap (günlük cron güncel damgalar) → `/urun/bugday` & `/arpa` `range=1d` penceresinde fiyat görünür. Sonra 1 kez ETL tetikle.
- [x] **F2.** `hf_firms.seo_index` kolonu canlıya eklendi (bu oturum additive migration). Firma index-flip mantığı ileride (firma-seo.md F5).
- [ ] **F3.** Firma hub'ları + borsa: canlı doğrulama izleme (Codex deploy etti, EK A kısıtları çözüldü).

---

## ⏸️ DEFER — Monetizasyon Faz 4+ (ŞİMDİ DEĞİL)
> Memory `MONETIZASYON-CHECKLIST`: monetizasyon KAPALI, mükemmelleştirme fazı. 10K DAU tetiğinde aç.

- Paket tiers (Free/Developer/Pro/Enterprise) + kurumsal API key + SLA + kota.
- Webhook (`price.changed` — "Mersin domates %10 düştü") · Parquet/JSONL bulk günlük dump.
- Tahmin endpoint zenginleştirme (model versiyonu, eğitim aralığı, güven aralığı, disclaimer) — **ama disclaimer'ı şimdi ekle (ucuz/güven)**, model-versiyonlama ertelenir.
- Ürün-eşleştirme servisi (ticari).
→ `MONETIZASYON-CHECKLIST`'e taşı.

---

## ⏭️ SKIP / minor
fiyat number-vs-string (kozmetik) · recordCount · "Sayfa hazırlanıyor" placeholder (crawler görünümü — kontrol et, küçük).

---

## Görev ayrımı
- **🧠 Claude:** A5/A1 ETL teşhis derinleştir · C1-C4 + D1-D5 tasarım/sözleşme · Codex brief.
- **🛠️ Codex:** A6 parser fix · B1 backfill · C/D/E/F implement (brief sonrası).
- **👤 Orhan:** VPS IP-block doğrula (mersin/manisa proxy?) · Atakan HKS/borsa feed ortaklığı · kaynak teyit.

## Sonraki somut adım
1. **C0** metrik tutarsızlığı ("81 İl" abartısı) — hızlı, en yüksek güven kazancı (frontend metin/veri tekilleştirme).
2. **A5** `hal_gov_tr_ulusal` neden timeout (Scrapling multi-step regresyon) — teşhis. Düzelirse Mersin dahil çok il döner.
3. Paralel: **A1** mersin'i Scrapling'e taşıyıp test (000 sürerse IP-block kesinleşir).
4. **D3** `/prices/latest` + STALE_DATA (AI ajan niyeti) ve **F1** TMO tarih fix (hızlı kazançlar).

> İmplementasyon Codex'e brief'lenecek (C0/C1-C4 + D1-D10 + E1-E3). A5/A1 ETL teşhisi Claude+Orhan; A6 parser Codex; B1 backfill Codex.
