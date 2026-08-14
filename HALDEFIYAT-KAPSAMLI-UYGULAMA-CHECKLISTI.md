# HalDeFiyat Kapsamlı Uygulama Checklist'i

**Tarih:** 13 Ağustos 2026

**Konum:** Proje kökü — bu dosya programın ana takip belgesidir.
**Kapsam:** Durum raporundaki 12 bulgu, eklenti kataloğundaki 10 fikir, ayrıntılı PDF incelemesi, güvenli “Satıcıyı ara” kararı, üç görsel konsept, tüm public frontend sayfaları, dashboard, veri güveni, SEO, analitik, erişilebilirlik, test, deploy ve canlı kabul.

## 0. Kullanım kuralları

- `[ ]` başlamadı · `[~]` çalışılıyor · `[x]` tamamlandı · `[!]` engelli · `[-]` kapsam dışı/iptal.
- Bir iş yalnız kod yazıldığında değil; test, canlı kabul kanıtı ve gerekiyorsa doküman tamamlandığında `[x]` yapılır.
- Her iş kaydında mümkünse PR/commit, sorumlu, tarih, test çıktısı ve canlı URL bulunur.
- Aynı anda bir fazın en fazla 2–3 iş paketi aktif tutulur; yarım iş biriktirilmez.
- Canlı sorunlarda önce log, DB/API cevabı ve canlı sayfa doğrulanır; yalnız statik koddan sonuç çıkarılmaz.
- Mevcut kirli worktree ve başkalarının değişiklikleri korunur; geniş overwrite yapılmaz.
- Tema değişikliği feature flag veya kontrollü rota ile yayınlanır; doğrudan tüm siteye tek seferde açılmaz.
- İçerik/veri doğru değilse görsel olarak saklanmaz; kök neden ve fallback birlikte çözülür.
- Bu dosya §15 (Fable 5 ek denetimi, 2026-08-13) ile birlikte okunur; bir madde kayıtlı proje kararıyla çelişiyorsa §15'teki kayıtlı karar geçerlidir.

## 1. Kaynak ve kararların tekleştirilmesi

### 1.1 Ana referanslar

- [x] R1.1 `docs/PDF-RAPORLARI-AYRINTILI-INCELEME.md` bulguları ana checklist ve Faz 0 kanıtlarıyla çapraz kontrol edildi.
- [x] R1.2 Ana rapordaki faz ve güvenli arama kararları korundu; public numarasız arama talebi canlıya alındı.
- [x] R1.3 Eski düzeltme/yenileme checklist'i kaynak kabul edildi; tek yürütme kaynağı bu kök checklist olarak sabitlendi.
- [x] R1.4 Ürün birleştirme playbook'u veri fazının bağlayıcı alt prosedürü olarak korundu; farklı birimler körlemesine merge edilmiyor.
- [x] R1.5 Veri sağlığı/tüketicileri işleri Faz 1–2 veri bekçisi ve tüm tüketicilerden karantina kapsamına bağlandı.
- [x] R1.6 GEO/SEO, reklam ve dashboard işleri ilgili fazlarda mevcut altyapının üstüne inşa ilkesiyle referanslandı.
- [x] R1.7 `konsept-gorselleri/README.md` ve 7 pano `docs/TEMA-KARAR-KAYDI.md` kararının görsel eki yapıldı.

### 1.2 Eski plan çakışmalarını kapatma

- [x] R1.8 `frontend/FRONTEND-PLAN.md` mevcut kod ve Ağustos kararlarıyla yeniden değerlendirildi.
- [x] R1.9 Eski planın koyu neon, ambient orb, terminal/kripto ve emoji hedefleri tarihsel uyarıyla iptal edildi; public layout'tan ambient katman çıkarıldı.
- [x] R1.10 Eski 12 bölümlü hedef iptal edildi; fiyat-arama odaklı IA tema kararına işlendi.
- [x] R1.11 Sürekli hareket azaltılmış-hareket kuralına bağlandı; ticker `prefers-reduced-motion` altında duruyor, varsayılan tasarım öğesi sayılmıyor.
- [x] R1.12 Görünür metrikler canlı overview/market/product verisinden üretiliyor; sabit iddialı sayı yazılmıyor.
- [x] R1.13 Güncel mimari ve sayfa ailesi kararı `docs/TEMA-KARAR-KAYDI.md` ile Faz 0 envanterine yazıldı; eski plan tarihsel işaretlendi.

### 1.3 Konsept seçimi kapısı

- [x] R1.14–R1.20 Yedi pano; ilk ekran, fiyat/kaynak/tablo, editoryal okuma, ilan yoğunluğu, çağrı gizliliği, veri şeffaflığı ve B2B güveni eksenlerinde puanlandı.
- [x] R1.21 Üç yön için 12 ölçütlü 1–5 karar matrisi oluşturuldu; Temiz Veri 59/60 ile seçildi.
- [x] R1.22 Ana yön ve Pazar Defteri'nden alınacak editoryal parçalar `docs/TEMA-KARAR-KAYDI.md` dosyasına yazıldı.
- [x] R1.23 Logo, renk, font, fotoğraf, kart, tablo, hareket ve dil kararları kesinleştirildi.
- [x] R1.24 Tema kapısı geçildi; restyle yalnız karar kaydı oluşturulduktan sonra ortak tokenlardan başlatıldı.

## 2. Faz 0 — Canlı baz çizgisi ve teknik keşif

### 2.1 Canlı bulgu doğrulama

- [x] F0.1 Ana sayfayı masaüstü ve 390 px mobilde canlı kaydet. Kanıt: `output/playwright/faz0/home-desktop.png`, `home-mobile.png`.
- [x] F0.2 Temiz profilde ilk ziyaret açık; `theme=dark` tercihi reload sonrası koyu olarak korunuyor. Canlı Playwright kabulü Faz 0 envanterinde.
- [x] F0.3 Masaüstü 9.289 px; mobil 16.465 px/13 bölüm; ilk fiyat rotası ilk ekrandan 1 tık. Yoğunluk iyileştirmesi Faz 3'te açık.
- [x] F0.4 `Domates (...)`, `Erik (...)` ve diğer şablon artıkları için canlı tarama yap; Domates kök nedeni ortak display-name guard ile kapatıldı. Kanıt: Faz 0 raporu ve ürün alias/birim envanteri.
- [x] F0.5 Domates market karşılaştırmasındaki 546 TL örneğinin güncel durumunu DB/API/canlı sayfada doğrula. Canlı değer 546,21 TL; türev guard eklendi.
- [x] F0.6 Haftalık raporlarda `Invalid Date`, boş veya yanlış tarih taraması yap. Canlı hata doğrulandı; ortak ISO tarih düzeltmesi eklendi.
- [x] F0.7 `avakado`/`avokado` ve `maydonoz`/`maydanoz` çiftleri canlı DB’de satır sayısı, tarih ve birimle doğrulandı; kullanıcı etiketleri `Avokado (Adet/Kg)` ve `Maydanoz (Demet/Bağ)` olarak ayrıldı. Geniş canonical audit master duplicate `0`, public variant `0` ve kategori uyumsuzluğu `0` verdi; kör canonical merge yasağı korunuyor. Kanıt: `artifacts/renewal-2026/canonical-urun-birim-kabul-2026-08-14.md`.
- [x] F0.8 Aktif katalogda farklı birimli 46 aday grup export/tarama ile doğrulandı; merkezi API etiketleyicisi ve canlı kabul örnekleri `coklu-birim-urun-denetimi-2026-08-13.md` içinde.
- [x] F0.9 Ana sayfa, harita, mobil hero ve fiyat sayfalarındaki sayaçları yan yana kaydet. `1.234 ürün / 29 aktif il / 19 güncel il`.
- [x] F0.10 Sahiplik/finansman ve hakkımızda sayfalarının gerçek muhatap bilgilerini kontrol et. Muhatap yalnız “HalDeFiyat”; eksik devam ediyor.
- [x] F0.11 İlan detayında telefonun HTML, RSC payload, API, JSON-LD ve `tel:` içinde sızıp sızmadığını kontrol et. API alanı + serbest metin + frontend `tel:` sızıntısı doğrulandı.
- [x] F0.12 PDF'deki 12 madde canlı/API/DB/kod kanıtıyla sınıflandırıldı. Kanıt: `artifacts/renewal-2026/pdf-bulgu-siniflandirmasi-2026-08-13.md`.

### 2.2 Teknik envanter

- [x] F0.13 Token ve 349 hard-coded renk eşleşmesi Faz 0 teknik envanterine kaydedildi.
- [x] F0.14 ThemeProvider, toggle, root layout ve hydration davranışı haritalandı; dark/light varsayılan çelişkisi düzeltildi.
- [x] F0.15 58 public sayfa veri, editoryal, pazar, kurumsal, güven/yasal ve auth ailelerine ayrıldı.
- [x] F0.16 Ortak UI bileşenleri tekrar sıklığına göre yüksek/orta/özel olarak listelendi.
- [x] F0.17 Emoji kullanılan 170 TS/TSX satırı envantere alındı; ikon/dekoratif/içerik sınıflandırma borcu kaydedildi.
- [x] F0.18 Hard-coded renk, radius, shadow, font ve genişlik borcu ile geçiş sırası raporlandı.
- [x] F0.19 90 client island ve ağır etkileşim sınırları kaydedildi; ana mobil ağacın UA ile SSR ayrımı doğrulandı.
- [x] F0.20 Ana veri endpoint'leri 60–21.600 sn revalidate/no-store, 15 sn timeout, boş/unknown fallback ve dynamic/ISR farkıyla matrise döküldü: `artifacts/renewal-2026/faz0-teknik-envanter-2026-08-13.md`.
- [x] F0.21 Public telefonun repository→controller→DTO sanitizer→page akışı Faz 0 envanterinde haritalandı.
- [x] F0.22 Ürün kaynak→ETL→match/alias→canonical/birim→price→API→display akışı haritalandı.

### 2.3 Baz metrik ve kabul hedefi

- [~] F0.23 `BLOCKED-EXTERNAL`: Ana sayfa mobile Lighthouse bazı ve çoklu rota ham raporları alındı; ölçüm makinesi CPU doygun, PageSpeed API kotası 429. Stabil bağımsız runner olmadan karşılaştırılabilir performance skoru üretilemez. Accessibility/Best Practices/SEO kabulü tamam.
- [~] F0.24 `BLOCKED-EXTERNAL`: `/prices/overview` 30–48 sn darboğazı 2,56 sn soğuk/3–10 ms sıcak seviyesine indirildi; gerçek INP/CrUX saha verisi trafik ve 28 günlük pencere gerektiriyor. Kanıt: `artifacts/renewal-2026/prices-overview-performans-kabul-2026-08-14.md`.
- [~] F0.25 `BLOCKED-EXTERNAL`: Kontrast, accessible-name ve unsized-image bulguları düzeltildi; Chromium axe/Lighthouse erişilebilirlik kabulü geçti. Gerçek NVDA/VoiceOver cihaz matrisi dış test ortamına bağlı.
- [x] F0.26 GSC bazı: 623 master/183 indexed-benzeri, 612 eski URL/388 redirect, 406 sitemap URL; 2/4/8 haftalık izleme planı ve readonly submit engeli kaydedildi.
- [x] F0.27 Son 30 gün audit/CTA/iş sonucu bazı kaydedildi; ürün 11.739, fiyat listesi 1.775, ilan detay 58, iletişim 15 görünüm; 12 bülten, 0 ilan/iletişim/arama sonucu. Search event'i yokluğu “ölçülemiyor” olarak açıkça işlendi.
- [x] F0.28 Veri bazı: 1.055.511 satır, %76,68 midpoint proxy, 0 unknown birim, %13,94 ürün-satır birim inceleme kohortu, 3 akışsız kaynak, karantina kuyrukları 0.
- [x] F0.29 Performans, trafik, 5xx, CTA, search, sentetik ortalama, birim, SLA, ETL, GSC ve call KPI'ları baz+hedef+ölçüm kaynağı+sorumluyla teknik envantere işlendi.
- [x] F0.30 Canlı kabul kanıtlarının saklanacağı `artifacts/renewal-2026/` yapısını tanımla; ilk Faz 0 raporu eklendi.

### Faz 0 kabul kapısı

- [x] G0.1 PDF bulgularının tamamı canlı kanıtla sınıflandırıldı; yanlış pozitif yok, kısmi ve dış-onay bağımlı işler açıkça ayrıldı.
- [x] G0.2 Teknik envanter; route/component/token, endpoint-cache-fallback, canlı trafik/analytics, veri/ETL, GSC ve KPI sahiplik bölümleriyle tamamlandı.
- [x] G0.3 Başka kişilerin backend WIP değişiklikleri ve doküman taşıma işlemleri korunuyor; kapsam dışı dosyalara dokunulmadı.
- [x] G0.4 Yedi pano ve 12 ölçütlü karar matrisi hazır; tema kararı kayda alındı.

## 3. Faz 1 — P0 güvenlik, gizlilik ve görünür hata düzeltmeleri

### 3.1 Güvenli “Satıcıyı ara” MVP

