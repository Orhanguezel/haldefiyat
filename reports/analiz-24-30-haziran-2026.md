# HalDeFiyat Trafik Analizi — 24–30 Haziran 2026 (6 tam gün)

> Kaynak: VPS `/var/log/nginx/haldefiyat.access.log*` (dedike erişim logu). Üretim: 2026-06-30 (VPS logları).
> **Devam raporu:** `analiz-16-24-haziran-2026` raporunun devamı.
> Not: Analiz **24–29 Haziran (6 tam gün)** üzerinedir. **30 Haziran** raporun çekildiği an itibarıyla kısmi gün olduğu için tablo dışı bırakıldı (rapor anında 13,983 istek).

## Özet Tablo

| Metrik | Değer |
|---|---|
| Toplam istek | **246,108** |
| İnsan trafik (istek*) | **234,195** (%95.2) |
| Bot/Crawler trafik | **11,913** (%4.8) |
| Günlük ort. insan trafik (6 tam gün) | **39,032/gün** |
| Mobil / Masaüstü (insan) | **%70 / %30** |
| Google Ads tıklama (gclid, request) | **1,690 istek** |
| → benzersiz IP (reklam tıklayan) | **545** |
| ★ Gerçek JS pageview | **3,486** (~**581/gün**) |

\* İstek sayısı, ziyaretçi değil. Gerçek engaged insan ≈ **581 pageview/gün** (track beacon).

## Öncesi / Sonrası — 5 dönem trend

| Metrik | 6–15 Haz | 16–23 Haz | **24–29 Haz (bu)** | Trend |
|---|---|---|---|---|
| Günlük insan istek | 29,424 | 41,210 | **39,032** | **−%5** ↘ |
| Gerçek JS pageview/gün | ~490 | ~614 | **~581** | **−%5** ↘ |
| Mobil oran | %74 | %64 | **%70** | **+6 puan** ↗ |
| 5xx hata (dönem toplamı) | 32 | 321 | **4** | **−%99** ✅ |
| google.com referrer/gün | ~274 | ~428 | **~503** | **+%17** ↗ |

Trafik 16–23 Haziran'daki zirveden hafif gevşedi ama yeni taban hâlâ güçlü: günlük insan istek **39 bin/gün**, gerçek engaged pageview **~581/gün**. Asıl olumlu sinyal, mobil oranın **%70'e toparlanması** ve 5xx hatalarının neredeyse tamamen bitmesi. Organik Google referansı dönem toplamında daha düşük görünse de dönem 6 gün olduğu için günlük bazda **~503/gün** ile önceki dönemin üstünde.

> ⚠️ **Not:** "İnsan trafik" = HTTP **istek** sayısı, ziyaretçi değil. Normalde 1 pageview ≈ 3–5 istek; gerçek engaged insan göstergesi `track/pageview` beacon'ı = **~581/gün**. "39 bin insan/gün" istek hacmidir, 39 bin kişi değil.

## Günlük Trafik

| Tarih | Gün | İnsan | Bot | Toplam | Uniq IP | Mobil% |
|---|---|---|---|---|---|---|
| 24 Haz | Çar | 52,415 | 2,171 | 54,586 | 1,524 | %73 |
| 25 Haz | Per | 46,085 | 2,258 | 48,343 | 1,111 | %77 |
| 26 Haz | Cum | 37,341 | 1,630 | 38,971 | 1,419 | %75 |
| 27 Haz | Cmt | 38,095 | 1,737 | 39,832 | 1,603 | %72 |
| 28 Haz | Paz | 30,713 | 2,164 | 32,877 | 1,503 | %62 |
| 29 Haz | Pzt | 29,546 | 1,953 | 31,499 | 2,258 | %55 |
| **TOPLAM** | | **234,195** | **11,913** | **246,108** | — | **%70** |

- En yüksek gün: **24 Haz (52,415 insan)**, ardından 25 Haz (46,085). En düşük gün: **29 Haz (29,546)**.
- 24–25 Haziran önceki zirvenin devamı gibi çalışıyor; 26–27 Haziran 37–38 bin bandında dengeleniyor, 28–29 Haziran ise belirgin düşüş var.
- Uniq IP 29 Haziran'da **2,258** ile zirve yapmasına rağmen insan istek en düşük seviyede. Bu, tek başına ziyaretçi artışı değil; mobil operatör/CGNAT IP rotasyonu veya kısa oturumlu geniş dağılım olabilir.
- Gerçek JS pageview günlük akışı: 24 Haz 768 · 25 Haz 735 · 26 Haz 613 · 27 Haz 518 · 28 Haz 415 · 29 Haz 437. Hafta sonu ve pazartesi gerçek etkileşim düşüyor ama tamamen kopmuyor.

