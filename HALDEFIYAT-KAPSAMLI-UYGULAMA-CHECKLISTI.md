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

- [ ] R1.1 `docs/PDF-RAPORLARI-AYRINTILI-INCELEME.md` bulgularını bu checklist ile çapraz kontrol et.
- [ ] R1.2 `docs/HALDEFIYAT-DURUM-EKLENTI-TEMA-ANA-RAPORU.md` içindeki faz ve güvenli arama kararlarını koru.
- [ ] R1.3 `docs/HALDEFIYAT-DUZELTME-VE-YENILEME-CHECKLISTI.md` içindeki açık maddeleri bu dosyaya eşle; paralel iki ana checklist yürütme.
- [ ] R1.4 `docs/URUN-BIRLESTIRME-PLAYBOOK.md` ürün merge/redirect kararlarını veri fazının bağlayıcı alt prosedürü yap.
- [ ] R1.5 `docs/VERI-SAGLIGI-CHECKLIST.md` ve `docs/VERI-TUKETICILERI-CHECKLIST.md` açık işlerini bu programdaki veri fazına bağla.
- [ ] R1.6 GEO/SEO, reklam ve dashboard checklist’lerindeki açık işleri ilgili fazlarda referansla; tekrar iş oluşturma.
- [ ] R1.7 `konsept-gorselleri/README.md` ve 7 konsept panosunu tasarım kararının görsel eki yap.

### 1.2 Eski plan çakışmalarını kapatma

- [ ] R1.8 `frontend/FRONTEND-PLAN.md` belgesini mevcut kod ve 2026 Ağustos kararlarıyla yeniden değerlendir.
- [ ] R1.9 Eski plandaki koyu neon varsayılan, ambient orb, terminal/kripto görünümü ve emoji hedeflerini iptal edilmiş olarak işaretle.
- [ ] R1.10 Eski plandaki 12 bölümlü uzun ana sayfa hedefini iptal et; yeni fiyat-arama odaklı IA’yı bağlayıcı yap.
- [ ] R1.11 Kayan ticker, sayaç animasyonu ve yoğun hareketleri yalnız ölçülmüş kullanıcı değeri varsa tut.
- [ ] R1.12 Sabit/iddialı `81 il`, `2480+ ürün`, `%100` gibi rakamları merkezi metrik olmadan frontend’e yazma.
- [ ] R1.13 Güncel frontend mimari belgesini seçilen konsept sonrası yeniden yaz ve eski planın başına “tarihsel” uyarısı ekle.

### 1.3 Konsept seçimi kapısı

- [ ] R1.14 `01-ana-sayfa-karsilastirma.png` üzerinden ilk ekran ve mobil okunabilirliği puanla.
- [ ] R1.15 `02-urun-detay-karsilastirma.png` üzerinden fiyat, kaynak, tablo ve grafik okunabilirliğini puanla.
- [ ] R1.16 `03-analiz-rapor-karsilastirma.png` üzerinden editoryal okuma ve veri güvenini puanla.
- [ ] R1.17 `04-ilanlar-karsilastirma.png` üzerinden filtre/kart yoğunluğu ve mobil kullanılabilirliği puanla.
- [ ] R1.18 `05-ilan-detay-arama-karsilastirma.png` üzerinden gizlilik ve çağrı talebi açıklığını puanla.
- [ ] R1.19 `06-harita-veri-durumu-karsilastirma.png` üzerinden operasyonel şeffaflığı puanla.
- [ ] R1.20 `07-api-pro-kurumsal-karsilastirma.png` üzerinden B2B güveni ve fiyatlandırma okunabilirliğini puanla.
- [ ] R1.21 Pazar Defteri, Temiz Veri ve Tarladan Sofraya için 1–5 puanlı karar matrisi oluştur.
- [ ] R1.22 Seçilen ana yönü ve diğer yönlerden alınacak parçaları `docs/TEMA-KARAR-KAYDI.md` dosyasına yaz.
- [ ] R1.23 Logo, ana renk, font, fotoğraf kullanımı, kart dili ve tablo dili için kesin karar al.
- [ ] R1.24 Tema seçilene kadar geniş frontend restyle başlatma; yalnız P0 güven/veri düzeltmelerini ilerlet.

## 2. Faz 0 — Canlı baz çizgisi ve teknik keşif

### 2.1 Canlı bulgu doğrulama

- [x] F0.1 Ana sayfayı masaüstü ve 390 px mobilde canlı kaydet. Kanıt: `output/playwright/faz0/home-desktop.png`, `home-mobile.png`.
- [ ] F0.2 Açık ve koyu tema davranışı ile ilk ziyaret varsayılanını doğrula.
- [ ] F0.3 Ana sayfa toplam yüksekliğini, bölüm sayısını ve ilk fiyat sonucuna adım sayısını ölç.
- [x] F0.4 `Domates (...)`, `Erik (...)` ve diğer şablon artıkları için canlı tarama yap; Domates kök nedeni ortak display-name guard ile kapatıldı. Kanıt: Faz 0 raporu ve ürün alias/birim envanteri.
- [x] F0.5 Domates market karşılaştırmasındaki 546 TL örneğinin güncel durumunu DB/API/canlı sayfada doğrula. Canlı değer 546,21 TL; türev guard eklendi.
- [x] F0.6 Haftalık raporlarda `Invalid Date`, boş veya yanlış tarih taraması yap. Canlı hata doğrulandı; ortak ISO tarih düzeltmesi eklendi.
- [~] F0.7 `avakado`/`avokado` ve `maydonoz`/`maydanoz` çiftleri canlı DB’de satır sayısı, tarih ve birimle doğrulandı; geniş alias taraması bekliyor. Birim farkı nedeniyle kör canonical merge yasaklandı.
- [~] F0.8 Avokado/Maydanoz için bozuk yazım ve birim envanteri export edildi; tüm filtre listesinin geniş taraması bekliyor.
- [x] F0.9 Ana sayfa, harita, mobil hero ve fiyat sayfalarındaki sayaçları yan yana kaydet. `1.234 ürün / 29 aktif il / 19 güncel il`.
- [x] F0.10 Sahiplik/finansman ve hakkımızda sayfalarının gerçek muhatap bilgilerini kontrol et. Muhatap yalnız “HalDeFiyat”; eksik devam ediyor.
- [x] F0.11 İlan detayında telefonun HTML, RSC payload, API, JSON-LD ve `tel:` içinde sızıp sızmadığını kontrol et. API alanı + serbest metin + frontend `tel:` sızıntısı doğrulandı.
- [ ] F0.12 PDF’deki her maddeyi `devam ediyor / çözülmüş / kısmen / yanlış pozitif` olarak işaretle.

### 2.2 Teknik envanter

- [ ] F0.13 `frontend/src/app/globals.css` tokenlarının kullanım ve hard-coded renk envanterini çıkar.
- [ ] F0.14 `ThemeProvider`, `ThemeToggle`, root layout ve hydration davranışını haritala.
- [ ] F0.15 Public sayfaları ortak şablon ailelerine ayır: veri, editoryal, pazar/ilan, kurumsal, yasal, auth.
- [ ] F0.16 Ortak UI bileşenlerini kullanım sıklığına göre listele.
- [ ] F0.17 Emoji kullanılan tüm TSX/mesaj dosyalarını `rg` ile çıkar ve sınıflandır.
- [ ] F0.18 Hard-coded font size, radius, shadow, color ve width kullanımlarını raporla.
- [ ] F0.19 Client component ve ağır paket sınırlarını çıkar; gereksiz hydration noktalarını işaretle.
- [ ] F0.20 Ana veri endpoint’lerini, cache/revalidate sürelerini ve fallback davranışlarını haritala.
- [ ] F0.21 Public telefonun backend repository→controller→DTO→page akışını diyagramla.
- [ ] F0.22 Ürün canonical/alias/birim/price ingest akışını DB’den public sayfaya kadar haritala.

### 2.3 Baz metrik ve kabul hedefi

