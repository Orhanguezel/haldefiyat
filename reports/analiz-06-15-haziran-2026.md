# HalDeFiyat Trafik Analizi — 6–15 Haziran 2026 (10 gün)

> Kaynak: VPS `/var/log/nginx/haldefiyat.access.log*` (dedike erişim logu). Üretim: 2026-06-15 (VPS UTC 19:59).
> **Devam raporu:** `analiz-31-mayis-05-haziran-2026` raporunun devamı — 5 Haziran sonrası trafik.
> Not: **15 Haziran ~20 saatlik kısmi gün** (UTC 19:59'a kadar); diğer 9 gün tam.

## Özet Tablo

| Metrik | Değer |
|---|---|
| Toplam istek | **317,045** |
| İnsan trafik (istek*) | **295,552** (%93.2) |
| Bot/Crawler trafik | **21,493** (%6.8) |
| Günlük ort. insan trafik (tam günler, 6–14 Haz) | **29,424/gün** |
| Mobil / Masaüstü (insan) | **%74 / %26** |
| Google Ads tıklama (gclid, request) | **3,505 istek** |
| → benzersiz IP (reklam tıklayan) | **1,194** |
| ★ Gerçek JS pageview | **4,858** (tam günler ~**490/gün**) |

\* İstek sayısı, ziyaretçi değil. Gerçek engaged insan ≈ **490 pageview/gün** (track beacon).

## Öncesi / Sonrası — 3 dönem trend

| Metrik | 31 May–5 Haz | 1–8 Haz | **6–15 Haz (bu)** | Trend |
|---|---|---|---|---|
| Günlük insan istek | 24,904 | 25,570 | **29,424** | **+%18** ↗ |
| Gerçek JS pageview/gün | ~383 | ~425 | **~490** | **+%28** ↗ |
| Mobil oran | %66 | %70 | **%74** | +8 puan ↗ |
| 5xx hata (dönem toplamı) | 2 | ihmal | **32** | ↗ (admin kaynaklı) |
| google.com referrer | 1,245 | — | **2,737** | **2.2×** ↗ |

Büyüme üç dönemdir kesintisiz: ham istek, **gerçek engaged pageview** ve organik arama referansı (google.com 2.2×) birlikte artıyor. Mobil kayması kalıcı.

> ⚠️ **Not:** "İnsan trafik" = HTTP **istek** sayısı, ziyaretçi değil. Normalde 1 pageview ≈ 3–5 istek; gerçek engaged insan göstergesi `track/pageview` beacon'ı = **~490/gün**. "29 bin insan/gün" istek hacmidir, 29 bin kişi değil. (Detaylı huni mantığı için önceki rapora bak.)

## Günlük Trafik

| Tarih | İnsan | Bot | Toplam | Uniq IP | Mobil% |
|---|---|---|---|---|---|
| 6 Haz | 23,836 | 1,965 | 25,801 | 322 | %76 |
| 7 Haz | 24,609 | 2,269 | 26,878 | 442 | %78 |
| 8 Haz | 33,500 | 2,429 | 35,929 | 500 | %76 |
| 9 Haz | 32,750 | 2,414 | 35,164 | 542 | %77 |
| 10 Haz | 31,107 | 2,055 | 33,162 | 1,069 | %71 |
| 11 Haz | 32,791 | 1,706 | 34,497 | 535 | %73 |
| 12 Haz | 27,377 | 2,656 | 30,033 | 628 | %66 |
| 13 Haz | 23,363 | 2,192 | 25,555 | 548 | %74 |
| 14 Haz | 35,487 | 2,003 | 37,490 | 679 | %76 |
| 15 Haz* | 30,732 | 1,804 | 32,536 | 480 | %71 |
| **TOPLAM** | **295,552** | **21,493** | **317,045** | — | **%74** |

\* 15 Haz kısmi (~20 saat).

- En yüksek gün: **14 Haz (35,487 insan)**, ardından 8 Haz (33,500) ve 11 Haz (32,791). En düşük: 13 Haz (23,363, Cumartesi etkisi).
- 10 Haz uniq IP **1,069** ile sıçradı (CGNAT havuzu değişimi / mobil operatör IP rotasyonu — anomali, ziyaretçi sayısı değil).

## Saatlik Dağılım (insan, UTC — TR = +3)
- Tepe: **10:00 UTC (13:00 TR) = 23,201**, ardından 11:00 (20,897) ve 13:00 (20,183).
- Öğle–öğleden sonra bandı (08–15 UTC / 11–18 TR) yoğun; gece düşük. Tarım/hal aktörlerinin gün içi fiyat kontrolü ritmiyle uyumlu.

## HTTP Sağlık (durum kodları, 10 gün)

| Kod | İstek | Açıklama |
|---|---|---|
| 200 | 294,395 (%91.6) | Başarılı |
| 301 | 12,022 | Kalıcı yönlendirme |
| 204 | 4,853 | İçerik yok (track beacon) |
| 304 | 2,919 | Cache |
| 404 | 1,961 (%0.61) | Bulunamadı |
| 499 | 762 | İstemci kapattı |
| 308 | 344 | Kalıcı (POST) |
| 400 | 32 | Hatalı istek |
| **500** | **27** | **Sunucu hatası (admin analytics)** |
| 206 | 26 | Kısmi içerik |
| 401 | 12 | Yetkisiz |
| **502** | **5** | **Backend kapalı (geçici)** |

**5xx toplam: 32** (27×500 + 5×502) / 317,045 = **%0.01**. Backend genel olarak sağlam, ancak 5xx önceki dönemlerden (2) yükseldi — kaynağı **public değil**: 500'lerin çoğu admin analytics endpoint'leri (`/api/v1/admin/analytics/funnel`, `ads-daily`, `ads-attribution`) — yapımı süren analytics paneli (Madde 11.5) hata veriyor. Public 500'ler bir-iki geçici `/api/v1/prices` çağrısı.

## Bot / AI Crawler Dağılımı (UA, 10 gün)
- **petalbot 6,480** (Huawei — agresif, yeni #1 gürültü kaynağı) · yandex 3,936 · googlebot 3,243 · applebot 2,412 · ahrefsbot 1,823 · bingbot 904
- **AI motor crawler:** gptbot 1,902 · oai-searchbot 689 · claudebot 574 → toplam **~3,165 hit**
- ⚠️ claudebot önceki döneme göre düştü (3,355 → 574); buna karşılık **petalbot** patladı. PetalBot SEO değeri düşük → robots/rate-limit değerlendirilebilir (bant genişliği).

## Google Ads (gclid) Landing
- `/` (ana sayfa) **1,119** · POST track 1,311 · `/hal/antalya-hal-merkez` 131 · `/hal/istanbul-hal-ibb` 127 · **`/fiyatlar` 105** (önceki dönem yalnızca 41 → artış) · `/urun/domates` 101 · `/hal/mersin-hal` 101 · `/urun/sarimsak` 78
- ✅ **İyileşme:** Ads artık `/hal/*` ve `/urun/*` derin sayfalarına da düşüyor (önceden neredeyse tamamı `/` idi).
- ⚠️ **Ama `/` hâlâ #1 landing** — newsletter CTA'lı `/canli-hal-fiyatlari` veya `/fiyatlar`'a yönlendirme aksiyonu **hâlâ tam kapanmadı**.

## Dış Referrer (insan)
- **www.google.com 2,737** (önceki 1,245 → **2.2×**, organik arama görünürlüğü güçleniyor) · youtube.com 103 · googleads.doubleclick 56 · google.com.tr 34 · yandex 33
- Spam (yok sayıldı): eatopiablog (51), dreametrip (30), comfortweather (21), aveuka (10), aisearchindex (8).

---

## ⚠️ HATALAR / BULGULAR

### 1. 🟡 Admin analytics endpoint'leri 500 veriyor (yeni)
`/api/v1/admin/analytics/funnel`, `ads-daily`, `ads-attribution` → 500 (her biri ×2+). Bunlar **yapımı süren admin analytics paneli** (Madde 11.5 retention/cohort işleri). Public kullanıcıyı etkilemiyor ama dashboard kırık.
- **Aksiyon:** Bu endpoint'lerin query/DB katmanı kontrol edilmeli (muhtemelen eksik kolon/tablo veya boş veri seti üzerinde hata). Madde 11 akışına dahil.

### 2. 🟡 `/urun/*` 404 — bozuk slug kalıntısı (öncekinin devamı, azaldı)
261 adet `/urun/*` 404 (56 mobil + 206 masaüstü). **Ama referer'ların 185'i `-`** (prefetch/bot/`?_rsc=` RSC prefetch) → sadece ~54'ü gerçek iç sayfadan (`/fiyatlar` 17, `/` 25, `/hal/*` 12).
- Kalan bozuk slug'lar önceki rapordakilerle aynı: `bezelye-taze`, `e-kulak`, `ucburun-koy-b`, `yesil-dolma-b`, `zeytin`.
- Gerçek-kullanıcı 404 hacmi düştü (önceki ~115/6 gün → ~54/10 gün). **P1 kısmen açık ama öncelik düştü** — slug normalize fix'i çoğu vakayı çözmüş görünüyor, kalanlar uç/kesik slug'lar.

### 3. 🟢 PetalBot bant genişliği gürültüsü (opsiyonel aksiyon)
PetalBot 6,480 hit ile tüm crawler'ların başında — SEO/indeks değeri yok (Huawei Petal Search, TR'de marjinal). `robots.txt` ile crawl-delay veya disallow düşünülebilir.

### 4. 🟢 Backend stabil, public hata yok
Public 5xx pratik olarak sıfır (geçici birkaç `/prices` 500). 502'ler (5 adet) kısa upstream reset'leri.

---

## Aksiyon Listesi (öncelik sırası)
1. **[P1]** Admin analytics 500'leri düzelt (`funnel` / `ads-daily` / `ads-attribution`) — dashboard çalışmıyor, Madde 11.5 bağımlı.
2. **[P2]** Google Ads landing'i `/` → `/canli-hal-fiyatlari` / `/fiyatlar` (newsletter CTA, bounce↓). Kısmi iyileşme var ama `/` hâlâ #1.
3. **[P3]** Kalan bozuk `/urun/` slug'larını (bezelye-taze, e-kulak, ucburun-koy-b, yesil-dolma-b) kaynağında düzelt — düşük hacim.
4. **[P3]** PetalBot için robots.txt crawl-delay/disallow değerlendir (bant genişliği).
5. **[devam]** Newsletter aktivasyonu — funnel'ın son halkası; organik (google 2.2×) + Ads trafiği artarken abone yakalama hâlâ kritik.

## Genel Durum: 🟢 SAĞLIKLI + İVMELENEREK BÜYÜYOR
- 3 dönemdir kesintisiz büyüme: insan istek **+%18** (29,424/gün), gerçek pageview **+%28** (~490/gün), organik referrer **2.2×**.
- Mobil %74 kalıcı; saatlik ritim öğle-öğleden sonra (TR 13–18) yoğunlaşıyor.
- Public backend sağlam (5xx %0.01); tek somut teknik borç **admin analytics paneli 500'leri** (public dışı, yapım aşaması).
