# Ağustos aylık taslak kontrolü — 6 Eylül 2026

Canlı salt okunur kontrol: hf_analysis_reports id 28, 2026-M08, draft, reviewed_at NULL.
Mevcut içerikte “Sezon Değişimi”, sekiz “tezgâha giren” ve sekiz “sezonu kapanan” ürün vardı. Balık da sebze-meyve sezon yorumuna karışmıştı. Bu ifadeler kayıt varlığından hasat sezonu çıkarıyor; yayın onayı verilmemeli.

Yeni kodun canlı verilerle salt okunur önizlemesi: Temmuz ve Ağustos için aynı 8 hal/kaynak (Konya, Kayseri, Eskişehir, Denizli, Bursa, Kocaeli Merkez, Yalova, Trabzon) koşulları sağlıyor. Temmuz geçerli gözlem günü 28–31; Ağustos 29–31. Yeni eşiklerle görünürlüğü artan/azalan ürün yok. Önizleme JSON'u aynı klasörde. Hiçbir canlı kayıt bu kontrol sırasında değiştirilmedi.

Metodoloji: aktif yerel hallerde aktif kilogram sebze-meyve ürünleri; pozitif fiyat; fiyat karantinası ve ortak blackoutFilter dışlaması (doğrulanmış Wayback istisnası korunur). Kaynak kimliği market_id + source_api. Her iki ayda takvim günlerinin ≥%65'inde geçerli kayıt ve kapsamda ≤15 yüzde puan fark; en az 3 farklı hal. Ürün görünürlüğü eşikleri ≥15 gün / <4 gün ve yüksek görünürlüklü ayda ≥3 hal. Bu eşikler bir veri yeterliliği politikasıdır, hasat sezonu tespiti değildir. Gözlem günü kaynak yayın günü için vekil ölçüttür; boş kaynak yayını ve çekim hatası ayrıştırılamaz. Gerçek sezon yorumu ayrıca tarihli tarımsal kaynak ve editör doğrulaması gerektirir.

Dağıtımdan sonra backend dizininde:

```
bun scripts/qa/monthly-draft-refresh.ts 2026-08
bun scripts/qa/monthly-draft-refresh.ts 2026-08 --apply
```

İlk komut salt okunurdur. İkincisi mevcut persistMonthlyReport yolundan yalnız taslak oluşturur/yeniler; published/archived kayıtları korur. Yenilenmiş içeriğin eski onayı temizlenir. Zamanlanmış yayın yalnız editör onaylı draft için çalışır; yeniden üretim yayın izni sayılmaz. `saved.status=draft`, `reviewedAt=null`, `publishedAt=null` kontrol edilir. Sonraki insan incelemesi halen gereklidir.

Test: monthly-cohort.test.ts 4 test, 9 assertion başarılı. İzole worktree tüm-backend typecheck ortak @agro/audit modül çözümleme ve Fastify public tür hataları nedeniyle tamamlanamadı; değişen dosyalarda TypeScript hatası raporlanmadı. Ana monorepoda bütünleşik typecheck tekrar çalıştırılmalı. Canlı önizlemede gerçek SQL ve HTML üretimi başarılı.
