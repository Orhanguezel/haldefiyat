# HaldeFiyat Trafik Analizi — 31 Mayıs – 5 Haziran 2026 (6 gün)

> Kaynak: VPS `/var/log/nginx/haldefiyat.access.log` (.1–.5 + current). Üretim: 2026-06-06 (VPS saati 05 Haz 23:28 UTC).
> Not: UTC günü henüz 05 Haziran. "6 Haziran" verisi (UTC) daha başlamadı; dönem örnek raporla paralel olarak **31 May → 05 Haz / 6 gün** alındı.

## Özet Tablo

| Metrik | Değer |
|---|---|
| Toplam istek | **162,652** |
| İnsan trafik (yaklaşık) | **149,425** (%91.9) |
| Bot/Crawler trafik | **13,227** (%8.1) |
| Günlük ort. insan trafik | **24,904/gün** |
| Mobil / Masaüstü (insan) | **%66 / %34** |
| Google Ads tıklama (gclid) | **1,762 istek** |
| → benzersiz IP (reklam tıklayan) | **683** |

## Öncesi / Sonrası (önceki rapor: 27–31 May "sonrası" = 19,248/gün)

| Metrik | Önceki (27–31 May, 5g) | Bu dönem (1–5 Haz, 5g; 31 May örtüşme hariç) | Değişim |
|---|---|---|---|
| Günlük insan istek | 19,248 | 24,706 | **1.28×** |
| Mobil oran | %52 | %65 | **+13 puan** |
| 5xx hata | 74 | **2** | **-97%** |

Trafik büyümesi sürüyor; mobil kayması kalıcı hâle geldi.

> ⚠️ **Not:** Yukarıdaki "insan trafik" = HTTP **istek** sayısı, **ziyaretçi değil**. Gerçek ziyaretçi sayısı için aşağıdaki "Gerçek Ziyaretçi vs İstek Hacmi" bölümüne bak.

## Gerçek Ziyaretçi vs İstek Hacmi (GSC mutabakatı)

GSC ("199 web arama tıklaması", 6 hafta) ile bizim log farklı şeyleri sayar — **çelişki yok**. GSC yalnızca **Google organik arama** tıklamasını sayar; bizim log **tüm HTTP isteklerini** (organik + Ads + direkt + sosyal + bot + API + statik). Asıl gerçek-insan göstergesi sitenin **kendi JS pageview sayacı** (`/api/v1/track/pageview`) — sadece gerçek tarayıcıda JS çalışınca tetiklenir.

### Trafik hunisi (6 gün toplam → günlük ort.)

| Katman | 6 gün | Günlük | Ne ölçer |
|---|---|---|---|
| Toplam istek | 162,780 | 27,130 | Tüm HTTP istekleri (bot dahil) |
| İnsan istek (UA) | 149,538 | 24,923 | UA bot değil |
| İnsan sayfa isteği | 103,806 | 17,301 | + prefetch + gizli bot |
| **Sıkı-UA sayfa** | 103,611 | 17,268 | Gerçek tarayıcı UA — **fark %0.2** |
| **🎯 Gerçek JS pageview** | **2,299** | **~383** | **Gerçekten render eden insan** |
| Uniq IP (sayfa) | — | 284–572 | Ayrı cihaz (CGNAT ile az) |
| Ads inişi (gclid sayfa) | 830 | ~138 | Reklam tıklayan gerçek iniş |
| Google organik iniş | 505 | ~84 | Organik arama inişi |
| GSC organik tıklama | — | ~33 | GSC'nin saydığı dilim |

### Kritik bulgu — UA filtresi şişkinliği çözmez
Sıkı UA filtresi (yalnızca Chrome/Safari/Firefox/Edge motoru) uyguladığımızda sayfa isteği **103,806 → 103,611**, yani **sadece %0.2 düşüyor**. Demek ki "insan" diye sayılan trafiğin büyük kısmı tuhaf-UA'lı tembel bot değil; **gerçek tarayıcı UA'sı taşıyan ama JS çalıştırmayan prefetch + gizli scraper**. Normalde 1 pageview ≈ 3–5 istektir; bizde 17,301 sayfa-isteği / 383 gerçek-pageview ≈ **45×**.

### Doğru okuma
- **Trend geçerli** ✅ — büyüme/mobil aynı metrik zaman içinde kıyaslandığı için doğru.
- **Mutlak sayı yanıltıcı** — "24,923 insan/gün" = *istek hacmi*, **25 bin kişi değil**.
- **Gerçek engaged insan ≈ 383 pageview/gün**; gerçek ziyaretçi birkaç yüz/gün (GSC mertebesiyle uyumlu).
- **KPI önerisi:** gerçek-insan için `track/pageview`, altyapı yükü için nginx istek hacmi — iki sayı ayrı raporlanmalı.

## Günlük Trafik

| Tarih | İnsan | Bot | Toplam | Uniq IP | Mobil% |
|---|---|---|---|---|---|
| 31 May | 25,897 | 2,850 | 28,747 | 572 | %70 |
| 01 Haz | 25,657 | 4,153 | 29,810 | 402 | %63 |
| 02 Haz | 22,372 | 1,474 | 23,846 | 284 | %64 |
| 03 Haz | 19,192 | 1,660 | 20,852 | 300 | %63 |
| 04 Haz | 31,179 | 1,869 | 33,048 | 431 | %67 |
| 05 Haz | 25,128 | 1,221 | 26,349 | 398 | %68 |
| **TOPLAM** | **149,425** | **13,227** | **162,652** | — | **%66** |

- En yüksek gün: **04 Haz (31,179 insan)**. En düşük: 03 Haz (19,192).
- Uniq IP 284–572 bandında — insan istek 6× iken uniq IP düşük: mobil operatör CGNAT IP havuzu ziyaretçiyi olduğundan az gösterir (gerçek değil).

