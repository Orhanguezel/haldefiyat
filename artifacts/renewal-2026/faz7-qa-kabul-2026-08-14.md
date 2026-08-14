# Faz 7–8 canlı QA ve kabul kaydı — 14 Ağustos 2026

## Sonuç

Erişilebilirlik, responsive/reflow, klavye odağı, light/dark tema, public PII,
cache/auth güvenliği ve kritik E2E akışları canlıda doğrulandı. Ana sayfanın mobil
ve masaüstü ağaçları fiziksel route paketlerine ayrıldı; mobil ilk yükte masaüstü
dashboard ağacını taşımıyor. Yedi ekran ailesi için 14 adet light/dark canlı
screenshot üretildi.

Kesin kapatılamayan tek laboratuvar kapısı Lighthouse Performance >=90 hedefidir.
Yerel ölçüm sırasında 12 çekirdekli makinenin load average değeri 15,51–19,84,
birden fazla bağımsız test ve Chrome süreci ise çekirdek başına yaklaşık %80–100
CPU kullanıyordu. VPS yalnız 2 çekirdeklidir. PageSpeed API çağrısı da günlük kota
0 nedeniyle HTTP 429 döndürdü. Bu nedenle mevcut Performance puanı ürün regresyonu
olarak kabul edilmedi; ham raporlar saklandı ve F7.19 kısmi bırakıldı. Aynı koşulda
Accessibility, Best Practices ve SEO puanlarının üçü de 100'dür.

## Canlı release zinciri

- `8b43d6bc`: mobil ve masaüstü ana sayfa paket ayrımı; reklam CTA query düzeltmesi.
- `d860ade3`: açık tema fiyat rozetleri ve landmark etiketleri.
- `fdc039db`, `c3b5d52a`: harita landmark ve heading sırası.
- `30f4a3dc`: Sentry ile Google tag yüklerini ilk render dışına çıkarma.
- `4f03df68`: global arama modalını yalnız açıldığında indirme.
- `5b09f5a3`: dark tema muted/brand foreground kontrast sözleşmesi.
- `30facfd0`: 320 px ürün grafiği kontrol taşmasını kapatma.

Her release `git pull --ff-only`, backend production build, izole frontend/admin
Next build, standalone `server.js` doğrulaması ve PM2 geçişinden geçti. Public
release sonrası `hal-backend`, `hal-frontend` ve `hal-admin` çevrimiçi kaldı.

## Erişilebilirlik kabulü

Canlı axe taraması şu ailelerde tek `main`, tek H1 ve light temada sıfır ihlal
verdi:

| Aile | Rota | Light axe | Ana landmark/H1 |
|---|---|---:|---:|
| Ana sayfa | `/` | 0 | 1 / 1 |
| Ürün | `/urun/domates` | 0 | 1 / 1 |
| Fiyat arşivi | `/fiyatlar` | 0 | 1 / 1 |
| Harita | `/harita` | 0 | 1 / 1 |
| İlanlar | `/ilanlar` | 0 | 1 / 1 |
| Analiz | `/analiz` | 0 | 1 / 1 |
| Veri sağlığı | `/data-health` | 0 | 1 / 1 |

Dark tema ilk taramasında marka zemini üzerindeki sabit beyaz CTA'lar, küçük muted
metin ve bilinmeyen kaynak rozeti tekrarları yakalandı. Sabit beyaz yerine
`--color-brand-fg`, koyu muted için AA tonu ve kaynak fallback rozeti uygulandı;
aynı kökten gelen 97 tekrar kapatıldı. Son canlı dark taramada ana sayfa, fiyatlar,
harita ve ilanlar sıfır axe ihlali; ürün/analiz/data-health ise önceki son turda
sıfır ihlal verdi.

Ek kontroller:

- Skip link, header/nav landmarkları ve tek public `main` sözleşmesi canlıdır.
- Arama modalı açıldığında odak `aria-label="Arama"` inputuna gider; Escape modalı
  kapatır ve odağı tetikleyiciye geri verir.
- Modal kapalıyken arama chunk'ı yüklenmez; ilk açılışta JS resource sayısı 18'den
  19'a çıkar.
- Harita 81 ili klavyeyle odaklanabilir; Enter ile il seçimi ve metinsel tablo
  alternatifi çalışır.
- Fiyat grafiği `role="img"` açıklaması, harita metinsel alternatifi ve durum
  rozetlerinin renk dışı sembolleri vardır.
- 200% zoom kontrolünde `/fiyatlar` yatay sayfa taşması üretmedi.
- Gerçek NVDA/VoiceOver cihazı bu ortamda yoktur; semantik akış Chromium accessibility
  tree, klavye ve axe ile kabul edildi.

## Responsive ve tarayıcı kabulü

- 320, 360, 390, 768, 1024, 1280 ve 1440 px taramaları uygulandı.
- Ana sayfa, ürün, fiyatlar, harita, ilanlar, analiz ve API Pro rotalarında 1024 px
  yatay taşma `0` ölçüldü.
- `/fiyatlar` 320 px'de taşma `0`; ürün grafiği aralık kontrolü son düzeltmeyle
  320 px'de alt satıra geçer.
