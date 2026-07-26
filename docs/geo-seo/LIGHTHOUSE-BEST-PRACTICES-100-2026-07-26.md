# Lighthouse Best Practices 100 — Canlı Kabul

## Sonuç

Canlı URL: `https://haldefiyat.com/`

Tarih: 2026-07-26T14:56:52Z

| Kategori | Skor |
|---|---:|
| Performance | 63 |
| Accessibility | 100 |
| Best Practices | **100** |
| SEO | 100 |

Best Practices kategorisinde başarısız audit: **0**.

Kanıt:

- `artifacts/seo/lighthouse-2026-07-26/home-best-practices.report.json`
- `artifacts/seo/lighthouse-2026-07-26/home-best-practices.report.html`

## Kapatılan kayıplar

### OneSignal üçüncü taraf cookie ve Inspector issue

- SDK daha önce her ana sayfa ziyaretinde `lazyOnload` ile yükleniyordu.
- Cloudflare `__cf_bm` üçüncü taraf cookie’si ve OneSignal cookie Inspector
  issue Best Practices skorunu düşürüyordu.
- SDK artık yalnız `/uyarilar` ailesindeki push alarm akışında veya tarayıcı
  bildirim izni daha önce `granted` olmuş kullanıcıda yükleniyor.
- Headless Chrome kabulü:
  - `/`: OneSignal script 0, CSP/console hatası 0
  - `/uyarilar`: OneSignal script 1, CSP/console hatası 0

Bu değişiklik push işlevini kaldırmaz; ana sayfadaki gereksiz üçüncü taraf
başlatmayı erteler.

### Source map

- `productionBrowserSourceMaps` açıldı.
- First-party büyük JavaScript bundle source map’i canlı sunuluyor.
- Repo zaten public GitHub kaynağıdır; server-only kod ve environment sırları
  client bundle’a, dolayısıyla browser source map’e dahil değildir.
- Lighthouse bazı Turbopack map’lerinde “last column out of bounds” bilgi
  mesajları yazsa da `valid-source-maps` ve Best Practices kabulü geçmiştir.

### SRI değerlendirmesi

- OneSignal ana sayfa kritik yolundan çıkarıldı.
- Next.js first-party chunk’ları aynı origin, içerik hash’li ve immutable
  dosyalardır; runtime tarafından üretildiği için manuel SRI eklenmedi.
- Canlı Lighthouse’ta güvenlik/best-practices başarısız audit kalmadı.

## Ayrı kalan iş

`bun audit --production` registry yanıtı 60 saniyeyi geçtiği için dependency
audit tamamlanmış sayılmadı. Bu işlem Lighthouse 100 kabulünden ayrı bir açık
madde olarak tutulur.
