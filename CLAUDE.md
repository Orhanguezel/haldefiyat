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
- PM2: `hal-backend` (port 8091), `hal-frontend` (port 3033), `hal-admin` (port 3036)
  — ID'ler PM2 restart sonrasi degisir, isimle calistir (`pm2 restart hal-backend`)
- PM2 prosesleri runtime env ile baslatildi: `BACKEND_URL=http://127.0.0.1:8091`,
  `NEXT_PUBLIC_API_URL=https://haldefiyat.com` (PM2 restart sonrasi `--update-env` gerek)
- DB: `hal_fiyatlari` MySQL, user `haldefiyat`
- 22+ ETL kaynak (resmi belediye + antkomder + hal.gov.tr + izmir API + batiakdeniztv + bolu)
- 2026-05-13 pilot deploy (`/var/www/releases/hal-fiyatlari-20260513-161720`)
  SUPERSEDED — rollback yapildi, klasor referans icin korunuyor. Detay:
  `tarim-dijital-ekosistem/PILOT_DEPLOY_HAL_FIYATLARI_2026-05-13.md`

## Aktif Hatirlatmalar (TARIH ILE KONTROL ET)

### 🔔 2026-05-13+ — Wayback Machine geri gelince Migros tarihçesi çek
**Durum:** Internet Archive cyberattack sonrası geçici offline (2026-05-13).

**Yapilacak (Wayback geri gelince):**
```bash
ssh vps-vistainsaat 'cd /root/haldefiyat-src/backend && bun scripts/wayback-migros-backfill.ts --dry-run'
# Çıktı OK ise:
ssh vps-vistainsaat 'cd /root/haldefiyat-src/backend && bun scripts/wayback-migros-backfill.ts'
# Özel aralık:
# bun scripts/wayback-migros-backfill.ts --from 2024-01-01 --to 2025-12-31
```

**Test edilebilir mi diye periyodik kontrol:**
```bash
curl -s -o /dev/null -w "%{http_code}\n" "https://web.archive.org/cdx/search/cdx?url=migros.com.tr&limit=1"
# 200 dönerse online, başka bir şey dönerse hala offline
```

Snapshot başına ~30 ürün beklentisi (Migros sebze-meyve sayfası tek pagination), ayda 1-3 snapshot tipik. Idempotent — istediğin kadar çalıştırabilirsin.

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
- **Backfill modu**: `date = "id:NNN"` formatıyla belirli ID'yi doğrudan çek (listing sayfası atlanır)
  - Kullanım: `POST /api/v1/admin/hal/etl/run` body `{"source":"tekirdag_resmi","date":"id:2150"}`
  - `fetchWithFallback` bu formatı tanır, `shiftDate` döngüsünü atlar

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
- `serik_batiakdeniz`, `kumluca_batiakdeniz`, `gazipasa_batiakdeniz`, `alanya_batiakdeniz`, `demre_batiakdeniz`, `finike_batiakdeniz` (✅ Oturum 4: batiakdeniztv.com, `parseBatiakdenizHtml`, 2 sütunlu tablo)
- `bolu_resmi` (✅ Oturum 4: 2-adım anasayfa → `/{DD-MM-YYYY}-toptanci-hal-fiyat-listesi/`, **50 inserted**, haftalık güncelleme)

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

- ETL config: `backend/src/config/etl-sources.ts` (22+ kaynak)
- ETL fetcher: `backend/src/modules/etl/fetcher.ts` (parsing + custom fetchXxxDated fonksiyonları)
- ETL orchestrator: `backend/src/modules/etl/index.ts` (`runDailyEtl`, `runSingleSource`)
- Scrapler client: `backend/src/modules/etl/scraper-client.ts`
- Cron: `backend/src/cron.ts` (varsayilan: `30 7 * * *` UTC)
- ETL trigger admin endpoint: `POST /api/v1/admin/hal/etl/run` body `{source: "key"|"all", date?: "YYYY-MM-DD"|"id:NNN"}`
  - `"id:NNN"` formatı: Tekirdağ gibi ID-bazlı sayfalarda backfill için

## VPS Manuel ETL Tetikleme

**Not:** Standalone Node.js script çalışmaz (yanlış DB user). Admin API endpoint kullan:

```bash
# JWT üret (VPS'te Python ile)
JWT=$(ssh vps-vistainsaat 'python3 -c "
import hmac, hashlib, base64, json, time
def b64url(d):
    if isinstance(d,str): d=d.encode()
    return base64.urlsafe_b64encode(d).rstrip(b\"=\"\").decode()
h=b64url(json.dumps({\"alg\":\"HS256\",\"typ\":\"JWT\"}))
p=b64url(json.dumps({\"sub\":\"4f618a8d-6fdb-498c-898a-395d368b2193\",\"role\":\"admin\",\"iat\":int(time.time()),\"exp\":int(time.time())+3600}))
s=hmac.new(\"3af77dee968934d4882ed2c0f1a5571871cec02e15b6ed75e8b8cc5e17379956\".encode(),\"{}.{}\".format(h,p).encode(),hashlib.sha256).digest()
print(\"{}.{}.{}\".format(h,p,b64url(s)))
"')

# ETL çalıştır
ssh vps-vistainsaat "curl -s -X POST http://localhost:8091/api/v1/admin/hal/etl/run \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer \$JWT' \
  -d '{\"source\":\"KAYNAK_KEY\"}'"

# Belirli ID ile backfill (Tekirdağ için)
# -d '{"source":"tekirdag_resmi","date":"id:2150"}'
```

## Cross-References

- Scraper-service detay: `~/.claude/projects/-home-orhan-Documents-Projeler/memory/scraper_service.md`
- Plan dokumani: `/home/orhan/Documents/Projeler/docs/scrapling-service-plan.md`
- GeoSerra ile ayni pattern: `/home/orhan/Documents/Projeler/vps-guezel/geoserra/CLAUDE.md`
- geo-seo-claude entegrasyonu: `/home/orhan/Documents/Projeler/geo-seo-claude/CLAUDE.md`