- [x] F1.1 Public listing tipinden gerçek `contactPhone` alanını ayır; public DTO `contactPhone:null` ve `raw:null` döndürüyor, owner/admin akışı korunuyor.
- [x] F1.2 Liste ve detay endpoint’lerinin gerçek telefonu public döndürmediğini unit ve deploy sonrası canlı API/HTML taramasıyla doğrula.
- [x] F1.3 `hidePhoneIfNeeded` yaklaşımını “varsayılan gizli” modele geçir; opt-in açık telefon bırakma.
- [x] F1.4 İlan detayındaki doğrudan `tel:` bağlantısı ve açık numara metnini kaldır.
- [x] F1.5 Canlı HTML/RSC/API/JSON-LD sızıntı taraması tamamlandı; Organization telefonu meşru. Call-request analytics yalnız ID/slot içeriyor; Sentry request body/cookie/auth header/query PII scrub ve `sendDefaultPii:false` ile korundu.
- [x] F1.6 `call_requests` veri modelini tasarla: listing, buyer, seller, state, preferred slot, note, consent, timestamps.
- [x] F1.7 Durumları tanımla: `pending`, `notified`, `accepted`, `declined`, `expired`, `cancelled`, `completed`.
- [x] F1.8 Migration’ı additive ve mevcut ilanlarla uyumlu hazırla; rollback tabloyu düşüreceği için yalnız operasyon onayıyla uygulanır.
- [x] F1.9 Yetkili `POST /listings/:id/call-requests` endpoint’i ekle.
- [x] F1.10 Aynı ilan+alıcı için aktif talebi 24 saat engelleyen idempotency kuralı ekle.
- [x] F1.11 Alıcı günlük 5, ilan+alıcı 24 saat, satıcı günlük 25 DB kotası ve IP başına 10/saat route burst limiti eklendi; ham IP saklanmıyor.
- [x] F1.12 Auth olmayan kullanıcı girişe, giriş yapmış fakat doğrulanmamış kullanıcı güvenli hesap doğrulama paneline yönlendiriliyor. Backend doğrulanmış e-posta veya aynı kullanıcıya bağlı süreli HMAC OTP tokenı olmadan talebi 403 ile reddediyor; SMS pasifken Google doğrulanmış e-posta yolu görünür. Canlı ve mobil kabul: `artifacts/renewal-2026/arama-talebi-kimlik-sms-guvenlik-kabul-2026-08-14.md`.
- [x] F1.13 Yetkili backend profil özeti tam numarayı sunucuda maskeliyor; form `05** *** ** 67` biçimini veya profil tamamlama linkini gösteriyor. Canlı auth kabulünde tam telefon yanıt gövdesinde yok; kanıt `artifacts/renewal-2026/arama-talebi-maskeli-profil-kabul-2026-08-14.md`.
- [x] F1.14 İlk MVP bildirimi mevcut Telegram admin kanalına, alıcı/satıcı paneline ve doğrulanmış aktif satıcının e-postasına bağlandı. E-posta alıcı PII'si taşımaz, üç denemeyle sınırlıdır; e-posta/Telegram başarılarından biri teslim işaretini yazar. Netgsm provider/credential/flag bilinçli olarak pasif ve fail-closed.
- [x] F1.15 Telegram bildiriminde alıcının telefonu/e-postası/adı paylaşılmıyor; yalnız ilan, tercih zamanı, not ve talep no gönderiliyor.
- [x] F1.16 Satıcı dashboard’una talep kabul/ret/tamamla kontrolleri ekle; geçişler backend sahiplik kuralıyla korunuyor.
- [x] F1.17 Satıcının ilan bazlı arama talebi kabul ayarı ve dört uygun zaman seçeneği forma/API'ye eklendi; backend kapalı ilanı ve seçilmemiş slotu ayrıca reddediyor. Telegram'daki sahipsiz ilanlarda kapalı. Migration, 7/7 test, canlı API ve 390×844 tarayıcı kabulü: `artifacts/renewal-2026/satici-arama-tercihleri-kabul-2026-08-14.md`.
- [x] F1.18 Alıcı dashboard’una talep durumu ve yalnız açık talepte iptal kontrolü ekle.
- [x] F1.19 “Satıcıyı ara” CTA/formu deploy edildi; desktop sidebar sticky, mobil CTA alt navigasyonun üstünde 390×844 canlı Playwright görüntüsüyle doğrulandı.
- [x] F1.20 Panel başlığını “Arama talebi gönder” yap; anlık bağlantı vaadi verme.
- [x] F1.21 “Numaranız ve satıcının numarası açık paylaşılmaz” güven metnini ekle.
- [x] F1.22 Uygun zaman, kısa not, zorunlu KVKK onayı ve gizlilik bağlantısını erişilebilir form olarak ekle.
- [x] F1.23 Başarı, yükleniyor, auth, alıcı/satıcı/IP kotası, duplicate, kendi ilanı ve genel servis hatası var; yanıtsız pending/notified talepler 48 saatte idempotent `expired` oluyor.
- [x] F1.24 Mevcut “Mesaj gönder / teklif ver” formu arama talebinin altında korunuyor.
- [x] F1.25 Public ilan ve arama-talebi serbest metnindeki telefon/e-posta kayıttan/Telegram'dan önce maskeleniyor; durum/zaman auditleniyor. Audit URL/referrer hassas query anahtarları ve bilinmeyen anahtardaki telefon/e-posta değerleri testli scrub ediliyor; request body kaydedilmiyor.
- [x] F1.26 Normal kullanıcıya görünmeyen honeypot ve yalnız olağandışı hızlı/user-agent'siz akışta çıkan, 5 dakikalık HMAC imzalı ve kullanıcı+ilan bağlı güvenlik sorusu eklendi. Canlı yan etkisiz kabul 428→challenge→kimlik kapısı, honeypot 400 ve DB satır sayısı 0→0 ile geçti. Kanıt: `artifacts/renewal-2026/arama-risk-kurumsal-guven-kabul-2026-08-14.md`.
- [x] F1.27 KVKK aydınlatma; veri sorumlusu, işleme amaçları, hukuki sebepler, aktarım, haklar ve açık saklama/silme süreleriyle güncellendi. Terminal arama talepleri 90 gün, OTP süresi +1 gün, audit 30 gün retention altında; canlı iş 4 süresi geçmiş OTP kaydını sildi. Kanıt: `artifacts/renewal-2026/kvkk-kunye-gelir-tema-kabul-2026-08-14.md`.
- [x] F1.28 `phone_click` yerine `call_request_view/submit/accepted/declined/cancelled/completed` eventlerini mevcut attribution-aware analytics katmanına bağla; parametrelerde telefon/e-posta/not yok.
- [x] F1.29 DTO data-leak, HMAC secret, consent ve status validation testlerine gerçek DB/auth/CSRF/kota/audit fixture'ı eklendi; geçici veriyi temizleyen 22/22 kabul geçti. Kanıt: `artifacts/renewal-2026/kalan-guvenlik-dagitim-tahmin-kabul-2026-08-14.md`.
- [x] F1.30 Deploy sonrası public liste/detay API, HTML/RSC, `tel:` ve serbest metin sızıntı testini tekrar yap; 2 canlı kayıtta satıcı telefonu sızıntısı 0.

### 3.2 Invalid Date ve içerik artıklarını kapatma

- [x] F1.31 Kök neden doğrulandı: tarih alanı koşulsuz `new Date(...).toLocaleDateString()` ile parse ediliyor, geçersiz değer arayüze aynen yansıyordu.
- [x] F1.32 ISO date-only değerini timezone kaydırmadan, tam ISO değerini `tr-TR` ile biçimleyen ortak tarih yardımcı katmanı oluşturuldu.
- [x] F1.33 Geçersiz/boş tarihte alanı saklayan `null` fallback davranışı eklendi.
- [x] F1.34 Analiz listesi/detayı, freshness badge, karşılaştırma, dashboard ve yıllık rapor görünür tarihleri ortak güvenli yardımcı/guard katmanında; sitemap `validSitemapDate`, schema `schemaDateRange` kullanıyor.
- [x] F1.35 `Invalid Date`, `undefined`, `NaN`, boş değer ve `2026-02-31` gibi imkânsız tarih fixture'ları ortak parser testinde; şablon artığı guard'ları ayrı regresyon testleriyle korunuyor.
- [x] F1.36 Public fiyat, üretim ve veri sağlığı yüzeylerinde ham `sourceKey/sourceApi` gösterimi kaldırıldı; sekiz kritik mobil rotada snake_case görünür anahtar sıfırlandı. Kanıt: `artifacts/renewal-2026/kaynak-etiketi-sablon-artigi-kabul-2026-08-14.md`.
- [x] F1.37 Fiyat/hal/üretim/veri sağlığı kaynak adları birincil resmî URL'ye ve ilgili yüzeyler “Metodoloji” iç bağlantısına bağlandı; eksik katalog kaynakları market metadata'sı + ETL base URL fallback'iyle kapatıldı. Kanıt: `artifacts/renewal-2026/kaynak-etiketi-sablon-artigi-kabul-2026-08-14.md`.

### 3.3 Künye ve güven yüzeyleri

- [~] F1.38 `BLOCKED-EXTERNAL`: Tüzel kişi GZL Teknoloji, platform sahibi/sektör ağı Atakan Şahin, teknik yürütme Orhan Güzel ve kurumsal e-posta canlıya işlendi. Açık adres/şehir doğrulanmış resmi kayıt ve sahip onayı olmadan üretilemez; tek açık künye alanı budur. Karar: `docs/GELIR-VE-KUNYE-KARAR-KAYDI.md`.
- [x] F1.39 Sahiplik ve finansman sayfası gerçek rol/işletmeci ayrımı, editoryal bağımsızlık, ilan-hal fiyatı ayrımı ve mock paket fiyatı uyarısıyla canlı güncellendi. Kanıt: `artifacts/renewal-2026/kvkk-kunye-gelir-tema-kabul-2026-08-14.md`.
- [x] F1.40 Hakkımızda sayfasında GZL Teknoloji, Atakan Şahin ve Orhan Güzel rol ayrımı; platform amacı, veri yaklaşımı ve şeffaflık belgeleri canlı gösteriliyor.
- [x] F1.41 Ortak `PolicyLinks`; metodoloji, veri kaynağı, editoryal, düzeltme, KVKK, gizlilik, kullanım, API ve sahiplik yüzeylerini tüm legal şablonlarda karşılıklı bağlıyor.
- [x] F1.42 Footer, İletişim ve Organization/publisher schema; `legal_entity_name`, `responsible_publisher_name`, `technical_contact_name` alanlarını tek `site_settings`/`fetchSiteSettings` sözleşmesinden okuyor. Canlı JSON-LD ve üç ayar API'de doğrulandı.
- [x] F1.43 API/veri lisansı kaynak kurum haklarını yeniden lisanslamıyor; public API SLA vermez. Yüksek hacim, yeniden satış, beyaz etiket, özel SLA ve kurumsal rapor ayrı yazılı lisans/onay kapısına bağlandı; mock fiyatlar teklif değildir. Canlı kabul: `artifacts/renewal-2026/arama-risk-kurumsal-guven-kabul-2026-08-14.md`.

### 3.4 Geçici anomali emniyeti

- [x] F1.44 Ürün/birim bazlı dinamik aralık matrisi üretildi: 15.000 yakın dönem kayıt, 608 grup, 8 insan-review adayı. Seyrek/mevsimlik ve tarihsel birim karışımı nedeniyle matris kör mutlak blok değil; tarih-yakın/kaynak/önceki değer guard'ına review girdisidir. Kanıt: `artifacts/renewal-2026/kalan-guvenlik-dagitim-tahmin-kabul-2026-08-14.md`.
- [x] F1.45 Mutlak eşik ve medyan sapmasını birlikte kullanan yayın öncesi guard ekle. (Merkezi `upsertPriceRow`; en az 5 emsal, 4x/0.25x sapma.)
- [x] F1.46 Şüpheli kayıtları silme; karantinaya ve inceleme kuyruğuna al. (`hf_price_quarantine`: ham değer, reason, severity, confidence, median, review durumu.)
- [x] F1.47 Karantinalı veriyi page/API/widget/CSV/bülten/sosyal/rapordan hariç tut. Yeni kayıtlar yayın öncesi guard'dan geçiyor; tarihsel `hf_market_blackouts` filtresi fiyat liste/geçmiş/widget/şehir/endeks/haftalık-mevsimsel/yıllık rapor/RSS/Telegram/alarm/ilan tüketicilerine yayıldı, `*_wayback` kurtarma kayıtları korunuyor. Kanıt: `artifacts/renewal-2026/yoy-karantina-kabul-2026-08-14.md`.
- [x] F1.48 546 TL domates ve yanlış adet/kg vakalarını fixture yap. (Backend hal/retail guard ve frontend türev testlerinde 546; `PRODUCT_UNIT_MISMATCH` adet/kg fixture’ı testli.)
- [x] F1.49 Guard false-positive örneklemi insan etiketlemesiyle tamamlandı; mercimek/kuşkonmaz/mangostan gibi karma tarihsel kohortlarda statik ürün tavanının false-positive üreteceği kaydedildi. Canlı guard'ın tarih-yakın emsal ve kaynak medyanı otorite bırakıldı. Kanıt: `artifacts/renewal-2026/kalan-guvenlik-dagitim-tahmin-kabul-2026-08-14.md`.

### Faz 1 kabul kapısı

- [x] G1.1 Public listing API, HTML/RSC ve JSON-LD canlı taramalarında gerçek ilan telefonu sıfır; Organization kurumsal telefonu ayrı ve meşru.
- [x] G1.2 Arama talebi uçtan uca, kota, CSRF, rol geçişi, PII redaksiyonu ve audit ile gerçek DB fixture'ında 22/22 çalışıyor.
- [x] G1.3 Sekiz kritik mobil rotada Invalid Date/undefined/NaN/Lorem/object artığı, görünür ham snake_case anahtar ve yatay taşma sıfır; konsol 0 hata/uyarı. Kanıt: `artifacts/renewal-2026/kaynak-etiketi-sablon-artigi-kabul-2026-08-14.md`.
- [x] G1.4 Kritik fiyat anomalileri yayın öncesi guard/karantina ile durduruluyor; tarihsel donmuş/anomali aralıkları tüm public tüketicilerde merkezi blackout filtresinden geçiyor. 546 TL türev vaka, 2025 donmuş seri ve blackout tarih-normalizasyon regresyonu testli/canlı kabul edildi.
- [~] G1.5 `BLOCKED-EXTERNAL`: Gerçek işletmeci/rol kimliği, KVKK, sahiplik, veri/editoryal/düzeltme ve API lisans politikaları canlı ve çapraz bağlıdır; yalnız doğrulanmış resmi açık adres/şehir kaydı ve sahip onayı bekliyor.

## 4. Faz 2 — Ürün sözlüğü, birim, metrik ve veri bekçisi

### 4.1 Canonical ürün sözlüğü

