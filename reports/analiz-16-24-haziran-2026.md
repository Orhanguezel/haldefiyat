# HalDeFiyat Trafik Analizi — 16–24 Haziran 2026 (8 tam gün)

> Kaynak: VPS `/var/log/nginx/haldefiyat.access.log*` (dedike erişim logu). Üretim: 2026-06-24 (VPS UTC ~00:45).
> **Devam raporu:** `analiz-06-15-haziran-2026` raporunun devamı — 15 Haziran sonrası trafik.
> Not: Analiz **16–23 Haziran (8 tam gün)** üzerinedir. **24 Haziran** raporun çekildiği an itibarıyla yalnızca ~45 dakikalık (451 istek) olduğu için tablo dışı bırakıldı (kısmi gün).

## Özet Tablo

| Metrik | Değer |
|---|---|
| Toplam istek | **348,426** |
| İnsan trafik (istek*) | **329,678** (%94.6) |
| Bot/Crawler trafik | **18,748** (%5.4) |
| Günlük ort. insan trafik (8 tam gün, 16–23 Haz) | **41,210/gün** |
| Mobil / Masaüstü (insan) | **%64 / %36** |
| Google Ads tıklama (gclid, request) | **2,695 istek** |
| → benzersiz IP (reklam tıklayan) | **877** |
| ★ Gerçek JS pageview | **4,908** (~**614/gün**) |

\* İstek sayısı, ziyaretçi değil. Gerçek engaged insan ≈ **614 pageview/gün** (track beacon).

## Öncesi / Sonrası — 4 dönem trend

| Metrik | 1–8 Haz | 6–15 Haz | **16–23 Haz (bu)** | Trend |
|---|---|---|---|---|
| Günlük insan istek | 25,570 | 29,424 | **41,210** | **+%40** ↗↗ |
| Gerçek JS pageview/gün | ~425 | ~490 | **~614** | **+%25** ↗ |
| Mobil oran | %70 | %74 | **%64** | **−10 puan** ↘ |
| 5xx hata (dönem toplamı) | ihmal | 32 | **321** | **↗↗ (admin analytics)** |
| google.com referrer | — | 2,737 | **3,427** | **1.25×** ↗ |

Büyüme ivmesi belirgin biçimde arttı: günlük insan istek **+%40** sıçradı, gerçek engaged pageview ~614/gün ile yeni zirvede, organik arama referansı (google.com) dördüncü dönemdir kesintisiz yükseliyor. **Üç dikkat noktası var:** (1) mobil oran %74'ten %64'e geriledi — sebebi yüksek hacimli iki günde (16 & 23 Haz) masaüstü ağırlığının artması; (2) 5xx hataları 32'den 321'e fırladı — kaynağı **public değil**, admin analytics 500'leri (aşağıda); (3) PetalBot gürültüsü 6,480'den 257'ye çöktü (olumlu).

> ⚠️ **Not:** "İnsan trafik" = HTTP **istek** sayısı, ziyaretçi değil. Normalde 1 pageview ≈ 3–5 istek; gerçek engaged insan göstergesi `track/pageview` beacon'ı = **~614/gün**. "41 bin insan/gün" istek hacmidir, 41 bin kişi değil. (Detaylı huni mantığı için önceki raporlara bak.)

## Günlük Trafik

| Tarih | Gün | İnsan | Bot | Toplam | Uniq IP | Mobil% |
|---|---|---|---|---|---|---|
| 16 Haz | Sal | 50,253 | 3,016 | 53,269 | 878 | %45 |
| 17 Haz | Çar | 39,237 | 2,205 | 41,442 | 726 | %62 |
| 18 Haz | Per | 36,416 | 2,294 | 38,710 | 647 | %70 |
| 19 Haz | Cum | 29,462 | 2,238 | 31,700 | 531 | %77 |
| 20 Haz | Cmt | 34,457 | 2,841 | 37,298 | 738 | %67 |
| 21 Haz | Paz | 36,508 | 2,701 | 39,209 | 661 | %71 |
| 22 Haz | Pzt | 48,079 | 1,668 | 49,747 | 851 | %68 |
| 23 Haz | Sal | 55,266 | 1,785 | 57,051 | 1,253 | %59 |
| **TOPLAM** | | **329,678** | **18,748** | **348,426** | — | **%64** |

- En yüksek gün: **23 Haz (55,266 insan)**, ardından 16 Haz (50,253) ve 22 Haz (48,079). En düşük: 19 Haz (29,462, Cuma).
- **Hafta sonu çukuru kaybolmuş:** 20–21 Haz (Cmt–Paz) 34–36 bin ile hafta ortası seviyesinde; tarım/hal aktörleri için fiyat takibi 7 gün sürüyor.
- 23 Haz uniq IP **1,253** ile sıçradı (önceki dönemdeki 10 Haz 1,069 ile aynı pattern — CGNAT havuzu / mobil operatör IP rotasyonu, ziyaretçi sayısı değil).
- 16 Haz (%45) ve 23 Haz (%59) mobil oranı düşük; bu iki gün aynı zamanda en yüksek hacimli günler — yüksek trafik masaüstü/ofis kaynaklı kontrolle geliyor.

