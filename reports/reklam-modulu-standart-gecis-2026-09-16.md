# Reklam modülü standardı ve canlı geçiş — 16 Eylül 2026

Kullanıcının onayladığı model uygulandı: 6 birimlik ızgara; tam, yarım, üçte bir ve tek sütun × iki satır dikey format. Marka, kampanya ve yerleşim ayrı kavramlardır. Bir markanın birden fazla kampanyası ayrı kimliklerle ve birlikte raporlanabilir. Format değişikliği yeni kampanya oluşturmaz.

## Zorunlu format sözleşmesi

| Format | Yatay birim | Satır | 1120 px alandaki referans ölçü | Mobil |
|---|---:|---:|---|---|
| Tam | 6 | 1 | 1120 × 280 | Tam genişlik × 120 |
| Yarım | 3 | 1 | 552 × 280 | Tam genişlik × 120 |
| Üçte bir / kompakt | 2 | 1 | yaklaşık 363 × 280 | Tam genişlik × 120 |
| Dikey | 2 | 2 | yaklaşık 363 × 576 | Tam genişlik × 120 |

Satır yüksekliği 280 px, aralık 16 px. Genişlik kapsayıcıya uyar; referans ölçüler sabit resim yükleme zorunluluğu değildir. 768 px altında mobil görünüm kullanılır. İki satır yüksekliği `format=tall` ile belirlenir; `desktopRow` başlangıç satırıdır. `gridColumn` ızgaradaki başlangıç birimidir.

- Üst şeritler (`global_top`, `home_ticker_below`): 6 birim × 1 satır, yalnız tam format.
- `_sidebar` alanları: 2 birim × 3 satır, kompakt veya dikey.
- Diğer geniş alanlar: 6 birim × 2 satır, dört formatın tamamı.
- Mobilde reklamlar tek sütunda, satır/başlangıç birimi/kimlik sırasıyla dizilir.
- Yerleşim sabittir; varsa kampanya rotasyonu bu yerleşim içinde çalışır.

Ortak sözleşme: `shared/banner-layout.mjs`. API, yönetim paneli, fiyat hesabı ve halka açık renderer aynı format tanımlarını kullanır. Slot kapasitesi, boş ızgara birimi olarak gösterilir; boş birim sayısı tek başına istenen formatın sığacağını garanti etmez. Kesin karar tarih, cihaz, hedefleme ve geometrik çakışma kontrolüdür.

## Kreatif üretim kuralları

Logo, ana başlık, açıklama, görsel, CTA ve marka renkleri bir kez girilir. Bütün markalar `StandardBanner` üzerinden çizilir; marka adına/ID'sine göre tasarım dalı yoktur. Mobilde logo, başlık ve CTA görünür; ana görsel ve açıklama gizlenir. Böylece her formatın mobil kartı 120 px kalır.

Başlık en fazla 90, CTA en fazla 28 karakterdir. Dar/mobil kartta başlık iki satırla sınırlıdır; ana mesajı başa koyun ve önizlemeyi kontrol edin. Metni görsele gömmeyin. Görsel zorunlu değildir. Sponsor etiketi, köşe, iç boşluk ve buton düzeni ortaktır. GZL teklif formu yapılandırmadaki `action=quote` ile korunur; radar illüstrasyonu `mediaKind=radar` seçeneğidir.

HTML/kod reklamları aynı ölçülü, scriptsiz sandbox iframe içinde gösterilir. Dışarıdan hazırlanmış HTML içeriğinin okunabilirliği otomatik dönüştürülemez; dört format ve mobil önizlemesi ayrıca kontrol edilmelidir. Yeni kampanyalarda ortak kreatif tercih edilir.

Kaydetmeden/yayınlamadan önce: izinli format/konum, iki satır sınırı, rezervasyon çakışması, ödeme/yayın koşulları, başlık/CTA uzunluğu ve kreatif kalite kontrol edilir. Göreli site bağlantıları ve ek `noopener` niteliği desteklenir. Eşzamanlı yazmalar yerel kuyruk + MySQL kilidiyle sıraya alınır.

Fiyat hesaplayıcıda format seçilir. Masaüstü alan çarpanı: tam 1, yarım 1/2, üçte bir 1/3, dikey 2/3; dar sütunda kompakt 1, dikey 2. Mobil alan çarpanı 1. Mevcut kampanya tutarları değiştirilmedi. Baz fiyat bir tam satır içindir.

