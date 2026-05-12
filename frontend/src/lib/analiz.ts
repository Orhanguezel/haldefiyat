export interface AnalizMakale {
  slug: string;
  baslik: string;
  ozet: string;
  icerik: string; // plain paragraphs, "\n\n" separated
  yazar: string;
  tarih: string; // ISO YYYY-MM-DD
  etiketler: string[];
  hafta?: string; // ISO week "2026-19"
}

export const MAKALELER: AnalizMakale[] = [
  {
    slug: "mayis-2-hafta-2026-hal-raporu",
    baslik: "Mayıs 2. Hafta Hal Raporu: Çilek ve Kiraz Fiyatlarında Belirgin Düşüş",
    ozet: "Sezonun erken gelmesiyle birlikte çilek ve kiraz fiyatları geçen haftaya kıyasla yüzde 15-22 geriledi. Domates, salatalık ve patlıcanda ise hafif artış var.",
    tarih: "2026-05-12",
    hafta: "2026-19",
    yazar: "HaldeFiyat Veri Ekibi",
    etiketler: ["çilek", "kiraz", "domates", "haftalık rapor"],
    icerik: `Türkiye genelindeki 28 aktif hal merkezinden derlenen 12 Mayıs 2026 haftası verileri, ilkbaharın ürün çeşitliliğini hızla artırdığını ortaya koyuyor. HaldeFiyat Endeksi bu hafta baz haftaya göre 97,4 puanda seyrediyor; geçen haftaki 99,1'e kıyasla hafif gerileme yaşandı.

**Çilek ve Kiraz: Sezon Açılışı Fiyatları Bastırdı**

Amasya, Balıkesir ve Bursa'dan gelen çilek hasadı pazara girmeye başladığından bu yana ortalama çilek fiyatı ₺35'ten ₺27'ye indi. Yüzde 22'lik bu düşüş, geçen yılın aynı dönemine göre de ₺8 daha ucuz olduğunu gösteriyor. Kiraz cephesinde İzmir Ödemiş ve Isparta kaynaklı erken hasat başlangıcı fiyatları ₺60-65 bandından ₺48-52 aralığına çekti. Haziran ortasında sezon doruk noktasına ulaşacağından önümüzdeki haftalarda daha da gerileme bekleniyor.

**Domates ve Patlıcanda Hafif Artış**

Antalya seralarından gelen domates arzının azalması ve açık alan hasadının henüz başlamaması nedeniyle ortalama domates fiyatı bu hafta yüzde 7 arttı. Antalya Merkez Hali'nde ₺22,50'ye ulaşan ortalama, İstanbul İBB Hali'nde ₺26,80 ile daha yüksek seyrediyor; bu fark nakliye maliyetini yansıtıyor. Patlıcanda ise benzer sebeple yüzde 5'lik artış gözlemlendi.

**Patates ve Soğan: Stok Dönemi Baskısı**

Soğuk hava depolarındaki stok erimeye devam ederken patates fiyatları Niğde ve Nevşehir kaynaklı yeni hasat öncesi zirveye yakın seyrediyor. Haziran başında taze hasat pazara gireceğinden bu stok baskısının kısa süreceği öngörülüyor. Soğan ise Afyonkarahisar merkezli tedarikle dengede kalıyor.

**Önümüzdeki Hafta Beklentisi**

Sıcaklıkların mevsim normali üzerinde seyretmesi durumunda domates açık alan hasadı Haziran'a öne çekebilir; bu da fiyatlarda erken yumuşama sağlayacaktır. Çilek ve kirazda düşüş trendi sürecek. İthal meyvelerde (muz, kivi) döviz kuru hareketleri belirleyici olmaya devam edecek. HaldeFiyat Endeksi, önümüzdeki hafta 95-97 bandında gerçekleşmesi bekleniyor.`,
  },
  {
    slug: "mayis-1-hafta-2026-hal-raporu",
    baslik: "Mayıs 1. Hafta Hal Raporu: Domates Fiyatlarında Yüzde 12 Düşüş",
    ozet: "Antalya seralarının tam kapasiteye geçmesiyle domates ortalama fiyatı hızla geriledi. Narenciye cephesinde ise sezon sonu etkisi belirgin.",
    tarih: "2026-05-05",
    hafta: "2026-18",
    yazar: "HaldeFiyat Veri Ekibi",
    etiketler: ["domates", "narenciye", "salatalık", "haftalık rapor"],
    icerik: `5 Mayıs 2026 haftası verileri, yazın habercisi olan ürünlerin piyasayı hareketlendirmeye başladığını gösteriyor. HaldeFiyat Endeksi bu haftayı 99,1 puanda kapattı; bir önceki haftanın 101,4 değerinin altına indi.

**Domates: Sezona Giriş Baskısı**

Antalya'nın Kumluca, Finike ve Serik ilçelerinden gelen sera domatesi üretiminin kapasiteye ulaşmasıyla birlikte hal ortalama fiyatları belirgin biçimde geriledi. Antalya Merkez Hali'nde ₺24,50 olan ortalama, bir hafta içinde ₺21,00'e düştü. Bu düşüş İstanbul ve Ankara gibi büyük tüketim merkezlerine gecikmeli yansırken, İstanbul İBB Hali'nde fiyatlar hâlâ ₺27-28 bandında seyrediyor. Üretim bölgelerine yakın hallerin daha erken tepki verdiği bu tablo, Türkiye'nin lojistik yapısının fiyat farkı yaratmaya devam ettiğini gösteriyor.

**Salatalık: İhracat Sezonu Bitiyor**

Antalya'nın Avrupa'ya yönelik sera salatalığı ihracat sezonu Nisan sonu itibarıyla yavaşlamaya başladı. İhracat talebinin azalmasıyla iç piyasaya akan arz fiyatları aşağı çekiyor. Bu hafta salatalık ortalaması yüzde 9 geriledi. Mayıs sonu itibarıyla açık alan salatalık üretimi başlayacağından düşüş trendi devam edebilir.

**Narenciye: Sezon Kapanışı**

Portakal ve mandalina için hasat sezonu fiilen sona erdi. Piyasada dolaşan ürünlerin büyük çoğunluğu soğuk hava depo çıkışı; kalite düşüşüne paralel olarak fiyatlar da geriledi. Portakal ortalaması ₺14'e indi. Limon ise yaz çeşitlerinin henüz yeterli olmaması nedeniyle ₺22 civarında yüksek seyrediyor.

**Patates-Soğan Çiftisi Sabit**

Temel mutfak malzemeleri olan patates ve soğanda bu hafta kayda değer bir hareket gözlemlenmedi. Her ikisi de depo ürünü arzı ile dengelenmiş durumda; hasat sezonuna (Haziran-Temmuz) kadar bu dengede belirgin bozulma beklenmez.`,
  },
  {
    slug: "nisan-son-hafta-2026-hal-raporu",
    baslik: "Nisan Son Hafta: Sezonluk Sebzeler Piyasaya Girdi, Fiyatlarda İkiye Bölünme",
    ozet: "Erken hasat bölgelerinde fiyatlar düşerken büyük tüketim merkezlerinde gecikmeli etki yaşanıyor. Ispanak ve brokoli ise sezon sonu ile birlikte pahalanmaya başladı.",
    tarih: "2026-04-28",
    hafta: "2026-17",
    yazar: "HaldeFiyat Veri Ekibi",
    etiketler: ["sebze", "mevsim", "ispanak", "haftalık rapor"],
    icerik: `28 Nisan 2026 haftası, Türkiye toptancı hal piyasasında belirgin bir mevsimsel geçiş dönemi olarak öne çıktı. Güneyde açık alan sezonunun başlaması, kış sebzelerinin çekilmesi ve ilkbahar ürünlerinin piyasaya girişi aynı anda yaşandı.

**Biber, Patlıcan, Kabak: Fiyatlar Erken Bölgelerde Düşüyor**

Antalya ve Mersin'in kıyı şeridinde açık alan biberi ve patlıcan hasadı başladı. Bu bölgelerdeki hal fiyatları geçen haftaya kıyasla yüzde 10-15 geriledi. Ancak İstanbul, Ankara ve İzmir gibi büyük hallerde bu düşüş henüz yansımadı; nakliye süresi ve stok rotasyonu farkı 3-5 gün olarak gözüküyor. Hafta sonuna doğru büyük şehirlerde de yumuşama bekleniyor.

**Ispanak ve Brokoli: Kış Sezonu Kapanıyor**

Soğuğa dayalı kış sebzelerinde tam tersi bir tablo var. Ispanak ve brokoli üretimi azaldıkça fiyatlar yukarı dönmeye başladı. Sakarya'dan gelen ıspanak arzı yüzde 30 geriledi; hal fiyatı ₺18'den ₺23'e yükseldi. Brokoli de Denizli ve Bursa kaynaklı arzın azalmasıyla ₺25 bandına yaklaştı. Bu ürünlerde yaz döneminde yüksek fiyatlar sürpriz olmayacak.

**Patates Dikkat: Stok Kritik Seviyeye İniyor**

Hasat sezonuna 6-8 hafta kala patates stokları kritik seviyelere yaklaşıyor. Niğde ve Nevşehir merkezli tüccarlar yeni hasat beklentisiyle stok satışını yavaşlattı; bu da hal fiyatlarını yüzde 8 artırdı. Haziran hasadı normal gerçekleşirse fiyatlar hızla geri çekilecek; ancak gecikme yaşanırsa Mayıs sonunda zirve görülebilir.

**HaldeFiyat Endeksi: 101,4**

Bu haftaki endeks değeri olan 101,4, baz haftanın (100,0) üzerinde seyrediyor. Kış-ilkbahar geçişinin yarattığı arz belirsizliği ve lojistik gecikmeler bu yüksek seyrin temel nedeni. Önümüzdeki iki hafta içinde açık alan arzının yaygınlaşmasıyla endeksin 95-97 bandına gerilemesi bekleniyor.`,
  },
  {
    slug: "nisan-3-hafta-2026-endeks-analizi",
    baslik: "HaldeFiyat Endeksi Baz Haftanın Altına İndi: Sebep Nedir?",
    ozet: "HaldeFiyat Endeksi, baz hafta olan 2026-14'ün 100 puanının altına düştü. Bu ne anlama geliyor ve hangi ürünler bu düşüşü sürüklüyor?",
    tarih: "2026-04-21",
    hafta: "2026-16",
    yazar: "HaldeFiyat Veri Ekibi",
    etiketler: ["endeks", "analiz", "metodoloji", "fiyat trendi"],
    icerik: `HaldeFiyat Endeksi, 21 Nisan 2026 itibarıyla 98,8 puana geriledi. Baz hafta olarak belirlenen 2026 yılının 14. haftasında endeks 100,0 puan olarak tanımlandığından, bu düşüş sepet ürünlerin genel fiyat düzeyinin yüzde 1,2 oranında gerilediğini gösteriyor. İlk bakışta küçük görünen bu hareket, ardındaki ürün bazlı dinamikler açısından incelenmeye değer.

**Endeks Nedir, Nasıl Hesaplanır?**

HaldeFiyat Endeksi, Türkiye'nin toptancı hallerinde en çok işlem gören 15 temel ürünün ağırlıksız ortalamasından oluşan haftalık bir fiyat göstergesi. Sepette domates, biber, salatalık, patlıcan, havuç, patates, soğan, elma, portakal, mandalina, limon, muz, üzüm, karpuz ve çilek yer alıyor. Her hafta bu ürünlerin aktif hallerden alınan ortalama fiyatları hesaplanıp baz haftaya oranlanıyor.

**Bu Haftanın Düşüşüne Ne Yol Açtı?**

Endeksi aşağı çeken iki temel katkı var. Birincisi narenciye: portakal ve mandalina fiyatları sezon ortası bolluğuyla yüzde 8-10 geriledi. İkincisi salatalık: Antalya'nın sera ihracat sezonunun zirveyi geçmesiyle iç piyasaya ek arz aktı, fiyatlar yüzde 12 düştü. Buna karşın patates ve kış sebzelerindeki artışlar endekse yukarı yönlü baskı yapıyor; ancak düşüş yönlü katkılar ağır bastı.

**Geçen Yılla Karşılaştırma**

Geçen yıl aynı dönemde endeks, 2025 baz haftasına göre 103,2 puandaydı. Yani 2026'da aynı haftada fiyatlar görece daha düşük seyrediyor. Bunun temel nedeni, 2026 yılında Antalya'nın sera sezonunun erken kapasiteye ulaşması ve arzın 2025'ten daha güçlü olması.

**Uyarı: Endeks Fiyat Değil, Yönü Gösteriyor**

Endeks değerleri mutlak fiyat düzeyini değil, baz haftaya göre değişimi ölçüyor. Endeksin 98,8 olması tüm ürünlerin ucuzladığı anlamına gelmiyor; bazı ürünler pahalanabilirken sepet geneli düşüyor. Detaylı ürün bazlı analiz için HaldeFiyat'ın grafik araçlarını kullanabilirsiniz.`,
  },
  {
    slug: "turkiye-domates-fiyati-neden-degisir",
    baslik: "Türkiye'de Domates Fiyatı Neden Bu Kadar Değişken? 5 Yıllık Veri Analizi",
    ozet: "2021-2026 yılları arasındaki domates fiyat verisi incelendiğinde, her yıl aynı dönemlerde benzer örüntüler ortaya çıkıyor. Mevsimsel döngü, sera-açık alan geçişi ve ihracat etkisi mercek altında.",
    tarih: "2026-04-14",
    hafta: "2026-15",
    yazar: "HaldeFiyat Veri Ekibi",
    etiketler: ["domates", "5 yıl analiz", "mevsimsel", "sera"],
    icerik: `Domates, Türkiye'nin en çok tüketilen ve fiyat oynaklığı en yüksek sebzelerinden biri. HaldeFiyat'ın 2021'den bugüne derlediği veri, mevsimsel döngünün son derece öngörülebilir olduğunu ortaya koyuyor. 5 yıllık verinin gösterdiği örüntü şu: her yıl Ocak-Mart arası fiyatlar yüksek, Temmuz-Eylül arası düşük seyrediyor.

**Yılın En Yüksek: Ocak-Şubat**

Domates için yılın en pahalı dönemi kış ortası. 2021-2026 arasında Ocak ve Şubat ortalamaları, Temmuz-Ağustos ortalamalarına göre yüzde 65-80 daha yüksek. Bunun sebebi açık: kış aylarında yalnızca sera üretimi var, Antalya ve Mersin'deki seraların ısıtma maliyeti fiyatı doğrudan etkiliyor. Doğal gaz ve elektrik fiyatlarının arttığı dönemlerde bu mevsimsel fark daha da belirginleşiyor.

**Mayıs: Geçiş Dönemi Volatilitesi**

Sera sezonunun kapanmaya başladığı ve açık alan ürünlerinin henüz tam hazır olmadığı Mayıs ayı, yılın en oynak dönemi. Özellikle hava koşullarına bağlı olarak bir yıl Mayıs ortası çok ucuz olurken bir sonraki yıl oldukça pahalı gözlemlenebiliyor. 2024 Mayıs ortalaması ₺18,20 iken 2025'te aynı dönem ₺31,50 oldu — aynı ay için yüzde 73'lük fark.

**Temmuz-Ağustos: Yılın En Ucuz Dönemi**

Ege ve İç Anadolu'nun açık alan hasatlarının üst üste geldiği Temmuz-Ağustos dönemi, domates için yılın en uygun fiyatlı zamanı. Antalya, Bursa ve İzmir hallerinde bu dönemde ₺8-12 aralığı görülmesi şaşırtıcı değil. Tüketici açısından konserve, salça ve dondurma için en doğru zamanlama bu dönem.

**İhracatın Etkisi**

Türkiye domates ihracatının yaklaşık yüzde 40'ı Ekim-Mart döneminde yapılıyor. Bu dönemde Rusya ve Körfez ülkelerinden gelen ihracat talebi iç piyasa fiyatlarını yukarı çekiyor. 2022 yılında Rusya'nın Türk tarım ürünlerine koyduğu geçici kısıtlamaların kaldırılmasından sonra Ekim-Kasım fiyatlarının görece gerilediği gözlemlendi.

**Sonuç: 5 Yıllık Veri Bize Ne Söylüyor?**

Domates fiyatları için en güvenli alım dönemi Temmuz-Ağustos, en riskli dönem ise Mayıs geçişi ve kış ayları. Fiyat korunması (hedging) veya stok planlaması yapan gıda işletmeleri için bu döngünün tanınması önemli bir maliyet avantajı sağlayabilir. Tüm tarihsel veriye HaldeFiyat'ın grafik araçlarından ücretsiz ulaşabilirsiniz.`,
  },
];

export function getMakale(slug: string): AnalizMakale | undefined {
  return MAKALELER.find((m) => m.slug === slug);
}

export function getSonMakaleler(limit = 10): AnalizMakale[] {
  return [...MAKALELER]
    .sort((a, b) => b.tarih.localeCompare(a.tarih))
    .slice(0, limit);
}
