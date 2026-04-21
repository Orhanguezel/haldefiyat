# Admin Panel Kurallari

Bu dosya vistaseeds `admin_panel` icin zorunlu gelistirme kurallarini tanimlar. Yeni modül, endpoint, page, component veya helper eklenirken bu kurallara uyulmasi gerekir.

## 1. Tekrar Yasak

- Endpoint dosyalari icinde endpoint tanimi disinda type, interface, helper, query builder, normalizer, sabit veya utility yazilmaz.
- `app` altindaki page, layout ve component dosyalari icinde tekrar kullanilabilecek type, helper, mapper, formatter veya sabit yazilmaz.
- Ayni mantik ikinci kez goruluyorsa shared altina tasinir.
- Ayni fonksiyon farkli isimle ikinci kez yazilmaz.
- Ayni helper mantigi alias veya ufak isim degisikligi ile kopyalanmaz.
- Tek is yapan fonksiyonun tek kaynagi olur; tum kullanimlar o kaynagi import eder.

## 2. Shared Zorunlulugu

- Tekrar kullanilan tum type ve interface tanimlari `src/integrations/shared` altinda tutulur.
- Tekrar kullanilan tum helper ve normalizer fonksiyonlari `src/integrations/shared` altinda tutulur.
- Endpoint base path sabitleri de endpoint dosyasi icinde degil, ilgili `shared` modul dosyasinda tanimlanir.
- Component seviyesinde kullanilan ortak UI type/helper sabitleri de uygun shared modulune tasinmalidir.
- `app` altinda kullanilan ortak page config, table config, filter config, status map ve form schema benzeri tekrarli yapilar da uygun shared modulune tasinmalidir.

## 3. Barrel Zorunlulugu

- Shared altindaki exportlar barrel uzerinden acilir.
- Yeni eklenen shared dosyasi `src/integrations/shared.ts` icine eklenmeden kullanima alinmaz.
- Gerekliyse alt klasor icin `index.ts` barrel olusturulur ve disariya tek noktadan export verilir.
- Ayni export adi iki farkli shared dosyadan disariya acilmaz.
- Tek isim tek kaynak prensibi uygulanir. Ornegin `cleanParams` gibi bir helper sadece tek dosyada tanimli olur ve barrel o tek kaynagi export eder.
- `src/integrations/shared.ts` ve `src/integrations/hooks.ts` dosyalarinda `export *` kullanilmaz.
- Kök barrel dosyalari explicit export listesi ile yazilir.
- Bir modul klasoru altinda birden fazla dosya varsa lokal `index.ts` barrel acilir.
- Kök barrel dosyasi dogrudan daginik alt dosyalari degil, mumkun oldugunca modul `index.ts` dosyalarini hedefler.
- Referans uygulama olarak `src/integrations/shared/users/index.ts` ve `src/integrations/shared/telegram/index.ts` yapisi izlenir.
- `export *` kullanimi name collision uretiyorsa explicit export'a gecilir ve cakisma zorunlu olarak temizlenir.
- Bu standart sadece bu proje icin degil, sonraki projelerde de referans olarak kullanilir.
- Uygulama katmaninda dis import icin sadece `@/integrations/shared` kullanilir.
- `@/integrations/shared/...` alt-path import kullanilmaz.
- Uygulama katmaninda hook import icin sadece `@/integrations/hooks` kullanilir.
- `@/integrations/hooks/...` alt-path import kullanilmaz.
- Alt-path import sadece barrel dosyalarinin kendi ic organizasyonunda kullanilir.

## 3.1 Lokal Barrel Zorunlulugu

- Bir modülun `shared` veya `_components` tarafinda birden fazla yardimci dosya olusuyorsa lokal `index.ts` acilir.
- Modül ici daginik helper importlari yerine mumkun oldugunca lokal barrel kullanilir.
- Lokal barrel de explicit export listesi ile yazilir; `export *` kullanilmaz.
- Kök barrel ile lokal barrel ayni anda gevsek kullanilmaz; dis API tek noktadan, modül ici API tek lokal barrel uzerinden akar.

## 3.2 Type Disiplini

- `any` kullanimi yasaktir.
- Zorunlu daraltma gereken yerde `unknown` + type guard kullanilir.
- `as any` gecici kacis olarak da yazilmaz.
- Yeni helper/component yazarken type gevsekligi yerine once ortak type tanimi `shared` altina tasinir.

## 4. Endpoint Dosyasi Formati

Bir endpoint dosyasi sunlari yapabilir:

