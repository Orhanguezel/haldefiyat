# Schema.org Validator ve Rich Results Kabul Kaydı — 2026-07-27

## Schema.org Validator

Resmî `https://validator.schema.org/validate` POST endpoint'i canlı URL
modunda çalıştırıldı. Ham JSON yanıtları bu dizinde URL bazında saklanır.

| URL | Bulunan ana tipler | Hata | Uyarı |
|---|---|---:|---:|
| `/` | Dataset, FAQPage, WebSite | 0 | 0 |
| `/fiyatlar` | BreadcrumbList, DataCatalog, Dataset, FAQPage, WebSite | 0 | 0 |
| `/urun/acur` | BreadcrumbList, Dataset, FAQPage, WebSite | 0 | 0 |
| `/hal/izmir-hal` | BreadcrumbList, Dataset, Place, WebSite | 0 | 0 |
| `/analiz/hal-fiyati-nasil-belirlenir` | BreadcrumbList, NewsArticle, WebSite | 0 | 0 |
| `/rapor/yillik/2025` | Article, BreadcrumbList, WebSite | 0 | 0 |
| `/metodoloji` | Article, BreadcrumbList, WebSite | 0 | 0 |
| `/yazar/orhan-guzel` | BreadcrumbList, ProfilePage, WebSite | 0 | 0 |

Sonuç: sekiz temsilî şablonun tamamında Schema.org toplam hata ve uyarı sayısı
sıfırdır. Ayrıca tam sitemap crawl kanıtında 316/316 URL için JSON-LD parse
hatası sıfırdır.

Tekrar çalıştırma:

```bash
node scripts/seo/schema-validator-audit.mjs \
  artifacts/seo/schema-validator-2026-07-27
```

## Google Rich Results Test

`https://search.google.com/test/rich-results?url=https%3A%2F%2Fhaldefiyat.com%2F`
Google Chrome headless ile URL modunda açıldı. Google test başlamadan
“Something went wrong — Log in and try again” mesajı gösterdi; sayfa DOM'unda
reCAPTCHA engeli de görüldü.

Kanıt ekran görüntüsü:
`../rich-results-test-2026-07-27/home-blocked.png`

Bu nedenle Schema.org kısmı temiz olsa da Google Rich Results Test sonucu
uydurulmadı ve birleşik checklist maddesi açık tutuldu. Kapanış için giriş
yapılmış etkileşimli Google oturumunda aynı sekiz URL'nin desteklenen sonuç
tipleri, kritik hata ve kritik olmayan uyarı çıktıları arşivlenmelidir.
