# Donmuş Hal Verisi Düzeltme Çeklisti

**Tespit:** 2026-07-20
**Karar (Orhan):** Veri **silinmeyecek**, düzeltilecek.
**Durum:** Faz 0 başlamadı.

---

## 1. Bulgu

Bursa, Eskişehir ve Denizli toptancı hallerinin verisi **2023-04-21 → 2026-04-21 arasında donmuş.** Tek bir Nisan 2023 anlık görüntüsü 1.097 gün boyunca her güne kopyalanmış.

| Hal | Günlük parmak izi (kayıt/toplam ₺) | Donuk gün | Seri | Donmuş seri |
|---|---|---|---|---|
| Denizli | 80 / 6.051,00 | 1.100 | 80 | %100 |
| Eskişehir | 92 / 6.020,73 | 1.095 | 92 | %100 |
| Bursa | 147 / 12.990,46 | 902 | 147 | %100 |

**Ölçek: 349.758 kayıt = `hf_price_history` tablosunun %34,5'i.**
Diğer tüm haller temiz (%0-1 donmuş seri). Üç hal de ~2026-04 ETL revizyonuyla gerçek veri üretmeye başladı.

### Teşhis sorgusu (tekrar çalıştırılabilir)
```sql
SELECT m.name, COUNT(*) seri, SUM(tekil=1) donmus, ROUND(100*SUM(tekil=1)/COUNT(*),0) yuzde
FROM (SELECT market_id, product_id, COUNT(DISTINCT avg_price) tekil, COUNT(DISTINCT recorded_date) gun
      FROM hf_price_history WHERE unit='kg' AND avg_price>0 AND recorded_date BETWEEN ? AND ?
      GROUP BY market_id, product_id HAVING gun>=100) t
JOIN hf_markets m ON m.id=t.market_id GROUP BY m.name HAVING seri>=10 ORDER BY yuzde DESC;
```

### Neden önemli
Bu, "+%356 soğan" ve "-%47,5 domates" hatalarının nihai kök nedeni ve yıllık kıyasın hiçbir yöntemle çalışmamasının cevabı — kıyaslanacak geçmişin üçte biri hiç var olmamış. Etkilenen yüzeyler: üç halin 3 yıllık grafikleri (düz çizgi), 2023-2026 ulusal ortalamalar, yıllık raporlar, `/analiz` raporları, ürün sayfaları, YoY.

### Düzeltmeyi mümkün kılan iki teknik gerçek
- **Unique key var:** `hf_ph_product_market_date_uq (product_id, market_id, recorded_date)` → backfill upsert ile donmuş satırın **üzerine yazar**. Silmeye gerek yok.
- **Wayback altyapısı var:** `modules/wayback-monitor/` zaten `web.archive.org` CDX API kullanıyor — geçmiş snapshot çekme deseni mevcut.

---

## 1b. "CANLI DONMA" ALARMI — YANLIŞ TEŞHİS ÇIKTI, GERÇEK SEBEP BULUNDU (2026-07-20)

İlk teşhis **"7 Temmuz'da başlayan yeni bir donma olayı"** idi. **Yanlıştı.** Dönem kıyası bunu çürüttü — bu haller zaten kronik yapışkan fiyatlı:

| Hal | 9–22 Haz | 23 Haz–6 Tem | 7–20 Tem |
|---|---|---|---|
| Konya | %68 | %78 | %71 |
| Kayseri | %61 | %52 | %57 |
| Kütahya | %81 | %82 | %80 |
| Bursa | %24 | %29 | %28 |

**Ders:** 14 günlük "hiç değişmedi" detektörü yapışkan fiyatlı hallerde yüksek yanlış-pozitif veriyor. Faz 4'teki dedektör **mutlaka kendi tarihsel taban oranıyla** kıyaslamalı, mutlak eşikle değil.

### Gerçek sebep: ÜRÜN EŞLEŞTİRME ÇAKIŞMASI (düzeltildi)

Kumluca kaynak sayfasında `Domates 25₺`, `Yuvarlak Domates 30₺`, `Oval Domates 35₺` varken DB'de tek satır vardı: `domates = 35,00`.

