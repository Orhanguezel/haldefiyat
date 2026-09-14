# ETL karantina kontrolü — 15 Eylül 2026

Kapsam: kullanıcının 7–14 Eylül ETL hata dökümü, canlı karantina kayıtları ve belediye kaynakları. Bunların tamamı bağlantı hatası değil; bir bölümü gelen fiyatı yayından koruyan birim ve sapma kontrolleri.

## Canlıda düzeltilenler

- Çanakkale mantar ve üç marul türünün kasa fiyatları kg/adet ürünlerine eşleniyordu. Dört ayrı kasa ürünü eklendi; ETL'nin mevcut `koli` birimi kullanıldı. Mevcut kg/adet ürünleri değiştirilmedi. Yeni ürünler noindex.
- Çanakkale balık tablosunun başındaki ek `BALIK` hücresi ürün adı sanılıyor, fiyat sütunları kayıyordu. Ayrıştırıcı bu sütunu ayırıyor ve balığın gerçek adını, birimini, fiyatını okuyor.
- Bursa palamut fiyatı çift üzerinden. 80–120 TL/çift, 40–60 TL/adet olarak ayrı `palamut-adet` ürününe yazılıyor. Kg dönüşümü yapılmadı. Çanakkale'nin tane fiyatı aynı adet ürünüyle eşleşiyor.
- Bursa ithal uskumru 6.000 TL/koli ve ithal kalamar 2.500 TL/koli resmî tabloyla doğrulandı. Eski 60/25 TL referanslarıyla 100 kat fark nedeniyle reddedilen 14 Eylül kayıtları gerekçeli onaylandı. Kararlar ve önce/sonra değerleri denetim tablosunda tutuluyor; eski serinin tamamı değiştirilmedi.
- Önceki fiyat kontrolü aynı günün kabul edilmiş kaydını da değerlendiriyor. Böylece onaylanmış güncel fiyat, tekrar çalıştırmada aynı eski referans yüzünden yeniden karantinaya düşmüyor. Sapma eşikleri kaldırılmadı.

Kaynaklar: [Çanakkale Belediyesi, 11 Eylül fiyat tablosu](https://www.canakkale.bel.tr/tr/sayfa/1481-hal-fiyat-listesi), [Bursa Belediyesi hal fiyatları](https://www.bursa.bel.tr/?sayfa=hal_fiyatlari).

## Doğrulama

Backend derlendi, ilgili iki modül canlıya yüklendi, servis yeniden yüklendi ve sağlık kontrolü geçti. Ayrıştırıcı/birim testleri: 14 başarılı test, 27 assertion.

Canlı yeniden çalıştırmada Bursa 154, Çanakkale 76 kayıt işledi. Bunlar ETL işlem sayaçlarıdır, tamamı yeni fiyat anlamına gelmez. Çanakkale bülten tarihi 11 Eylül olarak korundu.

Canlı DB kontrolü: mantar kasa ortalaması 1.500; Aysberg/Kaşık kasa 240; Lolorosso kasa 340 TL. Bursa palamut 50 TL/adet; Çanakkale palamut 60 TL/adet. Uskumru/kalamar karantina kararları onaylı kaldı.

## Açık kalanlar

| Kaynak | Açık uyarı / sonraki kontrol |
| --- | --- |
| Çanakkale | Zencefil paket fiyatı 1.500 TL sınırını aşıyor; ithal muzda koli/kg uyuşmazlığı; siyah üzümde önceki fiyata göre sıçrama. Yeniden çalıştırmada üç uyarı devam ediyor. |
| Bursa | Böğürtlen, kızılcık ve taze soğan kaynak medyanından sapıyor; üç uyarı devam ediyor. |
| İstanbul | Ahudududa geçmiş fiyat/ambalaj karşılaştırması; kuşkonmazda koli/kg uyuşmazlığı. Otomatik yüksek fiyat → koli çıkarımı da incelenmeli. |
| Elazığ / Adana / ulusal kaynaklar | Semizotu, greyfurt, pancar ve diğer sıçrama kayıtlarında aynı ürün/kalite/birim karşılaştırmasının doğrulanması gerekiyor. Bu kayıtlar topluca onaylanmadı. |
| Antalya / İzmir balık / eski TOBB kayıtları | Frenk üzümü üst sınırı, balık fiyat sıçramaları, ortalamanın min–max dışında kalması ayrı inceleme gerektiriyor. Bu kontrol kapsamında tüm tarihlerin yeniden yüklenmesi yapılmadı. |

Çanakkale'nin paket mantar satırının kg ürünüyle eşleşmesi ayrıca açık birim kontrolüdür. Paket ağırlığı doğrulanmadan kg dönüşümü yapılmamalı. Eski yanlış ayrıştırılmış balık tarihçesi bu işlemde topluca temizlenmedi.

Eski ETL logları tarihsel kayıttır ve silinmedi. Düzeltilenlerin sonucu yeni çalıştırmalardan izlenmeli. Kalan karantinalar nedeniyle kaynaklar hâlâ kısmi başarı gösterebilir.

Kanıt dosyaları: `artifacts/quarantine-audit-2026-09-14/` altında `before.json`, `after.json`, `canakkale.html`, `deploy.log`, `repair.ts`. Kalıcı ürün kurulum kaydı: `backend/src/db/seed/sql/103_verified_package_product_units.sql`.
