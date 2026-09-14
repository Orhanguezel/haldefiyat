# Yıllık kıyas — 14 Eylül 2026

## Bulgular

Domates ailesinde 2025 yılına ait 3.924 ham kayıt bulunuyor; mevcut hal/tarih karantina filtresi uygulandıktan sonra 2.131 kayıt, 363 farklı gün kalıyor. Yıllık veri yok değil. Fakat bu, her çeşit ve hal için karşılaştırılabilir geçen-yıl verisi bulunduğu anlamına gelmiyor.

Çeşit API'si `yoyPct: null` sabit döndürüyordu. Arayüz ise bunun yanında sürekli “Yıllık kıyas / Veri birikiyor” sütununu ve sabit Mayıs 2027 uyarısını gösteriyordu.

## Değişiklik

- Çeşit tablosunda yıllık kıyas gerçek eşleşmelerden hesaplanıyor. Aynı ürün, hal, birim, kaynak, ortalama hesaplama yöntemi ve bir yıl önceki tarih eşleşmeli; her iki kayıt karantina dışında ve fiyatlar pozitif olmalı.
- En az 5 farklı eşleşen gün gerekiyor. Eşleşen günlerin güncel toplamı / eski toplamı - 1 ile yüzde hesaplanıyor; farklı hal sepetleri karşılaştırılmıyor. Genel sepet/endeks yıllık yayın politikası değiştirilmedi.
- Görünen satırların hiçbirinde geçerli yıllık oran yoksa sütun tamamen gizleniyor. Bazı satırlarda varsa eksik satırlar “—” gösteriyor. Sabit karantina/tarih uyarısı kaldırıldı.
- İki yıllık veri bulunmayan sayfalarda sezon karşılaştırma kartı gizleniyor. Çok yıllı geçmiş bulunan sayfalardaki sezon eğrileri korunuyor.

## Sayısal doğrulama

Kocaeli Merkez Sebze Meyve Halinde 8 eşleşen gün:

| Çeşit | Yıllık değişim |
|---|---:|
| Domates (1.sınıf) | +%71,6 |
| Domates (2.Sınıf) | +%41,0 |

Bunlar bu hal ve çeşitlerin eşleşen gözlem değişimleridir; Türkiye geneli enflasyon oranı değildir. Diğer çeşitler yeterli eşleşme yoksa boş kalır. Ham eşleşmeler `artifacts/yearly-comparison-2026-09-14/matched-pairs.json`, yıllara göre kapsam `data-audit.json` içindedir.

## Kontroller

- Boş kıyas sütununun gizlenmesi, sıfır değişimin geçerli gösterilmesi ve karma satırlar için 2 arayüz testi geçti.
- Backend TypeScript denetimi ve derlemesi geçti.
- Sayısal sonuçlar üretim veritabanındaki eşleşen kayıtlardan bağımsız olarak yeniden hesaplandı ve API ile aynı çıktı.
- Tarayıcı eklentisi mevcut olmadığından Playwright CLI kullanıldı.
- `.next-release-20260914dc01` canlıya alındı, iki frontend çalışanı sırayla yenilendi.
- Canlı tarayıcı: domateste iki oran görünüyor; patateste yıllık sütun gizli; sabit Mayıs 2027 / Veri birikiyor mesajları yok. Ekran görüntüleri aynı artifact klasöründedir.
- Oturumsuz tarayıcıda mevcut auth bootstrap/refresh istekleri 401 döndü; karşılaştırma API'si ve ürün sayfaları başarılı.

## Son gösterim düzeltmesi

Kullanıcı geri bildirimiyle yüzde sütunu kaldırıldı. Son arayüzde “Geçen yıl aynı dönem” sütunu doğrudan TL fiyatını gösterir. Aynı eşleşmiş kayıtlardan `AVG(prev.avg_price)` döndürülür; yuvarlanmış yüzdeden geriye doğru fiyat türetilmez. Domates 1. sınıf: 36,25 TL; 2. sınıf: 14,19 TL. Yeterli veri olmayanlarda sütunu gizleme kuralı korunur. API yüzde alanı geriye uyumluluk için kalır; bu tabloda gösterilmez.