- `baseApi.injectEndpoints(...)`
- RTK Query hook exportlari
- Gerekirse endpoint api nesnesi exportu

Bir endpoint dosyasi sunlari yapmaz:

- local interface/type tanimi
- local helper fonksiyonu
- local normalizer
- local query param temizleyici
- local response unwrap mantigi
- local sabit/base path tanimi

Bunlarin tamami `shared` altina tasinir.

## 5. Component Dosyasi Formati

Bir component dosyasi icinde sadece su seviyede kod bulunur:

- component render mantigi
- local state
- event handler
- UI compositon

Su tip seyler component icinde kalici yazilmaz:

- tekrar kullanilabilir type/interface
- response donusturme mantigi
- text/label mapper
- status helper
- parsing/coercion helper
- ortak table/filter config

Tekrara dusen her sey `shared` altina alinur.

## 6. App Katmani Kurali

`src/app` altindaki dosyalar da ayni disiplinle yazilir.

### Page dosyalari

- page dosyasi sadece route girisi olur
- veri cekme, component birlestirme ve minimal sayfa wiring yapar
- local type/helper/sabit tutmaz

### Layout dosyalari

- sadece layout composition, auth gate ve route-level wrapper mantigi tutar
- tekrarli route metadata veya menu config yazmaz

### App component dosyalari

- sadece UI orchestration, event handling ve state akisi tutar
- tekrar kullanilabilir mapper, formatter, normalizer, schema veya config barindirmez

### App icinde ne yazilmaz

- tekrar kullanilabilir interface/type
- ortak status label map
- ortak badge variant map
- ortak table column config
- ortak filter option listesi
- ortak form default values
- ortak parser veya converter helper

Bunlar uygun yere tasinir:

- domain type/helper ise `src/integrations/shared`
- saf UI config ise modül bazli shared/config dosyasi
- tekrar kullanilan component ise `_components` altinda ama logic tekrar etmeyecek sekilde

## 6.1 Navigation Kurali

- Sidebar, permissions, dashboard card route'lari ve locale key'leri birbiriyle senkron kalir.
- Bir modül nav'a eklendiginde su yuzeyler birlikte kontrol edilir:
  - `src/navigation/sidebar/...`
  - `src/navigation/permissions.ts`
  - ilgili locale dosyasi
  - varsa dashboard modül kartlari
- Whitelist icinde olup henuz hazir olmayan moduller `coming-soon` sayfasina baglanabilir.
- `coming-soon` query parametreli linkleri aktif menu hesabini bozmamalidir.
- Sidebar item title key, route ve permission key daginik sabitler olarak ikinci kez yazilmaz; ortak helper/config uzerinden yonetilir.

## 7. Modul Ekleme Kurali

Yeni admin modulu eklenirken sira su olmalidir:

1. ilgili `shared` type/helper/sabit dosyalarini yaz
2. modul klasoru birden fazla shared dosya iceriyorsa lokal `index.ts` barrel ac
3. gerekli explicit barrel exportlarini ekle
4. endpoint dosyasini sadece endpoint tanimi ile yaz
5. `app` altindaki page/componentleri shared import edecek sekilde kur
6. ayni mantigin ikinci kopyasi var mi kontrol et

Not:

- Yeni modül eklerken mevcut explicit barrel mimarisi bozulmaz.
- `shared.ts` veya `hooks.ts` icine yildiz export eklenmez.
- Yeni modul once lokal barrel, sonra kok barrel mantigi ile sisteme dahil edilir.

## 8. Modul Klasor Standardi

Admin modullerinde referans mimari `categories` modulu kabul edilir.

Ornek standart:

- `src/app/(main)/admin/(admin)/categories/page.tsx`
- `src/app/(main)/admin/(admin)/categories/categories.tsx`
- `src/app/(main)/admin/(admin)/categories/[id]/page.tsx`
- `src/app/(main)/admin/(admin)/categories/_components/...`

Yeni bir admin modulu mumkun oldugunca bu yapiyla yazilir:

- `page.tsx`
  Route entry.
- `<module>.tsx`
  Sayfa composition katmani.
- `[id]/page.tsx`
  Detay route girisi.
- `_components/`
  Modüle ozel UI componentleri.

Kurallar:

- Her modulun tek bir ana giris dosyasi olur: `<module>.tsx`
- Route dosyalari ince olur, UI mantigi `_components` veya `<module>.tsx` icine dagitilir
- Modül disinda tekrar kullanilabilecek logic `_components` icinde tutulmaz, `shared`e tasinir
- Detay sayfalari ayri route klasoru altinda durur: `[id]/page.tsx`
- Dosya adlari `kebab-case` olur
- Modül klasoru icinde dağinik ve rastgele isimlendirme yapilmaz
- Tum yeni moduller ayni klasor semasini izler

