# HalDeFiyat Trafik Analizi — 19–30 Ağustos 2026 (12 tam gün)

> Kaynak: VPS `/var/log/nginx/haldefiyat.access.log*` (dedike erişim logu) + canlı MySQL `hal_fiyatlari` (salt okuma) + Search Console + Analytics 4 + Tag Manager + PageSpeed Insights (31 Ağu koşusu). Üretim: traffic-report.sh + ek log taramaları.
> **Devam raporu:** `analiz-10-16-agustos-2026` raporunun devamı. Yenileme etki değerlendirmesi ayrı belgede: `yenileme-etki-analizi-2026-08-31`.

## Özet Tablo

| Metrik | Değer |
|---|---|
| Toplam istek | **890,654** |
| İnsan trafik (istek*) | **834,227** (%93.7) |
| Bot/Crawler trafik | **56,427** (%6.3) |
| Günlük ort. insan trafik (12 tam gün) | **69,519/gün** |
| Mobil / Masaüstü (insan) | **%77 / %23** |
| Google Ads tıklama (gclid, request) | **5 istek** (kampanya fiilen kapalı) |
| ★ Gerçek tam sayfa yüklemesi | **45,117** (~**3,760/gün**) |
| ★ Gerçek JS pageview (track beacon) | **14,968** (~**1,247/gün**) |

\* İstek sayısı, ziyaretçi değil. Bu dönemde ilk kez ölçüldü: insan sayfa isteklerinin **%91,3'ü Next.js prefetch'idir** (aşağıda "Prefetch gerçeği").

## Öncesi / Sonrası — trend

| Metrik | Önceki (10–16 Ağu) | **bu dönem (19–30 Ağu)** | Trend |
|---|---|---|---|
| Günlük insan istek | 63,687 | **69,519** | **+%9,2** |
| Gerçek JS pageview/gün | ~1,130 | **~1,247** | **+%10,4** |
| Mobil oran | %78 | **%77** | −1 puan (sabit) |
| 5xx toplam | — | **463** (%0,05) | dağıtım günlerinde yoğun |

## Günlük Trafik

| Tarih | Gün | İnsan | Bot | Toplam | Uniq IP | Mobil% |
|---|---|---|---|---|---|---|
| 19 Ağu | Çar | 83,722 | 6,182 | 89,904 | 2,183 | %65 |
| 20 Ağu | Per | 61,812 | 4,429 | 66,241 | 2,020 | %78 |
| 21 Ağu | Cum | 67,391 | 4,143 | 71,534 | 3,174 | %76 |
| 22 Ağu | Cmt | 59,692 | 3,859 | 63,551 | 2,241 | %86 |
| 23 Ağu | Paz | 65,856 | 3,216 | 69,072 | 2,455 | %80 |
| 24 Ağu | Pzt | 77,861 | 3,433 | 81,294 | 1,655 | %75 |
| 25 Ağu | Sal | 79,073 | 5,271 | 84,344 | 2,351 | %74 |
| 26 Ağu | Çar | 78,926 | 3,683 | 82,609 | 4,618 | %74 |
| 27 Ağu | Per | 68,819 | 4,009 | 72,828 | 2,244 | %80 |
| 28 Ağu | Cum | 58,879 | 3,370 | 62,249 | 1,761 | %78 |
| 29 Ağu | Cmt | 62,827 | 6,562 | 69,389 | 2,223 | %80 |
| 30 Ağu | Paz | 69,369 | 8,270 | 77,639 | 1,573 | %79 |
| **TOPLAM** | | **834,227** | **56,427** | **890,654** | — | **%77** |

- En yüksek gün **19 Ağu (83,722)**, en düşük **28 Ağu (58,879)** — %42 fark, sağlıklı hafta-içi/hafta-sonu ritmi.
- Hafta sonu mobil oranı sistematik olarak yükseliyor (22 Ağu Cmt %86) — masaüstü kullanımı iş gününe bağlı.
- 26 Ağu'daki 4,618 uniq IP dönem ortalamasının (2,208) iki katı; aynı gün insan trafiği de yüksek. Tek günlük tekil ziyaretçi zirvesi.

