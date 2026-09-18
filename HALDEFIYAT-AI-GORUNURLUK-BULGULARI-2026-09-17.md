# AI arama görünürlüğü — site tarafında yapılacaklar

**Durum 17 Eylül 2026.** Tanitio oturumu `/seo` → **AI Arama Gözlemi** sekmesini
haldefiyat için çalıştırdı. Ölçüm jetonsuz yapıldı: yerel web aramasıyla 6 sorgu
gözlendi, üstüne 90 günlük gerçek Search Console verisi (5.000 sorgu), canlı
sitemap taraması (874 URL), Search Console URL denetimi (10 URL) ve Bing Webmaster
`GetUrlInfo` ölçümü konuldu.

> **Bu bir yüzdeli ölçüm değil.** Panelin "marka adı geçme / kaynak gösterimi"
> oranları API jetonu ister; bu turda jeton kullanılmadı. Aşağıdakiler yön
> gösterir, oran üretmez. Tam belge panelde: `/seo` → AI Arama Gözlemi
> (7 bulgu · 8 rakip · 10 soru · 38 kaynak).

## Önce iyi haber

Dört ürün sorgusunun **dördünde de** site kaynak olarak döndü ve **kendi
açıklayıcı metniniz** yanıta birebir girdi. Patates sorgusunda aktarılan cümle
sizin metodoloji paragrafınız: *"hal fiyatı merkezi bir kurum tarafından
belirlenmez; her sabah toptancı halinde arz ve talebin karşılaşmasıyla oluşur."*

Teknik sebebi `robots.txt`: GPTBot, ChatGPT-User, ClaudeBot, PerplexityBot,
Google-Extended ve CCBot için `Allow: /` + salt-okunur API uçları açık; yalnız
Bytespider ve PetalBot kapalı. `llms.txt` 200 dönüyor ve kapsamı, kökeni, API
sözleşmesini listeliyor.

**Bu iki dosya bugünkü alıntılanmanın tek teknik sebebi ve sessizce bozulabilir.**
Deploy sonrası `robots.txt` + `llms.txt` içerik farkı için uyarı kurun. Bu bir iş
değil, korunacak bir durum.

---

## S1 — Köken cümlesi giriş sayfalarında yok (en yüksek değer, en ucuz iş)

**Ölçüm.** "hal fiyatlarını en güvenilir hangi site takip ediyor" sorgusunda yanıt
şu sırayla verdi:

| # | Site | Yanıtta kullanılan dil |
|---|---|---|
| 1 | halfiyatlari.tr | "güvenilir bir **bilgi kaynağıdır**" |
| 2 | tarimpiyasa.com | "**Tarım Bakanlığı'na bağlı hal müdürlükleri** tarafından her iş günü sabah ilan edilir" |
| 3 | **haldefiyat** | "şehir, kategori ve tarihe göre **filtreleyin**… her gün sabah otomatik güncellenir" |
| 4 | harmanapps.com | "81 il için hal borsa fiyatları" |

Rakiplerin cümlesi **köken**, sizinki **özellik**. Ve sizin cümleniz uydurma
değil — birebir `/fiyatlar` sayfasının `og:description`'ı.

Oysa köken bilginiz rakiplerden **güçlü** ve hâlihazırda yazılı. `llms.txt`:

> 58 aktif toptancı hali · 1242 izlenen ürün · **50 izlenen resmi veri kaynağı** ·
> otomatik ETL · veri geçmişi **2004-03-02**'den itibaren

Sorun varlıkların yokluğu değil, **yanıtın özet aldığı yerde bulunmaması**.
`/metodoloji` var, ürün sayfalarından linkli, ama giriş sayfalarının açıklaması
köken taşımıyor.

**Kalıp zaten sizde doğru çalışıyor.** `/urun/domates` açıklaması:

> "Domates güncel hal, toptan ve piyasa fiyatları. Ortalama 35,65 TL/kg
> (16 Eylül 2026). **Elazığ, Kayseri, Bursa dahil 14 halden güncel veri.**"

**Yapılacak.** `/` ve `/fiyatlar` için `description` + `og:description` + giriş
paragrafını köken cümlesiyle **başlat**, özellik cümlesini ikinci sıraya al.

