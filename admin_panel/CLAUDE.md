# CLAUDE.md - vistaseeds Admin Panel

Bu dosya, vistaseeds `admin_panel` icin calisirken izlenecek guncel gelistirme kurallarini ve proje standartlarini toplar.

Bu dosya referans niteligindedir. Kod yazarken esas alinacak yapilar:

- `ADMIN_PANEL_RULES.md`
- `README.md`
- mevcut uygulama dizin yapisi
- `src/integrations/shared.ts`
- `src/integrations/hooks.ts`

## 1. Proje Durumu

Bu proje vistaseeds admin panelidir.

Guncel teknik yapi:

- Next.js `15.1.x`
- React `19.x`
- Tailwind CSS `4.x`
- Redux Toolkit + RTK Query
- React Hook Form + Zod
- Biome
- App Router

Notlar:

- Eski marka referanslari, generic admin sablonu kalintilari ve whitelist disi modul kalintilari gecerli standart degildir.
- Bu dokuman sadece mevcut vistaseeds yapisini anlatir.
- Burada yazan kurallar kod tabaninda uygulanmis standartlarla uyumlu tutulmalidir.

## 2. Genel Mimari

Kod tabani su prensiple ilerler:

- endpoint dosyalari ince olur
- page dosyalari ince olur
- component dosyalari UI orchestration seviyesinde kalir
- tekrar eden type, helper, mapper, formatter, normalizer, query builder ve config yapilari disari alinir
- ortak kod tek kaynakta tutulur

Ana hedef:

- tekrar eden mantigi sifirlamak
- moduller arasi tutarliligi korumak
- yeni ekran eklerken mevcut standardi bozmayi engellemek

## 3. Shared-First Kurali

Tekrar kullanilan tum domain tipi ve helper mantigi `src/integrations/shared` altinda tutulur.

Buraya tasinacak seyler:

- type
- interface
- enum benzeri sabit listeler
- config bloklari
- mapper
- normalizer
- parser
- formatter
- query param helper
- status helper
- table/filter/form config
- ortak UI type/helper yapilari

Yazilmamasi gereken yerler:

- endpoint dosyasi ici
- `page.tsx`
- route `layout.tsx`
- `_components` altinda tekrar eden mantik

Kural:

- bir mantik ikinci kez goruluyorsa `shared` altina tasinmali
- ayni fonksiyon farkli isimle ikinci kez yazilmamali
- ayni helper alias veya ufak isim degisikligi ile kopyalanmamali
- tek is yapan kodun tek kaynagi olmali

## 4. Barrel Disiplini

Bu proje gevsek export mantigi ile degil, siki barrel mantigi ile ilerler.

Kurallar:

- `src/integrations/shared.ts` explicit barrel olur
- `src/integrations/hooks.ts` explicit barrel olur
- bu iki dosyada `export *` kullanilmaz
- uygulama kodu dis importlarda sadece `@/integrations/shared` ve `@/integrations/hooks` kullanir
- `@/integrations/shared/...` alt-path import dis kullanimda yasaktir
- `@/integrations/hooks/...` alt-path import dis kullanimda yasaktir
- alt-path import sadece barrel dosyalarinin kendi ic organizasyonunda kabul edilir

Modul bazli lokal barrel kurali:

- bir shared modulunde birden fazla dosya varsa lokal `index.ts` acilir
- kok barrel dogrudan daginik alt dosyalari degil, mumkun oldugunca lokal `index.ts` dosyalarini hedefler

Ornek yaklasim:

- `src/integrations/shared/users/index.ts`
- `src/integrations/shared/telegram/index.ts`
- `src/integrations/shared/site-settings/index.ts`

Ama dis kullanimda yine sadece sunlar kullanilir:

- `@/integrations/shared`
- `@/integrations/hooks`

Ek zorunlu kural:

- modül icinde yardimci dosya sayisi buyurse lokal `index.ts` barrel acilir
- lokal barrel de explicit yazilir
- `export *` yoktur

## 5. Endpoint Kurali

Endpoint dosyalari sadece endpoint tanimi yapar.

Endpoint dosyasinda bulunabilecek seyler:

- `baseApi.injectEndpoints(...)`
- endpoint api nesnesi
- RTK Query hook exportlari

Endpoint dosyasinda bulunmamasi gereken seyler:

- local type
- local interface
- local helper
- local normalizer
- local query builder
- local response unwrap mantigi
- local sabit
- local base path

Bunlarin tamami `src/integrations/shared` altina tasinmalidir.

Hedef:

- endpoint dosyasi endpoint harici bilgi tasimaz
- endpoint dosyasi okununca sadece API kontrati gorulur

## 6. App Katmani Kurali

`src/app` altinda da ayni disiplin uygulanir.

### Page dosyalari

- sadece route girisi olur
- veri cekme ve sayfa wiring yapar
- local helper veya sabit tutmaz

### Layout dosyalari

- sadece composition ve route wrapper mantigi tutar
- tekrar eden menu/config/helper tasimaz

### Component dosyalari

- sadece render
- local state
- event handling
- UI composition

Component icinde kalici olarak tutulmaz:

- tekrar eden type
- tekrar eden helper
- tekrar eden parser
- tekrar eden status map
- tekrar eden badge map
- tekrar eden filter config
- tekrar eden table config
- tekrar eden form default/config

## 7. Modul Klasor Standardi

Admin modullerinde referans mimari `categories` moduludur.

Beklenen yapi:

- `src/app/(main)/admin/(admin)/<module>/page.tsx`
- `src/app/(main)/admin/(admin)/<module>/<module>.tsx`
- gerekiyorsa `src/app/(main)/admin/(admin)/<module>/[id]/page.tsx`
- `src/app/(main)/admin/(admin)/<module>/_components/...`

Kurallar:

- her modulun tek ana giris dosyasi olur
- route dosyalari ince olur
- modül disinda tekrar kullanilabilecek mantik `_components` icinde tutulmaz
- detay sayfasi `[id]` route'u ile ayrilir
- daginik dosya organizasyonu yapilmaz

## 8. Dosya Adlandirma

Tum yeni dosyalar `kebab-case` olur.

Kurallar:

- `admin-theme-client.tsx` dogru
- `AdminThemeClient.tsx` yanlis
- `theme.types.ts` yerine `theme-types.ts` tercih edilir
- `telegram.endpoints.ts` yerine `telegram-endpoints.ts` tercih edilir

Gecerli standart:

- gercek dosya adlari `kebab-case`
- klasor adlari da tutarli olur
- eski generic veya camel/pascal/dot agirlikli adlandirma yeniden uretilmez

Ek kural:

- typo veya eski ad tasiyan dosya yeniden uretilmez
- yorum basliginda `FILE:` kullaniliyorsa gercek path ile birebir uyusur

## 9. I18n ve Dil Yapisi

Admin panelde hardcoded statik metin yazilmaz.

Kurallar:

- buton metinleri
- basliklar
- aciklamalar
- label'lar
- placeholder'lar
- toast mesajlari
- dialog metinleri
- tablo basliklari
- bos durum metinleri
- badge label'lari

locale key uzerinden gelir.

### Locale klasor standardi

Her dil su yapida tutulur:

- `src/locale/<lang>/index.ts`
- `src/locale/<lang>/not-found.json`
- `src/locale/<lang>/admin/index.ts`
- `src/locale/<lang>/admin/common.json`
- `src/locale/<lang>/admin/<module>.json`

Kurallar:

- tek ve buyuk `tr.json` benzeri dosya tutulmaz
- admin metinleri modul bazli parcalanir
- ortak alanlar `common.json` altina alinir
- gereksiz veya whitelist disi modul locale dosyalari tasinmaz
- locale manifest generator ile uretilir
- generator ciktisi elle duzenlenmez
- uygulama locale importunda `@/locale/<lang>` kullanir

Yeni dil eklerken:

- yeni bir dil klasoru ac
- ayni modul semasini uygula
- `index.ts` ile birlestir
- locale generator calissin

### I18n ile shared iliskisi

Sadece metin key'leri locale dosyalarina gider.

Asagidakiler gerekiyorsa `shared` altina gider:

- locale key ureten helper
- key prefix helper
- select option config
- field config
- status-to-locale-key mapper
- nav key helper

Yani:

- metinlerin kendisi locale dosyasinda
- bu metinleri secen veya mapleyen teknik mantik `shared` altinda

## 10. Import Disiplini

Importlarda da tekrar ve daginiklik engellenir.