- Mobil alt navigasyon safe-area padding taşır. Arama modalı sanal klavye alanında
  üstten açılır, scroll ve Escape davranışı testlidir.
- Chromium desktop ve Android Pixel 7 emülasyonu geçti. Gerçek iOS Safari, macOS
  Safari ve Firefox cihaz matrisi dış test ortamı gerektirir.

## Performans kabulü

### Route ve bundle

- Ayrımdan önce mobil ve masaüstü `/`: 17 JS resource, `1.680.503` decoded byte.
- Ayrımdan sonra mobil `/`: 17 JS resource, `1.315.488` decoded byte.
- Ayrımdan sonra masaüstü `/`: 18 JS resource, `1.678.802` decoded byte.
- Mobil decoded JS, masaüstünden yaklaşık `%21,6` daha küçüktür.
- `/home-mobile-render` ve `/home-desktop-render` doğrudan istekleri `/` hedefine
  HTTP 308 döner; sitemap bu yolları içermez; canonical iki UA için de
  `https://haldefiyat.com/` olarak kalır.

### Başlangıç işi azaltmaları

- Sentry ilk bundle'da yaklaşık 2,3 sn scripting üretiyordu. SDK etkileşim veya
  30 sn sonrasına alındı; erken error/unhandledrejection olayları hafif tamponda
  tutulup SDK açıldığında gönderilir.
- GTM/GA başlangıçta yaklaşık 1,5 sn üçüncü taraf ana-thread işi üretiyordu. Etiket
  yükü rıza kabulü, gerçek pointer/keyboard/touch/scroll etkileşimi veya 30 sn
  emniyet zamanlayıcısına taşındı. PII'siz event kuyruğu korunur.
- Global SearchModal/Framer Motion ilk route chunk'ından çıkarıldı ve yalnız modal
  açıldığında indirilir.
- CLS son izole ölçümde `0,0468`; canlı normal TTFB tekrarlarında `0,23–0,39 sn`
  aralığı görüldü.

### Lighthouse kayıtları ve sınır

Yerel doygun hostta son mobil rapor: Performance 58, Accessibility 100, Best
Practices 100, SEO 100; FCP 2,70 sn, LCP 4,02 sn, TBT 1,26 sn, CLS 0,0468. VPS
2-core koşusu: 53/100/100/100. İki Performance sonucu da ölçüm hostu CPU
doygunluğundan etkilenmiştir. Ham JSON'lar
`artifacts/renewal-2026/lighthouse-2026-08-14/` altında çalışma artifact'i olarak
korunur; >=90 kapısı stabil ve izole runner veya PageSpeed kotasıyla yeniden
ölçülmelidir.

## Güvenlik ve gizlilik kabulü

- `scripts/qa/public-api-pii-audit.mjs` canlı listings/prices/products/markets
  endpointlerinde `200` ve `findings=0` verdi. Kanıt:
  `artifacts/renewal-2026/public-api-pii-audit-2026-08-14.json`.
- Upload endpointi yetkisiz isteğe 401; kaldırılan imzalama endpointi 404 döner.
- Cross-site cookie mutation 403 `cross_site_cookie_mutation` verir.
- Auth 401 cevapları `Cache-Control: private, no-store, max-age=0`, `Pragma:
  no-cache`, `Vary: Authorization, Cookie` taşır.
- Call request public akışı telefonu göstermez; oturum yokken güvenli giriş
  yönlendirmesi ve "Satıcıyı ara" semantiği korunur.
- Backend hedefli güvenlik paketi 18/18 geçti; frontend token/tema/fiyat/navigation
  hedefli paketleri ve TypeScript geçti.

## Kritik E2E kabulü

- Ana arama `domates` -> canonical ürün sayfası.
- İlan listesi -> ilan detay -> `#call-request`; telefon public değil.
- Analiz listesi -> rapor; yazdır/PDF `window.print`, paylaş canonical URL ile
  `navigator.share` çağırır.
- Harita klavye Enter -> seçili il -> `/fiyatlar?city=Adana`; tablo alternatifi var.
- API Pro CTA -> `/iletisim?subject=Pro Plan Talebi`; altı required alan ve hazır
  konu.
- Reklam CTA -> `/iletisim?subject=Reklam%20Talebi`; form mevcut, altı required
  alan ve `Reklam Talebi` konusu hazır.

## Görsel kabul seti

`output/playwright/theme-clean-data/live-acceptance-2026-08-14/` dizininde ana
sayfa, ürün, fiyatlar, harita, ilanlar, analiz ve API Pro için light/dark desktop
olmak üzere 14 tam sayfa PNG bulunur.

## Kalan dış kabul kapıları

1. Stabil/izole Lighthouse veya PageSpeed kotasıyla Performance >=90 tekrar ölçümü.
2. Gerçek NVDA/VoiceOver ve iOS/macOS Safari + Firefox cihaz matrisi.
3. 24–72 saatlik gerçek Web Vitals/search/call KPI gözlem penceresi.

Bu üç madde kod eksikliği gibi kapatılmamış; checklistte `[~]` ve dış kabul
bağımlılığı olarak tutulmuştur.