## Saatlik Dağılım (insan, UTC — TR = +3)

- Tepe: **12:00 UTC (15:00 TR) = 17,089**.
- Önceki dönemdeki öğle + akşam çift tepeli ritim bu dönemde daha çok öğleden sonra bandına kaydı. TR 12:00–16:00 aralığı ana kullanım penceresi; akşam kontrolü sürse de 16–23 Haziran'daki kadar keskin değil.

## HTTP Sağlık (durum kodları, dönem)

| Kod | İstek | Açıklama |
|---|---|---|
| 200 | 221,834 | Başarılı |
| 301 | 16,685 | Kalıcı yönlendirme |
| 204 | 3,475 | İçerik yok (track beacon) |
| 304 | 2,294 | Cache |
| 404 | 1,043 | Bulunamadı |
| 499 | 406 | İstemci kapattı |
| 308 | 293 | Kalıcı (POST) |
| 410 | 39 | Gone (ölü ürün redirect) |
| 206 | 13 | Kısmi içerik |
| 400 | 11 | Hatalı istek |
| 302 | 6 | Geçici yönlendirme |
| 502 | 4 | Backend kapalı (geçici) |
| 307 | 3 | Geçici (POST) |
| 201 | 2 | Oluşturuldu |

**5xx toplam: 4** / 246,108 = **%0.00**. Önceki dönemdeki 321 hatadan sonra belirgin toparlanma var. Bu dönem 5xx yalnızca **4 adet 502 `/`** kaydı; admin analytics kaynaklı 500 fırtınası görünmüyor. Public taraf sağlık açısından temiz.

- **404 toplam 1,043 (%0.42)**: başlıca kaynaklar `/.well-known/traffic-advice` (120), eski Next.js CSS chunk'ları (104 + 23), WordPress kurulum taramaları (90), `/api/fiyat` (24) ve `.env/.git` tarama denemeleri. Kritik ürün slug 404'ü yerine daha çok bot/stale asset gürültüsü.
- **410 = 39**: ölü ürün redirect/gone kurgusu önceki döneme göre çok azalmış ve beklenen davranışta.

## Bot / AI Crawler Dağılımı (UA, dönem)

- googlebot 2,177 · yandex 1,255 · ahrefsbot 1,147 · bingbot 538 · applebot 160
- **AI motor crawler:** oai-searchbot 670 · claudebot 199 · gptbot 55 → toplam **~924 hit**
- Googlebot günlük bazda önceki döneme göre sakinleşti (3,932/8 gün → 2,177/6 gün). Buna karşılık **AhrefsBot 151 → 1,147** ile belirgin arttı; SEO araç taraması yükselmiş.
- AI crawler hacmi toplamda düşük görünse de günlük ortalama neredeyse aynı: 16–23 Haziran ~150/gün, bu dönem ~154/gün. OAI-SearchBot görünürlüğü korunuyor.

## Google Ads (gclid) Landing

- `/api/v1/track/pageview` 608 · `/` 457 · `/hal/istanbul-hal-ibb` 136 · `/fiyatlar` 78 · `/hal/ankara-hal` 60 · `/urun/domates` 53 · `/hal/mersin-hal` 37 · `/urun/salatalik` 30 · `/urun/karpuz` 30 · `/urun/sogan-kuru` 21 · `/hal/antalya-hal-merkez` 20 · `/urun/mersin-yaban-mersini-mersin-yaban-mersini` 18 · `/urun/patates` 16 · `/urun/limon` 14 · `/urun/bezelye` 11 · `/urun/sarimsak-taze` 11
- Ads hacmi günlük bazda geriledi: önceki dönem **~337 gclid/gün**, bu dönem **~282/gün**. Üstelik dağılım sert biçimde ilk 3 güne yığılmış: 24 Haz 582 · 25 Haz 449 · 26 Haz 417 · 27 Haz 226 · 28 Haz 14 · 29 Haz 2.
- `/` hâlâ en güçlü gerçek landing (457). `/fiyatlar` ve `/hal/*` sayfaları çalışıyor ama kampanya enerjisinin ana sayfadan canlı fiyat/CTA hattına taşınması hâlâ açık iş.

## Dış Referrer (insan)

