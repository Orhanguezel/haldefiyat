# HalDeFiyat Cache ve Transport Denetimi — 2026-07-26

## Ana sayfa ölçümü

Beş ardışık canlı istekte:

| Koşu | TTFB | Toplam |
|---|---:|---:|
| 1 | 521 ms | 642 ms |
| 2 | 384 ms | 504 ms |
| 3 | 236 ms | 365 ms |
| 4 | 185 ms | 320 ms |
| 5 | 178 ms | 302 ms |

Yanıt politikası:

```text
HTTP/2 200
Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate
Content-Encoding: br
Vary: rsc, next-router-state-tree, next-router-prefetch,
      next-router-segment-prefetch, Accept-Encoding
```

## Statik asset ölçümü

Örnek Next.js JavaScript asset'i:

```text
HTTP/2 200
Cache-Control: public, immutable
Expires: 26 Jul 2027
Content-Encoding: br
```

## Değerlendirme

- Brotli canlı HTML ve statik asset yanıtlarında aktiftir.
- Hash'li Next.js asset'leri bir yıl `public, immutable` olarak cache edilir.
- HTTP/2 aktiftir; yanıtta HTTP/3 `Alt-Svc` ilanı yoktur.
- Ana sayfa gerçek zamanlı fiyat/veri içerir, locale cookie'si yazar ve
  UA-bazlı mobil/masaüstü SSR ağacı üretir. Bu koşullarda genel `public` edge
  cache, yanlış cihaz/locale ağacı sunma riski taşır.
- Ölçülen sıcak TTFB 178–236 ms aralığındadır. Mevcut durumda ana sayfayı
  public cache'e geçirmek yerine özel/no-store politikasını korumak güvenlidir.
- HTTP/3 ayrı altyapı fırsatıdır; mevcut SEO/GEO kabulü için bloklayıcı değildir.
