# İlan Liste ve Detay Kabulü — 14 Ağustos 2026

## Dağıtılan kapsam

- Liste, filtre ve kart sürümü: `ad040319`
- Türkçe konum etiketi düzeltmesi: `db7c9aab`
- Detay, iletişim paneli ve ek gizlilik sürümü: `5c7fd242`
- Canlı sayfalar: `/ilanlar`, `/ilanlar?q=saman&unit=kg&date=30d`, `/ilan/yesil-mercimek-kirsehir-7`
- Mobil viewport: `390x844`; desktop kabul: `1280x900`

## Liste ve filtre sözleşmesi

- Filtre yüzeyi yalnız arama, canonical ürün, il, ilan türü, miktar birimi ve ilan tarihinden oluşuyor.
- Canlı mobil bottom sheet içinde görünen alanlar: `q`, `product`, `city`, `type`, `unit`, `date`.
- Ürün seçenekleri yalnız canonical kök ürünlerden üretiliyor. Canlı listede 263 canonical ürün, yinelenen etiket yok; gerçek birim ayrımı `Avokado (Adet)` ve `Avokado (Kg)` olarak korunuyor.
- Birim filtresinde kilogram, adet, kasa, bağ, demet, koli, paket, ton ve litre seçenekleri var. Paket adı yalnız gerçek birim seçimi olarak kullanılıyor.
- `q=saman&unit=kg&date=30d` canlı API ve sayfa kabulünde tek `Mercimek Samanı` sonucunu döndürdü.
- Sayfa `1 ilan`, üç aktif filtre chip'i, tek tek kaldırma ve tümünü temizleme eylemlerini gösterdi.
- Sonuçsuz aramada `0 ilan`, filtreleri düzenle, tümünü temizle ve `/ilan-ver?type=alim` alım talebi alternatifi birlikte göründü.

## Kart sözleşmesi ve kişisel veri

- Canlı kartlarda başlık, ürün, miktar/birim, fiyat, Türkçe il/ilçe, göreli tarih, ilan türü ve satıcı rolü var.
- Kartların birincil eylemi erişilebilir adıyla `İlanı incele`; canlı filtre sonucunda bir kart/bir CTA ölçüldü.
- Public API ve kart katmanı satıcı adını ve telefonu göstermiyor. Canlı sonuçta `contactName=null`, `contactPhone=null`; DOM'da kişi adı ve telefon rakamı bulunmadı.
- Public dönüştürücü ayrıca `userId`, `createdBy`, `moderationNote`, `isSuspicious` ve `raw` iç alanlarını JSON'dan çıkarıyor.
- Telefon doğrulama açıklaması bunun yalnız kanala gönderilen kodu doğruladığını, kimlik veya ticari yetki garantisi olmadığını açıkça söylüyor.
- Öne çıkarılmış yerleşimler normal karttan iki katmanlı vurgu, `Reklam · Sponsorlu` etiketi ve `Sponsorlu ilan` erişilebilir adıyla ayrılıyor.
- Kart fixture testi kişisel veri yokluğu, kasa birimi, birincil CTA, sponsor etiketi ve doğrulama tooltip'ini doğruladı.

## Detay ve iletişim

- Fiyat, miktar/birim, Türkçe konum ve yayın tarihi başlığın hemen altında üst özet hiyerarşisinde.
- Satıcı güven alanı rolü, varsa telefon/e-posta kanal doğrulamasını ve yalnız gerçek kullanıcı hesabı varsa hesap yaşını gösteriyor; assisted ilan için doğru biçimde `Hesap yaşı bilgisi yok` yazıyor.
- Galeri görselinde anlamlı sıra alt metni, `640x480` intrinsic boyut ve ilk görselde eager/sonrakilerde lazy kuralı var.
- Kaydet, paylaş ve raporla eylemleri `İkincil ilan eylemleri` bölgesinde; arama/mesaj CTA'larıyla yarışmıyor.
- Mobilde `Satıcıyı ara` birincil, `Mesaj gönder` ikincil sticky CTA aynı iletişim bottom sheet'ini açıyor. Dialog içinde arama talebi ve mesaj formu tek `ListingContactPanel` sözleşmesinden geliyor.
- Desktop `1280x900` kabulünde aynı iki form sticky aside içinde; mobil CTA kopyası yok.
- Canlı detay HTML taramasında kişi adı, telefon ve iç UUID bulunmadı; tek H1 ve yatay taşmasız görünüm doğrulandı.

## Otomatik ve canlı kapılar

- Backend production build: geçti.
- Backend tam test paketi: 27 dosya / 116 test / 256 assertion geçti.
- Frontend ESLint ve TypeScript: geçti.
- Frontend tam test paketi: 27 dosya / 81 test geçti.
- Canlı liste, filtreli API, detay ve sağlık rotaları HTTP 200.
- Canlı Playwright konsolu: `0` hata, `0` uyarı.

## Görsel kanıt

- `output/playwright/theme-clean-data/ilanlar-filtre-mobile-2026-08-14.png`
- `output/playwright/theme-clean-data/ilanlar-liste-mobile-2026-08-14.png`
- `output/playwright/theme-clean-data/ilan-detay-mobile-2026-08-14.png`
