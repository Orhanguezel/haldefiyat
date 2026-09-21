# Mersin resmî hal verisi — erişim kanıtı ve kurumsal talep

**Kontrol tarihi:** 21 Eylül 2026
**Kaynak:** Mersin Büyükşehir Belediyesi
**Hedef:** `https://www.mersin.bel.tr/hal-fiyatlari`
**Durum:** Teknik erişim bloke; dış iletişim gönderilmedi

## Doğrulanan teknik durum

| Yöntem | URL | Sonuç |
|---|---|---|
| Gerçek Chromium / Playwright | `/hal-fiyatlari` | HTTP 403, `Turk Telekom Waf by Altosec` |
| Mevcut ETL sözleşmesi | `POST /hal-fiyatlari-day` | WAF nedeniyle güvenilir yanıt alınamıyor |
| Canlı ETL sağlık kaydı | `mersin_resmi` | Son başarılı çalışma yok; son hata 26 Temmuz 2026 |
| Canlı HaldeFiyat sayfası | `/hal/mersin-hal` | Son resmî liste 22 Haziran 2026; “Son Liste” dili korunuyor |

Ekran kanıtı: `output/playwright/mersin-waf-2026-09-21.png`.

Resmî sayfa açılmadan form alanları, kategori kodları veya tarayıcı ağ çağrıları
yeniden keşfedilemiyor. Mevcut kaynak kodundaki son bilinen sözleşme
`published=YYYY-MM-DD` ve `product_category=3|4` alanlarını kullanıyor. Bu bilgi,
21 Eylül'de çalışan bir kamu endpointi olduğu anlamına gelmez.

Rakip HTML/API'si veri kaynağı yapılmayacak; başka şehir veya ulusal seri Mersin
adıyla yayımlanmayacak. `mersin_resmi.defaultEnabled=false` ayarı korunmalıdır.

## Kurumsal erişim talebi taslağı

**Konu:** Mersin Toptancı Hal fiyatlarının makinece okunabilir resmî erişimi

> Mersin Büyükşehir Belediyesi Hal Müdürlüğü / Bilgi İşlem Dairesi'ne,
>
> HaldeFiyat, belediyeler ve diğer yetkili kurumlarca yayımlanan toptancı hal
> fiyatlarını kaynak, tarih, ürün, çeşit ve birim bilgisi korunarak kamuya sunan
> bir tarım veri platformudur. Mersin Büyükşehir Belediyesi'nin kamuya açık hal
> fiyatı sayfası, 21 Eylül 2026 itibarıyla standart web tarayıcısı dahil tüm
> denemelerimize `403 Access Denied` yanıtı vermektedir.
>
> Günlük bültenlerin PDF, CSV, XLS/XLSX veya JSON biçimindeki resmî yayın adresini;
> mevcut değilse yalnız okuma amaçlı API/veri paylaşım kanalını ya da sabit sunucu
> IP'miz için izin listesi sürecini paylaşmanızı rica ederiz. İhtiyaç duyulan
> alanlar: gerçek kayıt tarihi, ürün adı, çeşit/kalite, minimum fiyat, maksimum
> fiyat, birim, kategori ve yayımlayan hal. Erişim yalnız resmî veriyi kaynak
> göstererek yayımlamak için kullanılacak; istek tarihi veri tarihi olarak
> yazılmayacaktır.
>
> Teknik iletişim ve sabit IP bilgisi, talep üzerine güvenli kanaldan iletilebilir.

## Operasyon takibi

- Sahip: HaldeFiyat operasyon sorumlusu
- Gönderim durumu: Gönderilmedi; bu checklist dış iletişim yetkisi vermiyor
- Önerilen kanallar: Mersin BB Bilgi Edinme, Hal Müdürlüğü ve gerekirse CİMER
- Gönderim sonrası ilk takip: 4 iş günü
- İkinci takip: 10 iş günü
- Teknik yeniden kontrol: Yanıt/izin geldikten sonra `EtlSourceConfig` ve
  `FetchOutcome` sözleşmesi içinde, fixture ve kısmi başarı testleriyle

## Kapanış kararı

21 Eylül 2026 itibarıyla Faz 2'nin teknik keşif kolu **kanıtlı bloke** durumundadır.
Eski veri dürüstçe gösterildiği ve “bugün/güncel” iddiası üretilmediği için canlı
sayfada acil veri düzeltmesi yoktur. Faz, kurumsal talep gönderilmeden tamamlandı
sayılmaz.
