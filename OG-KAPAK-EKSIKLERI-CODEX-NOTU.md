# OG kapakları — kalan iş (Codex)

**Durum 16 Eylül 2026, deploy sonrası canlı ölçüm.** Sitemap'ten rastgele 300 URL:

| Kapak türü | Sayfa |
|---|---|
| İçerikli kapak (sayfaya özel) | **259** |
| Jenerik marka kapağı (`/og/default`) | **38** |
| Elle yüklenmiş (`/uploads/og/*.png`, hub sayfaları) | 1 |
| `og:image` hiç yok | **0** |

Başlangıç: 300 sayfanın **201'inde** `og:image` yoktu ve hepsi
`twitter:card = summary_large_image` bildiriyordu — yani görselsiz büyük kart.
Eksiklik kapatıldı; kalan iş jenerik kapakla yetinen aileleri **içerikli**
kapağa geçirmek. Aciliyeti düşük: hiçbir sayfa artık boş önizleme vermiyor.

## Jenerik kapakla kalan aileler

| Aile | Örneklemdeki sayı | Kapakta ne olmalı |
|---|---|---|
| `/firmalar/<şehir>` | 25 | Şehir adı + firma sayısı + "Komisyoncu Rehberi"; taze fiyat varsa 1–2 örnek |
| `/firma/<slug>` | 2 | Firma adı + şehir/ilçe + firma tipi (komisyoncu / soğuk hava / nakliye) |
| `/piyasa/<slug>` | 2 | Şehir + ürün + "Piyasa Kapsamı"; kaynak durumu |
| `/rehber/<slug>` | 2 | Rehber başlığı (analiz kapağı deseni birebir uyar) |
| `/borsa`, `/et-fiyatlari` | 2 | Bölüm başlığı + o günün 2–3 gerçek fiyatı (hal kapağı deseni) |
| `/basin`, `/sahiplik-finansman`, `/veri-kaynagi-politikasi`, `/embed` | 4 | Statik sayfalar — jenerik kapak yeterli, dokunmaya gerek yok |
| `/urun/<borsa ürünü>` | 1 | `kuru-uzum`, `uzum-sultani` gibi hal kataloğunda olmayan borsa ürünleri; ad bulunamayınca "Hal Fiyatı" fallback'ine düşüyor |

## Desen — yeni kapak nasıl yazılır

Kanonik referans: `frontend/src/app/og/urun/[slug]/route.tsx`.
Aynı desenin üç örneği zaten var: `og/hal/[slug]`, `og/fiyat/[sehir]/[urun]`,
`og/analiz/[slug]`.

1. `frontend/src/app/og/<aile>/[param]/route.tsx` — route handler, i18n bağımsız.
   `/api/` nginx'te Fastify'a gittiği için OG namespace'i `/og/`; proxy matcher
   `og/` ile bypass eder.
2. `export const revalidate = 3600`, boyut 1200×630, `loadOgBrandAssets()` +
   `OgBackground` + `OgBrand`, bundled `Outfit-800.ttf`.
3. Aynı cache başlıkları: `max-age=3600, s-maxage=86400, stale-while-revalidate=604800`.
4. Sayfanın `generateMetadata`'sında `openGraph.images` olarak bağla
   (`{ url: \`${SITE_URL}/og/<aile>/<param>\`, width: 1200, height: 630 }`).

### Üç tuzak — hepsi bu turda canlıda yakalandı

1. **Satori: birden fazla çocuk düğümü olan `<div>` explicit `display` ister.**
   `{formatTry(x)} TL/{unit}` üç ayrı metin düğümü üretir ve rota **502** döner.
   Tek dizge ver: `` {`${formatTry(x)} TL/${unit}`} ``. Build ve testler bunu
   yakalamaz — rota ancak çalışırken render edilir, o yüzden deploy sonrası
   her OG rotasını tek tek çağır.
2. **nginx `/og/` yolunu 7 gün cache'liyor** (`proxy_cache_valid 200 7d`,
   `/var/cache/nginx/haldefiyat_og`). Kapak değiştirince
   `rm -rf /var/cache/nginx/haldefiyat_og/* && nginx -s reload` şart, yoksa
   eski görsel bir hafta yaşar.
3. **Görselin var olması yetmez, ayrıştığını doğrula.** `/og/urun/*` aylarca
   her ürün için aynı md5'i döndürüyordu (ad yanlış kaynaktan okunuyordu).
   Kontrol: `curl -s <url> | md5sum` — iki farklı slug farklı hash vermeli.

## Bağlam

- `buildMetadata` (`frontend/src/lib/seo.ts`) hiçbir görsel çözülmezse
  `/og/default`'a düşer; yeni bir sayfa artık kapaksız kalamaz.
- `[locale]/layout.tsx` openGraph'ında da aynı varsayılan var —
  `getPageMetadata` çağırmayan sayfalar oradan miras alır.
- Kendi `Metadata` nesnesini elle kuran sayfalar (`/yazar/[slug]` gibi) bu iki
  katmanı da atlar: sayfa seviyesindeki `openGraph` layout'takini derin
  birleştirmez. Böyle bir sayfa yazarken `images`'ı kendin ver.