## Tamamlanan işler ve kanıt

- [x] Ortak format/slot sözleşmesi ve gerçek iki satır kaplama.
- [x] Şema ve geri alınabilir dönüşüm; 14 slot standarda geçirildi.
- [x] Tarih, cihaz, hedefleme ve iki satırı gözeten çakışma kontrolü.
- [x] Ortak kreatif, mevcut marka içerikleri ve 120 px mobil görünüm.
- [x] Panel format/başlangıç seçimi, gerçek renderer ile dört format ve mobil önizleme.
- [x] Slot ölçü metinleri, fiyat hesabı, envanter ve rapor metadatası güncellendi.
- [x] Önizlemede çerez kutusu ve dahili sayfa görüntüleme beaconi kaldırıldı.
- [x] Backend 33 test; frontend 15 test; admin rapor kapsamı/yükleme 8 test geçti.
- [x] Backend, frontend, admin TypeScript kontrolleri ve production build'leri geçti.
- [x] 15 aktif kampanya × (4 masaüstü + 1 mobil) = 75 canlı görünüm: doğru yükseklik, kart içinde CTA, kırık görsel yok, sayfa JS hatası yok.
- [x] Ayrıca dört markada 320 px dahil 24 canary görünümü; ortak bileşende dört format × dört viewport = 16 ölçüm.
- [x] Canlı CSS ile tarayıcı içi karma ızgara fikstürü: bir dikey + dört küçük kart, iki satır; çakışma yok. Bu test kampanya kaydı oluşturmadı.
- [x] Yönetim paneli fikstüründe dikey seçimi ve mobil önizleme doğrulandı; API istekleri tarayıcıda taklit edildi, canlı kayıt yazılmadı.
- [x] Gerçek veriye karşı reddedilmesi gereken üç çakışmalı POST 409; sınır dışı PATCH 400; 12 eşzamanlı geçersiz POST 400. Kayıt eklenmedi.
- [x] Dört format fiyat teklifinde beklenen alan çarpanları doğrulandı.
- [x] GZL teklif penceresi, form yüklenmesi ve kapanması doğrulandı; form gönderilmedi.
- [x] 23 kayıt / 15 aktif kampanya korundu; kimlik, durum, ödeme, tarih ve bağlantılarda fark yok; sayaçlarda azalma yok. Hostinger 8/9/10 pasif kaldı.

Kanıtlar: `artifacts/banner-standard-2026-09-16/`. Genel sayfa ekranları ve iki satır fikstürünün görüntüsü bu klasördedir. Birleşik marka raporu kapsam testleri geçmektedir.

## Canlı sürüm ve geri dönüş

Backend: `hal-backend`, 8091. Frontend: `.next-release-20260916fb02`, ayrı Node 24 PM2, 3033. Admin: `.next-release-20260916cb03`, ana PM2 `hal-admin`, 3036.

Önceki sürümler: frontend `.next-release-20260916fa01`; admin `.next-release-20260916ca01`. Kaynak/dist yedeği sunucuda `/tmp/hal-ad-standard-backup-20260916`; dönüşüm öncesi veri `/tmp/banner-standard-before-1789567025696.json`. Backend ve admin hata logları kontrol sonunda boş; frontend'de backend yeniden başlarken 13:59:24 UTC'de oluşan geçici bağlantı hatalarından sonra yeni hata gözlenmedi.

Yeni ortam/geçiş için backend dizininden `bun scripts/banner-standard-migrate.ts` ile prova, ardından `--apply` kullanılır. SQL 104 yalnız genişletme adımıdır; veri dönüşümü için script zorunludur. Tekrar çalıştırma kampanya içeriklerini yeniden yazmaz; slot sözleşmesini eşitler.

Geri dönüş: reklam yazmalarını durdurup önceki frontend/admin symlinklerini ve backend dist yedeğini geri yükleyin. `bun scripts/banner-standard-rollback.ts /tmp/banner-standard-before-1789567025696.json --apply` yalnız kreatif/yerleşim ve slot metadatasını geri alır; ödeme, durum ve sayaçları geri sarmaz. Uygulamaları doğru PM2 yöneticilerinde yeniden başlatıp kontrol edin. Eklenen sütunlar eski sürümlerle uyumludur; geri dönüşte silinmez.
