# Ürün Detay Etkileşim Kabulü — 14 Ağustos 2026

## Kapsam

- Canlı sayfa: `https://haldefiyat.com/urun/domates`
- Mobil viewport: `390x844`
- Dağıtılan temel sürüm: `2a487b64`
- Mobil eylem etiketi düzeltmesi: `d68fe6b5`

## Canlı kabul sonucu

- Sayfada tek `h1` var ve doküman genişliği viewport ile eşit (`390/390`); yatay taşma yok.
- Ürün adı canonical `Domates` olarak başlıkta, breadcrumb'da, AnswerBlock'ta ve grafik başlığında tutarlı.
- Fold başlangıcında son kayıt tarihi, ortalama/min/maks fiyat, `kg` birimi, 13 hal örneklemi, resmi kaynak özeti ve veri tazeliği birlikte gösteriliyor.
- 7/30/90 günlük grafik kontrolleri erişilebilir bir toggle grubu; seçimden sonra `aria-pressed` yalnız aktif düğmede `true` oluyor.
- Grafik, ürün ve seçili dönemi açıklayan erişilebilir bir ada sahip; tooltip kodu tarih, hal, şehir, fiyat, birim, min ve maks alanlarını sunuyor.
- 7 ve 30 günlük eğilimler yön ikonu, metin ve yüzdeyle gösteriliyor; renk tek anlam taşıyıcısı değil.
- Alarm, favori, karşılaştırma ve paylaşım ikincil eylemler olarak gruplanmış. Mobilde ikonların erişilebilir adları ürün bağlamını içeriyor.
- Alarm diyaloğu `Domates` ürünü ön-seçili açıldı ve `Escape` ile kapandı.
- Karşılaştırma eylemi `/karsilastirma?products=domates` adresine gitti; sayfa ürünü URL'den ön-seçili yükledi ve mobilde taşma üretmedi.
- Varyantlar ayrı gerçek ürün slug'larına bağlanıyor; kaynakta aynı ürünü ifade eden hal adları ayrıca alias listesinde tutuluyor.
- Perakende karşılaştırması yalnız guard'dan geçen güncel kayıtları “tahmini perakende” açıklaması ve kaynak/tazelik ile gösteriyor.
- Bugünkü hal kayıtları en yeni tarih önce sırasıyla isteniyor; her satırda tarih, resmi kaynak, tazelik ve doğrulama bağlantısı bulunuyor.
- Ürün açıklaması, sezon, metodoloji/kaynak, SSS ve alias içeriği ayrı okunabilir bölümlerde.
- Tablo sonrasındaki reklam `complementary`/“Reklam” alanı olarak ayrılmış ve “Reklam · Sponsorlu” etiketi taşıyor.
- Canlı tarayıcı konsolu: `0` hata, `0` uyarı.

## Otomatik kapılar

- Frontend ESLint (`--quiet`): geçti.
- Frontend TypeScript (`tsc --noEmit`): geçti.
- Frontend testleri: 26 dosya / 79 test geçti (temel sürüm kabulü).
- Frontend production build: geçti; izole `.next-release-*` dizini ve standalone asset senkronu doğrulandı.

## Görsel kanıt

- `output/playwright/theme-clean-data/urun-detay-etkilesim-mobile-2026-08-14.png`

