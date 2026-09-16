# CTR turu ölçümü — 16 Eylül 2026

**Neden bugün:** 2 Eylül'de yapılan başlık/açıklama turu için ölçüm tarihi 16 Eylül
olarak önceden ilan edilmişti (`[[oruntu-b-baslik-aciklama-turu]]`). Aynı gün
Tanitio tarafından gelen [`HALDEFIYAT-ARAMA-PERFORMANSI-BULGULARI-2026-09-16.md`](./HALDEFIYAT-ARAMA-PERFORMANSI-BULGULARI-2026-09-16.md)
belgesi de site tarafına iş öneriyordu. İkisi tek ölçümde karşılandı.

**Veri:** GSC `searchAnalytics/query`, `sc-domain:haldefiyat.com`, `dataState=final`,
`query+page` boyutu. Salt okunur; VPS'teki geçici betik çalıştıktan sonra silindi.

---

## 1. Tanitio belgesinin §2 önerisi zaten uygulanmış

Belge "başlığa tarih ve somut sayı koyun, açıklamaya örnek fiyat verin" diyor.
Bu iki iş **2 ve 6 Eylül'de canlıya alınmıştı**; belgenin dayandığı 28 günlük
pencere değişimin üstünden geçtiği için tablo kısmen eski snippet'leri ölçüyor.

Canlı doğrulama (16 Eylül):

```
<title>Kayseri Hal Fiyatları Bugün 16 Eylül 2026</title>
<meta name="description" content="Kayseri Toptancı Hali güncel meyve sebze hali
fiyatları. 16 Eylül 2026: Patates 27,5 TL/kg, Soğan 26 TL/kg, Domates 33 TL/kg
— toplam 119 ürün.">
```

### Turun sonucu — eşleşmiş sorgu kümesi, aynı pozisyon

İki pencerede de görünen sorgular alınır (kompozisyon kayması elenir):

