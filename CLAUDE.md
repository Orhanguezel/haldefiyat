# hal-fiyatlari — Claude Code Proje Notlari

Bu dosya hal-fiyatlari dizininde calisirken otomatik baglama dahil olur. Aktif Hatirlatmalar bolumunde `Today's date` ile karsilastir, vakti gelmis maddeleri kullaniciya proaktif olarak hatirlat.

---

## ⚡ ÖNCE BUNU ÇALIŞTIR (her oturum başında)

Bu projeye baktığında **ilk iş** ETL sağlık raporunu kontrol et:

```bash
ssh vps-vistainsaat '/root/haldefiyat-src/backend/scripts/etl-health.sh 24'
```

Çıktıda şunlara bak:
- **🚀 SCRAPLING** etiketli source'lar OK mü? (antkomder, kocaeli, hal.gov.tr — Asama 1-3 ile entegre edildi)
- "**Sorunlu Kaynaklar**" bölümü boş olmalı (3+ ardısık error)
- "**Veri Akışı Yok**" bölümünde son ok > 7 gün öncesi olan source varsa: o source artık üretmiyor → kullanıcıya hatırlat, Aşama 4 işine alabiliriz

**Hata pattern'larına göre aksiyon kılavuzu:**

| Hata mesajı | Anlam | Aksiyon |
|---|---|---|
| `The operation timed out` | Bun.fetch site cevap vermiyor | Source HF_SCRAPER_SOURCES'a ekle (curl-cffi TLS impersonation cozer) |
| `socket connection was closed unexpectedly` | TLS/baglanti reset | Source HF_SCRAPER_SOURCES'a ekle |
| `Kaynak boş yanıt döndürdü (HTTP 200)` | Site cevap verdi ama parser 0 row | Parser revize gerek (HTML format degismis olabilir) |
| `HTTP 5xx` | Site server hatasi | Genelde gecici, retry mantigi var; hatadan kalkamiyorsa siteyi tarayicidan kontrol |

**Yeni başarısız bir source görürsen** bu CLAUDE.md'nin altındaki "Sorunlu Kaynaklar Durumu" tablosuna ekle, çözüm planı yaz.

---

## Repo Niteligi

- Repo: `github.com/Orhanguezel/haldefiyat` (push: main)
- VPS: vps-vistainsaat (root@srv1493379), path: `/root/haldefiyat-src/`
- PM2: `hal-backend` (id 19, port 8086), `hal-frontend` (id 20), `hal-admin` (id 23)
- DB: `hal_fiyatlari` MySQL, user `haldefiyat`
- 16 ETL kaynak (resmi belediye + antkomder + hal.gov.tr + izmir API)

## Aktif Hatirlatmalar (TARIH ILE KONTROL ET)

### 🔔 2026-05-09 civari — Scrapling entegrasyon ilk hafta gozlem
**Yapilacak:** hf_etl_runs tablosunda Scrapling source'larin (antkomder x3, kayseri) basari oranini izle:
```bash
ssh vps-vistainsaat 'mysql -u haldefiyat -pHal2026\!secure hal_fiyatlari -e "SELECT source_api, status, COUNT(*) as runs, SUM(rows_inserted) as inserted, MAX(created_at) as last_run, LEFT(MAX(error_msg), 100) as last_err FROM hf_etl_runs WHERE source_api IN (\"antalya_merkez_antkomder\",\"antalya_serik_antkomder\",\"antalya_kumluca_antkomder\",\"kayseri_resmi\") AND created_at >= NOW() - INTERVAL 7 DAY GROUP BY source_api, status ORDER BY source_api, status;"'
```

**Eslik kontrol — VPS scraper-service istek sayisi:**
```bash
ssh orhan@72.61.93.212 'echo "14604925" | sudo -S docker logs scraper-service-api-1 --since 168h 2>&1 | grep -E "POST.*/api/v1/scrape" | wc -l'
```

### 🔔 2026-05-12 civari — Asama 3: scraper-service'e session/cookie API
**Yapilacak:** Balikesir (2-step CSRF) ve hal.gov.tr (multi-step ASP.NET ViewState) icin session destegi gerekli.

scraper-service tarafi:
1. `src/schemas/scrape.py`'a `cookies: dict | None`, `return_cookies: bool` alanlari
2. `src/engine/fetcher.py`'da response cookies'i return + request'te cookies forward
3. Veya Scrapling Session API'si ile state-ful endpoint (`POST /api/v1/sessions` + `POST /api/v1/sessions/{id}/scrape`)