## 9. I18n ve Metin Kurali

Admin panelde sayfa veya component icinde hardcoded statik metin yazilmaz.

Kurallar:

- Sayfa icinde kelime veya cumle bazli sabit text bulunmaz
- Buton, baslik, aciklama, label, placeholder, toast mesaji, tablo basligi ve bos-durum metinleri locale key ile gelir
- Anahtarlar locale modul dosyalarinda tutulur
- Referans kaynak `src/locale/tr/` klasor yapisi olur
- Yeni bir metin eklenecekse once ilgili locale modul dosyasina anahtar eklenir, sonra component icinde bu anahtar kullanilir
- Teknik helper, mapper, option builder ve locale key compose mantigi locale dosyasina degil `shared` altina yazilir
- Locale dosyasi sadece metin ve key-value icerigi tasir

Amac:

- Yeni dil eklemeyi kolaylastirmak
- Var olan dili toplu guncelleyebilmek
- Modül tasinirken veya yeniden adlandirilirken metinleri koddan ayirmak
- Hardcoded metin daginikligini engellemek

Locale klasor standardi:

- Her dil `src/locale/<lang>/` klasoru altinda tutulur
- Kök birlestirme noktasi `src/locale/<lang>/index.ts` olur
- Ortak metinler `common.json` icinde, modul metinleri modul adli JSON dosyalarinda tutulur
- Admin metinleri modul bazli parcalanir; tek ve buyuk `tr.json` benzeri dosya tutulmaz
- Gereksiz veya whitelist disi modullerin locale dosyalari sisteme tasinmaz
- Yeni dil eklemek icin ayni klasor semasi ile yeni bir dil klasoru acmak yeterlidir
- Uygulama kodu locale importunda tek giris olarak `@/locale/<lang>` kullanir
- Locale manifest dosyasi generator ile uretilir; elle duzenlenmez

## 9.1 Locale Modulleme Kurali

- Tek ve buyuk locale JSON dosyasi yeniden uretilmez.
- Ortak metinler `common.json` icine, modul metinleri ilgili modul JSON dosyasina yazilir.
- Yeni ekran eklenirken once locale modul dosyasi acilir, sonra kod baglanir.
- Whitelist disi veya silinmis modullerin locale dosyalari da sistemde birakilmaz.

Yasaklar:

- JSX icinde dogrudan sabit metin yazmak
- Toast veya dialog mesajlarini inline string ile vermek
- Ayni metni farkli componentlerde tekrar string olarak yazmak

Istisna sadece teknik zorunluluk veya gecici debug metnidir. Bu da kalici kodda birakilmaz.

## 10. Kod Inceleme Kontrolu

PR veya commit oncesi su sorular zorunlu kontrol edilir:

- Bu type endpoint/page/component icinde mi duruyor?
- Bu helper shared altina alinmali miydi?
- Bu fonksiyonun ayni isi yapan baska bir versiyonu baska isimle var mi?
- Ayni query temizleme veya unwrap mantigi baska yerde var mi?
- Ayni status map veya table/filter config baska ekranda tekrar ediyor mu?
- Yeni dosya barrel exporta eklendi mi?
- Modul klasoru icin lokal `index.ts` gerekiyorsa eklendi mi?
- Barrel uzerinde ayni isim iki farkli yerden export ediliyor mu?
- Kök barrel explicit export ile mi yazildi?
- `shared.ts` veya `hooks.ts` icine yanlislikla `export *` eklendi mi?
- Endpoint dosyasinda endpoint disi kod kaldi mi?
- Page/component dosyasinda shared'e tasinmasi gereken tekrarli kod kaldi mi?
- Modul klasor yapisi `categories` referansina uyuyor mu?
- Dosya adlari `kebab-case` mi?
- Lokal `index.ts` barrel gerektiren yeni helper/component grubu dogru acildi mi?
- `any` veya `as any` eklendi mi?
- Tum statik metinler locale JSON uzerinden mi geliyor?
- Yeni eklenen text key'leri ilgili `src/locale/<lang>/...` modul dosyasina yazildi mi?
- Sidebar/permission/route/locale key senkronu korundu mu?
- `bun run build` ve type-check temiz mi?

Bu sorulardan herhangi birine problemli cevap veriliyorsa kod tamamlanmis sayilmaz.
