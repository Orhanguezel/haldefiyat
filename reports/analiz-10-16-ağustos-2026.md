# HalDeFiyat Trafik Analizi — 10–16 Ağustos 2026 (7 tam gün)

> Kaynak: VPS `/var/log/nginx/haldefiyat.access.log*` (dedike erişim logu). Üretim: traffic-report.sh.
> **Not:** Temmuz ve Ağustos başı için trafik raporu üretilmedi; en yakın önceki trafik raporu 24–30 Haziran'dır. Fiyat analizi tarafında bu haftanın raporu: analiz-10-16-agustos-2026.pdf (Ek A bu veriyi özetler).

## Özet Tablo

| Metrik | Değer |
|---|---|
| Toplam istek | **485,906** |
| İnsan trafik (istek*) | **445,807** (%91.7) |
| Bot/Crawler trafik | **40,099** (%8.3) |
| Günlük ort. insan trafik (7 tam gün) | **63,687/gün** |
| Mobil / Masaüstü (insan) | **%78 / %22** |
| Google Ads tıklama (gclid, request) | **1 istek** |
| → benzersiz IP (reklam tıklayan) | **1** |
| ★ Gerçek JS pageview | **7,909** (~**1,130/gün**) |

\* İstek sayısı, ziyaretçi değil. Gerçek engaged insan ≈ **1,130 pageview/gün** (track beacon).

## Öncesi / Sonrası — trend

| Metrik | Önceki (kıyas yok) | **bu dönem** | Trend |
|---|---|---|---|
| Günlük insan istek | — (kıyas dönemi yok) | **63,687** | — |
| Gerçek JS pageview/gün | — | **~1,130** | — |
| Mobil oran | — | **%78** | — |

## Günlük Trafik

| Tarih | Gün | İnsan | Bot | Toplam | Uniq IP | Mobil% |
|---|---|---|---|---|---|---|
| 10 Ağu | Pzt | 77,955 | 4,741 | 82,696 | 1,300 | %77 |
| 11 Ağu | Sal | 65,144 | 3,745 | 68,889 | 1,089 | %82 |
| 12 Ağu | Çar | 69,773 | 5,222 | 74,995 | 1,155 | %76 |
| 13 Ağu | Per | 69,796 | 4,702 | 74,498 | 1,520 | %74 |
| 14 Ağu | Cum | 57,844 | 11,732 | 69,576 | 1,052 | %74 |
| 15 Ağu | Cmt | 52,801 | 5,652 | 58,453 | 1,239 | %82 |
| 16 Ağu | Paz | 52,494 | 4,305 | 56,799 | 1,263 | %86 |
| **TOPLAM** | | **445,807** | **40,099** | **485,906** | — | **%78** |

- En yüksek gün: **10 Ağu (77,955 insan)**; en düşük: 16 Ağu (52,494). Hafta içi > hafta sonu deseni korunuyor; Pazar mobil %86 ile tüketici profiline kayıyor.

## Saatlik Dağılım (insan, UTC — TR = +3)

- Tepe: **10:00 UTC (13:00 TR) = 31,073**. Öğle bloğu (11:00–15:00 TR) günün en yoğun dilimi; hal mesaisiyle uyumlu ticari ritim.

## HTTP Sağlık (durum kodları, dönem)

| Kod | İstek | Açıklama |
|---|---|---|
| 200 | 463,655 | Başarılı |
| 204 | 8,761 | İçerik yok (track beacon) |
| 304 | 5,389 | Cache |
| 301 | 2,675 | Kalıcı yönlendirme |
| 499 | 2,249 | İstemci kapattı |
| 404 | 1,493 | Bulunamadı |
| 308 | 575 | Kalıcı (POST) |
| 429 | 354 |  |
| 502 | 256 | Backend kapalı (geçici) |
| 504 | 166 |  |
| 500 | 123 | Sunucu hatası (admin analytics) |
| 400 | 61 | Hatalı istek |
| 401 | 56 | Yetkisiz |
| 206 | 49 | Kısmi içerik |
| 302 | 19 | Geçici yönlendirme |
| 410 | 9 | Gone (ölü ürün redirect) |
| 201 | 6 | Oluşturuldu |
| 428 | 4 |  |
| 403 | 3 | Yasak |
| 422 | 2 |  |
| 307 | 1 | Geçici (POST) |