`normalizer.ts` alias haritası "ilk gelen kazanır" mantığıyla kuruluyordu ve kazananı **DB satır sırası** belirliyordu. Merge sırasında varyantın adı master'ın alias listesine ekleniyor ama varyant ürünü aktif kalıyor → iki ürün aynı anahtarı talep ediyor. `(ürün, hal, tarih)` unique key yüzünden son satır diğerlerini eziyordu; kaybolan satırlar seriyi "donmuş" gösteriyordu.

**Ölçek: 1.525 eşleştirme anahtarının 513'ü (%34) çakışıyordu, 653 ürün etkileniyordu.**

**Düzeltme:** iki geçişli harita — önce ürünlerin KENDİ adı, sonra alias'lar; slug'a göre sıralı gezinme ile kazanan belirlenimli. Varyant kendi kaydını tutar, aile toplaması zaten `canonical_slug` üzerinden yapılır.

**Doğrulanan kazanç** (aynı gün, yeniden çekim sonrası): Konya 111 → 155 ürün, Kayseri 112 → 128, Finike 13 → 19, Demre 17 → 22, Kumluca 13 → 19.

### Kayseri 110 ₺ — ÇÖZÜLDÜ (2026-07-20)
Kaynak sayfada **sade "Soğan Kuru" satırı yok**; olan satır `Soğan Kuru Arpacık 120/100 ₺ → 110`. Arpacığın gerçek fiyatı `sogan-kuru`'ya yazılıyordu.

```
2026-04-21 → 06-03 : 12–15 ₺    ← gerçek kuru soğan
2026-07-07 → 07-20 : 110,00 ₺   ← arpacık, yanlış eşleşme
```

**Başlangıç 7 Temmuz** — `8380af4e feat(etl): birim-kapsamlı eşleştirme anahtarı` (2026-07-06) commit'inin ertesi günü. Yani "7 Temmuz'da bir şey oldu" sezgisi DOĞRUYDU; mekanizma donma değil, eşleştirme regresyonuydu.

14 hayalet satır silindi. Ulusal soğan medyanı düzeldi (34–50 ₺ bandı, 110 aykırısı yok). Yayınlanmış soğan analizi **etkilenmedi** — orada Kayseri zaten elenmişti (rakamlar yeniden hesaplandı, birebir aynı).

### Yapıldı
- [x] Alias temizliği: 136 üründen 961 alias kaldırıldı; çakışma 513 → 54, etkilenen ürün 653 → 95. Yedek: `/tmp/alias_backup.sql`
- [x] Merge kodu düzeltildi: fiyat geçmişi artık taşınmıyor/silinmiyor, varyant adı master alias'ına eklenmiyor (çakışmanın tekrarını önler)
- [x] Endeks sepeti düzeltildi (4 hatalı slug + birim filtresi yok + kompozisyon kayması)
- [x] Endeks serisi 2026-20'ye rebase edildi; öncesi kaldırıldı (ürün başına ~2 hal, ulusal endeks değildi). Yedek: `/tmp/index_snapshots_backup.sql`

### Açık kalan
- [ ] **Genel hayalet taraması**: Kayseri dışında da eski yanlış eşleşmeden kalan satırlar var. Yöntem: her kaynağı çalıştır, dönen `touchedProductSlugs` ile o (hal, tarih) için DB'deki ürünleri karşılaştır, farkı sil
- [ ] Mükerrer ürünler: `sogan-kuru-taze`/`sogan-kuru-taze-kg`, `oval-domates`/`domates-oval`, `armut-s-maria`/`armut-santamaria`
- [ ] Kalan 54 alias çakışması (yazım hatası / farklı aile — elle karar gerektirir)

---

## Faz 0 — Karantina (yıkıcı değil, ACİL)

Gerçek veri gelene kadar uydurma veri yayından kalkmalı. Silme değil, sorgu düzeyinde dışlama.

