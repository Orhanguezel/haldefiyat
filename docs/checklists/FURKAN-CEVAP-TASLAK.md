# Furkan Gonca (LEDSoft) — cevap taslağı v2

**Durum:** GÖNDERİLMEDİ · **Alıcı:** furkangonca0@gmail.com · 0544 496 19 94
**Deneme:** 2 Eylül → 12 Eylül, Pro limiti, ödeme yok
**v1'den farkı:** ihale açma artık API'den mümkün (ücretsiz), örnekler çalıştırılarak doğrulandı

---

## Bağlam

Furkan **LEDSoft Teknoloji**'den — 2006'dan beri ERP/bayi yönetim sistemi yazan,
gıda sektöründe yüzlerce şubede çalışan bir yazılım evi. Yani son müşteri değil
**entegratör**; "X Catering" muhtemelen onların bir müşterisi.

Karar (Orhan): **yazma yetkisi ücretsiz.** Amaç ihale açtırmak ve komisyoncu
tarafını çekmek; aynı anlaşma File zinciriyle de yapılabilir.

Açık kalan tek ticari konu **okuma verisinin yeniden dağıtımı** — fiyatlar
LEDSoft ürününe gömülüp yüzlerce şubeye gösterilecekse `/api-policy` ayrı kapsam
istiyor. Mesajın sonunda bu, tehdit değil **soru** olarak duruyor.

---

## Taslak mesaj

