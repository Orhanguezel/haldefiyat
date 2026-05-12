interface MarketContent {
  description: string;
  coverage: string;
  specialties: string;
}

const MARKET_CONTENT: Record<string, MarketContent> = {
  "istanbul-hal-ibb": {
    description: "İstanbul Toptancı Hali, İBB'ye bağlı olarak Türkiye'nin en büyük ve en yüksek hacimli sebze-meyve hal kompleksidir. İstanbul'un 15 milyonu aşkın nüfusuna hizmet eden hal, günlük binlerce ton ürünün el değiştirdiği kritik bir dağıtım merkezi konumundadır.",
    coverage: "İstanbul'un tüm ilçeleri ile çevre il ve ilçeler (Kocaeli, Tekirdağ, Edirne, Kırklareli). Anadolu ve Avrupa yakası için ayrı bölümler mevcuttur.",
    specialties: "Türkiye'nin dört bir yanından ve ithal kaynaklı ürünler bir arada işlem görür; özellikle egzotik meyveler ve ithal ürünlerde fiyat belirleyici işlev üstlenir.",
  },
  "ankara-hal": {
    description: "Ankara Toptancı Hali, İç Anadolu'nun en önemli tarımsal dağıtım noktasıdır. Başkentin yaklaşık 5,5 milyon kişilik nüfusu ile çevre illerin büyük bölümünü besleyen hal, günlük yüksek işlem hacmine sahiptir.",
    coverage: "Ankara ilinin tüm ilçeleri; Çankırı, Kırıkkale, Kırşehir ve çevre ilçeler.",
    specialties: "Orta Anadolu üretiminden gelen ürünler (patates, soğan, elma, armut) yoğun olarak işlem görür.",
  },
  "izmir-hal": {
    description: "İzmir Toptancı Hali, Ege bölgesinin en büyük ve en köklü hal müdürlüklerinden biridir. Türkiye'nin önemli ihracat limanlarına yakın konumu sayesinde iç tüketim fiyatlarını uluslararası piyasalarla ilişkilendirir.",
    coverage: "İzmir il merkezi ve ilçeleri; Manisa, Aydın ve Muğla'nın bir bölümü.",
    specialties: "Ege bölgesinin meşhur ürünleri: incir, üzüm, zeytin, kiraz ve sebze çeşitleri öne çıkar.",
  },
  "antalya-hal-merkez": {
    description: "Antalya Toptancı Hali (Merkez), Türkiye'nin en büyük sera üretim bölgesinin kalbinde yer alır. Akdeniz ikliminin sağladığı üstünlükle kış döneminde Avrupa'ya ihraç edilen sebze ve meyvelerin önemli bir bölümü bu hal üzerinden geçer.",
    coverage: "Antalya il merkezi ve çevre ilçeler; Kemer, Serik, Manavgat.",
    specialties: "Domates, salatalık, biber, patlıcan ve çilek — özellikle kış döneminde (Kasım–Nisan) ihracat odaklı fiyat oluşumu.",
  },
  "antalya-hal-serik": {
    description: "Antalya Serik Hali, Serik ilçesinin yoğun örtü altı tarım alanlarına hizmet eden bir hal müdürlüğüdür. Özellikle domates ve biber üretiminde öne çıkan ilçenin fiyat hareketleri bölgesel yansıma yaratır.",
    coverage: "Serik ilçesi ve yakın çevre.",
    specialties: "Örtü altı sebze üretimi; domates, biber ve salatalık ağırlıklı.",
  },
  "antalya-hal-kumluca": {
    description: "Antalya Kumluca Hali, Finike ve Kumluca ovalarının yoğun narenciye ve örtü altı sebze üretimine hizmet eder. Kemer'in güneyi ile Finike arasındaki tarım alanlarının çıkışında konumlanan hal, narenciye piyasasının önemli bir referans noktasıdır.",
    coverage: "Kumluca, Finike ilçeleri ve yakın köyler.",
    specialties: "Narenciye (limon, portakal, mandalina) ve örtü altı sebze.",
  },
  "bursa-hal": {
    description: "Bursa Toptancı Hali, Marmara'nın en büyük tarım illerinden birinin merkezi konumundadır. Şeftali, kiraz ve domates üretiminde Türkiye'de önde gelen Bursa, halini tarihsel bir tarım merkezi olarak konumlandırır.",
    coverage: "Bursa merkez ve ilçeleri; Yalova, Bilecik.",
    specialties: "Şeftali (özellikle Bursa şeftalisi), kiraz, domates ve sofralık sebzeler.",
  },
  "kocaeli-hal-merkez": {
    description: "Kocaeli Merkez Sebze Meyve Hali, Türkiye'nin en yoğun sanayi illerinden birinde tüketici fiyatlarını dengeleyen kritik bir haldir. İstanbul ve Sakarya ile bağlantılı coğrafi konumu, fiyat oluşumunda göçeri bir rol üstlenir.",
    coverage: "Kocaeli merkez ve ilçeleri; Sakarya'nın bir bölümü.",
    specialties: "Genel sebze-meyve çeşit yelpazesi; bölgeye yakın Marmara üretimi.",
  },
  "mersin-hal": {
    description: "Mersin Toptancı Hali, narenciye ihracatının en önemli çıkış noktalarından birinde yer alır. Limon, portakal ve mandalinada dünya pazarlarıyla entegre fiyat oluşumu söz konusudur.",
    coverage: "Mersin merkez ve ilçeleri; Tarsus, Silifke, Mut.",
    specialties: "Narenciye (limon, portakal, mandalina, greyfurt) ile kışlık sebzeler.",
  },
  "adana-hal": {
    description: "Adana Toptancı Hali, Çukurova ovasının verimli tarım alanlarının yanı başında yer alır. Pamuk, buğday ve sebze üretiminde Türkiye'nin ambarlarından biri konumundaki Çukurova'nın fiyat belirleyicisidir.",
    coverage: "Adana merkez ve ilçeleri; Hatay ve Osmaniye'nin bir kısmı.",
    specialties: "Karpuz, kavun, biber, domates; narenciye çeşitleri.",
  },
  "gaziantep-hal": {
    description: "Gaziantep Toptancı Hali, Güneydoğu Anadolu'nun en büyük ticaret merkezinin fiyat referans noktasıdır. Suriye sınırına yakınlığı ve bölgesel nüfus yoğunluğu göz önüne alındığında hal, stratejik bir dağıtım işlevi üstlenir.",
    coverage: "Gaziantep merkez ve ilçeleri; Kilis, Şanlıurfa'nın bir bölümü.",
    specialties: "Fıstık, biber, domates, kavun ve Orta Doğu pazarına yönelik ürünler.",
  },
  "konya-hal": {
    description: "Konya Toptancı Hali, Türkiye'nin en büyük il yüzölçümüne sahip olan Konya'nın tarımsal üretime aracılık eder. Buğday, arpa ve şeker pancarının yanı sıra sebze ve meyve de önemli hacimde işlem görür.",
    coverage: "Konya merkez ve ilçeleri; Karaman.",
    specialties: "Elma, havuç, soğan, patates; yerel üretim ağırlıklı.",
  },
  "balikesir-hal": {
    description: "Balıkesir Toptancı Hali, Marmara ile Ege bölgesi arasında köprü kuran ve zeytin, domates, şeftali gibi ürünlerde zengin üretim potansiyeline sahip ilin fiyat referansıdır.",
    coverage: "Balıkesir merkez ve ilçeleri; Çanakkale'nin güney bölümü.",
    specialties: "Zeytin ve zeytinyağı, domates, şeftali, biber.",
  },
  "kayseri-hal": {
    description: "Kayseri Toptancı Hali, İç Anadolu'nun Kapadokya bölgesini besleyen önemli bir hal müdürlüğüdür. Elma, patates ve kuru meyveler bölgenin öne çıkan ürünleri arasındadır.",
    coverage: "Kayseri merkez ve ilçeleri; Sivas ve Yozgat'ın bir bölümü.",
    specialties: "Elma (yerel çeşitler), patates ve kışlık sebzeler.",
  },
  "eskisehir-hal": {
    description: "Eskişehir Toptancı Hali, Orta Anadolu'nun sanayi ve ticaret kenti Eskişehir'de tüketici fiyatlarını dengeler. İç Anadolu ile Marmara bölgesi arasındaki geçiş noktasında konumlanan hal, geniş bir ürün yelpazesine sahiptir.",
    coverage: "Eskişehir merkez ve ilçeleri; Kütahya ve Bilecik'in bir kısmı.",
    specialties: "Genel sebze-meyve; bölge üretiminden ve dışarıdan gelen karma ürün profili.",
  },
  "denizli-hal": {
    description: "Denizli Toptancı Hali, Ege'nin üretken iç bölgelerinden birine hizmet eder. Meyve bahçeciliği ve örtü altı tarım sayesinde geniş bir ürün yelpazesi sunar.",
    coverage: "Denizli merkez ve ilçeleri; Uşak ve Afyonkarahisar'ın güney kesimleri.",
    specialties: "Üzüm, incir, kiraz, domates ve kışlık sebzeler.",
  },
  "corum-hal": {
    description: "Çorum Toptancı Hali, Orta Karadeniz'in iç kesimleriyle İç Anadolu'ya hizmet eder. Leke (kaplıca) çamuru ile ünlü Çorum, tarımda da tahıl ve sebze üretimiyle öne çıkar.",
    coverage: "Çorum merkez ve ilçeleri; Amasya ve Yozgat'ın bir kısmı.",
    specialties: "Buğday, nohut, domates, soğan ve elma.",
  },
  "kutahya-hal": {
    description: "Kütahya Toptancı Hali, İç Batı Anadolu'nun dağlık coğrafyasında faaliyet gösterir. Sert iklimli bölgede soğuğa dayanıklı kültür bitkileri ön plandadır.",
    coverage: "Kütahya merkez ve ilçeleri; Afyonkarahisar'ın kuzey bölümü.",
    specialties: "Elma, patates, lahana ve kışlık sebzeler.",
  },
  "manisa-hal": {
    description: "Manisa Toptancı Hali, Ege'nin en verimli tarım ovalarından birinde faaliyet gösterir. Özellikle üzüm, zeytin ve narenciye üretiminde söz sahibi olan Manisa, ihracata dönük tarımın merkezlerinden biridir.",
    coverage: "Manisa merkez ve ilçeleri; İzmir'in kuzey kesimleri.",
    specialties: "Üzüm (Sultani, Müşküle çeşitleri), zeytin, mandalina, domates.",
  },
  "kahramanmaras-hal": {
    description: "Kahramanmaraş Toptancı Hali, Akdeniz'den İç Anadolu'ya geçiş noktasında konumlanan stratejik bir hal müdürlüğüdür. Maraş dondurması ve biberi ile ünlü şehrin tarımsal çeşitliliği fiyat profiline yansır.",
    coverage: "Kahramanmaraş merkez ve ilçeleri; Adıyaman ve Gaziantep'in kuzey kesimleri.",
    specialties: "Kırmızı biber (acı ve tatlı), domates, elma ve narenciye.",
  },
  "canakkale-hal": {
    description: "Çanakkale Toptancı Hali, boğaz şehri Çanakkale'nin İstanbul ve Balıkesir arasındaki köprü konumundan faydalanır. Zeytinlikler ve domates bahçeleriyle tanınan bölge, tarım fiyatlarında Marmara ve Ege etkisi bir arada görülür.",
    coverage: "Çanakkale merkez ve ilçeleri.",
    specialties: "Domates, biber, zeytin ve çeşitli sebzeler.",
  },
  "yalova-hal": {
    description: "Yalova Toptancı Hali, İstanbul'a çok yakın konumuyla başkentin sofra ihtiyacını karşılamaya katkıda bulunan küçük ölçekli ama işlek bir hal müdürlüğüdür. Fidan ve çiçek sektöründe de önemli bir yer tutan Yalova'da gıda fiyatları büyük şehir dinamiklerinden etkilenir.",
    coverage: "Yalova merkez ve ilçeleri; Bursa'nın güneybatı kesimi.",
    specialties: "Genel sebze-meyve; şehir yakınlığı nedeniyle taze ürün akışı hızlı.",
  },
  "tekirdag-hal": {
    description: "Tekirdağ Toptancı Hali, Trakya'nın kuzeyinde yer alan ve İstanbul'a yakınlığıyla hem üretim hem tüketim bölgesi işlevi gören bir hal müdürlüğüdür. Bölge, bağ, ayçiçeği ve yazlık sebzeleriyle tanınır.",
    coverage: "Tekirdağ merkez ve ilçeleri; Edirne'nin güneyine kadar.",
    specialties: "Kiraz, şeftali, bağ ürünleri (üzüm), domates ve yazlık sebzeler.",
  },
  "trabzon-hal": {
    description: "Trabzon Toptancı Hali, Doğu Karadeniz'in en büyük kenti ve limanına hizmet eden hal müdürlüğüdür. Fındık, kivi, mısır ve çay ile tanınan bölgede taze sebze-meyve fiyatları karadeniz ikliminin sezonluğunu yansıtır.",
    coverage: "Trabzon merkez ve ilçeleri; Rize'nin batısı, Giresun'un bir kısmı.",
    specialties: "Fındık, kivi, mısır, lahana, fasulye ve Karadeniz'e özgü ürünler.",
  },
  "gazipasa-hal": {
    description: "Gazipaşa Toptancı Hali, Antalya'nın doğu ucunda muz ve kış dönemi örtü altı sebze üretimiyle ünlü ilçenin toptancı pazarıdır. Türkiye'nin muz üretiminin önemli bir bölümü bu bölgeden karşılanır.",
    coverage: "Gazipaşa ilçesi ve Alanya'nın doğu kesimi.",
    specialties: "Muz (yerli), domates, biber ve narenciye.",
  },
  "alanya-hal": {
    description: "Alanya Toptancı Hali, Antalya'nın en kalabalık ilçelerinden birinin tarım-turizm ihtiyacını karşılar. Hem yerli üretim hem de tatil sezonunda artan tüketici talebi fiyat hareketlerini şekillendirir.",
    coverage: "Alanya ilçesi ve Gazipaşa'nın batısı.",
    specialties: "Muz (yerli), narenciye, domates ve yazlık meyveler.",
  },
  "demre-hal": {
    description: "Demre Toptancı Hali, domates üretiminin yoğun olduğu Demre (Kale) ilçesine hizmet eder. Demre domatesi, tüm yıl hasat edilen sera ürünüyle bilinir ve Avrupa pazarlarına ihraç edilir.",
    coverage: "Demre-Kale ilçesi ve yakın kıyı bölgeleri.",
    specialties: "Sera domatesi (ihracat odaklı), salatalık ve biber.",
  },
  "finike-hal": {
    description: "Finike Toptancı Hali, narenciye üretiminde Türkiye'de önemli bir yer tutan Finike ilçesine hizmet eder. 'Finike portakalı' coğrafi işaret tescili almış ürün, dünya pazarlarında tanınan bir markadır.",
    coverage: "Finike ilçesi ve Antalya'nın güneybatı kesimi.",
    specialties: "Portakal (Finike portakalı — Washington Navel), limon ve narenciye çeşitleri.",
  },
  "bolu-hal": {
    description: "Bolu Toptancı Hali, İç Batı Karadeniz'in dağlık ve ormanlık Bolu iline hizmet eder. Bolu Dağı'nın doğal zenginliği çevresindeki tarım; mantarcılık, patates ve yapraklı sebzeler üzerine kuruludur.",
    coverage: "Bolu merkez ve ilçeleri; Düzce ve Zonguldak'ın güney kesimleri.",
    specialties: "Patates, mantar, lahana, fasulye ve kışlık kök sebzeler.",
  },
  "ulusal-hal-gov-tr": {
    description: "Türkiye Ulusal Ortalama, T.C. Tarım ve Orman Bakanlığı'na bağlı Hal Bilgi Sistemi (hal.gov.tr) tarafından yayınlanan ülke geneli toptancı fiyatlarının ağırlıklı ortalamasını temsil eder. Belirli bir şehrin değil, tüm Türkiye toptancı hallerinin sentezlenmiş fiyat bilgisidir.",
    coverage: "Türkiye'nin 81 ili (verilerin mevcut olduğu haller dahil).",
    specialties: "Tüm ürün kategorilerinde ulusal ağırlıklı ortalama; bölgesel fiyat karşılaştırması için temel referans noktası.",
  },
};

export interface MarketEditorialProps {
  slug: string;
  name: string;
  cityName: string;
  regionSlug?: string | null;
}

export function getMarketEditorial(props: MarketEditorialProps): MarketContent {
  const { slug, name, cityName } = props;

  if (MARKET_CONTENT[slug]) return MARKET_CONTENT[slug]!;

  return {
    description: `${name}, ${cityName} iline bağlı resmi toptancı hal müdürlüğüdür. Bölgedeki çiftçi ve üreticilerden gelen günlük ürünler, komisyoncular aracılığıyla işlem görür ve yerel market zincirleri ile esnaf toptanını besler.`,
    coverage: `${cityName} merkez ve ilçeleri.`,
    specialties: `${cityName} bölgesinin mevsimsel sebze ve meyve çeşitleri başta olmak üzere geniş bir ürün yelpazesi işlem görür.`,
  };
}
