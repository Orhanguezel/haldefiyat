# HaldeFiyat Görev Planı — 24 Nisan 2026

**Organizatör / Beyin:** Claude Code (mimar, şema, API kontratı, prompt tasarımı)  
**İmplementasyon:** Codex (backend modül, route, ETL, SQL)  
**UI Doğrulama:** Antigravity (görsel test, screenshot, layout kontrolü)

> Görev sırası bağımlılığa göre kilitlidir. Her fazda Claude Code önce şema/kontratı teslim eder, Codex implement eder, Antigravity doğrular.

---

## BU HAFTA — Kritik Küçük İşler

### G-01 · Don Riski Dinamik Hal Güncellemesi

| Alan | Değer |
|---|---|
| **Atanan** | Codex |
| **Doğrulama** | Antigravity |
| **Bağımlılık** | Yok — hemen başlanabilir |
| **Dosya** | `frontend/src/components/sections/FrostRiskBanner.tsx` |

**Görev:**  
`FROST_WATCH_CITIES` hardcoded array'ini kaldır. Bunun yerine `fetchMarkets()` ile aktif marketlerin `cityName` listesini çek. Her şehir için `cityToWeatherSlug()` dönüşümünü uygula, don riski kontrol et. `regionSlug === 'ulusal'` olan marketi (Türkiye Geneli) listeden çıkar — ulusal marketin şehir bazlı don riski yoktur.

**Başarı kriteri:** Yeni bir ETL kaynağı eklendiğinde (örn. Samsun) FrostRiskBanner otomatik o şehri de izler, hardcode değişiklik gerekmez.

**Antigravity görevi:** `/` ana sayfasında don riski banner'ının göründüğünü ve yeni şehirler eklendiğinde otomatik güncellediğini screenshot ile doğrula.

---

### G-02 · `hf_alerts` Seed DROP Sorunu

| Alan | Değer |
|---|---|
| **Atanan** | Codex |
| **Doğrulama** | — (SQL değişikliği, UI yok) |
| **Bağımlılık** | Yok — hemen başlanabilir |
| **Dosya** | `backend/src/db/seed/sql/020_hal_domain_schema.sql` |

**Görev:**  
`DROP TABLE IF EXISTS hf_alerts;` satırını kaldır. Yerine `CREATE TABLE IF NOT EXISTS hf_alerts (...)` ekle (tablo tanımı zaten aşağısında var, sadece DROP → IF NOT EXISTS yap). VPS'te seed yeniden çalıştırıldığında kullanıcı alarmları silinmeyecek.

**Başarı kriteri:** `bun src/db/seed/index.ts --no-drop --only=020` çalıştırıldıktan sonra varolan `hf_alerts` kayıtları silinmemiş olmalı.

---

### G-03 · ads.txt Pasif Kurulum

| Alan | Değer |
|---|---|
| **Atanan** | Codex |
| **Doğrulama** | Antigravity |
| **Bağımlılık** | Yok |
| **Dosya** | `frontend/public/ads.txt` |

**Görev:**  
`frontend/public/ads.txt` dosyası oluştur. İlk satır placeholder: `# google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0` — gerçek publisher ID AdSense hesabı açılınca girilecek. Dosyanın `https://haldefiyat.com/ads.txt` adresinden erişilebilir olması yeterli.

**Antigravity görevi:** `haldefiyat.com/ads.txt` adresinin 200 döndürdüğünü doğrula.

---

## FAZ 1 — Tahmin + Temel Karar Araçları

> Sıralama önemli: Claude Code şema/kontratı hazırlar → Codex implement eder → Antigravity doğrular.

---

### G-04 · Backfill ETL — Arşiv Verisi Çekimi

| Alan | Değer |
|---|---|
| **Şema / Kontrat** | Claude Code |
| **Atanan** | Codex |
| **Doğrulama** | — (veri kalite kontrolü, UI yok) |
| **Bağımlılık** | G-02 tamamlanmış olmalı |