hal-fiyatlari tarafi:
1. fetcher.ts'in fetchBalikesirDated icine 2-step Scrapling: GET → CSRF → POST
2. fetcher.ts'in fetchHalGovTrDated icine multi-step Scrapling: GET ViewState → POST'lar

### 🔔 Bonus: Kayseri/Istanbul IBB AJAX endpoint reverse engineering
- **Kayseri**: hal-fiyatlari sayfasi AngularJS, browser'da Network sekmesi acip AJAX call'lari yakalamak gerek. Muhtemelen `/api/hal-fiyatlari` veya benzeri JSON endpoint var.
- **Istanbul IBB**: dropdown + GUID secim, kullanici "Domates" secince fiyat gelir. Network sekmesinde AJAX cagrisini yakala. URL pattern ya `/Hal/UrunFiyat?id={GUID}` ya da benzeri olmali.
- Bunlar bulununca: yeni `responseShape` (`kayseri_json`, `ibb_json`) ekle, parser yaz, source ekle.

### 🔔 Yeni ETL kaynagi eklerken
1. `backend/src/config/etl-sources.ts`'e RAW_SOURCES dizisine ekle (key, baseUrl, endpoint, responseShape, defaultUnit, defaultCategory)
2. `backend/src/db/seed/sql/0XX_*_schema.sql` icine market kaydi (hf_markets)
3. Eger yeni responseShape gerekiyorsa: `parseResponse()` switch'ine ek + `parseXXXHtml()` fonksiyon
4. ETL backfill icin: `backfillEndpoint` set et (gecmis tarih farkli URL ise)

## Scrapling Entegrasyonu — Aktif (2026-05-02 LIVE)

### Mimari
- `backend/src/modules/etl/scraper-client.ts` — TS HTTP wrapper
- `backend/src/modules/etl/fetcher.ts` — `fetchDated` dispatcher'inda `tryFetchViaScraper` on-check
- Source HF_SCRAPER_SOURCES listesindeyse Scrapling'e yonelir, fail olursa legacy davraniseina sessizce dusler
- Backfill (gecmis tarih) destegi YOK — bugunden farkli tarih icin legacy fetch path

### Aktif Source'lar (HF_SCRAPER_SOURCES)
- `antalya_merkez_antkomder` (✅ Asama 1+2: 1102 error → 24 inserted, POST 939ms)
- `kocaeli_merkez` (✅ Asama 2: 162 error → 112 inserted, POST 1835ms)
- `hal_gov_tr_ulusal` (✅ Asama 3: hep timeout → **434 inserted**, multi-step Scrapling 66s)
- `corum_resmi` (✅ Asama 5: JS-rendered, Scrapling, **60 inserted**)
- `canakkale_resmi` (✅ Asama 5: timeout direkt, Scrapling, **85 inserted**)
- `kahramanmaras_resmi` (✅ Asama 5: JS-rendered, Scrapling, **37 inserted**, 2 hal)

### 2-Adımlı Scrapling (listing → detail)
- `tekirdag_resmi` (✅ Oturum 3: /hal_fiyat_gunluk → max ID → /hal_fiyat_liste_detay/{ID}, **33 inserted**, sayfa tarihi çıkarılır)

### Dynamic Mode Scrapling (JS-rendered kart yapısı)
- `trabzon_resmi` (✅ Oturum 3: HF_SCRAPER_DYNAMIC, div kart yapısı tablo yok, **68 inserted**, resimler /public/images/urunler/ indirildi)

### Direct Fetch Source'lar (Scrapling kullanmiyor)
- `istanbul_ibb` (Anadolu Yakasi) (✅ Asama 4: 97 satir/gun, 1.1s, 3 paralel kategori AJAX endpoint)
  - URL: `tarim.ibb.istanbul/inc/halfiyatlari/gunluk_fiyatlar.asp`
  - Auth: tUsr/tPas/tVal hardcoded inline JS'ten
  - T-1 gun verisi (bugun gece dolar)
- `kutahya_resmi` (✅ Asama 5: direct fetch, **76 inserted**)
- `manisa_resmi` (✅ Asama 5: direct fetch, **97 inserted**)
- `yalova_resmi` (✅ Asama 5: direct fetch, **103 inserted**, 30-gun stale filter)