Kurallar:

- ayni dosyadan gelen importlar birlestirilir
- ayni namespace farkli satirlarda gereksiz tekrar edilmez
- type import ile runtime import ayrimi temiz tutulur
- gereksiz direct-path import yerine kok barrel kullanilir
- component dosyasi gereksiz sayida farkli alt kaynaga dagilmaz

Hedef:

- import yuzu net olmali
- hangi katmanin dis API oldugu acik olmali
- alt dosyalara bagimli daginik import aliskanligi olusmamali

## 11. Navigation ve Yetki Yuzeyi

Sidebar, permission ve route yuzeyi birbiriyle uyumlu kalmalidir.

Kurallar:

- nav item key'leri permission key'leri ile senkron olmali
- sidebar route'lari tek kaynaktan turetilmeli
- coming-soon route'lari da aktif menu hesabina uygun olmali
- sidebar item label'lari locale key ile gelmeli
- dashboard ve sidebar ayni route bilgisini kopyalamamali

Bu yuzeyde degisiklik yapildiginda su alanlar beraber kontrol edilir:

- `src/navigation/sidebar/sidebar-items.ts`
- `src/navigation/permissions.ts`
- ilgili locale dosyalari
- dashboard modül linkleri

## 12. Theme ve UI Kurali

Mevcut tema sistemi korunur ama yeni UI kodu generic admin sablonu gibi yazilmaz.

Kurallar:

- proje icindeki theme token sistemine uyulur
- mevcut tasarim dili bozulmaz
- yeni component eklerken mevcut UI primitive'leri tercih edilir
- wrapper component gerekiyorsa ince tutulur

Yeni UI eklerken:

- tema token'larini kullan
- mevcut shadcn/radix tabanli yapidan cikma
- gereksiz yeni abstraction katmani ekleme

## 13. Coming Soon ve Faz Yonetimi

Gercek ekrani hazir olmayan ama whitelist icinde kalan moduller `coming-soon` sayfasina baglanabilir.

Kurallar:

- gercek route yoksa sidebar baglantisi kontrollu bicimde `coming-soon`a gider
- query parametreli coming-soon baglantilarinda aktif menü durumu dogru hesaplanir
- locale label'lari eksik birakilmaz

## 14. Dogrulama Rutini

Kod yazildiktan sonra mumkun oldugunda su kontroller yapilir:

- `bun run locales:generate`
- `bun x tsc --noEmit --incremental false --pretty false`
- `bun run build`

Not:

- bu projede `tsc` bazen stale `.next/types` yuzunden yalanci hata uretebilir
- bu durumda build sonrasi `tsc` tekrar alinip net sonuc gorulmelidir
- build sirasinda backend baglantisi yoksa `127.0.0.1:8078` benzeri fetch warning'leri gorulebilir
- bu warning tek basina locale, sidebar veya shared refactor hatasi anlamina gelmez

## 15. Yeni Modul Ekleme Sirasi

Yeni bir admin modulu eklenirken onerilen sira:

1. locale anahtarlarini planla
2. gerekli shared type/helper/config dosyalarini yaz
3. lokal `index.ts` barrel gerekiyorsa ekle
4. kok barrel exportlarini guncelle
5. endpoint dosyasini yaz
6. `hooks.ts` explicit exportlarini ekle
7. app modul yapisini `categories` standardinda kur
8. sidebar/permission/route entegrasyonunu ekle
9. hardcoded metin birakma
10. type-check ve build dogrulamasini yap

## 16. Kisa Kontrol Listesi

Bir degisiklik tamamlanmadan once su sorular sorulur:

- endpoint dosyasinda endpoint disi kod var mi?
- component veya page icinde shared'e tasinmasi gereken helper var mi?
- ayni isi yapan ikinci bir helper baska isimle yazildi mi?
- `shared.ts` veya `hooks.ts` explicit mi?
- `export *` eklendi mi?
- alt-path import dis kullanimda kullanildi mi?
- dosya adlari `kebab-case` mi?
- locale key'ler ilgili modul locale dosyasina yazildi mi?
- hardcoded metin kaldi mi?
- route, sidebar ve permission yuzeyi senkron mi?
- build ve type-check alindi mi?

Bu sorulardan biri problemliyse is tamamlanmis sayilmaz.
