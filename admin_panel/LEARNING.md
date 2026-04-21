# LEARNING.md - vistaseeds Admin Panel Ogrenimleri

Bu dosya, projede tekrar tekrar dogrulanan mimari kararlarin kisa ozetidir.

Amac:

- ayni hatalari tekrar etmemek
- yeni modül eklerken hizli kontrol noktasi vermek
- kodu zamanla tekrar generic admin sablonuna cevirmemek

## 1. En Onemli Ogrenim

Hizli gelismenin bedeli dağiniklik oluyor.

Bu projede en dogru sonuc su yaklasimla alindi:

- once modul yapisini kur
- sonra shared katmanini cikar
- sonra locale anahtarlarini ayir
- sonra sidebar/permission/route senkronunu kur
- en son build ve type-check ile kilitle

Tersi yapildiginda:

- endpoint icine helper kaciyor
- component icine type/helper birikiyor
- locale dagiliyor
- ayni mantik iki uc yerde tekrar ediyor

## 2. Shared-First Her Zaman Kazandiriyor

Tekrar eden mantigi component veya endpoint icinde birakmak kisa vadede hizli gorunuyor ama orta vadede maliyet yaratıyor.

En cok tekrar eden alanlar:

- query param helper
- normalize / coercion helper
- response unwrap mantigi
- status map
- filter option listesi
- table config
- form default state
- locale key mapper
- route/key config

Bu alanlar `src/integrations/shared` altina tasindiginda:

- dosyalar inceliyor
- test etmek kolaylasiyor
- import yuzeyi netlesiyor
- yeni modül eklemek hizlaniyor

## 3. Endpoint Dosyasi Ince Olmali

Bu projede en cok temizlenen katman endpoint dosyalari oldu.

Dogru model:

- endpoint dosyasinda sadece endpoint tanimi
- type/helper/base constant/shared config disarida

Yanlis model:

- endpoint dosyasi icinde local interface
- endpoint dosyasi icinde local `cleanParams`
- endpoint dosyasi icinde local response parser

Sonuc:

- endpoint disi her sey shared'e tasinmali

## 4. Barrel Gevsek Olursa Kod Dagiliyor

Bu projede en kritik kararlardan biri siki barrel disiplini oldu.

Kalici ders:

- `export *` rahatlik saglar ama isim cakismasi gizler
- explicit export daha serttir ama uzun vadede daha dogrudur
- dis kullanimda tek import kapisi olmak bakimi kolaylastirir

Uygulanan karar:

- sadece `@/integrations/shared`
- sadece `@/integrations/hooks`
- dis kullanimda alt-path import yok

Bu sayede:

- ortak API yuzeyi net kaldi
- tekrar eden helper daha kolay fark edildi
- isim cakismalari erken goruldu

## 5. Kebab-Case Standarti Gercekten Gerekli

Farkli naming stilleri karisinca arama, refactor ve import takibi zorlasiyor.

Bu projede net karar:

- tum yeni dosyalar `kebab-case`
- dot-agirlikli eski dosya adlari temizlenir
- pascal/camel dosya adi uretmeyiz

Bu sadece estetik degil:

- import stabilitesi saglar
- arama sonucunu sadeleştirir
- modül standardini korur

## 6. `categories` Referans Modül Olarak Dogru Secim

Modul yapisi icin en saglikli referans `categories` oldu.

Ogrenim:

- modül ana dosyasi ayrilmali
- page route ince olmali
- detay route `[id]` altina ayrilmali
- `_components` sadece modül UI katmani olmali

Bu iskelet diger modullere tasindiginda kaos azaldi.

## 7. Locale Dosyalari Parcalanmadan Buyuyor

Tek `tr.json` yaklasimi bir noktadan sonra bakimsiz hale geliyor.

Bu projede dogru yaklasim su oldu:

- `src/locale/<lang>/`
- `index.ts`
- modul bazli JSON dosyalari
- `common.json`

Ogrenim:

- metinler locale dosyasinda olmali
- ama locale secme / key mapleme mantigi shared'de olmali
- buyuk JSON dosyasi yerine modul bazli locale dosyalari bakimi kolaylastiriyor

## 8. Hardcoded Metinler En Cok UI'da Kaciyor

En cok kacak veren alanlar:

- toast mesajlari
- placeholder'lar
- tablo kolonlari
- dialog aciklamalari
- empty state metinleri
- select option label'lari
- aria label'lari

Bu yuzden yeni modül yazarken sadece gorunen basliklari degil bu alanlari da kontrol etmek gerekiyor.

## 9. Sidebar, Permission ve Route Ayrı Ayrı Dusunulmemeli

Bu projede navigation tarafinda gorulen en onemli ders:

- sidebar key
- permission key
- route
- locale label

ayri ayri yonetilirse kopuyor.

Dogru model:

- key seti senkron
- route bilgisi tek kaynakta
- label key mantigi tutarli
- coming-soon linkleri bile aktif menu hesabina uygun

## 10. Dashboard da Sidebar ile Uyumlu Olmali

Dashboard modül kartlari ile sidebar farkli route sabitleri tasidiginda kopukluk oluyor.

Bu projede ogrenilen sey:

- dashboard linkleri de navigation kaynagindan turetilmeli
- ayni modül icin iki farkli href sabiti tutulmamali

## 11. Build Sonucu Her Zaman Ilk Hata Yeri Degil

Bu projede iki tip durum goruldu:

- gercek kod hatasi
- stale `.next/types` veya build cache kaynakli yalanci hata

Bu nedenle:

- sadece tek bir `tsc` ciktisina bakip karar verilmez
- gerekirse build sonrasi tekrar `tsc` alinir
- locale generator ve build zinciri birlikte dusunulur

## 12. Kisa Uygulama Formulu

Yeni modül eklerken en guvenli sira:

1. route ve modul scope netlesir
2. locale key yapisi planlanir
3. shared type/helper/config yazilir
4. lokal barrel gerekiyorsa eklenir
5. kok barrel exportlari guncellenir
6. endpoint yazilir
7. hooks exportlari acilir
8. app modulu `categories` standardinda kurulur
9. sidebar/permission/route eklenir
10. hardcoded metin taranir
11. build ve type-check alinir

## 13. Kacınılacak Seyler

- endpoint icinde helper yazmak
- component icinde tekrar eden type yazmak
- page icinde config tutmak
- ayni helper'i baska isimle tekrar yazmak
- `export *` ile kolaycilik yapmak
- alt-path import aliskanligi
- `tr.json` gibi buyuk tek locale dosyasina geri donmek
- dosya adlarini karisik naming ile acmak
- generic admin sablonu kalintilarini yeni kodda tasimak

## 14. Sonuc

Bu proje icin en dogru calisma bicimi:

- ince dosya
- tek kaynak
- strict barrel
- kebab-case
- locale-first metin yonetimi
- shared-first teknik mantik

Bu standard bozulursa kod hizla tekrar dagiliyor.
