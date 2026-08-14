# Faz 0 Teknik Envanter ve Tasarım Bazı

**Tarih:** 13 Ağustos 2026

**Kapsam:** `frontend/src`, public route ağacı, tema/hydration, ortak bileşenler ve ana veri akışları.

## Özet

- Public sayfa sayısı: **58** (`frontend/src/app/[locale]/(public)/**/page.tsx`).
- TSX bileşen/sayfa sayısı: **213**.
- Client island sayısı: **90** (`use client`); ağır etkileşimli grafik, harita, arama ve form bileşenleri öncelikli inceleme alanıdır.
- Hard-coded renk sınıfı/hex eşleşmesi: **349**. Token katmanı mevcut fakat tüm yüzeylere uygulanmamış.
- Emoji içeren TS/TSX satırı: **170**. Bunlar içerik emojisi, durum ikonu ve dekoratif kullanım olarak ayrıştırılmalıdır; erişilebilir ikon yerine kullanılanlar kaldırılmalıdır.

## Tema ve hydration akışı

1. Root layout `suppressHydrationWarning` ile HTML'i üretir.
2. `next-themes`, `data-theme` attribute'unu istemcide yönetir ve sistem tercihini okuyabilir.
3. Kod sabiti `DEFAULT_THEME="light"` olmasına rağmen sağlayıcı `defaultTheme="dark"` kullanıyordu; ilk ziyaret davranışı çelişkiliydi.
4. Toggle mount öncesinde 36x36 placeholder döndürerek ikon hydration farkını önler.
5. Bağlayıcı tema kararı açık varsayılandır; sistem/kullanıcı seçimi sonradan korunur.

## Token ve hard-code envanteri

`globals.css` marka, semantik, nötr, yüzey, harita, font, gölge ve radius tokenlarını tanımlıyor. Borçlar:

- neon lime `hsl(102 85% ...)` fiyat-veri markası için fazla parlak;
- ambient orb ve dot-grid eski terminal/kripto yönünden kalma;
- Tailwind palette sınıfları token katmanını 349 noktada deliyor;
- radius, shadow ve genişlikler ortak bileşen yerine sayfa içinde tekrar ediyor;
- tema meta renkleri ile CSS marka rengi aynı sözleşmeden üretilmiyor.

Geçiş sırası: temel renkler → focus/radius/shadow → ortak Button/Input/Card/Table → sayfa aileleri → kalan hard-code denetimi.

## Public sayfa aileleri

- **Veri:** ana sayfa, fiyatlar, ürün, hal, şehir, harita, endeks, karşılaştırma, canlı hayvan, et, borsa.
- **Editoryal:** analiz, rapor, metodoloji, rehberler ve içerik sayfaları.
- **Pazar:** ilan listesi/detayı/verme, firmalar ve firma detayları.
- **Kurumsal:** API docs/Pro, embed/widget, reklam ve kurumsal bilgi.
- **Güven/yasal:** hakkımızda, iletişim, sahiplik-finansman, KVKK, gizlilik, kullanım koşulları, düzeltme.
- **Auth/kişisel:** giriş, kayıt, favoriler, uyarılar ve kullanıcı paneline geçiş yüzeyleri.

## Ortak UI önceliği

Yüksek tekrar: `Header`, `Footer`, `PageContainer`, `Button`, `Input`, `Badge`, `Breadcrumb`, `BannerSlot`, fiyat tabloları/kartları ve freshness badge. Orta tekrar: arama/select, pagination, product image, favorite ve newsletter. Sayfaya özel: Türkiye haritası, grafikler, listing formu ve API örnekleri.

## Veri endpoint/cache/fallback özeti

- Ana sayfa `force-dynamic`; widget, market, product, listing ve overview çağrılarını paralel yapıyor.
- API istemci katmanı `frontend/src/lib/api.ts` ve endpoint sözleşmeleri `frontend/src/config/api-endpoints.ts` altında merkezileşmiş.
- Mobil ana sayfa UA ile sunucuda ayrılıyor; masaüstü ağacı mobil istemciye gönderilmiyor.
- Fallback metinleri görünür `Bilinmiyor`/boş durum şeklinde olmalı; sentetik veya stale değer güncelmiş gibi gösterilmemeli.
- Revalidate/cache değerleri endpoint bazında sonraki performans ölçümünde doğrulanacaktır; ana sayfa dinamikliği cache ile varsayılmayacaktır.

### Doğrulanmış endpoint/cache/fallback matrisi (14 Ağustos ek denetimi)

Tüm ortak server fetch'leri 15 saniye timeout uygular; başarısız HTTP veya ağ
hatasını loglayıp aşağıdaki açık boş/unknown durumuna düşer. Boş fallback gerçek
veri gibi gösterilmemelidir.

