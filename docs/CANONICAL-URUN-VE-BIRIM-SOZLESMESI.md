# Canonical Ürün ve Birim Sözleşmesi

**Durum:** Bağlayıcı — 13 Ağustos 2026

## Ürün kimliği

Her public ürün şu alanlarla tanımlanır: sayısal `id`, değişmez `slug`, kullanıcıya gösterilen `displayName`, `categorySlug`, `defaultUnit`, kaynak yazımlarını taşıyan `aliases`, isteğe bağlı `canonicalSlug` ve `familySlug`. Gerçek çeşit `isVariant=true` ile ayrı kalır; yazım alias'ı yeni ürün değildir.

## Normalizasyon

- Türkçe lower-case `tr-TR` locale ile yapılır; `ğ→g, ü→u, ş→s, ı→i, ö→o, ç→c` yalnız eşleme anahtarında uygulanır.
- Kullanıcıya gösterilen ad Türkçe karakterlerini korur.
- Fazladan boşluk ve bilinen yazım hataları normalize edilir.
- Kelime sıralama anahtarı yalnız aday bulur; gerçek çeşitleri otomatik merge yetkisi vermez.
- Menşe, grade, renk ve çeşit niteleyicileri anlamlıysa korunur: `Domates Beef`, `Elma Golden`, `Biber Şili` ayrı varyanttır.

## Birimler

İzinli canonical birimler: `kg`, `adet`, `kasa`, `bag`, `demet`, `koli`, `ton`. Yalnız kaynakta açıkça bulunan birim eşlenir. Bilinmeyen/boş birim `kg` varsayılmaz; `UNKNOWN_UNIT` ile review kuyruğuna gider. Dönüşüm ancak kaynak ve ambalaj için kayıtlı, doğrulanmış katsayı varsa yapılır.

## Eşleme güveni

| Karar | Skor | Otomatik yayın |
|---|---:|---|
| Birebir canonical ad + bilinen birim | 100 | Evet |
| Güvenli yazım/diakritik normalizasyonu | 95 | Evet |
| Kayıtlı alias | 90 | Evet |
| Bilinmeyen ürün veya birim | 0 | Hayır, review zorunlu |

Skor fuzzy benzerlik değildir. Düşük benzerlikte otomatik ürün açılmaz. Admin onayı alias ekleyebilir, yeni canonical ürün/varyant oluşturabilir veya satırı reddedebilir; karar audit kaydı taşır.

## Tüketici sözleşmesi

Arama, filtre, fiyat tablosu, grafik, alarm, rapor, API, widget, CSV, bülten ve sosyal yayın aynı canonical `productId/slug/unit` üçlüsünü kullanır. Farklı birimler aynı seride ortalanmaz. Kullanıcı etiketinde gerekli ayrım `Limon (Kg)` / `Limon (Kasa)` biçiminde görünür.