- [ ] F0.23 Lighthouse mobile/desktop raporlarını ana sayfa, ürün, analiz, ilan ve data-health için al.
- [ ] F0.24 LCP, CLS, INP, FCP ve JS bundle bazını kaydet.
- [ ] F0.25 WCAG/axe baz taramasını aynı sayfalarda çalıştır.
- [ ] F0.26 Search Console’da bozuk/kopya URL, canonical ve indeks bazını kaydet.
- [ ] F0.27 Analytics’te ürün arama, fiyat görüntüleme, ilan görüntüleme ve iletişim bazını kaydet.
- [ ] F0.28 Veri kalite bazını kaydet: anomali, alias dışı ad, birim bilinmiyor, stale kaynak.
- [ ] F0.29 Her KPI için mevcut değer, hedef, ölçüm kaynağı ve sorumlu belirle.
- [x] F0.30 Canlı kabul kanıtlarının saklanacağı `artifacts/renewal-2026/` yapısını tanımla; ilk Faz 0 raporu eklendi.

### Faz 0 kabul kapısı

- [ ] G0.1 PDF bulgularının tamamı canlı kanıtla sınıflandırıldı.
- [ ] G0.2 Teknik envanter ve baz metrik raporu hazır.
- [ ] G0.3 Başka kişilerin worktree değişiklikleri ve doküman taşıma işlemleri korunuyor.
- [ ] G0.4 Tema kararı için puanlama yapılabilecek veri hazır.

## 3. Faz 1 — P0 güvenlik, gizlilik ve görünür hata düzeltmeleri

### 3.1 Güvenli “Satıcıyı ara” MVP

- [x] F1.1 Public listing tipinden gerçek `contactPhone` alanını ayır; public DTO `contactPhone:null` ve `raw:null` döndürüyor, owner/admin akışı korunuyor.
- [x] F1.2 Liste ve detay endpoint’lerinin gerçek telefonu public döndürmediğini unit ve deploy sonrası canlı API/HTML taramasıyla doğrula.
- [x] F1.3 `hidePhoneIfNeeded` yaklaşımını “varsayılan gizli” modele geçir; opt-in açık telefon bırakma.
- [x] F1.4 İlan detayındaki doğrudan `tel:` bağlantısı ve açık numara metnini kaldır.
- [~] F1.5 Canlı HTML/RSC ve API sızıntı taraması tamamlandı; Organization JSON-LD’deki platform telefonu meşru. Sentry breadcrumb ve analytics payload denetimi bekliyor.
- [x] F1.6 `call_requests` veri modelini tasarla: listing, buyer, seller, state, preferred slot, note, consent, timestamps.
- [x] F1.7 Durumları tanımla: `pending`, `notified`, `accepted`, `declined`, `expired`, `cancelled`, `completed`.
- [x] F1.8 Migration’ı additive ve mevcut ilanlarla uyumlu hazırla; rollback tabloyu düşüreceği için yalnız operasyon onayıyla uygulanır.
- [x] F1.9 Yetkili `POST /listings/:id/call-requests` endpoint’i ekle.
- [x] F1.10 Aynı ilan+alıcı için aktif talebi 24 saat engelleyen idempotency kuralı ekle.
- [~] F1.11 Alıcı için günlük 5 ve ilan+alıcı için 24 saat limiti eklendi; IP ve satıcı bazlı risk limiti bekliyor.
- [ ] F1.12 Doğrulanmamış kullanıcının OTP/giriş akışına yönlendirilmesini sağla.
- [ ] F1.13 Kullanıcının kendi maskeli numarasını backend’den güvenli profil özeti olarak göster.
- [~] F1.14 İlk MVP bildirimi mevcut Telegram admin kanalına ve alıcı/satıcı paneline bağlandı; satıcıya e-posta teslimi ve retry gözlemi bekliyor. Netgsm canlı provider/credential/flag pasif.
- [x] F1.15 Telegram bildiriminde alıcının telefonu/e-postası/adı paylaşılmıyor; yalnız ilan, tercih zamanı, not ve talep no gönderiliyor.
- [x] F1.16 Satıcı dashboard’una talep kabul/ret/tamamla kontrolleri ekle; geçişler backend sahiplik kuralıyla korunuyor.
- [ ] F1.17 Satıcının uygun saat ve arama talebi kabul ayarını ekle.
- [x] F1.18 Alıcı dashboard’una talep durumu ve yalnız açık talepte iptal kontrolü ekle.
- [~] F1.19 “Satıcıyı ara” CTA/formu deploy edildi ve canlı desktop HTML’de doğrulandı; sticky davranış ve mobil görsel kabul bekliyor.
- [x] F1.20 Panel başlığını “Arama talebi gönder” yap; anlık bağlantı vaadi verme.
- [x] F1.21 “Numaranız ve satıcının numarası açık paylaşılmaz” güven metnini ekle.
- [x] F1.22 Uygun zaman, kısa not, zorunlu KVKK onayı ve gizlilik bağlantısını erişilebilir form olarak ekle.
- [~] F1.23 Başarı, yükleniyor, auth, kota, duplicate, kendi ilanı ve genel servis hatası eklendi; timeout/expired durumları bekliyor.
- [x] F1.24 Mevcut “Mesaj gönder / teklif ver” formu arama talebinin altında korunuyor.
- [ ] F1.25 Ham telefonları uygulama logunda maskele; audit logta kim/ne zaman/durum tut.
- [ ] F1.26 Bot/CAPTCHA veya risk kontrolünü yalnız şüpheli akışta devreye sokacak şekilde tasarla.
- [ ] F1.27 KVKK aydınlatma, amaç, saklama, silme ve satıcı tercih metinlerini güncelle.
- [ ] F1.28 `phone_click` yerine yeni huni eventlerini tanımla.
- [~] F1.29 DTO data-leak, HMAC secret, consent ve status validation unit testleri eklendi; DB integration/auth/rate-limit uçtan uca fixture’ı bekliyor.
- [x] F1.30 Deploy sonrası public liste/detay API, HTML/RSC, `tel:` ve serbest metin sızıntı testini tekrar yap; 2 canlı kayıtta satıcı telefonu sızıntısı 0.

### 3.2 Invalid Date ve içerik artıklarını kapatma

- [x] F1.31 Kök neden doğrulandı: tarih alanı koşulsuz `new Date(...).toLocaleDateString()` ile parse ediliyor, geçersiz değer arayüze aynen yansıyordu.
- [x] F1.32 ISO date-only değerini timezone kaydırmadan, tam ISO değerini `tr-TR` ile biçimleyen ortak tarih yardımcı katmanı oluşturuldu.
- [x] F1.33 Geçersiz/boş tarihte alanı saklayan `null` fallback davranışı eklendi.
- [ ] F1.34 Analiz listesi, analiz detay, yıllık rapor, sitemap ve schema tarihlerini aynı kurala geçir.
- [~] F1.35 `Invalid Date` ve `(...)` için guard testleri eklendi; `undefined`, `NaN` ve ham key kapsamı bekliyor.
- [ ] F1.36 `tarim_kredi` gibi kaynak anahtarlarına kullanıcı etiketi sözlüğü uygula.
- [ ] F1.37 Kaynak etiketi ile kaynak metodoloji bağlantısını ilişkilendir.

### 3.3 Künye ve güven yüzeyleri

- [ ] F1.38 Tüzel kişi, sorumlu yayıncı, adres/şehir ve kurumsal iletişim bilgisini sahibinden onaylat.
- [ ] F1.39 Sahiplik ve finansman sayfasını gerçek bilgilerle güncelle.
- [ ] F1.40 Hakkımızda sayfasına ekip/amaç/veri yaklaşımı ekle; anonim marka cümlesiyle bırakma.
- [ ] F1.41 Metodoloji, veri kaynağı, editoryal, düzeltme, KVKK ve kullanım koşullarını çapraz bağla.
- [ ] F1.42 Footer, publisher schema, Organization schema ve iletişim sayfasını tek ayar kaynağına bağla.
- [ ] F1.43 API/veri lisansı ve kurumsal rapor kullanım şartlarını netleştir.

### 3.4 Geçici anomali emniyeti

- [ ] F1.44 Ürün/birim bazlı geçici makul aralıkları veriyle çıkar.
- [ ] F1.45 Mutlak eşik ve medyan sapmasını birlikte kullanan yayın öncesi guard ekle.
- [ ] F1.46 Şüpheli kayıtları silme; karantinaya ve inceleme kuyruğuna al.
- [ ] F1.47 Karantinalı veriyi page/API/widget/CSV/bülten/sosyal/rapordan hariç tut.
- [ ] F1.48 546 TL domates ve yanlış adet/kg vakalarını fixture yap.
- [ ] F1.49 Guard false-positive oranını örneklemle kontrol et.

