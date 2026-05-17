# HaldeFiyat — Proje Notlari ve Kalan Isler

**Son guncelleme:** 2026-05-14  
**Amac:** Bu dosya tek yasayan roadmap/proje hafizasi dosyasidir. Eski `GEO-EKSIKLER-CEKLIST.md`, `EKOSISTEM-PLAN.md`, `GOREV-PLANI-2026-04-24.md`, `WIDGET-PLUGIN-NOTE.md` ve `analitics.md` icerikleri buraya tasindi/ozetlendi.

---

## Canli ve Operasyon

- Canli servis: `vps-vistainsaat`
- SSH: `ssh vps-vistainsaat`
- Canli proje yolu: `/var/www/tarim-dijital-ekosistem/projects/hal-fiyatlari`
- Lokal proje yolu: `/home/orhan/Documents/Projeler/tarim-dijital-ekosistem/projects/hal-fiyatlari`
- Frontend port: `3033`
- Backend port: `8088`
- Admin panel port: `3031`
- Deploy standardi: local duzeltme → canli yola kopyala → ilgili app build → PM2 reload.

### Analytics

- GA4 Measurement ID: `G-FJ8MX7VNEP`
- Stream name: `haldefiyat`
- Stream URL: `https://haldefiyat.com/`
- Stream ID: `14866553005`

---

## Ekosistem Rolu

HaldeFiyat ekosistemin gunluk ziyaret sebebidir: uretici, halci, medya, arastirmaci ve tuketici fiyat takibi icin duzenli gelir. Platformun ana rolu resmi hal verisini temizleyip fiyat, analiz, API, widget ve PR kanallariyla yaymaktir.

### Baglanti Noktalari

- Ziraat haber portali: haftalik fiyat ozeti ve haber onerisi.
- Maliyet analizi: satis fiyati referansi.
- Verim/tahmin modulleri: fiyat trendi girdisi.
- B2B pazaryeri: piyasa benchmark ve cross-link.
- Bereketfide/VistaSeed/Tarim Ansiklopedisi: urun sayfalarindan linklenebilir ekosistem trafigi.
- TarimIklim: hava → fiyat korelasyonu; ileride hava widget/native component entegrasyonu.

### TarimIklim Widget Notu

- Ortak paket: `@agro/ecosystem-weather-widget`
- Kaynak: `packages/ecosystem-weather-widget`
- HaldeFiyat brand: `haldefiyat`
- `apiBase`: `https://tarimiklim.com/api/v1`
- Simdilik iframe embed yeterli; native component istenirse bu paket referans alinacak.

---

## Tamamlanan Ana Isler

### Teknik SEO ve GEO

- JSON-LD: Organization, WebSite, Dataset, Product, Place, PriceSpecification, FAQPage, BreadcrumbList, DataCatalog.
- Dinamik sitemap, image entries, IndexNow, canonical audit.
- `llms.txt` ve `llms-full.txt`.
- OG/Twitter card, meta description sablonlari.
- CCBot/AI crawler robots kararlari.
- Hakkimizda, metodoloji, urun/hal editoryal icerikleri.

### Veri ve Fiyat Altyapisi

- `hf_markets`, `hf_products`, `hf_price_history`, `hf_alerts`, `hf_etl_runs`.
- Resmi hal ETL kaynaklari, normalizasyon, gunluk cron.
- Fiyat tablo, urun detay, hal detay, karsilastirma, favoriler.
- CSV export: `GET /api/v1/prices/export`.
- `changePct` guvenlik filtreleri sikilastirildi.
- Buyuk range sorgulari icin nginx timeout 180s.

### Harita, Widget, Telegram

- #34 Turkiye fiyat haritasi tamamlandi:
  - `GET /api/v1/prices/city-map`
  - `/harita`, `/hal` ve anasayfa harita sekmesi
  - 81 il SVG, fiyat skalasi, il detayi
- #41 Embed widget tamamlandi:
  - `/fiyatlar/widget`
  - `/embed`
  - `theme`, `category`, `limit`, `slugs`, `title`
- #29 Telegram bot tamamlandi:
  - Bot: `@haldefiyat_fiyat_bot`
  - Webhook: `/api/v1/telegram/webhook`
  - `/start`, `/yardim`, `/trending`, urun sorgulari, serbest metin alias eslesmesi

