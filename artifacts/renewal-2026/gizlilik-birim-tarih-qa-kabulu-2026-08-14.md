# Gizlilik, Birim ve Tarih QA Kabulü — 14 Ağustos 2026

## Güvenlik ve gizlilik

- CMS sanitizer artık `<style>` bloklarını kabul etmiyor; CSS tabanlı içerik
  gizleme/izleme girdisi tamamen atılıyor.
- Frontend ve backend Sentry `beforeSend` katmanları request body, cookie,
  header, kullanıcı e-posta/IP/kullanıcı adı yanında hata mesajı, exception,
  breadcrumb, extra/context ve bilinmeyen anahtardaki telefon/e-posta
  değerlerini de temizliyor.
- Audit URL testi hassas query anahtarlarını ve bilinmeyen query değerindeki
  telefon/e-postayı kapsıyor.
- Public listing DTO redaksiyon testleri telefon, e-posta, `raw` ve serbest
  metin alanlarını kapsıyor.

## Birim sözleşmesi

- Fiyat geçmişi API'si `hf_price_history.unit` alanını günlük ve bucket'lı
  sorgularda döndürüyor; bucket gruplaması birimi de içeriyor.
- Grafik ve sezon karşılaştırma tipleri gerçek satır birimini kullanıyor;
  `kasa`, `adet` veya başka birim artık eksik tip nedeniyle `kg` varsayılmıyor.
- Canlı `/api/v1/prices/history/domates?range=30d` kabulünde 859/859 satırın
  birim alanı dolu.
- Ürün sözlüğü paket farkını yalnız gerçekten iki birim olduğunda
  `Limon (Kg)` / `Limon (Kasa)` biçiminde ayıran testli kurala sahip.
- Canlı örneklemde `akdeniz-yesilligi` ürün birimi `kasa` iken 218 tarihsel
  satırın `kg` olduğu görüldü. API artık bu uyumsuzluğu saklamıyor; veri göçü
  kanıtsız yapılmadı ve F2.17 kapsamında açık tutuldu.

## Tarih ve kalite kapıları

- Ortak tarih parser'ı `Invalid Date`, `undefined`, `NaN`, boş değer yanında
  `2026-02-31` gibi JavaScript'in başka aya taşıdığı imkânsız tarihleri de
  reddediyor.
- Yıllık rapor veri dönemi ortak güvenli formatter'a geçirildi; geçersiz tarihli
  rapor public rapor kabulünden geçmiyor.
- Frontend tam TypeScript kontrolü başarılı.
- Frontend tam test paketi: 23 dosya, 68 test, tamamı başarılı.
- Frontend ESLint: exit 0; kalanlar uyarı seviyesinde.
- Backend odaklı gizlilik paketi: 3 dosya, 8 test, tamamı başarılı; production
  build canlı sunucuda başarılı.

## Deploy kabulü

- Kodlar: `1b48ca72`, `98a8299a`, `2dc53fd3`, `fc26eebc`, `78639235`,
  `170aef1e`.
- Son izole frontend release: `.next-release-170aef1`.
- Release çıktıları ESLint ve Git envanterinden dışlandı; VPS lint süresi çoklu
  eski release tarayan 3+ dakikalık hatalı koşudan 21 saniyeye indi.
- `hal-backend` ve `hal-frontend` online.
- `/`, `/urun/domates`, `/rapor/yillik/2025` ve ilan detay rotası HTTP 200.
- Production build logunda `style`/XSS sanitizer uyarısı yok.

## Bilinen kapsam dışı kırmızı

Yerel tam backend suite, bu paketten bağımsız paylaşımlı altyapı WIP'i nedeniyle
`@agro/shared-backend/modules/audit/helpers` çözümleme hatası ve eşzamanlı borsa
parser alias beklenti farkı gösteriyor. Bu dosyalara sahipliği belirsiz olduğu
için müdahale edilmedi; hedeflenen backend testleri ve VPS production build
yeşildir.
