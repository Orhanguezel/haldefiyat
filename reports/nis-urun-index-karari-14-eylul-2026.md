# Niş ürünlerde indeks kararı — 14 Eylül 2026

## Karar ve uygulama

Kekik (Yaş-Taze), Tatlı Patates, Defne Yaprağı (Yaş-Taze), İstakoz ve Tarhun için indeks izni açıldı. Bu ürünlerde dar hal kapsamı tek başına ret gerekçesi değil. İstisna isimleri kodda açıkça tanımlıdır; bütün tek halli ürünlere uygulanmaz.

Koşullar: kanonik ana ürün, yayımlanmış editoryal, kalite >=65, son 30 günlük pencerede >=4 farklı kayıt günü ve en az bir hal kaynağı. 4 gün, bu incelemede seçilen ürünler için işletme kararıdır; Google tarafından belirlenmiş bir SEO eşiği değildir. Kayıtlar kurursa otomatik noindex koruması devam eder. Standart >=15 gün niş yolu korunur. Adminin sonraki adım sınıflandırması da iki niş yolunu tanır.

E. Kulak: indeks izni açılmadı. Ürün adı kısaltma, gerçek tür kimliği belirsiz. Mevcut metindeki üretim rakamları doğrulanmış değil. Önce kaynaktaki tam isim ve doğru ürün eşleştirmesi çözülmeli. Panelde Google: İndexli görünmesi, sayfanın güncel noindex etiketiyle aynı anda görülebilir; Google raporu son tarama/snapshot durumunu yansıtır.

Beş ürünün altışar editoryal bölümü düzeltildi: kanıtsız üretim rakamları, ülke sıralamaları, kesin sezonlar ve sağlık iddiaları kaldırıldı; birim, ürün biçimi, menşe ve karşılaştırma sınırları açıklandı. Arama hacmi tıklama tahmini veya sıralama garantisi olarak kullanılmadı.

## Kaynaklar

- https://arastirma.tarimorman.gov.tr/yalovabahce/Menu/75/Tibbi-Aromatik-Bitkiler
- https://arastirma.tarimorman.gov.tr/batem/Sayfalar/Detay.aspx?SayfaId=58
- https://arastirma.tarimorman.gov.tr/etae/Sayfalar/Detay.aspx?SayfaId=65
- https://mugla.tarimorman.gov.tr/Haber/270/Muglada-Tibbi-Ve-Aromatik-Bitkilere-Ilgi-Buyuk
- https://www.tarimorman.gov.tr/EYDB/Belgeler/yem_maddeleri_katalogu_son.pdf
- https://www.tarimorman.gov.tr/TAGEM/Belgeler/E_BULTEN/E-B%C3%BClten_%C5%9EUBAT%202022.pdf
- https://isparta.tarimorman.gov.tr/BelgelerArsiv/Haber/2018/Gen%C3%A7%20%C3%87ift%C3%A7i%20Projelerine%20B%C3%BCy%C3%BCk%20Destek/2018%20Uygulama%20Rehberi-Ekleri.pdf

Bakanlık kaynakları ürün tanımları için kullanıldı; geçmiş haber rakamları bugünün üretim rakamı olarak aktarılmadı. Fiyat kapsamı ve yayın durumunun kaynağı üretim veritabanıdır.

## Doğrulama

- Dar kapsam kabulü, bilinmeyen tür, kalite alt sınırı, veri yokluğu ve hal yokluğu testleri: 2 test / 7 doğrulama geçti.
- Backend TypeScript denetimi ve derleme geçti.
- Yalnız değişen üç backend modülü kaynak/derlenmiş dosyalarıyla canlıya taşındı; backend yeniden yükleme sonrası sağlık kontrolü başarılı.
- Eski içerikler `artifacts/niche-seo-2026-09-14/before.json`; yeni metinler `content.json`. Canlıdaki eski kod yedeği `/tmp/niche-seo-20260914-backup` altında.
- Normal canlı URL'lerde beş ürünün tamamı yeni editoryali ve `index, follow` etiketini döndürüyor. E. Kulak `noindex, follow` olarak doğrulandı. Sonuçlar `artifacts/niche-seo-2026-09-14/verification.json` içinde.