- [x] F2.1 Canonical ID/slug/display/category/defaultUnit/aliases/canonical/family/variant sözleşmesi `docs/CANONICAL-URUN-VE-BIRIM-SOZLESMESI.md` ve tipli backend modülünde yazıldı.
- [x] F2.2 Türkçe `tr-TR` casefold, diakritik, boşluk, bilinen yazım ve kullanıcı gösterim kuralları sabitlendi.
- [x] F2.3 Exact 100, güvenli normalize 95, kayıtlı alias 90, bilinmeyen 0/review eşleme skoru testli tanımlandı; fuzzy otomatik merge yok.
- [x] F2.4 Yeni/belirsiz adları otomatik yeni public ürün yapma; review kuyruğuna gönder. (Migration 088 ile idempotent ham gözlem kuyruğu kuruldu; ana ETL auto-register yolu kapatıldı. Admin alias/pasif taslak/ret kararı verir; ham kaynak, fiyat, tarih ve tekrar sayısı korunur.)
- [x] F2.5 Maydanoz/Maydonoz, Avokado/Avakado, Incir/İncir ve Hındıstan/Hindistan fixture'ları canonical contract testine eklendi.
- [x] F2.6 Format/menşe/grade/renk/çeşit qualifierları anlamlı varyant olarak korunacak şekilde sözleşme ve playbook kuralına bağlandı.
- [x] F2.7 `Domates Beef != Domates` negatif fixture'ı eklendi; kelime/diakritik benzerliği otomatik merge yetkisi vermiyor.
- [x] F2.8 Balık/et/sebze kategori karışımını kaynak ve kategori sözlüğüyle düzelt. (`canonicalProductCategory` kaynak aliaslarını topluyor; açık balık/et/canlı hayvan ürün sinyali yanlış kaynak kategorisini eziyor. Negatif karışım fixture'ları testli.)
- [x] F2.9 Admin merge/alias arayüzünü canonical sözleşmeyle uyumlandır. (Mevcut aile/merge paneli korunup bilinmeyen ürün kuyruğuna aynı-birim guard'lı alias bağlama ve pasif/noindex taslak oluşturma eklendi; farklı birim alias/merge reddediliyor.)
- [x] F2.10 Arama, filtre, fiyat tablosu, rapor, alarm ve API aynı canonical ürün kimliği/slug sözleşmesine geçirildi. Migration 090 eski favori/alarm/firma kayıtlarını master kimliğe taşıdı; canlı invariant'ta dört varyant tüketici sayacı da 0. Arama, filtre, alarm ve karşılaştırma `canonicalOnly`, fiyat/rapor/API `canonicalProduct`, tüm linkler `productHref` kullanıyor. Kanıt: `artifacts/renewal-2026/canonical-urun-birim-kabul-2026-08-14.md`.

### 4.2 Birim ve varyant güvenliği

- [x] F2.11 Ham birim kuralları canonical contract modülünde tekleştirildi; kaynak×ham birim×ürün birimi frekans export'u canlı 1.055.622 satırda çalıştı. Tekrar üretilebilir düşük-temp sorgu: `backend/scripts/qa/unit-frequency-export.ts`; kanıt: canonical kabul raporu.
- [x] F2.12 `kg`, `adet`, `kasa`, `bag`, `demet`, `koli`, `paket`, `litre`, `ton` canonical birimleri tipli sabit olarak tanımlandı; `kg.`, `kilogram`, `bağ`, `lt` legacy yazımları normalize edildi.
- [x] F2.13 Canonical katman bilinmeyen/boş birimde `null/UNKNOWN_UNIT` döndürüyor; varsayımsal kg dönüşümü yapmıyor. Legacy ETL çağrı noktasına geçiş F2.15 ile birlikte yapılacak.
- [x] F2.14 Ürün–varyant–birim izin matrisini kur. (Her ürün/varyant tek canonical default birim; farklı paket birimi ayrı kimlik. Merkezi yazımda enforce ediliyor.)
- [x] F2.15 Bilinmeyen birimi karantinaya al ve admin kuyruğunda göster. (`UNKNOWN_PRODUCT_UNIT` ve `PRODUCT_UNIT_MISMATCH` reason code’ları canlı admin kuyruğunda.)
- [x] F2.16 Fiyat etiketi, tablo başlığı, grafik tooltip ve CSV’de birimi zorunlu göster. (Fiyat tablosu min/ort/maks hücreleri ile ürün, sezon ve karşılaştırma grafik tooltip'leri birimli hale getirildi; CSV'deki zorunlu `Birim` sütunu doğrulandı. Production build ve 390 px canlı DOM kabulü geçti: yatay taşma yok, `kg`, `bag`, `koli` birimleri fiyatlarla birlikte görünüyor. Commit: `b920537c`.)
- [x] F2.17 Geçmiş birimler canlı frekans export'uyla yeniden ölçüldü. Migration 091 yalnız kanıtlanabilir yazım eşdeğerlerini göç etti; kalan 147.161 kanıtsız semantik uyumsuzluk silinmeden public sorgulardan merkezi olarak dışlandı. Kanıtsız `kg→adet/kasa/bag` dönüşümü yapılmadı. Kanıt: canonical kabul raporu.

### 4.3 URL ve SEO göçü

- [x] F2.18 Kopya/yanlış ürün URL’leri için eski→canonical haritası üret. (Canlı 1.235 aktif ürün üzerinden 601 eşleşme üretildi; eksik hedef, zincir ve aktif 410 çakışması yok. Tekrar üretilebilir script: `scripts/seo/product-canonical-map.mjs`; çıktı: `artifacts/renewal-2026/urun-eski-canonical-url-haritasi.md`.)
- [x] F2.19 Gerçek çeşitleri ayrı tut; yalnız alias/thin format varyantlarını doğru hedefe yönlendir. (Ayrı çeşitler `family_slug` altında master kimlikler olarak korunuyor. Tarihsel merge'lerden kalan 11 farklı-birimli ürün migration 085 ile ayrıldı; canlı canonical denetimde 601 varyant, 0 birim uyuşmazlığı, 0 indexli varyant, 0 eksik hedef. Paket/kasa/bağ/demet/adet ayrımı korunuyor. Commit: `015e413f`.)
- [x] F2.20 Tek adımlı 301/308 uygula; zincir ve loop testi yap. (12 iki-sıçramalı hedef migration 084 ile son master'a düzleştirildi; canlı harita `missingTargets=0`, `chainedTargets=0`, `conflicts410=0`. Örnek eski URL'lerde 301 ve nihai hedefte tek hop/200 doğrulandı.)
- [x] F2.21 Canonical metadata/redirect, breadcrumb, kategori/borsa/hal/firma/ticker/favori/arama iç linkleri ve ETL IndexNow bildirimi canonical hedefe geçirildi. Dinamik public üreticiler ortak `productHref` veya backend canonical kimliği kullanıyor; kalan doğrudan URL'ler canonical sitemap/OG/GSC üreticileri ve sabit dokümantasyon örnekleri. Commitler: `63397966`, `c26a3dda`.
- [x] F2.22 Sitemap’ten eski/kopya URL’leri çıkar. (`canonicalSlug` dolu ürünler sitemap üretiminde dışlanıyor; canlı sitemap kabulünde dört eski örnek yok, dört nihai master mevcut; toplam 406 URL.)
- [x] F2.23 Structured data name/url/date/source alanlarını canonical veriden besle. (Ürün Dataset şeması canonical master adı/URL'sini, gerçek gözlem tarih aralığını ve görünür cevap bloğuyla aynı resmi kaynak kümesini `isBasedOn` olarak yayımlıyor.)
- [x] F2.24 Redirect edilen ürünün geçmiş fiyatlarını hedef sayfada koru. (`productPriceHistory` hem master slug'ını hem `canonical_slug=master` çocuklarını okuyor. Canlı `biber-carliston` kabulü: 28 pazar, 2.337 kova, 2021-08-01→2026-08-13. Commit: `029d1956`.)
- [~] F2.25 `BLOCKED-EXTERNAL`: Canlı GSC cache 623 master/1 denetlenmemiş, 612 varyant/0 denetlenmemiş ve 388 redirect olarak doğrulandı. Sitemap submit ortak fonksiyonu hazır; mevcut read-only Google token'ı `403 ACCESS_TOKEN_SCOPE_INSUFFICIENT` verdiği için yazma kapsamlı hesap yeniden yetkilendirmesi gerekiyor. Kanıt: `artifacts/renewal-2026/gsc-canonical-goc-kabul-2026-08-14.md`.

### 4.4 Merkezi metrik sözlüğü

- [x] F2.26 Toplam/fiyatlı/güncel ürün, aktif kaynak ve güncel il tanımları `docs/MERKEZI-METRIK-SOZLUGU.md` içinde yazıldı.
- [x] F2.27 Her metriğin query anlamı, 7/30 günlük penceresi, 300 sn TTL, owner ve gösterim kuralı bağlandı.
- [x] F2.28 Mevcut `/prices/overview` yeniden kullanılip merkezi kaynak olarak genişletildi; paralel stats servisi kurulmadı.
- [x] F2.29 Ana sayfa, harita, data-health, topbar ve mobil hero’yu ortak kaynağa geçir. (Tüm yüzeyler `/prices/overview` içindeki tracked/current ürün, active market/city ve freshness alanlarını kullanıyor. Canlı 390 px kabul: harita 29 güncel şehir/63 aktif hal; taşma yok. Commitler: `c3ab268c`, `6b366252`.)
- [x] F2.30 Endpoint `fresh/stale/unknown`, `measuredAt` ve son kayıt tarihini döndürüyor; tüm tüketici yüzeyleri güncel/gecikmeli/bilinmiyor durumunu aynı sözlükle gösteriyor.
- [x] F2.31 Metrik sözlüğü repo dokümanında ve public metodoloji bağlantısında açıklandı; topbar ile harita özeti metodolojiye doğrudan bağlandı, data-health açıklaması aynı eşikleri gösteriyor.

### 4.5 Veri bekçisi paneli

- [x] F2.32 Mutlak sınır, tarih-yakın medyan sapması, önceki güne sıçrama, kaynak farkı ve stale/freeze kuralları canlı yazım ve public okuma yollarında. Tarihsel backfill kasıtlı olarak kayıt tarihini korur ve güncelmiş gibi sunulmaz; kaynak yayın takvimine göre read-time stale etiketi alır, salt yaş nedeniyle veri silinmez. Commitler: `b5b549f7`, `9612d265`; kabul: `artifacts/renewal-2026/retail-tobb-donma-kabul-2026-08-14.md`.
- [x] F2.33 Anomali reason code, severity ve confidence alanlarını tanımla. (`ABSOLUTE_LIMIT`, `PEER_MEDIAN_DEVIATION`, `PREVIOUS_PRICE_JUMP`, `SOURCE_MEDIAN_DEVIATION`, `STALE_SOURCE_RECORD`, yapısal ve birim reason code'ları tipli; warning/critical ve 0–1 confidence karantinaya yazılıyor. 6/6 guard testi geçti.)
- [x] F2.34 Kuyrukta ürün, kaynak, birim, tarih, önem ve durum filtreleri sun. (Canlı admin kuyruğu: ürün/hal araması, kaynak, birim, tarih aralığı, reason, önem ve durum.)
- [x] F2.35 Onay, ret, düzelt, alias’a bağla ve toplu işlem aksiyonları ekle. (Tekil fiyat onay/ret/düzeltme, bilinmeyen ürünü canonical alias'a bağlama ve en çok 100 kayıtlık toplu onay/ret API+UI akışı tamamlandı.)
- [x] F2.36 Kritik toplu işlem için ön izleme ve çift onay ekle. (Toplu karar önce server snapshot token'lı ön izleme üretiyor; kuyruk değişirse atomik işlem 409 ile kapanıyor. Genel toplu onay ve kritik kayıtlar için iki ayrı açık onay zorunlu; negatif guard QA'sı geçti.)
- [x] F2.37 Her kararın önce/sonra değeri, kullanıcı, zaman ve açıklamasını audit et. (Ham karantina değeri korunuyor; status, zorunlu not, reviewer ve reviewed_at transaction içinde yazılıyor.)
- [x] F2.38 Yanlış kararı geri alıp downstream cache/index/raporu yenile. (Migration 089 önce/sonra fiyat snapshot audit'ini kurdu; rollback sonraki değişikliği ezmeden önceki satırı geri yüklüyor veya eklenen satırı siliyor ve `prices` revalidate ediyor. Uçtan uca QA geçti.)
- [x] F2.39 Kuyruk yaşı ve kritik anomali SLA alarmı oluştur. (Admin kuyruğu 24 saat genel/4 saat kritik eşiklerini, geciken sayıyı ve en yaşlı bekleme süresini kırmızı alarm kartında gösteriyor; ürün eşleme kuyruğu da 24 saat SLA özeti taşıyor.)
- [x] F2.40 Panel erişimini rol bazlı sınırla; CSRF/auth testlerini ekle. (Tüm `/api/v1/admin` rotaları ortak `requireAuth+requireAdmin` kancasında; canlı yetkisiz kabul 401. Cookie mutasyonları cross-site origin/sec-fetch kapısında 403, bearer/same-origin serbest; 5 assertion'lı otomasyon testi geçti.)

### Faz 2 kabul kapısı

- [x] G2.1 Public canonical master `normalize(name)+unit` kopya anahtarı 0; migration 092 çocuk kategorilerini master'a hizaladı ve arama/alarm/karşılaştırma canonical-only seçiciye geçti. Farklı birim ayrı master olarak korunuyor.
- [x] G2.2 Ürün birimiyle uyuşmayan 147.161 tarihsel satır public fiyat, grafik, harita, trending, widget, sayaç ve SEO sorgularından merkezi olarak dışlanıyor; yeni uyumsuz yazım karantinaya düşüyor.
- [x] G2.3 Canlı 601 URL haritasında eksik hedef/zincir/410 çakışması 0; `/urun/domates-koy` tek adım 301→`/urun/domates` ve hedef 200 kabul edildi.
- [x] G2.4 Ana sayfa, harita, data-health, topbar ve mobil hero aynı `/prices/overview` yanıtı ve `public-metrics` tanımlarını kullanıyor; canlı yanıt 1.235 izlenen ürün, 741 güncel ürün, 63 aktif hal ve 29 güncel il döndürdü.
- [x] G2.5 Veri bekçisi audit/rollback ile operasyonel. (Tekil/toplu karar, snapshot token, kritik çift onay, zorunlu not, kullanıcı/zaman/before-after audit, güvenli rollback, SLA alarmı ve cache yenileme aynı transaction akışında; tekrarlanabilir QA scripti: `backend/scripts/qa/price-quarantine-flow.ts`.)

## 5. Faz 3 — Seçilen konsepte göre frontend tasarım sistemi

### 5.1 Tasarım tokenları

- [x] F3.1 Temiz Veri primary/secondary/neutral ve Pazar Defteri editoryal paleti tema karar kaydı ile ortak CSS tokenlarına çıkarıldı.
- [x] F3.2 Success/warning/danger/info tokenları ile fresh/stale/unknown adlandırmaları ortak metrik tüketicilerine yayıldı; operasyon durumu ve fiyat yönü birbirinden ayrıldı.
- [x] F3.3 Fiyat artışını otomatik success yeşili olarak kodlama; nötr trend tokenı kullan. (`--trend-up`, `--trend-down`, `--trend-bg` light/dark tokenları kart, ticker, sezon, popüler ürün, mover, tablo ve varyant yüzeylerinde kullanılıyor.)
- [x] F3.4 Light tema canlı ilk ziyaret varsayılanı; `localStorage.theme=dark` tercihi reload sonrası korunuyor.
- [x] F3.5 `next-themes` root/toggle hydration guard'ına ek olarak SSR-istemci ayrışan ağır SVG harita ayrı `ssr:false` adasına alındı; canlı `/`, `/hal`, `/harita` konsol hatası 0.
- [x] F3.6 Foreground/muted/faint metinleri her iki temada ve ana yüzeyde >=4.5:1, işlevsel border >=3:1 olacak şekilde gerçek HSL tokenlarından ölçüldü; kanıt `artifacts/renewal-2026/wcag-tipografi-kabul-2026-08-14.md`.
- [x] F3.7 Gövde için self-host IBM Plex Sans Variable 100–700, başlık için yalnız yerel Outfit 800 kesinleştirildi; Inter/JetBrains üçüncü font adları ve kullanılmayan font ağırlıkları kaldırıldı.
- [x] F3.8 `display`, `h1`–`h4`, `price-xl/lg/md`, `body`, `label`, `caption`, `data` rolleri responsive ortak ölçekte ve fiyat/veri için tabular rakamlarla oluşturuldu.
- [x] F3.9 4/8 tabanlı spacing, 1100/1400 container ve responsive 4/6/8 padding `PageContainer` ile tanımlı.
- [x] F3.10 Radius ve düşük elevation seviyeleri tema kararında ve ortak tokenlarda standardize edildi; neon glow kaldırıldı.
- [x] F3.11 Grafik serileri/grid, harita low/mid/high/empty/stroke ve tablo header/hover tokenları açık-koyu temaya eklendi; haritadaki runtime hard-coded HSL üretimi kaldırıldı.
- [x] F3.12 CSS variable/Tailwind semantic theme kaynağı tekleştirildi; ana uygulama hard-coded renkleri token/color-mix'e taşındı. Teknik istisnalar `docs/TEMA-RENK-ISTISNALARI.md`, otomatik kapı `bun run check:theme-colors` (140 kullanım, geçti).

### 5.2 Ortak UI bileşenleri

- [x] F3.13 Ortak Button primary, secondary, outline, ghost, danger ve geriye uyumlu success varyantlarıyla standardize edildi.
- [x] F3.14 Ortak Button boyutları en az 44 px; loading `aria-busy`, disabled ve erişilebilir dekoratif spinner içeriyor.
- [x] F3.15 Input/TextArea/Combobox label-hint-error-required ve ARIA sözleşmesi birleşti; SearchableSelect ikinci uygulama olmaktan çıkarılıp ortak Combobox adaptörüne dönüştürüldü.
- [x] F3.16 Ortak `ContentCard` data/editorial/listing/commercial/advertisement türlerini görsel token ve `data-content-type` ile ayırıyor; PriceCard, ListingCard ve editoryal özellik/adım kartları sözleşmeye taşındı. Reklamlar ayrıca semantik `aside` ve görünür sponsor etiketi taşıyor.
- [x] F3.17 `Badge` semantik token + border + metin/ikon sözleşmesine, `FreshnessBadge` bu ortak bileşene taşındı; durum yalnız renkle anlatılmıyor.
- [x] F3.18 PriceCard fiyat, birim, tarih, kaynak ve API `recordCount` değerinden “N kaynak kaydı” örneklemini gösteriyor; sahte placeholder sparkline kaldırıldı.
- [x] F3.19 `PriceTable` desktop semantik tablo + mobil `<article>/<dl>` kart görünümüne ayrıldı; 390 px canlıda 100 kart, tablo gizli, taşma ve konsol hatası 0.
- [x] F3.20 Grafik/harita/fiyat/dashboard skeleton'ları nihai alanın sabit yüksekliğini koruyor; izole Lighthouse CLS `0,0468` ile 0,1 hedefinin altında doğrulandı.
- [x] F3.21 Ortak `StatusState` empty/error/offline/loading rolleri, ikon, açıklama ve aksiyon sözleşmesiyle oluşturuldu; PriceTable boş durumda kullanıyor.
- [x] F3.22 Modal, tema, arama, durum, dashboard, özellik/adım, favori ve karşılaştırma ikonları Lucide'a taşındı; kalan emoji sözlüğü yalnız ürün görsel fallback'idir, kontrol/durum ikonu değildir.
- [x] F3.23 Dekoratif Lucide ikonları `aria-hidden`, etkileşimli ikon kontrolleri erişilebilir ad taşıyor; yedi kritik aile axe/klavye taramasında accessible-name ihlali 0.
- [x] F3.24 Reklam alanı semantik `aside`, `data-content-type=advertisement` ve görünür `Reklam · Sponsorlu` etiketiyle normal içerikten ayrıldı.
- [x] F3.25 Arama/alarm dialoglarında ortak focus trap, ilk odak, Escape, backdrop, body scroll lock ve focus return uygulandı; canlı klavye kabulü geçti.
- [x] F3.26 Global `prefers-reduced-motion` animasyon/transition süresini düşürüyor ve ticker'ı durduruyor; ana sayfa ticker'ı ayrıca kaldırıldı.

### 5.3 Global kabuk

- [x] F3.27 Desktop header Fiyatlar/İlanlar/Takibim görev grupları + Firma/Hakkımızda düzeyine indirildi; alt rotalar dropdown/drawer içinde.
- [x] F3.28 Desktop arama alanı ve mobil 44×44 arama butonu görünür/klavye erişilebilir; mobil aç-kapat ve focus return canlı kabul edildi.
- [x] F3.29 Topbar yalnız merkezi overview'dan tazelik, izlenen ürün, aktif il ve son veri metriklerini gösteriyor; promosyon yok.
- [x] F3.30 Tema düğmesi 44×44, ikincil yüzey, dinamik açık/koyu erişilebilir adı ve `aria-pressed` ile doğrulandı.
- [x] F3.31 MobileBottomNav ana sayfa, fiyatlar, harita ve uyarılar olmak üzere dört tekrar eden kullanıcı görevine sabitlendi; arama ayrıca global header'da.
- [x] F3.32 Footer marka, Fiyat ve Veri, Pazar ve Hizmet, Kurumsal, Yasal ve İletişim gruplarına ayrıldı.
- [x] F3.33 Künye/Sahiplik, metodoloji ve düzeltme politikası bağlantıları global footer'da canlı DOM ile doğrulandı.
- [x] F3.34 Ortak `PageContainer` ve breadcrumb mevcut; standart public içerik sayfalarının eski doğrudan max-width/padding dış kabukları merkezi wrapper'a taşındı. Bölüm bazlı landing gridleri ve firma detayının bilinçli 1180 px medya yerleşimi belgeli istisnadır.

## 6. Faz 4 — Sayfa ailelerinin konsept uyarlaması

### 6.1 Ana sayfa — `konsept 01`

- [x] P4.1 İlk ekranın tek görevi “ürün/hal ara ve güncel fiyatı gör” olarak sabitlendi; mobil ve masaüstü canlı kabul edildi.
- [x] P4.2 Ürün ve hal araması birleşik hero ana kontrolüne taşındı.
- [x] P4.3 Hero, gerçek API satırından gelen öne çıkan son fiyatı görsel kahraman olarak gösteriyor; sahte fallback yok.
- [x] P4.4 Hero fiyatı birim, kayıt tarihi, public kaynak adı, bir doğrulanabilir kaynak ve tazelik durumuyla gösteriyor.
- [x] P4.5 Popüler ürünler API verisinden kısa, taranabilir sıra olarak gösteriliyor; boş veride bileşen sahte satır üretmiyor.
- [x] P4.6 Kayan PriceTicker ana sayfa ağacından kaldırıldı; mobilde hareket etmeyen kısa fiyat sırası kullanılıyor.
- [x] P4.7 Harita/endeks, ilan, analiz, alarm ve SSS fiyat görevinden sonra kısa özet ve ilgili rota bağlantılarıyla sunuluyor.
- [x] P4.8 Ana sayfa bilgi mimarisi hero fiyatı, güncel fiyatlar, bölge, endeks, ilan ve analiz olarak ayrı görevlere indirildi; aynı blok tekrarlanmıyor.
- [x] P4.9 İlk reklam hero ve temel fiyat panosundan sonra, açık etiketli ayrı slotta; mobil ana görev öncesinde reklam yok.
- [x] P4.10 Android mobil UA ve `390x844` viewport'ta fiyat kartına 1–1,5 ekran içinde ulaşıldı; yatay taşma ve konsol hatası yok.
- [x] P4.11 Ana sayfa Dataset schema'sı görünür veri/metodolojiyle uyumlu; lisans `https://haldefiyat.com/api-policy`.
- [x] P4.12 `search_opened → search_submitted → search_result_selected → price_viewed` hunisi canlıda PII'siz doğrulandı. Kanıt: `artifacts/renewal-2026/anasayfa-arama-analytics-kabul-2026-08-14.md`.

### 6.2 Fiyat listesi ve canlı fiyatlar

- [x] P4.13 `/canli-hal-fiyatlari` son kesit/bülten özeti; `/fiyatlar` filtreli arşiv olarak ayrıldı ve kapsamlar karşılıklı bağlandı.
- [x] P4.14 Fiyat arşivi ürün araması, hal/il, kategori, canonical birim ve 1/7/30/90/365 gün tarih eksenleriyle sadeleştirildi.
- [x] P4.15 Filtre, sıralama, sayfa ve sayfa boyutu istemci URL'siyle senkron; paylaşılan URL sunucuda aynı durumu kuruyor.
- [x] P4.16 Toplam/gösterilen kayıt, tarih aralığı, son kayıt tarihi ve güncel/gecikmeli dağılımı filtre sonucunda görünür.
- [x] P4.17 Ortak PriceTable mobilde yatay tablo yerine erişilebilir fiyat kartlarına dönüştü; desktop semantik tablo korunuyor.
- [x] P4.18 Sıralama etiketleri “en yüksek/düşük ortalama fiyat”, “ürün adı” ve “en güncel kayıt tarihi” olarak açık yazıldı.
- [x] P4.19 Filtreli CSV birim, kayıt tarihi, ortalama yöntemi, public kaynak adı/URL/tür/resmi durum, kaynak kodu, uygulanan filtre ve export zamanı metadata'sı taşıyor.
- [x] P4.20 Loading, filtresiz veri yok, filtreli sıfır sonuç, tümü gecikmeli, partial güncel/gecikmeli ve API error/retry durumları ayrı. Kanıt: `artifacts/renewal-2026/fiyat-arsivi-filtre-export-kabul-2026-08-14.md`.

### 6.3 Ürün detay — `konsept 02`

- [x] P4.21 Ürün adı canonical sözlükten gösteriliyor; başlık, breadcrumb, AnswerBlock ve grafik bağlamı canlı `Domates` kabulünde tutarlı, şablon artığı yok. Kanıt: `artifacts/renewal-2026/urun-detay-etkilesim-kabul-2026-08-14.md`.
- [x] P4.22 Ana fiyat/birim/tarih/kaynak/örneklem bloğu ürün girişinde birlikte gösteriliyor; canlı kabulde `35,05 TL/kg`, 13 Ağustos 2026, 13 hal ve kaynak/tazelik özeti doğrulandı. Kanıt: `artifacts/renewal-2026/urun-detay-etkilesim-kabul-2026-08-14.md`.
- [x] P4.23 Min, ortalama ve maks değerlerinin hesap yöntemi açıklandı; sentetik ortalama satır/kart/ürün/perakende yüzeyinde etiketleniyor, endeks ve bültende min–maks orta noktası ile hacim-ağırlıklı-olmama notu var. Kanıt: `artifacts/renewal-2026/sentetik-ortalama-kabul-2026-08-14.md`.
- [x] P4.24 7/30/90 günlük seçimler `role=group`, açıklayıcı erişilebilir ad ve tek-seçimli `aria-pressed` durumu taşıyor; canlı etkileşimle doğrulandı. Kanıt: `artifacts/renewal-2026/urun-detay-etkilesim-kabul-2026-08-14.md`.
- [x] P4.25 Grafik tooltip'i tarih, hal/şehir, fiyat/birim ve mevcut min–maks değerlerini gösteriyor. Kanıt: `frontend/src/components/sections/PriceChart.tsx` ve `artifacts/renewal-2026/urun-detay-etkilesim-kabul-2026-08-14.md`.
- [x] P4.26 7 ve 30 günlük trendler yön ikonu, “düşüş/yükseliş/yatay” metni ve yüzdeyle gösteriliyor; renk tek başına anlam taşımıyor. Kanıt: `artifacts/renewal-2026/urun-detay-etkilesim-kabul-2026-08-14.md`.
- [x] P4.27 Hal tablosu en yeni tarih önce isteniyor; her satır tarih, resmi kaynak, tazelik ve kaynak doğrulama bağlantısını gösteriyor. Kanıt: `artifacts/renewal-2026/urun-detay-etkilesim-kabul-2026-08-14.md`.
- [x] P4.28 Gerçek çeşitler kendi ürün slug'larına bağlanıyor; aynı ürünü ifade eden ham hal adları yeni kopya sayfa açmadan alias bölümünde birleştiriliyor. Kanıt: `artifacts/renewal-2026/urun-detay-etkilesim-kabul-2026-08-14.md`.
- [x] P4.29 Perakende karşılaştırması türev fiyat guard'ından geçen güncel kayıtları “tahmini perakende” etiketi, kaynak ve tazelikle gösteriyor. Kanıt: `artifacts/renewal-2026/urun-detay-etkilesim-kabul-2026-08-14.md`.
- [x] P4.30 Alarm, favori, karşılaştırma ve paylaşım ikincil ürün eylemleri olarak gruplanmış; mobil erişilebilir adlar, alarm ön-seçimi ve URL tabanlı karşılaştırma canlıda doğrulandı. Kanıt: `artifacts/renewal-2026/urun-detay-etkilesim-kabul-2026-08-14.md`.
- [x] P4.31 Ürün açıklaması, sezon, metodoloji/kaynak, SSS ve alias içeriği ayrı okunabilir bölümlere taşındı. Kanıt: `artifacts/renewal-2026/urun-detay-etkilesim-kabul-2026-08-14.md`.
- [x] P4.32 Tablo sonrasındaki reklam fiyat/grafik kartından ayrıldı; `complementary` “Reklam” alanı ve “Reklam · Sponsorlu” etiketi canlıda doğrulandı. Kanıt: `artifacts/renewal-2026/urun-detay-etkilesim-kabul-2026-08-14.md`.

### 6.4 Hal, harita ve veri durumu — `konsept 06`

- [x] P4.33 `/hal`, hal detayları, `/harita` ve `/data-health` ortak “Hal ve veri görünümü” navigasyonuna bağlandı; fiyat, ilan/firma ve iletişim bölgeleri semantik olarak ayrıldı. Kanıt: `artifacts/renewal-2026/hal-harita-veri-sagligi-kabul-2026-08-14.md`.
- [x] P4.34 Harita ve veri sağlığı sayaç adları/zaman pencereleri merkezi `frontend/src/lib/public-metrics.ts` sözlüğünden besleniyor. Kanıt: `artifacts/renewal-2026/hal-harita-veri-sagligi-kabul-2026-08-14.md`.
- [x] P4.35 Harita legend'ı tokenlaşmış düşük/orta/yüksek skala yanında “Ucuz”, “Pahalı”, endeks tanımı ve “Veri yok: gri” metnini birlikte gösteriyor.
- [x] P4.36 “Güncel”, “gecikmeli”, “bakımda”, “veri yok” eşiklerini açıkla. (13 Ağustos: `/data-health` açıklama paneli + API `no_data` durumu.)
- [x] P4.37 Kaynak tablosunda son başarılı çekim, satır sayısı, tazelik ve durum göster. (13 Ağustos: mobil kart/masaüstü tablo canlı kabul edildi.)
- [x] P4.38 İç hostname, stack trace veya güvenlik detayını public durum sayfasına sızdırma. (13 Ağustos: ham `errorMsg` public sözleşmeden kaldırıldı; güvenli `statusMessage` eklendi.)
- [x] P4.39 Hal detayında güncel fiyat listesi, ilan/firma katmanı ve “Künye ve İletişim” ayrı başlık ve semantik bölgelerle sunuluyor; Ankara canlı kabulünde doğrulandı. Kanıt: `artifacts/renewal-2026/hal-harita-veri-sagligi-kabul-2026-08-14.md`.
- [x] P4.40 Mobil haritada endeksli illerin tamamını il/endeks/hal/fiyat bağlantısıyla veren erişilebilir tablo alternatifi var; 19 satır ve taşmasız 390 px kabul edildi. Kanıt: `artifacts/renewal-2026/hal-harita-veri-sagligi-kabul-2026-08-14.md`.
- [x] P4.41 `/data-health` olay geçmişi son 12 gerçek `hf_etl_runs` kaydından besleniyor; canlı API ve sayfada doğrulandı, ham hata alanı sorguya/public DTO'ya alınmıyor. Kanıt: `artifacts/renewal-2026/hal-harita-veri-sagligi-kabul-2026-08-14.md`.

### 6.5 Analiz, rapor, endeks ve basın — `konsept 03`

- [x] P4.42 `/analiz` tarih, kategori ve rapor tipi GET filtreleri; aktif filtre sayısı, temizleme, sonuç sayısı ve boş durumla canlı kabul edildi. Kanıt: `artifacts/renewal-2026/analiz-rapor-endeks-kabul-2026-08-14.md`.
- [x] P4.43 Analiz üst alanı güncelleme tarihi, gerçek haftalık dönem, ürün/hal ve kayıt kapsamı ile metodoloji bağlantısını gösteriyor; canlı değerler `439 ürün · 38 hal`, `10.826` kayıt.
- [x] P4.44 Düz metin ve eski HTML haftalık raporlar yükselenler → düşenler → endeks sırasına alındı; canlı bölüm konumları `0 < 2 < 3` doğrulandı.
- [x] P4.45 Haftalık rapor, endeks ve yıllık rapor grafik/tabloları açıklama veya caption ile erişilebilir; 390 px canlı kabulünde doküman taşması yok.
- [x] P4.46 Yazarlar gerçek `hf_authors` kaydına bağlandı; geçmiş kayıtlar idempotent migration ile dolduruldu, yeni haftalık raporlar ekip yazar ID'sini alıyor ve canlı profil rotası çalışıyor.
- [x] P4.47 Düzeltme ve geri bildirim e-posta bağlantısı haftalık ve yıllık rapor eylemlerinde görünür ve erişilebilir adla sunuluyor.
- [x] P4.48 PDF/yazdır, Web Share/clipboard paylaşım ve kaynak/yöntem eylemleri ortak, klavye erişilebilir bileşende toplandı; canlı paylaşım payload'ı doğrulandı.
- [x] P4.49 Haftalık analiz, yıllık rapor ve endeks özetleri `ReportSummaryGrid`; rapor eylemleri `ReportActions` üzerinden tekleştirildi.
- [x] P4.50 Basın metni `Onay durumu: Manuel yayımlanmış` durumunu ve otomatik/kendiliğinden yayınlanmadığı açıklamasını görünür gösteriyor.
- [x] P4.51 Haftalık raporda NewsArticle/Dataset/Breadcrumb, yıllık raporda Article/Dataset/Breadcrumb canlı DOM'da doğrulandı; Dataset kapsamı görünür özetle aynı veri nesnesinden üretiliyor.

### 6.6 İlan listesi — `konsept 04`

- [x] P4.52 Arama ve filtreler canonical ürün, il, ilan türü, miktar birimi ve tarih penceresiyle sınırlandı; `q+unit+date` canlı API/sayfa kabulü geçti. Kanıt: `artifacts/renewal-2026/ilan-liste-detay-kabul-2026-08-14.md`.
- [x] P4.53 Ürün seçenekleri canonical kök sözlükten üretiliyor; 263 benzersiz canlı seçenek ve gerçek `Avokado (Adet)/(Kg)` ayrımı doğrulandı.
- [x] P4.54 Aktif filtre chip'leri tek tek kaldırma, tümünü temizleme ve canlı sonuç sayısıyla sunuluyor; `1 ilan` ve üç chip kabul edildi.
- [x] P4.55 Kartlarda başlık, ürün, miktar/birim, fiyat, Türkçe konum, göreli tarih, rol ve kanal doğrulama durumu gösteriliyor.
- [x] P4.56 Public DTO ve kart satıcı adı/telefonu göstermiyor; kişi adı, telefon ve iç kullanıcı/moderatör kimlikleri canlı API/DOM taramasında yok.
- [x] P4.57 Her ilan kartının görünür birincil CTA'sı `İlanı incele`; canlı sonuç ve component testiyle doğrulandı.
- [x] P4.58 Telefon rozeti tooltip'i yalnız kanal kodunun doğrulandığını, kimlik/ticari yetki garantisi olmadığını açıklar; fixture testi geçti.
- [x] P4.59 Mobil filtreler native dialog bottom sheet ve bottom-nav üstündeki sticky `Filtrele` CTA'sında; altı alan 390 px canlı kabul edildi.
- [x] P4.60 Öne çıkarılmış yerleşim `Reklam · Sponsorlu` etiketi, ayrı sınır/ring ve erişilebilir sponsor adıyla normal ilandan ayrılıyor.
- [x] P4.61 Empty state filtre düzenleme, tümünü temizleme ve alım talebi oluşturma alternatiflerini birlikte sunuyor; `0 ilan` canlı kabulü geçti.

### 6.7 İlan detay ve arama — `konsept 05`

- [x] P4.62 Fiyat, miktar/birim, Türkçe konum ve yayın tarihi başlığın hemen altındaki dört alanlı üst özette; canlı değerlerle doğrulandı.
- [x] P4.63 Galeri görselleri 640x480 intrinsic boyut, sıra belirten alt metin, ilk görsel eager ve sonraki görseller lazy kuralıyla render ediliyor.
- [x] P4.64 Satıcı rolü, telefon/e-posta kanal rozetleri ve gerçek kullanıcı `created_at` verisinden hesap yaşı açıklamalı sunuluyor; veri yoksa garanti uydurulmadan açıkça belirtiliyor.
- [x] P4.65 “Satıcıyı ara” birincil, “Mesaj gönder” ikincil CTA; canlı desktop sidebar ve mobil sticky CTA ile doğrulandı.
- [x] P4.66 Desktop sticky side panel ve mobil native-dialog bottom sheet aynı `ListingContactPanel`/form sözleşmesini kullanıyor; 1280 px ve 390 px canlı kabulü geçti.
- [x] P4.67 Yetkili profil özeti yalnız kullanıcının maskeli numarasını/doğrulama durumunu gösteriyor; satıcı numarası public DTO, HTML/RSC ve arayüzde yok.
- [x] P4.68 Form yalnız satıcının açık bıraktığı uygun saatleri, isteğe bağlı kısa notu, zorunlu gizlilik onayını ve gönder aksiyonunu sunuyor.
- [x] P4.69 Başarı metni talebin iletildiğini ve satıcının geri dönüş yapabileceğini; form metni anlık görüşme garantisi olmadığını açıkça belirtiyor.
- [x] P4.70 Raporla/kaydet/paylaş, `İkincil ilan eylemleri` bölgesinde outline stilinde; satıcıyı ara/mesaj CTA'larından ayrı tutuluyor.
- [x] P4.71 Public listing DTO'sunda `contactPhone:null` ve `raw:null`; serbest metin telefon/e-posta redaksiyonu unit test ve canlı API/HTML taramasıyla doğrulandı.

### 6.8 Firma rehberi ve firma detayları

- [x] P4.72 `/firmalar`, şehir/tür hub'ları ve `/firma/[slug]` ortak kart, responsive boşluk ve Temiz Veri yüzey diliyle ilan deneyimine hizalandı; 390/1280 px canlı kabul geçti. Kanıt: `artifacts/renewal-2026/firma-rehberi-kabul-2026-08-14.md`.
- [x] P4.73 Firma kartları tür, Türkçe konum, sınırlı doğrulama anlamı ve tek `Firmayı incele` aksiyonuna indirildi; telefon karttan çıkarıldı, sponsorlu/doğrulanmış durumları ayrıldı.
- [x] P4.74 Public ticari firma hattının ilan sahibinin özel telefonundan farkı, kaynak/yayın niteliği, garanti sınırı ve düzeltme kanalı `Firma iletişim bilgisi politikası` bloğunda hukuken açıklandı.
- [x] P4.75 Telefon, WhatsApp, harita ve form dönüşümleri mevcut ölçüm hattında; lead formu açık gizlilik onayı, kanal tercihi, geri dönüş garantisi vermeyen metin ve saatlik API sınırıyla güncellendi.
- [x] P4.76 Sahiplenme, lead ve firma ekleme akışları ortak `FirmFormHeader` ile `Input/TextArea/Button` parçalarına geçti; yetki/gizlilik ve ticari telefon yayın onayları API sınırında da zorunlu.
- [x] P4.77 `/firma` canlıda kalıcı 308 ile `/firmalar`a yönleniyor; çoğul dizin/hub ve tekil `/firma/[slug]` profil rolleri ayrı canonical'larla doğrulandı.

### 6.9 API Pro, abonelik, reklam — `konsept 07`

- [x] P4.78 `/pro`, `/api-docs`, `/api-policy` ve `/abonelik` ortak ürün navigasyonuyla bağlandı; bülten ile API planı ayrımı açıklandı. Kanıt: `artifacts/renewal-2026/api-pro-reklam-kabul-2026-08-14.md`.
- [x] P4.79 API değer önerisi, kapsam, kaynağa bağlı güncellik, veri sağlığı, anonim limit ve UTC günlük kota penceresi canlı plan sözleşmesiyle görünür.
- [x] P4.80 Paket/fiyat/kota değerleri backend `env` ve `/api/v1/keys/plans` sözleşmesinden geliyor; sözleşme yoksa mock/eski rakam yerine fail-closed durum gösteriliyor.
- [x] P4.81 Gerçek `/api/v1/keys` ve `/api/v1/prices/trending` örneği açık tema bileşeninde tek düğmeyle kopyalanıyor; unit ve canlı tarayıcı kabulü geçti.
- [x] P4.82 Anahtar onboarding'i oturum kapısı, oluşturma, bir kez gösterilen ham anahtar, tier/kota/kullanım durumu ve iptal akışlarını mevcut `/keys` API'si üzerinde sunuyor.
- [x] P4.83 Public SLA sınırı, v1 sürümleme/changelog, API kullanım-lisans, veri düzeltme ve teknik destek bağlantıları görünür.
- [x] P4.84 Kurumsal örnek 2025'teki 167.933 fiyat satırına dayanan canlı yıllık rapora bağlı; gelecek fiyat ve ticari sonuç garantisi vermiyor.
- [x] P4.85 `/reklam-ver`; fiyatın nasıl belirlendiğini, format/yerleşim/hedefleme/süre/cihaz ve canlı envanter girdilerini, yayın kapılarını ve ölçüm sınırlarını açıklıyor.
- [x] P4.86 Reklam talebi rezervasyon sayılmıyor; yazılı teklif, ödeme, kreatif ve yayın onayından geçen manuel ilk faz olarak tanımlandı.
- [x] P4.87 Reklam yüzeyinde sahte müşteri logosu ve kanıtsız başarı iddiası yok; satış, erişim, tıklama ve ticari sonuç garantisi verilmediği açıklandı.

### 6.10 Auth ve kullanıcı dashboard’u

- [x] P4.88 Giriş/kayıt paneli Temiz Veri yüzey diline geçti; gerçekleşmemiş entegrasyon iddiası kaldırıldı, parola/public telefon/tercih sınırlarıyla güven mesajları sadeleştirildi. Kanıt: `artifacts/renewal-2026/auth-dashboard-kabul-2026-08-14.md`.
- [x] P4.89 Auth hatası odaklanan `role=alert`, form/oturum beklemesi erişilebilir status; ilan telefonu OTP'si gönderme, 60 sn bekleme, altı haneli kod, yeniden gönderme, hata ve doğrulandı durumlarıyla tamamlandı.
- [x] P4.90 Dashboard sidebar Temiz Veri kart/sınır/aktif durum diline hizalandı; public alt barla çakışan fixed mobil bar yatay yerel navigasyona dönüştürüldü, 44 px hedef ve `aria-current` eklendi.
- [x] P4.91 Hesap özeti ilan/arama sayaçlarıyla genişletildi; profil/güvenlik başlıkları ve uyarı, favori, bildirim, ilan, arama talebi boş durumları açıklayıcı ortak dilde tasarlandı.
- [x] P4.92 `/hesabim/arama-talepleri` gelen kutusu; gelen/gönderilen filtre, durum aksiyonu, maskeli iletişim özeti ve profil/ilan bazlı tercih yollarıyla dashboard kapsamına eklendi.
- [x] P4.93 İlanlarım; moderasyon durumu, toplam/açık talep sayısı, talep kabul anahtarı ve geri dönüş saatlerini gösteriyor; sahiplik kontrollü ayar endpoint'i ilanı yeniden moderasyona göndermiyor.
- [x] P4.94 Dashboard yüzeyleri AuthGuard ve yetkili endpoint arkasında; canlıda oturumsuz 401 kapısı, public DTO'da null telefon/raw ve owner/admin kimlik alanlarının bulunmaması doğrulandı.

### 6.11 Yasal ve kurumsal sayfalar

- [x] P4.95 LegalPageContent/TransparencyPolicyPage ortak şablonu Temiz Veri yüzey, sınır, radius, tipografi ve token diline geçirildi. Kanıt: `artifacts/renewal-2026/yasal-kurumsal-kabul-2026-08-14.md`.
- [x] P4.96 Uzun metinlere sanitize sonrası kararlı/benzersiz Türkçe anchor, içindekiler, geçerli son güncelleme ve navigasyonu gizleyen print stilleri eklendi; canlı DOM/print media ile doğrulandı.
- [x] P4.97 KVKK, gizlilik, kullanım, düzeltme, editoryal, veri, metodoloji, API ve sahiplik politikaları ortak navigasyonda çapraz bağlı; aktif yol `aria-current=page`, hedefler canlıda 200.
- [x] P4.98 İletişim formunda güvenli başarı/hata ve odak yönetimi, süre garantisi vermeyen metin, erişilebilir ağaçtan gizli honeypot, KVKK/Gizlilik bağlantılı zorunlu onay ve backend boolean onay kapısı tamamlandı.
- [x] P4.99 Hakkımızda, İletişim ve sahiplik sayfaları ortak `site_settings` kurumsal kaynağını kullanıyor; canlı API ile UI'da GZL Teknoloji/Atakan Şahin/Orhan Güzel/kurumsal e-posta eşleşti.

## 7. Faz 5 — SEO, içerik ve keşfedilebilirlik

- [x] F5.1 Public sayfa ailelerinin title/description/canonical standardı `docs/SEO-PUBLIC-SAYFA-STANDARDI.md` içinde tekleştirildi; kabul: `artifacts/renewal-2026/seo-kesfedilebilirlik-kabul-2026-08-14.md`.
- [x] F5.2 Ürün/hal/firma/analiz ve yıllık raporda veri/içerik tabanlı index kapısı; auth/hesap/formlarda noindex+sitemap dışı politika uygulandı.
- [x] F5.3 Sitemap canonical ürün, özgün editoryalli aktif hal, SEO uygun firma/hub, yayınlanmış analiz ve gerçek yıllık rapor verisiyle 407 URL üretiyor.
- [x] F5.4 Ürün/hal fiyat kayıt tarihi, firma son görülme ve analiz editoryal/yayın tarihi lastmod kaynağı; geçersiz/gelecek teknik tarihler filtreli.
- [x] F5.5 Breadcrumb UI/schema ortak öğe dizisi regresyon testinden geçti.
- [x] F5.6 Schema sınırları 8 canlı URL'de dış validator ile 0 hata/0 uyarı; satış olmayan ürün sayfasında Product/Offer yok.
- [x] F5.7 Temiz Veri ilk ekranında dekoratif hero/LCP fotoğrafı yok; ürün fotoğrafları Next Image format pazarlığı, sabit ölçü ve doğru `sizes` kullanıyor.
- [x] F5.8 Eksik/hatalı ürün görselinde sabit ölçülü, erişilebilir ve hafif fallback testli. Dosya bazlı foto lisans atfı ayrı E9 borcudur.
- [x] F5.9 Temmuz tam crawl bazı 316/316 temiz ve orphan 0; 14 Ağustos aile örneklemi düzeltme sonrası 20/20 200, metadata/schema/duplicate hatası 0. Kanıt kabul raporunda.
- [x] F5.10 GSC 2/4/8 haftalık izleme planı, sahip, ölçüm penceresi ve rollback tetikleriyle oluşturuldu.

## 8. Faz 6 — Analitik ve deney ölçümü

- [x] F6.1 Event isim sözlüğü, payload şeması, allowlist ve PII yasağı `docs/ANALYTICS-EVENT-SOZLESMESI.md` içinde tanımlandı.
- [x] F6.2 `search_opened`, `search_submitted`, `search_result_selected`, `price_viewed` eventleri eklendi ve canlı zincir kabulü yapıldı.
- [x] F6.3 `price_filter_changed` ve `price_filter_zero_results` eventleri eklendi; serbest sorgu yerine yalnız uzunluk taşıdığı unit ve canlı kabul ile doğrulandı.
- [x] F6.4 Eşdeğer ve kayıtlı sözlükle `call_request_view`, `call_request_submit`, `call_request_cancelled` eventleri ilan/slot/ID dışında PII taşımadan çalışıyor.
- [x] F6.5 `notified` yalnız gerçek Telegram teslimi+DB yazımı sonrası; `accepted/declined/completed` ile ayrı analytics dönüşümleri ve KPI oranları çalışıyor.
- [x] F6.6 Bülten, sosyal, reklam, API ve kurumsal rapor hunileri tek conversion toplamına karıştırılmadan ayrı tanımlandı.
- [x] F6.7 Arama event payload testleri telefon/e-posta/not taşımadığını doğruluyor; attribution yalnız izinli UTM/gclid alanlarını taşıyor, kişisel form değerleri analytics'e verilmiyor.
- [x] F6.8 `control/clean_data_10/50/100` cohort, minimum bekleme ve Ads koordinasyonu `docs/TEMA-ROLLOUT-VE-KPI-KAPISI.md` içinde tasarlandı.
- [x] F6.9 Admin KPI dashboard'u fiyat bulma süresi, search success, anomaly rate ve call conversion'ı örneklem durumuyla gösteriyor.
- [x] F6.10 İnceleme/rollback eşikleri sözleşmeye ve panele işlendi. Kanıt: `artifacts/renewal-2026/analitik-kpi-kabul-2026-08-14.md`.

## 9. Faz 7 — Erişilebilirlik, performans ve güvenlik QA

### 9.1 Erişilebilirlik

- [x] F7.1 Yedi kritik canlı ailede tek `main`, tek H1 ve heading sırası axe ile doğrulandı; harita H2→H4 atlaması H3'e çekildi.
- [x] F7.2 Skip link, benzersiz landmark adları, 81 il için klavye seçimi ve nav akışları canlı kabulden geçti.
- [x] F7.3 Global focus-visible sözleşmesi ve lazy arama modalında input odağı→Escape→tetikleyici focus restore canlı doğrulandı.
- [x] F7.4 Kritik formlarda label/required ilişkileri ve yedi aile axe form kuralları ihlalsiz; Pro/reklam iletişim formları altı required alanla kabul edildi.
- [x] F7.5 Fiyat grafiği açıklamalı `role=img`; harita klavye erişimli SVG, seçili il özeti ve mobil veri tablosu alternatifi taşıyor.
- [x] F7.6 Durumlar renk dışında sembol/metin, trendler işaret+yüzde ve harita metinsel endeks/tablo ile açıklanıyor; light/dark kontrast kökleri ortak tokenlarda kapatıldı.
- [x] F7.7 `/fiyatlar` 200% zoom ve kritik rotalar 320 px reflow kabulünden geçti; ürün grafiği kontrol taşması `30facfd0` ile kapandı.
- [~] F7.8 `BLOCKED-EXTERNAL`: Ana arama, fiyat okuma, harita ve çağrı talebi semantik/klavye/axe Chromium accessibility ağacında geçti; gerçek NVDA/VoiceOver cihaz kabulü fiziksel cihaz ve kullanıcı testi gerektiriyor.

### 9.2 Responsive ve tarayıcı

- [x] F7.9 320, 360, 390, 768, 1024, 1280 ve 1440 px matrisinde kritik sayfa aileleri kontrol edildi; 1024 px yedi rotada overflow 0.
- [~] F7.10 `BLOCKED-EXTERNAL`: Desktop Chromium ve Android Pixel 7 emülasyonu geçti; gerçek iOS/macOS Safari ile Firefox cihaz matrisi fiziksel dış test ortamı bekliyor.
- [x] F7.11 Safe-area mobil alt nav, sticky header, modal scroll/focus ve sanal klavye yerleşimi 390 px akışında kabul edildi.
- [x] F7.12 Fiyat tabloları, grafik, harita, arama modalı, filtre sheet'i ve uzun Türkçe analiz metinleri reflow taramasından geçti.

### 9.3 Performans

- [x] F7.13 Route client JS ölçüldü: ana sayfa masaüstü 1.678.802, mobil 1.315.488 decoded byte; mobil paket yaklaşık %21,6 küçüldü.
- [x] F7.14 Mobil/desktop ana sayfa fiziksel render paketlerine ayrıldı; global SearchModal/Framer Motion yalnız açılışta indiriliyor, Sentry ve Google tag başlangıç işi dışına alındı.
- [x] F7.15 Temiz Veri ilk ekranında foto hero yok; ürün görselleri sabit ölçü/`sizes`/format pazarlığı ve yalnız gerçek LCP kararında priority kullanıyor.
- [x] F7.16 IBM Plex Sans yalnız değişken `wght` paketi ve unicode-range latin/latin-ext dosyalarıyla self-host edildi; Outfit yalnız 800 ağırlığında preload + `font-display:swap`, italik/genişlik/statik ağırlıklar bundle dışında.
- [x] F7.17 İzole son Lighthouse kaydında CLS `0,0468`; sabit görsel ölçüleri, nihai kart alanları ve harita/grafik kapsayıcılarıyla 0,1 hedefinin altında.
- [x] F7.18 `/prices/overview` 1M+ satırlık 13 sn `COUNT(DISTINCT)` yerine indeksli `EXISTS`, birleşik tarih sınırı, 5 dk cache ve in-flight tekilleştirmeye geçirildi. Canlı 30–48 sn önce → 2,56 sn soğuk, 3–10 ms sıcak; 20 paralel miss tek DB hesaplamasını paylaştı. Kanıt: `artifacts/renewal-2026/prices-overview-performans-kabul-2026-08-14.md`.
- [~] F7.19 `BLOCKED-EXTERNAL`: Accessibility/Best Practices/SEO 100/100/100. Performance ölçüm hostu load 15,51–19,84 ile doygun, VPS 2-core ve PageSpeed API 429 kota verdi. Karşılaştırılabilir performans skoru stabil bağımsız runner/PSI kota yenilenmesi bekliyor; ham kayıtlar `artifacts/renewal-2026/faz7-qa-kabul-2026-08-14.md` içinde.

### 9.4 Güvenlik/gizlilik

- [x] F7.20 Canlı listings/prices/products/markets snapshot PII taraması dört endpointte 200 ve `findings=0` verdi; artifact kaydedildi.
- [x] F7.21 Public DTO'lar owner/admin alanlarından ayrıldı; owner/admin aksiyonları auth/rol kapısında, public ve yetkisiz canlı istekler redakte 401/403 dönüyor.
- [x] F7.22 Call-request consent/status input validation, public DTO redaksiyonu, CMS sanitization, rate-limit, CSRF ve DB kota fixture'ı birlikte geçti; cross-site mutation'ın handler'a sızma regresyonu bulunup kapatıldı.
- [x] F7.23 Görsel upload auth, imza doğrulama, MIME magic-byte allowlist, boyut sınırı, metadata-stripping/re-encode ve public URL sınırlarıyla testli; eski serbest sign endpointi 404.
- [x] F7.24 Frontend/backend Sentry request, user, message, exception, breadcrumb, extra/context PII redaksiyonu ile audit URL query redaksiyonu otomatik testli.
- [x] F7.25 Auth 401 ve kişisel endpoint cevapları `private, no-store, max-age=0`, `Pragma: no-cache`, `Vary: Authorization, Cookie`; ortak public cache ile profil/call-request karışmıyor.

## 10. Faz 8 — Otomatik test ve kabul paketi

- [x] F8.1 Semantic tema tokenı, Badge ve ortak UI component unit testleri eklendi ve geçti.
- [x] F8.2 Header sözleşmesi, ThemeToggle ve MobileBottomNav current/safe-area testleri geçti.
- [x] F8.3 PriceCard/PriceTable, kaynak rozeti, sentetik ortalama ve FreshnessBadge regresyon testleri geçti.
- [x] F8.4 Canonical ürün bağlantısı, alias/redirect ve kg≠adet/kasa birim fixture testleri geçti.
- [x] F8.5 Invalid/imkânsız tarih, schema/sitemap tarihi, retail türev ve ETL fiyat kalite anomalisi regresyon testleri mevcut.
- [x] F8.6 Listing DTO yapılandırılmış telefon/raw sızıntısı ve serbest metin telefon/e-posta redaksiyonu otomatik testli ve canlı API'de doğrulandı.
- [x] F8.7 Call request state/consent/secret/public DTO, auth/rate-limit/CSRF ve audit kapıları izole, temizlenen gerçek DB mutation fixture'ında 22/22 geçti.
- [x] F8.8 Metadata, schema tarihi, sitemap tarihi, canonical ürün ve redirect regresyon testleri ile 20 rotalık canlı SEO crawl geçti.
- [x] F8.9 Ana sayfa arama→ürün E2E canlı mobil UA'da `domates` aramasıyla tamamlandı; canonical ürün sayfası, tek H1, analytics ve 0 konsol hatası doğrulandı.
- [x] F8.10 İlan listesi→detay→`#call-request`, gizli telefon, yetkisiz giriş ve gerçek authenticated DB mutation akışı geçti; alıcı/satıcı rol geçişleri ve PII redaksiyonu doğrulandı.
- [x] F8.11 Analiz liste→rapor→PDF/yazdır ve canonical Web Share çağrısı canlı E2E geçti.
- [x] F8.12 Harita klavye il seçimi→şehir fiyat linki, mobil tablo alternatifi ve `/data-health` gerçek durum kartları canlı E2E geçti.
- [x] F8.13 API Pro ve reklam CTA'ları hazır konulu, altı required alanlı iletişim formuna ulaşıyor. Gerçek production QA teslimi `201` aldı; kabulde bulunan PII'li POST response minimal receipt'e indirildi ve `no-store/private` yapıldı. Kanıt: `artifacts/renewal-2026/kalan-guvenlik-dagitim-tahmin-kabul-2026-08-14.md`.
- [x] F8.14 Yedi ekran ailesinin light/dark tam sayfa visual snapshotları üretildi.
- [x] F8.15 Ana sayfa, ürün, fiyatlar, harita, ilanlar, analiz ve API Pro için 14 canlı screenshot `output/playwright/theme-clean-data/live-acceptance-2026-08-14/` altında.
- [x] F8.16 Frontend lint, TypeScript ve production build; 26 frontend test dosyası/79 test ile 26 backend test dosyası/113 test geçti. Backend tam suite katı env doğrulaması nedeniyle yalnız test sürecine verilen test secret'larıyla koştu. Kanıtlar: `artifacts/renewal-2026/anasayfa-arama-analytics-kabul-2026-08-14.md`, `artifacts/renewal-2026/fiyat-arsivi-filtre-export-kabul-2026-08-14.md`.

## 11. Faz 9 — Kademeli yayın ve canlı doğrulama

- [x] F9.1 Additive call-preference migration sütun-varlık kontrolüyle önce uygulandı; backend build/reload ve ardından izole frontend release restart edildi.
- [x] F9.2 Public telefon redaksiyonu ve güvenli arama talebi tema rollout'undan bağımsız commit/deploy/kabul paketleriyle canlıya alındı.
- [x] F9.3 `control/clean_data_10/50/100` cohort ve rollback sözleşmesi hazır. Tema çalışma öncesinde tam yayında olduğu için etkisiz geriye dönük runtime flag eklenmemesi kaydedildi; HalDeFiyat Ads kampanyası PAUSED ve rollback release bazlıdır.
- [x] F9.4 Ana sayfa, ürün ve ilan detayı Temiz Veri pilot yüzeyleri ayrı kabul paketleriyle canlı yayınlandı.
- [~] F9.5 `BLOCKED-EXTERNAL`: Hata taraması ve ilk Web Vitals/lab/search/call KPI bazı alındı; 24–72 saat gerçek gözlem penceresi takvim ve gerçek trafik bağımlılığıdır, kodla hızlandırılamaz.
- [x] F9.6 Analiz, ilan listesi, harita/data-health ve API Pro aynı token sözleşmesiyle canlıya açıldı ve aile bazlı kabulden geçti.
- [x] F9.7 Release bazlı izole `.next-release-<sha>`, standalone/static doğrulaması ve eski/yeni CSS-HTML/ISR route taraması geçti; yeni ChunkLoadError yok.
- [x] F9.8 Canlı desktop/mobile network ölçümleri ve 14 light/dark karşılaştırma ekranı kaydedildi.
- [~] F9.9 `BLOCKED-EXTERNAL`: Sitemap/canonical/redirect canlı crawl geçti; Search Console submit yalnız read-only token nedeniyle `403` ve Google hesabında yazma kapsamlı yeniden yetkilendirme bekliyor.
- [x] F9.10 Tanımlı kritik hata/KPI rollback eşiği tetiklenmedi; rollback yolu ve olay kaydı şablonu hazır, gereksiz rollback uygulanmadı.

## 12. Faz 10 — Eklenti kataloğu uygulama sırası

### 12.1 Temiz veri sonrası erken işler

- [x] F10.1 `/data-health` gerçek source health, son çekim/kaynak tarihi, satır sayısı, public metrik kartları ve redakte ETL olaylarıyla canlı; 56 kaynak kartı, reflow ve axe kabulü geçti.
- [x] F10.2 Pazartesi bülteni kayıtlı SINGLE opt-in kararıyla çalışıyor; public subscribe, stateless HMAC unsubscribe ve bounce/complaint/manual suppression süreci canlı kod ve testlerde tamam. Suppressed adres yeniden kayıt olamaz ve dağıtımdan çıkar.
- [x] F10.3 Sosyal kartlar deduplicated editör taslağıdır; telefon/e-posta/template/harici URL content-guard kapısı var. Hal doğrudan publish endpoint'leri `409 external_publisher_required`; tek yayın sahibi `ekosistem-sosyal-medya`, X flag'i kapalı.
- [~] F10.4 `BLOCKED-EXTERNAL`: Basın CRM, kaynak URL/son doğrulama envanteri, draft kampanya, temas durumları ve yayın URL logu pilot-ready. Gerçek editör onayı ve dış medya alıcısına ilk gönderim insan/operasyon kararı olmadan yapılamaz.

### 12.2 Gelir pilotları

- [~] F10.5 `BLOCKED-EXTERNAL`: Reklam fiyat/talep vitrini, 9 slot, teklif, doluluk, manuel rezervasyon, ödeme kapısı, hedefleme ve audit pilot-ready. Gerçek ilk reklamveren/ödeme dış müşteri kararı bekliyor.
- [~] F10.6 `BLOCKED-EXTERNAL`: API Pro anahtar, kota, ölçüm, sürüm sözleşmesi, public ücretsiz limit, SLA/lisans metni ve admin yönetimi hazır. Gerçek tasarım ortağı ve sözleşme dış müşteri bekliyor.
- [~] F10.7 `BLOCKED-EXTERNAL`: Kurumsal rapor üretimi, metodoloji/lisans dili ve tek segment manuel satış kapısı hazır; gerçek fiyatı onaylayacak sahip ve ilk ücretli müşteri bekliyor.
- [x] F10.8 Ödeme ve yenileme kanıtı gelmeden büyük abonelik otomasyonu kurulmadı; reklam/API/rapor pilotları manuel kapıda tutuluyor.

### 12.3 İleri ürünler

- [x] F10.9 Canonical ürün/izin kapılı mevcut Telegram alarm kanalı seçildi ve yeniden kullanıldı; WhatsApp maliyet/provider/izin kanıtı olmadığı için aktive edilmedi ve paralel bildirim sistemi kurulmadı.
- [x] F10.10 Proxy/santral aktive edilmedi; gerçek arama talebi dönüşüm kanıtından önce değerlendirmeme karar kapısı korunuyor.
- [x] F10.11 Public fiyat tahmini en az 21 gözlem, 7 walk-forward nokta, `%25` MAPE, naive baseline'dan iyi MAE ve `1.5` drift eşiğiyle pilotlandı; canlı domates örneği kapıyı geçti.
- [x] F10.12 Tahmin eşiğini geçmeyen ürünler `422` ile fail-closed; client-only doğrulanmamış tahmin kaldırıldı. Kanıt: `artifacts/renewal-2026/kalan-guvenlik-dagitim-tahmin-kabul-2026-08-14.md`.

## 13. Nihai Definition of Done

- [x] D1 PDF’deki 12 bulgunun her biri canlı kabul artifact'leriyle kapalı veya dış yetki/gözlem bağımlılığı açıkça gerekçeli.
- [x] D2 Public ilan/arama/firma sözleşmelerinde telefon politikası açık; DTO, serbest metin, maskeli özet, çağrı talebi ve firma izin kapıları testli.
- [x] D3 Kullanıcı satıcı numarasını görmeden yetkili, rızalı, kotalı ve auditli arama talebi oluşturabiliyor; kendi numarasının yalnız maskeli özeti gösteriliyor.
- [x] D4 Canonical ürün ve gerçek birim katmanı API, CSV, fiyat listesi/kartı, ürün/hal, arama, SEO, bülten ve dış entegrasyon tüketicilerini besliyor; canonical audit temiz.
- [x] D5 Kritik anomali yazım sınırında karantinaya/veri bekçisi review'ına düşüyor; blackout ve türev perakende guard public tüketicilerde uygulanıyor.
- [x] D6 Sayaçlar `/prices/overview` ve merkezi sözlükten besleniyor; zaman penceresi/freshness ile `market_type` kırılımı kullanıcı sözleşmesinde açıklanıyor.
- [x] D7 Temiz Veri konsepti ana ve ikincil sayfa ailelerinde semantic tokenlarla uygulandı; editoryal sıcaklık yalnız Pazar Defteri ikincil yüzeyinden alındı.
- [x] D8 Light tema varsayılan, dark tema kalıcı ve erişilebilir kullanıcı tercihi; ikisi de kontrast/axe kabulünden geçti.
- [x] D9 Ana sayfa fiyat bulma görevini ilk ekranda ürün araması ve öne çıkan gerçek fiyatla çözüyor; mobil/desktop ayrı kabul edildi.
- [x] D10 Ürün sayfasında fiyat, birim, tarih, kaynak ve örneklem en güçlü bilgi hiyerarşisinde; canonical/kasa-adet ayrımı görünür.
- [x] D11 Analiz raporlarında geçerli tarih, veri kapsamı, metodoloji, kaynak ve düzeltme bağlantısı var; güvenilmez YoY sessizce yayımlanmıyor.
- [x] D12 İlan, harita, data-health ve API Pro ekranları onaylı token/ortak kabuk sistemiyle tutarlı ve responsive kabulden geçti.
- [x] D13 Reklam alanları ortak kabukta `Reklam · Sponsorlu` etiketi ve içerikten farklı `aside` semantiğiyle ayrılıyor.
- [~] D14 `BLOCKED-EXTERNAL`: Chromium WCAG/axe, keyboard, responsive, desktop/Pixel emülasyonu, E2E ve Lighthouse A/BP/SEO eşikleri geçti. Stabil performance runner ile gerçek Safari/Firefox/NVDA/VoiceOver fiziksel kabulü dış ortam bekliyor.
- [~] D15 `BLOCKED-EXTERNAL`: Redirect/canonical/sitemap canlı göçü doğrulandı; yalnız Google hesabında write-scope token olmadığı için Search Console submit `403`.
- [x] D16 Analytics KPI'ları PII allowlist/scrub sözleşmesiyle çalışıyor; call, reklam, newsletter ve funnel event'leri kişisel veri taşımıyor.
- [x] D17 Deploy/reklam/tema runbook'ları, operasyon sahipleri, release rollback yolu ve tarihli canlı kabul artifact paketi hazır.
- [x] D18 `frontend/FRONTEND-PLAN.md` 13 Ağustos 2026 tarihli tarihsel/uygulama kaynağı değildir banner'ını taşıyor; bu checklist tek aktif yürütme kaynağı.

## 14. Önerilen uygulama sırası — kısa görünüm

1. Canlı doğrulama ve baz metrik.
2. Telefon sızıntısını kapatma + güvenli arama talebi.
3. Invalid Date, künye ve geçici anomali guard.
4. Canonical ürün, birim ve merkezi metrik.
5. Veri bekçisi paneli.
6. Konsept kararı ve tasarım tokenları.
7. Ana sayfa, ürün detay, ilan detay pilotu.
8. Fiyat listesi, analiz, ilanlar, harita/data-health.
9. Firma, dashboard, yasal ve kurumsal sayfalar.
10. API Pro/reklam/kurumsal rapor yüzeyleri.
11. SEO, analitik, erişilebilirlik ve performans kabulü.
12. Kademeli canlı yayın.
13. Bülten/sosyal/basın dağıtımı.
14. Gelir pilotları.
15. Alarm, proxy arama ve tahmin gibi ileri ürünler.

## 15. Fable 5 ek denetimi — kurumsal hafıza, mevcut altyapı ve ilave işler (2026-08-13)

> Bu bölüm çeklistin, kayıtlı proje kararları ve halihazırda canlı altyapıyla çelişen veya
> eksik kalan yönlerini kapatır. Çakışmada buradaki kayıtlı karar geçerlidir. Kaynaklar:
> proje hafızası, `CLAUDE.md`, `docs/checklists/*`, `docs/KALAN-ISLER.md`.
> Faz eşlemesi: E13–E15 → Faz 0 · E16–E21 → Faz 1–2 · E22–E26 → Faz 1 (arama MVP) ·
> E27–E30 → konsept kararı/Faz 3 · E31–E34 → künye+gelir · E35–E36 → IA/Faz 4 ·
> E37–E41 → Faz 9 · E42–E46 → Faz 6 ve Faz 10.

### 15.1 Mevcut altyapı eşlemesi — yeniden kurma, üstüne inşa et

- [x] E1 Mevcut karantina altyapısı genişletildi; güvenilmez veri silinmiyor, tarihsel blackout tüm public tüketicilere uygulanıyor ve `sourceApi=*_wayback` kurtarma muafiyeti korunuyor. Canlı kabul sırasında eski tarih normalizasyon hatası da giderildi. Kanıt: `artifacts/renewal-2026/yoy-karantina-kabul-2026-08-14.md`.
- [x] E2 Ürün eşleme altyapısı ZATEN VAR: match-key = token-sırala + birim, kg≠adet ayrı ürün; ETL alias haritasında "kendi adı > alias" iki-geçiş kuralı (513 çakışan anahtar sessiz veri kaybı vakası). Mevcut iki-geçişli normalizer yeniden kullanılip canonical sözleşme ve bilinmeyen ürün kuyruğu üstüne kuruldu; paralel eşleyici oluşturulmadı.
- [x] E3 `docs/URUN-BIRLESTIRME-PLAYBOOK.md` + auto-merge önerici mevcut ve aile bazında çalıştı (tamamlanan aileler listesi playbook'ta). Mevcut `merge-suggestions` API/paneli korundu; URL göç haritası 601 eşleşmeyle tamamlanmış aileler üzerinden zincir/eksik hedef denetimi yaptı.
- [x] E4 410 otomatı yanlış pozitif üretti: generic aile-başı slug'lar (biber/lahana/sarımsak…) "ölü ürün" sanılıp Gone yapıldı, doğrusu varyanta 301 (5 kayıt düzeltildi). Canonical URL haritası üretimi canlı 410 çakışmasını ayrıca sayıyor; kabul çıktısında `conflicts410=0` doğrulandı.
- [x] E5 Reklam/banner modülü canlı 9 slot, CTR/cihaz/sayfa ölçümü, image/code sanitize, hedefleme, kapasite, lifecycle, ödeme ve audit sözleşmesiyle korunuyor; F10.5 paralel modül kurmadan bunun üstüne bağlandı.
- [x] E6 Sosyal taslak content-guard ve tek-poster politikası kod/testle zorunlu; Hal direct publish kapalı, yayın sahibi `ekosistem-sosyal-medya`.
- [x] E7 GSC göç/izleme mevcut bulk+cron tek-indiriciyle eşlendi; ikinci URL inspector yazılmadı. Plan: `artifacts/renewal-2026/gsc-2-4-8-hafta-izleme-plani-2026-08-14.md`.
- [x] E8 Detay ve liste page-key ayrımı SEO regresyon testine eklendi; `hal_detay` override'ı `hal` şablonuyla çakışmıyor.
- [~] E9 `BLOCKED-EXTERNAL`: Ürün foto fallback'i ve admin/manifest tüketimi testli; mevcut dosyaların kaynak URL+eser sahibi+lisans sürümü dış arşiv kaydı yok. Kaynağı kanıtlanamayan foto yeni yüzeye taşınmıyor; provenance uydurulamaz ve hak sahibi/kaynak envanteri bekliyor.
- [x] E10 Admin “Kalite” sekmesi, içerik/SEO/index skoru, GSC inspect ve haftalık analiz “yeniden üret + yayınla” akışı korundu; mover cap `%80`, Invalid Date guard'ları ve manuel editoryal yayın kapısı birlikte testli, `/analiz` cron'a alınmadı.
- [x] E11 Mevcut Telegram admin kanalı yeniden kullanıldı; arama talebi kişisel veri taşımadan ilan, tercih zamanı, redakte not ve talep numarasıyla aynı kanala bağlandı. Ayrı bildirim altyapısı kurulmadı; teslim işareti yalnız başarılı Telegram cevabından sonra yazılıyor.
- [x] E12 Baseline mevcut `traffic-report.sh`, `etl-health.sh 24` ve PageSpeed kaynağı yeniden kullanılarak Faz 0 performans/erişilebilirlik ve teknik envanter artifact'lerine işlendi; paralel araç kurulmadı.

### 15.2 Faz 0 ilaveleri — keşif

- [x] E13 Git/VPS drift envanteri: local/origin/VPS aynı HEAD `60873b3d`; local ve VPS WIP tespit edildi. Drift raporu: `artifacts/renewal-2026/faz0-canli-dogrulama-2026-08-13.md`. Reset yapılmadı.
- [~] E14 `BLOCKED-EXTERNAL`: Aynı uncommitted WIP local ve VPS’de doğrulandı, korundu ve bu çalışma dosyalarıyla çakıştırılmadı. Başka çalışma sahibine ait değişiklikler yetkisiz commit/temizleme yapılamadığı için sahiplik ayrıştırması bekliyor.
- [x] E15 Mobil/desktop ana sayfa fiziksel internal render route'larına ayrıldı; UA rewrite canonical `/`yi koruyor. Mobil decoded JS 1.680.503→1.315.488 byte, yaklaşık %21,7 düştü; SearchModal, Sentry ve Google tag başlangıç dışına çıkarıldı.

### 15.3 Faz 1–2 veri ilaveleri — kayıtlı en büyük veri borçları

- [x] E16 `avg_price_method` ile 1.055.511 kayıt sınıflandı: 808.595 midpoint (%76,61), 246.916 reported, unknown 0. Merkezi yazım/admin, API+tarihçe, CSV, fiyat kartı/tablosu, ürün/FAQ/perakende, bülten ve endeks metodolojisi ayrımı taşıyor. Canlı mobil/API kabulü geçti. Kanıt: `artifacts/renewal-2026/sentetik-ortalama-kabul-2026-08-14.md`.
- [x] E17 Bursa/Denizli/Eskişehir donmuş serileri ve aktif Alanya anomalisi merkezi blackout ile tüm public tüketicilerden çıkarıldı; 2025 raporu 282.728 ham satır yerine 167.933 doğrulanmış satır kullanıyor. Wayback kurtarma satırları korunuyor. Public YoY 1 Mayıs 2027 + en az 5 eşleşmiş çift kapısına bağlandı; ürün/varyant/widget/bülten ve güvenilmez eski analizde sessiz YoY yok. Kanıt: `artifacts/renewal-2026/yoy-karantina-kabul-2026-08-14.md`.
- [x] E18 546 TL domates kök nedeni ham fiyat değil, "tahmini perakende" TÜREV hesabıdır. 546,21 TL fixture’ı backend retail yazım sınırı ve frontend türev gösteriminde engelleniyor; `%200` iddiası canlı örneklemde yanlışlanıp `%1000` sert anomali eşiğine kalibre edildi. Kanıt: `artifacts/renewal-2026/perakende-guard-kabul-2026-08-13.md`.
- [x] E19 marketfiyati RETAIL_EXTRA throttle gerçeği: kürasyonlu dikey fresh-produce'tan önce çalışıyor; gerçek sayfa çağrıları sayılıyor ve 403/429 sonrasında tarama duruyor. Retail destekleyici olarak etiketlendi, endeksi sürmediği ve çağrı limiti görünür yazıldı; mobil tazelik/taşma/konsol kabulü geçti. Kanıt: `artifacts/renewal-2026/retail-tobb-donma-kabul-2026-08-14.md`.
- [x] E20 TOBB TL/ton→kg vakası parser fixture'ı yapıldı; açık KG zeytin/zeytinyağı yüksek değerleri negatif kontrol olarak korundu. Canlı 15.391 TOBB satırında et/canlı hayvan/zeytin ürünleri dışındaki açıklanamayan `>500` kayıt sıfır. Kanıt: `artifacts/renewal-2026/retail-tobb-donma-kabul-2026-08-14.md`.
- [x] E21 Iceberg ailesi aynı birimli canonical master altında birleşik ve iki eski URL tek adım 301; donma dedektörü mutlak eşik yerine kaynak özelinde geçmiş baz çizgisine geçirildi, blackout aralıkları dışlandı ve canlı çalışması doğrulandı. Kanıt: `artifacts/renewal-2026/retail-tobb-donma-kabul-2026-08-14.md`.

### 15.4 Güvenli arama MVP — gerçeklik notları

- [x] E22 Canlıda provider `none`, Netgsm credential ve OTP flag pasif; Telegram+SMTP aktif doğrulandı. Mevcut adapter korundu. Production `none`/eksik credential fail-closed yapıldı, başarısız SMS doğrulama satırı yazmıyor ve telefon/kod loglamıyor; auth + IP/telefon/deneme kotaları canlı 401/503/DB kabulünden geçti. Kanıt: `artifacts/renewal-2026/arama-talebi-kimlik-sms-guvenlik-kabul-2026-08-14.md`.
- [x] E23 OTP kaydı `user_id` ile kalıcı bağlandı; token `phone+userId+exp` HMAC ve sabit-zamanlı imza doğrulamasıyla call-request yetkisinde güvenle yeniden kullanılıyor. Canlı SMS pasifken doğrulanmış e-posta MVP alternatifi seçildi; maskeli telefon özeti korunuyor, doğrulanmamış hesap 403 ve görünür doğrulama yönlendirmesi alıyor. Kanıt: `artifacts/renewal-2026/arama-talebi-kimlik-sms-guvenlik-kabul-2026-08-14.md`.
- [x] E24 Call-request ve OTP endpoint'leri global güvenlik/audit hookları, auth, route/IP ve DB kotaları altında. JWT/cookie secret fallback'siz zorunlu; HMAC token boyut/TTL/kullanıcı bağı testli. Public signup yalnız customer/komisyoncu allowlist'inde, admin yalnız sunucu e-posta allowlist'inden atanıyor. Canlı yan etkisiz 401/403/503 kabulü geçti. Kanıt: `artifacts/renewal-2026/arama-talebi-kimlik-sms-guvenlik-kabul-2026-08-14.md`.
- [x] E25 Veri sorumlusu GZL Teknoloji olarak karara bağlandı; KVKK metni kimlik, amaç, hukuki sebep, aktarım, haklar ve gerçek retention süreleriyle canlı yayımlandı. Teknik kabul: `artifacts/renewal-2026/kvkk-kunye-gelir-tema-kabul-2026-08-14.md`.
- [x] E26 İlan fiyatı `hf_listings`te kalır ve `hf_price_history`/endeks/hal fiyatına karışmaz; coğrafyalar arası eşleştirme ve premium'dan ayrı sponsorlu görünürlük kararları `docs/GELIR-VE-KUNYE-KARAR-KAYDI.md` içinde bağlayıcı kayda alındı.

### 15.5 Tema/konsept kararına ek girdiler

- [x] E27 `docs/TEMA-KARAR-KAYDI.md` matrisi görsel lisans borcu, mobil LCP riski, gerçek veri algısı ve e-ticaret algısından uzaklık ölçütlerini içeriyor; toplam 12 ölçüt üzerinden karar verildi.
- [x] E28 Bağlayıcı karar Temiz Veri baz tema, Pazar Defteri yalnız editoryal ikincil yüzeydir; Tarladan Sofraya tam seti reddedildi, foto yalnız lisans/atıf kayıtlı gerçek ürün yüzeyinde kullanılır. Kayıt: `docs/TEMA-KARAR-KAYDI.md`.
- [x] E29 Canlı Ads API gerçeğiyle düzeltildi: v21 kapanış hatası ortak pakette v25'e yükseltildi; HalDeFiyat kampanyası `PAUSED`, günlük bütçesi 290 TL ve son 30 gün trafik/harcama/dönüşüm 0. Tema aktif HalDeFiyat Ads trafiğine maruz kalmadı; `AW-18007572524` üç kritik canlı sayfada mevcut. Kanıt: `artifacts/renewal-2026/kvkk-kunye-gelir-tema-kabul-2026-08-14.md`.
- [x] E30 Statik OG ve dört dinamik OG örneği canlıda 1200×630/675 PNG; enforce CSP başlığı mevcut. Tema release'i sonrasında tema/font/asset kaynaklı ve toplam yeni `csp_violation` sayısı 0. Kanıt: `artifacts/renewal-2026/kvkk-kunye-gelir-tema-kabul-2026-08-14.md`.

### 15.6 Künye ve gelir gerçekleri

- [x] E31 GZL Teknoloji işletmeci/gelir tarafı; Atakan Şahin sahip+sektör ağı, Orhan Güzel teknik yürütme olarak canlı ve `docs/GELIR-VE-KUNYE-KARAR-KAYDI.md` içinde kaydedildi. Adres/şehir F1.38'de dış onay bağımlılığı olarak açıkça ayrıldı.
- [x] E32 Pilot sıra A lead-gen → B firma claim+öne çıkarma → C B2B veri/rapor/API ve premium tetiği 10K DAU + 50 makale + 2K abone olarak bağlayıcı gelir kararına işlendi.
- [x] E33 Kurumsal rapor/API satışı Atakan ve gerçek fiyat kararı kapısına bağlandı; 1.490/4.990 TL konsept tutarlarının mock olduğu canlı sahiplik sayfasında ve gelir kararında açıklandı.
- [x] E34 Canlı gerçek güncellendi: 3 claim'in 3'ü onaylı; 1.335 firmanın 1.333'ü sahipsiz, 2'si doğrulanmış. Eksik iş görünürlük/izinli promosyondur; scrape telefonların pazarlama/Customer Match kullanım yasağı ve claim+açık tercih+İYS yolu gelir kararına işlendi. Kanıt: `artifacts/renewal-2026/kvkk-kunye-gelir-tema-kabul-2026-08-14.md`.

### 15.7 IA dikey kapsamı

- [x] E35 Yeni IA canlı hayvan, karkas et, borsa/TMO/resmi ve destekleyici retail dikeylerini ayrı landing/nav sözleşmeleriyle içeriyor. Overview API ve merkezi metrik sözlüğü aktif kaynak noktalarını `hal/borsa/resmi/kooperatif` `market_type` kırılımında sunuyor.
- [x] E36 Mobil/PWA işleri `docs/checklists/MOBIL-WEB-PWA-CHECKLIST.md` ile eşlendi; manifest, versioned service worker, offline fallback ve bottom-nav canlı. Fiziksel install/iOS kabulü D14 dış cihaz kapısında tek kez takip edilir, Faz 3–4'te çift kayıt açılmaz.

### 15.8 Deploy ve rollout emniyeti (Faz 9'a bağlanır)

- [x] E37 Deploy scripti git-only ve `git pull --ff-only`: local commit+push → VPS drift/kesişim kontrolü → build. rsync/scp ve `reset --hard` normal akışta yok.
- [x] E38 Build çıktısı pipe edilmiyor ve log dosyasına yazılıyor. Canlı ISR ile üç kez görülen `.next/cache ENOTEMPTY` yarışı release bazlı `NEXT_DIST_DIR=.next-release-<sha>` ile kapandı; VPS ilk-deneme build ve dört rota kabulü geçti.
- [x] E39 Deploylarda backend `pm2 reload`, değişen frontend `pm2 restart --update-env` kullanılıyor; `.next-release-<sha>/standalone/.../server.js` ve release static dizini restart öncesi doğrulanıyor. Admin değişmediği deployda gereksiz restart edilmedi.
- [x] E40 Ürün ISR sayfası ve diğer kritik aileler release geçişlerinde cache-bypass/normal fetch ile tarandı; yeni HTML/CSS/static chunk karışımı ve ChunkLoadError görülmedi, release dizinleri geri dönüş için korunuyor.
- [x] E41 Frontend iki PM2 cluster worker'a geçirildi; izole release dizinleri eski/yeni HTML-static çiftini koruyor. Deploy her worker'ı ayrı reload edip arada statik health kapısı çalıştırıyor ve tek-worker otomatik geçişini reddediyor. Canlı nihai monitör 200/200 HTTP 200, sıfır timeout/5xx verdi; ilk mimari dönüşümdeki tek seferlik kesinti artifact'te saklandı.

### 15.9 Analitik ve dağıtım tekleştirme

- [~] E42 `BLOCKED-EXTERNAL`: Ayrı GA4 property seçildi; VistaSeeds property'sine HalDeFiyat event'i yazılmayacak. Google hesabında property oluşturma dış yetki bekliyor; o zamana kadar PII'siz birinci taraf KPI paneli tek karar kaynağıdır.
- [x] E43 F6 event, attribution ve admin ölçümü mevcut Madde 11 zinciriyle aynı analytics modülü/sözleşmesinde birleştirildi; paralel ikinci analitik sistem kurulmadı.
- [x] E44 Admin panelde audit/GSC/nginx kapsam ayrımı ve `haldefiyat.access.log` + tamamlanmış gün kuralı açıkça etiketlendi.
- [x] E45 Newsletter subscribe 404 bug'ı canlıda kapanmış: 13 Ağustos doğrulamasında invalid email POST’u 422 döndürdü, yani public route kayıtlı. HMAC unsubscribe mimarisi korunuyor; sabit secret fallback P0 paketinde kaldırıldı.
- [x] E46 Pazartesi bülteni sabit sepet + mevsimlik bölüm ve eşleşmiş sepet metodolojisine bağlı; kıyaslanan üç sayı aynı çift kümesinden yeniden hesaplanamıyor veya yüzdede sapma varsa yayın öncesi fail-closed. Test: `newsletter-percentage-guard.test.ts`.
