# Veri Sağlığı — ETL Üretici Tarafı Checklist (2026-06-06)

> Kapsam (**üretici/kaynak tarafı**): (A) çöken ETL kaynakları, (B) Migros Wayback backfill, (F) carry-over.
> **Tüketici tarafı** (API/AI/görünüm/güvenlik) → [`VERI-TUKETICILERI-CHECKLIST.md`](VERI-TUKETICILERI-CHECKLIST.md).
> Kaynak: `etl-health.sh` raporu + bu oturum bulguları. Rol: **Claude** teşhis · **Codex** implement · **Orhan** operasyon/kaynak.

---

## 🔥 ÖNCELİK SIRASI (üretici tarafı — bu dosya)
1. **A5 hal_gov_tr_ulusal** (ulusal HKS — düzelirse çok il tek seferde, Mersin dahil) — en yüksek kaldıraç
2. **A1 mersin_resmi** (18 gün bayat, en büyük il 240 firma)
3. **A2/A6** manisa + tekirdağ parser
4. **B1** Migros backfill

> Tüketici tarafı önceliği (metrik tutarsızlığı, tazelik, /prices/latest, alerts auth)
> → `VERI-TUKETICILERI-CHECKLIST.md` (T1-T15).

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

## C/D/E. Tüketici-tarafı (API · AI · görünüm · güvenlik) → AYRI DOSYA
> Metrik tutarsızlığı, tazelik görünürlüğü, `/prices/latest`, provenance alanları,
> `/data-health`, varyant API, `/api-policy`, error format, llms.txt, alerts auth —
> hepsi **[`VERI-TUKETICILERI-CHECKLIST.md`](VERI-TUKETICILERI-CHECKLIST.md)** (T1-T15) +
> brief [`docs/codex-briefs/veri-tuketicileri.md`](docs/codex-briefs/veri-tuketicileri.md).
> Bu dosya yalnızca **üretici tarafı** (ETL kaynak sağlığı A + Migros backfill B).

---

## F. Carry-over (önceki oturum)
- [ ] **F1.** `tmo-alim.ts` `recordedDate` hard-coded `"2026-06-01"` → **çalışma tarihi** yap (günlük cron güncel damgalar) → `/urun/bugday` & `/arpa` `range=1d` penceresinde fiyat görünür. Sonra 1 kez ETL tetikle.
- [x] **F2.** `hf_firms.seo_index` kolonu canlıya eklendi (bu oturum additive migration). Firma index-flip mantığı ileride (firma-seo.md F5).
- [ ] **F3.** Firma hub'ları + borsa: canlı doğrulama izleme (Codex deploy etti, EK A kısıtları çözüldü).

---

## Görev ayrımı (üretici tarafı)
- **🧠 Claude:** A5/A1 ETL teşhis derinleştir (ulusal HKS, IP-block hipotezi).
- **🛠️ Codex:** A6 tekirdağ parser fix · B1 Migros backfill.
- **👤 Orhan:** VPS IP-block doğrula (mersin/manisa proxy?) · Atakan HKS/borsa feed ortaklığı · kaynak teyit.

> Tüketici-tarafı (API/AI/görünüm) görev ayrımı + DEFER (monetizasyon) → `VERI-TUKETICILERI-CHECKLIST.md`.

## Sonraki somut adım (üretici)
1. **A5** `hal_gov_tr_ulusal` neden timeout (Scrapling multi-step regresyon) — teşhis. Düzelirse Mersin dahil çok il döner.
2. Paralel: **A1** mersin'i Scrapling'e taşıyıp test (000 sürerse IP-block kesinleşir).
3. **B1** Migros wayback backfill.