### Faz 1 kabul kapısı

- [ ] G1.1 Public yüzeylerde gerçek ilan telefonu sıfır.
- [ ] G1.2 Arama talebi uçtan uca, kota ve audit ile çalışıyor.
- [ ] G1.3 Invalid Date/ham key/şablon artığı kritik sayfalarda sıfır.
- [ ] G1.4 Kritik fiyat anomalileri otomatik yayınlanmıyor.
- [ ] G1.5 Gerçek künye ve güven politikaları canlı.

## 4. Faz 2 — Ürün sözlüğü, birim, metrik ve veri bekçisi

### 4.1 Canonical ürün sözlüğü

- [ ] F2.1 Canonical product ID, slug, display name, category, default unit, aliases ve variants sözleşmesini yaz.
- [ ] F2.2 Türkçe casefold, diakritik ve karakter normalizasyon kurallarını sabitle.
- [ ] F2.3 Kaynak ürün adı→canonical ürün eşleme güven skorunu tanımla.
- [ ] F2.4 Yeni/belirsiz adları otomatik yeni public ürün yapma; review kuyruğuna gönder.
- [ ] F2.5 Maydanoz/Maydonoz, Avokado/Avakado, Incir/İncir ve Hındıstan/Hindistan fixture’larını ekle.
- [ ] F2.6 Format/menşe/grade qualifier kurallarını playbook ile eşle.
- [ ] F2.7 Gerçek çeşitleri yanlış birleştirmeyen negatif test seti oluştur.
- [ ] F2.8 Balık/et/sebze kategori karışımını kaynak ve kategori sözlüğüyle düzelt.
- [ ] F2.9 Admin merge/alias arayüzünü canonical sözleşmeyle uyumlandır.
- [ ] F2.10 Arama, filtre, fiyat tablosu, rapor, alarm ve API’nin aynı product ID kullanmasını sağla.

### 4.2 Birim ve varyant güvenliği

- [ ] F2.11 Kaynak bazlı ham birim sözlüğü çıkar.
- [ ] F2.12 `kg`, `adet`, `kasa`, `bağ`, `demet`, `koli`, `ton` canonical birimlerini tanımla.
- [ ] F2.13 Yalnız bilinen katsayılı birimleri dönüştür; varsayımsal kg dönüşümü yapma.
- [ ] F2.14 Ürün–varyant–birim izin matrisini kur.
- [ ] F2.15 Bilinmeyen birimi karantinaya al ve admin kuyruğunda göster.
- [ ] F2.16 Fiyat etiketi, tablo başlığı, grafik tooltip ve CSV’de birimi zorunlu göster.
- [ ] F2.17 Geçmiş yanlış birimleri dry-run raporuyla belirle ve onaylı göç uygula.

### 4.3 URL ve SEO göçü

- [ ] F2.18 Kopya/yanlış ürün URL’leri için eski→canonical haritası üret.
- [ ] F2.19 Gerçek çeşitleri ayrı tut; yalnız alias/thin format varyantlarını doğru hedefe yönlendir.
- [ ] F2.20 Tek adımlı 301/308 uygula; zincir ve loop testi yap.
- [ ] F2.21 Canonical, hreflang/locale, breadcrumb ve iç linkleri yeni hedefe geçir.
- [ ] F2.22 Sitemap’ten eski/kopya URL’leri çıkar.
- [ ] F2.23 Structured data name/url/date/source alanlarını canonical veriden besle.
- [ ] F2.24 Redirect edilen ürünün geçmiş fiyatlarını hedef sayfada koru.
- [ ] F2.25 Search Console doğrulama ve sitemap yeniden gönderim planını uygula.

### 4.4 Merkezi metrik sözlüğü

- [ ] F2.26 `toplam ürün`, `fiyatlı ürün`, `güncel ürün`, `aktif kaynak`, `güncel il` tanımlarını yaz.
- [ ] F2.27 Her metriğe query, zaman penceresi, cache TTL, owner ve açıklama bağla.
- [ ] F2.28 Ortak stats servis/endpoint’ini oluştur veya mevcut doğru servisi tek kaynak yap.
- [ ] F2.29 Ana sayfa, harita, data-health, topbar ve mobil hero’yu ortak kaynağa geçir.
- [ ] F2.30 Cache stale/error durumunda eski rakamı sessizce “canlı” gösterme.
- [ ] F2.31 Metrik sözlüğünü kullanıcıya tooltip/metodoloji metniyle açıkla.

### 4.5 Veri bekçisi paneli

- [ ] F2.32 Mutlak sınır, medyan sapması, önceki güne sıçrama, kaynak farkı ve stale kurallarını ekle.
- [ ] F2.33 Anomali reason code, severity ve confidence alanlarını tanımla.
- [ ] F2.34 Kuyrukta ürün, kaynak, birim, tarih, önem ve durum filtreleri sun.
- [ ] F2.35 Onay, ret, düzelt, alias’a bağla ve toplu işlem aksiyonları ekle.
- [ ] F2.36 Kritik toplu işlem için ön izleme ve çift onay ekle.
- [ ] F2.37 Her kararın önce/sonra değeri, kullanıcı, zaman ve açıklamasını audit et.
- [ ] F2.38 Yanlış kararı geri alıp downstream cache/index/raporu yenile.
- [ ] F2.39 Kuyruk yaşı ve kritik anomali SLA alarmı oluştur.
- [ ] F2.40 Panel erişimini rol bazlı sınırla; CSRF/auth testlerini ekle.

### Faz 2 kabul kapısı

- [ ] G2.1 Public filtrelerde yazım kopyaları ve kategori sapmaları hedef eşiğin altında.
- [ ] G2.2 Yanlış birim public yüzeye çıkmıyor.
- [ ] G2.3 Kopya URL canonical/redirect planı canlı doğrulandı.
- [ ] G2.4 Tüm yüzeylerde aynı tanımlı sayaç aynı değeri gösteriyor.
- [ ] G2.5 Veri bekçisi audit/rollback ile operasyonel.

## 5. Faz 3 — Seçilen konsepte göre frontend tasarım sistemi

### 5.1 Tasarım tokenları

- [ ] F3.1 Seçilen konseptten primary/secondary/accent/neutral paleti çıkar.
- [ ] F3.2 Semantic tokenları tanımla: success, warning, danger, info, fresh, stale, unknown.
- [ ] F3.3 Fiyat artışını otomatik success yeşili olarak kodlama; nötr trend tokenı kullan.
- [ ] F3.4 Light temayı varsayılan yap; dark temayı kullanıcı tercihi olarak koru.
- [ ] F3.5 İlk render ve hydration’da tema flash’ını engelle.
- [ ] F3.6 Foreground/muted/faint/border kontrastlarını WCAG AA’ya göre doğrula.
- [ ] F3.7 Font ailelerini kesinleştir; gereksiz font ağırlıklarını kaldır.
- [ ] F3.8 Responsive type scale oluştur: display, h1–h4, price-xl/lg/md, body, label, caption, data.
- [ ] F3.9 4/8 spacing ölçeği, container genişliği ve section aralıklarını tanımla.
- [ ] F3.10 Radius, border, shadow ve elevation seviyelerini standardize et.
- [ ] F3.11 Grafik, harita ve tablo renk/pattern tokenlarını ekle.
- [ ] F3.12 CSS variable/Tailwind theme kaynağını tekle; hard-coded renkleri aşamalı kaldır.

### 5.2 Ortak UI bileşenleri

