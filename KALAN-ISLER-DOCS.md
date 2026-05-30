# KALAN İŞLER — docs/ Açık Maddeleri (Eski Dökümanlar)

**Üretim:** 2026-05-30 · **Kaynak:** `docs/*.md` (eski plan/strateji/çeklist). Çoğu Nisan-Mayıs başı — teyit et.
> Yaşayan roadmap: `docs/KALAN-ISLER.md`.

## Özet

| Döküman | Açık |
|---|---|
| [antigravity-og-gorsel-checklist.md](docs/antigravity-og-gorsel-checklist.md) | 13 |
| [DASHBOARD-CHECKLIST.md](docs/DASHBOARD-CHECKLIST.md) | 6 |
| [GEO-CHECKLIST-2026-05-10.md](docs/GEO-CHECKLIST-2026-05-10.md) | 18 |
| [hal-api-kaynaklari-rapor.md](docs/hal-api-kaynaklari-rapor.md) | 12 |
| [oneri-ve-sprint-plani-2026-04-21.md](docs/oneri-ve-sprint-plani-2026-04-21.md) | 30 |
| [strateji-ve-gelir-modeli.md](docs/strateji-ve-gelir-modeli.md) | 14 |
| [yeni-teklifler-gelistirme-checklist-2026-04-24.md](docs/yeni-teklifler-gelistirme-checklist-2026-04-24.md) | 266 |

---

## Açık Maddeler

### antigravity-og-gorsel-checklist.md

**B1. Dinamik sayfalar (T2)**
- [ ] `https://haldefiyat.com/urun/domates` → OG'de "DOMATES" büyük, Türkçe karakter düzgün, 1200×630, marka şablonu
- [ ] `https://haldefiyat.com/urun/biber-carliston` → uzun ürün adı taşmıyor (ellipsis veya küçülme)
- [ ] `https://haldefiyat.com/hal/izmir-hal` → market adı + şehir
- [ ] `https://haldefiyat.com/analiz/<son-rapor-slug>` → rapor başlığı + hafta
- [ ] 3 farklı ürün → 3 farklı görsel üretiliyor (cache karışması yok)
- [ ] `curl -sI` → `content-type: image/png`, 200

**B2. Editoryal sayfalar (T1)**
- [ ] Anasayfa, /fiyatlar, /hakkimizda, /endeks → admin'den yüklenen özel görsel görünüyor
- [ ] og_image yüklenmemiş bir sayfa → `og-default.png` fallback'i geliyor (kırık/boş değil)

**B3. Platform render**
- [ ] Facebook/LinkedIn debugger: title + description + image üçü de doğru, "image too small" uyarısı YOK
- [ ] X/Twitter card: `summary_large_image`, görsel tam
- [ ] WhatsApp önizleme (mobil): görsel + başlık geliyor

**B4. Regresyon**
- [ ] Mevcut sayfa içerikleri/SEO meta bozulmadı (title/description aynı)
- [ ] Lighthouse SEO skoru düşmedi

### DASHBOARD-CHECKLIST.md

**A9 — Çeviriler**
- [ ] `src/locale/tr/admin/common.json` → genel metinleri hal-fiyatlari'na uyarla

**A10 — Build & Test**
- [ ] Login sayfası hal-fiyatlari backend'ine bağlanıyor
- [ ] En az bir modül (fiyatlar) liste + detay çalışıyor

**B3 — Fiyat Uyarıları (Üyeye Bağlama)**
- [ ] `db:seed:fresh` çalıştır — tablo şemasını sıfırdan oluştur

**B4 — Favoriler (Backend Sync)**
- [ ] `db:seed:fresh` çalıştır

**B5 — Bildirimler**
- [ ] `checker.ts` → alert tetiklenince `notifications` tablosuna kayıt düş

### GEO-CHECKLIST-2026-05-10.md

**🟠 HIGH — Meta Description**
- [ ] Admin panel → SEO Pages'ten tüm sayfaların description'larını gir (dinamik override)

