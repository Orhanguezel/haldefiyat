# Sentetik Ortalama Ayrımı — Canlı Kabul

**Tarih:** 14 Ağustos 2026
**Kapsam:** `hf_price_history.avg_price`, ETL/admin yazımı, public API, CSV,
ürün/fiyat/endeks/perakende yüzeyleri ve haftalık bülten.

## Sonuç

- `hf_price_history.avg_price_method` alanı eklendi: `reported`, `midpoint`,
  güvenli geçiş değeri olarak `unknown`.
- 1.055.511 tarihsel kayıt iki ondalık saklama hassasiyeti korunarak
  sınıflandı: 809.322 `midpoint` (**%76,68**), 246.189 `reported`; `unknown=0`.
- Yeni kayıtlar merkezi `upsertPriceRow` yolunda sınıflanıyor. TOBB ve Polatlı
  gibi kaynağın ortalamayı açıkça yayımladığı üreticiler `reported` bilgisini
  doğrudan veriyor; diğer entegrasyonlar min/max ve ortalama ilişkisine göre dar
  toleranslı fallback'ten geçiyor.
- Admin manuel giriş/düzeltmesi `reported`; karantina onayında yöntem de fiyatla
  birlikte transaction içinde yazılıyor.

## Tüketici sözleşmesi

- `/api/v1/prices`: `avgPriceMethod` ve `isSynthetic` alanlarını döndürüyor.
- `/api/v1/prices/history/:slug`: günlük satırda gerçek yöntem, haftalık/aylık
  kovada `reported`, `midpoint`, `unknown` veya `mixed` döndürüyor.
- CSV: `Ortalama Yöntemi` sütunu eklendi.
- Fiyat kartı/tablosu: sentetik satırda “min–maks orta noktası” etiketi var.
- Ürün cevap bloğu: örneklemdeki türetilmiş kayıt sayısını `x/y` olarak veriyor
  ve bunun işlem hacmi ağırlıklı ortalama olmadığını açıklıyor.
- Perakende karşılaştırması aynı örneklem bilgisini baz fiyatın yanında taşıyor;
  türev hesabın sentetik girdiyi gerçek ortalama gibi saklamasına izin vermiyor.
- Ürün FAQ ve editoryal veri notu görünür cevapla aynı açıklamayı kullanıyor;
  yapılandırılmış FAQ içeriği görünür metinle eşleşiyor.
- Endeks metodolojisi ve haftalık bülten orta nokta kuralını açıkça belirtiyor.

## Doğrulama

- Backend: ortalama yöntem testleri **5/5**, TypeScript production build temiz.
- Frontend: TypeScript temiz; **23 dosya / 68 test**; ESLint temiz; production
  build başarılı.
- Canlı API domates örneği: `avgPriceMethod=midpoint`, `isSynthetic=true`,
  `min=15`, `max=30`, `avg=22.5`.
- Canlı 30 günlük haftalık tarihçe: `midpoint`, `reported` ve `mixed` kovaları
  birlikte doğru biçimde dönüyor.
- Canlı mobil 390×844: yatay taşma yok (`scrollWidth=viewportWidth=390`),
  orta nokta etiketi ve hacim-ağırlıklı-değil açıklaması görünür, konsol
  hata/uyarı sayısı 0.
- Backend/frontend PM2 online; ana sayfa ve `/urun/domates` HTTP 200.

## Emniyet notu

Bu değişiklik `avg_price` değerini yeniden hesaplamaz veya silmez; yalnız üretim
yöntemini makinece ve kullanıcıca görünür kılar. Endeks/raporların sürekliliği
korunur. İleride yalnız `reported` gözlemlerle ayrı bir metrik üretilecekse mevcut
alan üzerinden kontrollü, geriye dönük karşılaştırmalı deney yapılabilir.