- www.google.com 3,020 · myactivity.google.com 86 · googleads.g.doubleclick.net 59 · yandex.com.tr 38 · www.google.com.tr 28 · https: 25 · yandex.ru 22 · youtube.com 12 · 5f18f9529285b542f9e7edf6773f4075.safeframe.googlesyndication.com 7 · www.yandex.com.tr 6 · yandex.com 5 · fbapp: 5 · www.bing.com 3 · android-app: 2 · halcyon-cn.net 2
- Google organik günlük bazda yükselmeye devam ediyor: önceki dönem **3,427 / 8 = ~428/gün**, bu dönem **3,020 / 6 = ~503/gün**. Toplam düşüş yalnızca dönem gün sayısının kısa olmasından kaynaklı.
- AI arama referrer'ı bu dönemde belirgin görünmüyor; crawler tarafındaki OAI trafiği sürse de kullanıcı referrer'ına henüz düzenli yansımamış.

---

## ⚠️ HATALAR / BULGULAR

### 1. 🟢 5xx krizi söndü
Önceki raporda 321 adet 5xx vardı ve büyük kısmı admin analytics 500'leriydi. Bu dönem yalnızca **4 adet 502 `/`** var; admin analytics 500'leri logda görünür bir sorun olmaktan çıkmış. Public kullanıcı etkisi yok denecek kadar az.

### 2. 🟡 Ads hafta sonuna doğru neredeyse durdu
Gclid istekleri 24–26 Haziran'da güçlü (582/449/417), 28–29 Haziran'da ise **14 ve 2** seviyesine iniyor. Bu kampanya bütçesi, zamanlama, onay/öğrenme fazı veya tracking parametresi kaynaklı olabilir.

### 3. 🟢 Mobil oran toparlandı
Önceki dönemde %64'e düşen mobil oran bu dönem **%70**. 24–27 Haziran arası %72–77 bandı sağlıklı; 28–29 Haziran'da düşüş var ama dönem geneli mobil kullanım güçlü.

### 4. 🟡 404 gürültüsü arttı ama kritik görünmüyor
404 toplamı 672 → **1,043**. Ana kaynaklar `.well-known/traffic-advice`, eski Next.js CSS chunk istekleri, WordPress/.env/.git taramaları ve `/api/fiyat`. Ürün slug kaynaklı büyük bir kırılma görünmüyor; daha çok bot ve stale asset gürültüsü.

### 5. 🟡 AhrefsBot yükseldi
AhrefsBot önceki dönem 151 iken bu dönem **1,147**. Şimdilik yükü yönetilebilir, ama artış sürerse crawl-delay/robots politikası tekrar gündeme alınabilir.

## Aksiyon Listesi (öncelik sırası)

1. **[P1]** Ads tarafını kontrol et: 28–29 Haziran'daki gclid düşüşü bütçe, kampanya durumu, öğrenme fazı veya URL/tracking değişimi kaynaklı mı doğrula.
2. **[P2]** Google Ads landing'i `/` → `/canli-hal-fiyatlari` / `/fiyatlar` hattına taşı. `/` hâlâ en büyük gerçek landing; newsletter/CTA yakalama potansiyeli kaçıyor.
3. **[P2]** Eski Next.js chunk 404'lerini izle. Deploy sonrası stale asset normal olabilir; tekrar ederse cache header/build asset retention gözden geçirilmeli.
4. **[P3]** `/.well-known/traffic-advice` ve WordPress/.env/.git tarama gürültüsünü düşük öncelikli güvenlik/log hijyeni olarak takip et.
5. **[izle]** AhrefsBot artışı ve AI crawler/referrer ayrışması: OAI crawler stabil, kullanıcı referrer'ı henüz düzenli değil.
6. **[devam]** Newsletter aktivasyonu ve canlı fiyat CTA'ları: organik günlük Google referrer yükselirken yakalama mekanizması hâlâ kritik.

## Genel Durum: 🟢 SAĞLIKLI + ZİRVE SONRASI NORMALLEŞME

- 16–23 Haziran zirvesinden sonra trafik **hafif gevşedi** ama yeni seviye güçlü: **39,032 insan istek/gün**, **~581 gerçek pageview/gün**.
- Mobil oran **%70'e toparlandı**; ana kullanım hâlâ mobil ağırlıklı.
- Public sağlık iyi: **5xx yalnızca 4**, admin analytics 500 problemi bu log döneminde görünmüyor.
- Organik Google günlük bazda büyüyor (**~503 referrer/gün**); SEO ivmesi sürüyor.
- En net risk Ads tarafı: 28–29 Haziran'da gclid neredeyse sıfırlanmış. Kampanya/tracking kontrolü bu dönemin en önemli aksiyonu.