## Prefetch gerçeği — "sayfa isteği" ne ölçüyor?

Bu dönem ilk kez sayfa isteklerini RSC (Next.js `<Link>` ön-yükleme) ve gerçek sayfa yüklemesi olarak ayırdım. Sonuç önceki raporların "en çok ziyaret edilen sayfalar" tablolarını geçersiz kılıyor:

| Katman | 12 gün | Günlük |
|---|---|---|
| İnsan istek (tüm HTTP) | 834,227 | 69,519 |
| İnsan sayfa yolu isteği | 520,699 | 43,392 |
| → RSC prefetch (kullanıcı görmedi) | **475,582 (%91,3)** | 39,632 |
| → **Gerçek tam sayfa yüklemesi** | **45,117 (%8,7)** | **3,760** |
| ★ JS pageview beacon | 14,968 | 1,247 |

Menü/altbilgi bağlantılarında oran uçlaşıyor — bu sayfalar aslında neredeyse hiç ziyaret edilmiyor, sadece her sayfada ön-yükleniyor:

| Sayfa | Prefetch | Gerçek yükleme | Oran |
|---|---|---|---|
| /harita | 15,810 | 43 | 368:1 |
| /uyarilar | 15,376 | 31 | 496:1 |
| /gizlilik-politikasi | 14,554 | 29 | 502:1 |
| /metodoloji | 8,087 | 73 | 111:1 |
| /hakkimizda | 3,753 | 36 | 104:1 |
| /karsilastirma | 14,881 | 1,387 | 11:1 |
| /iletisim | 6,433 | 1,631 | 4:1 |

Haziran raporunda "/gizlilik-politikasi 2,817 ziyaret" yazması bu yüzdendi — ziyaret değil, altbilgi ön-yüklemesiydi.

## Giriş kanalı (45,117 gerçek sayfa yüklemesi üzerinden)

| Kanal | İstek | Pay |
|---|---|---|
| Doğrudan / referrer'sız | 19,674 | %43,6 |
| **Google organik** | **12,884** | **%28,6** (~1,074/gün) |
| Site içi geçiş | 12,260 | %27,2 |
| Yandex / Bing / DuckDuckGo | 299 | %0,7 |

Log tarafındaki günlük organik iniş dönem içinde yatay görünüyor (19 Ağu 1,179 → 30 Ağu 1,099, bant 918–1,275), ama **bir önceki döneme göre büyüme var** — bunu Search Console gösteriyor (aşağıdaki bölüm). İki ölçüm tutarlı: log referrer sayısı GSC tıklamasının yaklaşık 1,9 katı ve günlük şekilleri örtüşüyor (ikisi de 24–26 Ağu'da tepe, 22 ve 28 Ağu'da dip yapıyor).

**En çok organik iniş alan sayfalar (log):** /hal/istanbul-hal-ibb 656 · /urun/uzum 541 · /urun/patates 445 · /urun/limon 431 · /hal/bursa-hal 430 · /urun/domates 384 · /urun/sogan-kuru 374 · / 332 · /hal/kahramanmaras-hal 330 · /urun/domates-salcalik 320

## Arama Performansı (Search Console)

| Metrik (11 tam gün, eşit pencere) | 8–18 Ağu | **19–29 Ağu** | Değişim |
|---|---|---|---|
| Organik tıklama | 5,539 | **6,120** | **+%10,5** |
| Gösterim | 191,110 | 198,046 | +%3,6 |
| CTR | %2,90 | **%3,09** | +0,19 puan |
| Ortalama pozisyon | 6,40 | 6,36 | yatay |

**Aylık:** günlük ortalama organik tıklama Temmuz **388** → Ağustos **521** (+%34,2). Gösterim büyümesi tıklama büyümesinin çok altında — kazanç yeni gösterimden değil, **aynı gösterimin daha iyi tıklanmasından** geliyor.

**Cihaz:** organik tıklamaların **%91,2'si mobil** (CTR %3,32); masaüstü CTR %1,83.

**En çok tıklanan sorgular (19–28 Ağu, nihai veri):**

