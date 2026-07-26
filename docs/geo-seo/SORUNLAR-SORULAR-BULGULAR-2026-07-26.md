# GEO/SEO — Sorunlar, Sorular ve Ayrı Bulgular

Bu dosya checklist kapanışlarından ayrı değerlendirilecek operasyonel veya
altyapısal bulguları tutar.

## Açık Operasyonel Konular

### E-posta kimlik doğrulama kabulü ve DMARC raporları

- 27 Temmuz 2026 canlı test iletisi Resend tarafından kabul edildi:
  Message-ID
  `<40b5618c-176a-3c08-ba8f-bd2efbff881f@haldefiyat.com>`,
  `accepted=1`, `rejected=0`.
- SPF/DKIM/DMARC aligned-pass kapanışı için yönetici Gmail posta kutusundaki
  iletinin ham `Authentication-Results` başlığı gerekiyor. Gmail bağlantısı
  önerildi; bağlantı henüz onaylanmadı.
- DNS Turhost tarafından yönetiliyor. Sunucuda DNS API anahtarı yok ve DMARC
  aggregate raporlarını alacak kontrollü posta kutusu belirlenmemiş.
- Karar gereken konu: `rua` için yönetilen adres/servis. Adres tanımlandıktan
  sonra `p=none` ile en az yedi gün rapor toplanmalı; meşru gönderen envanteri
  temizse sırasıyla `quarantine; pct=25`, `pct=100` ve gerekirse `reject`
  değerlendirilmeli.

### Google Rich Results Test oturum engeli

- Sekiz temsilî URL Schema.org Validator resmî endpoint'inde hata 0, uyarı 0
  sonucu verdi; ham JSON çıktıları
  `artifacts/seo/schema-validator-2026-07-27/` altında arşivlendi.
- Google Rich Results Test URL modu anonim headless Chrome'da reCAPTCHA sonrası
  “Something went wrong — Log in and try again” yanıtı verdi.
- Kanıt:
  `artifacts/seo/rich-results-test-2026-07-27/home-blocked.png`.
- Google sonucu uydurulmadı. Checklist maddesi, giriş yapılmış etkileşimli
  Google oturumunda URL bazlı çıktılar alınana kadar açık kalacak.

### ETL veri akışı

- Kocaeli, Mersin ve Çanakkale’de uzun süredir veri akışı olmadığı bildirildi.
- Mersin kaynağı 2026-07-26 tarihinde HTTP 403 verdi.
- Bu konu GEO/SEO implementasyonundan ayrıdır; kaynak adaptörü, erişim yöntemi,
  zamanlayıcı ve son başarılı çalışma kayıtları ayrı operasyonel inceleme ister.

### Canlı sunucu bağımlılık çözümlemesi

- Canlı proje kökünde bulunan iç içe `node_modules`, backend’in `mysql2` 3.23.1
  tiplerini; üst monorepo ise 3.20.0 tiplerini çözüyor. `bun run build` bu iki
  fiziksel paket kopyası yüzünden TypeScript uyumsuzluğu verebiliyor.
- Deploy sırasında kaynak dosyalara dokunulmadan iç node_modules geçici olarak
  kenara alındı, monorepo kilitli TypeScript kurulumu ile build alındı ve dizin
  geri kondu. Canlı süreçler başarıyla yeniden başlatıldı.
- Kalıcı çözüm: sunucudaki untracked proje-kökü `package.json`/`bun.lock` ve
  iç içe dependency kurulumunun hangi eski süreç tarafından üretildiğini
  belirlemek; ardından monorepo için tek kilit/tek kurulum politikası uygulamak.
  Kullanıcıya ait untracked dosyalar bu oturumda silinmedi.
- Frontend'in eski `.next/standalone` çıktısı iç içe `.next` dizini ürettiği
  için sonraki `next build` temizleme aşamasında `ENOTEMPTY` verebiliyor.
  27 Temmuz deploy'unda eski standalone çıktı silinmeden
  `/tmp/hal-frontend-build.hVPjN5` altına taşındı; build ve restart başarıyla
  tamamlandı. Kalıcı deploy akışı önceki build çıktısını version'lı/recoverable
  dizine atomik taşımalıdır.

## Kapatılan Teknik Bulgular

- CSP rapor endpoint bağlantısı ve enforce geçişi tamamlandı.
- Dinamik ürün proxy’sinin geçici backend hatasını hard 404 sayması giderildi.
- İç linklerde ham ETL slug, varsayılan locale prefixi ve ürün redirect zinciri
  kaynaklı sorunlar kapatıldı.
- Dört şeffaflık sayfasındaki placeholder içerikler ve iletişim sayfasındaki
  sorumlu yayıncı eksikliği kapatıldı.
