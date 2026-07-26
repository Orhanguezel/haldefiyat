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

### Anahtar kelime yoğunluğu 28 günlük GSC kabul penceresi

- Değişiklik sonrası canlı SSR/görünür metin taraması 27 Temmuz 2026'da
  tamamlandı; title/meta/H1-H2 dağılımı doğal ve yapay tekrar gerekmiyor.
- Birleşik checklist maddesinin GSC sorgu/CTR etkisi henüz ölçülemez.
- En erken karşılaştırma tarihi: **24 Ağustos 2026**. O tarihte aynı URL için
  önceki ve sonraki 28 günlük sorgu, gösterim, tıklama, CTR ve ortalama konum
  karşılaştırılmalı.

### GSC 28 gün yardımcısı ve PSI kotası

- Ortak `getGscDateRange("LAST_28_DAYS")` başlangıcı bitişten 28 gün geri
  alıyor; iki uç dahil GSC sorgusunda 29 takvim günü oluşuyor. Baseline doğrudan
  kesin tarihlerle 28 gün alındı. Yardımcı fonksiyon, diğer projelere etkisi
  değerlendirilerek ayrı kod düzeltmesi ister.
- 27 Temmuz PSI tekrar sorgusu günlük Google proje kotasına takıldı. CrUX
  origin baseline'ı 26 Temmuz kanıtından alındı; URL-level veri “yetersiz/
  erişilemedi” bırakıldı ve Lighthouse lab sonucu alan verisi gibi kullanılmadı.

### AI benchmark platform kotası

- 27 Temmuz 2026'da OpenAI Responses API + `web_search` iki sorguluk pilotu
  kimlik doğrulamadan sonra `429 insufficient_quota` verdi. OpenAI platformu
  için görünürlük sonucu üretilmiş sayılmadı.
- Anthropic Messages API + web-search aynı gün 40/40 sorguyu hatasız tamamladı;
  bu seri API platformu olarak açıkça etiketlendi ve tüketici Claude.ai sonucu
  gibi sunulmadı.
- OpenAI proje kotası açılırsa aynı 40 sorgu ayrı platform serisi olarak
  çalıştırılmalı. İlk aylık Anthropic karşılaştırma penceresi 27 Ağustos 2026'da
  dolar.

### Branded search ve ikinci alan adı

- GSC Search Analytics'te 27 Haziran–24 Temmuz 2026 arasındaki tam 28 veri
  gününde 4.519 sorgu satırı tarandı. `haldefiyat`, `hal de fiyat` ve
  `halde fiyat` varyantlarında yalnız `halde fiyat` görüldü: 4 tıklama,
  5 gösterim, %80 CTR ve 3,2 ortalama konum. Branded search talebi düşük.
- `haldefiyat.com.tr`, ana alan adıyla aynı `187.124.166.65` IP'sine ve aynı
  Turhost nameserver'larına çözülüyor; canlı Nginx yapılandırmasında
  `haldefiyat.com` ile aynı server block içinde. Bu alan adı dış kopya değil.
- Buna rağmen `https://haldefiyat.com.tr/` 301 yerine 200 ve tam site içeriği
  döndürüyor; arama sonuçlarında ana alan adından ayrı sonuç olarak göründü.
  Canonical işareti tek başına duplicate host sinyalini tamamen ortadan
  kaldırmaz. Alan adı kullanıcıya ait yönlendirme alias'ıysa `.com.tr` ve
  `www` varyantları sorgu/path korunarak `https://haldefiyat.com` adresine 301
  yönlendirilmelidir.
- Bu host düzeltmesi backlink baseline maddesinin parçası sayılmadı; canlı
  Nginx değişikliği öncesi sertifika ve redirect-loop kabulü ayrı yapılmalı.

### Public API dokümantasyon sapması

- Dinamik Swagger belgesi 384 rotayı, admin rotaları dâhil tek yüzeyde
  listeliyor; public geliştirici sözleşmesi olarak fazla geniş.
- Canlı frontend `/api-docs` sayfası fiyat yanıtını eski `{data, total}` biçimi
  ve uygulanmayan `dateFrom/dateTo` parametreleriyle gösteriyordu. Gerçek canlı
  yanıt `{items, meta}`, tarih penceresi parametresi `range`.
- Frontend örnekleri mevcut runtime davranışına eşlendi. Ayrı public OpenAPI
  yalnız beş kararlı, kimlik doğrulamasız rotayı kapsıyor.
- Veri/API çıktılarının açık lisansı henüz owner/hukuk tarafından
  belirlenmediğinden OpenAPI'ye varsayımsal lisans adı yazılmadı; validator'ın
  `info-license` uyarısı bilinçli olarak açık.

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