## Saatlik Dağılım (insan, UTC — TR = +3)
- Tepe: **09:00 UTC (12:00 TR) = 22,661**, hemen ardından 08:00 (22,618).
- **İki tepeli ritim:** Sabah bandı 06–10 UTC (09–13 TR) en yoğun; ayrıca **17:00 UTC (20:00 TR) = 19,902** ile belirgin bir akşam tepesi oluştu (önceki dönemde tek tepe vardı). Akşam saatlerinde mobil fiyat kontrolü güçleniyor.
- Gece (00–03 UTC / 03–06 TR) en düşük. Genel ritim tarım/hal aktörlerinin gün içi + akşam fiyat kontrolüyle uyumlu.

## HTTP Sağlık (durum kodları, dönem)

| Kod | İstek | Açıklama |
|---|---|---|
| 200 | 314,809 (%90.3) | Başarılı |
| 301 | 23,501 | Kalıcı yönlendirme (SEO konsolidasyonu + RSC prefetch) |
| 204 | 4,887 | İçerik yok (track beacon) |
| 304 | 3,188 | Cache |
| 404 | 672 (%0.19) | Bulunamadı |
| 499 | 724 | İstemci kapattı |
| 410 | 347 | Gone (ölü ürün redirect'leri — by-design) |
| 308 | 320 | Kalıcı (POST) |
| **500** | **298** | **Sunucu hatası (admin analytics)** |
| 400 | 32 | Hatalı istek |
| 401 | 31 | Yetkisiz |
| 206 | 20 | Kısmi içerik |
| **502** | **23** | **Backend kapalı (geçici)** |

**5xx toplam: 321** (298×500 + 23×502) / 348,426 = **%0.09**. Önceki dönemde 32 idi → **10 kat arttı**. Kaynağı **public değil**: 500'lerin neredeyse tamamı admin analytics endpoint'leri (`/api/v1/admin/analytics/funnel`, `ads-daily`, `ads-attribution`) — yapımı süren analytics paneli (Madde 11.5) hâlâ hata veriyor ve dönem boyunca daha sık çağrıldığı için sayı büyüdü. 502'ler (23) kısa upstream reset'leri. Public 5xx pratik olarak sıfır.

- **301 = 23,501** yüksek ama beklenen: ürün aile konsolidasyonu 301'leri + Next.js `?_rsc=` prefetch'leri yönlendirmeye takılıyor. **410 = 347** ise ölü ürün sayfalarının "Gone" dönüşü — kurgulandığı gibi çalışıyor.

## Bot / AI Crawler Dağılımı (UA, dönem)
- **googlebot 3,932** (önceki 3,243 → **+%21**, indeksleme hızlanıyor) · yandex 2,982 · applebot 828 · bingbot 773 · **petalbot 257** · ahrefsbot 151
- **AI motor crawler:** oai-searchbot 656 · claudebot 288 · gptbot 257 → toplam **~1,201 hit**
- ✅ **PetalBot çöktü:** 6,480 → 257 (önceki raporda #1 gürültü kaynağıydı; robots aksiyonuna gerek kalmadan kendiliğinden geri çekildi).
- ✅ **Googlebot arttı** (+%21) — organik indeksleme ivmesi google.com referrer artışıyla (1.25×) uyumlu.
- ⚠️ AI crawler hacmi düştü (3,165 → 1,201); buna karşılık **AI arama referansı** ilk kez görünür oldu (aşağıda: chatgpt.com, copilot).

## Google Ads (gclid) Landing
- POST track 983 · `/` (ana sayfa) **770** · `/hal/istanbul-hal-ibb` 198 · **`/fiyatlar` 90** · `/hal/mersin-hal` 75 · `/urun/domates` 64 · `/hal/antalya-hal-merkez` 59 · `/urun/sarimsak` 50 · `/urun/bezelye` 45 · `/urun/salatalik` 44 · `/urun/sogan-kuru` 33 · `/urun/karpuz` 31 · `/urun/sarimsak-taze` 27 · `/urun/marul` 26 · `/hal/ankara-hal` 25
- ✅ Ads derin sayfalara (`/hal/*` ve `/urun/*`) dağılmaya devam ediyor; mevsimsel ürünler (karpuz, kavun, kiraz, erik) landing'lerde belirdi.
- ⚠️ **`/` hâlâ #1 gerçek landing (770)** — newsletter CTA'lı `/canli-hal-fiyatlari` veya `/fiyatlar`'a yönlendirme aksiyonu **hâlâ tam kapanmadı** (P2, üç dönemdir açık).

## Dış Referrer (insan)
- **www.google.com 3,427** (önceki 2,737 → **1.25×**, organik görünürlük dördüncü dönemdir artıyor) · googleads.doubleclick 73 · myactivity.google 39 · yandex.com.tr 39 · youtube.com 38 · google.com.tr 29 · yandex.ru 11 · fbapp 10
- 🆕 **AI arama referansı ilk kez:** chatgpt.com 4 · copilot.microsoft.com 1 · (ek: duckduckgo, baidu, yahoo, startpage tekil). GEO/AI görünürlüğü henüz minik ama sıfırdan çıktı.
- Bu dönem belirgin spam referrer yok (önceki dönemdeki eatopiablog/dreametrip vb. temizlenmiş görünüyor).

---

## ⚠️ HATALAR / BULGULAR

### 1. 🔴 Admin analytics 500'leri 10 kat arttı (yükseldi)
`/api/v1/admin/analytics/funnel`, `ads-daily`, `ads-attribution` → 500 (dönem toplamı **298**, önceki 27). Bunlar **yapımı süren admin analytics paneli** (Madde 11.5 retention/cohort işleri). Public kullanıcıyı etkilemiyor ama dashboard tamamen kırık ve her ziyarette tekrar tetiklenip log/Sentry kirletiyor.
- **Aksiyon [P1]:** Query/DB katmanını düzelt (muhtemelen eksik kolon/tablo veya boş veri seti üzerinde hata). Önceki dönemde P1'di, **hacim büyüdüğü için artık öncelikli**.

### 2. 🟢 PetalBot gürültüsü kendiliğinden bitti
Önceki raporda 6,480 hit ile #1 crawler'dı, robots crawl-delay aksiyonu önerilmişti. Bu dönem **257**'ye düştü — **aksiyona gerek kalmadı**, P3 kapanabilir.

### 3. 🟡 `/urun/*` 404 — bozuk slug kalıntısı (azalmaya devam)
404 toplam 672 (önceki dönem 1,961). Gerçek-kullanıcı `/urun/*` 404 hacmi düşüktür (çoğu `?_rsc=` RSC prefetch / bot, referer `-`). Slug normalize fix'i vakaların büyük kısmını çözmüş durumda.
- **Aksiyon [P3]:** Kalan kesik/uç slug'lar düşük hacim — öncelik düşük.

### 4. 🟡 Mobil oran %74 → %64 geriledi (izle)
Sebep tek bir kalıcı kayma değil: en yüksek hacimli iki gün (16 Haz %45, 23 Haz %59) masaüstü ağırlıklı geldi; ara günler hâlâ %67–77 mobil. Yine de iki dönemdir mobil zirvesinden (%74) geri çekilme var.
- **Aksiyon [izle]:** Bir dönem daha takip; kalıcılaşırsa masaüstü trafiğin kaynağı (organik mi, belirli saat/IP bloğu mu) ayrıştırılmalı.

### 5. 🟢 Backend public tarafı stabil
Public 5xx pratik olarak sıfır. 502'ler (23 adet) kısa upstream reset'leri. Tüm 5xx yükü admin analytics kaynaklı (Bulgu 1).

---

## Aksiyon Listesi (öncelik sırası)
1. **[P1]** Admin analytics 500'leri düzelt (`funnel` / `ads-daily` / `ads-attribution`) — dönem boyunca 298 hata, dashboard çalışmıyor, Madde 11.5 bağımlı. **Önceki dönemden eskaleli.**
2. **[P2]** Google Ads landing'i `/` → `/canli-hal-fiyatlari` / `/fiyatlar` (newsletter CTA, bounce↓). `/` hâlâ #1 landing (770) — üç dönemdir açık.
3. **[izle]** Mobil oran düşüşü (%74→%64) — bir dönem daha takip, kalıcılaşırsa masaüstü kaynak analizi.
4. **[P3-kapandı]** PetalBot robots aksiyonu — gürültü kendiliğinden bittiği için iptal.
5. **[devam]** Newsletter aktivasyonu — funnel'ın son halkası; organik (google 1.25×) + Ads trafiği artarken abone yakalama hâlâ kritik.
6. **[fırsat]** AI arama referansı ilk kez göründü (chatgpt/copilot) — GEO içerik yatırımı için erken sinyal.

## Genel Durum: 🟢 SAĞLIKLI + HIZLANARAK BÜYÜYOR
- Büyüme ivmelendi: günlük insan istek **+%40** (41,210/gün), gerçek pageview **+%25** (~614/gün), organik referrer dördüncü dönemdir artışta (google **1.25×**).
- Ritim iki tepeli: sabah (TR 11–13) + yeni akşam tepesi (TR 20:00). Hafta sonu çukuru kaybolmuş.
- Mobil %74→%64 geriledi (yüksek hacimli iki gün masaüstü ağırlıklı) — izlemede.
- Public backend sağlam (public 5xx ≈ 0); tek somut teknik borç **admin analytics paneli 500'leri** (public dışı, yapım aşaması) — bu dönem 10 kat artarak P1'e eskale.