- [ ] F3.13 `Button` varyantlarını primary, secondary, outline, ghost, danger olarak standardize et.
- [ ] F3.14 Tüm butonlarda 44 px mobil dokunma alanı, loading ve disabled durumu sağla.
- [ ] F3.15 `Input`, `TextArea`, `Combobox`, `SearchableSelect` label/help/error yapısını birleştir.
- [ ] F3.16 Kart bileşenlerini data, editorial, listing, commercial ve ad olarak ayır.
- [ ] F3.17 `Badge` ve `FreshnessBadge` semantiğini birleştir; yalnız renkle anlam verme.
- [ ] F3.18 `PriceCard` içinde fiyat, birim, tarih, kaynak ve örneklem zorunlu alanlarını tanımla.
- [ ] F3.19 `PriceTable` desktop tablo + mobil kart görünümünü erişilebilir yap.
- [ ] F3.20 Skeleton’ları nihai layout boyutuyla eşleştir; CLS üretme.
- [ ] F3.21 Empty/error/offline durumları için ortak bileşenler oluştur.
- [ ] F3.22 Lucide tabanlı tek çizgi ikon setini kullan; dekoratif emoji envanterini temizle.
- [ ] F3.23 İkonlara gerekli `aria-hidden` veya anlamlı erişilebilir adları ekle.
- [ ] F3.24 Reklam bileşenini açık `Reklam` etiketi ve farklı yüzey diliyle standardize et.
- [ ] F3.25 Modal/sheet/dialog focus trap, Escape, backdrop ve scroll lock davranışını test et.
- [ ] F3.26 `prefers-reduced-motion` desteği ekle; scroll reveal/ticker hareketini azalt.

### 5.3 Global kabuk

- [ ] F3.27 Header navigasyonunu kullanıcı görevlerine göre sadeleştir.
- [ ] F3.28 Arama tetikleyicisini desktop ve mobilde görünür, klavye erişilebilir yap.
- [ ] F3.29 Topbar’da yalnız tanımlı ve güncel metrikleri göster; kalabalık promosyon ekleme.
- [ ] F3.30 Theme toggle’ı ikincil ama erişilebilir tut.
- [ ] F3.31 MobileBottomNav rotalarını gerçek en sık görevlere göre doğrula.
- [ ] F3.32 Footer’ı marka, fiyat/veri, kurumsal, yasal ve iletişim gruplarıyla düzenle.
- [ ] F3.33 Künye/metodoloji/düzeltme bağlantılarını global kabukta erişilebilir yap.
- [ ] F3.34 PageContainer, grid ve breadcrumb ölçülerini tüm sayfalarda ortaklaştır.

## 6. Faz 4 — Sayfa ailelerinin konsept uyarlaması

### 6.1 Ana sayfa — `konsept 01`

- [ ] P4.1 İlk ekranın tek görevini “ürün/hal ara ve bugünkü fiyatı gör” olarak sabitle.
- [ ] P4.2 Ürün arama ve hal/konum seçiciyi hero’nun ana kontrolü yap.
- [ ] P4.3 Örnek/kişiselleştirilmiş bugünkü fiyat kartında fiyatı görsel kahraman yap.
- [ ] P4.4 Fiyat yanında birim, tarih, kaynak sayısı ve tazelik durumunu göster.
- [ ] P4.5 Son eklenen/popüler ürünleri kısa, taranabilir bir sıra olarak tut.
- [ ] P4.6 PriceTicker’ı kaldır veya hareket etmeyen kısa “öne çıkanlar” bileşenine dönüştür.
- [ ] P4.7 Harita, endeks, ilan, analiz, alarm, SSS bölümlerini kısa özet + ilgili rotaya taşı.
- [ ] P4.8 Aynı bilgiyi farklı bölümlerde tekrar etme.
- [ ] P4.9 İlk reklamı temel fiyat görevinden sonra yerleştir ve açık etiketle.
- [ ] P4.10 Mobilde fiyat sonucuna 1–1,5 ekran içinde ulaşılmasını doğrula.
- [ ] P4.11 Ana sayfa yapılandırılmış verisini görünür içerikle tutarlı yap.
- [ ] P4.12 Search→result→product event hunisini ölç.

### 6.2 Fiyat listesi ve canlı fiyatlar

- [ ] P4.13 `/fiyatlar` ve `/canli-hal-fiyatlari` rollerini netleştir; kopya deneyim üretme.
- [ ] P4.14 Filtreleri ürün, hal/il, kategori, birim ve tarih ekseninde sadeleştir.
- [ ] P4.15 URL query senkronizasyonu ve paylaşılabilir filtre durumunu koru.
- [ ] P4.16 Filtre sonucu sayısını ve güncellik bağlamını göster.
- [ ] P4.17 Tablo sütunlarını mobilde kart/list view’e dönüştür; yatay scroll’u son çare yap.
- [ ] P4.18 Sort değerlerini açık yaz; “en güncel”, “en düşük”, “en yüksek” tanımını belirt.
- [ ] P4.19 CSV/export’ta filtre, birim, tarih ve kaynak metadata’sını dahil et.
- [ ] P4.20 Empty, stale, partial ve error durumlarını birbirinden ayır.

### 6.3 Ürün detay — `konsept 02`

- [ ] P4.21 Ürün adını canonical sözlükten göster; şablon artığına izin verme.
- [ ] P4.22 Ana fiyat/birim/tarih/kaynak/örneklem bloğunu fold üstüne taşı.
- [ ] P4.23 Min, ortalama, maks değerlerinin hesap yöntemini tooltip/metodolojiyle açıkla.
- [ ] P4.24 7/30/90 günlük grafik seçimlerini erişilebilir toggle yap.
- [ ] P4.25 Grafik tooltip’lerinde hal, fiyat, birim ve tarih göster.
- [ ] P4.26 Trend için ok+metin+yüzde kullan; renk tek başına anlam taşımasın.
- [ ] P4.27 Hal tablosunu önem sırasına göre düzenle ve kaynak tazeliğini satırda göster.
- [ ] P4.28 Varyantları gerçek çeşit/alias mantığıyla göster; kopya sayfa üretme.
- [ ] P4.29 Retail comparison anomali guard’ından geçen veriyi göster.
- [ ] P4.30 Alarm, favori, karşılaştırma ve paylaşımı ikincil CTA olarak düzenle.
- [ ] P4.31 Ürün açıklaması, sezon, metodoloji ve kaynak bölümlerini okunabilir IA’ya taşı.
- [ ] P4.32 Reklamı grafik veya fiyat kartı gibi göstermeyecek şekilde ayır.

### 6.4 Hal, harita ve veri durumu — `konsept 06`

- [ ] P4.33 `/hal`, `/hal/[slug]`, `/harita` ve `/data-health` bilgi mimarisini netleştir.
- [ ] P4.34 Harita sayaçlarını merkezi metrik sözlüğünden besle.
- [ ] P4.35 Harita legend’ında renk yanında pattern/ikon/metin kullan.
- [ ] P4.36 “Güncel”, “gecikmeli”, “bakımda”, “veri yok” eşiklerini açıkla.
- [ ] P4.37 Kaynak tablosunda son başarılı çekim, satır sayısı, tazelik ve durum göster.
- [ ] P4.38 İç hostname, stack trace veya güvenlik detayını public durum sayfasına sızdırma.
- [ ] P4.39 Hal detayında iletişim/veri kaynağı ile fiyat verisini birbirine karıştırma.
- [ ] P4.40 Mobil haritada alternatif erişilebilir kaynak listesi sun.
- [ ] P4.41 Olay/geçmiş bölümünü gerçek sağlık eventlerinden besle.

### 6.5 Analiz, rapor, endeks ve basın — `konsept 03`

- [ ] P4.42 `/analiz` liste sayfasını tarih, kategori ve rapor tipine göre düzenle.
- [ ] P4.43 Analiz detayında güncelleme tarihi, kapsama, ürün/hal sayısı ve metodolojiyi üstte göster.
- [ ] P4.44 Editoryal özet, yükselenler, düşenler ve endeks sırasını kullanıcı görevine göre kur.
- [ ] P4.45 Grafik ve tabloları responsive ve ekran okuyucu açıklamalı yap.
- [ ] P4.46 Yazar profilini gerçek author verisine bağla.
- [ ] P4.47 Düzeltme ve geri bildirim bağlantısını her raporda görünür yap.
- [ ] P4.48 PDF indir, paylaş ve kaynak eylemlerini erişilebilir yap.
- [ ] P4.49 `/endeks`, yıllık rapor ve haftalık analiz ortak bileşenlerini tekleştir.
- [ ] P4.50 Basın metnini otomatik yayınlamadan önce editör onay durumunu göster.
- [ ] P4.51 NewsArticle/Dataset/Breadcrumb schema’larını görünür içerikle uyumlu tut.

### 6.6 İlan listesi — `konsept 04`