Şu an:
- `/` → "Türkiye geneli hal ve pazar fiyatları tek ekranda. Sebze, meyve ve bakliyat fiyatlarını şehir ve kategori bazında karşılaştırın."
- `/fiyatlar` → "Türkiye geneli güncel hal fiyatları: sebze, meyve ve bakliyat toptan/piyasa fiyatlarını şehir, kategori ve tarihe göre filtreleyin."

Önerilen yön (rakamlar `llms.txt`'ten, uydurma değil): *resmi belediye hal
müdürlüklerinden derlenen 50 kaynak, 58 hal, 2004'ten beri geçmiş* → sonra
filtreleme özelliği.

---

## S2 — Eski anlık görüntü dayanıklılığı · ⚠️ TARAMA TARAFINA DOKUNMAYIN

**Ölçüm.** Yanıtlara düşen kopyalar eskiydi: domates **9 Eylül**, soğan
**6 Eylül**, patates **5 Eylül**, mandalina **5 Eylül**. Canlı sayfalar aynı anda
`dateModified 2026-09-16`.

İlk hipotez "tarama gecikmesi"ydi. **Ölçüldü ve çürütüldü:**

| Kaynak | Sonuç |
|---|---|
| Search Console URL denetimi (10 URL) | **10/10 `PASS`** · "Submitted and indexed" · son tarama **16 Eylül** (limon 1 gün) · `page_fetch_state SUCCESSFUL` · `INDEXING_ALLOWED` |
| Bing Webmaster `GetUrlInfo` | `/urun/domates`, `/urun/sogan-kuru`, `/urun/patates` → `LastCrawledDate` **16 Eylül** (saatler önce) |
| `sitemap.xml` sinyalleri | Anahtar ürünlerde `lastmod 2026-09-16`, `changefreq daily`, `priority 0.8` — **doğru**. Tek `weekly` olan `/urun/kuru-uzum` borsa ürünü, gerçekten seyrek güncelleniyor. |

Yani **iki arama motoru da aynı gün tarıyor.** Eskilik asistanın kendi
getirme/önbellek katmanında ve **site tarafından tetiklenemez.**

> `lastmod`, `changefreq`, IndexNow, yeniden tarama isteği — bunların hiçbiri bu
> sorunu çözmez. Efor harcamayın.

**Asıl risk sizin son üç commit'inizle kesişiyor.** `6bbd1d93`, `52d72278`,
`43487ff0` başlığa günün rakamını koyuyor. Google SERP tarafında bu **doğru** iş —
arayan rakam istiyor. Ama eski bir anlık görüntü alıntılandığında sayfa,
kendinden emin ama **yanlış bir güncel fiyat** sunmuş oluyor. İki hedef hafifçe
çatışıyor; çözüm rakamı kaldırmak değil:

1. **Veri tarihini rakamın yanında, cümle içinde ve makine-okunur ver**
   ("16 Eylül 2026 hal verisi") — eski kopya alıntılanınca tarih de birlikte
   taşınsın, yanıt "9 Eylül verisine göre" demek zorunda kalsın.
2. **Sayfanın üstüne tarihten bağımsız doğru kalan bir blok koy**: fiyatın nasıl
   oluştuğu, min–maks bandı, kaç halden derlendiği, güncelleme ritmi. Eski anlık
   görüntüden bile doğru yanıt çıkar. *(Bunun çalıştığı kanıtlı: patates
   yanıtında alıntılanan şey tam olarak bu tür bir paragraftı.)*
3. **Canlı API ucunu sayfanın kendisinden de görünür kıl.** `llms.txt`'te var ama
   sayfada yok; getirme yapabilen asistan önbelleğe değil API'ye gitsin.

---

## S3 — `/piyasa/` yalnız turunçgilde; talebin zirvesi kapsam dışı

**Ölçüm.** 874 URL'lik sitemap'te `/piyasa/` altında **5 sayfa** var ve hepsi
turunçgil: `erdemli-limon`, `adana-mayer-limon`, `adana-limon`, `mersin-limon`,
`adana-mandalina`.

90 günlük gerçek GSC talebi (ürün bazında toplam gösterim):

| # | Ürün | Gösterim | `/piyasa/` sayfası |
|---|---|---|---|
| 1 | limon | 100.246 | ✅ (4 şehir) |
| 2 | **patates** | 21.877 | ❌ |
| 3 | **soğan** | 20.691 | ❌ |
| 4 | **domates** | 16.562 | ❌ |
| 5 | mandalina | 11.571 | ✅ (1 şehir) |
| 6 | üzüm | 10.229 | ❌ |
| 7 | kiraz | 8.727 | ❌ |
| 8 | nar | 8.131 | ❌ |

AI yanıtları "neden arttı / ne bekleniyor" biçimli sorularda **yorum** içeriğini
alıntılıyor; bu üç üründe yalnız çıplak fiyat tablosu (`/urun/...`) var.

**Karar sizde:** mevcut desen şehir+ürün (`/piyasa/adana-limon`). Patates/soğan/
domates tek şehre bağlı değil — ürün düzeyinde hub (`/piyasa/patates`) mi, yoksa
şehir+ürün mü? Ürün düzeyi daha uygun görünüyor, ama URL deseni sizin kararınız.

**Ayrıca bir bağlantı boşluğu:** `/urun/patates` sunucu HTML'inde **hiçbir
`/piyasa` bağlantısı yok.** Fiyat sayfası ile piyasa yorumu sayfası birbirini
görmüyor. `/piyasa` öneki Tanitio tarafında `informational` niyete bağlandı
(seed 357), yani ölçüm bu sayfaları doğru sınıflandıracak.

---

## S4 — Çeşit düzeyindeki çelişkiyi kimse çözmüyor (sahipsiz alan)

**Ölçüm.** Mandalina sorgusunda yanıt sizin ülke ortalamanızı (**₺80,71/kg**)
harmanapps'in "Mandalina Kıng **₺10,84/kg**" değerinin yanına koydu ve **sekiz kat
farkı çözmedi**. Çeşit aralıkları (Okitsu 8–13, Satsuma 7–10, Dübeşi 13–17) üçüncü
bir kaynaktan geldi.

Limon ve domateste çeşit slug'ınız **var** (`limon-mayer`, `limon-lamas`,
`limon-yatak`, `domates-salcalik`, `domates-cherry`, `domates-salkim`) —
mandalinada tek sayfa. Kullanıcı "hangi mandalina" diye sorduğunda tek doğru adres
boş.