### Disabled (kaynak veya parser sorunu — Asama 3+ icin)
- `antalya_serik_antkomder`, `antalya_kumluca_antkomder` — config'de `defaultEnabled: false` (sayt fiyat yayinlamiyor)
- `mersin_resmi` — kaynak siteye baglanti yok (`fetch failed`/timeout) — site genel sorun, Scrapling de cevap alamiyor
- `kayseri_resmi` — AngularJS JS-render, dynamic mode bile tbody dolu donmuyor (AJAX endpoint reverse engineering gerek)
- `gaziantep_resmi` — div-based veri, parser yenileme gerek
- `balikesir_resmi` — 2-step CSRF + POST, scraper-service'e session/cookie API gerekli
- ~~`hal_gov_tr_ulusal`~~ — ✅ Asama 3 ile cozuldu (cookies forward + multi-step POST)
- ~~`istanbul_ibb_*`~~ — ✅ Asama 4 ile eklendi (AJAX endpoint reverse engineering: `gunluk_fiyatlar.asp`, 3 kategori paralel, 97 satir/gun, direct curl yeter)

### Acil Bypass / Geri Donme
| Sorun | Komut |
|---|---|
| Scrapling sonuc kotu, eski davranisa don | VPS .env: `SCRAPER_ENABLED=false` + `pm2 restart hal-backend --update-env` |
| Sadece bir source'u listeden cikar | VPS .env: HF_SCRAPER_SOURCES'tan key sil + restart |
| Servis down | Otomatik fallback (legacy fetch zaten devreye girer) |

## Sorunlu Kaynaklar Durumu (2026-05-02)

| Source | Hata Tipi | Cozum Durumu |
|---|---|---|
| antalya_merkez_antkomder | HTTP 200 bos | ✅ Scrapling cozdu |
| antalya_serik_antkomder | HTTP 200 bos | ✅ Scrapling (kanitsiz, URL pattern ayni) |
| antalya_kumluca_antkomder | HTTP 200 bos | ✅ Scrapling (kanitsiz, URL pattern ayni) |
| kayseri_resmi | HTTP 200 bos | ⚠️ Scrapling cevap aldi ama parser 0 row, debug bekliyor |
| gaziantep_resmi | HTTP 200 bos | ⏸️ Scrapling html geliyor (258KB) ama tablo yok — parser yenilemeli |
| kocaeli_merkez | HTTP 200 bos / POST formlu | 🔜 Asama 2: scraper-service POST destegi gelince |
| mersin_resmi | socket closed | 🔜 Asama 2 |
| balikesir_resmi | socket closed | 🔜 Asama 2: 2-step CSRF + POST |
| hal_gov_tr_ulusal | timeout / multi-step ASP.NET | 🔜 Asama 2: hibrit (GET Scrapling + POST local) |
| **istanbul_ibb_anadolu** | **YENI EKLENECEK** | URL: tarim.ibb.istanbul/tr/istatistik/124/hal-fiyatlari.html — parser yok |
| **istanbul_ibb_avrupa** | **YENI EKLENECEK** | URL: tarim.ibb.istanbul/avrupa-yakasi-hal-mudurlugu/hal-fiyatlari.html — parser yok |

## Onemli Dosya Yollari

- ETL config: `backend/src/config/etl-sources.ts` (16 kaynak)
- ETL fetcher: `backend/src/modules/etl/fetcher.ts` (1399 satir, parsing dahil)
- ETL orchestrator: `backend/src/modules/etl/index.ts` (`runDailyEtl`, `runSingleSource`)
- Scrapler client: `backend/src/modules/etl/scraper-client.ts`
- Cron: `backend/src/cron.ts` (varsayilan: `15 3 * * *` UTC)
- ETL trigger admin endpoint: `POST /api/admin/hal/etl/run` body `{source: "key"|"all", date?}`

## VPS Manuel ETL Tetikleme

```bash
ssh vps-vistainsaat 'cd /root/haldefiyat-src/backend && cat > /tmp/etl-test.mjs <<"EOF"
import { runSingleSource } from "/root/haldefiyat-src/backend/dist/modules/etl/index.js";
const r = await runSingleSource("KAYNAK_KEY");
console.log(JSON.stringify(r));
process.exit(0);
EOF
node --experimental-specifier-resolution=node /tmp/etl-test.mjs'
```

## Cross-References

- Scraper-service detay: `~/.claude/projects/-home-orhan-Documents-Projeler/memory/scraper_service.md`
- Plan dokumani: `/home/orhan/Documents/Projeler/docs/scrapling-service-plan.md`
- GeoSerra ile ayni pattern: `/home/orhan/Documents/Projeler/vps-guezel/geoserra/CLAUDE.md`
- geo-seo-claude entegrasyonu: `/home/orhan/Documents/Projeler/geo-seo-claude/CLAUDE.md`