- [ ] P4.52 Arama ve filtreleri ürün, il, ilan türü, birim ve tarihle sınırla.
- [ ] P4.53 Ürün seçeneklerini canonical sözlükten üret.
- [ ] P4.54 Aktif filtre chip, temizle ve sonuç sayısını göster.
- [ ] P4.55 İlan kartında başlık, ürün, miktar/birim, fiyat, konum, tarih ve doğrulama göster.
- [ ] P4.56 İlan kartında telefon veya kişisel veri gösterme.
- [ ] P4.57 Birincil kart CTA’sını “İlanı incele” yap.
- [ ] P4.58 Doğrulanmış satıcı rozetinin neyi doğruladığını tooltip ile açıkla.
- [ ] P4.59 Mobil filtreleri bottom sheet ve sticky filtre butonuyla düzenle.
- [ ] P4.60 Reklam kartını normal ilan görünümünden açıkça ayır.
- [ ] P4.61 Empty state’te filtre düzenleme ve ilan talebi alternatifleri sun.

### 6.7 İlan detay ve arama — `konsept 05`

- [ ] P4.62 Fiyat, miktar, birim, konum ve ilan zamanını üst hiyerarşide göster.
- [ ] P4.63 Görsel galeriye boyut, alt metin ve lazy loading kuralları uygula.
- [ ] P4.64 Satıcı rozetleri ve hesap yaşını doğru tanımlarla göster.
- [ ] P4.65 “Satıcıyı ara” birincil, “Mesaj gönder” ikincil CTA olsun.
- [ ] P4.66 Desktop side panel ve mobil bottom sheet aynı form sözleşmesini kullansın.
- [ ] P4.67 Maskeli kullanıcı numarası ve doğrulama durumunu göster; satıcı numarasını gösterme.
- [ ] P4.68 Uygun saat, kısa not, gizlilik ve gönder aksiyonunu minimum alanla sun.
- [ ] P4.69 Talebin iletildiğini ve geri dönüş garantisi olmadığını açıkça belirt.
- [ ] P4.70 Raporla/kaydet/paylaş aksiyonlarını ikincil bölgede tut.
- [ ] P4.71 Listing schema’da public telefon bulunmadığını test et.

### 6.8 Firma rehberi ve firma detayları

- [ ] P4.72 `/firmalar`, kategori/şehir hub’ları ve `/firma/[slug]` tasarımını ilanlarla tutarlı yap.
- [ ] P4.73 Firma kartlarında doğrulama, kategori, konum ve aksiyonları sadeleştir.
- [ ] P4.74 Firma telefon politikasını ilan telefon politikasından ayrı ve hukuken açık tanımla.
- [ ] P4.75 Firma iletişim CTA’larında tracking ve gizlilik metnini güncelle.
- [ ] P4.76 Claim/lead/ekle formlarını ortak form tasarım sistemine geçir.
- [ ] P4.77 Kopya `/firma` ve `/firmalar` rota rollerini SEO açısından netleştir.

### 6.9 API Pro, abonelik, reklam — `konsept 07`

- [ ] P4.78 `/pro`, `/api-docs`, `/api-policy` ve `/abonelik` IA’sını tek ürün hunisi yap.
- [ ] P4.79 API değer önerisi, kapsama, güncelleme sıklığı ve kullanım limitlerini açık yaz.
- [ ] P4.80 Paket/fiyat/kota değerlerini backend/ayar kaynağından besle; mock rakam bırakma.
- [ ] P4.81 Kod örneğini kopyalanabilir, açık tema uyumlu ve gerçek endpoint ile sun.
- [ ] P4.82 Anahtar başvuru, durum ve onboarding akışlarını tasarla.
- [ ] P4.83 SLA, sürümleme, changelog, lisans ve destek bağlantılarını görünür yap.
- [ ] P4.84 Kurumsal rapor örneğini gerçek, onaylı veriyle sun.
- [ ] P4.85 `/reklam-ver` sayfasında fiyat, format, envanter, ölçüm ve talep akışını açıkla.
- [ ] P4.86 Reklam rezervasyonunu ilk fazda manuel onaylı talep olarak tut.
- [ ] P4.87 Sahte müşteri logosu, garanti veya kanıtsız performans iddiası kullanma.

### 6.10 Auth ve kullanıcı dashboard’u

- [ ] P4.88 Giriş/kayıt/oturum sayfalarını seçilen temaya geçir; güven mesajlarını sadeleştir.
- [ ] P4.89 OTP, hata, bekleme ve yeniden gönder durumlarını erişilebilir yap.
- [ ] P4.90 Dashboard sidebar/mobile nav görsel dilini public kabukla uyumlandır.
- [ ] P4.91 Hesap özeti, profil, güvenlik, favori, uyarı, ilan ve bildirim boş durumlarını tasarla.
- [ ] P4.92 Arama talepleri inbox ve tercihlerini dashboard kapsamına ekle.
- [ ] P4.93 İlanlarım sayfasında talep sayısı/durumu ve iletişim ayarlarını göster.
- [ ] P4.94 Admin/owner yetkili verisini public component’e yanlışlıkla taşıma.

### 6.11 Yasal ve kurumsal sayfalar

- [ ] P4.95 LegalPageContent/TransparencyPolicyPage ortak şablonunu seçilen temaya geçir.
- [ ] P4.96 Uzun metinlerde içerik tablosu, anchor, son güncelleme ve print stilleri ekle.
- [ ] P4.97 KVKK, gizlilik, kullanım, düzeltme, editoryal ve veri politikalarında çapraz linkleri doğrula.
- [ ] P4.98 İletişim formunda başarı/hata, spam ve kişisel veri metnini düzelt.
- [ ] P4.99 Hakkımızda ve sahiplik sayfalarında gerçek kurumsal veriyi ortak ayardan göster.

## 7. Faz 5 — SEO, içerik ve keşfedilebilirlik

- [ ] F5.1 Her public sayfa ailesi için title/description/canonical standardı oluştur.
- [ ] F5.2 Ürün/hal/firma/analiz sayfalarında veri varlığına göre index/noindex kararını uygula.
- [ ] F5.3 Sitemap üretimini canonical ürün, aktif hal, yayınlanmış analiz ve gerçek lastmod ile besle.
- [ ] F5.4 Teknik `updated_at` yerine editoryal/veri anlamlı tarih kullan.
- [ ] F5.5 Breadcrumb UI ve schema URL’lerinin aynı olduğunu test et.
- [ ] F5.6 Product/Dataset/Article/Organization/LocalBusiness schema sınırlarını doğru uygula.
- [ ] F5.7 Görsel konsept uygulamasında hero/LCP görselleri için WebP/AVIF ve responsive sizes kullan.
- [ ] F5.8 Ürün görseli yoksa stabil, erişilebilir ve hafif fallback kullan.
- [ ] F5.9 Kopya içerik, thin sayfa ve redirect sonrası orphan link taraması yap.
- [ ] F5.10 GSC bazına göre 2, 4 ve 8 haftalık izleme planı kur.

## 8. Faz 6 — Analitik ve deney ölçümü

- [ ] F6.1 Event isim sözlüğü, payload şeması ve PII yasağını yaz.
- [ ] F6.2 `search_opened`, `search_submitted`, `search_result_selected`, `price_viewed` eventlerini ekle.
- [ ] F6.3 Filtre kullanım ve sıfır sonuç eventlerini ekle.
- [ ] F6.4 `call_request_opened/submitted/cancelled` eventlerini ekle.
- [ ] F6.5 Satıcı tarafında `notified/accepted/declined/completed` dönüşümünü ölç.
- [ ] F6.6 Bülten, sosyal, reklam, API ve kurumsal rapor hunilerini ayrı tanımla.
- [ ] F6.7 Analytics’e telefon, e-posta, not, tam URL query PII veya kullanıcı adı gönderme.
- [ ] F6.8 Tema rollout feature flag/cohort karşılaştırmasını tasarla.
- [ ] F6.9 Ana KPI dashboard’unu oluştur: fiyat bulma süresi, search success, anomaly rate, call conversion.
- [ ] F6.10 KPI bozulmasında rollback/inceleme eşiği belirle.

## 9. Faz 7 — Erişilebilirlik, performans ve güvenlik QA

### 9.1 Erişilebilirlik

