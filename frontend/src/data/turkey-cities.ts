import { slugifyTr } from "@/lib/tr-slug";

export interface TurkeyCity {
  value: string;
  label: string;
  districts: string[];
}

export const TURKEY_CITIES: TurkeyCity[] = [
  { value: "Adana", label: "Adana", districts: ["Aladağ", "Ceyhan", "Çukurova", "Feke", "İmamoğlu", "Karaisalı", "Karataş", "Kozan", "Pozantı", "Saimbeyli", "Sarıçam", "Seyhan", "Tufanbeyli", "Yumurtalık", "Yüreğir"] },
  { value: "Adıyaman", label: "Adıyaman", districts: ["Besni", "Çelikhan", "Gerger", "Gölbaşı", "Kahta", "Merkez", "Samsat", "Sincik", "Tut"] },
  { value: "Afyonkarahisar", label: "Afyonkarahisar", districts: ["Başmakçı", "Bayat", "Bolvadin", "Çay", "Çobanlar", "Dazkırı", "Dinar", "Emirdağ", "Evciler", "Hocalar", "İhsaniye", "İscehisar", "Kızılören", "Merkez", "Sandıklı", "Sinanpaşa", "Sultandağı", "Şuhut"] },
  { value: "Ağrı", label: "Ağrı", districts: ["Diyadin", "Doğubayazıt", "Eleşkirt", "Hamur", "Merkez", "Patnos", "Taşlıçay", "Tutak"] },
  { value: "Amasya", label: "Amasya", districts: ["Göynücek", "Gümüşhacıköy", "Hamamözü", "Merkez", "Merzifon", "Suluova", "Taşova"] },
  { value: "Ankara", label: "Ankara", districts: ["Akyurt", "Altındağ", "Ayaş", "Bala", "Beypazarı", "Çamlıdere", "Çankaya", "Çubuk", "Elmadağ", "Etimesgut", "Evren", "Gölbaşı", "Güdül", "Haymana", "Kalecik", "Kazan", "Keçiören", "Kızılcahamam", "Mamak", "Nallıhan", "Polatlı", "Pursaklar", "Sincan", "Şereflikoçhisar", "Yenimahalle"] },
  { value: "Antalya", label: "Antalya", districts: ["Akseki", "Aksu", "Alanya", "Demre", "Döşemealtı", "Elmalı", "Finike", "Gazipaşa", "Gündoğmuş", "İbradı", "Kaş", "Kemer", "Kepez", "Konyaaltı", "Korkuteli", "Kumluca", "Manavgat", "Muratpaşa", "Serik"] },
  { value: "Artvin", label: "Artvin", districts: ["Ardanuç", "Arhavi", "Artvin", "Borçka", "Hopa", "Kemalpaşa", "Murgul", "Şavşat", "Yusufeli"] },
  { value: "Aydın", label: "Aydın", districts: ["Bozdoğan", "Buharkent", "Çine", "Didim", "Efeler", "Germencik", "İncirliova", "Karacasu", "Karpuzlu", "Koçarlı", "Köşk", "Kuşadası", "Kuyucak", "Nazilli", "Söke", "Sultanhisar", "Yenipazar"] },
  { value: "Balıkesir", label: "Balıkesir", districts: ["Altıeylül", "Ayvalık", "Balya", "Bandırma", "Bigadiç", "Burhaniye", "Dursunbey", "Edremit", "Erdek", "Gömeç", "Gönen", "Havran", "İvrindi", "Karesi", "Kepsut", "Manyas", "Marmara", "Savaştepe", "Sındırgı", "Susurluk"] },
  { value: "Bilecik", label: "Bilecik", districts: ["Bozüyük", "Gölpazarı", "İnhisar", "Merkez", "Osmaneli", "Pazaryeri", "Söğüt", "Yenipazar"] },
  { value: "Bingöl", label: "Bingöl", districts: ["Adaklı", "Genç", "Karlıova", "Kiğı", "Merkez", "Solhan", "Yayladere", "Yedisu"] },
  { value: "Bitlis", label: "Bitlis", districts: ["Adilcevaz", "Ahlat", "Güroymak", "Hizan", "Merkez", "Mutki", "Tatvan"] },
  { value: "Bolu", label: "Bolu", districts: ["Dörtdivan", "Gerede", "Göynük", "Kıbrıscık", "Mengen", "Merkez", "Mudurnu", "Seben", "Yeniçağa"] },
  { value: "Burdur", label: "Burdur", districts: ["Ağlasun", "Altınyayla", "Bucak", "Çavdır", "Çeltikçi", "Gölhisar", "Karamanlı", "Kemer", "Merkez", "Tefenni", "Yeşilova"] },
  { value: "Bursa", label: "Bursa", districts: ["Büyükorhan", "Gemlik", "Gürsu", "Harmancık", "İnegöl", "İznik", "Karacabey", "Keles", "Kestel", "Mudanya", "Mustafakemalpaşa", "Nilüfer", "Orhaneli", "Orhangazi", "Osmangazi", "Yenişehir", "Yıldırım"] },
  { value: "Çanakkale", label: "Çanakkale", districts: ["Ayvacık", "Bayramiç", "Biga", "Bozcaada", "Çan", "Eceabat", "Ezine", "Gelibolu", "Gökçeada", "Lapseki", "Merkez", "Yenice"] },
  { value: "Çankırı", label: "Çankırı", districts: ["Atkaracalar", "Bayramören", "Çerkeş", "Eldivan", "Ilgaz", "Kızılırmak", "Korgun", "Kurşunlu", "Merkez", "Orta", "Şabanözü", "Yapraklı"] },
  { value: "Çorum", label: "Çorum", districts: ["Alaca", "Bayat", "Boğazkale", "Dodurga", "İskilip", "Kargı", "Laçin", "Mecitözü", "Merkez", "Oğuzlar", "Ortaköy", "Osmancık", "Sungurlu", "Uğurludağ"] },
  { value: "Denizli", label: "Denizli", districts: ["Acıpayam", "Babadağ", "Baklan", "Bekilli", "Beyağaç", "Bozkurt", "Buldan", "Çal", "Çameli", "Çardak", "Çivril", "Güney", "Honaz", "Kale", "Merkezefendi", "Pamukkale", "Sarayköy", "Serinhisar", "Tavas"] },
  { value: "Diyarbakır", label: "Diyarbakır", districts: ["Bağlar", "Bismil", "Çermik", "Çınar", "Çüngüş", "Dicle", "Eğil", "Ergani", "Hani", "Hazro", "Kayapınar", "Kocaköy", "Kulp", "Lice", "Silvan", "Sur", "Yenişehir"] },
  { value: "Edirne", label: "Edirne", districts: ["Enez", "Havsa", "İpsala", "Keşan", "Lalapaşa", "Merkez", "Meriç", "Süloğlu", "Uzunköprü"] },
  { value: "Elazığ", label: "Elazığ", districts: ["Ağın", "Alacakaya", "Arıcak", "Baskil", "Karakoçan", "Keban", "Kovancılar", "Maden", "Merkez", "Palu", "Sivrice"] },
  { value: "Erzincan", label: "Erzincan", districts: ["Çayırlı", "İliç", "Kemah", "Kemaliye", "Merkez", "Otlukbeli", "Refahiye", "Tercan", "Üzümlü"] },
  { value: "Erzurum", label: "Erzurum", districts: ["Aşkale", "Aziziye", "Çat", "Hınıs", "Horasan", "İspir", "Karaçoban", "Karayazı", "Köprüköy", "Narman", "Oltu", "Olur", "Palandöken", "Pasinler", "Pazaryolu", "Şenkaya", "Tekman", "Tortum", "Uzundere", "Yakutiye"] },
  { value: "Eskişehir", label: "Eskişehir", districts: ["Alpu", "Beylikova", "Çifteler", "Günyüzü", "Han", "İnönü", "Mahmudiye", "Mihalgazi", "Mihalıççık", "Odunpazarı", "Sarıcakaya", "Seyitgazi", "Sivrihisar", "Tepebaşı"] },
  { value: "Gaziantep", label: "Gaziantep", districts: ["Araban", "İslahiye", "Karkamış", "Nizip", "Nurdağı", "Oğuzeli", "Şahinbey", "Şehitkamil", "Yavuzeli"] },
  { value: "Giresun", label: "Giresun", districts: ["Alucra", "Bulancak", "Çamoluk", "Çanakçı", "Dereli", "Doğankent", "Espiye", "Eynesil", "Görele", "Güce", "Keşap", "Merkez", "Piraziz", "Şebinkarahisar", "Tirebolu", "Yağlıdere"] },
  { value: "Gümüşhane", label: "Gümüşhane", districts: ["Kelkit", "Köse", "Kürtün", "Merkez", "Şiran", "Torul"] },
  { value: "Hakkari", label: "Hakkari", districts: ["Çukurca", "Derecik", "Merkez", "Şemdinli", "Yüksekova"] },
  { value: "Hatay", label: "Hatay", districts: ["Altınözü", "Antakya", "Arsuz", "Belen", "Dörtyol", "Erzin", "Hassa", "İskenderun", "Kırıkhan", "Kumlu", "Payas", "Reyhanlı", "Samandağ", "Yayladağı"] },
  { value: "Isparta", label: "Isparta", districts: ["Aksu", "Atabey", "Eğirdir", "Gelendost", "Gönen", "Keçiborlu", "Merkez", "Senirkent", "Sütçüler", "Şarkikaraağaç", "Uluborlu", "Yalvaç", "Yenişarbademli"] },
  { value: "Mersin", label: "Mersin", districts: ["Akdeniz", "Anamur", "Aydıncık", "Bozyazı", "Çamlıyayla", "Erdemli", "Gülnar", "Mezitli", "Mut", "Silifke", "Tarsus", "Toroslar", "Yenişehir"] },
  { value: "İstanbul", label: "İstanbul", districts: ["Adalar", "Arnavutköy", "Ataşehir", "Avcılar", "Bağcılar", "Bahçelievler", "Bakırköy", "Başakşehir", "Bayrampaşa", "Beşiktaş", "Beykoz", "Beylikdüzü", "Beyoğlu", "Büyükçekmece", "Çatalca", "Çekmeköy", "Esenler", "Esenyurt", "Eyüpsultan", "Fatih", "Gaziosmanpaşa", "Güngören", "Kadıköy", "Kağıthane", "Kartal", "Küçükçekmece", "Maltepe", "Pendik", "Sancaktepe", "Sarıyer", "Silivri", "Sultanbeyli", "Sultangazi", "Şile", "Şişli", "Tuzla", "Ümraniye", "Üsküdar", "Zeytinburnu"] },
  { value: "İzmir", label: "İzmir", districts: ["Aliağa", "Balçova", "Bayındır", "Bayraklı", "Bergama", "Beydağ", "Bornova", "Buca", "Çeşme", "Çiğli", "Dikili", "Foça", "Gaziemir", "Güzelbahçe", "Karabağlar", "Karaburun", "Karşıyaka", "Kemalpaşa", "Kınık", "Kiraz", "Konak", "Menderes", "Menemen", "Narlıdere", "Ödemiş", "Seferihisar", "Selçuk", "Tire", "Torbalı", "Urla"] },
  { value: "Kars", label: "Kars", districts: ["Akyaka", "Arpaçay", "Digor", "Kağızman", "Merkez", "Sarıkamış", "Selim", "Susuz"] },
  { value: "Kastamonu", label: "Kastamonu", districts: ["Abana", "Ağlı", "Araç", "Azdavay", "Bozkurt", "Çatalzeytin", "Cide", "Daday", "Devrekani", "Doğanyurt", "Hanönü", "İhsangazi", "İnebolu", "Küre", "Merkez", "Pınarbaşı", "Seydiler", "Şenpazar", "Taşköprü", "Tosya"] },
  { value: "Kayseri", label: "Kayseri", districts: ["Akkışla", "Bünyan", "Develi", "Felahiye", "Hacılar", "İncesu", "Kocasinan", "Melikgazi", "Özvatan", "Pınarbaşı", "Sarıoğlan", "Sarız", "Talas", "Tomarza", "Yahyalı", "Yeşilhisar"] },
  { value: "Kırklareli", label: "Kırklareli", districts: ["Babaeski", "Demirköy", "Kofçaz", "Lüleburgaz", "Merkez", "Pehlivanköy", "Pınarhisar", "Vize"] },
  { value: "Kırşehir", label: "Kırşehir", districts: ["Akçakent", "Akpınar", "Boztepe", "Çiçekdağı", "Kaman", "Merkez", "Mucur"] },
  { value: "Kocaeli", label: "Kocaeli", districts: ["Başiskele", "Çayırova", "Darıca", "Derince", "Dilovası", "Gebze", "Gölcük", "İzmit", "Kandıra", "Karamürsel", "Kartepe", "Körfez"] },
  { value: "Konya", label: "Konya", districts: ["Ahırlı", "Akören", "Akşehir", "Altınekin", "Beyşehir", "Bozkır", "Cihanbeyli", "Çeltik", "Çumra", "Derbent", "Derebucak", "Doğanhisar", "Emirgazi", "Ereğli", "Güneysınır", "Hadim", "Halkapınar", "Hüyük", "Ilgın", "Kadınhanı", "Karapınar", "Karatay", "Kulu", "Meram", "Sarayönü", "Selçuklu", "Seydişehir", "Taşkent", "Tuzlukçu", "Yalıhüyük", "Yunak"] },
  { value: "Kütahya", label: "Kütahya", districts: ["Altıntaş", "Aslanapa", "Çavdarhisar", "Domaniç", "Dumlupınar", "Emet", "Gediz", "Hisarcık", "Merkez", "Pazarlar", "Simav", "Şaphane", "Tavşanlı"] },
  { value: "Malatya", label: "Malatya", districts: ["Akçadağ", "Arapgir", "Arguvan", "Battalgazi", "Darende", "Doğanşehir", "Doğanyol", "Hekimhan", "Kale", "Kuluncak", "Pütürge", "Yazıhan", "Yeşilyurt"] },
  { value: "Manisa", label: "Manisa", districts: ["Ahmetli", "Akhisar", "Alaşehir", "Demirci", "Gölmarmara", "Gördes", "Kırkağaç", "Köprübaşı", "Kula", "Merkez", "Salihli", "Sarıgöl", "Saruhanlı", "Selendi", "Soma", "Şehzadeler", "Turgutlu", "Yunusemre"] },
  { value: "Kahramanmaraş", label: "Kahramanmaraş", districts: ["Afşin", "Andırın", "Çağlayancerit", "Dulkadiroğlu", "Ekinözü", "Elbistan", "Göksun", "Merkez", "Nurhak", "Onikişubat", "Pazarcık", "Türkoğlu"] },
  { value: "Mardin", label: "Mardin", districts: ["Artuklu", "Dargeçit", "Derik", "Kızıltepe", "Mazıdağı", "Midyat", "Nusaybin", "Ömerli", "Savur", "Yeşilli"] },
  { value: "Muğla", label: "Muğla", districts: ["Bodrum", "Dalaman", "Datça", "Fethiye", "Kavaklıdere", "Köyceğiz", "Marmaris", "Menteşe", "Milas", "Ortaca", "Seydikemer", "Ula", "Yatağan"] },
  { value: "Muş", label: "Muş", districts: ["Bulanık", "Hasköy", "Korkut", "Malazgirt", "Merkez", "Varto"] },
  { value: "Nevşehir", label: "Nevşehir", districts: ["Acıgöl", "Avanos", "Derinkuyu", "Gülşehir", "Hacıbektaş", "Kozaklı", "Merkez", "Ürgüp"] },
  { value: "Niğde", label: "Niğde", districts: ["Altunhisar", "Bor", "Çamardı", "Çiftlik", "Merkez", "Ulukışla"] },
  { value: "Ordu", label: "Ordu", districts: ["Akkuş", "Altınordu", "Aybastı", "Çamaş", "Çatalpınar", "Çaybaşı", "Fatsa", "Gölköy", "Gülyalı", "Gürgentepe", "İkizce", "Kabadüz", "Kabataş", "Korgan", "Kumru", "Mesudiye", "Perşembe", "Ulubey", "Ünye"] },
  { value: "Rize", label: "Rize", districts: ["Ardeşen", "Çamlıhemşin", "Çayeli", "Derepazarı", "Fındıklı", "Güneysu", "Hemşin", "İkizdere", "İyidere", "Kalkandere", "Merkez", "Pazar"] },
  { value: "Sakarya", label: "Sakarya", districts: ["Adapazarı", "Akyazı", "Arifiye", "Erenler", "Ferizli", "Geyve", "Hendek", "Karapürçek", "Karasu", "Kaynarca", "Kocaali", "Mithatpaşa", "Pamukova", "Sapanca", "Serdivan", "Söğütlü", "Taraklı"] },
  { value: "Samsun", label: "Samsun", districts: ["19 Mayıs", "Alaçam", "Asarcık", "Atakum", "Ayvacık", "Bafra", "Canik", "Çarşamba", "Havza", "İlkadım", "Kavak", "Ladik", "Salıpazarı", "Tekkeköy", "Terme", "Vezirköprü", "Yakakent"] },
  { value: "Siirt", label: "Siirt", districts: ["Baykan", "Eruh", "Kurtalan", "Merkez", "Pervari", "Şirvan", "Tillo"] },
  { value: "Sinop", label: "Sinop", districts: ["Ayancık", "Boyabat", "Dikmen", "Durağan", "Erfelek", "Gerze", "Merkez", "Saraydüzü", "Türkeli"] },
  { value: "Sivas", label: "Sivas", districts: ["Akıncılar", "Altınyayla", "Divriği", "Doğanşar", "Gemerek", "Gölova", "Hafik", "İmranlı", "Kangal", "Koyulhisar", "Merkez", "Suşehri", "Şarkışla", "Ulaş", "Yıldızeli", "Zara"] },
  { value: "Tekirdağ", label: "Tekirdağ", districts: ["Çerkezköy", "Çorlu", "Ergene", "Hayrabolu", "Kapaklı", "Malkara", "Marmaraereğlisi", "Muratlı", "Saray", "Süleymanpaşa", "Şarköy"] },
  { value: "Tokat", label: "Tokat", districts: ["Almus", "Artova", "Başçiftlik", "Erbaa", "Merkez", "Niksar", "Pazar", "Reşadiye", "Sulusaray", "Turhal", "Yeşilyurt", "Zile"] },
  { value: "Trabzon", label: "Trabzon", districts: ["Akçaabat", "Araklı", "Arsin", "Beşikdüzü", "Çarşıbaşı", "Çaykara", "Dernekpazarı", "Düzköy", "Hayrat", "Köprübaşı", "Maçka", "Of", "Ortahisar", "Sürmene", "Şalpazarı", "Tonya", "Vakfıkebir", "Yomra"] },
  { value: "Tunceli", label: "Tunceli", districts: ["Çemişgezek", "Hozat", "Mazgirt", "Merkez", "Nazımiye", "Ovacık", "Pertek", "Pülümür"] },
  { value: "Şanlıurfa", label: "Şanlıurfa", districts: ["Akçakale", "Birecik", "Bozova", "Ceylanpınar", "Eyyübiye", "Halfeti", "Haliliye", "Harran", "Hilvan", "Karaköprü", "Siverek", "Suruç", "Viranşehir"] },
  { value: "Uşak", label: "Uşak", districts: ["Banaz", "Eşme", "Karahallı", "Merkez", "Sivaslı", "Ulubey"] },
  { value: "Van", label: "Van", districts: ["Bahçesaray", "Başkale", "Çaldıran", "Çatak", "Edremit", "Erciş", "Gevaş", "Gürpınar", "İpekyolu", "Muradiye", "Özalp", "Saray", "Tuşba"] },
  { value: "Yozgat", label: "Yozgat", districts: ["Akdağmadeni", "Aydıncık", "Boğazlıyan", "Çandır", "Çayıralan", "Çekerek", "Kadışehri", "Merkez", "Saraykent", "Sarıkaya", "Şefaatli", "Sorgun", "Yenifakılı", "Yerköy"] },
  { value: "Zonguldak", label: "Zonguldak", districts: ["Alaplı", "Çaycuma", "Devrek", "Ereğli", "Gökçebey", "Kilimli", "Kozlu", "Merkez"] },
  { value: "Aksaray", label: "Aksaray", districts: ["Ağaçören", "Eskil", "Gülağaç", "Güzelyurt", "Merkez", "Ortaköy", "Sarıyahşi", "Sultanhanı"] },
  { value: "Bayburt", label: "Bayburt", districts: ["Aydıntepe", "Demirözü", "Merkez"] },
  { value: "Karaman", label: "Karaman", districts: ["Ayrancı", "Başyayla", "Ermenek", "Kazımkarabekir", "Merkez", "Sarıveliler"] },
  { value: "Kırıkkale", label: "Kırıkkale", districts: ["Bahşili", "Balışeyh", "Çelebi", "Delice", "Karakeçili", "Keskin", "Merkez", "Sulakyurt", "Yahşihan"] },
  { value: "Batman", label: "Batman", districts: ["Beşiri", "Gercüş", "Hasankeyf", "Kozluk", "Merkez", "Sason"] },
  { value: "Şırnak", label: "Şırnak", districts: ["Beytüşşebap", "Cizre", "Güçlükonak", "İdil", "Merkez", "Silopi", "Uludere"] },
  { value: "Bartın", label: "Bartın", districts: ["Amasra", "Kurucaşile", "Merkez", "Ulus"] },
  { value: "Ardahan", label: "Ardahan", districts: ["Çıldır", "Damal", "Göle", "Hanak", "Merkez", "Posof"] },
  { value: "Iğdır", label: "Iğdır", districts: ["Aralık", "Karakoyunlu", "Merkez", "Tuzluca"] },
  { value: "Yalova", label: "Yalova", districts: ["Altınova", "Armutlu", "Çınarcık", "Çiftlikköy", "Merkez", "Termal"] },
  { value: "Karabük", label: "Karabük", districts: ["Eflani", "Eskipazar", "Merkez", "Ovacık", "Safranbolu", "Yenice"] },
  { value: "Kilis", label: "Kilis", districts: ["Elbeyli", "Merkez", "Musabeyli", "Polateli"] },
  { value: "Osmaniye", label: "Osmaniye", districts: ["Bahçe", "Düziçi", "Hasanbeyli", "Kadirli", "Merkez", "Sumbas", "Toprakkale"] },
  { value: "Düzce", label: "Düzce", districts: ["Akçakoca", "Cumayeri", "Çilimli", "Gölyaka", "Gümüşova", "Kaynaşlı", "Merkez", "Yığılca"] },
];

export const TURKEY_CITY_OPTIONS = TURKEY_CITIES.map((city) => ({
  value: slugifyTr(city.label),
  label: city.label,
}));

export function provinceBySlug(slug?: string | null): TurkeyCity | null {
  if (!slug) return null;
  return TURKEY_CITIES.find((city) => slugifyTr(city.label) === slug) ?? null;
}

export function districtsOfProvinceSlug(slug?: string | null): Array<{ value: string; label: string }> {
  const city = provinceBySlug(slug);
  if (!city) return [];
  return city.districts.map((district) => ({ value: slugifyTr(district), label: district }));
}

export function findProvinceByDistrictSlug(districtSlug?: string | null): TurkeyCity | null {
  if (!districtSlug) return null;
  return TURKEY_CITIES.find((city) => city.districts.some((district) => slugifyTr(district) === districtSlug)) ?? null;
}