- [x] `hf_market_blackouts` tablosu — `048_market_blackouts_schema.sql`
- [x] Üç hal kaydı girildi (günlük parmak izinden ölçülen bitiş tarihleriyle): Bursa `2026-04-21`, Denizli `2026-04-24`, Eskişehir `2026-04-19`
- [x] Drizzle şema tanımı `db/schema.ts` → `hfMarketBlackouts`
- [x] Ortak yardımcı: `modules/prices/blackouts.ts` → `blackoutFilter(dateCol, marketCol)` (5 dk cache)
- [ ] Uygula — **öncelik sırası** (görünürlüğe göre):
  - [ ] `modules/prices/movers.ts` (bülten + hareketler)
  - [ ] `modules/prices/seasonal.ts` (bülten mevsimlik)
  - [ ] `modules/prices/repository.ts` (ürün sayfaları, grafikler)
  - [ ] `modules/prices/weekly.ts`
  - [x] `modules/index/calculator.ts` (endeks) — baz hafta dahil uygulandı
  - [ ] `modules/annual-report/index.ts`
  - [ ] `modules/feeds/index.ts`
  - [ ] `modules/alerts/checker.ts`
  - [ ] `modules/telegram-bot/commands.ts`
  - [ ] `modules/firms/repository.ts`, `modules/listings/repo.ts`, `modules/hal-admin/index.ts`
- [ ] Doğrulama: karantina öncesi/sonrası ulusal medyan farkı ürün bazında raporlansın (beklenen: 2023-2026 aralığında belirgin değişim, 2026-05 sonrası değişim YOK)

> **Not:** Faz 0 geçici. Faz 2 başarılı olursa blackout kayıtları silinir, veri açılır.

---

## Faz 1 — Gerçek veri kaynağı fizibilitesi

Her hal için ayrı ayrı: geçmiş tarih verisi nereden alınır?

### 1.0 Kesin unfreeze tarihini bul (her hal için)
- [ ] Günlük parmak izi ile ilk gerçek gün: `CONCAT(COUNT(*),'_',ROUND(SUM(avg_price),2))` per (hal, tarih), ardışık tekrar biten gün
- [ ] Faz 0 blackout `to_date` değerlerini bu tarihlerle güncelle

### 1.1 Kaynak sitede tarih parametresi var mı?
Üçünde de `backfillEndpoint` **tanımlı değil**, düz endpoint kullanılıyor:

| Hal | Kaynak | Endpoint |
|---|---|---|
| Bursa | bursa.bel.tr | `/hal_fiyatlari` |
| Denizli | denizli.bel.tr | `/Default.aspx?k=halfiyatlari` (ASP.NET — ViewState POST ihtimali) |
| Eskişehir | eskisehir.bel.tr | `/hal-fiyatlari` |

- [ ] Bursa: tarih query param / arşiv sayfası var mı? (Bolu deseni: `/{DD-MM-YYYY}-...`)
- [ ] Denizli: ASP.NET postback ile tarih seçimi var mı? (hal.gov.tr deseni: ViewState + tarih POST — `fetchHalGovTrDated` referans)
- [ ] Eskişehir: liste/detay ID deseni var mı? (Tekirdağ deseni: `id:NNN` backfill)
- [ ] Belediyeye **resmi veri talebi** — 3 yıllık arşiv CSV/Excel olarak istenebilir (en temiz yol, denenmeden geçilmesin)

### 1.2 Wayback Machine fizibilitesi — YAPILDI (2026-07-20)

- [x] CDX envanteri çıkarıldı. **Tuzak:** Denizli'nin URL'i query string içeriyor
      (`Default.aspx?k=halfiyatlari`); onsuz arama 2 snapshot gösteriyor, doğrusuyla **29**.
      URL'i `matchType=exact` ve encode edilmiş query ile sorgula.
- [x] Snapshot HTML'i **parse ediliyor**. Bursa 2025-01-13 snapshot'ı: 174 satır,
      `ÜRÜN | BR | FİYAT (min - max ₺)` — bugünkü `bursa_html` parser'ının beklediği yapı.
      Sayfa içi tarih (13.01.2025) snapshot damgasıyla uyumlu, yani **hangi güne ait olduğu belli**.
      Gerçek fiyatlar görünüyor (Armut 10–50 ₺, Ayva 11–53 ₺) — donmuş veriden tamamen farklı.

