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

> **🔬 KÖK NEDEN DOĞRULANDI (2026-06-06, local scraper testleriyle):**
> - **mersin/manisa/kütahya:** belediye siteleri **Türk Telekom "Altosec" ulusal WAF** arkasında.
>   curl-cffi → connection reset; **gerçek Chromium (dynamic) → 403 Access Denied** ("Source ip: ...datacenter").
>   = **datacenter IP bloku.** Ne TLS-taklit ne gerçek tarayıcı çözer. **Scraper'ı vps-vistainsaat'a
>   taşımak çözmedi** (o da datacenter IP). **TEK ÇÖZÜM: Türk residential proxy.**
> - **hal.gov.tr (ulusal HKS):** **WAF YOK, proxy YOK** — local scraper **dynamic mode 6s'de 200 + 67KB**.
>   ✅ Erişim sağlam. Veri için multi-step ASP.NET form (il+ürün seç → "Göster" POST) gerekiyor;
>   mevcut fetcher curl-cffi **fast mode**'da timeout. **= en yüksek öncelikli proxy'siz "kenarından dolaşma".**
> - Local scraper: vps-vistainsaat:8201 (proje `hal-scraper`), WAF'sız kaynaklarda doğrulandı (antalya 12 satır).

| # | Kaynak | Kök neden (DOĞRULANDI) | Aksiyon | Öncelik |
|---|---|---|---|---|
| A5 | `hal_gov_tr_ulusal` | ✅ **ÇÖZÜLDÜ 2026-06-06** | **Timeout = UZAK scraper yükü/network'tü. Local scraper (8201) ile multi-step GET 3.2s+POST 3.2s → ETL 431 insert, DB'de 257 satır bugün.** Kod değişikliği YOK. *(Not: ulusal ortalama; Mersin-spesifik için il-seçimli HKS query veya proxy.)* | ✅ TAMAM |
| A1 | `mersin_resmi` (18g bayat) | **TT Altosec WAF, 403, datacenter IP bloku** | **Residential TR proxy** şart (belediye doğrudan); ya da A5 ile dolaylı | 🔴 P0 (proxy bekliyor) |
| A2 | `manisa_resmi` | aynı WAF deseni (muhtemel) | Residential proxy ile test; ya da A5 | 🟠 P1 |
| A3 | `kutahya_resmi` | aynı WAF (Scrapling'de bile 000) | Residential proxy; ya da A5 | 🟡 P2 |
| A4 | `canakkale_resmi` | **SITE-side timeout** (local scraper'la bile timeout → scraper değil, site yavaş/down) | Fetcher Scrapling timeout'u artır (30s→90s) + dynamic mode; site geri gelince düzelir | 🟡 P2 |
| A6 | `tekirdag_resmi` | listing boş (yapı değişti) | Parser fix; Wayback ile eski yapı kıyas | 🟡 P2 |
| A7 | `denizli/bursa/balikesir/yalova` | **partial** (veri GİRİYOR) | Düşük: filtre çalışıyor; parser kolon-hizası bak | ⚪ P3 |
| A8 | `corum/kahramanmaras/trabzon` | ok ama 0 satır (kaynak yayınlamıyor) | İzle: mevsimsel mi | ⚪ P3 |

**A genel strateji (DOĞRULANDI):**
1. **✅ hal.gov.tr (A5) ÇÖZÜLDÜ** — local scraper migration timeout'u düzeltti (257 satır/gün, proxy'siz, WAF'sız). **Local scraper'ın somut faydası bu.**
   - **❌ İl-spesifik HKS YOK (denendi):** FiyatDetaylari **ulusal-only** (il/hal select yok); Toptanci-Halleri sadece hal **dizini** (adres, fiyat değil). Yani **Mersin-spesifik fiyat hal.gov.tr'de mevcut değil** → il-kırılım için **proxy/belediye TEK yol** (kesinleşti).
2. **🥈 Residential TR proxy** — TT-WAF'lı belediyeler (mersin/manisa/kütahya) için TEK yol.
   *Bekliyor:* provider + credential + "API kodu" + **fayda netleşmesi** (kaç kaynak açılır, maliyet/değer).
   Scraper main branch'inde residential proxy desteği VAR (`PROXY_URL` env boş). **Not:** hal.gov.tr ulusal veriyi zaten getiriyor → belediye proxy'sinin marjinal faydası = sadece il-spesifik kırılım.
3. **🥉 Atakan ağı** — resmi HKS/borsa feed ortaklığı (uzun vade, scrape'siz).
4. Diğer Scrapling timeout kaynakları (canakkale vb.) de local scraper'la tekrar test edilmeli — aynı düzelme olabilir.

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
