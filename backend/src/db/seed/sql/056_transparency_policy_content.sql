SET NAMES utf8mb4;
SET time_zone = '+00:00';

SET @editorial_id = '11111111-0101-0001-0001-000000000001';
SET @corrections_id = '11111111-0102-0001-0001-000000000002';
SET @sources_id = '11111111-0103-0001-0001-000000000003';
SET @ownership_id = '11111111-0104-0001-0001-000000000004';

INSERT INTO `custom_pages`
  (`id`, `module_key`, `is_published`, `display_order`)
VALUES
  (@editorial_id, 'kurumsal', 1, 30),
  (@corrections_id, 'kurumsal', 1, 40),
  (@sources_id, 'kurumsal', 1, 50),
  (@ownership_id, 'kurumsal', 1, 60)
ON DUPLICATE KEY UPDATE
  `module_key` = VALUES(`module_key`),
  `is_published` = VALUES(`is_published`),
  `display_order` = VALUES(`display_order`);

INSERT INTO `custom_pages_i18n`
  (`page_id`, `locale`, `title`, `slug`, `summary`, `meta_title`, `meta_description`, `content`)
VALUES
(
  @editorial_id,
  'tr',
  'Editoryal Politika',
  'editoryal-politika',
  'HalDeFiyat içeriklerinin hazırlanması, otomasyon kullanımı, insan kontrolü ve çıkar çatışması ilkeleri.',
  'Editoryal Politika | HalDeFiyat',
  'HalDeFiyat içeriklerinin hazırlanması, otomasyon kullanımı, insan kontrolü, kaynak gösterimi ve bağımsızlık ilkeleri.',
  '<p><strong>Son güncelleme:</strong> 27 Temmuz 2026</p><p>Bu politika, HalDeFiyat tarafından yayımlanan fiyat tabloları, analizler, yıllık raporlar, rehberler ve açıklayıcı içerikler için geçerlidir.</p><h2>Temel ilkeler</h2><ul><li><strong>Kaynağa bağlılık:</strong> Fiyat kayıtları mümkün olduğunda ilgili belediye hali, ticaret borsası veya diğer açık birincil kaynağın adı ve veri tarihiyle yayımlanır.</li><li><strong>Veri ile yorumu ayırma:</strong> Kaynaktan alınan fiyat, birim ve tarih alanları; HalDeFiyat tarafından üretilen özet veya yorumdan ayrı değerlendirilir.</li><li><strong>İzlenebilirlik:</strong> Sayfalarda görünen güncellik, kapsam ve örneklem bilgileri mevcut veri kayıtlarından hesaplanır; gerçekte ölçülmeyen bir güncellik iddiası kullanılmaz.</li><li><strong>Bağımsızlık:</strong> Reklam, sponsorluk veya ticari işbirliği; fiyat verisinin seçimini, sıralamasını ya da editoryal sonucu belirlemez.</li></ul><h2>Otomasyon ve insan kontrolü</h2><p>Fiyat verileri kaynak bazlı ETL süreçleriyle otomatik toplanabilir, ürün ve birim normalizasyonundan geçirilebilir. Otomatik üretilen analiz veya raporlar sistemde bu niteliğiyle işaretlenir. İnsan incelemesinden geçen yayınlarda inceleyen kullanıcı ve inceleme zamanı kayıt altına alınır.</p><p>Otomatik sistemler hata yapabilir. Olağan dışı fiyat, yanlış ürün eşleşmesi, tarih sapması ve veri kaynağı kesintileri kalite kontrolleriyle izlenir; şüpheli kayıtlar yayımdan çıkarılabilir veya düzeltilmek üzere işaretlenebilir.</p><h2>Yazar ve kaynak bilgisi</h2><p>Editoryal analizlerde atanmış yazar varsa ad, unvan ve profil bağlantısı gösterilir. Kurumsal veya otomatik içerikte içerik türü açıkça belirtilir. Kaynak ayrıntıları için <a href="/veri-kaynagi-politikasi">Veri Kaynağı Politikası</a> ve <a href="/metodoloji">Metodoloji</a> sayfaları kullanılabilir.</p><h2>Çıkar çatışması ve sponsorlu içerik</h2><p>Ücretli yerleşimler ve reklam alanları “Sponsorlu” veya eşdeğer görünür bir etiketle ayrılır. Bir firma veya kaynağın ticari müşteri olması, o firmaya ilişkin veri ya da editoryal değerlendirmede ayrıcalık sağlamaz.</p><h2>Geri bildirim</h2><p>Hata veya çıkar çatışması bildirimi için <a href="/iletisim">iletişim formunu</a> ya da <a href="mailto:iletisim@haldefiyat.com">iletisim@haldefiyat.com</a> adresini kullanabilirsiniz. Düzeltmeler <a href="/duzeltme-politikasi">Düzeltme Politikası</a> kapsamında ele alınır.</p>'
),
(
  @corrections_id,
  'tr',
  'Düzeltme Politikası',
  'duzeltme-politikasi',
  'HalDeFiyat veri ve içerik hatalarının bildirilmesi, incelenmesi, düzeltilmesi ve kayıt altına alınması süreci.',
  'Düzeltme Politikası | HalDeFiyat',
  'HalDeFiyat veri ve içerik hatalarının nasıl bildirildiğini, incelendiğini, düzeltildiğini ve kayıt altına alındığını öğrenin.',
  '<p><strong>Son güncelleme:</strong> 27 Temmuz 2026</p><h2>Hangi bildirimler incelenir?</h2><p>Yanlış fiyat, ürün, birim, hal, kaynak veya tarih; çalışmayan kaynak bağlantısı; yanıltıcı başlık ya da özet; eksik atıf ve çıkar çatışması bildirimleri incelenir. Kaynak kurumun daha sonra değiştirdiği bir veri de düzeltme konusu olabilir.</p><h2>Bildirim nasıl yapılır?</h2><p><a href="/iletisim">İletişim formunda</a> mümkünse ilgili sayfanın adresini, hatalı görülen alanı, doğru olduğunu düşündüğünüz bilgiyi ve dayanak kaynağı paylaşın. E-posta bildirimleri <a href="mailto:iletisim@haldefiyat.com">iletisim@haldefiyat.com</a> adresine gönderilebilir.</p><h2>İnceleme sırası</h2><ol><li>Bildirim ilgili URL ve veri kaydıyla eşleştirilir.</li><li>Birincil kaynak, kaynak tarihi ve ETL çalışma kaydı karşılaştırılır.</li><li>Hata HalDeFiyat normalizasyonundan kaynaklanıyorsa veri veya eşleştirme düzeltilir.</li><li>Hata birincil kaynakta bulunuyorsa kayıt kaynakla aynı tutulabilir; kullanıcıya açıklama eklenebilir veya açıkça şüpheli kayıt yayından çıkarılabilir.</li><li>Tekrarlanma riski varsa parser, normalizasyon ya da kalite kontrol kuralı güncellenir.</li></ol><h2>Düzeltmenin görünürlüğü</h2><p>Fiyat sayfaları güncel veri görünümünü sunduğu için yeni doğrulanmış kayıt önceki hatalı görünümün yerini alabilir. Editoryal analizde anlamı değiştiren önemli bir düzeltme yapılırsa güncelleme tarihi veya düzeltme notu yayımlanır. Yazım ve biçim düzeltmeleri ayrıca duyurulmayabilir.</p><h2>Yanıt hedefi</h2><p>Bildirimler önem ve etki alanına göre sıralanır. Çok sayıda URL’yi, güncel fiyat kararını veya güvenliği etkileyen sorunlara öncelik verilir. İnceleme gerektiren her bildirimin aynı gün sonuçlanacağı garanti edilmez.</p><h2>İtiraz</h2><p>Düzeltme sonucuna katılmıyorsanız yeni kanıt veya birincil kaynak bağlantısıyla aynı iletişim kanalından yeniden değerlendirme isteyebilirsiniz.</p>'
),
(
  @sources_id,
  'tr',
  'Veri Kaynağı Politikası',
  'veri-kaynagi-politikasi',
  'HalDeFiyat veri kaynaklarının seçimi, aktarımı, normalizasyonu, güncelliği ve kaynak gösterme standartları.',
  'Veri Kaynağı Politikası | HalDeFiyat',
  'HalDeFiyat veri kaynaklarının seçimi, otomatik aktarımı, normalizasyonu, güncelliği ve kaynak gösterme standartları.',
  '<p><strong>Son güncelleme:</strong> 27 Temmuz 2026</p><h2>Kaynak kapsamı</h2><p>HalDeFiyat; belediye hal müdürlükleri, ticaret borsaları, kamu kurumları ve kaynağı açıkça tanımlanabilen diğer fiyat yayınlarından veri derler. Aktif kaynakların kapsamı zaman içinde erişim, yayın takvimi ve veri kalitesine göre değişebilir.</p><h2>Kaynak seçim ölçütleri</h2><ul><li>Yayıncının ve fiyatın kapsadığı pazarın belirlenebilir olması</li><li>Fiyat tarihi, ürün, birim ve fiyat türünün ayrıştırılabilmesi</li><li>Kaynağa düzenli ve hukuka uygun teknik erişim sağlanabilmesi</li><li>Verinin kullanıcıya kaynak adıyla birlikte gösterilebilmesi</li></ul><h2>Toplama ve normalizasyon</h2><p>Kaynaklar HTML tablo, dosya, JSON API veya kaynak sisteme özgü başka bir teknik biçimde yayın yapabilir. Kaynak bazlı görevler veriyi alır; ürün adları, ölçü birimleri ve tarih alanları ortak veri modeline dönüştürülür. Bir kaynak yalnız minimum ve maksimum fiyat veriyorsa ortalama alanı bu iki değerin orta noktası olarak türetilebilir; bu durum gerçek işlem hacmi ağırlıklı ortalama anlamına gelmez.</p><h2>Güncellik ve kesintiler</h2><p>“Son veri tarihi”, veri tabanındaki doğrulanabilir son kaynak tarihinden üretilir. Kaynağın o gün bülten yayımlamaması, teknik erişim hatası veya aktarım gecikmesi nedeniyle bazı pazarlar eski tarihli kalabilir. Bu durum yeni veri varmış gibi gösterilmez. Kaynak sağlığı <a href="/data-health">Veri Sağlığı</a> sayfasından izlenebilir.</p><h2>Kalite kontrolleri</h2><p>Geçersiz tarih, desteklenmeyen birim, boş fiyat, minimum–maksimum tutarsızlığı, olağan dışı sıçrama ve ürün kategorisi uyuşmazlığı kontrolleri uygulanabilir. Kontrolden geçmeyen bir kayıt karantinaya alınabilir veya yayımdan çıkarılabilir. Bu kontroller birincil kaynağın hatasız olduğunu garanti etmez.</p><h2>Kaynak gösterimi ve yeniden kullanım</h2><p>Fiyat yüzeylerinde kaynak adı ve veri tarihi mümkün olan en yakın bağlamda gösterilir. API ve veri çıktıları kullanılırken “Kaynak: HalDeFiyat.com” ifadesiyle ilgili sayfaya bağlantı verilmesi; mevcutsa birincil kaynak adının da korunması önerilir. Ayrıntılı hesaplama ilkeleri <a href="/metodoloji">Metodoloji</a> sayfasındadır.</p><h2>Kaynak hatası bildirimi</h2><p>Eksik veya hatalı kaynak bilgilerini <a href="/iletisim">iletişim formundan</a> bildirebilirsiniz.</p>'
),
(
  @ownership_id,
  'tr',
  'Sahiplik ve Finansman',
  'sahiplik-finansman',
  'HalDeFiyat platformunun işletimi, gelir modeli, sponsorlu alanları ve editoryal bağımsızlık açıklaması.',
  'Sahiplik ve Finansman | HalDeFiyat',
  'HalDeFiyat platformunun işletimi, finansman modeli, sponsorlu alanları ve editoryal bağımsızlık ilkeleri.',
  '<p><strong>Son güncelleme:</strong> 27 Temmuz 2026</p><h2>Platformun işletimi</h2><p>HalDeFiyat, Türkiye’deki tarımsal fiyat bilgisine erişimi kolaylaştırmak amacıyla geliştirilen bağımsız bir dijital veri platformudur. Sorumlu yayıncı ve iletişim noktası <strong>HalDeFiyat</strong>’tır. İletişim bilgileri <a href="/iletisim">İletişim</a> sayfasında yayımlanır.</p><h2>Finansman modeli</h2><p>Platformun geliştirme, sunucu, veri işleme ve iletişim giderleri reklam, açıkça etiketlenen sponsorluk/işbirliği alanları ve ücretli ürün veya hizmetlerden elde edilebilecek gelirlerle karşılanabilir. Bir hizmetin ücretli olması, kamuya açık fiyat verisinin kaynağını veya anlamını değiştirmez.</p><h2>Editoryal bağımsızlık</h2><p>Reklamverenler, sponsorlar, veri kaynakları ve listelenen firmalar editoryal sonuç üzerinde onay veya veto hakkına sahip değildir. Ticari ilişki; fiyat kaydının seçilmesi, sıralanması, normalizasyonu ya da analiz sonucuna müdahale gerekçesi olamaz.</p><h2>Reklam ve sponsorlu yerleşimler</h2><p>Ücretli yerleşimler içerikten görsel olarak ayrılır ve “Sponsorlu” veya eşdeğer bir etiket taşır. Sponsor bağlantıları, bir veri kaynağının resmî olduğu veya HalDeFiyat tarafından tavsiye edildiği anlamına gelmez.</p><h2>Veri kaynaklarıyla ilişki</h2><p>HalDeFiyat, sayfalarda adı geçen belediye, hal, borsa veya kamu kurumlarının resmî sitesi değildir; açıkça aksi belirtilmedikçe bu kurumlar tarafından işletilmez. Birincil kaynaklar ve toplama yöntemi <a href="/veri-kaynagi-politikasi">Veri Kaynağı Politikası</a> ile <a href="/metodoloji">Metodoloji</a> sayfalarında açıklanır.</p><h2>Çıkar çatışması bildirimi</h2><p>Bir içerik veya ticari ilişki hakkında çıkar çatışması şüpheniz varsa <a href="mailto:iletisim@haldefiyat.com">iletisim@haldefiyat.com</a> adresine veya <a href="/iletisim">iletişim formuna</a> bildirebilirsiniz.</p>'
)
ON DUPLICATE KEY UPDATE
  `page_id` = VALUES(`page_id`),
  `title` = VALUES(`title`),
  `summary` = VALUES(`summary`),
  `meta_title` = VALUES(`meta_title`),
  `meta_description` = VALUES(`meta_description`),
  `content` = VALUES(`content`);
