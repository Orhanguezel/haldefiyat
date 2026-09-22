# OG kapakları — kapanış raporu

**Tamamlandı: 21 Eylül 2026.** Aşağıdaki içerik aileleri canlıya alındı,
nginx OG önbelleği temizlendi ve gerçek route çıktıları doğrulandı.

| Aile | Uygulanan kapak | Durum |
|---|---|---|
| `/firmalar/<şehir>` | Şehir, aktif komisyoncu sayısı ve rehber bağlamı | ✅ Canlı |
| `/firma/<slug>` | Firma adı, şehir/ilçe ve firma tipi | ✅ Canlı |
| `/piyasa/<slug>` | Bölge, ürün ve piyasa kapsamı | ✅ Canlı |
| `/rehber/<slug>` | Rehber adı, dönem ve sepet ürün sayısı | ✅ Canlı |
| `/borsa`, `/et-fiyatlari` | Bölüm başlığı ve API'deki güncel fiyat örnekleri | ✅ Canlı |
| `/urun/<borsa ürünü>` | Katalogda eşleşme yoksa slug'dan okunur ürün adı | ✅ Canlı |

## 22 Eylül 2026 — üst seviye gezinme sayfaları da kapandı

Tanitio kataloğu "Paylaşım görseli 3 sayfada aynı" bulgusunu tekrar verdi.
Doğru bulguydu: `/fiyat`, `/piyasa`, `/canli-hal-fiyatlari` jenerik
`/og/default` bildiriyordu. Sitemap'in tamamı (885 URL, aile bazında
örneklenerek) tarandığında jenerik kapakla kalan **17 sayfa** çıktı — üçü
değil.

Çözüm: `frontend/src/lib/og-sections.ts` bölüm kapağı kayıt defteri.
Metin (kicker/başlık/alt başlık/alt metni) orada, canlı rakamlar
`/og/bolum/[slug]` route'unda. `sectionOgImage("<slug>")` sayfanın
`generateMetadata`'sına tek satırda bağlanır ve `alt` metnini de taşır.

Kapanan sayfalar: `/fiyat`, `/piyasa`, `/canli-hal-fiyatlari`, `/firmalar`,
`/analiz`, `/rehber`, `/harita`, `/canli-hayvan-fiyatlari`, `/embed`,
`/basin`, `/reklam-ver`, `/ilan-ver`, `/editoryal-politika`,
`/duzeltme-politikasi`, `/veri-kaynagi-politikasi`, `/sahiplik-finansman`.
`/borsa` ve `/et-fiyatlari` aynı kayıt defterine taşındı.

Doğrulama: 18 kapağın tamamı `200 image/png`, **18 farklı md5** — önceki
turun "görselin var olması yetmez" tuzağı burada da ölçüldü.

Bu turda çıkan ikinci kusur: `/ilan-ver` ve `/firmalar/ekle`
`{...getPageMetadata(...)}` yazıyordu — `await` olmadan Promise yayılınca
nesne **boş** kalır. İki sayfanın title/description/canonical'ı hiç
uygulanmamıştı; `/ilan-ver` canlıda site geneli başlığını gösteriyordu.

Kalan tek jenerik kapak `/yazar/haldefiyat-veri-ekibi` (avatarı olmayan
yazar). Tek sayfa olduğu için artık "aynı görsel" bulgusu üretmez.

Canlı sitemap'in ilk 300 URL'si yeniden tarandı: **297 içerikli kapak, 3
jenerik kapak, 0 eksik görsel, 0 istek hatası**. Jenerik kalan üç URL
`/canli-hal-fiyatlari`, `/piyasa` ve `/fiyat`; bunlar bu notta eksik olarak
tanımlanan ailelerin dışında kalan üst seviye gezinme sayfalarıdır.

Canlı kabul kanıtı:

- Tüm yeni uçlar `200 image/png` ve **1200×630** döndü.
- `/og/firmalar/mersin` MD5: `6ce4e63405762772dc4587ab2188fd54`.
- `/og/firmalar/adana` MD5: `a07c47d927cc1776a58359e03c1843fc`.
- `/og/bolum/borsa` MD5: `fce46660f830e3ac07564c5915e6b697`.
- `/urun/kuru-uzum` artık `/og/urun/kuru-uzum` görselini bildiriyor.
- Sayfa metadatalarında yeni route'lar `og:image` olarak bağlıdır.

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

## Başlangıçta jenerik kapakla kalan aileler

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