| Sorgu | Tıklama | Gösterim | CTR | Pozisyon |
|---|---|---|---|---|
| istanbul hal fiyatları | 66 | 2,191 | %3,01 | 4,5 |
| patates fiyatları | 61 | 947 | %6,44 | 7,0 |
| bayrampaşa meyve sebze hali fiyat listesi | 46 | 593 | %7,76 | 3,9 |
| bursa hal fiyatları | 45 | 710 | %6,34 | 2,8 |
| kahramanmaraş hal fiyatları | 44 | 666 | %6,61 | 2,9 |
| limon piyasası | 40 | 1,385 | %2,89 | 5,8 |
| hal fiyatları | 38 | 1,146 | %3,32 | 7,3 |
| konya hal fiyatları | 32 | 682 | %4,69 | 2,9 |
| limon fiyatları | 30 | 1,824 | %1,64 | 5,8 |
| **malatya hal komisyoncuları** | 22 | 46 | **%47,83** | 1,0 |
| polatlı soğan fiyatları | 16 | 59 | %27,12 | 3,7 |

Örüntü: **şehir + ürün özgüllüğü arttıkça CTR fırlıyor.** Genel "limon fiyatları" %1,64 verirken "malatya hal komisyoncuları" %47,83 veriyor.

**Bölüm bazında organik tıklama (19–30 Ağu):**

