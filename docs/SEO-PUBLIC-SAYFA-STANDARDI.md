# HalDeFiyat Public Sayfa SEO Standardı

**Yürürlük:** 14 Ağustos 2026  
**Kapsam:** Tek dilde, prefixsiz Türkçe public route'lar

## Ortak sözleşme

- Her indekslenebilir sayfada benzersiz, kullanıcı görevini anlatan `title`,
  açıklayıcı `description`, tek mantıklı H1 ve kendi URL'sini gösteren HTTPS
  canonical bulunur.
- Türkçe canonical prefixsizdir. `tr` ve `x-default` alternate değerleri aynı
  prefixsiz canonical'a gider; `/tr/...` ayrı bir indeks yüzeyi değildir.
- Canonical ve Open Graph URL'si aynı kaynaktan üretilir.
- İçerik veya doğrulanmış veri bulunmayan dinamik sayfa `noindex,follow` olur;
  sitemap'e yalnız canonical ve indekslenebilir kayıt girer.
- Teknik kayıt güncellemesi tek başına `lastmod` değildir. Fiyat sayfasında son
  kayıt tarihi, firmada son görülme, analizde editoryal güncelleme/inceleme,
  yıllık raporda raporun veri tarihi kullanılır.
- Görünür breadcrumb ile `BreadcrumbList` aynı öğe dizisini kullanır.
- JSON-LD, sayfanın görünür iddiasını aşmaz ve telefon/e-posta gibi gizli veya
  redakte edilmiş alanları geri eklemez.

## Aile matrisi

| Sayfa ailesi | Title/description girdisi | Index kapısı | Schema sınırı | Sitemap `lastmod` |
|---|---|---|---|---|
| Ana sayfa ve fiyat hub'ları | görev + veri kapsamı | public ve kalıcı | `WebSite`, görünür veri varsa `Dataset`/`DataCatalog` | son anlamlı içerik/veri tarihi |
| Canonical ürün | ürün adı, birim, güncel tarih/kaynak | canonical ürün + SEO uygunluğu + fiyat/editoryal değer | fiyat verisi `Dataset`; gerçek satış teklifi yoksa `Product` yok | ürünün son fiyat tarihi |
| Hal detayı | hal adı, şehir, son liste özeti | `seoIndex` + özgün editoryal içerik | `Dataset`, konum için `Place`; işletme değilse `LocalBusiness` yok | halin son fiyat tarihi |
| Firma detayı | firma adı, şehir, faaliyet tipi | aktif/doğrulanmış public firma | gerçek firma için `LocalBusiness`/`Organization` | `lastSeenAt`, yoksa anlamlı oluşturma tarihi |
| Analiz | özgün başlık, dönem ve kapsam | yayınlanmış + yeterli içerik | `NewsArticle`/`Article` | `updatedAt`, `reviewedAt`, sonra `publishedAt` |
| Yıllık rapor | yıl, kapsam ve metodoloji | yayınlanmış veri seti | `Article` + `Dataset` | rapor veri/üretim tarihi |
| İlan | başlık, tür, ürün ve konum | yalnız aktif ve public DTO güvenli ilan | gerçek teklif yüzeyinde `Product`; satıcı telefonu yok | ilan güncelleme/yayın tarihi |
| Yasal/kurumsal | politika adı ve amacı | kalıcı public belge | uygun olduğunda `Article`; firma sayfası olmayan belgeye `Organization` eklenmez | belgede görünen son güncelleme |
| Auth, hesap ve form | kullanıcı görevi | her zaman `noindex` | ticari/veri schema'sı yok | sitemap dışı |

## Sayfa anahtarı ve override kuralı

`getPageMetadata` içinde ayrıntı sayfasının anahtarı liste sayfasıyla paylaşılmaz.
Örneğin hal listesi `hal`, hal detayı `hal_detay` kullanır. Çoklu fallback gereken
firma route'larında anahtarlar en özgülden genele sıralanır. Kod içi dinamik
başlık/açıklama yalnız aynı ayrıntı anahtarına ait CMS override'ı varsa ezilebilir;
liste şablonu dinamik detay metadata'sını ezemez.

## Görsel ve LCP kuralı

Temiz Veri temasının ilk ekranı metin ve veri odaklıdır; dekoratif hero görseli
yoktur ve bu nedenle yapay bir görsel preload edilmez. Ürün görseli kullanılırsa
sabit ölçü, doğru `sizes`, açıklayıcı `alt` ve hafif/stabil fallback zorunludur.
Kaynağı ve lisansı kanıtlanamayan fotoğraf yeni bir yüzeye taşınmaz.