**🟠 HIGH — Editoryal İçerik**
- [ ] Geliştirilecek: ürüne özel sezonluk bilgi (DB veya statik config'den)

**🟠 HIGH — Sosyal Medya Linkleri**
- [ ] Yapılacak: Admin panel → Site Settings'e Twitter/X ve Instagram URL'lerini gir

**🟡 MEDIUM — Hakkımızda Sayfası Derinleştirme**
- [ ] `hakkimizda/page.tsx` içeriğini genişlet → min. 1000 kelime
- [ ] `10.000+ günlük veri` gibi iddiaları kaynak referansıyla destekle

**🟡 MEDIUM — FAQPage Schema (Anasayfa + Ürün Sayfaları)**
- [ ] Anasayfaya SSS bölümü ekle + `FAQPage` JSON-LD
- [ ] `/urun/[slug]` sayfasına ürüne özel SSS + JSON-LD (sezonluk soru, fiyat aralığı soru)

**Twitter/X ve Instagram Varlığı**
- [ ] Twitter/X hesabı aç: @haldefiyat veya @haldefiyatcom
- [ ] Instagram hesabı aç
- [ ] Günlük "en çok değişen hal fiyatları" paylaşımı için otomatik post sistemi (opsiyonel)

**Google News Kaydı**
- [ ] Fiyat bülteni veya haber tarzı içerik üretiliyorsa Google News'a başvur
- [ ] Gereklilik: düzenli editorial içerik (haftalık fiyat raporu yeterli olabilir)

**Yıllık Fiyat Raporu**
- [ ] "Türkiye Hal Fiyatları Yıllık Raporu 2025" PDF veya web sayfası yayınla

**API Sayfası Zenginleştirme**
- [ ] Ücretsiz plan / kayıt bilgisi (kurumsal kullanıcıları çekmek için)

**2026-05-18 — Doğrulama Oturumu (işaretsiz maddeler kod + canlı kontrol)**
- [ ] **og-default.png** (1200×630) `/public/`'a eklenmedi — layout hâlâ `brand-logo.png` fallback kullanıyor. Tek somut kod/asset eksiği.
- [ ] **Google News kaydı** — harici başvuru (kod değil), yapılmamış
- [ ] **Twitter/X + Instagram gerçek hesap açılışı + içerik** — DB'de URL hazır ama hesapların aktif/içerikli olduğu harici, doğrulanamadı
- [ ] **CCBot allow kararı** (robots.txt) — opsiyonel politika kararı, beklemede

### hal-api-kaynaklari-rapor.md

**Keşif backlog (ileride tekrar dene)**
- [ ] İstanbul Beylikdüzü Su Ürünleri Toptancı Hali — kooperatif müdürlüğü ile doğrudan iletişim (anlaşmalı feed)
- [ ] Kocaeli / Antalya / Mersin / Kocaeli balık SPA sayfaları — Chrome DevTools XHR yakalaması
- [ ] Kılıç Holding / Agromey / Gürsoy Tarım (büyük yetiştiriciler) — bilateral B2B feed
- [ ] Nasdaq Salmon Index — küresel somon fiyat benchmark'ı
- [ ] İstanbul Balıkçılar Derneği / Kooperatifi web varlığı

**[Bir sonraki kontrol tarihi]**
- [ ] VPS ağ politikası gözden geçirildikten sonra: Samsun, Van, Gaziantep, Balıkesir
- [ ] İBB swagger v1 spec'i geri gelmiş mi
- [ ] Bursa port 30090 / `acikveri.bursa.bel.tr` aktifleşmiş mi
- [ ] Mersin İNDİR butonunun Excel URL'i (DevTools ile yakalanacak)
- [ ] Kullanıcı DevTools ile Ankara/Adana/Mersin/Kocaeli SPA endpoint'lerini yakaladıysa test edilip config'e eklenecek
- [ ] İstanbul Beylikdüzü Su Ürünleri Hali kooperatif iletişim (Toptancı Hal Müdürlüğü)
- [ ] TÜİK yıllık bülten kodlarının stable URL şeması keşfi (son birkaç yılın bülten ID'si pattern'i)

### oneri-ve-sprint-plani-2026-04-21.md

**Kalan İşler**
- [ ] **Kocaeli** — form veya XHR endpoint'ini yakala, parser yaz
- [ ] **Adana** — sebze-meyve SPA endpoint'ini çöz
- [ ] **Samsun** — Karadeniz / balık verisi için erişim dene
- [ ] **Gaziantep** — Güneydoğu pazarı için erişim dene
- [ ] **Balıkesir** — erişim denemesi
- [ ] **Van** — erişim denemesi
- [ ] Yeni kaynaklar için smoke test komutlarını `README` veya `docs/etl-smoke-tests.md`'ye dokümante et
- [ ] Kaynak raporunu (`hal-api-kaynaklari-rapor.md`) yeni eklenenlerle güncelle

**Başarı Kriteri**
- [ ] En az 2 daha yeni şehir production-ready canlı veri veriyor
- [ ] ETL cron mevcut kaynakları bozmadan çalışıyor
- [ ] Aktif market sayısı ≥ 12

**Kalan İşler**
- [ ] `docs/endeks-metodoloji.md` — metodoloji dokümanı yaz

**Kalan İşler**
- [ ] Swagger/OpenAPI üzerinden otomatik `/api/docs` sayfası (Fastify Swagger zaten kurulu)

**Yapılanlar**
- [ ] *(Admin panel kurulumu bekliyor — Bölüm A)*

**Kalan İşler**
- [ ] `POST /api/v1/admin/prices/bulk-entry` — çoklu kayıt girişi endpoint'i
- [ ] `GET /api/v1/admin/products/autocomplete?q=` — ürün autocomplete
- [ ] `GET /api/v1/admin/markets/autocomplete?q=` — hal autocomplete
- [ ] `src/app/(main)/admin/(admin)/prices/quick-entry/page.tsx` — hızlı giriş formu
- [ ] Ürün / hal autocomplete alanı
- [ ] Tarih + kalite + lot + birim + min/avg/max fiyat alanları
- [ ] Mobil uyumlu layout (dikey ekranda rahat kullanım)
- [ ] Giriş sonrası kayıtları gözden geçirme tablosu

**Başarı Kriteri**
- [ ] Tek kullanıcı telefondan birkaç dakikada çoklu kayıt girebiliyor
- [ ] Veri ortakları ile kullanılabilecek kadar basit arayüz

**Şu Aşamada Bilinçli Ertelenenler**
- [ ] ÜFE / TÜFE / TÜİK üretim katmanı entegrasyonu
- [ ] Dünya veri katmanı (USDA / FAO / Comtrade)
- [ ] Pro üyelik ve ödeme sistemi
- [ ] Mobil uygulama
- [ ] Büyük kurumsal dashboard'lar
- [ ] Yoğun push notification yatırımı

### strateji-ve-gelir-modeli.md

**Bu Hafta**
- [ ] Admin panelinde hızlı veri giriş ekranı (ürün + hal + fiyat + kalite + tarih)
- [ ] 5 temel hal için ilk 100 fiyat kaydını gir

**Bu Ay (Nisan 2026)**
- [ ] 5 büyük hali kapsayan düzenli manuel veri girişi başlat
- [ ] `/fiyatlar`, `/urun/[slug]`, `/hal/[slug]` sayfalarını tamamla
- [ ] Türkiye haritası (SVG il bazlı) ekle

**2. Ay (Mayıs 2026)**
- [ ] "HaldeFiyat Endeksi" metodolojisini yaz
- [ ] İlk haftalık endeks bültenini yayınla
- [ ] 2–3 hal esnafıyla "Veri Ortağı" anlaşması yap

**3. Ay (Haziran 2026)**
- [ ] İlk B2B müşteri görüşmesi (yakın çevredeki restoran / market zinciri)
- [ ] Pro üyelik altyapısını kur (ödeme sistemi: İyzipay)
- [ ] API dokümantasyon sayfası yayınla

**6. Ay (Eylül 2026)**
- [ ] İlk ücretli B2B müşteri
- [ ] Crowdsource veri giriş sistemi
- [ ] Medyada ilk "HaldeFiyat Endeksi" alıntısı

### yeni-teklifler-gelistirme-checklist-2026-04-24.md

**Backend Checklist**
- [ ] Son 2 yıl veri kapsama raporu çıkar: ürün x şehir x gün doluluk oranı.
- [ ] `hf_price_history` için tahmin sorgularını hızlandıracak index ihtiyacını ölç.
- [ ] `hf_forecast_runs` tablosu ekle: model adı, versiyon, tarih aralığı, durum.
- [ ] `hf_forecast_predictions` tablosu ekle: product_id, market_id, forecast_date, predicted_min, predicted_avg, predicted_max, confidence.
- [ ] `hf_forecast_model_metrics` tablosu ekle: MAE, MAPE, RMSE, backtest dönemi.
- [ ] `GET /api/v1/prices/forecast/:slug` endpoint'ini v2 formatına genişlet.
- [ ] `GET /api/v1/forecast/opportunities` endpoint'i ekle: şehirler arası fırsat/risk listesi.
- [ ] `POST /api/v1/admin/forecast/run` endpoint'i ekle: manuel model çalıştırma.
- [ ] Forecast cron ekle: her gün ETL sonrası tahminleri yenile.
- [ ] Tahmin yanıtında "model açıklaması" döndür: trend, sezon, hava, veri kalitesi.

**Frontend Checklist**
- [ ] `/urun/[slug]` grafiğinde tahmin bandı göster: min/avg/max aralığı.
- [ ] Tahmin kartına güven etiketi ekle: düşük/orta/yüksek.
- [ ] "Neden böyle?" açıklama paneli ekle: fiyat trendi, hava riski, sezon etkisi.
- [ ] 7/30/90 gün segment kontrolü ekle.
- [ ] Şehirler arası tahmin karşılaştırması ekle.
- [ ] Forecast boş/veri yetersiz durumlarını açık ve güvenilir göster.
- [ ] Tahminleri fiyat alarmı akışına bağla: "7 gün içinde hedef fiyata yaklaşabilir".

**Admin Checklist**
- [ ] Forecast run listesi ekle.
- [ ] Model metriklerini admin dashboard'da göster.
- [ ] Veri kalitesi düşük ürünleri listele.
- [ ] Manuel tahmin yeniden hesaplama aksiyonu ekle.
- [ ] Anomali onay/etiketleme ekranı ekle.

**Başarı Kriterleri**
- [ ] En az 50 popüler ürün için 7 günlük tahmin üretilebiliyor.
- [ ] Her tahminin güven skoru ve veri kapsamı gösteriliyor.
- [ ] Backtest MAPE değeri ürün/şehir kırılımında takip ediliyor.
- [ ] Kullanıcı tahmin çizgisi ile gerçek fiyatı aynı grafikte karşılaştırabiliyor.

**Backend Checklist**
- [ ] `hf_cost_*` tablolarını ekle.
- [ ] `GET /api/v1/cost/templates?product=&city=` endpoint'i ekle.
- [ ] `POST /api/v1/cost/scenarios` endpoint'i ekle.
- [ ] `GET /api/v1/cost/scenarios/my` endpoint'i ekle.
- [ ] `POST /api/v1/cost/calculate` saf hesaplama endpoint'i ekle.
- [ ] Fiyat referansı olarak son fiyat + forecast senaryosunu bağla.
- [ ] Kullanıcı giriş yapmamışsa local hesaplama, giriş yapmışsa kayıt akışı kur.
- [ ] Hesaplama sonucuna uyarı notu ekle: "tahmini karar destek verisidir".

**Frontend Checklist**
- [ ] `/maliyet-simulatoru` sayfası oluştur.
- [ ] Ürün, şehir, alan, verim ve maliyet kalemi formu hazırla.
- [ ] Maliyet kalemleri için hızlı ekle/sil/düzenle UI kur.
- [ ] Sonuç panelinde başabaş fiyatı öne çıkar.
- [ ] Fiyat senaryoları ekle: bugünkü fiyat, 7 gün tahmin, manuel fiyat.
- [ ] Hassasiyet analizi ekle: maliyet +%10, fiyat -%10, verim -%15.
- [ ] PDF/CSV export ekle.
- [ ] Kullanıcı dashboard'una "Simülasyonlarım" sayfası ekle.

**Admin Checklist**
- [ ] Varsayılan ürün maliyet şablonları yönetimi.
- [ ] Ürün/bölge verim varsayımları yönetimi.
- [ ] En çok kullanılan ürünleri ve senaryo sayılarını izleme.
- [ ] İçerik tarafında örnek senaryolar hazırlama.

**Başarı Kriterleri**
- [ ] Kullanıcı 2 dakika içinde bir kar/zarar senaryosu oluşturabiliyor.
- [ ] Simülatör fiyat API'sinden otomatik satış fiyatı alabiliyor.
- [ ] En az 10 popüler ürün için varsayılan şablon mevcut.
- [ ] Simülasyon sonucu paylaşılabilir veya indirilebilir.

**Backend Checklist**
- [ ] Tarımİklim API sözleşmesini netleştir: current/history/forecast/frost-risk.
- [ ] Hava verisi için backend ETL ekle.
- [ ] Hava snapshot tablolarını oluştur.
- [ ] `hf_product_weather_sensitivity` tablosunu ekle: ürün, şehir/bölge, risk türü, ağırlık.
- [ ] `GET /api/v1/weather-price-risk?product=&city=` endpoint'i ekle.
- [ ] Tahmin motoruna hava feature'larını bağla.
- [ ] Fiyat alarm sistemine hava tetikleyici ekle: "don riski yükseldi".
- [ ] Hava etkisini backtest et: risk olayı sonrası 3/7/14 günlük fiyat değişimi.

**Frontend Checklist**
- [ ] `/urun/[slug]` sayfasında "Hava kaynaklı fiyat riski" kartı.
- [ ] `/hal/[slug]` sayfasında hava + fiyat korelasyonu mini grafiği.
- [ ] Ana sayfada "Bu hafta hava kaynaklı riskler" bölümü.
- [ ] Uyarı kurma ekranına hava riski seçeneği ekle.
- [ ] Risk kartında yalnızca iddia değil, güven seviyesi ve veri kaynağı göster.

**Başarı Kriterleri**
- [ ] En az 5 ürün ve 5 kritik üretim bölgesi için hava hassasiyet tanımı var.
- [ ] Hava riski fiyat tahmin kartında açıklama olarak gösteriliyor.
- [ ] Hava olayları için geçmiş fiyat etkisi ölçülebiliyor.
- [ ] Kullanıcı hava riski alarmı kurabiliyor.

**Backend Checklist**
- [ ] Arz ve talep sinyali tablolarını oluştur.
- [ ] `POST /api/v1/supply-signals` endpoint'i ekle.
- [ ] `POST /api/v1/demand-signals` endpoint'i ekle.
- [ ] `GET /api/v1/map/price-movements` endpoint'i ekle.
- [ ] `GET /api/v1/map/supply-demand` endpoint'i ekle.
- [ ] Günlük bölgesel metrik cron'u ekle.
- [ ] Minimum örneklem/gizlilik filtresi uygula.
- [ ] Bölgesel fiyat değişim skoru hesapla: son 7 gün, son 30 gün, geçen yıl.
- [ ] Sinyal spam/moderasyon kontrolü ekle.

**Frontend Checklist**
- [ ] `/harita` sayfası oluştur.
- [ ] Türkiye il haritası: fiyat artış/düşüş renk skalası.
- [ ] Ürün filtresi, tarih aralığı, sinyal türü filtresi ekle.
- [ ] İl tıklanınca şehir paneli aç: ortalama fiyat, trend, arz, talep.
- [ ] Yeterli veri yoksa "veri yetersiz" durumunu göster.
- [ ] Kullanıcıya "Bu bölgeden arz/talep bildir" aksiyonu sun.
- [ ] Mobil için liste görünümü ekle.

**Admin Checklist**
- [ ] Arz-talep sinyali moderasyon kuyruğu.
- [ ] Bölge bazlı veri yoğunluğu paneli.
- [ ] Şüpheli/spam sinyal işaretleme.
- [ ] Kullanıcı güven puanı yönetimi.

**Başarı Kriterleri**
- [ ] En az il düzeyinde ürün bazlı fiyat değişim haritası çalışıyor.
- [ ] Kullanıcı arz/talep sinyali gönderebiliyor.
- [ ] Harita gizlilik eşiği altında veri göstermiyor.
- [ ] Günlük bölgesel metrikler tekrar üretilebilir.

**Backend Checklist**
- [ ] Marketplace profil tablosu ekle.
- [ ] İlan tablolarını ve medya ilişkisini ekle.
- [ ] Teklif tablolarını ekle.
- [ ] Sohbet thread/message tablolarını ekle.
- [ ] `POST /api/v1/listings` endpoint'i ekle.
- [ ] `GET /api/v1/listings` endpoint'i ekle: ürün, il, ilan tipi, tarih filtresi.
- [ ] `POST /api/v1/listings/:id/offers` endpoint'i ekle.
- [ ] `POST /api/v1/listings/:id/report` endpoint'i ekle.
- [ ] İlan oluşturma için auth zorunlu yap.
- [ ] Moderasyon durumu ekle: yeni kullanıcı ilanı admin onayına düşebilir.
- [ ] Rate limit ve spam kontrolü ekle.

**Frontend Checklist**
- [ ] `/ilanlar` liste sayfası.
- [ ] `/ilanlar/yeni` ilan oluşturma sayfası.
- [ ] `/ilanlar/[id]` ilan detay sayfası.
- [ ] İlan kartlarında ürün, miktar, il, fiyat, tarih, kullanıcı tipi.
- [ ] Teklif gönderme modalı.
- [ ] Dashboard'da "İlanlarım" ve "Tekliflerim".
- [ ] Mesajlaşma MVP için "teklif üzerinde mesaj" akışı.
- [ ] Görüntülü görüşme için ilk aşamada Jitsi/Daily link üretimi veya harici link alanı.

**Admin Checklist**
- [ ] İlan moderasyon paneli.
- [ ] Şikayet paneli.
- [ ] Kullanıcı doğrulama/rozet yönetimi.
- [ ] Kötüye kullanım izleme.
- [ ] İlan metni ve görsel moderasyonu.

**Başarı Kriterleri**
- [ ] İlk 100 doğrulanmış ilan.
- [ ] İlan başına teklif oranı takip ediliyor.
- [ ] Şikayet/moderasyon akışı çalışıyor.
- [ ] Kullanıcılar iletişim bilgisi açmadan teklif gönderebiliyor.

**Backend Checklist**
- [ ] Reklam zonlarını tanımlayan `hf_ad_zones` tablosunu ekle.
- [ ] Direkt kampanya ve kreatif tablolarını ekle.
- [ ] `GET /api/v1/ads/slots?zone=&product=&city=` endpoint'i ekle.
- [ ] `POST /api/v1/ads/impression` endpoint'i ekle.
- [ ] `POST /api/v1/ads/click` endpoint'i ekle.
- [ ] Admin endpoint'leri ekle: kampanya CRUD, kreatif upload, aktif/pasif.
- [ ] Reklam gösterimlerinde rate limit ve bot filtreleme planı yap.
- [ ] AdSense için env config ekle: publisher id, slot id, test mode.
- [ ] Consent yoksa kişiselleştirilmiş reklamı devre dışı bırakacak yapı tasarla.

**Frontend Checklist**
- [ ] `AdSlot` bileşeni oluştur: zone, format, responsive size, fallback.
- [ ] `GoogleAdSenseScript` bileşeni oluştur ve layout'a kontrollü ekle.
- [ ] `NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT` ve slot env değişkenlerini tanımla.
- [ ] `frontend/public/ads.txt` dosyası için hazırlık yap.
- [ ] Ana sayfa, fiyatlar, ürün detay, hal detay ve endeks sayfalarına sınırlı slot ekle.
- [ ] Dashboard ve özel iletişim ekranlarında reklamı kapalı tut.
- [ ] Skeleton/fallback alanı ile layout shift'i azalt.
- [ ] Reklam bloker veya boş reklam durumunda house ad veya boş alan davranışı belirle.
- [ ] Cookie/CMP izni alınmadan AdSense script'inin yüklenmemesi için kontrol noktası ekle.

**Admin Checklist**
- [ ] Reklam zonları sayfası: slot adı, ölçü, aktif/pasif.
- [ ] Kampanya listesi: sponsor, tarih aralığı, hedefleme, durum.
- [ ] Kreatif yükleme: desktop/mobile görsel, link, alt metin.
- [ ] Gösterim/tıklama raporu: günlük, zone, kampanya.
- [ ] Sponsorlu içerik etiketi zorunlu alanı.
- [ ] Kampanya bitiş tarihi yaklaşınca uyarı.

**Başarı Kriterleri**
- [ ] Reklam slotları veri deneyimini bozmadan yayında.
- [ ] `ads.txt` root domain'den erişilebilir.
- [ ] CMP/çerez izni ile AdSense yükleme akışı uyumlu.
- [ ] Direkt sponsor kampanyası admin panelden yönetilebiliyor.
- [ ] Gösterim ve tıklama metrikleri günlük izlenebiliyor.
- [ ] Dashboard, sohbet ve özel kullanıcı ekranlarında reklam gösterilmiyor.

**10.1 Veri ve ETL**
- [ ] ETL kaynak sağlık paneli ekle: son çalışma, inserted/skipped, hata, süre.
- [ ] Ham satır karantina tablosu ekle: parse edilemeyen fiyatlar kaybolmasın.
- [ ] Ürün alias yönetimini admin panelde güçlendir.
- [ ] Kaynak bazlı güven skoru oluştur.
- [ ] Geriye dönük veri boşluk raporu üret.
- [ ] Son 2 yıl veri backfill planı hazırla.
- [ ] ETL parser'ları için fixture testleri ekle.
- [ ] `hf_alerts` gibi canlı tabloları seed içinde `DROP TABLE` ile sıfırlama riskini migration disiplinine taşı.

**10.2 Tahmin ve Analitik**
- [ ] Forecast v2 veri modelini ekle.
- [ ] Backtest script'i yaz.
- [ ] MAPE/MAE metriklerini admin panelde göster.
- [ ] Anomali tespit servisi ekle.
- [ ] Fiyat volatilite skoru hesapla.
- [ ] Ürün/şehir fırsat skoru hesapla.
- [ ] Tahmin yanıtlarını cache'le.
- [ ] Model versiyonunu API yanıtında göster.

**10.3 Backend API**
- [ ] Public API için OpenAPI çıktısını görünür hale getir.
- [ ] API key altyapısı ekle: ücretsiz ve kurumsal limitler.
- [ ] Rate limit'i endpoint tipine göre ayrıştır.
- [ ] `/api/v1/map/*` endpoint'lerini tasarla.
- [ ] `/api/v1/cost/*` endpoint'lerini tasarla.
- [ ] `/api/v1/listings/*` endpoint'lerini tasarla.
- [ ] `/api/v1/ads/*` endpoint'lerini tasarla.
- [ ] Endpoint yanıtlarında tutarlı `meta`, `items`, `error` formatı uygula.
- [ ] Kritik endpoint'lerde pagination standardı oluştur.

**10.4 Frontend Ürün Deneyimi**
- [ ] `/urun/[slug]` sayfasını karar ekranına dönüştür: fiyat, tahmin, hava riski, sezon, uyarı.
- [ ] `/hal/[slug]` sayfasına şehir bazlı hava + fırsat sinyali ekle.
- [ ] `/harita` sayfası için responsive harita/list görünümü tasarla.
- [ ] `/maliyet-simulatoru` sayfası ekle.
- [ ] `AdSlot` bileşeniyle kontrollü reklam alanları ekle.
- [ ] Reklam slotlarında layout shift'i azaltacak sabit yükseklik ve fallback kurgula.
- [ ] Forecast ve maliyet sonuçları için paylaşılabilir link üret.
- [ ] Kullanıcı dashboard'una "Tahminlerim", "Simülasyonlarım", "İlanlarım" bölümleri ekle.
- [ ] Boş veri, düşük güven ve eski veri durumları için standart uyarı bileşeni oluştur.

**10.5 Admin Panel**
- [ ] Hızlı fiyat girişine kalite, lot, açıklama alanları ekle.
- [ ] Forecast run ve model metrikleri sayfası ekle.
- [ ] Arz-talep moderasyon paneli ekle.
- [ ] İlan moderasyon paneli ekle.
- [ ] Reklam kampanyaları ve banner yönetimi sayfası ekle.
- [ ] Ürün-hava hassasiyeti yönetim ekranı ekle.
- [ ] Maliyet şablonu yönetimi ekle.
- [ ] Dashboard özetine veri kalitesi kartları ekle.

**10.6 Güvenlik, KVKK ve Moderasyon**
- [ ] Kullanıcı rol/profil tipini netleştir: çiftçi, halci, alıcı, kurumsal.
- [ ] Arz-talep ve ilan verisi için açık rıza metni ekle.
- [ ] Reklam ve çerez izinleri için CMP/consent akışı ekle.
- [ ] KVKK, gizlilik ve çerez politikalarını reklam/kişiselleştirme metinleriyle güncelle.
- [ ] Konum verisini hassaslaştırmadan önce anonimleştirme kuralı uygula.
- [ ] İlan ve mesajlaşma için şikayet/engelleme akışı ekle.
- [ ] Görsel yüklemelerde dosya tipi/boyut sınırı ve virüs tarama planı oluştur.
- [ ] Audit log kapsamını pazaryeri aksiyonlarına genişlet.

**10.7 Test, CI ve Operasyon**
- [ ] Backend typecheck ve build'i CI'a bağla.
- [ ] Frontend testlerini ana akışlar için genişlet.
- [ ] Admin panel build kontrolünü CI'a ekle.
- [ ] ETL smoke test komutlarını dokümante et.
- [ ] `ads.txt` erişim kontrolünü deploy checklist'ine ekle.
- [ ] Reklam script'lerinin production/test env ayrımını doğrula.
- [ ] Forecast backtest'i ayrı script olarak koşulabilir yap.
- [ ] Veritabanı backup/restore prosedürünü dokümante et.
- [ ] Sentry uyarılarını kritik cron ve API hatalarına bağla.
- [ ] PM2/Nginx/deploy komutlarını tek runbook altında topla.

**10.8 SEO, Büyüme ve İçerik**
- [ ] Ürün bazlı "fiyat tahmini" long-tail SEO alanlarını hazırla.
- [ ] İl + ürün sayfalarını güçlendir: "Antalya domates hal fiyatı".
- [ ] Haftalık endeks bültenini otomatik içerik sayfasına dönüştür.
- [ ] Harita sayfasını medya ve backlink alabilecek referans sayfa yap.
- [ ] API docs sayfasına kullanım örnekleri ve örnek widget kodu ekle.
- [ ] Maliyet simülatörü için örnek senaryolar yayınla.
- [ ] Reklam verenler için medya kiti hazırla: trafik, kullanıcı profili, slotlar, fiyatlar.
- [ ] Sponsorlu içerik/reklam etiketi dilini standartlaştır.

**10.9 Gelir Modeli**
- [ ] Ücretsiz kullanıcı limitlerini belirle: alarm, kayıtlı simülasyon, ilan sayısı.
- [ ] Pro plan için net değer belirle: geçmiş veri, daha fazla alarm, PDF rapor, sınırsız simülasyon.
- [ ] İşletme planı için API key, rapor ve daha yüksek limitler.
- [ ] Kurumsal plan için SLA, ham veri feed, özel dashboard.
- [ ] Google AdSense gelir testini düşük yoğunluklu slotlarla başlat.
- [ ] Direkt sponsor banner paketlerini belirle: ana sayfa, ürün sayfası, şehir/hal sayfası, bülten.
- [ ] House ad sistemiyle ekosistem projelerine ücretsiz dolgu reklamı göster.
- [ ] İlan tarafında ilk aşamada ücret alma; likidite oluşunca öne çıkarılmış ilan modeli düşün.
- [ ] B2B müşteri adayları için demo dashboard hazırla.

**Faz 0 - Temel Sağlamlaştırma**
- [ ] Veri kalite raporu.
- [ ] ETL sağlık paneli.
- [ ] Forecast backtest altyapısı.
- [ ] Seed/migration risklerinin temizlenmesi.
- [ ] Reklam/CMP uyum kararları: AdSense mi, direkt sponsor mu, hibrit mi?

**Faz 1 - Forecast v2 ve Hava Risk Motoru**
- [ ] 2 yıllık veri kapsam raporu.
- [ ] Forecast tabloları.
- [ ] Hava snapshot tabloları.
- [ ] Ürün sayfasında tahmin bandı + risk açıklaması.
- [ ] Admin model metrik ekranı.
- [ ] 3 kontrollü reklam slotu ve `ads.txt` hazırlığı.

**Faz 2 - Maliyet Simülatörü**
- [ ] Cost tabloları.
- [ ] Hesaplama endpoint'i.
- [ ] `/maliyet-simulatoru` frontend sayfası.
- [ ] Kayıtlı simülasyonlar dashboard'u.
- [ ] 10 ürün için varsayılan şablon.

**Faz 3 - Arz-Talep Sinyalleri ve Harita**
- [ ] Arz/talep sinyal tabloları.
- [ ] Kullanıcı sinyal gönderme akışı.
- [ ] Bölgesel metrik cron'u.
- [ ] `/harita` sayfası.
- [ ] Gizlilik eşiği ve moderasyon.

**Faz 4 - İlan ve Teklif MVP**
- [ ] Marketplace profil.
- [ ] İlan liste/detay/yeni ilan.
- [ ] Teklif gönderme.
- [ ] Dashboard ilanlarım/tekliflerim.
- [ ] Admin ilan moderasyonu.

**Faz 5 - İletişim ve B2B Ürünleştirme**
- [ ] Sohbet.
- [ ] Görüntülü görüşme entegrasyonu.
- [ ] Güven puanı/doğrulama.
- [ ] API key ve kurumsal limitler.
- [ ] Raporlama ve özel dashboard.
- [ ] Direkt sponsor satış paketleri ve medya kiti.

**12. İlk Açılacak Somut İş Paketleri**
- [ ] `hf_forecast_runs`, `hf_forecast_predictions`, `hf_forecast_model_metrics` şema taslağı.
- [ ] 7 günlük forecast backtest script'i.
- [ ] `/urun/[slug]` tahmin kartı revizyonu.
- [ ] Tarımİklim hava verisinin backend snapshot tablosuna alınması.
- [ ] Maliyet simülatörü için hesaplama formülü ve veri modeli dokümanı.
- [ ] Arz/talep sinyali için minimal tablo ve API sözleşmesi.
- [ ] `AdSlot`, `ads.txt`, AdSense env ve CMP karar dokümanı.
- [ ] KVKK/gizlilik ilkeleri: konum, ilan, mesajlaşma ve fiyat sinyali için ürün kuralları.
