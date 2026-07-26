# Crawl artifact durumu

Bu klasördeki `report.json` ve `report.md`, 2026-07-26 tarihli ilk tam sitemap
koşusudur; **SEO baseline veya kalıcı 404 listesi olarak kullanılmamalıdır**.

Koşu 10 eşzamanlı istekle 345 sitemap URL’sini taradı. Dinamik ürün ve hal
sayfalarının pahalı backend sorguları aynı anda çalışınca:

- 123 URL geçici 404,
- 3 URL 500,
- 39 URL timeout

verdi. Ardından `acur`, `ahududu`, `armut`, `domates`, `ayva` ve `bakla`
örnekleri düşük hacimde tekrar istendi ve tamamı 200 döndü. Bu nedenle rapor,
kalıcı sitemap bozukluğunu değil, yük altında upstream hatasının 404 olarak
maskelenmesi sorununu kanıtlar.

Retry/backoff ve üç eşzamanlı istekli ikinci koşu başlatıldı; DB’de 10–22 saniye
süren fiyat sorguları görüldüğü için canlıyı korumak amacıyla tamamlanmadan
durduruldu. F-43 bulgusu uygulama oturum kaydına eklendi.

Tam kabul crawl’ı, sorgu/fallback dayanıklılığı düzeltildikten sonra düşük
eşzamanlılıkla yeniden alınmalıdır. Açık checklist maddeleri bu nedenle
kapatılmamıştır.
