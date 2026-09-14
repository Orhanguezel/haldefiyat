# Ürün sayfalarına ilgili ilanlar — 14 Eylül 2026

Ürün ve şehir–ürün sayfalarında aktif alım/satım ilanları gösterilir. Aynı ürün slug'ı ile public API'ye başvurulur; başka ürün veya çeşit için geri dönüş yapılmaz. Türkiye geneli ilanlar olduğu ve ilan fiyatlarının resmî hal fiyatlarından ayrı olduğu görünür metinde belirtilir.

Masaüstünde üç sütuna kadar yatay kartlar, mobilde tek sütun kullanılır. Görsel, alım/satım türü, fiyat tipi/birim, şehir/ilçe, miktar, ilan tarihi ve detay bağlantısı vardır. Sponsorlu ilanlar etiketlidir. Yüklenen fotoğraf yoksa mevcut ürün fotoğrafı temsilî olarak etiketlenir. Stok/nakliye bilgisi uydurulmaz. En fazla altı ilan ve aynı ürün filtresine giden “Tümünü gör” bağlantısı gösterilir. İlan yoksa ürünün seçili olduğu ilan verme çağrısı çıkar.

Public API onay, gerçek ilan ve son geçerlilik tarihini sorguda uygular; sponsorlu sıralaması korunur. Başlık bu nedenle “Son yayımlanan” yerine “Ürün ilanları”dır. Yeni backend uç noktası ya da ikinci ilan deposu oluşturulmadı.

## Canlı envanter kontrolü

Kontrol sırasında toplam 5 aktif ilan vardı: domates, nohut, ayva, erik ve Anjelik erik için birer ilan. Domates ilanı #49 Bilecik/Osmaneli'de, son geçerlilik 18 Eylül. Fiyat tipi pazarlık, miktar belirtilmemiş ve fotoğraf yüklenmemiş; kart bu durumları açıkça gösterir.

Veri notu: #36 Mürdüm eriği ilanında açıklama “iki ton” derken yapılandırılmış miktar 2 kg. İlan sahibinin beyanı doğrulanmadan kayıt değiştirilmedi. Kart kayıtlı miktarı gösterir. #52 nohut alım ilanında fiyat alanı 1 TL/kg; gerçek fiyat olup olmadığı doğrulanmadı.

## Kontroller

- TypeScript ve hedefli ESLint geçti.
- İlan kartı ve ürün eşleştirme testleri: 5 test geçti.
- Playwright yerel görünüm: domates sayfasında tam bir ilgili ilan, 390 px mobilde taşma yok; “Tümünü gör” `/ilanlar?product=domates` sayfasına ulaşıyor.
- Dağıtım: frontend için izole `.next-release-20260914bb01`; önceki release korunur.

Canlı doğrulama tamamlandı: genel domates ve İstanbul/domates sayfalarında #49, ayva sayfasında #51 görünüyor. Salçalık domates sayfasında başka çeşit ilanı görünmüyor. Dört sayfa HTTP 200; canlı tarayıcıda ilan fotoğrafı yükleniyor ve “Tümünü gör” doğru filtreli listeyi açıyor. İki frontend worker başarıyla yenilendi.
