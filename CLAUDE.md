# hal-fiyatlari — Claude Code Proje Notlari

Bu dosya hal-fiyatlari dizininde calisirken otomatik baglama dahil olur. Aktif Hatirlatmalar bolumunde `Today's date` ile karsilastir, vakti gelmis maddeleri kullaniciya proaktif olarak hatirlat.

> ## 🚫 KESIN KURAL — DEPLOY SADECE GIT İLE (rsync/scp YASAK)
>
> **Bir daha ASLA rsync veya scp ile VPS'e deploy etme.** Repo GitHub ile takip
> ediliyor. Deploy akisi TEK yol:
> 1. Local: `git add . && git commit && git push origin main`
> 2. VPS: `git fetch origin && git reset --hard origin/main` (temiz, divergence yok)
> 3. VPS: `bun run build` (gereken: backend/frontend/admin)
> 4. VPS reload: backend → `pm2 reload hal-backend`. **Frontend/admin → `pm2 RESTART`
>    (reload DEĞİL!)** — Next standalone'da `pm2 reload` yeni build'i almaz, eski
>    process silinmiş chunk'lara işaret eden eski HTML serve eder → `/_next/static`
>    500 / ChunkLoadError. `pm2 restart hal-frontend hal-admin --update-env` şart.
>
> **Neden:** rsync ile deploy edince local ve server git'ten ayrisip "anlamsiz
> coplige" donuyor (commit edilmemis dosyalar, drift, takip edilemez degisiklik).
> Her sey once git'e gider, sonra serverdan cekilir. Dosya dosya git kontrolu
> yapma — `git add .` ile topluca commit et.
>
> **İKİ AYRI GIT REPO — ikisi de git ile:**
> - `projects/hal-fiyatlari/` → `github.com/Orhanguezel/haldefiyat` (bu proje)
> - `packages/` (shared-backend dahil) → `github.com/Orhanguezel/shared-ecosystem-packages`
>
> shared-backend değişikliği yaptıysan: `packages/` dizininde commit + push →
> VPS `packages/` dizininde `git reset --hard origin/main` + `bun run build:shared`.
> Yani shared-backend de git ile, rsync YOK.
>
> **GERÇEK İSTİSNA — git'te OLMAYAN:** `/home/orhan/Documents/Projeler/wiribude`
> GitHub'da takip edilmiyor. Sadece bu tür repolar git akışı dışında.

> **➡️ Sonraki oturumda yapilacak isler:** [`KALAN-ISLER.md`](./KALAN-ISLER.md)
>
> Hizli baslangic siralamasi: #60 (changePct dogrulama) → #62 (competitor admin
> UI) → #34 (Turkiye haritasi) → #41 (embed widget). Diger acik isler ve
> beklemeler bu dosyada kategorize.

