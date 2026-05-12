interface ProductContent {
  about: string;
  priceFactors: string;
  season: string;
}

const PRODUCT_CONTENT: Record<string, ProductContent> = {
  domates: {
    about: "Domates, Türkiye'nin en fazla tüketilen ve en çok yetiştirilen sebzelerinden biridir. Dünya domates üretiminde ilk 5 ülke arasında yer alan Türkiye, yılda yaklaşık 12-13 milyon ton üretim gerçekleştirir. Başta Antalya, Bursa, İzmir ve Çanakkale olmak üzere pek çok ilde yoğun olarak yetiştirilir.",
    priceFactors: "Domates fiyatlarını etkileyen başlıca faktörler; hava koşulları (özellikle don riski ve aşırı sıcaklar), sera ya da açık alan üretim dengesi, nakliye maliyetleri ve mevsimsel arz değişimleridir. Yaz ortasında açık alan ürünlerinin hasat zamanında fiyatlar genellikle düşer; kış aylarında sera domatesi daha yüksek fiyatla işlem görür.",
    season: "Açık alan: Haziran–Eylül. Sera (Antalya-Mersin): Ekim–Mayıs. Kış aylarında çoğunlukla sera ürünü bulunur.",
  },
  patates: {
    about: "Patates, Türkiye'de hem gıda hem endüstriyel amaçla üretilen temel tarım ürünlerindendir. Afyonkarahisar, Nevşehir ve Niğde en büyük üretici illeridir. Türkiye yılda yaklaşık 5 milyon ton patates üretir; bu değerin önemli kısmı iç tüketimde kullanılır.",
    priceFactors: "Patates fiyatları stok miktarına, soğuk hava deposu kapasitesine ve ithalat-ihracat dengelerine duyarlıdır. Hasat sezonunda (Temmuz-Eylül) bollaşan arz fiyatları aşağı çekerken, ilkbahar aylarında stok azalması fiyatları yükseltir.",
    season: "Taze hasat: Haziran–Eylül. Depo ürünü: Ekim–Mayıs. Yıl boyu satışta bulunur.",
  },
  "sogan-kuru": {
    about: "Kuru soğan, Türk mutfağının vazgeçilmez temel malzemelerinden biridir. Türkiye, dünyanın önde gelen soğan üreticileri arasındadır; başlıca üretim merkezleri Afyonkarahisar, Konya, Kırşehir ve İzmir'dir. Uzun depolama ömrü sayesinde yıl boyu piyasada bulunur.",
    priceFactors: "Soğan fiyatları büyük ölçüde hasat dönemindeki verim, depolama kapasitesi ve ihracat talebine bağlıdır. Kuraklık yıllarında verim düşüşü fiyat artışına yol açarken, bol yağışlı yıllarda hasat kalitesi ve miktarı fiyatları etkiler.",
    season: "Taze hasat: Haziran–Ağustos. Depo ürünü: Yıl boyu.",
  },
  biber: {
    about: "Biber, Türkiye'nin hem çiğ tüketim hem işlenmiş ürün (salça, baharat) pazarında önemli bir yere sahiptir. Dolma biberi, sivri biber, çarliston ve acı biber başlıca ticari çeşitlerdir. Antalya, Bursa ve Kahramanmaraş önemli üretim merkezleridir.",
    priceFactors: "Biber fiyatları mevsimsel arz, ihracat talebi (özellikle Avrupa pazarı) ve enerji maliyetleri (sera ısıtması) tarafından şekillendirilir. Yaz döneminde açık alan biberleri piyasaya girerken fiyatlar yumuşar; kışın sera ürünü baskın olur.",
    season: "Açık alan: Temmuz–Ekim. Sera: Yıl boyu (özellikle Antalya).",
  },
  "biber-dolma": {
    about: "Dolma biberi, dolmalık olarak kullanılan kalın etli biber çeşididir. Türkiye'de hem sofralık hem endüstriyel (konserve) amaçla yetiştirilir. Antalya sera tarımı sayesinde kış mevsiminde de bol miktarda üretilir.",
    priceFactors: "Dolma biber fiyatları sera enerji maliyetleri ve ihracat talebine duyarlıdır. Et kalınlığı ve renk homojenliği toptancı fiyatını doğrudan etkiler.",
    season: "Açık alan: Temmuz–Ekim. Sera: Yıl boyu (Antalya).",
  },
  "biber-sivri": {
    about: "Sivri biber, Türk mutfağında yaygın kullanılan uzun, ince etli biber çeşididir. Tüketiminin büyük bölümü taze ve çiğ olarak gerçekleşir; kavurma ve pişirme amaçlı da tercih edilir.",
    priceFactors: "Fiyatları hasat dönemine ve iklim koşullarına bağlıdır. Yaz aylarında bol arz fiyatları baskılar; kış döneminde sera kaynaklı ürün görece pahalıdır.",
    season: "Açık alan: Mayıs–Ekim. Sera: Ekim–Nisan.",
  },
  salatalik: {
    about: "Salatalık, Türkiye'de en yüksek üretim hacmine sahip sera sebzelerinden biridir. Ülkemiz, Antalya başta olmak üzere sera salatalığı üretiminde Avrupa'nın önde gelen ihracatçılarındandır. Yılda yaklaşık 1,7 milyon ton üretilir.",
    priceFactors: "Salatalık fiyatları sera enerji maliyetleri, ihracat talebi ve mevsimsel arz yoğunluğuna bağlıdır. Kış ihracat sezonunda (Kasım–Şubat) Avrupa talebi fiyatları destekler; yaz döneminde açık alan ürünleri piyasayı yumuşatır.",
    season: "Açık alan: Mayıs–Eylül. Sera: Yıl boyu (Antalya baskın).",
  },
  havuc: {
    about: "Havuç, Türkiye'de hem taze tüketim hem de meyve suyu ve konserve sanayisi için yetiştirilir. Konya, Afyonkarahisar ve Polatlı (Ankara) önemli üretim merkezleridir. Soğuk hava depolarında uzun süre saklanabilmesi sayesinde yıl boyu piyasada bulunur.",
    priceFactors: "Havuç fiyatları hasat döneminde düşer; ilkbahar ve yaz başında stok azalmasıyla yükselir. Boyut standartları (süpermarket zinciri talepleri) ile serbest hal fiyatı arasında fark oluşabilir.",
    season: "Taze hasat: Ekim–Ocak. Depo ürünü: Şubat–Eylül.",
  },
  patlican: {
    about: "Patlıcan, Türkiye'nin geleneksel mutfağının temel sebzelerinden biridir. Antalya, İzmir, Bursa ve Hatay en büyük üretici illerdir. Türkiye patlıcan üretiminde dünyada ilk 5 ülke arasında yer alır ve önemli miktarda ihracat gerçekleştirir.",
    priceFactors: "Patlıcan fiyatları üretim bölgesine yakınlık, nakliye süresi ve hasat dönemine göre değişir. Yaz ortasında bollaşan arz fiyatları düşürür; erken ilkbahar ve sonbahar dönemlerinde fiyatlar görece yüksektir.",
    season: "Açık alan: Mayıs–Ekim. Sera (Antalya): Yıl boyu.",
  },
  karpuz: {
    about: "Karpuz, yazın en çok tüketilen meyveler arasındadır. Türkiye, dünya karpuz üretiminde ilk 5'te yer alır; yılda yaklaşık 3 milyon ton üretir. Adana, Urfa, Diyarbakır ve Afyonkarahisar en büyük üretici illerdir.",
    priceFactors: "Karpuz fiyatları yaz döneminde arz artışıyla hızla düşer; sezon öncesi ve sonrasında yükselir. Büyüklük, olgunluk ve nakliye mesafesi de fiyatı etkiler. Yaz kuraklıkları erken hasada yol açarak fiyatları destekleyebilir.",
    season: "Yerel hasat: Haziran–Eylül. En bol dönem: Temmuz–Ağustos.",
  },
  elma: {
    about: "Elma, Türkiye'nin en önemli meyve ihracat kalemlerinden biridir. Ülkemiz dünya elma üretiminde ilk 5'te yer alır; yılda yaklaşık 3,5 milyon ton üretilir. Isparta, Karaman ve Afyonkarahisar başlıca üretim merkezleridir. Golden, Starking ve Granny Smith en yaygın çeşitlerdir.",
    priceFactors: "Elma fiyatları hasat dönemine, çeşide, kaliteye ve soğuk hava deposu kullanımına bağlıdır. İhracat talebi (Rusya, Irak, Körfez) piyasa fiyatını doğrudan etkiler. Geç don hasarları hasat öncesinde fiyatları artırır.",
    season: "Hasat: Ağustos–Ekim. Depo ürünü: Yıl boyu.",
  },
  portakal: {
    about: "Portakal, Türkiye'nin Akdeniz ve Ege bölgesinde yoğun olarak yetiştirilir. Adana, Mersin, Antalya ve Hatay başlıca üretim illeridir. Türkiye yılda yaklaşık 2 milyon ton portakal üretir; önemli bir kısmı ihracat edilir.",
    priceFactors: "Portakal fiyatları çeşide (Navel, Valencia, sıkmalık), hasat dönemine ve ihracat talebine göre değişir. Kış aylarında tüketim artışı fiyatları destekler; bol yıllarda taze meyve fiyatları baskı altında kalabilir.",
    season: "Ana sezon: Kasım–Nisan. Washington Navel: Kasım–Ocak. Valencia: Mart–Mayıs.",
  },
  mandalina: {
    about: "Mandalina, kış mevsiminin en çok tüketilen narenciye meyvelerinden biridir. Türkiye'nin Akdeniz ve Ege kıyılarında geniş bahçelerde yetiştirilir; Adana, Mersin ve Hatay başlıca üretim alanlarıdır. Clementine, Satsuma ve Fremont başlıca ticari çeşitlerdir.",
    priceFactors: "Mandalina fiyatları sezon dışında belirgin biçimde yükselir. Hasat yoğunlaştığında (Kasım–Ocak) arz artışı fiyatları aşağı çeker. Kalite (sıkı kabuk, az çekirdek) toptancı fiyatını etkiler.",
    season: "Satsuma: Ekim–Aralık. Clementine/Fremont: Kasım–Şubat.",
  },
  limon: {
    about: "Limon, Türkiye'nin en önemli narenciye ihracat kalemlerinden biridir. Mersin, Adana ve Antalya limon üretiminde öne çıkar; ülkemiz dünya limon ihracatında ilk 5 ülke arasındadır. Yılda yaklaşık 1,5 milyon ton üretilir.",
    priceFactors: "Limon fiyatları ihracat talebine son derece duyarlıdır; Rusya, Körfez ve Avrupa pazarlarındaki değişimler iç fiyatları doğrudan etkiler. Hasat döneminde (Kasım–Mart) arz yoğunlaşırken yaz döneminde ürün azalır ve fiyat yükselir.",
    season: "Ana hasat: Kasım–Mart. Yazlık çeşitler: Haziran–Ağustos.",
  },
  uzum: {
    about: "Üzüm, Türkiye'nin taze tüketim, kuru üzüm ve şarap üretiminde kritik bir tarım ürünüdür. Manisa, İzmir ve Denizli Ege bağlarıyla ünlüdür; Doğu ve Güneydoğu Anadolu'da da önemli üretim merkezleri vardır. Türkiye dünya üzüm üretiminde sürekli ilk 5'te yer alır.",
    priceFactors: "Taze üzüm fiyatları çeşide, hasat zamanına ve iklim koşullarına bağlıdır. Dolu ve kuraklık zararları hasat öncesinde fiyatları ciddi biçimde etkiler. İhracat talebi ve kuru üzüm fiyatları da taze üzüm piyasasını yönlendirir.",
    season: "Çeşide göre: Temmuz–Ekim.",
  },
  cilek: {
    about: "Çilek, Türkiye'nin hem taze tüketim hem dondurulmuş ürün ihracatında önemli bir yere sahiptir. Amasya, Balıkesir, Bursa ve Mersin öne çıkan üretim merkezleridir. Türkiye dünyanın en büyük çilek üreticileri arasındadır.",
    priceFactors: "Çilek fiyatları kısa hasat penceresine sahip olması nedeniyle mevsimsel dalgalanmalara aşırı duyarlıdır. İlkbahar döneminde hızlı arz artışı fiyatları hızla düşürür; sezon dışında dondurulmuş ürün piyasayı karşılar.",
    season: "Açık alan: Nisan–Haziran. Sera (Mersin): Kasım–Nisan.",
  },
  muz: {
    about: "Muz, Türkiye'de Anamur (Mersin) ve Alanya (Antalya) başta olmak üzere sınırlı tropik iklim koşullarına sahip bölgelerde yetiştirilir. Yerli üretim toplam tüketimin yalnızca bir bölümünü karşılar; geri kalan kısım başta Ekvador ve Kolombiya'dan ithal edilir.",
    priceFactors: "Yerli muz fiyatları ithal muza oranla yaklaşık 2-3 kat daha yüksektir ve üretim alanının darlığını yansıtır. İthal muz fiyatları ise dolar kuru, navlun maliyeti ve orijin ülkedeki hasat koşullarından etkilenir.",
    season: "Yerli: Temmuz–Ocak (Anamur). İthal: Yıl boyu.",
  },
  kivi: {
    about: "Kivi, Türkiye'de özellikle Karadeniz bölgesinde (Rize, Trabzon, Artvin) ve Ege'de (İzmir, Manisa) yetiştirilir. Ülkemiz kivi üretimini 2000'li yılların başında hızla artırmış ve şu an Avrupa'nın önemli kivi tedarikçileri arasına girmiştir.",
    priceFactors: "Kivi fiyatları büyüklük ve olgunluk sınıfına göre değişir. Soğuk hava depolarından çıkan ürünlerin bahar aylarında piyasaya sürülmesi fiyatları dengede tutar; yeni sezon hasatı öncesinde (Eylül–Ekim) stoklar azalır.",
    season: "Yerli hasat: Ekim–Aralık. Depo ürünü: Ocak–Mayıs.",
  },
  armut: {
    about: "Armut, Türkiye'nin önemli meyve ihracat kalemlerinden biridir. Ankara, Isparta ve Karadeniz kıyıları başlıca üretim merkezleridir. Deveci, Santa Maria ve Williams en yaygın çeşitlerdir; yerli tüketimin yanı sıra Körfez ve Avrupa'ya ihracat gerçekleştirilir.",
    priceFactors: "Armut fiyatları depolama süresiyle birlikte artar; hasat sezonunda (Ağustos–Ekim) en düşük seviyelerdeyken ilkbahar aylarında stoklara paralel yükselir. İhracat talebi iç piyasa fiyatını destekler.",
    season: "Hasat: Ağustos–Ekim. Depo ürünü: Yıl boyu.",
  },
  "kabak-dolmalik": {
    about: "Dolmalık kabak, Türk mutfağında en çok kullanılan kabak çeşididir; dolma, güveç ve diğer pişirme yöntemlerinde yaygın biçimde tercih edilir. Antalya, İzmir ve Adana önde gelen üretici illerdir.",
    priceFactors: "Kabak fiyatları hasat döneminde (yaz-sonbahar) arz artışıyla düşer; kış aylarında sera ürünü piyasayı yüksek fiyatla karşılar. Boyut ve renk homojenliği toptancı fiyatını belirler.",
    season: "Açık alan: Mayıs–Ekim. Sera: Yıl boyu (Antalya).",
  },
  kavun: {
    about: "Kavun, Türkiye'nin yaz meyve ihracatında önemli bir üründür. Kırklareli, Kırşehir (Kaman kavunu), Diyarbakır ve Urfa gibi iç bölgeler başlıca üretim alanlarıdır. Türkiye dünya kavun ihracatında üst sıralarda yer alır.",
    priceFactors: "Kavun fiyatları yaz mevsiminde bol arz nedeniyle hızla düşer. Boyut, tatlılık (şeker oranı) ve kabuk sağlamlığı toptancı tarafından dikkate alınan kalite göstergeleridir.",
    season: "Hasat: Haziran–Eylül.",
  },
  seftali: {
    about: "Şeftali, özellikle Bursa ve Bilecik'in 'Şeftali Deresi' bölgesi ile İzmir ve Denizli'de yetiştirilir. Çift kabuklu, iri ve aromalı Türk şeftalileri ihracatta rekabetçi konumdadır.",
    priceFactors: "Şeftali son derece kısa depolama ömrüne sahiptir; bu nedenle fiyatlar hasat döneminde (Temmuz–Ağustos) hızla düşer ve sezon sonrası hızla yükselir. Don hasarları tek bir hasat sezonunu büyük ölçüde etkileyebilir.",
    season: "Erken çeşitler: Haziran. Ana sezon: Temmuz–Ağustos.",
  },
  kiraz: {
    about: "Kiraz, Türkiye'nin en değerli meyve ihracat kalemlerinden biridir. İzmir'in Ödemiş ilçesi, Konya'nın Seydişehir'i ve Kastamonu başlıca üretim merkezleridir. Türkiye dünya kiraz üretiminde ikinci sıradadır.",
    priceFactors: "Kiraz fiyatları hasat penceresi çok dar olduğundan son derece volatildir. İhracat kapılarının açılışı, don olayları ve yağmurlu dönemler (çatlama riski) fiyatları belirler. Kalibra büyüklüğü toptancı fiyatında belirleyici faktördür.",
    season: "Hasat: Mayıs–Temmuz (çeşide ve irtifaya göre değişir).",
  },
  sarimsak: {
    about: "Sarımsak, Türkiye'de hem sofralık hem endüstriyel (kurutulmuş, toz, yağ) amaçla üretilir. Kastamonu, Taşköprü sarımsağı coğrafi işaret tesciliyle korunan önemli bir yerel çeşittir. Kastamonu, Ankara ve Konya başlıca üretici illerdir.",
    priceFactors: "Sarımsak fiyatları hasat döneminde (Temmuz) düşer; sonraki aylarda depolama maliyetiyle birlikte artar. İthal sarımsak (Çin) iç piyasa fiyatlarını baskı altında tutabilir.",
    season: "Hasat: Temmuz. Depo ürünü: Yıl boyu.",
  },
  ispanak: {
    about: "Ispanak, kış mevsiminde en bol bulunan yapraklı sebzelerden biridir. Adapazarı, Bursa ve Muğla başlıca üretim bölgeleridir. C ve K vitamini açısından zengin olan ıspanak, hem sofralık hem işlenmiş ürün olarak tüketilir.",
    priceFactors: "Ispanak kısa depolama süresi nedeniyle hasat günü fiyatı etkili olur; üretim bölgesine yakın hallerde daha düşük fiyatla işlem görür. Yaz döneminde arz azalınca fiyat yükselir.",
    season: "Ana sezon: Ekim–Nisan. Yaz döneminde görece pahalı.",
  },
  brokoli: {
    about: "Brokoli, soğuk iklimi seven ve özellikle kış mevsiminde üretilen bir sebzedir. Denizli, Bursa ve İzmir başlıca üretim bölgeleridir. Son yıllarda tüketimi hızla artan brokoli, süpermarket zincirlerinin ön sırasında yer almaktadır.",
    priceFactors: "Brokoli fiyatları sıcak havalarda (kötü kalite, kısa raf ömrü) yükselir; kış üretim döneminde bollaşma fiyatları aşağı çeker. Büyüklük (başın sıkılığı) ve renk toptancı fiyatını belirler.",
    season: "Ana sezon: Kasım–Nisan. Yaz dönemi kısıtlı ve pahalı.",
  },
  karnabahar: {
    about: "Karnabahar, Türkiye'nin özellikle Ege ve Marmara bölgesinde yetişen kış sebzesidir. Bursa ve Denizli önemli üretim merkezleridir. Haşlama, kavurma ve güveçte kullanılan karnabahar, besleyici değeri yüksek bir sebzedir.",
    priceFactors: "Karnabahar fiyatları hasat döneminde (Kasım–Mart) arz artışıyla düşer; üretim dışı aylarda (yaz) belirgin biçimde yükselir.",
    season: "Ana sezon: Kasım–Nisan.",
  },
};