**5xx toplam: 545** / 485,906 = **%0.11**. Ana kaynak 10 Ağu SIGPIPE build kazası (~8 dk 502); 14 Ağu'da release-bazlı kesintisiz deploy'a geçildi, tekrarı yapısal olarak engellendi.

## Bot / AI Crawler Dağılımı (UA, dönem)

- googlebot 5,961 · ahrefsbot 2,323 · yandex 1,981 · bingbot 1,587 · applebot 106 · petalbot 2
- **AI motor crawler:** claudebot 1,878 · oai-searchbot 309 · gptbot 14 → toplam **~2,201 hit**. ClaudeBot açık ara lider (1,878) — robots'ta bilinçli açılan fiyat uçlarının AI görünürlük karşılığı. (19 Ağu itibarıyla export ucu botlara kapatıldı; JSON uçları açık.)

## Google Ads (gclid) Landing

- `/urun/karpuz` 1 — Ads kampanyası bu dönemde fiilen durmuş durumda (tek gclid isteği); kampanya bütçesi/durumu Ads panelinden doğrulanmalı.

## Dış Referrer (insan)

- www.google.com 7,002 · yandex.com 165 · myactivity.google.com 125 · tanitio.com 51 · yandex.com.tr 48 · https: 45 · www.google.com.tr 42 · panel.tanitio.com 30 · yandex.ru 24 · chatgpt.com 13 · android-app: 9 · www.bing.com 8 · accounts.google.com 5 · duckduckgo.com 5 · 187.124.166.65:80 4. Google organik (7,002) açık ara ilk kaynak; tanitio.com+panel.tanitio.com (81) yeni entegrasyonun ilk yönlendirmeleri; chatgpt.com (13) AI kaynaklı ilk insan ziyaretleri. (187.124… VPS'in kendi egress IP'sidir, dış site değildir.)

---

## ⚠️ HATALAR / BULGULAR

- **10 Ağu 502 kesintisi (~8 dk):** elle build sırasında SIGPIPE; haftanın 545 adet 5xx'inin ana kaynağı. 14 Ağu'daki release-bazlı deploy geçişiyle yapısal çözüm geldi.
- **Ads fiilen durmuş:** 7 günde tek gclid isteği. Kampanya durumu kontrol edilmeli (bütçe/duraklatma).
- **404: 1,493** — çoğunluğu taranan eski URL'ler; 19 Ağu'daki slug birleştirme/301 turu bu kuyruğu eritiyor.
- **499 (istemci kapattı): 2,249** — ağır analitik/uzun sorgu pencerelerinde birikiyor; 19 Ağu'da analitik sorgu penceresi+ısıtıcı ile azaltıldı.
- **AI crawler ~2.2K/hafta** — ClaudeBot 1,878. Export CSV'ye bot erişimi 19 Ağu'da kapatıldı; JSON fiyat uçları açık.

## Aksiyon Listesi (öncelik sırası)

1. Google Ads kampanya durumunu doğrula (tek gclid — kampanya durmuş görünüyor).
2. GSC'de 19 Ağu birleştirme/301 turunun 404-eritme etkisini izle.
3. Analitik rollup tablosu (audit özeti) — uzun sorguların kökten çözümü (öneri, karar bekliyor).
4. Trafik raporunu haftalık rutine bağla (Ağustos başı boşluğu tekrarlanmasın).

## Genel Durum: SAĞLIKLI — trafik güçlü (63.7K insan istek/gün, %78 mobil), hata oranı %0.11; tek kesinti yapısal olarak çözüldü, Ads tarafı ilgi bekliyor.

