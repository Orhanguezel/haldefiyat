# WCAG, tipografi ve veri rengi kabulü — 14 Ağustos 2026

## Sonuç

Temiz Veri temasının ortak nötr tokenları WCAG 2.x AA eşiklerine göre yeniden ayarlandı. `foreground`, `muted` ve metin olarak kullanılan `faint` her iki ana yüzeyde en az 4.5:1; işlevsel `border` en az 3:1 kontrast sağlar. Düşük kontrastlı `border-soft` yalnız dekoratif ayraç olarak korunur.

## Ölçüm tablosu

| Tema | Token | Sayfa zemini | Kart yüzeyi | Kabul eşiği |
|---|---|---:|---:|---:|
| Açık | foreground | 15.88:1 | 16.90:1 | 4.5:1 |
| Açık | muted | 5.04:1 | 5.36:1 | 4.5:1 |
| Açık | faint | 4.71:1 | 5.01:1 | 4.5:1 |
| Açık | border | 3.03:1 | 3.23:1 | 3:1 |
| Koyu | foreground | 17.09:1 | 16.23:1 | 4.5:1 |
| Koyu | muted | 5.01:1 | 4.76:1 | 4.5:1 |
| Koyu | faint | 5.35:1 | 5.08:1 | 4.5:1 |
| Koyu | border | 3.37:1 | 3.20:1 | 3:1 |

Hesap W3C bağıl parlaklık formülü ve `(L1 + 0.05) / (L2 + 0.05)` oranıyla, `globals.css` içindeki gerçek HSL değerlerinden yapılmıştır.

## Tipografi bütçesi

- Gövde: self-host edilen `IBM Plex Sans Variable`, 100–700 tek değişken ağırlık; Türkçe için `latin` ve `latin-ext` unicode aralıkları tarayıcı tarafından ihtiyaç halinde yüklenir.
- Başlık: yerel `Outfit-800.ttf`, yalnız kullanılan 800 ağırlığı, 48.248 bayt, `next/font/local` preload ve `display: swap`.
- IBM Plex Sans değişken WOFF2 dosyaları: latin 45.712 bayt, latin-ext 30.964 bayt. İtalik, genişlik ekseni ve kullanılmayan statik ağırlıklar yüklenmez.
- Üçüncü web fontu yoktur. Mono veri yüzeyi işletim sistemi monospace yığınına düşer; ek ağ isteği üretmez.

## Ortak ölçek ve veri tokenları

`display`, `h1`–`h4`, `price-xl/lg/md`, `body`, `label`, `caption` ve `data` rolleri responsive `clamp()` ölçeğiyle tanımlandı. Fiyat/veri rolleri tabular rakam kullanır. Grafik serileri, grid, tablo başlığı/hover ve harita low/mid/high/empty/stroke renkleri açık-koyu tema tokenlarına taşındı; Türkiye haritasındaki HSL üretimi kaldırıldı.

## Hydration notu

Canlı `/harita` rotasında temiz Service Worker/cache sonrasında da yalnız harita istemci adasında React #418 oluştuğu doğrulandı. Ağır etkileşimli SVG harita `ssr:false` istemci sınırına alındı; sayfanın başlık, açıklama, breadcrumb ve veri tazeliği içeriği SSR kalır. Canlı kabulte console error=0 ayrıca doğrulanacaktır.

## Canlı kabul

Release `6caefc8a`, Next 16.2.12 izole production build ve PM2 reload sonrasında 390×844 gerçek Chromium kontrolü:

- açık ve koyu temada React hydration/console hatası: 0;
- Türkiye haritası SVG path'leri istemcide yüklendi;
- `document.fonts.check("16px IBM Plex Sans Variable")`: `true`;
- body font ailesi: `IBM Plex Sans Variable`;
- `scrollWidth = viewport = 390`, yatay taşma: 0;
- koyu tema görseli: `output/playwright/theme-clean-data/harita-aa-dark-mobile-2026-08-14.png`.
