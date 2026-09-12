# Ürün indeksleme incelemesi — 12 Eylül 2026

Kapsam: Kullanıcının paylaştığı üç listede yer alan toplam 150 ürün. Karar; son 30 günlük Google arama sinyali, canlı fiyat serisinin gün/hal kapsamı, kanonik çakışma ve özgün editoryel içerik birlikte değerlendirilerek verildi.

## İndekse alınanlar

| Ürün | Arama sinyali (30g) | Canlı veri | İşlem |
|---|---:|---|---|
| Palamut | 0 | 26 ayrı gün, 2 hal | Yeni ve kaynak kontrollü 6 bölümlü editoryel; tutarlı-niş kapısıyla indeks |
| İskorpit | 108 | 16 ayrı gün, 1 hal | Kaynaksız tonaj/sezon iddiaları kaldırıldı; 6 bölüm yeniden yazıldı; tutarlı-niş kapısıyla indeks |

Palamut, listede ölçülmüş arama gösterimi bulunmamasına rağmen sezonun açılmış olması, güçlü ürün niyeti ve kesintisiz canlı seri nedeniyle değerlidir. İskorpit ise hem ölçülmüş talep hem de en az 15 farklı güne yayılan gerçek fiyat serisi taşır.

## Şimdilik noindex kalan öncelikli ürünler

| Ürün | Arama sinyali (30g) | Neden |
|---|---:|---|
| Kekik (Yaş-Taze) | 691 | Yalnız 13 ayrı gün veri; ayrıca güçlü `kekik` ana sayfasıyla niyet çakışması var |
| Mangostan | 228 | Son 30 günde yalnız 1 gün ve 1 hal; veri güncel/sürekli değil |
| Tatlı Patates | 218 | Son 30 günde ürünün kendi fiyat satırı yok |
| Defne Yaprağı (Yaş-Taze) | 107 | 4 ayrı gün, 1 hal; süreklilik eşiğinin altında |
| İstakoz | 63 | 9 ayrı gün, 1 hal; süreklilik eşiğinin altında |
| Nohut (Taze) | 57 | 9 ayrı gün, 1 hal; süreklilik eşiğinin altında |
| Kuzu Kulağı | 18 | İndeksli `kuzukulagi` ana sayfasıyla aynı niyet; ayrıca kendi güncel fiyat serisi yok |

Paket, koli, adet ve yazım varyantları ile sıfır arama sinyali taşıyan zayıf kapsamlı ürünler ayrı sayfalar olarak açılmadı. Böylece aynı ürün ailesinde birden fazla sayfanın Google'da birbirini zayıflatması ve ince içerik sayısı artışı önlendi.

## Uygulama

`backend/scripts/seo/apply-attached-product-review-2026-09-12.ts` varsayılan olarak dry-run çalışır. `--apply` yalnızca Palamut ve İskorpit editoryelini günceller; veri kalitesini tekrar hesaplar ve mevcut güvenli kapıyı geçen sayfaları indeksler. İşlem sonunda yalnız bu iki URL'yi IndexNow'a bildirir.