> Merhaba Furkan Bey,
>
> Görüşmemiz için teşekkürler. Konuştuğumuz iki başlık da hazır; hesabınıza
> **10 günlük ücretsiz erişim** tanımladım (12 Eylül'e kadar).
>
> ### 1) Anahtarınızı alın
> haldefiyat.com → giriş → **Hesabım → API erişimi** → "Anahtar oluştur".
> Anahtar yalnız oluşturulduğu anda gösterilir. Aynı sayfadan günlük kotanızı ve
> kullanımınızı izleyebilirsiniz.
>
> ### 2) Hal fiyatları
> ```
> curl "https://haldefiyat.com/api/v1/prices?city=istanbul&limit=100" \
>   -H "X-API-Key: hf_..."
> ```
> Tek çağrı, günün tüm İstanbul fiyatları (94–105 ürün). Tek ürün: `&product=domates`
>
> Geçmiş seri (trend/ortalama için):
> ```
> curl "https://haldefiyat.com/api/v1/prices/history/domates?market=istanbul-hal-ibb&days=30" \
>   -H "X-API-Key: hf_..."
> ```
> Gün gün `minPrice` / `maxPrice` / `avgPrice` döner.
>
> Dokümantasyon: **haldefiyat.com/api-docs** · Şartlar: **/api-policy**
>
> ### 3) İhale açma — API'den yapılabiliyor
> Konuştuğumuz senaryoyu (8.000 kg domates, 15 Eylül teslim) kendi sisteminizden
> açabilirsiniz. **Bu özellik için ücret almıyoruz** — amacımız komisyoncu
> tarafını buraya çekmek.
>
> Anahtarınıza `listings:write` ve `listings:read` yetkilerini tanımlamamız
> yeterli; söyleyin, açayım.
>
> ```
> curl -X POST "https://haldefiyat.com/api/v1/listings" \
>   -H "X-API-Key: hf_..." \
>   -H "Content-Type: application/json" \
>   -H "Idempotency-Key: <her ihale için benzersiz>" \
>   -d '{
>     "listingType": "alim",
>     "partyRole": "alici",
>     "productSlug": "domates",
>     "productName": "Domates",
>     "title": "8.000 kg domates alinacaktir",
>     "description": "1. kalite salkim. Teslim: 15 Eylul 2026, Istanbul. Odeme: 30 gun vadeli.",
>     "quality": "1. Kalite (Salkim)",
>     "quantity": 8000,
>     "quantityUnit": "kg",
>     "priceType": "pazarlik",
>     "priceUnit": "kg",
>     "citySlug": "istanbul",
>     "contactName": "Satinalma",
>     "contactPhone": "+905551234567",
>     "validUntil": "2026-09-10"
>   }'
> ```
>
> `validUntil` **teklif son tarihidir**; teslim tarihini şimdilik açıklamaya
> yazıyoruz (ayrı alan olarak eklemeyi planlıyoruz).
>
> **Idempotency-Key** önemli: bağlantı koptuğunda isteği güvenle tekrar
> edebilirsiniz, aynı ihale ikinci kez açılmaz — ilk ihalenin kimliği döner.
>
> Gelen teklifleri okumak:
> ```
> curl "https://haldefiyat.com/api/v1/listings/<id>/offers" -H "X-API-Key: hf_..."
> ```
>
> ### 4) Teklifler kapalı zarf usulüdür
> Teklif son tarihine kadar **hiçbir teklif kimseye gösterilmez** — ihaleyi açana
> bile. O döneme kadar yalnızca teklif *sayısını* görürsünüz:
> ```json
> { "sealed": true, "count": 2, "offers": [] }
> ```
> Süre dolunca zarflar açılır ve teklifler fiyat sırasıyla gelir. Böylece
> komisyoncular birbirinin fiyatını görüp kırma yarışına girmez, teklifler dürüst
> kalır.
>
> Açılan ihaleler moderasyondan geçtikten sonra yayına alınır.
>
> ### 5) Verinin sınırları — entegrasyon tasarımınızı etkiler
> - Veri **günlüktür, anlık değildir.** İBB günde bir yayınlıyor. Yanıttaki
>   `recordedDate` verinin hangi güne ait olduğunu söyler; lütfen ekranda gösterin.
> - İBB'nin yayın yapmadığı günler oluyor (28 Ağustos – 1 Eylül arası bayram
>   nedeniyle veri yok). Geçmiş sorgusunda dönen gün sayısı takvim gününden az
>   olabilir; bu eksik veri değil, kaynağın yayın takvimidir.
> - Kapsam İstanbul geneli — İBB tek veri seti yayınlıyor, yaka ayrımı yapmıyor.
> - Yanıtları **en az 5 dakika cache'leyin.**
>
> ### 6) Bir soru
> LEDSoft'un gıda sektöründeki ERP çözümlerini gördüm. Fiyat verisini kendi
> ürününüz üzerinden **müşterilerinize göstermeyi** planlıyorsanız, kaç şube /
> kaç son kullanıcının göreceğini bilmek isteriz — bu, tek kullanıcılık
> abonelikten farklı bir çerçeve gerektiriyor (bkz. /api-policy). İhale tarafında
> böyle bir sınır yok, orası tamamen açık.
>
> Deneme boyunca hiçbiri engel değil; 12 Eylül'de konuşurken doğru soruyu sormuş
> olalım diye baştan yazdım.
>
> Takıldığınız yerde yazın.
>
> Orhan Güzel · haldefiyat.com

---

## Doğrulama notu

Mesajdaki her örnek **canlı sistemde çalıştırıldı** (2026-09-02):
fiyat sorgusu 200 · geçmiş sorgusu gün gün seri · ihale açma 201 (`pending`) ·
mühürlü okuma `sealed:true count:2 offers:[]` · süre sonrası iki teklif fiyat
sırasıyla · yetki geri alınınca 403. Test verisi silindi.

*(v1'de `&range=30d` yazmıştım — geçmiş döndürmüyor, düzeltildi.)*

## Gönderim notu

Telefon tercih ettiği kanal olabilir. E-posta ile birlikte:

> "Furkan Bey merhaba, API deneme erişiminizi tanımladım — detayları e-posta ile
> gönderdim. İhale açmayı da API'den yapabiliyorsunuz, o taraf ücretsiz.
> İyi çalışmalar."
