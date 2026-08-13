# Faz 0 Performans ve Erişilebilirlik Bazı

**Tarih:** 13 Ağustos 2026

**Araç:** Lighthouse 12.8.2, canlı `https://haldefiyat.com`, mobile throttling.

## Ana sayfa ilk ölçüm

| Kategori / metrik | Sonuç |
|---|---:|
| Performance | 41 |
| Accessibility | 96 |
| Best Practices | 100 |
| SEO | 100 |
| FCP | 3,1 sn |
| LCP | 6,8 sn |
| CLS | 0 |
| TBT | 1.610 ms |
| Speed Index | 5,1 sn |

Bu laboratuvar ölçümü gerçek kullanıcı CrUX değeri değildir; regressions ve önceliklendirme bazıdır.

## Kök nedenler ve uygulanan düzeltmeler

1. LCP öğesi metin H1; 6,8 saniyenin %90'ı render delay. HTML transferi yaklaşık 262 KB sıkıştırılmış / 846 KB açılmıştı. Mobil ana sayfa 13 bölümden 9 bölüme, 16.465 px'den 11.759 px'e indirildi.
2. Google etiketleri ana thread'i yaklaşık 1.480 ms bloke etti. GTM varken ayrıca Ads `config` çağrısının ikinci gtag kütüphanesini yüklemesi engellendi; GA/Ads yönetimi tek GTM konteynerine bırakıldı.
3. Yeşil değişim etiketleri 2,95–3,08 kontrast veriyordu. Açık tema success tokenı daha koyu tona alındı.
4. VistaSeeds banner linkinin görünür metni accessible name içinde değildi; tam görünür metin erişilebilir ada eklendi.
5. Banner görsellerinde doğal `width/height` eksikti; 420×420 ürün ve 420×113 logo boyutları eklendi.

## Açık ölçüm işleri

- Düzeltme release'i sonrası ana sayfa Lighthouse tekrar ölçümü.
- Ürün, analiz, ilan ve veri-durumu rotalarında mobile/desktop Lighthouse.
- Axe/Lighthouse kritik ihlal listelerinin route bazında kapatılması.
- Gerçek kullanıcı CrUX/GSC CWV ile laboratuvar sonucunun karşılaştırılması.
- GTM konteynerindeki iki ayrı GA4 property/tag kararının (`G-YHLL9WK7ML`, `G-9M6GBB11HP`) işletme sahibiyle tekleştirilmesi.

## İlk düzeltme sonrası ölçüm

- Performance **41 → 54**
- FCP **3,1 → 2,3 sn**
- LCP **6,8 → 4,0 sn**
- Speed Index **5,1 → 3,1 sn**
- Accessibility 96, Best Practices 100, SEO 100
- Accessible-name ve unsized-image bulguları kapandı; kalan 15 kontrast noktası mobil fiyat değişim etiketlerinde bulundu ve emerald/red 800 tonlarına geçirildi.

TBT ikinci laboratuvar koşusunda dalgalanarak 4.880 ms ölçüldü; üçüncü taraf etiket çalıştırma zamanlaması nedeniyle tek koşu başarı ölçütü yapılmayacak. Medyan 3 koşu ve GTM konteyner denetimi gerekir.