**Yapılacak.** `/urun/mandalina`'ya çeşit ayrıştırma bloğu (King, Okitsu, Satsuma,
Dübeşi), her çeşidin ayrı ortalaması ve farkın nedenini açıklayan bir cümle.
Aynı kontrolü üzümde de yapın: taze ve kuru üzüm ayrı sayfalar ama
"kuru üzüm fiyatları 2026" ayrı bir sorgu kümesi.

---

## S5 — Rakibin üretici yorumu yanıta "piyasa rengi" olarak giriyor

**Ölçüm.** Limon sorgusunda yanıt tarimziraat.com'daki **kullanıcı yorumlarını**
doğrudan aktardı: *"Yüreğir/Gökçeli piyasasında boylu Wolka çeşidi için fiyatlar
18 liraya kadar"*, *"Mersin/Silifke piyasasında 50-55 lira"*. Siz aynı yanıtta
yalnız ülke ortalamasını (53,93 TL/kg) sağladınız.

Sonuç: **"ortalama kaç" bilgisi sizden, "piyasada ne oluyor" bilgisi rakipten.**
İkincisi daha çok alıntılanan sorudur.

**Yapılacak.** Ürün sayfasına **tarihli ve moderasyonlu** hal/komisyoncu notu
alanı. Kimden ve hangi tarihte geldiği görünür olsun; **ölçülen fiyat verisiyle
aynı blokta karışmasın** — veri güvenilirliği bu ayrımla korunur. Zaten
`/editoryal-politika` ve `/duzeltme-politikasi` sayfalarınız var, çerçeve hazır.

Kapsamda tarimziraat'ı taklit etmek gereksiz: 58 hal / 1242 ürün kapsamınız
onlardan geniş. Eksik olan tek şey bu yorum katmanı.

