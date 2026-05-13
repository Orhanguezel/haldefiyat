# Hal Fiyatlari — Kalan Isler (Sonraki Oturum)

**Son guncelleme:** 2026-05-13 (oturum 7 sonu)
**Ana referans:** `EKOSISTEM-PLAN.md` + `GEO-EKSIKLER-CEKLIST.md`

> Bu dosya bir sonraki oturumda hizli baslangic icin hazirlandi. Tum acik
> isler kategori + oncelik + somut ilk adim ile listelendi. `#N` numaralari
> `GEO-EKSIKLER-CEKLIST.md`'ye referans verir.

---

## 🎯 Hizli Baslangic (sonraki oturum)

Onerilen sira (kullanici acik tercihe gore degisebilir):

1. **#60** — Fiyat artis/azalis % hesabi dogrulama (dis API'ye yanlis veri yayma riski)
2. **#62** — Competitor-monitor admin panel UI sayfasi
3. **#34** — Turkiye interaktif fiyat haritasi (SVG, il bazinda)
4. **#41** — Embed widget iframe (backlink kaynagi)

---

## 🔴 Kritik / Kolay

### #60 — changePct hesaplamasi denetle
- **Risk:** `/api/v1/prices/trending` `changePct` field'i dis sitelere yayinlaniyor (widget API).
  Bug varsa ekosistem yanlis veri pazarliyor.
- **Yer:** `backend/src/modules/prices/repository.ts` → `trendingChanges` + `widgetPrices`
- **Ilk adim:**
  1. `trendingChanges` icinde latestWindow / prevWindow / fallbackPrev mantigini izle
  2. `widgetPrices` icin 7g change + 365g change mantigini izle
  3. Birkac urun icin elle hesaplama dogrula
  4. Edge case'ler: prev=0, null, NaN, outlier (zaten %150 cap var)
  5. Test: domates, kiraz, salatalik icin known data ile dogrula

### #62 — Competitor-monitor admin panel sayfasi
- **Backend hazir:** `GET /api/v1/admin/competitor-monitor/sites`
- **Eksik:** `admin_panel/src/app/.../competitor-monitor/page.tsx` UI
- **Ilk adim:**
  1. Admin panel'de yeni route ekle
  2. Sites tablosu + son snapshot + manuel "Calistir" butonu
  3. Diff summary'leri timeline goster (snapshot karsilastirmasi)

---

## 🟠 Yuksek Deger / Orta Efor

### #34 — Turkiye interaktif fiyat haritasi
- 81 il, SVG harita (D3 veya React-leaflet)
- Il tikla → o ildeki hal'lerin son fiyat ortalamasi
- Renk skalasi: ucuz (yesil) → pahali (kirmizi)
- **Etki:** gorsel paylasim degeri (sosyal medya, GEO sinyali)
- **Veri:** mevcut `hf_markets.city_name` + son fiyat history

### #41 — Embed widget iframe
- Backend zaten var: `GET /api/v1/prices/widget` (CORS *, 5dk cache)
- Eksik: `<iframe>` HTML kodu + dokuman sayfasi (`/embed`)
- Site sahipleri iframe yapistirip kendi sitelerinde widget gosterebilir
- **Etki:** backlink kaynagi, brand awareness

### #29 — Telegram interactive bot
- Kanal cron var (`channelPublishSchedule`) — günlük rapor yayinliyor
- **Eksik:** Kullanici `/domates` yazar → bot o gunun min/ort/maks fiyatini DM eder
- node-telegram-bot-api veya grammy ile webhook
- Komutlar: `/domates`, `/trending`, `/yardim`

### #53-55 — `/analiz` haftalik otomatik yazi + Google Publisher Center
- `lib/analiz.ts` mevcut makale verisi (static)
- Eksik: her Pazartesi otomatik yazi olusturma (ETL verisiyle template)
- 5+ yayin sonra Google Publisher Center basvurusu
- LLM kullanilirsa Groq/OpenAI (~₺0.20/yazi)

---

## 🟡 Orta Efor / Stratejik

### #35 — UFE/TUFE entegrasyonu
- TUIK API veya TCMB EVDS'den enflasyon verisi cek
- Urun sayfasinda "X fiyat artisi (5+%) — TUFE %3 araliginda" gibi etiket
- Cron: aylik UFE/TUFE update

### #56-58 — API rate limiting + Pro tier
- Free: 100 req/gun/IP (nginx `limit_req_zone` veya fastify-rate-limit)
- Pro: API key ile sinirsiz, 99 TL/ay
- Users tablosuna `api_key` kolon + `/api/v1/keys` endpoint
- `/pro` fiyatlandirma sayfasi

### #39 — Yillik fiyat raporu PDF
- "Turkiye Hal Fiyatlari 2025 Yillik Raporu"
- Top mover'lar, sezon trendleri, sehir karsilastirmasi
- Puppeteer veya React-PDF
- Tarim yayinlarina + gazetelere gondermek icin

### #42 — Ekosistem SSO
- `registerAuth` shared-backend'de hazir
- `hf_user_favorites` seed'e ekle, `registerAuth` aktif et
- Bereketfide / VistaSeed ile ortak kullanici hesabi

---

## 🔵 Tedarik Zinciri (Faz 2 — kullanici istediginde)

### #63 — ESKIYDI: source_type kolonu (artik gerek yok)
- ✅ `hf_retail_prices` ayri tablo acildi (bc04b21)
- Bu gorev silinebilir veya "EKOSISTEM-PLAN'da silindi" notu konabilir

