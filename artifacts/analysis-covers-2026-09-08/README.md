# Konuya uygun analiz kapakları — 8 Eylül 2026

20 fotoğraf gerçekçiliğinde, yazısız temsili kapak üretildi. 27 veritabanı raporu ve 8 sabit analiz, başlık/özette öne çıkan ürüne göre elle eşleştirildi. Aynı ürünü ele alan bazı raporlar aynı konu görselini kullanır.

- Kaynak: yerleşik imagegen; 20 ayrı sahne. Saha fotoğrafı veya gerçek bir olay kaydı değildir. Alt metinde yapay zekâ ile oluşturulmuş temsili görsel olduğu belirtilir.
- Standart ölçü: 1600×900 WebP. Orijinaller Codex generated_images alanında, web dosyaları output/imagegen/analysis-covers-2026-09-08 altında.
- Canlı varlık yolu: /uploads/analysis-covers/2026-09-08/.
- assets.json: üretilen dosyaların eşleştirmesi. mapping.json: kayıt ID/slug/eski-yeni kapak ve alt metin. static-mapping.json: 8 sabit analiz.
- before.json: eski kapak envanteri; eski dosyalar silinmedi. Makale içi grafikler ve metinler korunur.

## Uygulama
backend klasöründen `bun scripts/update-analysis-covers-20260908.ts` ön kontrol; `--apply` ile uygulama. Script önce dosyaların 200/image-webp yanıtını kontrol eder, işlem içinde mevcut kapakları karşılaştırır ve yalnızca og_image/image_alt alanlarını günceller. İçerik hash'i, yayın durumu ve yayın tarihi değişmediği doğrulanır. Tekrar çalıştırmada değişiklik yapmaz; beklenmeyen kapak değişikliğinde durur.

Sabit analizler frontend/src/lib/analiz.ts içinde açıkça eşleştirilmiştir. Otomatik yeni raporlara rastgele görsel atayan kural eklenmedi.

## Doğrulama
- Frontend TypeScript ve git diff --check başarılı.
- dry-run.json, applied.json, repeat-check.json uygulama kanıtıdır.
- Canlı sürüm 8e47b8cbe24b. Üretim derlemeleri başarılı; dağıtım penceresinde nginx 5xx=0; sağlık status=ok/db=ok.
- 27 yönetim kaydında yeni kapak doğrulandı; editörde pamuk balyası görseli yüklendi.
- Halka açık listede görünen 20 kartın tamamı yeni kapak kullanıyor; 390px görünümde taşma yok. Sabit sera analizinin OG görseli greenhouse.webp.
- Ana sayfa widget'ındaki altı yeni kapak yüklendi. Pamuk detayının kapak ve og:image alanları aynı yeni dosyayı kullanıyor.
- 20 canlı dosyanın SHA256 özeti yerel dosyalarla eşleşiyor; toplam 4.126.932 bayt.
- Uygulama 27 kaydı güncelledi. İkinci ön kontrolde değişiklik sayısı 0; içerik hash'leri, yayın tarihleri ve durumlar korundu.
- Kanıtlar: live-assets.json, live-admin.txt, live-final.txt, live-detail.txt, live-widget.txt; ekran görüntüleri output/playwright/analysis-covers/.
- İlk dağıtım denemesi ön kontrol için sunucuya kopyalanmış iki dosya nedeniyle Git geçişinde durdu; dosyalar /tmp/hal-analysis-covers-predeploy-20260908/ altına taşınarak dağıtım başarıyla tekrarlandı.