### Analiz ve Google News Zemini

- `/analiz` ve `/analiz/[slug]` standart wrapper layout.
- Haftalik otomatik analiz:
  - `hf_analysis_reports`
  - Cron: `weekly-analysis`
  - Public API sadece `published` raporlari gosterir.
  - Admin: `/admin/analysis-reports`
- Google Publisher Center icin: `/analiz` altinda en az 5 yayin gerekiyor.

### PR / Basin Altyapisi (#38)

- DB:
  - `hf_press_contacts`
  - `hf_press_campaigns`
  - `hf_press_outreach_logs`
- Admin: `/admin/press`
  - medya listesi
  - kampanya olusturma
  - mailto ile manuel gonderim
  - gonderildi/cevap/yayin loglama
  - CSV import/export
  - kurum arama, durum/yayin tipi filtreleri
  - yayin linki kaydi
- Public medya kiti: `/basin`
- Ilk medya listesi:
  - `docs/press/haldefiyat-press-contacts-initial.csv`
- Email template seed:
  - `press_release_launch`
  - `annual_report_release`
  - `weekly_index_story_pitch`
- Template render:
  - `press_url`, `analysis_url`, `api_docs_url`, `index_url`, `report_url`, `week_title`
  - Son yayinlanan analiz otomatik secilir; yoksa `/analiz` fallback.

### Yillik Rapor (#39)

- `/rapor/yillik/2025`
- `GET /api/v1/reports/annual?year=YYYY`
- Print-to-PDF uyumlu frontend.
- Opsiyonel gelecek adim: Puppeteer/React-PDF ile statik PDF generation.

### UFE/TUFE (#35)

- Tablo: `hf_inflation_monthly`
- Public:
  - `GET /api/v1/inflation/latest`
  - `GET /api/v1/inflation?months=N`
- Admin:
  - `POST /admin/inflation/sync`
  - `POST /admin/inflation/manual`
- Not: EVDS v3 otomasyonu su an net degil; aylik manuel giris pratik yol.
- Bekleyen: urun sayfalarinda TUFE/UFE karsilastirma rozeti.

### API ve Pro Tier (#56-58)

- API key altyapisi:
  - `hf_api_keys`
  - `X-API-Key`
  - free/pro limitleri
  - `GET /api/v1/keys/plans`
  - kullanici key CRUD
  - admin key liste/tier update
- `/pro` sayfasi yayinda.
- Bekleyen:
  - admin API key UI
  - kullanici dashboard "Anahtarlarim"
  - odeme entegrasyonu

---

## Aktif Bekleyenler

### 1. Kampanya Detay/Edit Ekrani

Durum: PR altyapisi MVP tamam, kampanya olusturma var.  
Sonraki adim:

- `/admin/press` icinde secili kampanyayi sonradan duzenleme.
- Kampanya durumunu `draft/active/completed/archived` yapma.
- Mevcut kampanya pitch/subject alanlarini yeniden template ile guncelleme.
- Kampanya loglari icin yayin linki duzenleme.

### 2. Google News / Publisher Center

Kosul:

- `/analiz` altinda 5+ yayin.
- Yazar, tarih, schema, duzenli editoriyal akis.

Yapilacak:

- En az 5 haftalik raporu admin onayiyla yayinla.
- Publisher Center basvurusu.
- `/basin` ve PR kampanyasinda analiz linklerini kullan.

### 3. Newsletter

Durum:

- Haftalik e-bulten backend kodu hazir.
- SMTP credentials ve ilk dogrulanmis abone bekleniyor.

Gerekli ayarlar:

```sql
INSERT INTO site_settings (id, `key`, value, locale) VALUES
  (UUID(), 'smtp_host', '...', '*'),
  (UUID(), 'smtp_port', '587', '*'),
  (UUID(), 'smtp_username', '...', '*'),
  (UUID(), 'smtp_password', '...', '*'),
  (UUID(), 'smtp_from_email', 'noreply@haldefiyat.com', '*'),
  (UUID(), 'smtp_from_name', 'HalDeFiyat', '*');
```

Test endpoint:

```http
POST /api/v1/admin/hal/newsletter/weekly-mail/test
```

