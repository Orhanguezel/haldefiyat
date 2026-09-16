# Kampanya bazlı reklam raporları

16 Eylül 2026: `/admin/banners` Raporlar sekmesine marka ve çoklu kampanya seçimi eklendi. Bir markanın mevcut banner/kampanya kayıtları ID ile ayrı tutulur; seçilenler tek tek veya birlikte raporlanır. Yeni kampanya grubu veya veritabanı modeli oluşturulmadı.

Özet, önceki dönem karşılaştırması, cihaz ve slot dağılımı, kampanya satırları, CSV ve yazdır/PDF aynı seçime bağlıdır. Marka değişince kampanya seçimi yeni markanın tüm kampanyalarına döner. Boş seçimde dışa aktarma kapalıdır. Dönem değişirken önceki isteğin verileri yeni tarihle gösterilmez. CSV ve rapor başlığı seçili kapsamı içerir.

Doğrulama: 7 birim testi geçti. Canlı admin sürümünde yalnız test tarayıcısına verilen fixture yanıtlarıyla aynı markanın aynı başlıklı iki kampanyasının ayrılması, birleşik toplam, başka markanın dışarıda kalması, marka değişimi, boş seçim ve indirilen CSV içeriği kontrol edildi; gerçek kampanyalara test verisi yazılmadı. Mobil 390 px yatay taşma yok. Production build başarılı.

Genel TypeScript kontrolünde değişiklik dışındaki `admin_panel/tests/listing-upload.test.ts:9` fetch mock tip hatası mevcut; bu değişikliğin dosyalarında tip hatası bulunmadı. Canlı sürüm `.next-release-20260916ca01`. Önceki admin release `.next-release-20260915bb01`; kaynak ve önceki symlink yedeği sunucuda `/tmp/hal-campaign-report-backup` altında.
