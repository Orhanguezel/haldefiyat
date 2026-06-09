SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO `hf_product_editorial` (
  `product_slug`,
  `about_md`,
  `price_factors_md`,
  `season_md`,
  `production_region_md`,
  `quality_indicators_md`,
  `culinary_uses_md`,
  `related_slugs`,
  `source`,
  `reviewed_by`,
  `reviewed_at`,
  `published_at`
) VALUES
(
  'bugday',
  'Buğday fiyatı, Türkiye tarım piyasasında hem üretici geliri hem de gıda enflasyonu için en yakından izlenen göstergelerden biridir. HalDeFiyat buğday sayfası, klasik hal fiyatlarından farklı olarak TMO resmi alım referansını, ticaret borsalarında oluşan serbest piyasa işlemlerini ve günlük fiyat tarihini birlikte okur. Ekmeklik buğday, makarnalık buğday ve kalite sınıfları aynı ürün gibi görünse de fiyatlamada protein, hektolitre ve bölgesel arz farkı nedeniyle ayrışır. Bu nedenle buğday kg fiyatı değerlendirilirken yalnızca tek bir rakama değil, kaynağa, tarih aralığına ve kalite notuna bakmak gerekir.',
  'Buğday fiyatlarını hasat dönemindeki rekolte, TMO alım fiyatı ve prim duyuruları, dünya hububat fiyatları, döviz kuru, ithalat-ihracat dengesi ve ticaret borsalarındaki günlük işlem hacmi belirler. Kurak geçen sezonlarda protein ve verim aynı anda değişebilir; bu da kaliteli ekmeklik buğdayı daha pahalı hale getirebilir. Hasat başlangıcında arz hızla arttığı için bölgesel fiyat baskısı görülebilir, ancak depolama maliyeti, sanayici talebi ve TMO stok politikası sezon ortasında yönü değiştirebilir.',
  'Buğday ekimi İç Anadolu ve Trakya başta olmak üzere çoğunlukla sonbaharda yapılır. Güneydoğu Anadolu ve Çukurova gibi erken bölgelerde hasat Mayıs sonu ile Haziran başında başlar; İç Anadolu genelinde Haziran-Temmuz, Trakya''da ise Haziran sonu-Temmuz dönemi öne çıkar. Makarnalık buğday takibi için Güneydoğu hasadı, ekmeklik buğday takibi için İç Anadolu ve Trakya fiyat akışı özellikle önemlidir.',
  'Konya, Ankara, Şanlıurfa, Diyarbakır, Tekirdağ, Edirne, Yozgat ve Sivas buğday üretiminde öne çıkan illerdir. Konya geniş ekim alanı ve borsa derinliğiyle ulusal fiyat algısını etkilerken, Güneydoğu Anadolu makarnalık buğday arzında güçlüdür. Trakya tarafında kalite, nem ve lojistik avantajı sanayi alımlarında belirleyici olabilir. Bölge farkı fiyatı yalnızca mesafe nedeniyle değil, çeşidin kullanım amacına göre de değiştirir.',
  'Buğdayda protein oranı, hektolitre ağırlığı, rutubet, süne-kımıl zararı, yabancı madde, kırık tane ve camsılık fiyat farkının ana belirleyicileridir. Ekmeklik buğdayda protein ve hektolitre yükseldikçe sanayici talebi artar; makarnalık buğdayda renk, camsılık ve gluten kalitesi ayrıca izlenir. Rutubeti yüksek ürün kurutma ve depolama riski taşıdığı için borsa fiyatında iskonto görebilir.',
  'Un, ekmek, makarna, bulgur, irmik ve yem sanayisinde kullanılır.',
  JSON_ARRAY('arpa', 'misir'),
  'manual',
  @ADMIN_ID,
  NOW(3),
  NOW(3)
),
(
  'arpa',
  'Arpa fiyatı, yem sanayisi ve hayvancılık maliyetlerinin nabzını tutan temel hububat göstergelerinden biridir. Türkiye''de arpa çoğunlukla yemlik olarak takip edilir; maltlık kalite ise daha sınırlı ve kaliteye duyarlı bir pazar oluşturur. HalDeFiyat arpa sayfası, TMO alım ve satış politikalarını ticaret borsası fiyatlarıyla birlikte göstererek üretici, besici ve yem alıcısının aynı ürünü farklı açılardan değerlendirmesine yardımcı olur. Arpa kg fiyatı yorumlanırken yem talebi, bölgesel hasat yoğunluğu ve ithalat maliyeti birlikte okunmalıdır.',
  'Arpa fiyatlarını hasat miktarı, küçükbaş ve büyükbaş yem talebi, TMO alım fiyatı, TMO stok satışı, ithalat vergileri, döviz kuru ve yem hammaddesi piyasasındaki sıkışma etkiler. Kuraklık arpa verimini buğdaydan farklı şekilde baskılayabilir; özellikle İç Anadolu''da yağış eksikliği yemlik arzı hızla daraltır. Yem fabrikalarının alım temposu, saman ve mısır fiyatı ile birlikte arpa talebini artırabilir. Hasat döneminde arz bollaşsa da depolama ve nakliye maliyeti sezon içinde fiyatı yeniden yukarı taşıyabilir.',
  'Arpa ekimi çoğu bölgede sonbaharda yapılır; bazı yüksek rakımlı alanlarda ilkbahar ekimi de görülebilir. Güney ve batı bölgelerde hasat Mayıs sonu-Haziran döneminde başlar. İç Anadolu, Orta Anadolu ve yüksek rakımlı üretim alanlarında hasat Haziran sonundan Temmuz ayına uzar. Yemlik arpa fiyatı için ilk hasat akışı kadar yaz sonundaki yem talebi de önemlidir.',
  'Konya, Ankara, Eskişehir, Yozgat, Kırşehir, Şanlıurfa, Sivas ve Afyonkarahisar arpa üretiminde öne çıkan illerdir. İç Anadolu geniş ekim alanı sayesinde fiyat yönünü belirleyen ana bölgedir. Güneydoğu Anadolu erken hasatla piyasa sinyali verirken, Orta Anadolu''daki rekolte yem sanayisinin sezon planlamasında daha kalıcı etki yaratır. Bölgesel borsa fiyatları nakliye mesafesi ve yem fabrikalarına yakınlığa göre farklılaşabilir.',
  'Arpada rutubet, hektolitre, kırık tane, yabancı madde, dolgunluk ve renk alım fiyatını etkiler. Yemlik arpada aşırı rutubet ve yabancı madde iskonto doğurur; maltlık kullanımda tane iriliği, çimlenme kabiliyeti ve homojenlik daha hassas değerlendirilir. Depolamaya uygun kuru ve temiz ürün, hasat yoğunluğunda bile daha güçlü fiyat bulabilir.',
  'Yem sanayisi, besicilik rasyonları, malt üretimi ve sınırlı gıda kullanımlarında değerlendirilir.',
  JSON_ARRAY('bugday', 'misir'),
  'manual',
  @ADMIN_ID,
  NOW(3),
  NOW(3)
),
(
  'misir',
  'Mısır fiyatı, yem, nişasta, yağ ve endüstriyel gıda talebinin kesiştiği yüksek hacimli bir tarla ürünü göstergesidir. Türkiye''de dane mısır hem birinci ürün hem de ikinci ürün olarak yetiştirildiği için fiyat sezonu buğday ve arpadan daha uzun sürer. HalDeFiyat mısır sayfası, ticaret borsası verilerini resmi kaynaklarla birlikte izleyerek günlük mısır kg fiyatı arayan kullanıcıya kaynak, tarih ve piyasa tipi ayrımı sunar. Özellikle nem oranı ve kurutma maliyeti mısırda çıplak fiyat kadar önemlidir.',
  'Mısır fiyatlarını sulama maliyeti, ikinci ürün ekim alanı, yem sanayisi talebi, nişasta ve glikoz sanayisinin alım temposu, dünya mısır fiyatları, döviz kuru ve TMO piyasa müdahaleleri etkiler. Hasat döneminde yüksek nemli ürün kurutma masrafı nedeniyle iskonto görebilir. İthal mısır maliyeti yükseldiğinde yerli ürün talebi güçlenir; yemlik buğday ve arpa fiyatları da mısırın ikame değerini etkiler.',
  'Birinci ürün mısır ekimi ilkbaharda yapılır ve hasat çoğunlukla Ağustos-Eylül döneminde başlar. İkinci ürün mısır, buğday veya arpa hasadından sonra ekilir; hasadı Eylül-Kasım dönemine yayılır. Çukurova erken fiyat sinyali verirken, Güneydoğu ve İç Anadolu hasadı sezonun toplam arzını belirler. Yağış ve sulama imkanı takvimi doğrudan etkiler.',
  'Adana, Mersin, Şanlıurfa, Diyarbakır, Konya, Sakarya, Manisa ve Osmaniye mısır üretiminde önemli illerdir. Çukurova erken hasat ve sanayi bağlantılarıyla, Güneydoğu Anadolu ise ikinci ürün hacmiyle öne çıkar. Konya ve Sakarya tarafında sulama koşulları ve yem sanayisine yakınlık fiyatı etkiler. Bölgesel borsa farkları çoğu zaman nem ve lojistik maliyetinden kaynaklanır.',
  'Mısırda nem oranı, kırık tane, yabancı madde, tane dolgunluğu, aflatoksin riski ve kurutma ihtiyacı fiyatın ana kalite göstergeleridir. Nem yüksekse alıcı kurutma maliyetini düşerek fiyat verir. Aflatoksin riski taşıyan ürün yem ve gıda sanayisinde ciddi iskonto görebilir. Temiz, kuru ve homojen dane mısır daha geniş alıcı kitlesine ulaşır.',
  'Yem, nişasta, glikoz, mısır yağı, unlu mamul, silaj ve endüstriyel gıda üretiminde kullanılır.',
  JSON_ARRAY('bugday', 'arpa', 'aycicegi'),
  'manual',
  @ADMIN_ID,
  NOW(3),
  NOW(3)
),
(
  'aycicegi',
  'Ayçiçeği fiyatı, Türkiye''nin bitkisel yağ arzı ve yağlı tohum ithalat dengesi açısından stratejik bir göstergedir. Yağlık ayçiçeği, çerezlik ayçiçeğinden farklı fiyatlanır; HalDeFiyat sayfasında amaç yağlık ürünün TMO, borsa ve serbest piyasa referanslarını okunabilir şekilde toplamaktır. Ayçiçeği kg fiyatı değerlendirilirken yalnızca ürün fiyatı değil, yağ oranı, ham yağ ithalat maliyeti ve destekleme primi beklentisi birlikte ele alınmalıdır. Üretici geliri açısından prim fiyatın parçası gibi algılansa da piyasa fiyatından ayrı izlenmelidir.',
  'Ayçiçeği fiyatlarını Trakya ve İç Anadolu rekoltesi, yağ oranı, TMO alım politikası, ham ayçiçek yağı ithalat fiyatı, döviz kuru, gümrük vergileri, ihracat/ithalat kararları ve kırma sanayisinin alım temposu etkiler. Kuraklık ve sıcak stresleri tane dolumunu azaltarak yağ oranını düşürebilir. Dünya yağlı tohum fiyatları yükseldiğinde yerli ayçiçeğine talep artar; ancak hasat dönemindeki yoğun arz kısa süreli fiyat baskısı yaratabilir.',
  'Ayçiçeği ekimi çoğunlukla ilkbaharda yapılır. Trakya''da hasat Ağustos sonu-Eylül döneminde yoğunlaşır; İç Anadolu ve geç ekim yapılan bölgelerde Eylül ayı öne çıkar. Çukurova gibi sıcak bölgelerde takvim daha erken başlayabilir. Sezon takibinde çiçeklenme dönemindeki yağış ve sıcaklık, hasat fiyatı kadar kalite beklentisi için de önemlidir.',
  'Tekirdağ, Edirne, Kırklareli, Konya, Adana, Eskişehir, Balıkesir ve Çorum ayçiçeği üretiminde öne çıkan illerdir. Trakya yağlık ayçiçeğinde güçlü bir referans bölgedir; Konya ve İç Anadolu alanları sulama koşullarına bağlı olarak önemli hacim sağlar. Yağ fabrikalarına yakınlık ve bölgesel kırma kapasitesi, borsa fiyatlarında lojistik avantaj veya dezavantaj oluşturabilir.',
  'Ayçiçeğinde yağ oranı, rutubet, yabancı madde, tane dolgunluğu, kırık oranı ve çürüme belirtisi fiyat farkını belirler. Yağ oranı yükseldikçe kırma sanayisi için ürünün ekonomik değeri artar. Rutubeti yüksek veya yabancı maddesi fazla ürün depolama riski taşıdığı için iskonto görebilir. Homojen ve temiz parti, hasat yoğunluğunda daha hızlı alıcı bulur.',
  'Bitkisel yağ, küspe, yem sanayisi ve çerezlik sınıflarda gıda tüketimi için kullanılır.',
  JSON_ARRAY('pamuk', 'misir'),
  'manual',
  @ADMIN_ID,
  NOW(3),
  NOW(3)
),
(
  'pamuk',
  'Pamuk fiyatı, tarım piyasası ile tekstil sanayisini doğrudan bağlayan stratejik sanayi bitkisi göstergesidir. Türkiye''de kütlü pamuk, çırçır sonrası lif pamuğa dönüşür; bu nedenle üreticinin gördüğü fiyat ile tekstil sanayisinin takip ettiği lif pamuk referansları aynı değildir. HalDeFiyat pamuk sayfası, borsa ve resmi kaynakları tarih ayrımıyla izleyerek pamuk kg fiyatı arayan kullanıcıya kütlü, kalite ve bölge farkını daha net okuma imkanı verir. Destekleme primi üretici gelirini etkiler, ancak serbest piyasa fiyatından ayrı değerlendirilmelidir.',
  'Pamuk fiyatlarını lif kalitesi, randıman, dünya pamuk borsaları, döviz kuru, tekstil ihracat talebi, çırçır maliyetleri, TMO veya ilgili kamu alım duyuruları ve destekleme primi beklentisi etkiler. Küresel tekstil talebi zayıfladığında lif pamuk fiyatı baskılanabilir; kur artışı ise ithal rakip ürün maliyetini yükselterek yerli pamuğu destekleyebilir. Hasat döneminde arz artışı kısa vadeli baskı yaratsa da kalite sınıfı yüksek ürün ayrışabilir.',
  'Pamuk ekimi ilkbaharda yapılır; sulama ve sıcaklık takvimi verimi belirler. Ege ve Çukurova''da hasat çoğunlukla Eylül-Ekim döneminde yoğunlaşır. Güneydoğu Anadolu''da hasat Eylül-Kasım arasına yayılabilir. Defoliasyon, toplama yöntemi ve yağış riski hasat kalitesini etkilediği için fiyat takibinde yalnızca tarih değil, hasat koşulları da önemlidir.',
  'Şanlıurfa, Diyarbakır, Aydın, İzmir, Adana, Hatay, Mardin ve Manisa pamuk üretiminde öne çıkan illerdir. Güneydoğu Anadolu geniş sulama alanlarıyla yüksek hacim üretirken, Ege pamuğu kalite algısıyla dikkat çeker. Çukurova erken sezon sinyali verebilir. Çırçır tesislerine, tekstil merkezlerine ve limanlara yakınlık bölgesel fiyat farklarında rol oynar.',
  'Pamukta lif uzunluğu, incelik, mukavemet, renk, çepel oranı, rutubet, randıman ve yabancı madde fiyatın ana kalite göstergeleridir. Makine hasadı yapılan üründe temizlik ve çepel kontrolü önem kazanır. Randımanı yüksek kütlü pamuk, aynı kg fiyatında daha fazla lif verdiği için alıcı açısından değerlidir. Yağış görmüş veya renk değeri düşmüş ürün iskonto görebilir.',
  'Tekstil lifi, pamuk yağı, küspe ve yem sanayisi yan ürünlerinde kullanılır.',
  JSON_ARRAY('aycicegi'),
  'manual',
  @ADMIN_ID,
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `about_md` = VALUES(`about_md`),
  `price_factors_md` = VALUES(`price_factors_md`),
  `season_md` = VALUES(`season_md`),
  `production_region_md` = VALUES(`production_region_md`),
  `quality_indicators_md` = VALUES(`quality_indicators_md`),
  `culinary_uses_md` = VALUES(`culinary_uses_md`),
  `related_slugs` = VALUES(`related_slugs`),
  `source` = VALUES(`source`),
  `reviewed_by` = VALUES(`reviewed_by`),
  `reviewed_at` = VALUES(`reviewed_at`),
  `published_at` = VALUES(`published_at`);
