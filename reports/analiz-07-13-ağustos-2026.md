# HalDeFiyat Trafik Analizi — 7–13 Ağustos 2026 (7 tam gün)

> Kaynak: VPS `/var/log/nginx/haldefiyat.access.log*` (dedike erişim logu). Üretim: traffic-report.sh.
> **Devam raporu:** `analiz-06-19-temmuz-2026.md` raporunun devamı. Dönemler aynı
> uzunlukte değildir; kıyas günlük ortalamalar üzerinden yapılır.

## Özet Tablo

| Metrik | Değer |
|---|---|
| Toplam istek | **499,625** |
| İnsan trafik (istek*) | **468,090** (%93.7) |
| Bot/Crawler trafik | **31,535** (%6.3) |
| Günlük ort. insan trafik (7 tam gün) | **66,870/gün** |
| Mobil / Masaüstü (insan) | **%77 / %23** |
| Google Ads tıklama (gclid, request) | **2 istek** |
| → benzersiz IP (reklam tıklayan) | **2** |
| ★ Gerçek JS pageview | **7,860** (~**1,123/gün**) |

\* İstek sayısı, ziyaretçi değil. Gerçek engaged insan ≈ **1,123 pageview/gün** (track beacon).

## Öncesi / Sonrası — trend

| Metrik | **6–19 Temmuz** | **7–13 Ağustos** | Trend |
|---|---|---|---|
| Günlük insan istek | 52,979 | **66,870** | **+%26,2** ↗ |
| Gerçek JS pageview/gün | ~902 | **~1,123** | **+%24,5** ↗ |
| Mobil oran | %76 | **%77** | **+1 puan** → |

## Günlük Trafik

| Tarih | Gün | İnsan | Bot | Toplam | Uniq IP | Mobil% |
|---|---|---|---|---|---|---|
| 7 Ağu | Cum | 70,587 | 4,299 | 74,886 | 1,416 | %68 |
| 8 Ağu | Cmt | 51,301 | 5,248 | 56,549 | 1,171 | %82 |
| 9 Ağu | Paz | 63,534 | 3,578 | 67,112 | 1,364 | %79 |
| 10 Ağu | Pzt | 77,955 | 4,741 | 82,696 | 1,300 | %77 |
| 11 Ağu | Sal | 65,144 | 3,745 | 68,889 | 1,089 | %82 |
| 12 Ağu | Çar | 69,773 | 5,222 | 74,995 | 1,155 | %76 |
| 13 Ağu | Per | 69,796 | 4,702 | 74,498 | 1,520 | %74 |
| **TOPLAM** | | **468,090** | **31,535** | **499,625** | — | **%77** |

- En yüksek gün **10 Ağustos Pazartesi (77.955 insan isteği)**; en düşük gün
  **8 Ağustos Cumartesi (51.301)**. İstek ve gerçek JS pageview aynı şey değildir;
  erişim hacmi kararlarında 1.123/gün pageview bazı kullanılır.

## Saatlik Dağılım (insan, UTC — TR = +3)

- Tepe: **10:00 UTC (13:00 TR) = 33.183**. İçerik/bülten dağıtım deneyi için
  11:30–13:00 TR penceresi izlenebilir; tek haftadan kalıcı yayın saati çıkarılmaz.

## HTTP Sağlık (durum kodları, dönem)

| Kod | İstek | Açıklama |
|---|---|---|
| 200 | 477,021 | Başarılı |
| 204 | 8,863 | İçerik yok (track beacon) |
| 304 | 5,877 | Cache |
| 301 | 3,395 | Kalıcı yönlendirme |
| 499 | 1,860 | İstemci kapattı |
| 308 | 854 | Kalıcı (POST) |
| 404 | 821 | Bulunamadı |
| 504 | 301 |  |
| 500 | 216 | Sunucu hatası (admin analytics) |
| 502 | 201 | Backend kapalı (geçici) |
| 401 | 65 | Yetkisiz |
| 400 | 51 | Hatalı istek |
| 206 | 45 | Kısmi içerik |
| 302 | 18 | Geçici yönlendirme |
| 201 | 12 | Oluşturuldu |
| 410 | 11 | Gone (ölü ürün redirect) |
| 429 | 9 |  |
| 307 | 4 | Geçici (POST) |
| 422 | 1 |  |

**5xx toplam: 718** / 499.625 = **%0,14**. Sayı düşük görünse de 301 adet 504,
201 adet 502 ve 216 adet 500 ayrı kök neden sınıflarıdır. Bu dönemde yapılan
restart/build işlemleri 502'ye katkı verebilir; 500'ler admin analytics ve gerçek
uygulama hatası olarak logdan ayrıştırılmalıdır.

## Bot / AI Crawler Dağılımı (UA, dönem)