- [ ] F7.1 Tüm sayfalarda tek mantıklı H1 ve doğru heading sırası.
- [ ] F7.2 Skip link, landmark ve klavye navigasyonu.
- [ ] F7.3 Focus görünürlüğü ve modal focus restore.
- [ ] F7.4 Form label/help/error ilişkilendirmesi.
- [ ] F7.5 Grafik ve haritalar için metinsel alternatif/tablo.
- [ ] F7.6 Renk körlüğü simülasyonu; renk dışı göstergeler.
- [ ] F7.7 200% zoom ve 320 px reflow testi.
- [ ] F7.8 Screen reader ile ana arama, fiyat okuma ve çağrı talebi akışı.

### 9.2 Responsive ve tarayıcı

- [ ] F7.9 320, 360, 390, 768, 1024, 1280 ve 1440 px kontrolleri.
- [ ] F7.10 iOS Safari, Android Chrome, desktop Chrome/Firefox/Safari.
- [ ] F7.11 Safe-area, sticky header/bottom CTA ve sanal klavye davranışı.
- [ ] F7.12 Tablo, grafik, modal, sheet ve uzun Türkçe metin taşma testleri.

### 9.3 Performans

- [ ] F7.13 Route bazlı client JS ve hydration sınırlarını ölç.
- [ ] F7.14 Ağır grafik/harita bileşenlerini görünürlük veya dynamic import ile yükle.
- [ ] F7.15 Fotoğraf kullanılan konseptte LCP preload/priority kararını doğru uygula.
- [ ] F7.16 Font subset/preload ve `font-display` ayarlarını optimize et.
- [ ] F7.17 Skeleton/layout ölçüleriyle CLS’yi hedef altında tut.
- [ ] F7.18 API waterfall, cache ve duplicate fetch’leri azalt.
- [ ] F7.19 Lighthouse hedefleri: Performance ≥90, Accessibility ≥95, SEO ≥95 (kritik sayfalar).

### 9.4 Güvenlik/gizlilik

- [ ] F7.20 Public API response snapshot’larında PII taraması.
- [ ] F7.21 Authz: owner/admin DTO ve aksiyonlarını public kullanıcıdan ayır.
- [ ] F7.22 Rate limit, CSRF, input validation ve output encoding testleri.
- [ ] F7.23 Görsel upload MIME/boyut/metadata güvenliği.
- [ ] F7.24 Sentry ve log redaction testi.
- [ ] F7.25 Cache’in kişiye özel arama talebi/profil verisini kullanıcılar arasında paylaşmadığını test et.

## 10. Faz 8 — Otomatik test ve kabul paketi

- [ ] F8.1 Token ve temel UI component unit testleri.
- [ ] F8.2 Header, ThemeToggle ve mobile nav testleri.
- [ ] F8.3 PriceCard/PriceTable/FreshnessBadge testleri.
- [ ] F8.4 Canonical ürün ve birim fixture testleri.
- [ ] F8.5 Invalid Date ve anomali regresyon testleri.
- [ ] F8.6 Listing DTO telefon sızıntısı testleri.
- [ ] F8.7 Call request state/auth/rate-limit integration testleri.
- [ ] F8.8 SEO metadata/schema/redirect testleri.
- [ ] F8.9 Ana sayfa arama→ürün E2E.
- [ ] F8.10 İlan listesi→detay→arama talebi E2E.
- [ ] F8.11 Analiz liste→rapor→PDF/paylaş E2E.
- [ ] F8.12 Harita/data-health filtre ve status E2E.
- [ ] F8.13 API Pro başvuru ve reklam talep E2E.
- [ ] F8.14 Light/dark visual regression snapshotları.
- [ ] F8.15 7 konsept ekran ailesi için canlı sonrası karşılaştırmalı screenshot seti.
- [ ] F8.16 `npm run lint`, `npm test`, `npm run build` başarı çıktısını artifact olarak kaydet.

## 11. Faz 9 — Kademeli yayın ve canlı doğrulama

- [ ] F9.1 DB migration ve backend değişikliklerini frontend’den önce geriye uyumlu yayınla.
- [ ] F9.2 P0 telefon/gizlilik düzeltmesini tema rollout’undan bağımsız yayınla.
- [ ] F9.3 Yeni tema için feature flag veya sınırlı cohort oluştur.
- [ ] F9.4 Önce ana sayfa + ürün + ilan detayı pilotunu yayınla.
- [ ] F9.5 Hata, Web Vitals, search success ve call conversion’ı 24–72 saat izle.
- [ ] F9.6 Ardından analiz, ilan listesi, harita/data-health ve API Pro’yu kademeli aç.
- [ ] F9.7 CDN/cache temizliğini kontrollü yap; eski CSS/HTML karışımını test et.
- [ ] F9.8 Canlıda desktop/mobile screenshot ve network kanıtlarını kaydet.
- [ ] F9.9 Sitemap/canonical/redirect ve Search Console doğrulamasını yap.
- [ ] F9.10 Kritik KPI veya hata eşiği aşılırsa rollback’i uygula ve olay kaydı aç.

## 12. Faz 10 — Eklenti kataloğu uygulama sırası

### 12.1 Temiz veri sonrası erken işler

