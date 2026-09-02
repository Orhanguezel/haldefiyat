# Furkan Gonca (LEDSoft) — cevap taslağı

**Durum:** GÖNDERİLMEDİ — onayınızı bekliyor.
**Alıcı:** furkangonca0@gmail.com · 0544 496 19 94
**Deneme:** 2 Eylül → 12 Eylül, Pro limiti, ödeme yok

---

## Önce: kiminle konuştuğumuz değişti

Furkan **LEDSoft Teknoloji**'den arıyor — 2006'dan beri ERP ve bayi yönetim
sistemleri yazan bir yazılım evi. Kendi tanıtımlarına göre **gıda sektöründe
tanınmış markaların bölge müdürlüklerinde ve yüzlerce şubesinde** hizmet
veriyorlar (Ford Otosan da referansları arasında).

Yani Furkan **son müşteri değil, entegratör**. "X Catering ihale açar" örneği
büyük olasılıkla *onların bir müşterisinin* senaryosu.

**Bunun ticari sonucu var.** Kendi API politikamız (`/api-policy`) diyor ki:

> "Yüksek hacimli erişim, veri setinin yeniden satışı, **beyaz etiket dağıtım**,
> özel SLA... ayrı yazılı kapsam ve lisans gerektirir."

Fiyatlarımız LEDSoft'un ürününe gömülüp yüzlerce şubeye dağıtılacaksa bu, tek
bir Pro aboneliği (2.999 ₺/ay) değildir. Denemeyi vermekte sorun yok — ama
**kapsamı şimdi konuşmak**, sonra geri almaktan kolay. Aşağıdaki taslağın son
bölümü bunu nazikçe açıyor.

Önerim: denemeyi teknik olarak açık tutalım, kullanımı ölçelim (10 gün sonunda
hangi ürün, kaç istek, hangi saat — sorgular teslim notlarında), ve **fiyat
konuşmasını "kaç şube/müşteri görecek" sorusuna bağlayalım.**

---

## Taslak mesaj

> Merhaba Furkan Bey,
>
> Görüşmemiz için teşekkürler. Hesabınıza **10 günlük ücretsiz API erişimi**
> tanımladım — 12 Eylül'e kadar geçerli, ödeme alınmıyor.
>
> **1) Anahtarınızı alın**
> haldefiyat.com → giriş → **Hesabım → API erişimi** → "Anahtar oluştur".
> Anahtar yalnız oluşturulduğu anda gösterilir, kaydedin. Aynı sayfadan günlük
> kotanızı ve kullanımınızı takip edebilirsiniz.
>
> **2) İstanbul hal fiyatları**
> ```
> curl "https://haldefiyat.com/api/v1/prices?city=istanbul&limit=100" \
>   -H "X-API-Key: hf_..."
> ```
> Bu tek çağrı günün **tüm İstanbul fiyatlarını** getirir (94–105 ürün).
> Tek ürün için `&product=domates`.
> Yanıt başlıklarında kalan kotanız görünür (`x-ratelimit-remaining`).
>
> **Geçmiş seri** (ERP tarafında trend/ortalama için):
> ```
> curl "https://haldefiyat.com/api/v1/prices/history/domates?market=istanbul-hal-ibb&days=30" \
>   -H "X-API-Key: hf_..."
> ```
> Gün gün `minPrice` / `maxPrice` / `avgPrice` döner. Not: dönen gün sayısı
> takvim günü sayısından az olabilir — İBB'nin yayın yapmadığı günler seride
> yoktur (aşağıdaki maddeye bakın).
>
> Dokümantasyon: **haldefiyat.com/api-docs** · Kullanım şartları: **/api-policy**
>
> **3) Verinin gerçeği — entegrasyon tasarımınızı etkiler**
> - Veri **günlüktür, anlık değildir.** İBB günde bir yayınlıyor, biz de onu
>   alıyoruz. Yanıttaki `recordedDate` alanı verinin hangi güne ait olduğunu
>   söyler; lütfen ekranda bu tarihi gösterin.
> - İBB'nin yayın yapmadığı günler oluyor (örn. 28 Ağustos – 1 Eylül arası
>   bayram nedeniyle veri yok). O günlerde son yayınlanan gün döner.
> - Kapsam İstanbul geneli — İBB tek veri seti yayınlıyor, yaka ayrımı yapmıyor.
> - Yanıtları **en az 5 dakika cache'leyin**; aynı sorguyu saniyelik döngüyle
>   tekrarlamayın.
>
> **4) İhale / alım talebi tarafı**
> Konuştuğumuz "8.000 kg domates, 15 Eylül teslim" senaryosu şu an sitede
> çalışıyor: **İlan ver** sayfasından alım talebi açılıyor, komisyoncular teklif
> veriyor.
>
> Teklifler **kapalı zarf** usulüyle alınıyor: teklif son tarihine kadar hiçbir
> teklif kimseye — talebi açana bile — gösterilmiyor. Süre dolunca teklifler
> fiyat sırasıyla açılıyor. Böylece fiyat kırma yarışı olmuyor.
>
> Talep açmayı **API'den** yapmak istiyorsanız bu şu an mümkün değil; anahtar
> yalnız veri okuma yetkisi taşıyor. Yazma yetkisi ayrı bir güvenlik tasarımı
> gerektiriyor ve sizin gerçekten ihtiyacınız olacaksa sıraya alabiliriz.
>
> **5) Kullanım kapsamı**
> LEDSoft'un ERP ve bayi yönetim çözümlerini gıda sektöründe kullandığını
> gördüm. Fiyat verisini kendi ürününüz üzerinden **müşterilerinize
> göstermeyi** planlıyorsanız, bunun ayrı bir kapsam olduğunu baştan söylemek
> isterim — tek kullanıcılık abonelikten farklı bir çerçeve gerekiyor
> (bkz. /api-policy). Deneme süresince bu bir engel değil; sadece 12 Eylül'de
> konuşurken doğru soruyu sormuş olalım: **veriyi kaç şube / kaç son kullanıcı
> görecek?**
>
> Takıldığınız yerde yazın, memnuniyetle bakarım.
>
> Orhan Güzel · haldefiyat.com

---

## Gönderim notu

Furkan telefonu tercih etmiş olabilir (`0544 496 19 94`). E-posta ile birlikte
kısa bir WhatsApp mesajı dönüşü hızlandırır:

> "Furkan Bey merhaba, API deneme erişiminizi tanımladım — detayları
> e-posta ile gönderdim. Anahtarı Hesabım → API erişimi sayfasından
> oluşturabilirsiniz. İyi çalışmalar."