interface ProductEditorialProps {
  slug: string;
  nameTr: string;
  categorySlug?: string;
}

export function getProductEditorial(props: ProductEditorialProps): {
  about: string;
  priceFactors: string;
  season: string;
} {
  const { slug, nameTr, categorySlug } = props;

  // Exact match
  if (PRODUCT_CONTENT[slug]) return PRODUCT_CONTENT[slug]!;

  // Prefix match (e.g. "domates-beef" → "domates")
  const parts = slug.split("-");
  for (let i = parts.length - 1; i >= 1; i--) {
    const prefix = parts.slice(0, i).join("-");
    if (PRODUCT_CONTENT[prefix]) return PRODUCT_CONTENT[prefix]!;
  }

  // Category-based fallback
  const categoryLabel: Record<string, string> = {
    sebze: "sebze",
    meyve: "meyve",
    "sebze-meyve": "tarım ürünü",
    balik: "balık ürünü",
    "balik-deniz": "deniz balığı",
    "balik-donuk": "dondurulmuş balık",
    "balik-tatlisu": "tatlı su balığı",
    ithal: "ithal ürün",
    bakliyat: "bakliyat ürünü",
  };
  const catLabel = categoryLabel[categorySlug ?? ""] ?? "tarım ürünü";

  return {
    about: `${nameTr}, Türkiye genelinde toptancı hallerde işlem gören önemli ${catLabel}lerden biridir. Fiyatlar; üretim bölgesine, hasat dönemine, iklim koşullarına ve arz-talep dengesine göre günlük değişim gösterir.`,
    priceFactors: `${nameTr} fiyatlarını etkileyen başlıca faktörler; hasat dönemi ve verimi, nakliye maliyetleri, ihracat-ithalat dengesi ve tüketici talebidir. Sezon içinde bollaşan arz fiyatları baskılarken, sezon dışında piyasa fiyatı yükselir.`,
    season: "Sezon bilgisi ürüne ve üretim bölgesine göre farklılık gösterir. Güncel fiyat tablosundan mevsimsel eğilimi izleyebilirsiniz.",
  };
}