| Aile | Public API | Next revalidate | Fallback |
|---|---|---:|---|
| Fiyat listesi | `/prices` | 300 sn | boş liste + sıfır meta |
| Ürün sözlüğü | `/prices/products` | 300 sn | `[]` |
| Ürün editoryal | `/prices/editorial/:slug` | 300 sn | `null` (404 dahil) |
| Varyantlar | `/prices/variants/:slug` | 3.600 sn | `[]` |
| Haller | `/prices/markets` | 300 sn + `markets` tag | `[]` |
| Genel ölçüler | `/prices/overview` | 300 sn | sıfırlar + `freshness:unknown` |
| Kaynak sağlığı | `/sources/status` | 120 sn | `items:[]` |
| Firma liste/detay | `/firms`, `/firms/:slug` | 300 sn | boş envelope / `null` |
| İlan liste/detay | `/listings`, `/listings/:slug` | 120 / 60 sn | boş envelope / `null` |
| İlan eşleşme panosu | `/listings/board` | 120 sn | `null` |
| Şehir haritası | `/prices/city-map` | 300 sn | boş liste + istek bağlamı meta |
| Trend | `/prices/trending` | 60 sn | `[]` |
| Fiyat geçmişi | `/prices/history/:slug` | 300 sn | `[]` |
| Perakende | `/prices/retail/:slug` | 600 sn | `[]` |
| Widget/haftalık analiz | `/prices/widget`, `/analysis/weekly-reports` | 300 sn | `[]` |
| Haftalık analiz detay | `/analysis/weekly-reports/:slug` | no-store | `null` |
| Yıllık rapor yılları/rapor | `/reports/annual/years`, `/reports/annual` | 21.600 sn | `[]` / `null` |
| Yazar liste/detay | `/authors`, `/authors/:slug` | 300 sn / no-store | `[]` / `null` |
| Üretim | `/production*` | 3.600 sn | `[]` |
| Endeks | `/index/latest`, `/index/history` | 300 sn | `null` / `[]` |
| CMS/yasal | `/custom-pages/by-slug/:slug` | 3.600 sn | `null` |
| Sosyal akış | `/social/feed` | 300 sn | `[]` |

Backend doğrudan API cache header'ları fiyat çekirdeğinde 120–3.600 sn, yıllık
raporda 21.600 sn'dir. Örneğin history doğrudan API'de 3.600 sn iken RSC fetch
katmanı 300 sn'dir; katmanlar farklı tüketicileri hedeflediği için bu fark
envanterde bilinçli olarak görünür tutulur. `force-dynamic` public sayfalar her
sayfa isteğinde render edilir; ürün sayfası ISR `revalidate=300` ile 14 fetch'in
cache sözleşmesini korur.

## Canlı ölçüm bazı — 14 Ağustos 2026

### Trafik ve ürün hunisi

- Dedike nginx logu, 7–13 Ağustos yedi tam gün: 499.625 istek; 468.090 insan
  isteği; 7.860 gerçek JS pageview (**1.123/gün**); mobil **%77**.
- 5xx: 718 / 499.625 = **%0,14** (301×504, 216×500, 201×502).
- Son 30 gün audit (bot/internal hariç): ana sayfa 1.827, ürün detay 11.739,
  fiyat listesi 1.775, ilan listesi 131, ilan detay 58, iletişim 15 görünüm.
- Son 30 gün sonuçları: 12 bülten kaydı, 0 ilan mesajı, 0 iletişim mesajı,
  0 arama talebi. Ürün arama aç/gönder/seç eventleri henüz ayrı ölçülmediği için
  search-success bazı **ölçülemiyor** olarak kaydedildi; sıfır varsayılmadı.
- CTA: mobile home sticky 598 gösterim/2 başarı (**%0,33**); fiyat listesi strip
  toplam 769 gösterim/8 başarı (**%1,04**).

### Veri kalitesi ve ETL

- `hf_price_history`: 1.055.511 satır; son veri tarihi 13 Ağustos 2026.
- Min/max orta noktasıyla birebir aynı `avg_price`: 809.322 satır (**%76,68**).
- Boş/unknown birim: 0; ürün ana birimiyle tarihsel satır birimi farklı:
  147.161 satır (**%13,94**). Bu ikinci sayı yanlışlığın kanıtı değil, inceleme
  kohortudur; paket/kg tarihçesi ve canonical ürün göçü birlikte değerlendirilir.
- Fiyat ve retail karantina tablolarında bu ölçüm anında satır yok.
- 24 saat ETL: "3+ error, 0 ok" kaynak yok; tek son-koşu hatası `izmir_balik`
  HTTP 500. Yedi günden uzun akışsız: `kocaeli_merkez`, `mersin_resmi`,
  `canakkale_resmi`.

### Search Console/canonical

- 623 master URL'nin 622'si GSC cache'inde denetlenmiş; 183'ü indexed-benzeri.
- 612 eski/varyant URL'nin tamamı denetlenmiş; 388'i redirect durumunda.
- Sitemap 406 URL. Yeniden gönderim, mevcut readonly OAuth kapsamı nedeniyle
  403 `ACCESS_TOKEN_SCOPE_INSUFFICIENT`; ikinci istemci kurulmadı.

## KPI sahiplik ve hedef tablosu

