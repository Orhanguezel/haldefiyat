# Production Dependency Audit — 2026-07-26

## Kapsam ve yöntem

- Kapsam: `frontend/package.json` içindeki production bağımlılıkları.
- `bun audit --production` monorepo kilit dosyasını tararken 180 saniyede
  tamamlanmadı.
- Aynı production manifesti izole geçici dizinde npm lockfile'a çözümlendi ve
  `npm audit --omit=dev --json` ile denetlendi.
- Ham sonuç:
  `artifacts/security/dependency-audit-2026-07-26/npm-audit-production.json`.

Bu yöntem registry advisory durumunu doğrular; proje dışındaki monorepo
`bun.lock` dosyasının birebir kilitlenmiş ağaç denetimi değildir.

## Sonuç

| Seviye | Adet |
|---|---:|
| Critical | 0 |
| High | 3 |
| Moderate | 2 |
| Low | 0 |
| Toplam | 5 |

`next-intl` 4.8.3 için doğrudan yayımlanmış iki advisory nedeniyle paket
4.13.4'e yükseltildi. Yükseltme sonrasında `next-intl` adına görünen kayıt,
paketin kendi açığı değil `next` üzerinden aktarılan kayıttır.

Kalan bulgular denetim anındaki Next.js ağacının gömülü `postcss` ve `sharp`
bağımlılıklarından gelir:

- `postcss`: denetim aracı `<=8.5.17` için kaynak haritası/dosya okuma ve CSS
  stringify advisory'leri bildiriyor. Uygulama saldırgan kontrollü CSS derlemiyor;
  kullanım build-time ve güvenilir kaynakla sınırlı.
- `sharp`: `<0.35.0` için libvips advisory zinciri bildiriliyor. Uygulama
  `images.unoptimized: true` kullandığı için Next Image optimizasyonunun canlı
  `sharp` işleme yüzeyi kullanılmıyor.
- `@sentry/nextjs` ve `next-intl` moderate kayıtları bağımsız açık değil,
  yukarıdaki `next` zincirinin etkileridir.

Audit'in önerdiği otomatik “fix”, Next.js'i 9.3.3'e düşürmektedir. Bu, güvenli
ve uyumlu bir düzeltme olmadığı için uygulanmadı. Next.js'in sabitlenmiş
`postcss`/`sharp` sürümlerini içeren kararlı sürümü yayımlandığında yeniden
değerlendirilecek.

Canlı kurulum mevcut semver aralığından Next.js 16.2.12'yi seçti; production
test/build bu patch ile geçti. Yerel ve canlı kurulumun yeniden üretilebilir
kalması için manifest de `16.2.12` sürümüne sabitlendi.

## Kabul ve doğrulama

- Critical açık yok.
- Güvenli doğrudan güncelleme (`next-intl` 4.13.4) uygulandı.
- `tsc --noEmit`, 40 frontend testi ve production build temiz geçti.
- Kalan riskler, etkilenen yüzey ve neden otomatik düzeltme uygulanmadığıyla
  birlikte bu kayıtta arşivlendi.
