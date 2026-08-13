# Ortak UI ve global kabuk kabulü — 14 Ağustos 2026

## Uygulanan ortak sözleşmeler

- `Input`, `TextArea`, `Combobox` ve geriye uyumlu `SearchableSelect` tek label/hint/error/required ve ARIA sözleşmesine bağlandı. SearchableSelect içindeki ikinci combobox uygulaması kaldırıldı.
- `Badge` semantik brand/success/warning/danger/info/muted varyantlarını border + zemin + metinle verir. `FreshnessBadge`, anlaşılır tarih metni ve Lucide ikonuyla bu ortak bileşeni kullanır; anlam yalnız renge bağlı değildir.
- `PriceTable` masaüstünde semantik tablo, mobilde ürün/hal/şehir, ortalama, birim, min-maks, tarih, kaynak ve tazelik içeren `<article>` + `<dl>` kartları gösterir.
- `StatusState` empty/error/offline/loading durumlarını ortak rol, ikon, başlık, açıklama ve opsiyonel aksiyonla tanımlar.
- Reklam alanı `<aside aria-label="Reklam" data-content-type="advertisement">` ve görünür `Reklam · Sponsorlu` etiketi kullanır.
- Arama ve alarm modalları ortak focus trap, ilk odak, Escape, body scroll lock ve kapanınca tetikleyiciye focus dönüşü kullanır.
- Mobil header'da arama 44×44 görünür butondur; menü içine saklanmaz. Tema düğmesi 44×44, dinamik erişilebilir ad ve `aria-pressed` taşır.
- Footer marka + Fiyat ve Veri + Pazar ve Hizmet + Kurumsal + Yasal ve İletişim gruplarına ayrıldı; metodoloji, düzeltme ve künye bağlantıları globaldir.

## Build ve canlı kabul

- Next.js 16.2.12 production build: başarılı.
- Release: `eb4ccd41`; PM2 reload sonrası frontend hazır.
- `/fiyatlar`, 390×844: 100 mobil fiyat kartı, desktop tablo görünmez, `scrollWidth=viewport=390`, console error=0.
- İlk mobil kartta ürün, hal, şehir, fiyat/birim, min/ortalama/maks, tarih, kaynak, resmi kaynak ve doğrulama bağlantısı birlikte görüldü.
- Arama modalı: açılışta `aria-label=Arama` input'una focus; Tab odağı dialog içinde; Escape sonrası dialog yok, body overflow temiz ve focus `Ürün veya hal ara` düğmesine döndü.
- Mobil arama düğmesi: 44×44. Drawer içindeki görünür tema düğmesi: 44×44, dinamik label ve `aria-pressed` mevcut.
- Footer dört bilgi grubu ile metodoloji/düzeltme/künye linkleri DOM'da doğrulandı; ana sayfa console error=0 ve yatay taşma=0.
- Görsel kanıt: `output/playwright/theme-clean-data/global-shell-mobile-2026-08-14.png`.

## Bilinen bağımsız borç

Tam `tsc --noEmit`, bu değişikliklerden önce var olan Sentry `beforeSend` tipleri ve PriceHistory/Favorite DTO alanları nedeniyle başarısızdır. Yeni ortak UI dosyaları typecheck hata listesine girmedi; production build başarılıdır. Bu eski tip borçları ayrı checklist maddesinde kapatılmalıdır.
