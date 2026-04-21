# vistaseeds Admin Panel

Gelistirme kurallari icin:

- [ADMIN_PANEL_RULES.md](ADMIN_PANEL_RULES.md)

Ozellikle yeni modül eklerken `shared` zorunlulugu, barrel kullanimi ve endpoint/component icinde helper-type tekrarinin yasak oldugu kurali uygulanir.

Kalici standartlar:

- `src/integrations/shared.ts` ve `src/integrations/hooks.ts` explicit barrel olarak tutulur, `export *` kullanilmaz.
- Bir modul klasoru altinda birden fazla shared dosya varsa lokal `index.ts` barrel acilir.
- Yeni moduller once lokal barrel, sonra kok barrel mantigi ile sisteme dahil edilir.
- Referans alt-barrel ornekleri: `src/integrations/shared/users/index.ts`, `src/integrations/shared/telegram/index.ts`
- Uygulama kodu dis importlarda sadece `@/integrations/shared` ve `@/integrations/hooks` kullanir.
- Alt-path importlar dis kullanimda yasaktir.
- Locale yapisi `src/locale/<lang>/` klasor standardi ile kurulur.
- Her dil klasorunde `index.ts` birlestirme noktasi bulunur; ortak metinler `common.json`, modul metinleri modul bazli JSON dosyalarinda tutulur.
- Uygulama locale importunda `@/locale/<lang>` kullanir; tek ve buyuk `tr.json` benzeri dosyalar tutulmaz.
- Bu mimari bu proje icin referanstir; yeni eklenecek modullerde ve sonraki benzer projelerde ayni yaklasim uygulanir.
