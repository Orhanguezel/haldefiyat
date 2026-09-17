# Pamuk borsa arşivi erişim kontrolü — 7 Eylül 2026

## Doğrulanan erişim
- İzmir günlük arşivinde 21.10.2013–07.09.2026 arasında 3.086 benzersiz XLS/PDF bağlantısı sayıldı. Bu, indirilmiş fiyat gözlemi sayısı değildir. 2013, 2014, 2020, 2025 ve 2026 örnek dosyaları indirildi; HTTP 200 ve dosya imzaları doğrulandı.
- İzmir aylık arşivinde Ocak 2013–Temmuz 2026 arasında 163 ayın tümü listeleniyor. Liste düzeyinde eksik ay yok; bütün dosyalar tek tek indirilmedi. Ocak 2013 PDF'i indirildi ve metni çıkarıldı.
- Aydın aylık listesinde 122 PDF bağlantısı var; Ekim 2016 dosyası indirilip ilk sayfası görsel olarak kontrol edildi. Çiğitli ve preseli pamuk; satış şekli; min/ortalama/max; miktar, tutar ve işlem sayısı ayrı sütunlarda. Eski dosya tarama olduğundan OCR gerekiyor. Liste Temmuz 2026 bültenini de içeriyor; kesintisiz seri olduğu doğrulanmadı.
- Şanlıurfa resmî sitenin bağlantı verdiği https://uye.sutb.org.tr:3333/bultenweb üzerinden üyelik gerektirmeden GET tarih sorgusu çalışıyor. bultenturu=5, BASLAMATARIHI ve BITISTARIHI dd.MM.yyyy biçiminde. 2013, 2016, 2020, 2025 ve 2026 örnekleri pamuk satırı döndürdü. Bunlar örnek kontroller; tüm yılların eksiksiz olduğu iddia edilmez.

## Şanlıurfa örnekleri
- Eylül 2020 kütlü pamuk, HMS peşin: min/max/ortalama 4,40 TL/kg; 1 işlem; 7.120 kg.
- Eylül 2025 kütlü pamuk, HMS peşin: min 25,00 / max 26,00 / bülten ortalaması 25,50 TL/kg; 4 işlem; 85.680 kg.
- 1–7 Eylül 2025 preseli pamuk ST.1 beyaz, HTS peşin: min 55,00 / max 70,81 / bülten ortalaması 64,65 TL/kg; 13 işlem; 2.669.888,50 kg.
- 1–7 Eylül 2026 aynı ürün/işlem/ödeme: min 54,75 / max 97,34 / bülten ortalaması 84,49 TL/kg; 11 işlem; 2.117.336 kg.
- 1–7 Eylül 2026 sorgusunda kütlü pamuk satırı yok. Kayıt yokluğu ticaret yapılmadığını kanıtlamaz.
- Bülten ortalaması kaynakta verilen değerdir; tutar/miktar ağırlıklı ortalaması olduğu varsayılmadı. Aynı etiketli dönemler bile aynı parti, randıman, mahsul yılı veya kalite bileşimi demek değildir.

## HaldeFiyat canlı kapsamı
2021: 38, 2022: 67, 2023: 34, 2024: 158, 2025: 56, 2026: 106 kayıt; toplam 459. Kaynak izmir_borsa_pamuk. Son kayıt 01.09.2026. Veritabanı salt okunur sorguyla kontrol edildi.

Mevcut backend/scripts/backfill-borsa-products.ts sadece PDF bağlantılarını seçiyor; eski XLS dosyalarını atlıyor. Kullanılan parseItbPamukPdfText 52 renk satırına odaklanıyor ve bir dalında 20 TL altındaki sayıları eliyor. Eski yıllar ve kalite bazlı seri için olduğu gibi kullanılamaz. Min/max orta noktası kaynak ortalaması olarak sunulmamalı. 07.09.2026 PDF'inde salon referans alanları boşken diğer bölümlerde fiyat bulunabiliyor; boş satır sıfır fiyat değildir.

## Önerilen veri düzeni
Borsa, bülten tarihi/dönemi, kütlü/lif/çekirdek ayrımı, kalite sınıfı, fiyat türü (işlem/referans/teklif), işlem ve ödeme türü, birim, min/max, kaynak ortalaması, miktar, tutar, işlem sayısı ve kaynak URL saklanmalı. Ürün ve kalite isimleri yıllar içinde değiştiğinden belgeli eşleme gerekir. Öncelik Şanlıurfa sınıf bazlı HTML ve İzmir aylık PDF serisi; ardından günlük XLS/PDF ve Aydın OCR.

Bu tur yalnız erişim ve mevcut sistem kontrolü yapıldı; canlı fiyatlar ve yayımlanan yazı değiştirilmedi.
