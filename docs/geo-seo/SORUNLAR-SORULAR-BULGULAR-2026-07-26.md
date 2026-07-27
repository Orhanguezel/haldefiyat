# GEO/SEO — Sorunlar, Sorular ve Ayrı Bulgular

Bu dosya checklist kapanışlarından ayrı değerlendirilecek operasyonel veya
altyapısal bulguları tutar.

## Açık Operasyonel Konular

### E-posta kimlik doğrulama kabulü ve DMARC raporları

- 27 Temmuz 2026 canlı test iletisi Resend tarafından kabul edildi:
  Message-ID
  `<40b5618c-176a-3c08-ba8f-bd2efbff881f@haldefiyat.com>`,
  `accepted=1`, `rejected=0`.
- **DKIM kapandı:** bağımsız alıcıdaki gerçek iletide `s=resend`,
  `d=haldefiyat.com`, DNS public key ve kriptografik `pass` görüldü; From ile
  signing domain exact aligned.
- DNS Turhost tarafından yönetiliyor. Sunucuda DNS API anahtarı yok ve DMARC
  aggregate raporlarını alacak kontrollü posta kutusu belirlenmemiş.
- **Yeni bulgu (27.07.2026):** alan adının MX kaydı `0 haldefiyat.com`
  üzerinden web VPS'i `187.124.166.65` adresine gidiyor. VPS'te Postfix,
  Exim veya Dovecot aktif değil; 25/465/587/993/995 portlarında dinleyen posta
  servisi yok. Dolayısıyla mevcut MX fiilen gelen posta kabul etmiyor ve
  `dmarc@haldefiyat.com` gibi bir adres oluşturulmuş kabul edilemez.
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
- **İlerleme (27.07.2026):** resmî GSC URL Inspection API ile sekiz URL
  incelendi. Google'ın taradığı 7/7 URL'de rich results verdict `PASS`;
  Breadcrumb ve Dataset türleri URL bazında alındı. `/rapor/yillik/2025`
  henüz crawl edilmediği için sonuç üretmedi.
- URL Inspection zengin sonuç kararı ve türleri ortak backend yanıtına ve
  `/admin/search-console` arayüzüne eklendi; canlı build/sağlık kontrolleri
  geçti. Ayrıntı:
  `docs/geo-seo/GSC-RICH-RESULTS-INCELEMESI-2026-07-27.md`.

### Backlink ve bağımsız mention veri kaynağı

- Kamu web ve GitHub exact-match taramasında `tarvista.com`,
  `bereketfide.com.tr` ve Orhanguezel ekosistem depolarındaki referanslar
  doğrulandı.
- Bu kaynaklar aynı sahiplik/ekosistem kapsamındadır; bağımsız kazanılmış
  backlink veya editoryal mention sayılmadı.
- Kamu arama sonuçlarından referring-domain ve dofollow sayısı türetilmedi.
  GSC Links export'u veya doğrulanmış sağlayıcı export'u olmadan rakip gap
  maddesi açık kalıyor.
- Ayrıntı:
  `docs/geo-seo/BACKLINK-MENTION-KAMU-TARAMASI-2026-07-27.md`.

### Anahtar kelime yoğunluğu 28 günlük GSC kabul penceresi

- Değişiklik sonrası canlı SSR/görünür metin taraması 27 Temmuz 2026'da
  tamamlandı; title/meta/H1-H2 dağılımı doğal ve yapay tekrar gerekmiyor.
- Birleşik checklist maddesinin GSC sorgu/CTR etkisi henüz ölçülemez.
- En erken karşılaştırma tarihi: **24 Ağustos 2026**. O tarihte aynı URL için
  önceki ve sonraki 28 günlük sorgu, gösterim, tıklama, CTR ve ortalama konum
  karşılaştırılmalı.

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
- İlk kontrolde `https://haldefiyat.com.tr/` 301 yerine 200 ve tam site
  içeriği döndürüyordu; arama sonuçlarında ana alan adından ayrı görünmüştü.
