-- Zeytinyağı + Sofralık Zeytin editöryel içeriği — 037_borsa_product_editorial.sql VALUES listesine eklenecek.
-- Kolon sırası mevcut dosyayla birebir; @ADMIN_ID + ON DUPLICATE KEY UPDATE bloğu zaten dosyada.
-- (Claude/Orhan içerik — Codex bunu 037'ye paste eder, kendi generic metnini YAZMAZ.)

(
  'zeytinyagi',
  'Zeytinyağı fiyatı, Türkiye''de hem üretici geliri hem de mutfak enflasyonu açısından en yakından izlenen tarım göstergelerinden biridir. HalDeFiyat zeytinyağı sayfası, klasik hal fiyatından farklı olarak ticaret borsalarında (Edremit, Ayvalık, Gemlik gibi zeytin bölgesi borsaları) oluşan serbest piyasa işlemlerini günlük tarih ayrımıyla okur. Natürel sızma, natürel birinci, yemeklik (rafine + natürel harman) ve riviera aynı ürün gibi görünse de asit derecesi, hasat zamanı ve duyusal kaliteye göre fiyatları belirgin biçimde ayrışır. Bu nedenle zeytinyağı kg fiyatı değerlendirilirken tek bir rakama değil; tipe, asit sınıfına, kaynağa ve tarih aralığına bakmak gerekir. Bu sayfadaki öne çıkan fiyat natürel sızma referansıdır.',
  'Zeytinyağı fiyatlarını en çok rekolte döngüsü belirler: zeytin ağacı bir yıl yüksek bir yıl düşük ürün veren "var yılı / yok yılı" (periyodisite) eğilimindedir, bu da arzı ve fiyatı yıllar arası sert dalgalandırır. Bunun yanında hasat zamanı (erken yeşil hasat düşük asit ve yüksek fiyat), asit derecesi ve duyusal kalite, dünya zeytinyağı fiyatları (özellikle İspanya referansı), ihracat talebi ve kotalar, döviz kuru, kuraklık ile zeytin sineği zararı, sıkım ve depolama maliyeti etkilidir. İspanya rekoltesi zayıf geçtiğinde küresel fiyat yükselir ve Türkiye ihracatı ile iç fiyat birlikte artabilir; bol rekolte yıllarında ise iç piyasada baskı görülür.',
  'Zeytin hasadı bölgeye göre Ekim ile Ocak arasında yapılır. Erken hasat (Ekim-Kasım, yeşil olgunlukta) daha düşük asitli, polifenolce zengin ve genelde daha pahalı yağ verir; geç hasat (Aralık-Ocak) randımanı artırır ama duyusal keskinliği azaltır. Yağ fiyatı takibinde yalnızca tarih değil, hasadın erken/geç oluşu ve sezonun var-yok yılı durumu da önemlidir. Yeni sezon yağı genelde Kasım sonrası piyasaya akar.',
  'Ayvalık ve Edremit (Balıkesir), İzmir (özellikle Ege kıyısı), Aydın, Muğla ve Manisa Ege''nin yüksek kaliteli zeytinyağı bölgeleridir; Hatay, Gaziantep, Kilis ve Mersin Güneydoğu-Akdeniz hattında güçlü üretim yapar. Ayvalık ve Edremit yağı düşük asit ve duyusal kaliteyle anılırken, Güneydoğu daha yüksek hacim üretir. Borsa derinliği ve sıkım tesislerine yakınlık bölgesel fiyat farkında rol oynar; bu nedenle aynı gün farklı borsalarda farklı zeytinyağı fiyatı görülmesi normaldir.',
  'Zeytinyağında serbest yağ asitliği (asit derecesi) temel sınıflandırmadır: natürel sızma için genelde %0,8 ve altı, natürel birinci için %2''ye kadar kabul edilir. Bunun yanında peroksit değeri, polifenol (toplam fenol) içeriği, duyusal panel testi (kusursuz meyvemsilik), erken hasat ve soğuk sıkım kaliteyi yükselten unsurlardır. Düşük asitli, erken hasat, soğuk sıkım natürel sızma yağ borsa fiyatında primli işlem görür; yüksek asitli veya bozulmuş ürün ham/yemeklik sınıfına iner.',
  'Salata ve mezede çiğ, kahvaltıda, sebze yemeklerinde ve zeytinyağlılarda kullanılır; yemeklik ve riviera tipleri kızartma ve pişirmeye uygundur. Sıkım yan ürünü pirina ise pirina yağı ve yakıt/yem sanayisinde değerlendirilir.',
  JSON_ARRAY('zeytin', 'aycicegi'),
  'manual',
  @ADMIN_ID,
  NOW(3),
  NOW(3)
),
(
  'zeytin',
  'Sofralık zeytin fiyatı, kahvaltı sofrasının değişmez ürünü olarak gıda enflasyonunda yakından izlenen bir kalemdir. HalDeFiyat sofralık zeytin sayfası, ticaret borsalarında (özellikle Gemlik, Edremit, Akhisar gibi zeytin borsaları) oluşan serbest piyasa işlemlerini günlük tarih ayrımıyla gösterir. Siyah (salamura, sele, yağlı) ve yeşil (kırma, çizik, dolgulu) sofralık zeytin; kalibre (tane iriliği), işleme yöntemi ve et-çekirdek oranına göre fiyatlanır. Bu nedenle sofralık zeytin kg fiyatı okunurken renk, kalibre, kaynak ve tarih birlikte değerlendirilmelidir. Yağlık zeytin (yağa işlenen ham zeytin) sofralıktan ayrı, daha düşük fiyatlı bir kalemdir.',
  'Sofralık zeytin fiyatlarını rekolte döngüsü (var-yok yılı), kalibre (tanenin iriliği), renk ve tip (siyah/yeşil), işleme yöntemi (salamura, sele, yağlı, kırma), et-çekirdek oranı, fermentasyon kalitesi ve talep belirler. İri kalibreli, düşük çekirdek oranlı, kusursuz fermente edilmiş ürün primli işlem görür. Yağlık zeytin fiyatı yükseldiğinde üretici ürünü yağa yönlendirebilir; bu da sofralık arzını kısarak sofralık fiyatını destekleyebilir.',
  'Sofralık zeytin hasadı bölge ve tipe göre Ekim ile Aralık arasında yoğunlaşır. Yeşil sofralık zeytin daha erken (Eylül-Ekim, olgunlaşmadan), siyah sofralık daha geç (Kasım-Aralık, tam olgunlukta) hasat edilir. Hasat sonrası salamura/fermentasyon süreci haftalar-aylar sürdüğü için piyasaya çıkış hasattan sonraya yayılır; fiyat takibinde tip ve işleme dönemi de önemlidir.',
  'Gemlik (Bursa) siyah sofralık zeytinde ulusal referanstır ve Gemlik zeytini coğrafi işaret/AB tescillidir; Edremit-Ayvalık (Balıkesir), Manisa (Akhisar), İzmir siyah ve yeşil sofralıkta güçlüdür; Hatay, Gaziantep ve Kilis yeşil kırma/çizik zeytinde öne çıkar. Bölge, çeşit (Gemlik, Domat, Memecik, Çelebi) ve işleme geleneğine göre kalibre ve fiyat değişir.',
  'Sofralık zeytinde kalibre (1 kg''daki tane sayısı; düşük sayı = iri tane), et-çekirdek oranı, kusursuzluk (leke, buruşma yokluğu), fermentasyon ve tuz dengesi, renk homojenliği kaliteyi belirler. İri kalibreli (örn. 201-230 ve üzeri irilik) ve düşük çekirdek oranlı ürün daha değerlidir; aşırı tuzlu, buruşmuş veya lekeli ürün iskonto görür.',
  'Kahvaltıda, mezede, salatalarda ve zeytinyağlı yemeklerde kullanılır; yeşil dolgulu/kırma tipler aperatif olarak tüketilir.',
  JSON_ARRAY('zeytinyagi'),
  'manual',
  @ADMIN_ID,
  NOW(3),
  NOW(3)
)
