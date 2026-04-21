# Frontend Admin Panel

Bu dokuman, vistaseeds admin panel frontend'i icin guncel uygulama standardini ozetler.

Referans dokumanlar:

- `CLAUDE.md`
- `ADMIN_PANEL_RULES.md`
- `README.md`

Bu dosyanin amaci:

- frontend tarafinda hangi standardin uygulanacagini netlestirmek
- yeni ekran eklerken karar vermeyi hizlandirmak
- eski generic admin sablonu aliskanliklarini geri getirmemek

## 1. Hedef Yapi

Admin panel frontend'i su prensiplerle gelistirilir:

- modül bazli organizasyon
- ince route dosyalari
- shared-first teknik mantik
- locale-first metin yonetimi
- explicit barrel
- kebab-case dosya adlandirma

## 2. Modul Yapisi

Yeni bir admin modulu olabildigince su yapida kurulur:

```text
src/app/(main)/admin/(admin)/<module>/
├── page.tsx
├── <module>.tsx
├── [id]/
│   └── page.tsx
└── _components/
    └── ...
```

Kurallar:

- `page.tsx` route girisidir
- `<module>.tsx` ana composition katmanidir
- detay sayfasi varsa `[id]/page.tsx` ile ayrilir
- `_components` sadece modüle ozel UI katmanidir

Referans modul:

- `categories`

## 3. App Katmani

`src/app` altinda:

- page dosyalari ince kalir
- layout dosyalari composition ve wrapper gorevi gorur
- component dosyalari UI orchestration seviyesinde olur

App katmaninda tutulmaz:

- tekrar eden type
- tekrar eden helper
- parser / mapper / formatter
- table/filter/form config
- status map

Bunlar `src/integrations/shared` altina tasinir.

## 4. Shared Katmani

Frontend tarafinda tekrar eden teknik mantik tek noktada tutulur.

Kapsam:

- type
- interface
- helper
- normalizer
- parser
- formatter
- query param helper
- route helper
- locale key helper
- status / badge / option map
- form default/config
- page/module config

Ana kural:

- ayni mantik ikinci kez goruluyorsa shared'e tasinmali

Dis import standardi:

- sadece `@/integrations/shared`
- sadece `@/integrations/hooks`

## 5. Barrel Kullanimi

Bu proje strict barrel mantigi ile yazilir.

Kurallar:

- `src/integrations/shared.ts` explicit barrel olur
- `src/integrations/hooks.ts` explicit barrel olur
- `export *` kullanilmaz
- alt-path import dis kullanimda yasaktir
- bir modulde birden fazla shared dosya varsa lokal `index.ts` acilir

Hedef:

- tek API kapisi
- daha az isim cakismasi
- daha az daginik import

## 6. Import Disiplini

Frontend dosyalarinda importlar da temiz tutulur.

Kurallar:

- ayni kaynaktan gelen importlar birlestirilir
- type/runtime import ayrimi temiz tutulur
- gereksiz derin path importlardan kacınılır
- barrel varken alt dosya import edilmez

Iyi:

```ts
import { getErrorMessage, getAdminNavUrl } from '@/integrations/shared';
```

Kotu:

```ts
import { getErrorMessage } from '@/integrations/shared/errors';
import { getAdminNavUrl } from '@/integrations/shared/navigation/sidebar';
```

## 7. Dosya Adlandirma

Tum yeni dosyalar `kebab-case` olur.

Iyi:

- `admin-theme-client.tsx`
- `site-settings-config.ts`
- `telegram-admin-endpoints.ts`

Kotu:

- `AdminThemeClient.tsx`
- `siteSettingsConfig.ts`
- `telegram.endpoints.ts`

## 8. I18n ve Locale Yapisi

Frontend tarafinda hardcoded metin kullanilmaz.

Tum gorunen metinler locale key ile gelir:

- baslik
- aciklama
- button text
- placeholder
- toast
- dialog
- table header
- empty state
- badge text
- aria label

Dil klasor standardi:

```text
src/locale/<lang>/
├── index.ts
├── not-found.json
└── admin/
    ├── index.ts
    ├── common.json
    ├── sidebar.json
    ├── dashboard.json
    └── <module>.json
```

