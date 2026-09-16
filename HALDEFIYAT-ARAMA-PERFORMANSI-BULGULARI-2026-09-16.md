# Arama Performansı Bulguları — Gerçek GSC Verisi (2026-09-16)

**Yazan:** Claude oturumu, `ekosistem-sosyal-medya` (Tanitio) tarafı.
**Bu repoda hiçbir kod dosyası değiştirilmedi** — bu belge tek eklemedir.
**Kaynak:** haldefiyat'ın gerçek Search Console verisi, son 28 gün, `sc-domain:haldefiyat.com`.
Ölçüm **salt okunur** yapıldı (VPS'te geçici script, çalıştıktan sonra silindi; yazma yok).

## Neden bu belge var

Tanitio'ya 131 SEO uzmanıyla yapılan 2026 sıralama faktörleri anketine göre yeni ölçümler
eklendi (niyet eşleşmesi, tıklama davranışı, marka sinyali). Sınıflandırıcıyı **gerçek
veriyle** doğrularken haldefiyat en zengin örneklemi verdi ve çıkan bulguların bir kısmı
Tanitio'nun değil **bu sitenin** işi. Aşağıdakiler o kısım.

---

## 1. Tanitio tarafı — tenant yapılandırması (5 dakikalık iş)

Tanitio'nun niyet sınıflandırıcısı jenerik bir sözlük kullanıyor ve haldefiyat'ın bölüm
adlarını (`/hal/`, `/firmalar/`, `/analiz/`) bilmiyor. Bunlar **ürün koduna gömülmüyor**
(başka tenant'ta yanlış olur), tenant beyan ediyor.

Yazılacak yer: **`ekosistem_sosyal`** veritabanı, `social_projects.marketing_json`,
`project_key = 'haldefiyat'`. Mevcut JSON'un üzerine yazma — `seo` anahtarını **ekle**.

```json
{ "seo": {
  "pathIntents": [
    { "prefix": "hal",      "intent": "transactional" },
    { "prefix": "firmalar", "intent": "commercial" },
    { "prefix": "analiz",   "intent": "informational" }
  ],
  "intentAdjacency": [["informational", "transactional"]]
} }
```

**Ölçülen etki** (aynı 5.000 sorgu-sayfa çifti üzerinde):

| | Sınıflanabilen | Niyet puanı | Uyumsuz gösterim |
|---|---|---|---|
| Yapılandırma yok | %55 | 84,3 | 20.210 |
| Yukarıdaki yapılandırma | **%67** | **93,7** | **1.900** |

Gerekçeler:

- **`hal` → transactional.** En çok gösterim alan bölüm (`/hal/istanbul-hal-ibb` tek başına
  19.081 gösterim) ve oraya inen sorgular ağırlıkla "X hal fiyatları".
- **`analiz` → informational.** Analiz yazıları.
- **`intentAdjacency: bilgi ↔ işlemsel.`** Jenerik varsayılan bu ikisini uyumsuz sayar
  ("nasıl ekilir" sorgusunun ürün sayfasına inmesi gerçek bir hatadır). Ama bu sitede
  bilgi sayfaları **canlı fiyat taşıyor**: "mersin limon fiyatları" sorgusunun
  `/analiz/limon-fiyatlari-2026-mersin-erdemli-piyasa-analizi` sayfasına inmesi doğru
  sonuçtur. Beyan bunu düzeltiyor, varsayılanı kaldırmıyor.
- **`firmalar` → commercial.** Üç seçenek ölçüldü: commercial 93,7 · transactional 93,1 ·
  navigational 92,2. `commercial` en iyisi.

### Ölçülmüş ama ÖNERİLMEYEN bir seçenek

`intentAdjacency`'ye `["navigational","commercial"]` de eklenirse uyumsuz gösterim
**sıfıra** düşüyor ve puan 94,2 oluyor. **Bunu yapma.** Kalan 1.900 gösterimlik
uyumsuzluğun tamamı `"X hali telefon numarası" → /firmalar/X` kalıbında ve bu gerçekten
gözden geçirilmesi gereken bir şey (aşağıda §4). Her şeyi "komşu" ilan ederek metriği
sıfırlamak ölçümü kör eder.

> Not: canlı DB yazımını ben yapmadım — Tanitio tarafında prod DB yazımı sınıflandırıcı
> engelli. Bu yapılandırma seed'e de yazılabilir (tercih edilen yol) veya tek `UPDATE` ile.

---

## 2. Site tarafı — en yüksek değerli iş: başlık ve açıklama (CTR)

Ölçülen: **2.917 kayıp tıklama / 28 gün.** "Kayıp" tanımı: sorgu, sitenin **kendi**
pozisyon-CTR eğrisinde aynı bandın ortalamasının altında tıklanıyor. Yani sıralama zaten
var, tıklama yok — en ucuz iyileştirme kalemi.

Kalıp çok net: **"şehir + hal fiyatları" sorgularında iyi sıralanıyorsunuz ama
tıklanmıyorsunuz.**

### Tıklama kaybı — en yüksek 20 sorgu

| Kayıp tıklama | Sorgu | Pozisyon | CTR | Bant beklentisi | Gösterim |
|---|---|---|---|---|---|
| 63 | kayseri hal fiyatları | 5.9 | %1.7 | %3.9 | 2.725 |
| 59 | kocaeli hal fiyatları | 3.5 | %2.2 | %6.7 | 1.302 |
| 59 | ankara hal fiyatları | 4.6 | %2.1 | %3.9 | 3.133 |
| 59 | adana limon fiyatları | 7.4 | %0.7 | %1.8 | 5.231 |
| 52 | mandalina fiyatları | 5.4 | %1.0 | %3.9 | 1.746 |
| 45 | denizli hal fiyatları | 3.1 | %3.2 | %6.7 | 1.258 |
| 37 | konya hal fiyatları | 2.6 | %5.2 | %7.1 | 1.944 |
| 32 | nar fiyatları | 5.7 | %1.5 | %3.9 | 1.295 |
| 26 | mersin limon fiyatları | 6.4 | %1.0 | %1.8 | 3.132 |
| 23 | 2026 üzüm fiyatları | 3.5 | %4.0 | %6.7 | 844 |
| 22 | üzüm fiyatları 2026 | 3.8 | %4.5 | %6.7 | 987 |
| 19 | ankara hal fiyatları bugün | 5.4 | %2.5 | %3.9 | 1.351 |
| 19 | nar piyasası | 4.5 | %1.1 | %3.9 | 650 |
| 18 | izmir hal fiyatları | 8.0 | %0.5 | %1.8 | 1.352 |
| 15 | bursa balık hali fiyatları | 2.7 | %4.3 | %7.1 | 556 |
| 15 | adana limon piyasası | 8.0 | %0.2 | %1.8 | 914 |
| 15 | erdemli hal fiyatları bugün | 1.7 | %3.4 | %15.8 | 117 |
| 14 | adana hal | 5.9 | %0.7 | %3.9 | 436 |
| 13 | adana mandalina fiyatları | 7.3 | %0.6 | %1.8 | 1.021 |
| 13 | 2026 limon fiyatları | 5.5 | %1.0 | %3.9 | 418 |


Okuma notu: `erdemli hal fiyatları bugün` satırına dikkat — pozisyon **1,7** ama CTR %3,4,
bandın beklentisi %15,8. Birinci sıradasınız ve tıklanmıyorsunuz; bu satır tek başına
snippet'in soruyu karşılamadığını söylüyor.

**Önerilen iş sırası:**

1. `<title>` ve `<meta description>`'a **tarih ve somut sayı** koyun. "Kayseri Hal
   Fiyatları" yerine "Kayseri Hal Fiyatları — 16 Eylül 2026 (Güncel Liste)" kalıbı.
   Kullanıcı "bugün"ün fiyatını arıyor; snippet güncelliği göstermezse rakibe gidiyor.
2. Description'da **örnek fiyat** verin ("Domates 18 TL, patates 12 TL…"). Fiyat arayan
   kullanıcıya SERP'te tek bir rakam göstermek tıklama oranını en çok değiştiren şeydir.
3. `/analiz/*` sayfalarında `dateModified` yapılandırılmış veriyi doğrulayın — Google
   tarih göstermezse "bugün" niyetli sorguda dezavantajlısınız.

Bu tabloyu tekrar üretmek için Tanitio'da: **SEO ve Görünürlük → Arama Performansı**
sekmesi (bu tenant'ta canlıya çıktığında).

---

## 3. Site tarafı — 713 sorgu, 30.627 gösterim, 505 tıklama (%1,6 CTR)

Çıplak *şehir + hal* sorguları. Niyet sorgudan **okunamıyor** (fiyat mı, telefon mu, yol
tarifi mi?) ve Tanitio bunları kasten sınıflamıyor. Ama hacim büyük ve CTR düşük:


| Gösterim | Tıklama | CTR | Pozisyon | Sorgu |
|---|---|---|---|---|
| 801 | 13 | %1.6 | 7.0 | ankara hal |
| 725 | 9 | %1.2 | 8.8 | kayseri hal |
| 634 | 11 | %1.7 | 10.1 | mersin hal |
| 609 | 23 | %3.8 | 5.6 | bursa hal |
| 601 | 2 | %0.3 | 12.0 | bursa balık hali |
| 519 | 22 | %4.2 | 6.0 | istanbul hal |
| 478 | 3 | %0.6 | 6.8 | adana sebze hali |
| 470 | 7 | %1.5 | 9.4 | gaziantep sebze hali |
| 464 | 10 | %2.2 | 7.2 | elazığ sebze hali |
| 436 | 3 | %0.7 | 5.9 | adana hal |
| 431 | 22 | %5.1 | 3.7 | malatya sebze hali |
| 417 | 1 | %0.2 | 9.9 | sebze hali |
| 390 | 2 | %0.5 | 8.7 | osmaniye sebze hali |
| 324 | 1 | %0.3 | 11.5 | antalya hal |
| 301 | 0 | %0.0 | 5.7 | sivas hal |
| 257 | 3 | %1.2 | 5.1 | konya hal |
| 251 | 2 | %0.8 | 5.5 | niğde hal |
| 249 | 0 | %0.0 | 10.7 | gaziantep hal pazarı |
| 243 | 3 | %1.2 | 8.4 | osmaniye hal |
| 238 | 4 | %1.7 | 9.3 | şanlıurfa hal pazarı |

Toplam 713 böyle sorgu, 30.627 gösterim, 505 tıklama.

Bu bir **bilgi mimarisi** sorusu, başlık işi değil: "ankara hal" arayan kullanıcı tek bir
sayfada hem bugünün fiyatını, hem komisyoncu telefonlarını, hem adres/çalışma saatlerini
bulmalı. Şu an bu niyetler `/hal/ankara-hal` ve `/firmalar/ankara` arasında bölünmüş
görünüyor; ikisi birbirine görünür şekilde bağlıysa CTR de pozisyon da düzelir.

Dikkat çeken tek tek satırlar: `bursa balık hali` 601 gösterim / 2 tıklama / pozisyon 12,0
ve `sivas hal` 301 gösterim / **0 tıklama** / pozisyon 5,7. İkincisi özellikle tuhaf —
beşinci sıradasınız ve hiç tıklanmıyorsunuz; o sayfanın snippet'ine bakmaya değer.

---

## 4. Site tarafı — niyet uyumsuzluğu (yapılandırma sonrası kalan)

Yukarıdaki yapılandırma uygulandığında kalan 1.900 gösterim. **Tamamı aynı kalıpta:**
kullanıcı telefon numarası arıyor, komisyoncu listesi sayfasına iniyor.

| Gösterim | Sorgu | Sorgu niyeti | İnen sayfa | Sayfa türü |
|---|---|---|---|---|
| 366 | osmaniye sebze hali telefon numarası | gezinme | /firmalar/osmaniye | ticari |
| 109 | elazığ sebze hali telefon numarası | gezinme | /firmalar/elazig | ticari |
| 99 | mersin hal telefon numarası | gezinme | /firmalar/mersin | ticari |
| 81 | osmaniye hal telefon numarası | gezinme | /firmalar/osmaniye | ticari |
| 65 | malatya sebze hali telefon numarası | gezinme | /firmalar/malatya | ticari |
| 61 | dörtyol sebze hali telefon numarası | gezinme | /firmalar/hatay | ticari |
| 60 | istanbul sebze meyve hali telefon numaraları | gezinme | /firmalar/istanbul | ticari |
| 58 | şanlıurfa hal pazari telefon numarası | gezinme | /firmalar/sanliurfa | ticari |
| 55 | ceyhan sebze hali telefon numarası | gezinme | /firmalar/adana | ticari |
| 51 | konya sebze hali telefon numarası | gezinme | /firmalar/konya | ticari |
| 49 | gaziantep sebze hali telefon numaraları | gezinme | /firmalar/gaziantep | ticari |
| 46 | adana sebze hali telefon numarası | gezinme | /firmalar/adana | ticari |
| 43 | ankara sebze hali telefon numarası | gezinme | /firmalar/ankara | ticari |
| 41 | ceyhan hal telefon numarası | gezinme | /firmalar/adana | ticari |
| 41 | denizli hal telefon numarası | gezinme | /firmalar/denizli | ticari |

Kalan 50 uyumsuz çiftin hepsi bu desende. Tanitio bunu "uyumsuz" sayıyor çünkü jenerik
sözlükte gezinme niyeti ile ticari sayfa uyuşmaz. Ama `/firmalar/*` sayfası komisyoncu
telefonlarını gerçekten listeliyorsa bu sorgu **karşılanıyor** demektir; o zaman yapılacak
iş sayfanın telefon bilgisini snippet'e çıkacak şekilde öne almasıdır — 366 gösterimlik
"osmaniye sebze hali telefon numarası" satırı tek başına bunu hak ediyor.

`/firmalar/*` sayfalarına inen 489 sorgu-sayfa çiftinin (22.781 gösterim) dağılımı:
telefon/iletişim **3.451 gösterim**, komisyoncu **3.359**, fiyat **1.699**. Yani bu sayfa
üç farklı niyete birden hizmet ediyor. Karar sizin: ya sayfa üçünü de açıkça karşılar
(fiyat özeti + komisyoncu listesi + telefon), ya da ayrılır. Şu an tek niyet ataması
hangi seçenekte olursa olsun bir kısmı "uyumsuz" görünüyor — çünkü gerçekten öyle.

---

## 5. Ölçümün sınırları — abartmadan okuyun

| Sınır | Ne demek |
|---|---|
| **Search Console nadir sorguları gizler** | Tam sorgu kümesi (8.184 satır) yetkili toplamların yalnız **%50'sini** görüyor: 8.877 / 17.745 tıklama, 263.869 / 547.402 gösterim. Hiçbir sorgu listesi trafiğin tamamını göremez. Dolayısıyla 2.917 kayıp tıklama **alt sınırdır**, gerçek sayı daha yüksek. |
| **"Beklenen CTR" sitenin kendi eğrisi** | Sektör kıyası değil. Bir sorgunun "bandın altında" olması sitenin kendi ortalamasına göredir. |
| **Kayıp tıklama sıralama garantisi değil** | Başlık/açıklama iyileştirmesi CTR'yi artırır; sıralamayı artıracağı iddia edilmiyor. |

Referans — sitenin kendi pozisyon-CTR eğrisi (tam örneklem, 8.184 sorgu):


| Pozisyon bandı | Gösterim | Tıklama | CTR | Kıyas olarak güvenilir |
|---|---|---|---|---|
| 1,0 – 1,9 | 2.794 | 442 | %15.82 | evet |
| 2,0 – 2,9 | 15.768 | 1.115 | %7.07 | evet |
| 3,0 – 3,9 | 26.302 | 1.766 | %6.71 | evet |
| 4,0 – 5,9 | 75.985 | 3.000 | %3.95 | evet |
| 6,0 – 10,9 | 132.769 | 2.450 | %1.85 | evet |
| 11 ve sonrasi | 10.251 | 104 | %1.01 | evet |
Pozisyon 2 ile 3 arasındaki farkın çok küçük olması (%7,07 vs %6,71) dikkat çekici;
normalde 2. sıra 3.'nün belirgin üstündedir. Muhtemel sebep: bu sorgularda SERP'in üstünde
AI Overview / öne çıkan snippet / rakip zengin sonuç var ve organik 2. sıranın avantajını
yiyor. Doğrulanmadı — SERP'e bakmak gerekir.

---

## Bu belgede olmayan şey

- **Kod değişikliği yok.** Tanitio tarafındaki düzeltmeler orada commit'li
  (`086bd7c`, `f377a96`); bu repoda hiçbir dosyaya dokunulmadı.
- **Tenant yapılandırması uygulanmadı** (§1). Canlı DB yazımı benim tarafımda engelli.
- **Site içeriği değiştirilmedi.** §2-4 öneri; uygulaması bu oturumun işi.
- **SERP doğrulaması yapılmadı.** §5'teki AI Overview tahmini ölçülmedi.