**Kapsama (2023-01 → 2026-05, 43 ay):**

| Hal | Snapshot | Kapsanan ay | Oran |
|---|---|---|---|
| Bursa | 27 | 21 | %49 |
| Denizli | 29 | 22 | %51 |
| Eskişehir | 28 | 20 | %47 |

Sıklık **iki ayda bir** civarı — haftalık değil, güvenilir aylık bile değil. Bazı aylar 2-3
snapshot, bazıları boş.

### 1.3 Karar kapısı — DOLDURULDU

**Üç hal için de: KISMİ BACKFILL.**

Wayback'in verebileceği: hal başına **~20-22 gerçek gözlem günü** (toplam ~63 gün).
Veremeyeceği: günlük seri. 1.097 günün ~21'i dolar, 1.076'sı boş kalır.

**Ne işe yarar:**
- Ürün sayfalarındaki 3 yıllık grafik, düz yalan yerine **seyrek ama dürüst** bir seri olur
- Aylık/çeyreklik agregatlar için çıpa noktaları
- Temmuz 2025 kıyası: Denizli (1) ve Eskişehir (2) snapshot'ı var, Bursa'nın yok

**Ne işe yaramaz:**
- Günlük seri rekonstrüksiyonu
- Endeks (zaten 2026-20'ye rebase edildi, donma dönemi kapsam dışı)
- Sağlam YoY — bunun için asıl çözüm beklemek: 2026-05'ten itibaren kapsam iyi
  (ürün başına 8-11 hal), dolayısıyla **Mayıs 2027'de YoY kendiliğinden sağlam olacak**

**Kurtarılamayan aralıklar Faz 0 karantinasında KALIR** (silinmez, gizlenir).

> **Maliyet/fayda notu:** Faz 2 (wayback fetch altyapısı + tarihsel parser varyantı +
> kademeli backfill) ciddi bir iş; karşılığı 3 hal × ~21 gün. Karar Orhan'da. Alternatif:
> backfill'i atlayıp karantinayı kalıcı bırakmak ve Mayıs 2027'yi beklemek.

### 1.3 Karar kapısı
- [ ] Her hal için: **tam backfill / kısmi backfill / kurtarılamaz** kararı yazılı olarak bu dosyaya işlensin
- [ ] Kurtarılamayan aralıklar Faz 0 karantinasında **kalıcı** olarak kalır (silinmez, gizlenir)

---

## Faz 2 — Backfill uygulaması

- [ ] `etl-sources.ts`: ilgili hallere `backfillEndpoint` / tarih desteği ekle
- [ ] `fetcher.ts`: gerekiyorsa `fetchBursaDated` / `fetchDenizliDated` / `fetchEskisehirDated`
- [ ] Wayback yolu için ortak yardımcı: `fetchViaWayback(source, date)` — CDX'ten en yakın snapshot + mevcut parser
- [ ] **Önce tek gün, tek hal** ile dene; sonucu gerçek piyasa seviyesiyle karşılaştır (akran halleri: Konya/Ankara/İzmir/Mersin)
- [ ] Kademeli backfill: 1 ay → doğrula → 6 ay → doğrula → tam aralık
- [ ] Upsert donmuş satırın üzerine yazıyor mu, ilk günde doğrula (unique key sayesinde yazmalı)
- [ ] **Yedek:** backfill öncesi ilgili aralığın `mysqldump`'ı alınsın (geri dönüş için; silme yapmıyoruz ama üzerine yazıyoruz)

---

## Faz 3 — Doğrulama

- [ ] Donma teşhis sorgusu tekrar: üç hal için donmuş seri oranı **%0'a** inmeli
- [ ] Akran karşılaştırması: hal/akran oranı yıllar arası **sabit** olmalı (2025 ve 2026 sapması birbirine yakın). Bkz. hafıza `[[yillik-kiyas-veri-engeli]]` — eskiden Denizli 2,18x → 1,06x idi
- [ ] Zaman serisi görsel kontrolü: düz çizgi bitmiş, mevsimsel eğri görünüyor
- [ ] Yıllık kıyas yeniden ölçülsün: eşleşmiş çift sayısı ürün başına ≥5 oluyor mu?
- [ ] Olduysa: bültende **yıllık manşet** açılabilir (asıl hedef buydu) — `basket.ts` yoyPct alanları hazır bekliyor
- [ ] `/analiz` ve yıllık raporlar yeniden üretilsin (eski raporlar kirli veriyle yazılmıştı)

---

## Faz 4 — Tekrarını önle (bu adım atlanmasın)

Asıl skandal, 3 yıl boyunca kimsenin fark etmemesi. Tespit otomatikleşmeli.

- [x] **Donma dedektörü** — `modules/etl/freshness.ts` → `detectStaleSources()`. Günlük parmak izi (satır sayısı + fiyat toplamı) değişmeyen kaynaklar. **Eşik mutlak DEĞİL**, kaynağın kendi 180 günlük tabanına göre: Konya (%71) ve Kütahya (%80) kronik yapışkan fiyatlı; mutlak eşik ilk denemede yanlış alarm üretti.
- [x] **Sapma dedektörü** — `detectPriceJumps()`. Bir serinin akranlarına göre **konumunun kayması**. "Bu hal farklı" sinyal değil (Demre üretim bölgesi, salkım domates hep akran medyanının ~%15'i — doğru veri); anlamlı olan oranın kayması. Kayseri vakası: 0,33 → 2,4 (7 kat).
- [x] `etl-health.sh`'a "DONMUŞ SERİLER" bölümü — oturum başı kontrolde görünüyor
- [x] Admin endpoint: `GET /api/v1/admin/hal/etl/freshness` (tam denetim, kendi-taban kıyaslı)
- [ ] Telegram/e-posta uyarısı — dedektör hazır, bildirim kanalına bağlanacak
- [ ] Admin panelde kaynak sağlık kartına "son değişim tarihi" alanı

> **Yan bulgu (düzeltildi):** `etl-health.sh` `set -euo pipefail` yüzünden **sorun YOKKEN ölüyordu** — boş sorgu → `grep -v` exit 1 → pipefail. Rapor "Sorunlu Kaynaklar" başlığında kesiliyor, sonraki tüm bölümler (CLAUDE.md'nin bakmamızı söylediği "Veri Akışı Yok" dahil) hiç yazdırılmıyordu. Sağlık kontrolünün kendisi sessizce bozukmuş.

---

## Riskler / Tuzaklar

- **Bursa min/max makası çok geniş** (ort. 7,96x) — `avg_price` %79 oranında min-max orta noktası olduğu için Bursa'nın "ortalaması" gerçek veride bile şüpheli. `MAX_MINMAX_SPREAD=3` filtresi devrede ama Bursa için ayrıca bakılmalı. Bkz. `[[yillik-kiyas-veri-engeli]]`
- **`CENT_SCALED_SOURCES` notu:** `bursa_resmi` 2026-06-09'da listeden çıkarıldı (TL raporluyor, kuruş değil). Tarihsel snapshot'larda birim farklı olabilir — backfill'de birim doğrulaması şart.
- **Parser sürüm kayması:** 3 yıllık snapshot'lar bugünkü HTML yapısında olmayabilir; sessizce 0 satır dönmesi "başarılı" sanılmasın.
- **Wayback rate limit** — kademeli çekim, retry, `scraper-service` üzerinden geçiş değerlendirilsin.
- **Karantina yarım kalırsa** veri bazı sayfalarda gizli bazı sayfalarda görünür olur → tutarsızlık. Faz 0 tamamlanmadan Faz 2'ye geçilmesin.

---

## İlgili

- Hafıza: `[[yillik-kiyas-veri-engeli]]`, `[[haftalik-bulten-metodolojisi]]`
- Kod: `modules/etl/fetcher.ts`, `config/etl-sources.ts`, `modules/prices/movers.ts`, `modules/wayback-monitor/`
- Sağlık: `backend/scripts/etl-health.sh`