- [ ] F10.1 Canlı veri durumu sayfasını gerçek health metrikleriyle tamamla.
- [ ] F10.2 Pazartesi bülteni: kayıtlı karar SINGLE opt-in (2026-05-28, Orhan onaylı — %78 mobil Ads funnel'ında double opt-in friction'ı reddedildi; double opt-in'e dönme); unsubscribe (stateless HMAC token), bounce ve şikâyet sürecini kur. Önce E45'teki subscribe 404 bug'ını kapat.
- [ ] F10.3 Sosyal kartları editör onaylı taslak akışıyla üret; tek yayın kaynağı ekosistem-sosyal-medya kalır (çift-poster yasağı), content-guard yayın kapısından geçir; X yayını şu an kapalı (`site_settings.twitter_enabled`, kredi nedeniyle 2026-08-10).
- [ ] F10.4 Basın servisini kaynak/metodoloji ve editör onayıyla pilotla.

### 12.2 Gelir pilotları

- [ ] F10.5 Reklam fiyat/talep vitrini ve manuel rezervasyon pilotu.
- [ ] F10.6 API Pro anahtar/kota/ölçüm/SLA/lisans tamamlandıktan sonra tasarım ortağı pilotu.
- [ ] F10.7 Kurumsal raporu önce tek segmentte manuel ücretli pilot olarak sat.
- [ ] F10.8 Ödeme ve yenileme kanıtı gelmeden büyük abonelik otomasyonu kurma.

### 12.3 İleri ürünler

- [ ] F10.9 WhatsApp/Telegram alarmını canonical ürün, izin ve maliyet kontrolü sonrası başlat.
- [ ] F10.10 Proxy/santral gerçek aramayı MVP talep dönüşümü kanıtlandıktan sonra değerlendir.
- [ ] F10.11 Fiyat tahminini temiz tarihsel veri, baseline backtest, MAE/MAPE ve drift izleme sonrası pilotla.
- [ ] F10.12 Eşiği geçmeyen ürünlerde tahmin yayınlama.

## 13. Nihai Definition of Done

- [ ] D1 PDF’deki 12 bulgunun her biri canlı kanıtla kapalı veya gerekçeli kapsam dışı.
- [ ] D2 Public ilan/arama/firma sözleşmelerinde telefon politikası açık ve testli.
- [ ] D3 Kullanıcı numara görmeden güvenli arama talebi oluşturabiliyor.
- [ ] D4 Canonical ürün ve birim katmanı tüm tüketici yüzeylerini besliyor.
- [ ] D5 Kritik anomali yayına çıkmadan veri bekçisine düşüyor.
- [ ] D6 Sayaçlar tek tanımdan besleniyor ve kullanıcıya açıklanıyor.
- [ ] D7 Seçilen konsept tüm ana sayfa ailelerinde tutarlı tasarım tokenlarıyla uygulanmış.
- [ ] D8 Light tema varsayılan, dark tema erişilebilir bir tercih.
- [ ] D9 Ana sayfa fiyat bulma görevini ilk ekranda çözüyor.
- [ ] D10 Ürün sayfasında fiyat/birim/tarih/kaynak en güçlü hiyerarşide.
- [ ] D11 Analiz raporlarında geçerli tarih, kapsam, metodoloji ve düzeltme bağlantısı var.
- [ ] D12 İlan, harita, data-health ve API Pro ekranları onaylı konseptle tutarlı.
- [ ] D13 Reklamlar içerikten açıkça ayrılmış.
- [ ] D14 WCAG, responsive, tarayıcı, Lighthouse ve E2E kabul eşikleri geçilmiş.
- [ ] D15 Redirect/canonical/sitemap/Search Console göçü doğrulanmış.
- [ ] D16 Analytics KPI’ları PII içermeden çalışıyor.
- [ ] D17 Runbook, operasyon sahibi, rollback ve canlı artifact paketi hazır.
- [ ] D18 Eski çelişkili frontend planı tarihsel olarak işaretlenmiş; bu checklist tek aktif kaynak.

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

- [ ] E1 Karantina altyapısı ZATEN VAR (güvenilmez veri silinmez; karantina + Wayback kurtarma muafiyeti `sourceApi=*_wayback`). F1.46–47 ve F2.15 mevcut mekanizmayı genişletir, sıfırdan tasarlamaz.
- [ ] E2 Ürün eşleme altyapısı ZATEN VAR: match-key = token-sırala + birim, kg≠adet ayrı ürün; ETL alias haritasında "kendi adı > alias" iki-geçiş kuralı (513 çakışan anahtar sessiz veri kaybı vakası). F2.1 sözleşmesi bu kuralların üstüne yazılır; F2.5 fixture'larına bu vakalar eklenir.
- [ ] E3 `docs/URUN-BIRLESTIRME-PLAYBOOK.md` + auto-merge önerici mevcut ve aile bazında çalıştı (tamamlanan aileler listesi playbook'ta). F2.18–25 URL göçü, tamamlanmış ailelerle diff'lenerek planlanır; yapılmış iş tekrar planlanmaz.
- [ ] E4 410 otomatı yanlış pozitif üretti: generic aile-başı slug'lar (biber/lahana/sarımsak…) "ölü ürün" sanılıp Gone yapıldı, doğrusu varyanta 301 (5 kayıt düzeltildi). F2.18 haritasına "410→301 geri alma denetimi" maddesi eklenir.
- [ ] E5 Reklam/banner modülü CANLI (9 slot, CTR takibi, image/code tipleri, code-type sanitize → `creativeConfig` kullan; 7/14 pozisyon sayfaya bağlı; Hostinger affiliate 3 slotta yayında). P4.85 ve F10.5 bu modülün üstüne kurulur; `docs/checklists/REKLAM-BANNER-CHECKLIST.md` referans.
- [ ] E6 Sosyal yayın content-guard + tek-poster politikası mevcut (F10.3 inline düzeltildi); yeni sosyal kart üreticisi de aynı kapıdan geçer.
- [ ] E7 GSC tek-indirici mimarisi: URL inspection SADECE hal-fiyatlari bulk+cron'da yaşar. F2.25 ve F5.10 göç doğrulaması mevcut bulk inspector ile yapılır; ikinci inspector yazılmaz.
- [ ] E8 `getPageMetadata` page-key çakışması tuzağı: DB `seo_pages` template'i sayfa override'ını ezebilir (hal_detay vakası). F5.1 çalışmasında detay sayfası key'lerinin liste key'lerine çarpmadığı test edilir.
- [ ] E9 Ürün foto altyapısı mevcut: `hf_products.image_url` + admin upload + manifest. 34 ürüne Commons fotoğrafı eklendi, ~110 ürün fotoğrafsız, CC lisans ATIFI YAPILMIYOR (açık hukuki risk). F5.8'den önce atıf borcu kapatılır; Tarladan Sofraya yönü seçilirse bu risk kritikleşir (E27).
- [ ] E10 Admin "Kalite" sekmesi (içerik/SEO/index skoru + GSC inspect) ve haftalık analiz "yeniden üret + yayınla" akışı mevcut; mover anomali cap (%80) deploy'lu. F1.31–35 Invalid Date düzeltmesi bu üreticiyi regresyona sokmadan yapılır; /analiz cron'da DEĞİL, manuel denetlenir.
- [ ] E11 Telegram bildirim kanalları canlı (contact / firma-lead / ilan-sorusu / yeni-ilan); satıcı arama-talebi bildirimi (F1.14) aynı kanala eklenir.
- [ ] E12 Baseline araçları hazır: `backend/scripts/traffic-report.sh` (elle awk yazma), `backend/scripts/etl-health.sh 24`, PageSpeed API anahtarı backend/.env'de. F0.23–28 bazları bu araçlarla alınır.

### 15.2 Faz 0 ilaveleri — keşif

- [x] E13 Git/VPS drift envanteri: local/origin/VPS aynı HEAD `60873b3d`; local ve VPS WIP tespit edildi. Drift raporu: `artifacts/renewal-2026/faz0-canli-dogrulama-2026-08-13.md`. Reset yapılmadı.
- [~] E14 Uncommitted WIP sahipliği: aynı WIP local ve VPS’de doğrulandı; korunuyor ve bu çalışma dosyalarıyla çakıştırılmadı. Sahiplik/commit ayrıştırması bekliyor.
- [ ] E15 Ana sayfa mobil LCP kökü BİLİNİYOR: masaüstü ağacı `hidden md:block` ile mobilde de hydrate oluyor (~505KB RSC); analytics lazyOnload ile Perf 57→80 alındı. F7.13–14'ün ilk somut işi viewport-gated dynamic import; Lighthouse bazı bu bilinen bulgu notuyla kaydedilir.

### 15.3 Faz 1–2 veri ilaveleri — kayıtlı en büyük veri borçları

- [ ] E16 `avg_price` kayıtların ~%79'unda SENTETİK (min–max orta noktası). Çeklistte hiç geçmiyor; sitedeki tüm fiyatları, raporları ve endeksi etkileyen en büyük veri borcu budur. ETL'de gerçek ortalama/sentetik ayrımı (ör. `is_synthetic` bayrağı) + tüketici yüzeylerinde (sayfa/API/bülten/endeks) ayrıştırma. Ref: `docs/checklists/DONMUS-HAL-VERISI-DUZELTME.md`.
- [ ] E17 2025 tarihsel serisi 3 halde şişik (muhtemel parser regresyonu) — YoY kıyas BLOKLU; 5 düzeltme yöntemi denendi, başarısız. Ürün detaydaki "Yıllık Karşılaştırma" dahil tüm YoY yüzeyleri bu seriyi ya karantinalar ya açıkça işaretler; sessiz YoY yayınlanmaz.
- [ ] E18 546 TL domates kök nedeni ham fiyat değil, "tahmini perakende" TÜREV hesabıdır. F1.44–48 guard'ı ham fiyatlara ek olarak türev formüle (hal→perakende katsayısı) ve `hf_retail_prices` girdilerine uygulanır; ekrandaki "%50–200 aralığı" iddiası testle doğrulanır.
- [ ] E19 marketfiyati RETAIL_EXTRA throttle gerçeği: ~750 fresh çağrı sonrası IP throttle; kürasyonlu dikey fresh-produce'tan ÖNCE çalışmalı; retail destekleyicidir, index'i sürmez. Retail comparison'daki tazelik etiketi bu kısıtı yansıtır.
- [ ] E20 TOBB TL/ton→kg birim vakası (~1000x şişik fiyat; 194 garbage kayıt temizliği + parser fix) F2.13 ve F2.17'nin birincil fixture'ı yapılır; zeytinyağı/zeytin gerçek 100–350 TL bandı negatif test olarak eklenir.
- [ ] E21 Bekleyen toplu temizlikler F2 kapsamına alınır: iceberg ailesi birleştirmesi (KALAN-ISLER), donma detektörünün mutlak eşikle yanlış pozitif verdiği bulgusu F2.32 kural setine işlenir.

### 15.4 Güvenli arama MVP — gerçeklik notları

- [ ] E22 SMS/OTP KOD ALTYAPISI VAR: `backend/src/modules/listings/sms.ts` Netgsm gönderimi, `otp.ts` normalize/HMAC/TTL/deneme-günlük limit ve `phase12.controller.ts` send/verify akışını içeriyor. Faz 0'da canlı `SMS_PROVIDER`, `NETGSM_*` credential ve gönderim sonucu doğrulanır; yeni SMS sistemi yazılmaz. Sağlayıcı pasifse MVP Resend+Telegram+panel ile çıkar, SMS aktivasyonu ayrı operasyon kararı olur.
- [ ] E23 Alıcının "maskeli numaram" gösterimi için telefon OTP veri modeli ve imzalı token altyapısı mevcut. Keşif kapsamı altyapının varlığı değil; `LISTING_REQUIRE_PHONE_OTP`, canlı credential, tokenın call-request yetkilendirmesinde güvenli yeniden kullanımı ve kullanıcı profilindeki verified-phone kalıcılığıdır. Canlı SMS pasifse doğrulanmış e-posta ile MVP alternatifi ayrıca kararlaştırılır.
- [ ] E24 Yeni `call_requests` endpoint'leri guvenlik-guard hook ve `requireEnv` (secret fallback YASAK) kurallarına tabidir; review'da signup default-admin sınıfı açıklara özel bakılır.
- [ ] E25 KVKK aydınlatma metinleri veri sorumlusu kimliğine bağlıdır (E31 künye kararı); tüzel kişi netleşmeden metin yayınlanmaz.
- [ ] E26 İlan modülünün kayıtlı kararları korunur: ilan fiyatı hal fiyat verisine KARIŞMAZ; coğrafyalar arası eşleştirme (Antalya karpuzu ↔ Kars alıcısı) ana değer önerisidir; sponsorluk/öne-çıkarma geliri Faz 0'dan açıktır (gated bireysel premium'dan ayrı).

### 15.5 Tema/konsept kararına ek girdiler

- [ ] E27 Puanlama matrisine (R1.21) 4 kriter eklenir: (a) foto lisans/atıf yükü — CC borcu E9, (b) LCP maliyeti — trafik %78 mobil, (c) AI-üretimi stok fotoğrafın "gerçek veri" güvenine etkisi, (d) e-ticaret tonu tuzağı — platform satış yapmıyor, "Alışverişe başla" dili markaya aykırı.
- [ ] E28 Fable 5 puanlama girdisi (bağlayıcı değil; karar R1.21–24'te): baz = Temiz Veri (veri güveni, kontrast, B2B/API uyumu, token uygulanabilirliği en yüksek); analiz/rapor/editoryal sayfalarda Pazar Defteri sıcaklığı; foto yalnız gerçek+lisanslı görsel olan yerde (ürün kartı). Tarladan Sofraya'nın tam seti lisans+LCP+güven riski nedeniyle önerilmez.
- [ ] E29 Tema rollout'u aktif Google Ads kampanyasıyla (150 TL/gün, brand-awareness fazı) koordine edilir: landing kalite puanı ve conversion tag (AW-18007572524) rollout penceresinde izlenir; pilot cohort Ads trafiğini kapsıyorsa Atakan'a haber verilir.
- [ ] E30 Tema değişimi OG şablonlarını (T1 `seo_pages`/uploads + T2 `/og/` route) ve yeni font/asset'ler CSP snippet'ini (VPS `deploy/nginx` izlenen kopya) etkiler; rollout PR'ına OG+CSP maddesi eklenir, canlıda pm2 log `csp_violation` sayımıyla doğrulanır.

### 15.6 Künye ve gelir gerçekleri

- [ ] E31 Künye/tüzel kişi kayıtlı kararla doldurulur: gelir GZL Teknoloji üzerinden (Adım 0 çözüldü); Atakan = sahip + sektör ağı, teknik yürütme Orhan. F1.38–39 bu mutabakatla, `MONETIZASYON-CHECKLIST.md` Adım 0 çıktısıyla beslenir.
- [ ] E32 Gelir pilot sırası kayıtlı kanal sırasına uyar: A) ekosistem lead-gen → B) firma dizini claim+öne-çıkarma → C) B2B veri/rapor/API. F10.5–8 buna göre önceliklendirilir; Premium aktivasyon tetiği (10K DAU + 50 makale + 2K abone) geçerli kalır.
- [ ] E33 Kurumsal rapor pilotu (F10.7) Atakan mutabakatı olmadan satışa çıkmaz; konsept görselindeki ₺1.490/₺4.990 fiyatlar MOCK'tur — P4.80 gereği gerçek fiyat kararı alınmadan siteye yazılmaz.
- [ ] E34 Firma claim funnel'ı HAZIR ama 0 başvuru — eksik olan promosyon/görünürlük; P4.76'dan önce asıl iş budur. Kanal gerçeği: firma e-postası ~%2, telefon %94; scrape edilmiş telefonlar pazarlama/Customer Match'te KULLANILAMAZ (KVKK) — tek meşru yol claim + açık rıza + İYS.