---

## S6 — `robots.txt` boş bir news-sitemap bildiriyor (düşük öncelik)

`robots.txt` şu satırı taşıyor:

```
Sitemap: https://haldefiyat.com/news-sitemap.xml
```

Dosya geçerli XML ama **sıfır URL** içeriyor (`<urlset>` boş). Bildirilip boş
bırakılan haber site haritası hiçbir şey kazandırmıyor.

İki seçenek: ya gerçekten tarih taşıyan içerikle doldur (`/analiz`, `/piyasa` —
news sitemap yalnız son 2 günlük içerik için anlamlıdır), ya da satırı kaldır.
Boş bırakmak üçüncü seçenek değil. **Bu, S2'deki tazeliğin sebebi DEĞİL.**

---

## Sizin işiniz olmayan, Tanitio tarafında kalanlar

- `tarimmemleketi.com` soğan sorgusunda aynı sonuç kümesinde çıkıyor ama Rakip
  Keşfi'nde izlenmiyor → kaynak payı eksik rakiple hesaplanıyor. Tanitio oturumu
  izlemeye alacak.
- Panelin ürettiği test soruları ürün satıcısı varsayıyor ("limon fiyatları
  seçerken nelere dikkat edilmeli?") — fiyat-veri sitesi için garip. Şablon
  düzeltmesi Tanitio tarafında.
- Yüzdeli AI görünürlük ölçümü (marka anılma / kaynak gösterimi oranları) API
  jetonu ister; jeton olduğunda aynı konu setiyle çalıştırılacak.

## Öncelik sırası

1. **S1** — köken cümlesi (`/`, `/fiyatlar`): en ucuz, en yüksek değer
2. **S2** — eski anlık görüntü dayanıklılığı (tarih + evergreen blok + API linki)
3. **S3** — `/piyasa/patates|sogan|domates` + `/urun` ↔ `/piyasa` bağlantısı
4. **S4** — mandalina çeşit ayrıştırma
5. **S5** — moderasyonlu hal/komisyoncu notu katmanı
6. **S6** — boş news-sitemap
7. **Sürekli** — `robots.txt` + `llms.txt` için deploy sonrası fark uyarısı

İki hafta sonra aynı altı sorgu yeniden gözlenecek; dönen tarih farkı ve "en
güvenilir kaynak" sorusundaki sıra ölçülecek.

---

## 18 Eylül 2026 — Alıntılanabilirlik: kök neden bulundu ve ölçüldü

Katalog Bulgu 1 (içerik kalitesi, **12,9 puan**) ve Bulgu 2 (otorite/güven, **6,16 puan**)
için tek bir yapısal sebep var. Katalogun puanlayıcısını okudum:

`ekosistem-sosyal-medya/backend/src/modules/seo/geo-signals.ts` → `analyzeGeoPage`

```ts
for (const match of body.matchAll(/<(h[1-4]|p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi)) { ... }
```

**Yalnız `<p>` ve `<li>` pasaj sayılıyor.** Biz en alıntıya uygun metnimizi
`<div>` (AnswerBlock) ve `<dd>` (SSS) içinde tutuyorduk. Yani sayfanın cevap
bloğu ve tüm SSS cevapları hiç sayılmıyordu.

### Ölçüm — katalogun kendi kuralı birebir kopyalanıp canlı sayfalara uygulandı

Betik: oturum scratchpad'i (`citability.mjs`); `scorePassage` + `analyzeGeoPage` kopyası.
Doğrulama: anasayfa **31** çıktı, katalogun rakamı da **31**. Ölçüm güvenilir.

| sayfa | önce (puan / pasaj) | sonra |
|---|---|---|
| anasayfa | 31 / 10 | 33 / 10 |
| `/hal/ankara-hal` | **0 / 0** | **28 / 11** |
| `/urun/domates` | 18 / 9 | 23 / **15** |
| `/fiyat/bursa/domates` | — | 31 / 10 |
| `/piyasa/mersin-limon` | — | 22 / 9 |
| `/fiyatlar` | — | 33 / 6 |

Hal sayfalarının **tek bir** ölçülebilir paragrafı yoktu — tamamı tablo/kart. Site
geneli citability 24,4 puanını en çok bunlar aşağı çekiyordu.

### Yapılan

- `AnswerBlock` gövdesi `<div>` → `<p>` (çok paragraflı iki çağrı yeri `bodyAs="div"`).
- Altı sayfadaki altı ayrı SSS işaretlemesi tek `FaqList` bileşeninde: soru `<h3>`
  (soru işaretiyle biten başlık = puanlayıcıda +10), cevap `<p>`. Görünüm değişmedi.
- `summarizeMarketMovement` — hal sayfası cevap bloğu artık listenin genelinden
  okunan bir rakamla açılıyor ("karşılaştırabildiğimiz N üründen %X'i ucuzladı").
  Uç değer seçmez; bozuk tek seri sayıyı bir birim kaydırır, cümleyi ters çeviremez.

### Kapanmayan iki kalem — ve neden kapatılmadığı

**`len` = 0 (her sayfada).** Puanlayıcı 134–167 kelimelik paragrafa +20 veriyor;
bizim en uzun paragrafımız 76 kelime. Bu 20 puan **yalnızca kelime sayısıyla**
alınır. Metni hedefe doldurmak okuyucuya hiçbir şey katmaz; yapılmadı. Paragraf
uzarsa gerçek bir şey söylediği için uzasın.

**`lead` = 0 (her sayfada).** Kontrol: ilk 60 kelimede `\d+%` **veya** `is|are|means|refers`.
Yani yüzde işareti **sayıdan sonra** (İngilizce "2,9%"). Türkçe "%2,9" yazar ve
bu regex'e hiç uymaz. **Analizör artefaktı** — düzeltmesi Türkçeyi bozmak olurdu.
Katalog artefaktları listesine eklendi.

### Bu turda çıkan iki gerçek veri bulgusu

1. **Ürün sayfasında "haller arası fiyat makası" oranı kurulamıyor.** Denendi ve
   geri çekildi. Domates 17 Eylül kesiti: 26 satır ama 15 hal — Denizli 3, Kayseri 2,
   Konya 2, Bolu 2, Gaziantep 2 satır. Satırlar hal başına tek fiyat değil, **aynı
   halde ayrı yayımlanan çeşitler**. Adana 12,00 TL – Tokat 70,00 TL farkının ne
   kadarı coğrafya, ne kadarı çeşit karışımı — ayrılamıyor. %300 üst sınırı da
   çözmez: eşiğin altındaki ürünlerde aynı karışım daha küçük ve daha inandırıcı
   bir yanlış sayı üretir. **Sayısız olmak, yanlış sayıdan iyidir.**

2. **`calculateWindowTrend` eşleşmemiş — ürün sayfasındaki "son 7/30 gün %X" bundan
   besleniyor.** Fonksiyon her gün için *tüm satırların* ortalamasını alıyor
   (`lib/citability.ts:41-59`). Bir hal o hafta yayımlayıp ertesi hafta yayımlamazsa
   sayı **fiyat değil bileşim** yüzünden oynar. Bu, anasayfa haftalık bloğunda üç kez
   yaşanıp `weekly-movement.ts`'te eşleşmiş-seri süzgeciyle çözülen hatanın aynısı —
   ürün sayfasında hâlâ açık. **Sıradaki iş bu.**

### Bulgu 2'nin kalan iki sinyali

Katalog: 9/11 güven sinyali var; eksik olanlar `reviews` (müşteri yorumu) ve
`trust` (iade/garanti/güvenli ödeme/sertifika).

- `reviews` — katalog kendi metninde uyarıyor: "Kendi işletmeniz hakkındaki yorumlara
  sırf puan almak için Review/AggregateRating eklemeyin." **Yapılmayacak.**
- `trust` — bir şey satmadığımız için iade/garanti kavramı geçersiz. Bizim
  karşılığımız **veri güvencesi**: düzeltme politikası, CC BY 4.0 lisansı, kaynak
  doğrulama. `/metodoloji` ve `/veri-kaynagi-politikasi` var ama sayfa şablonunda
  görünür bir güvence satırı yok. **Yapılabilir ve dürüst — sıradaki turda.**