| Bölüm | Tıklama | Gösterim | CTR |
|---|---|---|---|
| /urun/* | 3,257 | 123,908 | %2,63 |
| /hal/* | 1,685 | 45,784 | %3,68 |
| /firmalar/* | 1,084 | 24,789 | **%4,37** |
| / | 187 | 8,815 | %2,12 |
| /analiz/* | 91 | 8,022 | **%1,13** |
| /piyasa/* (bu dönem açıldı) | 24 | 1,077 | %2,23 |
| /borsa + /et-fiyatlari + /canli-hayvan-fiyatlari | 10 | 1,855 | %0,54 |

**Kapsam:** dönemde **439 farklı sayfa** gösterim aldı, **282'si** en az bir tıklama getirdi. Site **5,211 farklı sorguda** göründü (928'i tıklama üretti, 1,453'ünde ortalama pozisyon ilk üçte). Sitemap'te 394 URL bildirilmiş; aradaki fark `/firmalar?city=…&page=…` gibi **60'tan fazla parametreli URL'in ayrı indekslenmesinden** geliyor.

## Google Analytics 4 (davranış)

| Metrik | 7–18 Ağu | **19–30 Ağu** | Değişim |
|---|---|---|---|
| Oturum | 854 | 873 | +%2,2 |
| Etkin kullanıcı | 555 | **650** | **+%17,1** |
| Yeni kullanıcı | 498 | 576 | +%15,7 |
| Sayfa görüntüleme | 2,390 | 2,436 | +%1,9 |
| Etkileşim oranı | %67,0 | **%56,6** | **−10,4 puan** |
| Hemen çıkma | %33,0 | %43,4 | +10,4 puan |
| Ort. oturum süresi | 179,5 sn | 168,3 sn | −%6,2 |
| Anahtar olay (form_submit) | 7 | **16** | **+%129** |
| Mobil oturum payı | — | **%88,6** | — |

**Ölçüm boşluğu — önemli:** aynı 12 günde Search Console 6,350 organik tıklama görürken GA4 yalnızca 735 organik oturum görüyor (yakalama %11,6). Kendi beacon'ımız (14,968) GA4'ün (2,436) altı katı. Sebep reklam engelleyici + çerez onayı + ertelenmiş betik yüklemesi. **Üç sayaç toplanmaz, biri diğerinin yerine kullanılmaz:** hacim için log/beacon, arama için GSC, davranış için GA4 (mutlak değil oransal) okunur.

**Davranış uyarısı:** erişim büyüyor (etkin kullanıcı +%17) ama bağlılık geriliyor (etkileşim −10,4 puan, kullanıcıların %88,6'sı yeni). Site insanlara ulaşıyor, elde tutamıyor.

## Tag Manager / ölçüm altyapısı

- Konteyner `GTM-K3WDGHX5`, canlı sürüm 2 — **tek tag** (GA4 config, `G-YHLL9WK7ML`), özel trigger/değişken yok.
- Denetimde kırık referans, mükerrer veya yabancı ölçüm ID'si, preview tag'i **yok** — konteyner temiz.
- **Ads dönüşüm etiketi (`AW-18007572524`) GTM'de yok** — site kodundan doğrudan gtag ile yükleniyor. Çalışıyor ama GTM üzerinden yönetilemiyor.
- 30 Ağu SEO denetimi: **SEO skoru 90,7 / 100**, **GEO (üretken arama) skoru 46 / 100**. Açık bulgular: 2 sayfada `og:image` eksik (/hal/kutahya-hal, /firmalar), 4 sayfada başlık uzunluğu aralık dışı. `/giris` ve `/kayit` noindex uyarıları kasıtlı (yanlış pozitif).

## Bölüm bazında insan sayfa isteği

| Bölüm | İstek | Pay |
|---|---|---|
| /urun/* | 211,099 | %40,5 |
| Diğer (kurumsal, rehber, piyasa, statik) | 135,477 | %26,0 |
| /firma* | 75,916 | %14,6 |
| /hal/* | 25,024 | %4,8 |
| /fiyatlar | 23,819 | %4,6 |
| / (ana sayfa) | 21,481 | %4,1 |
| /harita | 15,849 | %3,0 |
| /analiz* | 4,815 | %0,9 |
| /ilan* | 4,517 | %0,9 |
| /borsa* | 2,476 | %0,5 |

## Saatlik Dağılım (insan, UTC — TR = +3)

- Tepe: **09:00 UTC (12:00 TR) = 60,278 istek** — öğle arası, hal fiyatlarının günlük güncellendiği saat.

## HTTP Sağlık (durum kodları, dönem)

| Kod | İstek | Açıklama |
|---|---|---|
| 200 | 844,635 | Başarılı |
| 204 | 16,937 | İçerik yok (track beacon) |
| 304 | 10,387 | Cache |
| 404 | 7,025 | Bulunamadı |
| 301 | 6,153 | Kalıcı yönlendirme |
| 499 | 3,227 | İstemci kapattı |
| 308 | 847 | Kalıcı (POST) |
| 401 | 622 | Yetkisiz |
| 502 | 375 | Backend kapalı (geçici) |
| 206 | 132 | Kısmi içerik |
| 400 | 132 | Hatalı istek |
| 500 | 74 | Sunucu hatası |
| 302 | 50 | Geçici yönlendirme |
| 410 | 16 | Gone (ölü ürün) |
| 201 | 11 | Oluşturuldu |
| 429 | 10 | Kota aşımı |
| 503 | 9 | Servis yok |
| 307 | 6 | Geçici (POST) |
| 504 | 5 | Ağ geçidi zaman aşımı |

**5xx toplam: 463** / 890,654 = **%0,05**. Ama düzgün dağılmıyor — dağıtım günlerinde toplanıyor:

| Gün | 5xx | 404 | 499 | Not |
|---|---|---|---|---|
| 19 Ağu | **237** | 403 | 278 | Yoğun dağıtım günü (30+ commit) |
| 20 Ağu | 1 | 326 | 205 | |
| 21 Ağu | 1 | 299 | 127 | |
| 22 Ağu | 0 | 369 | 138 | |
| 23 Ağu | 2 | 335 | 200 | |
| 24 Ağu | **103** | 412 | 261 | Firma modülü dağıtımı + 28 GB bayat release temizliği |
| 25 Ağu | 0 | **1,493** | 233 | 404 patlaması başlıyor |
| 26 Ağu | 1 | 763 | 235 | |
| 27 Ağu | 10 | 874 | 182 | |
| 28 Ağu | 0 | 930 | 155 | |
| 29 Ağu | 2 | 432 | 403 | |
| 30 Ağu | **106** | 389 | **810** | 19 ardışık fotoğraf batch dağıtımı |

Dağıtım yapılmayan 8 günde toplam 5xx = **7**. Altyapı stabil; sorun **dağıtım prosedüründe** (checklist S6, deploy OOM koruması).

## 404 kuyruğunun kök nedeni — bulundu

19 Ağustos raporu 404 sıçraması için "gerilemezse yenilemede kırılan bir iç bağlantı aranmalı" demişti. **Gerilemedi, ikiye katlandı** — ve sebep bulundu:

| 404 ön-eki | İstek | Bot payı |
|---|---|---|
| /firma/* | 1,116 | 1,111 (%99,6) |
| /urun/* | 640 | 594 (%92,8) |
| /.well-known/traffic-advice | 281 | 0 (zararsız, Chrome özel) |
| /analiz/elma-fiyat-analizi-mayis-2026 | 219 | 216 (ölü içerik URL'i) |
| /wp-admin/* | 168 | 0 (saldırı taraması) |
| /admin/* | 131 | 0 (saldırı taraması) |
| /api/* | 117 | 26 |

**`-2` sonlu 404'ler: 1,765 istek — 1,756'sı (%99,5) Googlebot.**

Örnek: `/firma/3208-haktan-komisyon-evi-2` → 404, ama kanonik `/firma/3208-haktan-komisyon-evi` → 200. Aynı desen ürünlerde: `/urun/elma-2` → 404, `/urun/elma` → 200.

Bunlar **birleştirme turunun artığı**: benzersiz-slug çakışma çözümüyle `-2` eki almış kopya kayıtlar bir süre yayında/sitemap'te durdu, Google taradı, sonra birleştirme sırasında silindi. Bugün DB'de sadece 2 firma + 1 ürün `-2` slug'lu; sitemap temiz (394 URL, sıfır `-2`). Yani sorun **canlı değil, tarihsel** — ama Googlebot ölü URL'leri yoklamaya devam ediyor ve link değeri 404'te yanıyor.

Zaman çizgisi net: /firma `-2` 404'leri **25 Ağustos'ta başlıyor** (24 Ağu'ya kadar günde 0–2, 25 Ağu'da 406).

**Çözüm 404 değil 301:** `{slug}-2` isteğinde `{slug}` kaydı varsa ve `-2` kaydı yoksa kanonik URL'e kalıcı yönlendir. Hâlâ yaşayan 3 `-2` slug'u (`2971-huzur-...-2`, `591-yesil-silvan-2`, `domates-2`) kuralın dışında tutulmalı.

## Bot / AI Crawler Dağılımı (UA, dönem)

- googlebot **14,509** · yandex 5,124 · bingbot 3,289 · ahrefsbot 2,104 · applebot 132 · petalbot 3
- **AI motor crawler:** claudebot 1,465 · gptbot 1,194 · oai-searchbot 911 → toplam **3,570 hit** (~298/gün)

19 Ağustos raporunda AI botları 6,7× sıçramıştı (4 günde 2,373 istek). O sıçrama **kalıcı olmadı**: eşleştirilmiş pencerede 15–18 Ağu 2,373 → 22–25 Ağu **485** (−%80). Aynı pencerede Googlebot 3,143 → 5,519 (+%76). AI tarama bir dalgaydı, yeni bir taban değil. (Checklist S13 — Kasım'daki "AI kanalını tut/kıs" kararının girdisi.)

## Google Ads (gclid) Landing

- Dönemde **5 gclid isteği / 3 benzersiz IP**. Kampanya fiilen durmuş durumda. (Haziran'da 2,566 istek / 949 IP idi.)
- Trafiğin tamamı organik + doğrudan taban — reklam harcaması olmadan 69,5K istek/gün.

## Dış Referrer (insan)

www.google.com 12,344 · yandex.com 378 · myactivity.google.com 247 · yandex.com.tr 124 · tanitio.com 100 · yandex.ru 72 · www.google.com.tr 71 · www.bing.com 27 · tarvista.com 23 · duckduckgo.com 15 · bereketfide.com 14

## Hız — PageSpeed Insights (31 Ağustos koşusu, ana sayfa)

| Ölçüm | Mobil | Masaüstü |
|---|---|---|
| Performans | **91** | **100** |
| Erişilebilirlik | 100 | 97 |
| En İyi Uygulamalar | 100 | 100 |
| SEO | 100 | 100 |
| FCP | 2,4 s | 0,4 s |
| LCP | 3,0 s | 0,6 s |
| TBT | **0 ms** | 0 ms |
| CLS | 0,001 | 0 |

**Alan verisi (CrUX, gerçek kullanıcılar):** LCP 2.337 ms `FAST` · INP 160 ms `FAST` · CLS 0 `FAST` · TTFB 1.288 ms `AVERAGE` · FCP 2.276 ms `AVERAGE` → genel `AVERAGE`.

19 Ağustos raporunda mobil performans 57, TBT 1.910 ms idi. Şimdi **91 ve 0 ms**. Hedef olarak konan 80 aşıldı; kalan tek zayıf halka sunucu yanıt süresi (TTFB 1,3 s).

## İş / Funnel Metrikleri (DB)

| Alan | 19–30 Ağu | 7–18 Ağu (kıyas) |
|---|---|---|
| Newsletter — yeni abone | **2** | 4 |
| Newsletter — toplam abone | 24 | 22 |
| Newsletter CTA gösterim → kayıt | 636 → 2 (**%0,31**) | 757 → 6 (%0,79) |
| Banner gösterim / tıklama | 35,447 / 36 (CTR %0,10) | 24,404 / 25 (%0,10) |
| **Reklam geliri** | **0 TL** | 0 TL |
| Dış ücretli reklamveren | **0** (7 slot kendi marka + affiliate) | 0 |
| Firma sahiplenme talebi | **0** | 2 |
| Firma lead'i | **0** | 0 |
| Aktif ilan | **0** (5 ilanın hepsi süresi dolmuş) | 2 yeni |
| Yayınlanan analiz raporu | 3 | 3 |
| Yeni üye kaydı | 6 | 8 |
| API kota bloğu (429) | **10** | 591 |

**Arama kullanımı sıçradı** (19 Ağustos'ta eklenen sesli arama + 0-sonuç fallback'in karşılığı):

| Arama modalı olayı | 19–30 Ağu | 7–18 Ağu |
|---|---|---|
| Fiyat görüntüleme | **532** | 214 |
| Arama gönderimi | 307 | 127 |
| 0-sonuç oranı | %23 | %39 |

## Veri Sağlığı (ETL)

| Metrik | 19–30 Ağu | 7–18 Ağu |
|---|---|---|
| ETL çalışması | 708 | 659 |
| Hata | **5** (%0,7) | 13 (%2,0) |
| Kısmi (partial) | 168 (**%24**) | 59 (%11) |
| Fiyat satırı (hf_price_history) | 16,666 | 16,405 |
| Veri üreten hal/market | 38 / 63 (%60) | 40 |
| avg_price sentetik (midpoint) oranı | **%69,5** | — |
| Karantinaya alınan satır | **427** | (toplam 552'nin %77'si bu dönemde) |

- **Sessiz başarısızlık:** 10 kaynak `status=ok` dönüp 0 satır üretiyor (antkomder ×3, çorum, 6 TOBB borsası). Sağlık raporu bunları "sorunlu" göstermiyor — "5 hata" rakamı bu yüzden iyimser.
- **Bayat kaynak:** `tekirdag_resmi` 29 gündür veri yok; `bolu_resmi` 16 gün (haftalık kaynak, normal); `balikesir_resmi` 9 gün.
- `polatli_borsa` dönemde 3 kez HTTP 500 ile düştü — tek tekrarlayan arıza.

## Ürün Kataloğu

| Metrik | 19 Ağu | 30 Ağu |
|---|---|---|
| Fotoğraflı ürün slug'ı (manifest) | 159 | **420** (+%164) |
| Benzersiz fotoğraf dosyası | — | 324 |
| SEO index'li ürün | 243 | 243 |
| → fotoğrafı olan | — | 175 (%72) |

---

## ⚠️ HATALAR / BULGULAR

- **Büyüme her cephede sürüyor.** İnsan istek +%9,2, gerçek pageview +%10,4, organik tıklama +%10,5 (GSC, eşit pencere) — üç bağımsız ölçüm aynı mertebeyi veriyor. Aylık bazda organik günlük tıklama Temmuz 388 → Ağustos 521 (+%34).
- **Organik kazanç pozisyondan değil CTR'den geliyor.** Gösterim +%3,6 iken tıklama +%10,5; ortalama pozisyon yatay (6,40 → 6,36). Aynı görünürlük daha iyi tıklanıyor.
- **404 kuyruğunun sebebi bulundu:** birleştirme turunun sildiği `-2` sonlu kopya slug'lar. 1,765 isteğin %99,5'i Googlebot. 404 yerine 301 verilmeli — şu an link değeri yanıyor.
- **Dağıtım günleri tek 5xx kaynağı.** 12 günün 4'ünde 456 hata, kalan 8 günde 7. Altyapı değil prosedür sorunu (S6 deploy OOM koruması hâlâ açık).
- **Hız hedefi aşıldı:** mobil performans 57 → 91, TBT 1.910 ms → 0 ms, alan verisinde LCP artık `FAST`. Kalan zayıf halka TTFB 1,3 s.
- **AI crawler sıçraması kalıcı olmadı** (eşleştirilmiş pencerede −%80). Aynı anda Googlebot +%76 — tarama bütçesi AI'dan Google'a kaydı.
- **Sayfa isteği metriği %91 prefetch'ti.** Önceki raporlardaki "en çok ziyaret edilen sayfalar" tabloları menü ön-yüklemesini ölçüyordu; bu rapordan itibaren gerçek yükleme ayrı sayılıyor.
- **Newsletter hunisi geriledi:** gösterim −%16, kayıt 6 → 2, dönüşüm %0,79 → %0,31. 12 günde 2 abone, toplam 24. Funnel'ın son halkası hâlâ kopuk.
- **Gelir tarafı sıfır.** 35 bin banner gösterimi, 0 TL. 14 slotun 7'si boş; dolu 7'sinin hepsi kendi markamız veya affiliate. Dış reklamveren yok, self-service talebi yok, bekleme listesi boş.
- **İlan modülü karanlık:** 5 ilanın hepsi süresi dolmuş, canlı sitede gösterilecek tek aktif ilan yok, 0 soru/arama talebi.
- **Firma dizini beklenenden iyi çalışıyor.** 1.336 firmanın sadece 2'si `seo_index=1` (detay sayfaları kasıtlı olarak indekssiz), ama `/firmalar/{şehir}` listeleme sayfaları dönemde **1.084 organik tıklama** getirdi ve **%4,37 ile en yüksek CTR'li bölüm**. Aynı bölüm hem trafiğin %14,6'sını hem Googlebot 404'lerinin ana kaynağını oluşturuyor.
- **Analiz içerikleri aranıyor ama tıklanmıyor:** /analiz 8.022 gösterimde 91 tıklama (%1,13) — site ortalamasının (%3,09) üçte biri. Yeni dikeylerde daha keskin: borsa + et + canlı hayvan 1.855 gösterimde 10 tıklama.
- **Ölçüm sistemleri arasında 8 kat makas:** GSC 6.350 organik tıklama görürken GA4 735 oturum görüyor. Kaynakların hangisinin ne ölçtüğü ayrılmadan rapor okunamaz.
- **Veri kalitesi borcu duruyor:** avg_price'ın %69,5'i hâlâ sentetik orta nokta (%79'dan iyileşti). Karantina kayıtlarının %77'si bu 12 günde düştü — sebebi araştırılmadı.
- **31 Ağustos haftalık raporu üretilmemiş.** Son otomatik haftalık rapor 24 Ağustos.

## Aksiyon Listesi (öncelik sırası)

1. **P0 — `-2` slug'ları için 301 kuralı.** `{slug}-2` → `{slug}` (temel kayıt varsa ve `-2` kaydı yoksa). Yaşayan 3 istisna hariç tutulur. 1,765 Googlebot 404'ünü link değeri koruyan yönlendirmeye çevirir.
2. **P0 — Prefetch kısıtlaması.** Altbilgi/menü bağlantılarında `prefetch={false}`. Günde ~39,6 bin gereksiz istek, insan sayfa isteğinin %91'i. Sunucu yükünü tek hamlede mertebe düşürür ve trafik ölçümünü dürüstleştirir.
3. **P1 — Dağıtım 5xx koruması (S6).** Ardışık dağıtımlarda admin build OOM'u + 19 batch'lik seri dağıtımların yarattığı kesintiler. Ya bellek sınırı ya da build sırasında worker yönetimi.
4. **P1 — İlk dış reklamvereni kazan.** 35 bin gösterim/12 gün + ölçülü CTR tablosu + medya kiti hazır; eksik olan tek şey temas. Boş 7 slot envanteri satılabilir durumda.
5. **P1 — /analiz başlık ve açıklamalarını yeniden yaz.** 8.022 gösterim, 91 tıklama. Görünürlük hazır, tıklama yok — en ucuz organik kazanç burada.
6. **P1 — Newsletter hunisini onar.** Dönüşüm %0,79'dan %0,31'e düştü; 636 gösterimde 8 focus, 2 submit. Sorun görünürlük değil, teklifin kendisi — CTA metni ve verilen sözün yeniden yazılması gerekiyor.
7. **P2 — Şehir–ürün kesişim sayfalarını çoğalt.** "malatya hal komisyoncuları" %47,8 CTR, "polatlı soğan fiyatları" %27,1; genel ürün sayfaları %1,6–2,6 bandında. /piyasa şablonu bu iş için zaten kurulu.
8. **P2 — `/firmalar?…` parametreli URL'leri kanonikleştir.** 60'tan fazla varyant ayrı indeksleniyor, tarama bütçesi yiyor.
9. **P2 — Süresi dolmuş ilanları yenile veya modülü gizle.** Boş bir ilan bölümü ziyaretçiye "burası ölü" mesajı veriyor.
10. **P2 — Sessiz ETL başarısızlıklarını sağlık raporuna sok.** `status=ok` + `rows_inserted=0` bir hata durumu olarak işaretlenmeli; şu an 10 kaynak sessizce boş dönüyor.
11. **P2 — `tekirdag_resmi` (29 gün) ve `polatli_borsa` (3× HTTP 500) onarımı.**
12. **P2 — TTFB 1,3 s.** Tek kalan alan-verisi zayıflığı; sayfa hızının geri kalanı hedefin üstünde.
13. **P3 — Karantina sıçramasını açıkla.** 552 kaydın 427'si bu dönemde; yeni kalite kuralı mı, bozulan kaynak mı belirlenmeli.

## Genel Durum: SAĞLIKLI + BÜYÜYOR, GELİR HÂLÂ SIFIR

Teknik taraf bu dönemde belirgin biçimde iyileşti — hız hedefi aşıldı (mobil 57 → 91), altyapı dağıtım dışı günlerde neredeyse hatasız, trafik %9 büyüdü, organik arama tıklaması %10,5 arttı, arama kullanımı 2,5 katına çıktı. Kalan teknik borç iyi tanımlı ve küçük: `-2` yönlendirmeleri, prefetch kısıtı, dağıtım koruması.

İki açık kalıyor. Birincisi **ticari**: site günde ~70 bin istek ve ~3.760 gerçek sayfa yüklemesiyle çalışıyor, banner envanteri canlı, medya kiti hazır — ama 12 günde 0 TL gelir, 0 dış reklamveren, 0 sahiplenme talebi, 0 aktif ilan ve 2 yeni abone var. İkincisi **elde tutma**: erişim büyürken bağlılık geriliyor (yeni kullanıcı payı %88,6, etkileşim oranı %67 → %56,6). Zemin satışa hazır; eksik olan satış temasının kendisi ve gelen ziyaretçiyi geri getirecek mekanizma.

---

*Kaynaklar: VPS `/var/log/nginx/haldefiyat.access.log*` (19–30 Ağu) · `hal_fiyatlari` MySQL (salt okuma) · Google Search Console API (`sc-domain:haldefiyat.com`) · Google Analytics 4 (property 538279658) · Google Tag Manager API (`GTM-K3WDGHX5`) · PageSpeed Insights API. Üretim: 2026-08-31.*

*Not: Search Console'un nihai verisi 28 Ağustos'ta biter; 29–30 Ağustos taze/kısmi veridir. Dönem kıyasları eşit uzunlukta ve tamamı nihai olan 11 günlük pencerelerle (8–18 vs 19–29), sorgu/sayfa tabloları yalnız nihai veriyle (19–28) yapılmıştır.*