- googlebot 6,434 · yandex 1,878 · bingbot 1,339 · ahrefsbot 1,275 · applebot 139 · petalbot 2
- **AI motor crawler:** claudebot 439 · oai-searchbot 331 · gptbot 14 → toplam
  **~784 hit**. Bunlar insan/engaged trafik KPI'ına katılmaz.

## Google Ads (gclid) Landing

- `/urun/karpuz` 1 · `/` 1. Yedi günde yalnız iki gclid isteği Ads optimizasyonu
  için örneklem oluşturmaz; kampanya/tag/consent zinciri Google Ads paneliyle
  ayrıca doğrulanmalıdır.

## Dış Referrer (insan)

- www.google.com 7,193 · yandex.com 146 · myactivity.google.com 111 · tanitio.com 45 · yandex.com.tr 44 · https: 40 · yandex.ru 37 · www.google.com.tr 36 · panel.tanitio.com 30 · chatgpt.com 12 · www.bing.com 10 · www.yandex.com.tr 7 · accounts.google.com 6 · android-app: 6 · 187.124.166.65:80 4 <!-- yorum -->

---

## ⚠️ HATALAR / BULGULAR

1. Gerçek JS pageview günlük bazı Temmuz dönemine göre yaklaşık **%24,5 arttı**;
   büyüme istek hacmi artışıyla aynı yönde.
2. Trafiğin **%77'si mobil**. Tasarım, LCP ve CTA kararlarının birincil kabul
   yüzeyi mobil kalmalıdır.
3. 5xx oranı **%0,14**; buna rağmen 718 hata mutlak olarak yüksektir. 502 restart
   penceresi, 504 backend/ISR gecikmesi ve 500 admin analytics ayrı izlenmelidir.
4. Birinci taraf CTA 30 günlük DB bazında `mobile_home_sticky` için 598 gösterim,
   2 başarı (**%0,33**); `price_list_strip` toplam 769 gösterim, 8 başarı
   (**%1,04**) üretti. Sorun endpoint erişiminden çok teklif/yerleşim/funnel'dadır.
5. ETL 24 saat raporunda üç kaynak yedi günden uzun süredir akışsız:
   `kocaeli_merkez`, `mersin_resmi`, `canakkale_resmi`. Son koşuda yalnız
   `izmir_balik` hata verdi; "3+ hata ve 0 başarı" sınıfı boştu.
6. `avg_price` 1.055.511 tarihsel satırın 809.322'sinde min–max orta noktasıyla
   birebir aynı (**%76,68**). Bu, gerçek ortalama/sentetik ayrımı yapılmadan
   ortalama temelli raporların kesin ölçüm gibi sunulmaması gerektiğini doğrular.
7. Ürün sözlüğü birimi ile tarihsel satır birimi 147.161 satırda farklı
   (**%13,94**). Kanıtsız toplu dönüşüm uygulanmamalı; kaynak/ürün kohortu ile
   F2.17 incelemesi sürmelidir.

## Aksiyon Listesi (öncelik sırası)

1. P0: 504/500 örneklerini dedike nginx ve PM2 loglarında rota+kök neden bazında
   sınıflandır; deploy kaynaklı 502'yi blue/green/rolling tasarımla ayır.
2. P0 veri: sentetik ortalama bayrağını şemaya/ETL'ye ekle, API ve raporlarda
   gerçek ortalamadan ayır; bu ayrım tamamlanana dek avg tabanlı iddiaları açıkla.
3. P0 veri: 147.161 birim uyumsuzluğunu kaynak+ürün+birim kohortuna böl; yalnız
   resmi kaynak kanıtıyla düzeltme göçü hazırla.
4. P1 ETL: `kocaeli_merkez`, `mersin_resmi`, `canakkale_resmi` akışını onar;
   `izmir_balik` HTTP 500'i kaynak sağlayıcı olayı olarak izlemeye al.
5. P1 dönüşüm: mobile sticky ve fiyat listesi CTA'sında metin/yerleşim deneyini
   30 günlük birinci taraf funnel ile ölç; başarı oranı için minimum örneklem ve
   rollback eşiği tanımla.
6. P1 ölçüm: ayrı GA4 property kararını ver ve iki gclid isteğinin Ads paneliyle
   tutarlılığını doğrula; nginx isteği, JS pageview ve GSC tıklamasını tek KPI
   altında karıştırma.

## Genel Durum: Büyüyen trafik, açık veri ve güvenilirlik borcu

İnsan ve gerçek JS pageview bazları büyüyor; mobil pay sabit biçimde baskın.
Öncelik yeni yüzey eklemekten önce sentetik ortalama/birim borcunu görünür ve
makinece ayrıştırılabilir hale getirmek, ardından 5xx ve CTA dönüşüm tabanını
iyileştirmektir.