Kurallar:

- buyuk tek `tr.json` tutulmaz
- modul bazli JSON kullanilir
- ortak metinler `common.json` altinda toplanir
- locale manifest generator ile uretilir
- uygulama locale importunda `@/locale/<lang>` kullanir

## 9. UI ve Tema

Mevcut tema sistemi korunur.

Kurallar:

- mevcut token ve component sistemi bozulmaz
- yeni ekranlar generic admin template gibi yazilmaz
- mevcut shadcn/radix tabanli UI tercih edilir
- wrapper gerekiyorsa ince olur

Yeni UI yazarken:

- proje icindeki button, card, table, dialog, form componentlerini kullan
- yeni primitive icat etmeden once mevcut componentleri kontrol et
- ayni UI pattern'i farkli sekilde ikinci kez yazma

## 10. Sidebar ve Navigation

Sidebar, permission ve route yuzeyi birlikte dusunulur.

Kontrol edilmesi gereken alanlar:

- `src/navigation/sidebar/sidebar-items.ts`
- `src/navigation/permissions.ts`
- ilgili locale dosyalari
- dashboard modul linkleri

Kurallar:

- nav item key'leri tutarli olmali
- permission key'leri ile senkron kalmali
- route bilgisi kopyalanmamali
- coming-soon linkleri aktif menü hesabini bozmamali
- sidebar label'lari locale key ile gelmeli

## 11. Dashboard Modulleri

Dashboard kartlari ile sidebar ayni modül gercegini temsil eder.

Kurallar:

- dashboard route map'i navigation ile uyumlu olmalı
- ayni route farkli dosyalarda kopya string olarak tutulmamali
- dashboard modul label'lari locale key ile gelmeli

## 12. Form ve Table Standardi

Form ve tablo ekranlari en cok tekrar ureten alanlardir.

Bu yuzden:

- field config
- column config
- filter options
- status badge map
- parser/coercion helper
- default state

tekrar ediyorsa shared altina tasinmalidir.

Komponent dosyasi sadece:

- render
- event
- state
- hook baglantisi

tasir.

## 13. Coming Soon Modulleri

Whitelist icinde ama henuz gelismemis ekranlar `coming-soon` sayfasina baglanabilir.

Kurallar:

- sidebar baglantisi kontrollu olur
- query parametreleri aktif menü hesabinda dogru ele alinir
- locale label'lari eksik birakilmaz

## 14. Yeni Modul Ekleme Akisi

Frontend tarafinda onerilen sira:

1. modul route ve scope belirlenir
2. locale anahtarlari planlanir
3. shared type/helper/config yazilir
4. lokal barrel gerekiyorsa eklenir
5. kok barrel guncellenir
6. endpoint ve hooks baglanir
7. app modul yapisi kurulur
8. sidebar/permission entegrasyonu eklenir
9. hardcoded metin taramasi yapilir
10. type-check ve build alinir

## 15. Dogrulama

Frontend degisikliklerinden sonra mumkun oldugunda su kontroller yapilir:

- `bun run locales:generate`
- `bun x tsc --noEmit --incremental false --pretty false`
- `bun run build`

Not:

- stale `.next/types` bazen yalanci TypeScript hatasi uretebilir
- bu durumda build sonrasi tekrar `tsc` alinip net durum gorulmelidir

## 16. Yapilmamasi Gerekenler

- component icinde helper biriktirmek
- endpoint icinde type/helper tutmak
- page icinde config tutmak
- `export *` kullanmak
- alt-path import ile daginik baglanti kurmak
- hardcoded metin yazmak
- buyuk tek locale dosyasina geri donmek
- karisik naming ile dosya acmak
- generic admin sablonu kalintilarini yeniden uretmek

## 17. Sonuc

vistaseeds admin panel frontend'i icin dogru calisma modeli:

- modül bazli
- shared-first
- locale-first
- strict barrel
- kebab-case
- ince route ve endpoint dosyalari

Bu standard korundugu surece yeni moduller daha hizli ve daha temiz eklenir.
