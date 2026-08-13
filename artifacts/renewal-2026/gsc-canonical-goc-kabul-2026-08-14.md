# GSC Canonical Göç Kabulü — 14 Ağustos 2026

## Canlı durum

- Canonical master ürün: 623
- GSC cache'inde denetlenmemiş master: 1
- Google'da indexed-benzeri durumda master: 183
- Canonical varyant/eski URL: 612
- GSC cache'inde denetlenmemiş varyant: 0
- Google'ın redirect olarak gördüğü varyant: 388
- Canlı sitemap URL sayısı: 406
- Canonical harita: 612 eski URL, 0 eksik hedef, 0 zincir, 0 aktif 410 çakışması

## Sitemap gönderimi

`https://haldefiyat.com/sitemap.xml`, mevcut ortak Search Console servisiyle
`sc-domain:haldefiyat.com` mülküne yeniden gönderilmeye çalışıldı. Google yanıtı:

- HTTP: `403`
- reason: `ACCESS_TOKEN_SCOPE_INSUFFICIENT`
- method: `google.searchconsole.v1.SitemapsService.Submit`

Mevcut OAuth bağlantısı URL Inspection ve Search Analytics için salt-okunur kapsamla
çalışıyor. Sitemap yazma işlemi için bağlantının `webmasters` yazma kapsamıyla yeniden
yetkilendirilmesi gerekir. Mevcut token veya credential dosyası değiştirilmedi.

## İzleme planı

1. Günlük tek-indirici `gsc-index-refresh` çalışmaya devam eder.
2. Eski URL'lerde `redirect` sayısı, master URL'lerde `indexed` sayısı haftalık izlenir.
3. Yazma kapsamı yetkilendirildiğinde yalnız mevcut ortak
   `submitSearchConsoleSitemap()` fonksiyonu kullanılır; ikinci GSC istemcisi kurulmaz.
4. Gönderimden sonra sitemap `lastSubmitted`, warning ve error alanları canlı API'den
   doğrulanır.

