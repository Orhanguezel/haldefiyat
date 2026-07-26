# Tarım İklim Backlink TODO

Tarih: 2026-07-03

Tarım İklim GEO/GSC çalışması kapsamında bu repoda sonraki turda gerçek, takip edilebilir `<a href>` linkleri eklenmeli. Amaç iframe/widget kullanımından bağımsız olarak Tarım İklim'in şehir, don uyarısı ve metodoloji sayfalarına ekosistem içi otorite sinyali vermektir.

## Hedef

- Hal fiyatı ve ürün arzı içeriklerinde Tarım İklim'e görünür metin linkleri ekle.
- Linkler ürün arzı, bölgesel hava koşulları, don riski veya sezon etkisi bağlamında doğal yerleşsin.
- `rel="nofollow"` kullanılmasın; bu ekosistem içi editoryal referans olarak ele alınsın.

## Önerilen Linkler

- Antalya hava durumu: `https://tarimiklim.com/tr/hava-durumu/antalya`
- İzmir hava durumu: `https://tarimiklim.com/tr/hava-durumu/izmir`
- Bursa don uyarısı: `https://tarimiklim.com/tr/don-uyarisi/bursa`
- Don riski metodolojisi: `https://tarimiklim.com/tr/zirai-don-riski-nasil-hesaplanir`

## Kabul Kriterleri

- En az 2 alakalı public sayfada gerçek `<a href>` linki var.
- Link metni açıklayıcı: `Antalya tarımsal hava durumu`, `Bursa zirai don uyarısı` gibi.
- Linkler canlı sitede HTML içinde JS beklemeden görünüyor.
- Deploy sonrası `curl -L` ile linklerin HTML'de bulunduğu doğrulanıyor.