| Küme (2 Eylül turu, 11'er gün) | n | Gösterim | Tıklama | CTR | Pozisyon |
|---|---|---|---|---|---|
| Tüm eşleşen sorgular — önce | 3.592 | 102.747 | 3.305 | %3,22 | 6,53 |
| Tüm eşleşen sorgular — sonra | 3.592 | 98.495 | **3.703** | **%3,76** | 6,58 |
| Ürün "* fiyatları" — önce | 595 | 23.146 | 631 | %2,73 | 6,90 |
| Ürün "* fiyatları" — sonra | 595 | 22.865 | **707** | **%3,09** | 7,16 |

Pozisyon sabit (hatta ürün kümesinde bir tık kötü), CTR %17 artmış. Önceden
ilan edilen hedef sorguların tamamı iyileşti:

| Sorgu | CTR önce | CTR sonra | Poz önce | Poz sonra |
|---|---|---|---|---|
| limon fiyatları | %1,49 | %2,20 | 6,0 | 6,5 |
| salçalık domates fiyatları | %1,79 | %2,14 | 7,7 | 7,4 |
| adana limon fiyatları | %0,70 | %0,80 | 7,9 | 6,8 |
| erdemli limon fiyatları | %3,87 | %5,22 | 5,4 | 5,6 |
| ankara hal fiyatları | %1,69 | %2,77 | 4,3 | 4,4 |
| kocaeli hal fiyatları | %1,63 | %3,66 | 3,5 | 3,3 |
| denizli hal fiyatları | %1,47 | %3,64 | 3,2 | 3,0 |
| konya hal fiyatları | %4,10 | %6,93 | 2,2 | 2,6 |
| ankara hal fiyatları bugün | %1,85 | %4,56 | 5,4 | 5,4 |

**Yanlış alarm — İstanbul.** 6 Eylül turunun "hal fiyat*" toplamı düşük görünüyor
(%4,99 → %4,67). Kaybın neredeyse tamamı tek kümede: `istanbul hal fiyatları` ve
İstanbul ilçe sorguları (−98 tıklama). Sayfanın günlük seyri bunun gerileme
olmadığını gösteriyor: `/hal/istanbul-hal-ibb` 20 Ağustos–13 Eylül boyunca
%3,9–%7,0 bandında; 31 Ağustos–2 Eylül'de üç günlük bir sıçrama var (%6,8) ve
"önce" penceresi tam o sıçramayı içeriyor. Sayfa taban seviyesinde.

---

## 2. Düşen pilot: limon + mandalina (8 Eylül) — geri alındı

8 Eylül'de iki ürün sayfası bilerek farklı bir başlığa alınmıştı
(`Limon Fiyatları — Hal Listesi ve Çeşitler`, tarihsiz ve fiyatsız). Ölçüm:

| Sayfa | CTR önce (3–7 Eyl) | CTR sonra (9–13 Eyl) | Poz | Tıklama |
|---|---|---|---|---|
| **/urun/limon** (pilot) | %3,00 | **%1,95** | 7,14 → 7,22 | 126 → 65 |
| /urun/mandalina (pilot) | %1,19 | %1,15 | 6,27 → 6,83 | 15 → 7 |
| pilot dışı tüm /urun/* (kontrol) | %2,87 | %2,78 | 6,22 → 6,47 | 1.497 → 1.209 |

Limon'daki düşüş aynı pozisyonda, kontrol grubunun genel eğiliminin (−%3) çok
ötesinde; khi-kare p ≈ 0,005. Mandalina hacmi karar vermeye yetmiyor ama kazanç
da yok. **Pilot kaldırıldı**, iki sayfa da standart kalıba döndü
(`Limon Fiyatları Bugün Kaç TL? 16 Eylül 2026 — Hal ve Toptan` + ortalama fiyat).

---

## 3. Bu turda düzeltilenler

### 3.1 `/firmalar/<şehir>` tutamayacağı sözü veriyordu

Açıklama her şehirde koşulsuz `"<şehir> hal güncel sebze meyve fiyatları."` ile
bitiyordu. Oysa Sivas, Osmaniye, Şanlıurfa, Niğde, Hatay, Samsun gibi şehirlerin
**ETL kaynağı yok** — sayfa yalnızca firma dizini. `sivas hal` sorgusu 5,7.
sırada 236 gösterim alıp **0 tıklama** ediyordu.

Artık fiyat cümlesi yalnız gerçek ve taze veri varsa kuruluyor, varsa somut
rakamla ("Adana hali 16 Eylül 2026: Limon 32,50 TL/kg…"); yoksa sayfanın
gerçekten sunduğu şey yazılıyor. Sayfa gövdesi bu ayrımı zaten yapıyordu
(`"Bu sayfa fiyat verisine bağlı kalmadan gerçek işletme dizini olarak çalışır."`),
yalnız snippet'e yansımıyordu.

### 3.2 `/firmalar/<şehir>` başlığı "telefon" kelimesini taşımıyordu + kırpılıyordu

Bu sayfalara inen aramanın en büyük kalıbı `"<şehir> sebze hali telefon numarası"`
(3–13 Eylül: 1.113 gösterim). Eski başlık `"… — 11 Firma, İletişim & Adres"` idi
ve 60 karakteri aşınca canlıda `"İletişim &…"` diye kırpılıyordu.

Yeni: `Osmaniye Hal Komisyoncuları — 11 Firma Telefon & Adres 2026` (59 karakter).
Uzun şehir adında önce yıl düşer, "Telefon" her adayda korunur. Telefon kapsaması
ölçüldü: Osmaniye 11/11, Sivas 6/6, Mersin 189/200, Konya 55/56 — vaat gerçek.

> Belgenin §4'ü bu kalıbı "niyet uyumsuzluğu" olarak işaretlemişti. Ölçüm katılmıyor:
> telefon sorguları 7,0 pozisyonda **%6,98 CTR** ile sitenin o banttaki
> ortalamasının (%1,85) yaklaşık 3,8 katı. Sorun değil, sınıflandırıcı artefaktı.
> Başlık yine de düzeltildi çünkü kırpma gerçek bir kusurdu.

### 3.3 Bayat hal sayfası açıklamada hâlâ "güncel" diyordu

Başlık dürüsttü (`Mersin Hal Fiyatları — Son Liste 22 Haziran 2026`) ama açıklama
`"güncel meyve sebze hali fiyatları"` vaat ediyordu. Kaynak Altosec WAF nedeniyle
kapalı, veri 86 günlük. Artık taze değilse "son yayımlanan" yazıyor.

**Doğrulama:** `bun run build` EXIT=0, frontend 303/303 test geçiyor
(9'u yeni `src/lib/firm-city-meta.test.ts`).

---

## 4. Ölçüldü, düzeltilmedi — sıradaki iş

### 4.1 Limon kümesi kanibalizasyonu (en büyük kalan kalem)

Aynı sorgu birden çok sayfaya iniyor ve hiçbiri kazanmıyor (3–13 Eylül):

| Sorgu | Toplam gösterim | Tıklama | CTR | Sayfa sayısı |
|---|---|---|---|---|
| adana limon fiyatları | 2.991 | 19 | %0,64 | 4 |
| limon piyasası | 2.310 | 130 | %5,63 | 7 |
| limon fiyatları | 1.653 | 35 | %2,12 | 12 |
| mersin limon fiyatları | 1.630 | 15 | %0,92 | 6 |

Dağılım kendini ele veriyor: `adana limon fiyatları` için `/urun/limon` 2.063
gösterim %0,68 alırken, doğru sayfa `/fiyat/adana/limon` yalnız 367 gösterim
alıyor — ama **%0,82**. `limon fiyatları` sorgusunda fark daha net:
`/fiyat/adana/limon` %3,94, `/urun/limon` %2,06. `limon piyasası` sorgusunda
`/urun/limon` %7,98 alırken `/analiz/…-mersin-erdemli-…` 848 gösterimi %2,00 ile
harcıyor.

Şehir×ürün pilotunun ölçüm tarihi **3 Ekim** (`[[sehir-urun-sayfa-pilotu]]`);
ondan önce sayfa mimarisine dokunulmamalı. O tarihte karar verilecek soru:
şehirli limon sorgularında `/fiyat/<şehir>/limon` kanonik hale getirilip
`/urun/limon` ve `/piyasa/*` bu sorgulardan çekilecek mi.

### 4.2 Örüntü C — snippet değil sayfa gücü işi

Düzeltilmiş snippet'e rağmen bandın altında kalanlar (11 gün, gösterim ≥150):

| Kayıp tık | Sorgu | Sayfa | Poz | CTR | Bant |
|---|---|---|---|---|---|
| 47 | ankara hal fiyatları | /hal/ankara-hal | 3,9 | %2,49 | %6,18 |
| 45 | istanbul hal fiyatları | /hal/istanbul-hal-ibb | 3,9 | %4,09 | %6,18 |
| 25 | mandalina fiyatları | /urun/mandalina | 5,8 | %0,44 | %4,06 |
| 24 | adana limon fiyatları | /urun/limon | 7,4 | %0,68 | %1,85 |
| 20 | kocaeli hal fiyatları | /hal/kocaeli-hal-merkez | 3,3 | %2,55 | %6,18 |
| 13 | izmir hal fiyatları | /hal/izmir-hal | 7,4 | %0,42 | %1,85 |

Toplam 416 kayıp tıklama / 11 gün. Ankara ve İstanbul 3,9. sırada olup banttan
belirgin aşağıdalar; ikisinde de başlık ve açıklama artık doğru kalıpta, yani
kalan fark SERP'in kendisinde (AI Overview / rakip zengin sonuç) aranmalı.
**Bu doğrulanmadı — SERP'e bakılmadı.**

### 4.3 Ölçümün sınırı

Belgenin §5'i doğru: GSC nadir sorguları raporlardan gizler, bu yüzden her kayıp
tıklama sayısı alt sınırdır. Bu belgedeki tüm kıyaslar **eşleşmiş sorgu kümesi**
üzerinde yapıldı, bu yüzden gizlenen kuyruk iki pencereye de aynı şekilde
etki eder; oran karşılaştırması geçerli, mutlak sayı değil.