### 15.7 IA dikey kapsamı

- [ ] E35 Yeni IA meyve-sebzeyle sınırlı kalmaz: canlı hayvan + karkas et (veri CANLI, landing/SEO eksik), borsa/TMO/resmi fiyatlar (`market_type` ayrımı) ve retail (destekleyici) dikeyleri nav/harita/sayaç tanımlarına dahil edilir; F2.26 metrik sözlüğü `market_type` kırılımı içerir.
- [ ] E36 Mobil/PWA işleri `docs/checklists/MOBIL-WEB-PWA-CHECKLIST.md` ile eşlenir (manifest, service worker, bottom-nav kararı Orhan'da); Faz 3–4 mobil maddeleri o çeklistle çift kayıt oluşturmaz.

### 15.8 Deploy ve rollout emniyeti (Faz 9'a bağlanır)

- [ ] E37 Deploy SADECE git: local commit+push → VPS drift/clean-tree kontrolü → tercihen `git pull --ff-only` → build. rsync/scp yasak. VPS değişikliği varsa önce korunur/commitlenir; `git reset --hard` normal deploy adımı değildir ve yalnız açık hedef doğrulaması + yedek + özel onayla istisnai uygulanabilir.
- [ ] E38 Build çıktısı asla pipe'lanmaz (SIGPIPE → bozuk `.next` → 502, 2026-08-10 vakası): `bun run build > /tmp/build.log 2>&1; echo EXIT=$?; tail -20 /tmp/build.log`.
- [ ] E39 Frontend/admin için `pm2 restart hal-frontend hal-admin --update-env` (reload DEĞİL — standalone eski HTML/chunk servis eder); restart öncesi `.next/standalone/.../server.js` varlığı doğrulanır; backend'de `pm2 reload hal-backend` yeterli.
- [ ] E40 Ürün sayfaları ISR'da: tema rollout'unda revalidate/cache purge planı yapılır; F9.7 eski/yeni CSS-HTML karışımı testi ISR sayfalarını da kapsar.
- [ ] E41 Rollout sonrası nginx `haldefiyat.access.log` + pm2 log'da 502/ChunkLoadError taraması; `pm2 describe hal-frontend` script args kontrolü (`next start` regresyonu = standalone uyuşmazlığı → 502).

### 15.9 Analitik ve dağıtım tekleştirme

- [ ] E42 GA4 hal-fiyatlari için AYRI property yok (VistaSeeds property'si altında). F6.1'den önce karar: ayrı GA4 property mi, mevcut mu? Event sözlüğü bu karara göre yazılır.
- [ ] E43 F6 event işleri `ADS-SETUP-CHECKLIST.md` Madde 11 zinciriyle (11.1 audit log fix → 11.2 conversion event'ler → 11.3 gclid/UTM cookie → 11.5 admin analytics) TEK plana birleştirilir; iki paralel analitik işi yürütülmez.
- [ ] E44 KPI panosunda GSC(yalnız organik arama, ~10 tık/gün) ile nginx(tüm istekler, ~19K/gün) ayrımı açıkça etiketlenir; trafik kıyasında dedike `haldefiyat.access.log` + "günü bitmemiş kısmi gün dahil edilmez" kuralı.
- [x] E45 Newsletter subscribe 404 bug'ı canlıda kapanmış: 13 Ağustos doğrulamasında invalid email POST’u 422 döndürdü, yani public route kayıtlı. HMAC unsubscribe mimarisi korunuyor; sabit secret fallback P0 paketinde kaldırıldı.
- [ ] E46 Pazartesi bülteni içeriği kayıtlı metodolojiye uyar: sabit sepet + mevsimlik bölüm, "eşleşmiş sepet" kuralı (kıyaslanan 3 sayı aynı kümeden), yayın öncesi yüzde doğrulaması zorunlu.