**Claude Code yapacak (önce):**
- Her kaynak için backfill derinliğini belgele: Kayseri (20 yıl), Konya (2004'ten), Balıkesir, Bursa, Ankara, Mersin, Denizli, Eskişehir backfill endpoint'lerini `etl-sources.ts` içinde `backfillEndpoint` alanı var mı kontrol et, eksik olanları ekle.
- Backfill cron/script tasarımı: `bun run etl:backfill --source=kayseri_resmi --from=2024-01-01 --to=2025-12-31` formatında CLI parametreleri.

**Codex yapacak:**
- `backend/src/modules/etl/backfill.ts` scripti yaz: tarih aralığı alır, her gün için `fetchDated()` çağırır, `ON DUPLICATE KEY IGNORE` ile yazar.
- `package.json`'a `"etl:backfill": "bun src/modules/etl/backfill.ts"` ekle.
- Öncelik sırası: Kayseri → Konya → Bursa → Balıkesir → Ankara → diğerleri.

**Başarı kriteri:** Kayseri için en az 24 aylık `hf_price_history` kaydı DB'de mevcut. `hf_etl_runs` tablosunda backfill run'ları `source_api` bazında görünür.

---

### G-05 · Tarımİklim Backend Snapshot

| Alan | Değer |
|---|---|
| **Şema** | Claude Code |
| **Atanan** | Codex |
| **Doğrulama** | — |
| **Bağımlılık** | Yok — G-04 ile paralel başlanabilir |

**Claude Code yapacak (önce):**  
`backend/src/db/seed/sql/022_weather_schema.sql` şemasını yazar:

```sql
CREATE TABLE IF NOT EXISTS hf_weather_observations (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  city_slug    VARCHAR(64)  NOT NULL,
  obs_date     DATE         NOT NULL,
  temp_min     DECIMAL(5,2) DEFAULT NULL,
  temp_max     DECIMAL(5,2) DEFAULT NULL,
  temp_avg     DECIMAL(5,2) DEFAULT NULL,
  precipitation DECIMAL(6,2) DEFAULT NULL,
  frost_risk   TINYINT UNSIGNED DEFAULT NULL COMMENT '0-100',
  source       VARCHAR(64)  NOT NULL DEFAULT 'tarimiklim',
  created_at   DATETIME(3)  DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY hf_wo_city_date_uq (city_slug, obs_date),
  KEY hf_wo_date_idx (obs_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Codex yapacak:**
- `backend/src/modules/etl/weather-etl.ts` — Tarımİklim'den günlük + 3 günlük tahmin verisi çek, `hf_weather_observations`'a yaz.
- `backend/src/modules/weather/router.ts` — `GET /api/v1/weather?city=&date=` endpoint'i.
- ETL cron'una ekle: her sabah 06:00'da çalışsın.
- Frontend `FrostRiskBanner` ve `WeatherWidget`'ı dış API yerine bu endpoint'ten okuyacak şekilde güncelle.

**Başarı kriteri:** `hf_weather_observations` tablosunda son 30 günlük şehir verisi var. Frontend hava widget'ı Tarımİklim'e doğrudan bağlanmıyor.

---

### G-06 · Forecast V1 — Sezonsal Baseline

| Alan | Değer |
|---|---|
| **Şema / Kontrat** | Claude Code |
| **Atanan** | Codex |
| **Doğrulama** | Antigravity |
| **Bağımlılık** | G-04 (backfill verisi) tamamlanmış olmalı |

**Claude Code yapacak (önce):**

Seed şeması `backend/src/db/seed/sql/023_forecast_schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS hf_forecast_predictions (
  id              INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  product_id      INT UNSIGNED   NOT NULL,
  market_id       INT UNSIGNED   NOT NULL,
  forecast_date   DATE           NOT NULL COMMENT 'tahmin edilen gün',
  run_date        DATE           NOT NULL COMMENT 'modelin çalıştığı gün',
  predicted_avg   DECIMAL(12,2)  NOT NULL,
  predicted_min   DECIMAL(12,2)  DEFAULT NULL,
  predicted_max   DECIMAL(12,2)  DEFAULT NULL,
  confidence      ENUM('low','medium','high') DEFAULT 'low',
  model_version   VARCHAR(32)    NOT NULL DEFAULT 'seasonal-v1',
  data_points     SMALLINT       DEFAULT NULL COMMENT 'eğitimde kullanılan gün sayısı',
  PRIMARY KEY (id),
  UNIQUE KEY hf_fp_uq (product_id, market_id, forecast_date, model_version),
  KEY hf_fp_product_market (product_id, market_id),
  KEY hf_fp_run_date (run_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hf_forecast_model_metrics (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  model_version VARCHAR(32)  NOT NULL,
  product_id   INT UNSIGNED  NOT NULL,
  market_id    INT UNSIGNED  NOT NULL,
  metric_date  DATE          NOT NULL,
  mape         DECIMAL(8,4)  DEFAULT NULL,
  mae          DECIMAL(10,4) DEFAULT NULL,
  data_points  SMALLINT      DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY hf_fmm_uq (model_version, product_id, market_id, metric_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

API kontratı: `GET /api/v1/prices/forecast/:productSlug?market=&days=7|30|90`

Yanıt formatı:
```json
{
  "product": { "slug": "...", "name": "..." },
  "market": { "slug": "...", "name": "..." },
  "modelVersion": "seasonal-v1",
  "confidence": "medium",
  "dataPoints": 365,
  "predictions": [
    { "date": "2026-05-01", "avg": 12.50, "min": 10.00, "max": 15.00 }
  ]
}
```

**Codex yapacak:**
- `backend/src/modules/prices/forecast-engine.ts` — sezonsal baseline algoritması:
  1. Geçen yılın aynı haftası ortalaması (±2 hafta penceresi)
  2. Son 30 günün trendi (lineer regresyon eğimi)
  3. İkisini ağırlıklı birleştir (0.6 sezon + 0.4 trend)
  4. `data_points` < 30 → `confidence: low`, < 120 → `medium`, ≥ 120 → `high`
- `backend/src/modules/prices/forecast.ts` route'u güncellenmiş API kontratına göre yaz.
- Forecast cron: her gece ETL sonrası popüler 50 ürün × tüm marketler için çalış, `hf_forecast_predictions`'a yaz.

**Antigravity görevi:** `/urun/[slug]` sayfasında tahmin bandının (min/avg/max çizgisi) grafikte göründüğünü doğrula. Güven etiketi (`Düşük / Orta / Yüksek`) kartda görünmeli.

---

### G-07 · Maliyet Simülatörü MVP

| Alan | Değer |
|---|---|
| **Kontrat** | Claude Code |
| **Atanan** | Codex |
| **Doğrulama** | Antigravity |
| **Bağımlılık** | Yok — hemen başlanabilir |

**Claude Code yapacak (önce):**  
Hesaplama formülü ve alan tanımı (DB şema yok, ilk MVP client-side):

```
Girdi: ürün, şehir, alan_dekar, verim_kg_dekar,
       maliyet_kalemleri: [{ kalem, tutar_tl }],
       satis_fiyati_tl_kg (veya API'den çek)

Hesap:
  toplam_maliyet = sum(maliyet_kalemleri)
  toplam_uretim_kg = alan_dekar × verim_kg_dekar
  ciro = toplam_uretim_kg × satis_fiyati
  net_kar = ciro - toplam_maliyet
  basabas_fiyat = toplam_maliyet / toplam_uretim_kg
  kar_marji_pct = (net_kar / ciro) × 100
```

Senaryo analizi: aynı hesabı 3 fiyat noktasında çalıştır (bugünkü fiyat, 7 gün forecast, kullanıcı girişi).

**Codex yapacak:**
- `frontend/src/app/[locale]/(public)/maliyet-simulatoru/page.tsx` — server component, başlık + açıklama.
- `frontend/src/components/sections/CostSimulatorClient.tsx` — "use client", form + sonuç paneli:
  - Ürün arama (mevcut `SearchableSelect` bileşeni kullanılabilir)
  - Şehir seçimi
  - Alan (dekar) ve verim (kg/dekar) girişi
  - Maliyet kalemleri dinamik liste (ekle/sil)
  - Satış fiyatı: "Mevcut fiyatı getir" butonu `fetchPrices()` çağırır
  - Sonuç kartı: toplam maliyet, ciro, net kar, başabaş fiyat, kar marji
  - 3 senaryo yan yana: bugün / 7 gün tahmin / manuel
- Header navigasyona "Simülatör" linki ekle.
- `POST /api/v1/cost/calculate` endpoint'i (backend validation için): girdi alır, hesap yapar, kayıt etmez, sonucu döner.

**Antigravity görevi:** Simülatör sayfasını aç, bir ürün seç, maliyet kalemleri gir, "Hesapla"ya bas. Sonuç kartının doğru render edildiğini, mobilde formu kontrol et.

---

### G-08 · Fiyat Hareketi Haritası (İl Bazlı)

| Alan | Değer |
|---|---|
| **Kontrat** | Claude Code |
| **Atanan** | Codex |
| **Doğrulama** | Antigravity |
| **Bağımlılık** | G-04 backfill verisi (daha zengin harita için) |

**Claude Code yapacak (önce):**  
API kontratı: `GET /api/v1/map/price-movements?product=&days=7`

Yanıt:
```json
{
  "product": { "slug": "domates", "name": "Domates" },
  "period": "7d",
  "markets": [
    {
      "marketSlug": "antalya-hal-merkez",
      "cityName": "Antalya",
      "currentAvg": 12.50,
      "previousAvg": 10.00,
      "changePct": 25.0,
      "direction": "up"
    }
  ]
}
```

**Codex yapacak:**
- `backend/src/modules/map/router.ts` — `GET /api/v1/map/price-movements` endpoint.
- Repository: son N günlük ortalama vs önceki N günlük ortalama, her market için hesapla.
- `frontend/src/app/[locale]/(public)/harita/page.tsx` — server component.
- `frontend/src/components/sections/PriceMapClient.tsx` — Türkiye il haritası SVG veya `react-simple-maps` ile:
  - İl renklendirmesi: yeşil (düşüş) / kırmızı (artış) / gri (veri yok)
  - Ürün seçici dropdown
  - İle tıklayınca yan panel: hal adı, mevcut fiyat, değişim yüzdesi
  - Veri yetersiz ilçeleri/illeri gri göster

**Antigravity görevi:** `/harita` sayfasını aç. Haritanın yüklendiğini, renklenmenin göründüğünü, bir ile tıklanınca yan panelin açıldığını doğrula. Mobil görünümü kontrol et.

---

## FAZ 2 — Model Olgunlaştırma

> Faz 1 tamamlanmadan başlama.

---

### G-09 · Forecast V2 — Hava Feature'lı Model

| Alan | Değer |
|---|---|
| **Şema** | Claude Code |
| **Atanan** | Codex |
| **Doğrulama** | Antigravity |
| **Bağımlılık** | G-05 (hava snapshot), G-06 (forecast v1), G-04 (2 yıl veri) |

**Claude Code yapacak (önce):**

`hf_product_weather_sensitivity` şeması:
```sql
CREATE TABLE IF NOT EXISTS hf_product_weather_sensitivity (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id   INT UNSIGNED NOT NULL,
  city_slug    VARCHAR(64)  NOT NULL,
  risk_type    ENUM('frost','drought','flood','heat','wind') NOT NULL,
  weight       DECIMAL(5,4) NOT NULL DEFAULT 0.5 COMMENT '0=etkisiz, 1=tam etki',
  PRIMARY KEY (id),
  UNIQUE KEY hf_pws_uq (product_id, city_slug, risk_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Model feature listesi: sezon baseline + son 14 gün trendi + don riski skoru + yağış sapması + üretim bölgesi ağırlığı.

**Codex yapacak:**
- Forecast engine'i v2'ye güncelle: hava feature'larını `hf_weather_observations`'dan çek, sensitivity table ile ağırlıkla.
- `model_version = 'weather-v2'` olarak kaydet, v1 ile birlikte DB'de yaşayabilir.
- Admin endpoint: `POST /api/v1/admin/forecast/run?model=weather-v2&product=&market=` — manuel tetikleme.
- Backtest script: son 30 günü "görmeden" tahmin üret, gerçek veriyle karşılaştır, MAPE/MAE hesapla.

**Antigravity görevi:** Ürün sayfasında "Hava kaynaklı fiyat riski" kartının göründüğünü doğrula. Tahmin bandının v2 modelle güncellendiğini doğrula.

---

### G-10 · Admin Forecast Metrikleri

| Alan | Değer |
|---|---|
| **Atanan** | Codex |
| **Doğrulama** | Antigravity |
| **Bağımlılık** | G-09 |

**Codex yapacak:**
- `admin_panel/src/app/(main)/admin/(admin)/forecast/page.tsx` — forecast run listesi + model metrikleri tablosu.
- `admin_panel/src/app/(main)/admin/(admin)/forecast/anomalies/page.tsx` — anomali listesi (fiyat > 2σ).
- Admin dashboard'a veri kalitesi kartı: "backfill kapsamı", "tahmin üretilen ürün sayısı".

**Antigravity görevi:** Admin panelde forecast sayfasının açıldığını, metrik tablosunun render edildiğini doğrula.

---

### G-11 · 3 Reklam Slotu Aktif

| Alan | Değer |
|---|---|
| **Atanan** | Codex |
| **Doğrulama** | Antigravity |
| **Bağımlılık** | G-03 (ads.txt), AdSense hesabı açılmış olmalı |

**Codex yapacak:**
- `frontend/src/components/ui/AdSlot.tsx` bileşeni:
  ```tsx
  // zone: 'home_after_hero' | 'prices_after_filters' | 'product_after_chart'
  // Slot boşsa house ad veya null döner
  ```
- `NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT` env değişkeni + slot ID'leri.
- 3 slotu sayfalarına ekle: ana sayfa hero altı, `/fiyatlar` filtre altı, `/urun/[slug]` grafik altı.
- Dashboard, profil, alarm kurma ekranlarında reklam kapalı (bu sayfalara `AdSlot` ekleme).
- Skeleton fallback: sabit yükseklik, layout shift olmasın.

**Antigravity görevi:** 3 reklam alanının konumlandığını, dashboard ve profil sayfalarında reklam olmadığını, mobilde layout bozulmadığını screenshot ile doğrula.

---

## FAZ 3 — Platform Büyümesi (3-6 ay)

> Faz 2 tamamlanmadan başlama. Bu faz için detaylı görev planı Faz 2 biterken ayrıca yazılır.

### Planlanan İşler (henüz görev kırılımı yok)

- [ ] Arz-talep sinyal formu (çiftçi/halci kayıt sonrası)
- [ ] İlan MVP — telefon doğrulama (SMS OTP) zorunlu
- [ ] API key altyapısı (ücretsiz / pro / kurumsal)
- [ ] Harita Katman 2 — platform içi sinyal

---

## Hayır Listesi (Bu Plana Girmez)

| Fikir | Sebep |
|---|---|
| Genel chat / ziyaretçi defteri | Spam, moderasyon yükü, KVKK |
| Görüntülü görüşme altyapısı | WebRTC karmaşıklığı, mevcut ekip için taşınamaz |
| Ağır ML modeli (v1 verisiyle) | Önce sezonsal baseline, sonra gerekirse |

---

## Ajan Sorumlulukları Özeti

| Görev | Claude Code | Codex | Antigravity |
|---|---|---|---|
| G-01 Don riski dinamik | — | ✓ yazar | ✓ doğrular |
| G-02 Alerts seed fix | — | ✓ yazar | — |
| G-03 ads.txt | — | ✓ yazar | ✓ doğrular |
| G-04 Backfill ETL | ✓ kontrat + CLI tasarımı | ✓ yazar | — |
| G-05 Hava snapshot | ✓ SQL şema | ✓ yazar | — |
| G-06 Forecast V1 | ✓ SQL + API kontrat | ✓ yazar | ✓ doğrular |
| G-07 Maliyet simülatörü | ✓ formül + alan tanımı | ✓ yazar | ✓ doğrular |
| G-08 Fiyat haritası | ✓ API kontrat | ✓ yazar | ✓ doğrular |
| G-09 Forecast V2 | ✓ şema + feature listesi | ✓ yazar | ✓ doğrular |
| G-10 Admin forecast | — | ✓ yazar | ✓ doğrular |
| G-11 Reklam slotları | — | ✓ yazar | ✓ doğrular |

---

## Çalışma Protokolü

1. **Claude Code** bu planı okur, ilgili görev için şema/kontrat dosyasını `docs/` altına yazar, sonra Codex'e verir.
2. **Codex** görevi alır, implement eder, PR açar.
3. **Antigravity** PR merge sonrası sayfaları screenshot ile kontrol eder.
4. Her görev tamamlandığında bu dosyada `[ ]` → `[x]` yapılır.

### Görev Durumu

- [x] G-02 · `hf_alerts` seed DROP sorunu *(bu planın yazılmasıyla öncelik belirlendi)*
- [ ] G-01 · Don riski dinamik hal güncellemesi
- [ ] G-03 · ads.txt pasif kurulum
- [ ] G-04 · Backfill ETL
- [ ] G-05 · Tarımİklim backend snapshot
- [ ] G-06 · Forecast V1 sezonsal baseline
- [ ] G-07 · Maliyet simülatörü MVP
- [ ] G-08 · Fiyat hareketi haritası
- [ ] G-09 · Forecast V2
- [ ] G-10 · Admin forecast metrikleri
- [ ] G-11 · 3 reklam slotu