### #64-65 — BIM + A101 haftalik brosur PDF scraper
- bim.com.tr/Categories/643/aktuel-urunler.aspx → PDF link
- a101.com.tr/aktuel-urunler → PDF link
- `pdf-parse` veya LLM ile urun-fiyat cikar
- **Zorluk:** Kolay (PDF format genelde sabit)

### #66-67 — CarrefourSA + SOK online
- Playwright + scraper-service `dynamic: true`
- Lokasyon bazli fiyatlandirma (gece tarama, 1 req/sn)
- Migros pattern'i kuruldu (`market-scrapers/migros.ts`) — sablon olarak kullan

### #68 — Migros Sanal Market (cesitli URL)
- Şu an sebze-meyve-c-2'den 46 urun
- Sanal market `sanalmarket.migros.com.tr` daha kapsamli kategori sunabilir
- JS-heavy + Cloudflare

### #69-70 — "Hal vs Market" UI
- `/karsilastir` sayfasi: aynı urun icin hal, BIM, Migros, CarrefourSA yan yana
- Waterfall chart: Hal ₺25 → Pazar ₺45 → Migros ₺72 → CarrefourSA ₺68 → BIM ₺55
- recharts veya D3

### #71-74 — Pazar fiyatlari + crowd-sourcing + OCR
- Belediye pazar raporlari (duzensiz)
- Kullanici mobil app ile fiyat ekleme
- Fis OCR (Google Vision API veya Claude API)

### #75-76 — Belediye/Bakanlik partnership
- IBB/ABB/IzBB: acik veri + dashboard teklifi
- Ticaret Bakanligi: kamu yararina seffaflik platformu basvurusu

---

## ⏳ Bekleyen (Kullanici Aksiyonu)

### SMTP credentials
- **Etki:** Haftalik e-bulten icin sart
- **Yer:** `site_settings` tablosuna SMTP key'leri:
  ```sql
  INSERT INTO site_settings (id, `key`, value, locale) VALUES
    (UUID(), 'smtp_host', '...', '*'),
    (UUID(), 'smtp_port', '587', '*'),
    (UUID(), 'smtp_username', '...', '*'),
    (UUID(), 'smtp_password', '...', '*'),
    (UUID(), 'smtp_from_email', 'noreply@haldefiyat.com', '*'),
    (UUID(), 'smtp_from_name', 'HalDeFiyat', '*');
  ```
- Yerel admin panelden de eklenebilir (`/admin/site-settings`)
- Test: `POST /admin/hal/newsletter/weekly-mail/test {"to":"x@y.com"}`

### Newsletter abonesi
- Frontend CtaNewsletter widget'i mevcut — kayit akisi calisiyor mu kontrol et
- `is_verified=1` ve `unsubscribed_at IS NULL` filtresi cron'da uygulaniyor
- Ilk abone gelene kadar mail kimseye gitmiyor

### Wayback Machine — Migros tarihce backfill
- **Durum:** Internet Archive 2026-05-13 itibariyla offline (cyberattack sonrasi)
- **Hazir:** `backend/scripts/wayback-migros-backfill.ts`
- **Otomatik:** `wayback-monitor` cron 6 saatte bir probe ediyor → online'a gectiginde Telegram bildirim
- Bildirim gelince: `bun scripts/wayback-migros-backfill.ts --dry-run` → cikti OK ise `--dry-run` kaldir

### Google News basvurusu (#37, #55)
- `/analiz` path'inde 5+ yayin gerek
- Sonra Google Publisher Center basvurusu

### Tarim yayinlarina basin bulteni (#38)
- Dunya Gazetesi, Tarim TR, Ziraat Odalari
- "Haldefiyat — Ucretsiz Hal Fiyat Platformu" duyurusu
- Yillik raporu (#39) elde varsa daha guclu

### Kocaeli site geri gelmesi
- 2026-05-13'te DOWN (DNS OK ama timeout)
- `defaultEnabled: false` cron iptal
- Site geri gelince `true` cevir + test

---

## 📋 Diger Notlar

### Tamamlanmis Onemli Altyapi (referans)
- ✅ Migros ETL canlida (46 urun/gun, 09:00 UTC cron)
- ✅ RetailComparison karti `/urun/<slug>`'de
- ✅ Wayback monitor + Telegram bildirim aktif
- ✅ Haftalik e-bulten kod hazir
- ✅ Geçen yil karsilastirmasi (anasayfa SeasonalGuide + urun sayfasi)
- ✅ Nginx `proxy_read_timeout 180s` (502 fix)
- ✅ Footer Twitter/X + Instagram ikonlari
- ✅ /analiz layout duzeltildi (1400px + 3-col grid)
- ✅ Bolu fix, Kocaeli disable

### Deploy Akisi (yeni pilot release)
- Aktif PM2 cwd: `/var/www/releases/hal-fiyatlari-20260513-222637`
- Build kaynagi: `/root/haldefiyat-src` (git repo) → build sonrasi rsync
- Frontend standalone-server.js symlink target manuel guncellenmesi gerekebilir
- Detay: `tarim-dijital-ekosistem/PILOT_DEPLOY_HAL_FIYATLARI_2026-05-13.md`

### Bilinen Riskler
1. **shared-backend `bun install` calistirilmamali** — root workspace tutarsizligi yarattigi gozlendi (oturum 7)
2. **Lokal TS != VPS TS versiyonu** — `ignoreDeprecations: "5.0"` VPS icin dogru, lokal IDE "6.0" istiyor (uyari kalir)
3. **VPS shared-backend dist guncellige** — `cd /root/haldefiyat-src && bun install` calistirilirsa shared-backend dist'i tekrar build edilmesi gerekebilir