> **🎯 Google Ads kurulum + 2-gun analiz optimizasyon:** [`ADS-SETUP-CHECKLIST.md`](./docs/checklists/ADS-SETUP-CHECKLIST.md)
>
> 2026-05-26'da Vista Seeds Ads altinda "Haldefiyat - Arama - Trafik" kampanyasi
> yayina cikti (150 TL/gun). Conversion tag (AW-18007572524) yuklendi ✅,
> Bereketfide GA4 kalintilari temizlendi ✅. 2026-05-28 itibariyle 2-gun analiz
> tamamlandi: insan trafigi 2.5x artti, %78 mobil. **Strateji: brand awareness
> fazi** (Atakan karari) — mobil tuketici trafigi DAHIL, B2B daraltma YOK.
> Operasyon Orhan'da, Atakan async. **Aktif iş — Madde 11:** 11.1 audit log fix
> → 11.2 conversion event'ler → 11.3 gclid/UTM cookie capture → 11.4
> /canli-hal-fiyatlari landing (newsletter signup #1 CTA) → 11.5 admin
> analytics (retention/cohort agirlikli) → 11.6 UTM template + remarketing
> tag → 11.8 6 custom audience (Faz 2 ön hazirlik). Doğrulama 2026-06-04.

> **📱 Sosyal medya hesap acma + API otomasyon:** [`SOCIAL-API-SETUP-CHECKLIST.md`](./docs/checklists/SOCIAL-API-SETUP-CHECKLIST.md)
>
> Facebook + Instagram + YouTube hesaplari (tuzel kisi, info@vistaseeds.com.tr).
> Meta Business Manager, Domain Verification, Business Verification, App Review,
> System User Token, Google Cloud OAuth, YouTube Data API v3, backend modullerini
> tasarimı. Tahmini 4 hafta yogun + 6-8 hafta takvim (bekleyisler dahil).

> **💰 Monetizasyon & mukemmellestirme plani (BEKLEMEDE):** [`MONETIZASYON-CHECKLIST.md`](./docs/checklists/MONETIZASYON-CHECKLIST.md)
>
> 2026-05-28 karari: Atakan = sahip + sektor agi (250+ ziraat muhendisi, hal muduru
> baglantisi), yazilimci = teknik yurutme. AdSense + bireysel premium + API geliri
> yazilimciya. Su an monetizasyon KAPALI, mukemmellestirme fazi. Adim 0 (yazili
> mutabakat) -> Adim 1 (icerik motoru) -> ... -> Adim 6 (sessiz altyapi). Aktivasyon
> tetigi: 10K DAU + 50 makale + 2K newsletter -> Premium acilir.

> **📨 Newsletter aktivasyonu (MİMARİ HAZIR — Codex implement edecek):** [`docs/codex-briefs/newsletter-activation.md`](./docs/codex-briefs/newsletter-activation.md)
>
> 2026-05-28: brand-awareness funnel'ının son halkası. **KRİTİK BUG:** `POST
> /api/v1/newsletter/subscribe` → 404 (public route register edilmemiş, formlar
> boşluğa POST atıyor, 0 abone). **KARAR: single opt-in** (Orhan onaylı) — mobil
> Ads %78, double opt-in friction'ı funnel'ı baltalar. **İzolasyon:** shared
> subscribe'a DOKUNMA (Bereketfide/VistaSeed etkilenmesin), hal-fiyatlari LOCAL
> newsletter modülü yazılır. Unsubscribe stateless HMAC token (schema değişikliği
> yok). 5 görev spec'lendi (local modül + route register + digest filter + /abonelik
> sayfası + opsiyonel List-Unsubscribe). Digest+cron+Resend hazır.

> **📱 Mobil web + PWA checklist (DETAYLANDIRILDI 2026-05-28):** [`MOBIL-WEB-PWA-CHECKLIST.md`](./docs/checklists/MOBIL-WEB-PWA-CHECKLIST.md)
>
> Ads kampanyasi trafiginin %78'i mobil — mobil deneyim acil. 10 bolum, her
> bolumde Claude tasarim / Codex implement / Orhan operasyonel rol ayrimi.
> Codex'e checklist'in tamami verilmez (wireframe + cache strateji + ikon
> tasarimi Claude/Orhan kararlari). Onerilen sira: 1.audit → 2.anasayfa
> mobil → 3.nav (bottom nav karari Orhan'da) → 4.manifest → 5.service worker
> → 7.performans → 9.deploy.

---

## ⚡ ÖNCE BUNU ÇALIŞTIR (her oturum başında)

Bu projeye baktığında **ilk iş** ETL sağlık raporunu kontrol et:

```bash
ssh vps-vistainsaat '/var/www/tarim-dijital-ekosistem/projects/hal-fiyatlari/backend/scripts/etl-health.sh 24'
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

## 📊 Trafik Raporu Hazirlarken — ARACI KULLAN (elle awk yazma)

Donemsel trafik analiz raporu (`reports/analiz-*.md` + `.pdf`) istenince **sifirdan
awk/log analizi yazma** — kalici arac hazir:

```bash
cd backend/scripts
./traffic-report.sh --from 24 --to 30 [--month Jun] [--year 2026] [--pdf]
```

- Cikti: `reports/analiz-<from>-<to>-<ay>-<yil>.md` (+ `.pdf`).
- Otomatik dolar: ozet tablo, gunluk tablo, saatlik, HTTP durum, bot/AI, gclid landing, referrer.
- **Elle (Claude) doldurulacak `<!-- TODO -->`:** trend karsilastirmasi (onceki donem), HATALAR/BULGULAR, Aksiyon Listesi, Genel Durum. Bilincli — yorum/karar otomatiklesmesin.
- **Akis:** tam gunleri sec (gunu bitmemis kismi gunu disla) → script calistir → TODO'lari onceki raporla kiyaslayip doldur.
- Dosyalar: `traffic-report.sh` (orchestrator), `.awk` (analyzer, nginx `haldefiyat.access.log*`), `-format.py` (md tablolari), `.css` (PDF stili — pandoc + weasyprint).

---

## Repo Niteligi

- Repo: `github.com/Orhanguezel/haldefiyat` (push: main) — local git repo. **VPS de ayni git repo** (2026-05-26 dogrulandi). Yeni deploy akisi: local commit + push → VPS `git pull --ff-only origin main` → `cd frontend && bun run build` → `pm2 reload hal-frontend --update-env`. Acil scp yine yapilir ama tercih edilen yol git.
- VPS: vps-vistainsaat (root@srv1493379), path: `/var/www/tarim-dijital-ekosistem/projects/hal-fiyatlari/` (monorepo standardi, 2026-05-14)
- node_modules: monorepo root `/var/www/tarim-dijital-ekosistem/node_modules` (bun workspace install)
- PM2: `hal-backend` (port 8091), `hal-frontend` (port 3033), `hal-admin` (port 3036)
  — ID'ler PM2 restart sonrasi degisir, isimle calistir (`pm2 restart hal-backend`)
- PM2 prosesleri runtime env ile baslatildi: `BACKEND_URL=http://127.0.0.1:8091`,
  `NEXT_PUBLIC_API_URL=https://haldefiyat.com` (PM2 restart sonrasi `--update-env` gerek)
- DB: `hal_fiyatlari` MySQL, user `haldefiyat`
- 22+ ETL kaynak (resmi belediye + antkomder + hal.gov.tr + izmir API + batiakdeniztv + bolu)
- Marketfiyati ETL (2026-05-14): a101+bim+carrefour+migros+tarim_kredi via TUBITAK BILGEM API, `hf_retail_prices` tablosu
- **Deploy akisi:** local'de duzelt → `scp` ile VPS path'ine → `cd backend && bun run build` → `pm2 reload hal-backend --update-env`
- **Frontend sayfa genisligi standardi (2026-05-14):** Tum public sayfalar `<PageContainer>` component'ini kullanir (`frontend/src/components/layout/PageContainer.tsx`). Genislik **1400px** (`max-w-[1400px]`), padding `px-4 sm:px-6 lg:px-8`, dikey `py-12`. Tek yerden tayin: degisiklik gerekirse SADECE `PageContainer.tsx`'i duzenle. Mevcut sayfalar buna gore migrate edildi (pro, metodoloji, embed, rapor/yillik, analiz, analiz/[slug]). Yeni sayfada `<main className="...">` yerine `<PageContainer>` kullan.
- **Codex paralel cakisma riski (2026-05-14):** Codex AI ayni codebase'te paralel calisirken benim deploy'larimi override edebilir. Ornegin /analiz PageContainer migrasyonu Codex'in lib/analiz.ts + lib/api.ts guncellemesini deploy etmesi sirasinda silindi. Onerilen: dosya degistirdikten sonra VPS'te `grep` ile dogrula, gerekirse zorla SCP tekrarla.
- Nginx `/etc/nginx/sites-available/haldefiyat` `/api/` location bloğunda
  `proxy_read_timeout 180s` ayari var (5+ yil tarihce query'leri icin sigorta).
  Bu config repo'da degil — VPS-only. Reload icin: `nginx -s reload`.

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
- **Backfill modu**: `date = "id:NNN"` formatıyla belirli ID'yi doğrudan çek (listing sayfası atlanır)
  - Kullanım: `POST /api/v1/admin/hal/etl/run` body `{"source":"tekirdag_resmi","date":"id:2150"}`
  - `fetchWithFallback` bu formatı tanır, `shiftDate` döngüsünü atlar

### Aktif Source'lar (HF_SCRAPER_SOURCES)
- `antalya_merkez_antkomder` (✅ Asama 1+2: 1102 error → 24 inserted, POST 939ms)
- ~~`kocaeli_merkez`~~ — 2026-05-18: HF_SCRAPER_SOURCES'tan ÇIKARILDI. Site 5+ gündür down (timeout), Scrapling de çözemiyor. Site geri gelince tekrar ekle.
- `yalova_resmi` (✅ 2026-05-18: direct fetch `socket closed` vermeye başladı → HF_SCRAPER_SOURCES'a eklendi, Scrapling ile **66 inserted**)
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
| kocaeli_merkez | Site sunucu DOWN (timeout) | 🚫 defaultEnabled: false (2026-05-13) + HF_SCRAPER_SOURCES'tan da çıkarıldı (2026-05-18). 5+ gün down. Site geri gelince ikisini de geri al |
| yalova_resmi | socket closed (2026-05-18) | ✅ HF_SCRAPER_SOURCES'a eklendi, Scrapling ile 66 inserted. (.env'de ETL_HEALTH_IGNORE_EMPTY_SOURCES=antalya_serik_antkomder,antalya_kumluca_antkomder — by-design 0 satır uyarısı susturuldu) |
| bolu_resmi | URL pattern degisti | ✅ 2026-05-13 fix: kategori sayfasi + haftalik-fiyat-listesi pattern destek |
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
import hmac, hashlib, base64, json, os, time
def b64url(d):
    if isinstance(d,str): d=d.encode()
    return base64.urlsafe_b64encode(d).rstrip(b\"=\"\").decode()
h=b64url(json.dumps({\"alg\":\"HS256\",\"typ\":\"JWT\"}))
p=b64url(json.dumps({\"sub\":\"4f618a8d-6fdb-498c-898a-395d368b2193\",\"role\":\"admin\",\"iat\":int(time.time()),\"exp\":int(time.time())+3600}))
s=hmac.new(os.environ[\"JWT_SECRET\"].encode(),\"{}.{}\".format(h,p).encode(),hashlib.sha256).digest()
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
