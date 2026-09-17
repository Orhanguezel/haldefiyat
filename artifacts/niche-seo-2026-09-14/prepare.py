import json
from pathlib import Path
fields=['about_md','price_factors_md','season_md','production_region_md','quality_indicators_md','culinary_uses_md']
data={
'kekik-yas-taze':[
'Taze kekik, aromatik yaprakları ve sürgünleriyle değerlendirilen bir üründür. Kekik adı farklı türler için kullanılabildiğinden, fiyat kaydındaki ürün tanımını satıcının sunduğu türle birlikte okuyun. Bu sayfa yaş-taze ürünün kilogram fiyatlarını izler; kuru kekik, öğütülmüş baharat ve kekik yağı aynı ürün biçimi değildir.',
'Taze kekikte yaprak-sap oranı, ayıklama, paketleme ve sevkiyat koşulları teklifleri karşılaştırırken önemlidir. Kuru ürünün kilogram fiyatıyla doğrudan kıyaslama yapmayın: kurutma sonrası ağırlık değişir. Aynı tarih, hal ve birimdeki fiyat aralıklarını karşılaştırın; hal kaydı kesin perakende satış teklifi değildir.',
'Hasat zamanı yetiştirilen türe ve bölgeye göre değişir. Taze sürgün tedariki ile kurutmalık kekik hasadı aynı takvimde ilerlemek zorunda değildir. Tek bir ulusal sezon veya en ucuz ay varsaymak yerine sayfadaki kayıt tarihini ve geçmiş fiyatları kontrol edin.',
'Tarım ve Orman Bakanlığı araştırma enstitülerinin çalışmaları kekikte farklı tür ve yetiştirme alanları bulunduğunu gösterir. Halin bulunduğu şehir üretim yeri anlamına gelmez. Menşe, yetiştirilen tür ve tedarik biçimi teklif üzerinde ayrıca belirtilmelidir.',
'Taze ürün alırken yaprakların durumu, yabancı madde, sap oranı ve ambalaj içindeki nemi kontrol edin. Bir kilogramlık teslimatın ne kadarının kullanacağınız yapraktan oluştuğunu sorun. Ayıklanmış yaprakla saplı demetin fiyatını eşdeğer kabul etmeyin.',
'Taze kekik yemeklere aroma vermek için kullanılır. Tarif kuru kekik istiyorsa taze ürünle aynı ağırlığı otomatik olarak kullanmak doğru bir maliyet karşılaştırması oluşturmaz. Mutfak alımında kullanılacak miktarı ve ayıklama kaybını hesaba katın; bu fiyat sayfası tedavi amaçlı kullanım önermez.'
],
'defne-yapragi-yas-taze':[
'Bu sayfa yaş-taze defne yaprağının kilogram üzerinden bildirilen hal fiyatlarını toplar. Yaş yaprak, kurutulmuş yaprak ve defne yağı farklı ticari ürünlerdir. Satın alma kararında fiyatın hangi ürün biçimine ait olduğunu kontrol edin; tek halden gelen kayıt ülke genelindeki bütün teklifleri temsil etmez.',
'Yaprağın ayıklanmış olması, dal oranı, ambalaj ve taşıma koşulları karşılaştırmada önem taşır. Taze ve kuru yaprak fiyatları kurutma kaybı bilinmeden doğrudan kıyaslanamaz. Hal aralığıyla satıcı teklifini karşılaştırırken tarih, kilogram birimi ve teslimat koşullarını eşleştirin.',
'Yaprağın temin edildiği bölge ve tedarik biçimi satış takvimini etkiler. Her ay düzenli hal kaydı bulunması beklenmeyebilir. Kayıt olmayan günlerde önceki fiyatı bugünün kesin fiyatı saymayın; son gözlem tarihini okuyup güncel teklifi satıcıdan doğrulayın.',
'Defne, Bakanlığın tıbbi ve aromatik bitki çalışmalarında yer alır; Muğla İl Müdürlüğü de yörede defne teminine ilişkin çalışmalar yayımlar. Fiyatın bildirildiği hal menşei kanıtlamaz. Ürünün üretim veya toplama yeri satıcı bilgisiyle ayrıca doğrulanmalıdır.',
'Alımda yaprak bütünlüğünü, yabancı maddeyi, dal oranını ve ambalaj durumunu inceleyin. İşlenecek yaprakla mutfakta kullanılmak üzere ayıklanmış ürünün hazırlanma düzeyi farklı olabilir. Teklifin net yaprak ağırlığına mı yoksa dallı ürüne mi ait olduğunu açıklığa kavuşturun.',
'Mutfak için alımlarda gıda kullanımına sunulan ürün tanımını esas alın. Yağ üretimine yönelik hammadde ile yemeklerde kullanılacak ayıklanmış yaprağı aynı teslimat şartlarıyla değerlendirmeyin. Bu sayfa ticari fiyat karşılaştırması sağlar; tıbbi kullanım veya sağlık etkisi iddiası içermez.'
],
'tatli-patates':[
'Tatlı patates, bilimsel adı Ipomoea batatas olan bitkinin yumrularıyla değerlendirilen bir üründür. Bu sayfadaki kilogram fiyatları tatlı patatese aittir; normal patates fiyatlarıyla aynı ürün gibi birleştirilmez. Çeşit, ürün boyu, menşe ve teslimat koşulları teklif karşılaştırmasında ayrıca okunmalıdır.',
'Kilogram fiyatının yanında boylama, ayıklama, ambalaj ve taşıma koşullarını karşılaştırın. Farklı çeşit veya hazırlama düzeyindeki ürünler aynı kullanıma uygun olmayabilir. Tablodaki tarihli hal aralığı perakende mağaza fiyatı veya satıcıdan alınmış kesin teklif anlamına gelmez.',
'Tedarik takvimi yetiştirme yeri ve depolama koşullarına bağlıdır. Hal kaydının bulunması o gün hasat yapıldığını göstermez; depodan sevk edilen ürün de satışta olabilir. Mevsimsel fiyat değerlendirmesinde tek bir gün yerine tarihli geçmiş seriyi kullanın.',
'Bir halin fiyat açıklaması ürünün o şehirde yetiştiğini kanıtlamaz. Yerli veya ithal menşe, çeşit ve sevk yeri satıcıdan öğrenilmelidir. Bu sayfada doğrulanmış üretim istatistiği bulunmadığından Türkiye için üretim tonajı veya dünya sıralaması verilmez.',
'Satın alırken yumruların boy dağılımını, yüzey hasarını ve teslimatın ayıklama durumunu kontrol edin. Teklifin net ürün ağırlığına ait olduğundan emin olun. İşleme için alınan karışık boy ürünle perakende satışa hazırlanmış seçilmiş ürünü aynı kalite sınıfı saymayın.',
'Mutfak bütçesi oluştururken tarifin istediği tatlı patates miktarını ve hazırlama kaybını dikkate alın. Soyulmuş veya pişirmeye hazırlanmış ürün fiyatı, bütün yumrunun kilogram fiyatıyla aynı değildir. Sayfadaki veriler fiyat karşılaştırması içindir; beslenme tedavisi veya sağlık sonucu vaat etmez.'
],
'istakoz':[
'İstakoz, kabuklu su ürünleri içinde değerlendirilen bir ticari ürün adıdır. Bu sayfa istakoz adıyla bildirilen kilogram cinsinden hal kayıtlarını izler. Kayıt adı tek başına kesin türü, menşei veya ürünün canlı, soğutulmuş ya da dondurulmuş olduğunu göstermez; bunları teklif sırasında doğrulayın.',
'Teklifleri tür, boy, sunum biçimi ve net ağırlık üzerinden karşılaştırın. Bütün kabuklu ürün ile ayıklanmış etin kilogram fiyatı doğrudan eşdeğer değildir. Nakliye ve teslimat koşulları da teklifin parçasıdır; bir hal aralığını bütün satıcıların uyguladığı fiyat gibi yorumlamayın.',
'Satış kaydının tarihi av tarihi değildir. İthal veya depolanmış ürünlerin bulunabilmesi nedeniyle hal kayıtlarından tek başına av sezonu çıkarılamaz. Güncel tedarik durumunu satıcıdan öğrenin; seyrek kayıtlarda son fiyatın kaç gün önce bildirildiğine özellikle bakın.',
'Halin bulunduğu şehir, ürünün avlandığı denizi veya ithal menşeini kanıtlamaz. Ticari tür adı, menşe ve ürünün sunum biçimi tedarikçi belgesiyle doğrulanmalıdır. Doğrulanmış istatistik olmadan Türkiye için üretim miktarı veya dünya sıralaması verilmez.',
'Teslimat öncesinde ürünün tür tanımını, canlı/soğutulmuş/dondurulmuş durumunu, ambalajını ve net ağırlığını kontrol edin. Farklı boy ve hazırlama düzeyleri aynı kalite sınıfı değildir. Fiyat tablosu ürünün fiziksel durumunu veya soğuk zincir koşullarını doğrulamaz.',
'Restoran veya mutfak alımında bütün ürün ağırlığı ile kullanılacak et miktarını ayrı hesaplayın. Kabuk ve hazırlama kaybını bilmeden porsiyon maliyeti çıkarılamaz. Ayıklanmış ürün tekliflerinde de net miktarı ve teslimat biçimini kontrol ederek aynı temelde karşılaştırma yapın.'
],
'tarhun':[
'Tarhun, tıbbi ve aromatik bitki listelerinde yer alan bir bitkidir. Bu sayfa tarhun adıyla bildirilen kilogram fiyatlarını izler. Satıcı teklifinin taze sürgün, ayıklanmış yaprak veya kurutulmuş ürün olup olmadığını kontrol edin; bu biçimlerin kilogram fiyatları doğrudan eşdeğer değildir.',
'Fiyat karşılaştırmasında yaprak-sap oranı, ayıklama, ambalaj ve teslimat koşullarını birlikte değerlendirin. Kurutulmuş ürünle taze ürün arasında varsayımsal bir ağırlık dönüşümü yapmayın. Az sayıda halde görülen kayıtlar bütün ülke için ortalama satış fiyatı olarak yorumlanmamalıdır.',
'Tedarik zamanı yetiştirme yeri ve ürünün taze ya da kurutulmuş sunulmasına göre değişebilir. Sayfada gözlem bulunmayan günler ürünün ülke genelinde bulunmadığını göstermez. Güncel alışveriş için son kayıt tarihini kontrol edin ve satıcıdan tarihli teklif alın.',
'Tarhunun Bakanlık listelerinde aromatik bitki olarak yer alması, belirli bir ilin üretim payını kanıtlamaz. Fiyatın açıklandığı hal de menşei göstermez. Kaynağı doğrulanmadan bölgesel üretim yüzdesi, yıllık tonaj veya dünya sıralaması kullanılmamalıdır.',
'Teklifteki ürün biçimini, yaprak-sap oranını ve net ağırlığı açıklığa kavuşturun. Ayıklanmış yaprak ile saplı ürünün kullanılabilir miktarı farklı olabilir. Teslimatta ambalaj ve ürün durumunu kontrol edin; sadece kilogram fiyatı üzerinden kalite karşılaştırması yapmayın.',
'Mutfak alımında tarifin istediği ürün biçimini esas alın. Taze tarhun ile kurutulmuş tarhunu aynı ağırlık ve maliyetle değerlendirmeyin. Küçük miktarlı kullanımda ambalaj büyüklüğü ve ayıklama kaybı toplam alışveriş bütçesini etkileyebilir; fiyat sayfası sağlık iddiası taşımaz.'
]}
Path('artifacts/niche-seo-2026-09-14/content.json').write_text(json.dumps([dict(product_slug=s,**dict(zip(fields,v))) for s,v in data.items()],ensure_ascii=False,indent=2))