## Saatlik Dağılım (insan, UTC — TR = +3)
- Tepe: **10:00 UTC (13:00 TR) = 12,598**, ardından 17:00 (11,663) ve 09:00 (11,076).
- Sabah (08–11 UTC) + akşam (17–18 UTC) çift piki. Gece düşük.

## HTTP Sağlık (durum kodları)

| Kod | İstek | Açıklama |
|---|---|---|
| 200 | 150,068 (%92.3) | Başarılı |
| 301 | 6,921 | Kalıcı yönlendirme |
| 204 | 2,302 | İçerik yok (track) |
| 304 | 1,614 | Cache |
| 404 | 1,263 (%0.78) | Bulunamadı |
| 499 | 226 | İstemci kapattı |
| 308 | 172 | Kalıcı (POST) |
| 400 | 36 | Hatalı istek |
| 401 | 17 | Yetkisiz |
| **502** | **2** | **Backend kapalı** |

**5xx toplam: yalnızca 2** (her ikisi 502: 31 May `/urun/carli-biber`, 05 Haz 16:27 `/`). Backend kaya gibi sağlam — önceki dönemdeki 74'ten %97 düşüş. error.log'daki tek kayıt da bu 05 Haz 16:27 upstream reset.

## Bot / AI Crawler Dağılımı (UA)
- claudebot **3,355** · gptbot 1,733 · oai-searchbot 189 → **AI motor crawler toplam ~6,012 hit**
- googlebot 1,707 · yandex 863 · applebot 701 · bingbot 282 · ahrefsbot 287
- AI crawler'lar Googlebot'un ~3.5 katı → IndexNow + GEO etkisi güçlü.

## Google Ads (gclid) Landing
- `/` (ana sayfa) **938** · `/api/v1/track/pageview` 730 · `/fiyatlar` yalnızca **41**
- ⚠️ Reklam hâlâ ana sayfaya düşüyor, `/fiyatlar`'a değil — önceki raporun aksiyonu **hâlâ açık**.

## Dış Referrer (insan)
- www.google.com 1,245 · youtube.com 86 · googleads.doubleclick 31 · google.com.tr 20 · accounts.google 12 · yandex 10
- Spam (yok sayıldı): dreametrip, aveuka, sscnicin.in, comfortweather, eatopiablog.

---

## ⚠️ HATALAR / BULGULAR

### 1. 🔴 GERÇEK KULLANICI 404'ü — kırık ürün linkleri (ÖNCELİK)
`/urun/*` sayfalarında 404'ler **bot değil**: **60 mobil + 55 masaüstü gerçek kullanıcı**, referer kendi `/fiyatlar` sayfamız.
- Etkilenen slug'lar: `/urun/ucburun-koy-b`, `/urun/yesil-dolma-b`, `/urun/bezelye-taze`, `/urun/mercan-kosk`, `/urun/e-kulak` — slug'lar **kesik/bozuk görünüyor**.
- Anlam: `/fiyatlar` listeleme sayfasındaki ürün linkleri, var olmayan ürün slug'larına gidiyor → kullanıcı ölü sayfaya çarpıyor.
- **Aksiyon:** `/fiyatlar` ürün link slug üretimi ile gerçek ürün sayfası slug'ı eşleşmiyor; slug truncation / normalize hatası. Listeleme link generator'ı incelenmeli.

### 2. 🟡 `/_next/static/chunks` 404 — ChunkLoadError imzası
~40 adet chunk 404, referer kendi ürün sayfalarımız (`/urun/kiraz-salihli`, `/urun/oval-domates`...).
- Bu, CLAUDE.md'de uyarılan **eski HTML'in silinmiş chunk'a işaret etmesi** durumu (deploy sonrası `pm2 reload` ≠ `restart`).
- Hacim küçük ama gerçek. **Aksiyon:** Son frontend deploy'unda `pm2 restart hal-frontend hal-admin --update-env` kullanıldığı doğrulansın (reload DEĞİL).

### 3. 🟢 Zararsız tarayıcı/scanner gürültüsü (aksiyon yok)
- `/wp-admin/install.php` (120), `/admin/.env` `/core/.env` `/backend/.env` (7'şer) = güvenlik açığı tarayıcıları, doğru şekilde 404.
- `/.well-known/traffic-advice` (95) = Chrome prefetch probe, normal.

### 4. 🟡 `/api/fiyat` 404 (35) — yanlış/eski API yolu
Bir yerde (eski cache'li istemci veya yanlış link) `/api/fiyat` çağrılıyor; doğru yol `/api/v1/prices`. Kaynağı bulunmalı (düşük öncelik).

---

## Aksiyon Listesi (öncelik sırası)
1. **[P1]** `/fiyatlar` → `/urun/{slug}` kırık linkleri düzelt (slug eşleşmesi). ~115 gerçek kullanıcı/dönem ölü sayfaya gidiyor.
2. **[P2]** Son deploy'un `pm2 restart` (reload değil) ile yapıldığını doğrula → chunk 404 biter.
3. **[P2]** Google Ads landing'i `/` → `/fiyatlar` veya `/canli-hal-fiyatlari`'ya çevir (bounce + newsletter CTA).
4. **[P3]** `/api/fiyat` çağrı kaynağını bul, `/api/v1/prices`'a yönlendir veya kaldır.

## Genel Durum: 🟢 SAĞLIKLI + BÜYÜYOR
- Trafik 1.28× büyüdü, mobil %66 kalıcı, backend 5xx ≈ sıfır (2/162.652 = %0.001).
- Tek somut teknik borç: `/fiyatlar` ürün link slug eşleşmesi (gerçek kullanıcı 404'ü).
