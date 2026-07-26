# Metadata ve Hreflang Kabulü — 2026-07-26

- Ölçülen canlı sürüm: `9a34270a`; yazar başlığı son düzeltmesi: `9bb063e7`
- Sitemap URL: **316**
- HTTP 200: **316**; redirect/4xx/5xx: **0**
- Eksik title/description: **0/0**
- Duplicate title/description kümesi: **0/0**
- H1 sayısı 1 olmayan URL: **0**
- Canonical farkı/eksiği: **0**
- Noindex: **0**
- Title dağılımı: `<30` **5**, `30–60` **310**, `>60` **1**
- Description dağılımı: `<120` **55**, `120–160` **261**, `>160` **0**
- Hreflang self eksiği: **0**
- `tr` eksiği: **0**; `x-default` eksiği: **0**
- Sitemap dışı hreflang hedefi: **0**
- Karşılıksız hreflang ilişkisi: **0**

Tam taramada 60 karakteri aşan tek URL
`https://haldefiyat.com/yazar/orhan-guzel` idi. Kök metadata şablonunun marka
ekini ikinci kez uygulaması `title.absolute` ile giderildi. `9bb063e7` canlı
deploy sonrasında sayfa tekrar ölçüldü: HTTP **200**, title **50**, description
**144** karakter; canonical self, `tr` self ve `x-default` self geçerli.
Dolayısıyla düzeltme sonrası nihai envanterde title `>60`: **0** ve description
`>160`: **0** kabul edilir.

Kısa title/description kümeleri otomatik olarak hata sayılmadı. Bunlarda
eksik/duplicate değer, canonical uyuşmazlığı veya şablon kaynaklı kesilme
bulunmadığından anlamı koruyan kısa metadata olarak kabul edildi.

Ham tam crawl kanıtı aynı dizindeki `report.json` ve `report.md` dosyalarıdır.
