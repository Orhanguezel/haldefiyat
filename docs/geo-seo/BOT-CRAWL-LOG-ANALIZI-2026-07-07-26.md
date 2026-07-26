# Bot Crawl Log Analizi — 07–26 Temmuz 2026

## Kaynak ve kapsam

- Kaynak: Nginx `haldefiyat.access.log` ve 20 günlük rotate arşivi.
- Frontend HTML istekleri Nginx logunda bulunduğu için ana kaynak budur.
  `audit_request_logs` ağırlıkla backend/API isteklerini kapsar ve frontend bot
  görünürlüğü için tek başına yeterli değildir.
- `HalDeFiyat-SEO-Audit` user-agent’lı kendi crawl isteklerimiz çıkarıldı.
- User-agent doğrulanmış bot kimliği değildir; özellikle `ChatGPT-User` hacmi
  spoof edilmiş otomasyon içerebilir.

## Dağılım

| User-agent sınıfı | Toplam | 200 | 404 | 499 | 5xx |
|---|---:|---:|---:|---:|---:|
| Googlebot | 11.197 | 8.769 | 26 | 0 | 0 |
| Bingbot | 3.401 | 2.996 | 97 | 1 | 1 |
| GPTBot | 1.409 | 1.206 | 2 | 0 | 1 |
| ChatGPT-User | 17.799 | 17.555 | 12 | 131 | 16 |
| ClaudeBot | 3.530 | 3.482 | 10 | 4 | 0 |
| CCBot | 321 | 317 | 1 | 0 | 0 |
| PerplexityBot | 2 | 2 | 0 | 0 | 0 |

Googlebot’taki 301/308 yanıtları sırasıyla 1.993/396; Bingbot’ta 274/29’dur.
Bunlar eski/prefixli URL keşfi ve canonical yönlendirme yükünün ayrıca
izlenmesi gerektiğini gösterir.

## Öne çıkan hata yolları

- Bingbot:
  - `/sitemap.txt` 7 kez 404
  - `/sitemap_index.xml` 6 kez 404
  - `/sitemaps.xml` ve `/sitemap.xml.gz` 5’er kez 404
  - Bazı eski/alternatif ürün slug’ları 404
- Googlebot:
  - 404’lerin bir kısmı `/alertsPOST`, `/pricesGET` gibi dokümantasyon veya
    bot tarafından birleştirilmiş endpoint/metot dizgileri.
  - Eski ürün varyantları ve WordPress tarama denemeleri de var.
- ChatGPT-User:
  - 499’lar ağırlıkla pahalı dinamik ürün sayfalarında.
  - 500/502 örnekleri `/urun/kiraz`, `/hal/kayseri-hal`,
    `/urun/domates-pembe` ve `/fiyatlar`.

## Karar

- Googlebot için 5xx gözlenmedi; temel crawl erişimi sağlıklı.
- F-43 ile uyumlu dinamik ürün/hal dayanıklılık sorunu ayrı çözülmelidir.
- Eksik alternatif sitemap adlarına yeni sitemap üretmek gerekli değildir;
  standart `/sitemap.xml` robots.txt içinde yayımlanıyor.
- Eski ürün slug’ları redirect envanteri ve tam crawl maddesinde ele alınmalıdır.
- User-agent doğrulaması yapılmadan AI trafik hacmi marka görünürlüğü KPI’ı
  olarak kullanılmamalıdır.