- **Kapandı (27.07.2026):** sertifika kapsamı doğrulandı; `.com.tr`, `www` ve
  HTTP varyantları path/query korunarak tek adımda
  `https://haldefiyat.com` hedefine 301 yapıldı. Kanıt:
  `docs/geo-seo/HOST-CANONICAL-REDIRECT-KABULU-2026-07-27.md`.

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

### Gmail DKIM ek kanıt araması

- Bağlı Gmail hesabında
  `rfc822msgid:40b5618c-176a-3c08-ba8f-bd2efbff881f@haldefiyat.com`
  exact araması ve 26–27 Temmuz `from:(@haldefiyat.com)` tarih araması sonuç
  vermedi.
- Arama salt okunur yapıldı; mesaj, etiket veya posta kutusu durumu
  değiştirilmedi.
- Bu sonuç Resend'in kabul ettiği iletinin teslim edilmediğini kanıtlamaz.
  Bağlı hesabın test alıcısı olmadığı veya iletinin bu kutuda tutulmadığı
  anlamına gelebilir.
- Bağımsız alıcı testi DKIM/alignment kabulünü kapattı. Gmail iletisi bulunursa
  yalnız sağlayıcılar-arası ek teslim kanıtı olacaktır.

### ETL veri akışı

- **Açık:** Kocaeli canlı VPS ve yerel ağdan 25 saniyede bağlantı kuramıyor;
  yayıncı servis genel olarak erişilemiyor. Son başarılı veri 8 Mayıs 2026.
- **Açık:** Mersin canlı VPS ve yerel ağdan hızlı HTTP 403 veriyor; ana sayfa
  ve günlük endpoint aynı WAF/IP engelinde. Son başarılı veri 19 Mayıs 2026.
- **Açık:** Çanakkale yayıncı sayfası yerel ağdan HTTP 200 ve 7 Temmuz 2026
  tarihli 88 geçerli satır veriyor; canlı VPS ve merkezi scraper iki ayrı
  modda zaman aşımına uğruyor. Sorun yayın değil, sunucu çıkış yolu/IP erişimi.
- **Kapandı:** Çanakkale statik sayfasının eski tablosunu istek tarihiyle
  “bugün” diye yazma riski giderildi. Parser sayfadaki gerçek tarihi her satıra
  taşıyor; iki test/typecheck geçti ve `756b1cdd` ile canlıya alındı.
- Üç kaynak erişim yolu çözülene kadar bilinçli olarak devre dışı kalıyor;
  başarısız cronları açmak veri akışını düzeltmez. Ayrıntı ve yeniden açma
  kapıları:
  `docs/geo-seo/ETL-KAYNAK-KESINTISI-INCELEMESI-2026-07-27.md`.
- **Proxy altyapı kontrolü (27.07.2026):** canlıda iki merkezi scraper ve
  HalDeFiyat scraper container'ları çalışıyor, fakat hiçbir ilgili env
  dosyasında `SCRAPE_PROXY_URL`, `PROXY_URL`, `FAIR_PROXY_URL` veya
  `PLACES_PROXY_URL` tanımlı değil. Mevcut scraper'lar yine datacenter IP ile
  çıkıyor; Mersin WAF ve Çanakkale çıkış yolu sorununu çözemez.

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
- `haldefiyat.com.tr` duplicate-host 200 yanıtı canonical `.com` 301
  yönlendirmesine geçirildi.
- Ortak GSC tarih yardımcısının kapsayıcı sınırlarla 29 gün üreten
  `LAST_28_DAYS` hatası kapatıldı. Güncel ve önceki dönemler tam 7/28/90 gün
  üretiyor; shared paket `cef6149` ile canlıya alındı. Kanıt:
  `docs/geo-seo/GSC-TARIH-ARALIGI-KABULU-2026-07-27.md`.
- PSI günlük kota engeli yenileme sonrasında kapandı. Dört mobil URL yeniden
  sorgulandı; iki sonuç origin fallback, iki sonuç bağımsız URL-level çıktı.
  Üç CWV metriği tam tek URL LCP nedeniyle good değil: 0/1. Ayrıntı:
  `docs/geo-seo/CRUX-GSC-28-GUN-BASELINE-2026-07-27.md`.