| KPI | Baz | Hedef/eşik | Ölçüm kaynağı | Sorumlu |
|---|---:|---:|---|---|
| Mobil LCP | 4,0 sn ilk düzeltme koşusu | ≤2,5 sn, 3 koşu medyan | Lighthouse + RUM | Frontend/Orhan |
| CLS | 0 | ≤0,1 | Lighthouse + RUM | Frontend/Orhan |
| Gerçek JS pageview | 1.123/gün | haftalık >%20 düşüşte inceleme | nginx track beacon | Büyüme/Orhan |
| 5xx oranı | %0,14 | <%0,10; 502 deploy dışı sıfır | dedike nginx + PM2 | Operasyon/Orhan |
| Mobil CTA başarı | %0,33 | ilk kontrollü deneyde ≥%1 | `hf_cta_events` | Ürün/Atakan + Orhan |
| Fiyat strip CTA başarı | %1,04 | ilk kontrollü deneyde ≥%2 | `hf_cta_events` | Ürün/Atakan + Orhan |
| Arama başarısı | ölçülemiyor | event sözlüğü sonrası baz + hedef | GA4/first-party event | Ürün + Analytics |
| Sentetik ortalama sınıflaması | %76,68 midpoint proxy | satırların %100'ü gerçek/sentetik işaretli | DB/ETL | Veri/Orhan |
| Birim inceleme kohortu | %13,94 | kanıtlı kohort tamamlanması; public yanlış birim 0 | DB dry-run + fixture | Veri/Orhan |
| Kritik karantina SLA | kuyruk 0 | kritik <24 saat, warning <72 saat | quarantine tabloları/admin | Veri operasyonu |
| Akışsız kaynak | 3 | 0 veya belgeli devre dışı | `etl-health.sh 24` | ETL/Orhan |
| GSC master indexed-benzeri | 183/623 | 2/4/8 haftada düşüş yok, artış trendi | tek GSC cache/inspector | SEO/Orhan |
| Arama talebi dönüşümü | 0/0 | ilk 30 geçerli talep sonrası eşik belirle | call-request DB + analytics | Ürün/Atakan |

KPI hedefleri ürün/operasyon inceleme eşikleridir; gelir veya hukuki garanti
değildir. Ads/GA4 ayrı property ve tüzel kişi kararları sahip onayı gerektirir.

## Telefon veri akışı

`DB listing/contact fields → repository/model → controller → public DTO sanitizer → list/detail API → ListingCard/detail page`. Public DTO `contactPhone:null`, `raw:null` döndürür; serbest metin telefon/e-posta redaksiyonu API'den önce uygulanır. Yetkili arama talebi ayrı `hf_listing_call_requests` kaydı ve durum makinesi üzerinden yürür. Owner/admin verisi public DTO ile birleştirilmez.

## Ürün veri akışı

`Kaynak satırı → ETL parse → normalize/match-key/alias → canonical product + unit → price row → product-unit-labels → public API → display-name guard → sayfa/tablo/widget`. Aynı ada sahip farklı birimler merge edilmez; kullanıcıya `Limon (Kg)` / `Limon (Kasa)` örneğindeki gibi birim etiketi gösterilir. Şüpheli eşleşme karantina/inceleme hattına yönlenmelidir.

## İlk kabul hedefleri

- İlk fiyat sonucuna mobil ve desktopta en fazla 1 arama + 1 seçim.
- İlk ziyarette açık tema; kullanıcının koyu tema tercihi kalıcı.
- Public ilan telefon sızıntısı: 0.
- `Invalid Date`, ham source key ve anlamsız `(...)`: kritik yüzeylerde 0.
- Ana sayfa/ürün/analiz/ilan/data-health için WCAG AA kritik ihlal: 0.
- Mobil LCP hedefi ≤2.5 s, CLS ≤0.1, INP ≤200 ms; gerçek baz değerleri canlı Lighthouse/CrUX kanıtıyla kaydedilir.

## Canlı tema ve ana sayfa ölçümü

Release `c9df3079` sonrası temiz tarayıcı profiliyle:

- ilk ziyaret `data-theme=light`, body zemini `rgb(246, 248, 247)`;
- kayıtlı `localStorage.theme=dark` tercihi reload sonrasında korunuyor, body zemini `rgb(11, 13, 20)`;
- masaüstü 1440×1100 sayfa yüksekliği 9.289 px;
- mobil 390×844 sunucu ağacı ilk ölçümde 16.465 px/13 section; IA sadeleştirmesi sonrası 11.759 px/9 section (yaklaşık %29 daha kısa);
- mobil ilk fiyat rotası ilk ekrandaki “Fiyatları incele” bağlantısıyla bir tık uzakta;
- ana sayfa, ürün ve ilan listesinde tarayıcı konsol hatası 0; ilan listesinde `tel:` bağlantısı 0;
- görsel kanıtlar `output/playwright/theme-clean-data/` altında tutuldu.

Mobil sayfa kısaltılmış olsa da 11.759 px/9 bölüm hâlâ ana görev sonrası ikincil içerik barındırır; gerçek etkileşim verisine göre ek özetleme yapılmalıdır.