### 4. SSO ve Kullanici Hesabi

- `registerAuth` shared-backend'de hazir.
- `hf_user_favorites` auth kullaniciya baglanacak.
- Bereketfide / VistaSeed ile ortak hesap hedefi.

### 5. API Key UI

- Admin panelde API key listesi ve free/pro tier toggle.
- Kullanici dashboard'da key olusturma, revoke, kullanim goruntuleme.

---

## Tedarik Zinciri Faz 2

Oncelik: hal pipeline saglam → market → pazar/crowd.

### Market Zinciri

- #64 BİM haftalik brosur PDF scraper.
- #65 A101 haftalik brosur PDF scraper.
- #66 CarrefourSA online scraper.
- #67 ŞOK/A101 online scraper.
- #68 Migros Sanal Market genis scraper.

Notlar:

- Migros sebze/meyve kismi calisiyor.
- `hf_retail_prices` ayri tablo oldugu icin eski `source_type` gorevi gereksiz.
- Scraping yasal cerceve: robots.txt'e uy, 1 req/sn max, gece tara, user-agent belirt.

### UI

- #69 `/karsilastir`: ayni urun icin hal, BIM, Migros, CarrefourSA yan yana.
- #70 waterfall chart: Hal → Pazar → Market.

### Pazar Fiyatlari + Crowd + OCR (#71-74)

Durum: Faz 2 / pilot. Direkt OCR'a girme; once dogrulanabilir manuel veri akisi.

- Belediye pazar raporlari: duzensiz kaynaklar, scraper + manuel kaynak tanimi.
- Crowd-sourcing MVP: GPS/ilce/pazar, urun, fiyat, birim, opsiyonel foto.
- Moderasyon: `pending/verified/rejected`; 3+ kullanici ayni pazar+urun+gun bandinda girerse verified.
- Pazar tabelasi OCR: form yardimcisi, kullanici onayi sart.
- Fis OCR: Google Vision API veya Claude API; KVKK icin ham gorsel kisa sure veya anonim.
- Admin ihtiyaci: `/admin/pazar-contributions`.

### Partnership

- IBB/ABB/IzBB: acik veri + dashboard teklifi.
- Ticaret Bakanligi: kamu yararina seffaflik platformu basvurusu.

---

## Eski Faz Planindan Tasindigi Kadariyla Notlar

Bu bolum eski `GOREV-PLANI-2026-04-24.md` dosyasinin gerekli kalan kisimlaridir.

- Don riski banner'i hardcoded sehir listesinden aktif market sehirlerine gecirilebilir.
- Backfill ETL icin tarih araligi CLI scripti faydali olur:
  - `bun run etl:backfill --source=kayseri_resmi --from=2024-01-01 --to=2025-12-31`
- TarimIklim hava snapshot fikri:
  - `hf_weather_observations`
  - fiyat tahmininde hava feature'lari
- Forecast V1:
  - gecen yil ayni hafta ortalamasi + son 30 gun trend
  - confidence: low/medium/high
- Maliyet simulatoru:
  - alan, verim, maliyet kalemleri, satis fiyati
  - net kar, basabas fiyat, kar marji
- Reklam:
  - `ads.txt` placeholder gerekirse eklenebilir.
  - AdSense aktif olursa 3 slot: anasayfa hero alti, fiyatlar filtre alti, urun grafik alti.

---

## Rakip Konumlama

Agrimetre:

- B2B/makro tarim datasi, abonelikli.
- Hal verisi premium arkasinda.

HaldeFiyat:

- Hal fiyatlari, B2C + kucuk uretici/esnaf.
- Ucretsiz, gercek zamanli, modern UX.
- API, widget, analiz ve medya kitiyle alintilanabilirlik avantaji.

Ustun alanlar:

1. Ucretsiz hal verisi.
2. Gunluk guncelleme.
3. Mobil-first UX.
4. Embed/API ile dagitim.
5. `/analiz` ve `/basin` ile GEO/PR sinyali.

---

## Dosya Politikasi

- Bu dosya ana roadmap/proje hafizasidir.
- `AGENTS.md` sadece ajan/ortam talimati icin kalir.
- Eski buyuk plan/ceklist dosyalari tekrar olusturulmamali; yeni notlar buraya eklenmeli.
