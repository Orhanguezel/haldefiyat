# GZL Teknoloji reklam bannerı ve teklif akışı

14 Eylül 2026. Referans: kullanıcı tarafından paylaşılan banner, reklam talep sayfası ve teklif penceresi. Marka/hizmet doğrulaması: https://gzlteknoloji.com/tr ve sitenin `/uploads/site-media/logo_transparent.png` görseli.

## Uygulama

- GZL'nin gerçek logosu ve lacivert/altın renkleri. Mesaj: “İşinizi dijitale taşıyın”. Hizmetler: web sitesi, özel yazılım, otomasyon. Eylem: “Teklif al”.
- Bilgisayar/telefon görseli Image Gen ile üretildi. Arayüz metinleri ve düğmeler HTML; masaüstü ve mobil yerleşimi aynı tasarımın uyarlamaları. Başka firmanın logosu, indirim veya proje sayısı iddiası taşınmadı.
- Banner “Teklif al” tıklamasında erişilebilir native dialog açar. Escape/kapat düğmesi ve kaydırma kilidi var. JavaScript kapalıysa bağlantı `/gzl-teknoloji#teklif` sayfasına gider.
- GZL teklif sayfasında hizmet özeti, form ve şirket sitesinde doğrulanan WhatsApp numarasına bağlantı var. WhatsApp mesajı gönderilmez; bağlantı kullanıcıya sunulur.
- Mevcut `/api/v1/contacts` akışı kullanılır. Konu seçenekleri “GZL Teknoloji — …” öneki taşır. Başvurular mevcut panelde yönetilir. Yeni talep deposu veya bildirim altyapısı kurulmadı.
- Sayfa ve dialogdaki alan kimlikleri ayrıldı. E-posta mevcut backend sözleşmesinde zorunludur; mesaj en az 10 karakter ve onay zorunludur.
- Mevcut banner envanterine bedelsiz kurum içi reklam olarak, ürün sayfası alanına ayrı satır eklenir; diğer sponsorlar korunur. Banner tıklaması mevcut ölçüm uç noktasına gider.

## Kontroller

- 13 test: mevcut iletişim formu, GZL hizmet konusu, onay verisi, tekrarlanan form kimlikleri ve reklam bileşenleri geçti.
- TypeScript ve hedefli ESLint geçti.
- Playwright: masaüstü banner/dialog, 390 px mobil dialog; yatay taşma yok. Onaysız gönderim engellendi. Test gönderimi tarayıcıda yakalanıp 201 yanıtıyla taklit edildi; gerçek başvuru veya e-posta üretilmedi. Başarı mesajı ve Escape ile kapanma doğrulandı.
- Tasarım karşılaştırması: logo, lacivert/altın palet, cihaz görseli, başlık/hizmet/CTA sırası ve form düzeni korundu. Konseptteki tarla dekoru yerine ayrı üretilen cihaz görseli kullanıldı; gerçek form alanları ve mevcut aydınlatma bağlantıları korundu.

Dağıtım hedefi: `.next-release-20260914bc01`. Görsel: `/images/sponsors/gzl-banner.png`. Sayfa: `/gzl-teknoloji`.

Canlı doğrulama: banner #18 ürün sayfası envanterinde 2. satırda yayında; Bereket Fide #16 korunuyor. İstanbul/domates sayfasında “Teklif al” formu açıldı, konu listesi ve Escape ile kapanma doğrulandı. GZL teklif sayfası ve üç görsel HTTP 200. Önceki frontend release korunuyor; iki worker yenilendi.
