# Sosyal Medya + API Otomasyon Kurulum Checklist

**Oluşturulma:** 2026-05-26
**Hedef:** HalDeFiyat için Facebook + Instagram + YouTube hesaplarını profesyonel (tüzel kişi) açmak, Meta Business + Developer App + Google Cloud kurulumu yapmak, **otomatik post / Reels / DM chatbot / YouTube upload** API entegrasyonlarına hazır altyapıyı kurmak.

**Sahip mail:** `info@vistaseeds.com.tr` (Vista Seeds Workspace üzerinden)
**Statü:** Tüzel kişi (firma adına, vergi levhalı)
**Tempo:** Bu hafta 3 hesap aç + manuel post → 1-2 hafta API entegrasyonu

---

## 📊 Genel Timeline ve Bağımlılık Diyagramı

```
HAFTA 1
├── Gün 1-2  Facebook + Instagram + YouTube hesap açımı (manuel)
├── Gün 3    Meta Business Manager + Domain Verification (DNS TXT)
└── Gün 4-5  Business Verification başvurusu (vergi levhası + ticaret sicil)
              └── Meta onay: 1-2 hafta bekleyiş

HAFTA 2-3 (Business Verification onaylandıktan SONRA)
├── Meta for Developers App create
├── App Review başvurusu (en zor kısım — 5-15 gün)
└── Google Cloud + YouTube Data API setup

HAFTA 4
├── Backend modülleri (shared-backend/modules/social/*)
├── Admin panel: /admin/social/compose
└── İlk otomatik post testi
```

> ⚠️ **Kritik bağımlılık:** Meta App Review **Business Verification onayından önce yapılmaz**. Yani önce firma doğrulaması, sonra app review. Toplam 3-4 hafta süreceğini hesaba kat.

---

## ✅ AŞAMA 0 — Önkoşullar (BAŞLAMADAN ÖNCE hazırla)

Hiçbir adıma başlamadan **bu dosyaları/bilgileri** hazır et. Eksik olursa orta yerde takılırsın.

### 0.1 — Firma belgeleri (PDF olarak hazır)
- [ ] **Vergi Levhası** — Gelir İdaresi'nden indirilebilir (interaktif vergi dairesi)
- [ ] **Ticaret Sicil Gazetesi** — firma kuruluş ilanı (ticsicil.gov.tr)
- [ ] **İmza Sirküleri** veya **Yetki Belgesi** — noter onaylı
- [ ] **Firma adresi belgesi** — kira sözleşmesi VEYA elektrik/gas/su faturası (firma adına, son 3 ay)
- [ ] **Yetkili kişi TC kimlik fotoğrafı** (ön+arka, JPG/PNG)
- [ ] **Yetkili kişi selfie** (kimlikle birlikte, doğrulama için)
- [ ] **Firma telefon numarası** — Meta SMS doğrulama için aranabilir/SMS alabilir olmalı

### 0.2 — Marka görselleri (Canva veya Figma ile hazırla)
- [ ] **Logo** — 800x800 PNG transparent (her platform için profil resmi)
- [ ] **Favicon** — 64x64 PNG (zaten var, `/uploads/brand/favicon.png`)
- [ ] **Facebook kapak fotoğrafı** — 1640x856 PNG/JPG
- [ ] **Instagram square** — 1080x1080 PNG/JPG (ilk post için)
- [ ] **Instagram story** — 1080x1920 (template)
- [ ] **YouTube banner** — 2560x1440 PNG/JPG (TV/desktop/mobile uyumlu, "safe area" 1546x423 ortalı)
- [ ] **YouTube watermark** — 150x150 PNG transparent (video köşesi)
- [ ] **YouTube end screen template** — 1920x1080 (son 5 saniye, abone ol + sıradaki video)

### 0.3 — Metin içerikleri (Notion/Google Doc'ta hazırla)
- [ ] **Kısa bio** (50 karakter) — IG için
- [ ] **Orta bio** (160 karakter) — Twitter benzeri
- [ ] **Uzun açıklama** (5000 karakter) — YouTube channel description
- [ ] **Hakkımızda metni** — FB Page Hakkında bölümü
- [ ] **Kategori etiketleri** — her platform için 5-10 hashtag (#halfiyat #toptansebze #toptanmeyve vb.)
- [ ] **İlk post taslakları** — 5-10 hazır içerik (manuel posting için)

### 0.4 — Web tarafı hazır olmalı (Meta App Review için ŞART)
- [ ] **Privacy Policy** — `https://haldefiyat.com/gizlilik-politikasi` ✅ (var)
- [ ] **Terms of Service** — `https://haldefiyat.com/kullanim-kosullari` ✅ (var)
- [ ] **KVKK aydınlatma metni** — `https://haldefiyat.com/kvkk` ✅ (var)
- [ ] **İletişim sayfası** — `https://haldefiyat.com/iletisim` ✅ (var)
- [ ] **Hakkımızda sayfası** — `https://haldefiyat.com/hakkimizda` ✅ (var)
- [ ] **Sosyal medya bağlantıları footer'da** — şimdilik # placeholder OK, sonra güncellenecek

### 0.5 — Sahiplik kararı (önceden net olmalı)
- [ ] **Google Workspace açacak mısın?** — `info@haldefiyat.com` için (önerilir, 200 TL/ay)
  - Şimdilik `info@vistaseeds.com.tr` ile devam et, sonra geçişi planla
- [ ] **Username sırası belirle:**
  - 1. tercih: `haldefiyat`
  - 2. tercih: `haldefiyatcom`
  - 3. tercih: `hal.de.fiyat` veya `hde.fiyat`
- [ ] **3 platformda da müsaitlik kontrolü yap** (5 dakika)

---

## ✅ AŞAMA 1 — Facebook Page (Gün 1, ~30 dakika)

### 1.1 — Page oluştur
- [ ] `facebook.com` → giriş yap (info@vistaseeds.com.tr — Workspace üzerinden Google SSO da olabilir)
- [ ] Sağ üst **+ Oluştur → Sayfa**
- [ ] **Sayfa adı:** `HalDeFiyat`
- [ ] **Kategori:** "Haberler ve Medya Web Sitesi"
  - Alternatifler: "Tarım/Pazar Yeri", "Bilgi/Bağlantı Sitesi"
  - ⚠️ Kategori sonradan değiştirilebilir ama **API permissions kategoriye göre değerlendirilir** — News & Media veya Internet Company güvenli seçim
- [ ] **Bio (255 karakter max):**
  ```
  Türkiye'nin 22+ ilinden günlük hal fiyatları, fiyat endeksi ve trend analizi. Ücretsiz veri, fiyat alarmı, geçmiş arşiv. ▸ haldefiyat.com
  ```
- [ ] **Page Oluştur**

### 1.2 — Görseller
- [ ] **Profil resmi** yükle (logo, 360x360+)
- [ ] **Kapak fotoğrafı** yükle (1640x856)
- [ ] **Pinned post:** ilk tanıtım metni + ana sayfa görseli (sonradan)

### 1.3 — Bilgiler sekmesi (eksiksiz doldur)
- [ ] **Hakkında:**
  - Genel açıklama: 250+ kelime (SEO için, Meta de okur)
  - Şirket türü: **Şirket** (Şahıs, LLC vs.)
  - **Kuruluş tarihi:** firmaya göre
- [ ] **İletişim:**
  - Telefon: firma telefonu
  - E-posta: `info@vistaseeds.com.tr` (sonra `info@haldefiyat.com`)
  - Web sitesi: `https://haldefiyat.com`
  - Adres: firma resmi adresi
- [ ] **Mağaza saatleri:** "Her zaman açık" (online platform)

### 1.4 — Username (vanity URL)
- [ ] Profil → Sayfa adresini düzenle → `@haldefiyat`
- [ ] URL doğrula: `facebook.com/haldefiyat`

### 1.5 — İlk içerik
- [ ] 3-5 başlangıç post'u (otomasyon başlamadan önce hesabın "canlı" görünmesi için Meta'nın sevdiği bir şey — boş hesap red riski yüksek)

**⚠️ Yaygın hata:** Hesap **0 post / 0 takipçi** ile App Review başvurusu → "düşük güven" → red.
→ **En az 5-10 organic post + 50+ takipçi** olmalı App Review başlamadan önce.

---

## ✅ AŞAMA 2 — Instagram Business (Gün 1, ~30 dakika)

### 2.1 — Hesap aç
- [ ] `instagram.com/accounts/emailsignup`
- [ ] E-posta: `info@vistaseeds.com.tr`
- [ ] **Username:** `haldefiyat` (alındıysa Aşama 0.5'teki yedek)
- [ ] Şifre: güçlü, kaydet
- [ ] Telefon: firma numarası (SMS doğrulama)

### 2.2 — Bio + foto
- [ ] **Bio (150 karakter):**
  ```
  🛒 Türkiye Hal Fiyat Endeksi
  📊 22 ilden günlük toptan veri
  🔔 Ücretsiz fiyat alarmı
  👇 Web sitesi
  ```
- [ ] **Link:** `https://haldefiyat.com` (sadece 1 link, linktr.ee de olur)
- [ ] **Profil resmi:** Facebook ile aynı logo

### 2.3 — Professional/Business'a çevir (🔴 KRİTİK)
- [ ] Settings → **Account → Switch to Professional Account**
- [ ] Category: **News & Media Website** (FB ile aynı)
- [ ] **Business** seç — ❌ Creator değil (API erişimi yok)
- [ ] Mail + telefon doğrula

### 2.4 — Facebook Page'e bağla (🔴 KRİTİK)
- [ ] Profile → **Edit Profile** → **Page** alanında **Connect or Create a Facebook Page**
- [ ] **HalDeFiyat** Page'i seç → Connect
- [ ] Bağlantıyı doğrula: FB Page Settings → Instagram → IG hesabı listede olmalı

**⚠️ Bu bağlantı OLMADAN Instagram Graph API çalışmaz.** Hata mesajı: "Instagram account is not connected to a Facebook Page".

### 2.5 — İlk içerik
- [ ] Min 5-10 post (FB ile paralel)
- [ ] Min 3 story (highlight'a kaydedilebilir)
- [ ] 50+ organik takipçi hedef (App Review öncesi)

---

## ✅ AŞAMA 3 — YouTube Brand Channel (Gün 2, ~45 dakika)

### 3.1 — Google hesabı doğrula
- [ ] `info@vistaseeds.com.tr` **Workspace** mi yoksa düz Gmail mi?
  - Workspace ise: ✅ direkt YouTube erişimi
  - Düz Gmail değil ise (vistaseeds.com.tr Workspace olmayabilir): Workspace açmak veya yeni Google hesabı gerekir
- [ ] Test: `youtube.com` → sağ üst profil ikonu → "Sign in" → info@vistaseeds.com.tr ile giriş çalışıyor mu

### 3.2 — Brand Account ile channel aç
- [ ] `youtube.com/account` → **Add or manage your channels**
- [ ] **Create a new channel** (alt link)
- [ ] **Use a brand account** seç — ⚠️ kişisel ad yerine MARKA adı
- [ ] Brand name: **HalDeFiyat**
- [ ] Create

**Neden Brand Account?**
- Birden fazla yönetici eklenebilir (Atakan + Orhan)
- Kişisel Gmail'den bağımsız (mail değişse bile channel kalır)
- Diğer Google hesaplarına owner aktarımı yapılabilir
- YouTube Studio Team özelliği aktif

### 3.3 — Channel customization
- [ ] **YouTube Studio** → sol menü **Customization**

#### 3.3.1 — Branding
- [ ] **Profile picture:** 800x800+ (Facebook/IG ile aynı logo)
- [ ] **Banner image:** 2560x1440 (template'te "safe area" = ortadaki 1546x423 — mobilde de görünür)
- [ ] **Video watermark:** 150x150 transparent PNG (videoların sağ alt köşesinde abone ol butonu)

#### 3.3.2 — Basic info
- [ ] **Name:** HalDeFiyat
- [ ] **Handle:** `@haldefiyat` (alındıysa yedek)
- [ ] **Description (5000 char):**
  ```
  HalDeFiyat — Türkiye'nin 22+ ilinden günlük toptan hal fiyatlarını derleyen ücretsiz platform.

  Bu kanalda:
  📊 Haftalık fiyat trend videoları
  🛒 Şehir bazlı fiyat karşılaştırma
  📈 Aylık raporlar ve analizler
  🔔 Pazar haberleri ve fiyat alarmı

  Web sitesi: https://haldefiyat.com
  ...
  ```
- [ ] **Links** (channel'a görünür ekle):
  - Web sitesi: haldefiyat.com
  - Facebook: facebook.com/haldefiyat
  - Instagram: instagram.com/haldefiyat
- [ ] **Contact info:** `info@vistaseeds.com.tr` (business inquiries için)
- [ ] **Country:** Türkiye
- [ ] **Keywords:** hal fiyatları, toptan sebze, toptan meyve, fiyat endeksi, tarım pazarı

#### 3.3.3 — Layout
- [ ] **Featured video for non-subscribers:** en yeni rapor videon (1 tane)
- [ ] **Featured video for subscribers:** trailer veya öne çıkan
- [ ] **Featured sections:** Playlistlerinden 3-5 tane (Haftalık Raporlar, Şehir Analizleri, vs.)

### 3.4 — Channel doğrulama
- [ ] YouTube Studio → **Settings → Channel → Feature eligibility**
- [ ] Telefon ile doğrula (SMS) — 15 dk videodan uzun video upload + custom thumbnail için ŞART
- [ ] **Intermediate features** unlock olmalı

### 3.5 — Yönetici ekle (Brand Account'un avantajı)
- [ ] `youtube.com/account` → channel listesi → **HalDeFiyat → Manage permissions**
- [ ] Atakan ve Orhan'ı **Manager** olarak ekle (Owner sadece 1 kişi)

---

## ✅ AŞAMA 4 — Meta Business Suite (Gün 3, ~1 saat)

### 4.1 — Business Manager oluştur
- [ ] `business.facebook.com` → giriş (info@vistaseeds.com.tr)
- [ ] **Create Account**:
  - **Business name:** firma resmi adı (vergi levhasındakiyle BİREBİR aynı) — örn. "Vista Seeds Tarım Tic. Ltd." veya hangiyse
  - ⚠️ Sonradan değiştirmek **çok zor**, business verification öncesi tam doğru gir
  - **Your name:** yetkili kişi
  - **Email:** info@vistaseeds.com.tr

### 4.2 — Asset ekle (Page + IG)
- [ ] **Business Settings → Accounts → Pages → Add → Claim a Page**
- [ ] HalDeFiyat Page → claim et (admin olduğun için onaylanır)
- [ ] **Accounts → Instagram → Add → Connect**
- [ ] HalDeFiyat IG hesabı login bilgileri ver → connect

### 4.3 — Kullanıcı yetkilendirme
- [ ] **Users → People → Add**
- [ ] **Orhan** (orhanguzell@gmail.com):
  - Email gir → Continue
  - **Business role:** Admin (full control)
  - **Asset permissions:** Page (Manage), IG (Manage), Catalog (varsa) — tümüne yetki
  - Davet gönder → Orhan onaylar (mailden)
- [ ] **Atakan** (atakan07sahin@gmail.com): aynı, Admin

### 4.4 — Domain Verification (🔴 KRİTİK — ŞART)
- [ ] **Brand Safety → Domain Verification → Add domains**
- [ ] `haldefiyat.com` ekle
- [ ] **DNS TXT verification** seç (kolay, kalıcı)
- [ ] Meta'nın verdiği kaydı kopyala (örn. `facebook-domain-verification=abc123xyz...`)
- [ ] **Turhost paneli aç** → DNS Yönetimi → haldefiyat.com
- [ ] Yeni TXT kaydı ekle:
  - Tür: TXT
  - İsim: `@` veya boş (root domain için)
  - Değer: `facebook-domain-verification=abc123xyz...`
  - TTL: 3600
- [ ] Kaydet → 5-30 dk bekle
- [ ] Meta paneline dön → **Verify** butonu → yeşil tik bekle

**Test:** `dig TXT haldefiyat.com +short` → kayıt görünmeli

### 4.5 — Business Verification (🔴 1-2 HAFTA SÜREN ADIM)
- [ ] **Security Center → Business Verification → Start**

#### 4.5.1 — Adres + telefon doğrulaması
- [ ] **Business address:** firma resmi adresi (vergi levhasındakiyle aynı)
- [ ] **Business phone:** firma numarası
- [ ] **Verification method:** SMS / Call / Letter (mail) — SMS en hızlı

#### 4.5.2 — Belgeleri yükle (PDF, her biri max 8MB)
- [ ] Vergi Levhası → "Tax registration document"
- [ ] Ticaret Sicil Gazetesi → "Business registration document"
- [ ] İmza Sirküleri / Yetki Belgesi → "Articles of incorporation"
- [ ] Adres belgesi (elektrik faturası vs.) → "Utility bill" veya "Business license"

**Yaygın red sebepleri:**
- ❌ PDF okunaksız veya kalitesiz → 300dpi tarama yap
- ❌ Belge tarihi 12 ay+ eski → güncel belge kullan
- ❌ Firma adı belgede ≠ Business Manager'daki ad → bire bir eşleşmeli
- ❌ Adres belgesinde firma adı yok (sadece şahıs adı) → kira sözleşmesi gibi firma'ya bağlı bir belge
- ❌ Belgede türkçe + ingilizce karışık → Meta İngilizce çevirisini de isteyebilir

#### 4.5.3 — Bekleyiş ve sonuç
- [ ] **1-7 iş günü** Meta inceler
- [ ] Onay → email gelir, yeşil rozet
- [ ] Red → email gelir, sebep belirtilir → düzelt + tekrar başvur (her başvuruda 7 gün)

---

## ✅ AŞAMA 5 — Meta for Developers App (HAFTA 2, ~2-3 saat)

### Önkoşul
- [ ] **Business Verification ONAYLANDI** (Aşama 4.5 tamamlandı)

### 5.1 — Developer hesabı
- [ ] `developers.facebook.com` → giriş (info@vistaseeds.com.tr)
- [ ] **Get Started** (developer hesabı önceden yoksa) → telefon doğrula
- [ ] Profile complete

### 5.2 — App oluştur
- [ ] `developers.facebook.com/apps` → **Create App**
- [ ] **App type:** **Business** ← ⚠️ doğru seçim (Consumer değil)
- [ ] **App name:** `HalDeFiyat Otomasyon`
  - Not: "Facebook", "Instagram", "FB", "IG" gibi Meta marka isimleri YASAK
- [ ] **App contact email:** info@vistaseeds.com.tr
- [ ] **Business Account:** HalDeFiyat (Aşama 4'te oluşturduğun)

### 5.3 — App settings → Basic
- [ ] **App Icon:** 1024x1024 PNG (logo, transparent değil — solid background)
- [ ] **Privacy Policy URL:** `https://haldefiyat.com/gizlilik-politikasi`
- [ ] **Terms of Service URL:** `https://haldefiyat.com/kullanim-kosullari`
- [ ] **User Data Deletion URL:** `https://haldefiyat.com/kvkk` (veya yeni endpoint)
- [ ] **App Domain:** `haldefiyat.com`
- [ ] **Business Use:** Description (Meta okur — net yaz):
  ```
  HalDeFiyat, Türkiye'nin 22+ hal pazarından günlük toptan fiyat verilerini derleyen ücretsiz B2B/B2C platformdur.
  Bu uygulama:
  1) Haftalık fiyat trend raporlarını otomatik olarak FB Page ve IG Business hesabına yayınlar
  2) Kullanıcıların IG DM'lerine gelen fiyat sorgu sorularına otomatik yanıt verir
  3) Aylık özet videolarını YouTube'a yükler (ayrı API)
  
  Tüm içerikler firma sahipliğindeki HalDeFiyat hesaplarına yayınlanır; 3. taraf kullanıcı içeriği işlenmez.
  ```

### 5.4 — Products ekle
- [ ] **Facebook Login for Business** — OAuth flow
- [ ] **Pages API** — Page post yetkisi
- [ ] **Instagram Graph API** — IG post + Reels
- [ ] **Messenger Platform** — DM chatbot (sonra, App Review öncesi başvuruyu basit tut)
- [ ] **Webhooks** — IG DM event listener (Messenger Platform ile gelir)

### 5.5 — App Review başvuru hazırlığı (🔴 EN ZOR KISIM)

Meta her permission için ayrı ayrı "neden ve nasıl" sorar. Detaylı hazırlanılmazsa **kesin red**.

#### 5.5.1 — İzin listesi (Advanced Access için)
- [ ] `pages_show_list` (Standard)
- [ ] `pages_read_engagement` (Standard)
- [ ] `pages_manage_posts` (Advanced — review gerekli) ← Page'e post atma
- [ ] `pages_manage_metadata` (Advanced) ← Page bilgisi güncelleme
- [ ] `instagram_basic` (Standard)
- [ ] `instagram_content_publish` (Advanced — review) ← IG post + Reels
- [ ] `pages_messaging` (Advanced — review, en zor) ← DM chatbot
- [ ] `instagram_manage_messages` (Advanced — review) ← IG DM cevaplama

#### 5.5.2 — Her permission için hazırla
Meta her permission'da şu 5 şeyi ister:

1. **Use case** (kısa açıklama)
   - Örnek: "Haftalık fiyat trend raporunu HalDeFiyat FB Page'ine otomatik yayınlamak"
   
2. **Detailed description** (200+ kelime)
   - Hangi veri kullanılıyor?
   - Kullanıcı ne yaşıyor?
   - Veri nereye gidiyor?
   - Neden alternatif yok (manuel post neden yeterli değil)?

3. **Screencast video** (3-5 dakika, 1080p min)
   - Admin paneline giriş
   - "Yeni post oluştur" butonu
   - Form doldurma
   - Submit → FB'e post atılması (browser'da göster)
   - **3 farklı use case** göster (manuel post, scheduled post, error case)
   - Loom veya OBS ile kaydet, YouTube unlisted'a yükle, link ver

4. **Step-by-step usage**
   - "Adım 1: Admin paneline gir → /admin/social/compose"
   - "Adım 2: Caption + image yükle"
   - "Adım 3: Platform seç (FB/IG)"
   - "Adım 4: Submit → backend Graph API çağırır → post yayınlanır"

5. **Test credentials**
   - Admin user: test@haldefiyat.com / test-password
   - Test FB Page: HalDeFiyat (Meta reviewer'a Manager access ver)
   - Meta reviewer **gerçekten test eder**, çalışmazsa direkt red

#### 5.5.3 — Yaygın red sebepleri (DİKKAT)
- ❌ Screencast'te admin paneline giriş gösterilmiyor
- ❌ Privacy policy URL açılmıyor (404, slow)
- ❌ Test credentials çalışmıyor
- ❌ Use case açıklaması "sosyal medya yönetimi" gibi genel → spesifik ol
- ❌ Birden çok permission tek başvuruda → AYIR, her permission için ayrı use case
- ❌ App icon transparent (Meta solid bg ister)
- ❌ Business Verification onaylanmamış (Aşama 4.5 atlanamaz)
- ❌ App henüz "Development" modunda → "Live" yap

#### 5.5.4 — Başvuru ve süre
- [ ] App Review → **Permissions and Features** → her permission için "Request Advanced Access"
- [ ] Tüm 5 alanı doldur
- [ ] Submit
- [ ] **5-15 gün bekleyiş** (genelde 7-10 gün)
- [ ] Email gelir: onay veya red

#### 5.5.5 — Red durumunda
- [ ] Red sebebini OKUDU → eksiği gidert
- [ ] **Tekrar başvur** (1-2 kez normal, 5+ kez ban riski)
- [ ] Meta Community Forum'da benzer red sebeplerine bak

---

## ✅ AŞAMA 6 — System User Token (HAFTA 2-3, ~30 dakika)

OAuth user token 60 gün sonra **expire** eder. Production'da **System User token** kullan — kalıcı (never expires).

### 6.1 — System User oluştur
- [ ] **Business Settings → Users → System Users → Add**
- [ ] **Name:** `HalDeFiyat Backend`
- [ ] **Role:** Admin (Employee da olur ama Admin daha esnek)

### 6.2 — Asset assignment
- [ ] System User'ı seç → **Add Assets**
- [ ] **Pages:** HalDeFiyat → Full control
- [ ] **Instagram Accounts:** HalDeFiyat IG → Full control
- [ ] **Apps:** HalDeFiyat Otomasyon → Full control

### 6.3 — Token generate
- [ ] System User → **Generate New Token**
- [ ] **App:** HalDeFiyat Otomasyon seç
- [ ] **Token expiration:** **Never** ← (60-day option seçme)
- [ ] **Permissions** (App Review'da onaylananları seç):
  - pages_show_list, pages_read_engagement, pages_manage_posts
  - instagram_basic, instagram_content_publish
  - (DM permissions onaylanırsa ekle)
- [ ] **Generate**
- [ ] Token görünür → **HEMEN KOPYALA** (1 kez gösterir)

### 6.4 — Token'ı sakla
- [ ] **Password manager**'a kaydet (1Password, Bitwarden vs.)
- [ ] **VPS backend/.env'e ekle:** (sonra, kod hazır olunca)
  ```
  META_SYSTEM_USER_TOKEN=EAAxxxxxxxx...
  META_APP_ID=123456789
  META_APP_SECRET=xxxxxxxxxxxx
  FACEBOOK_PAGE_ID=987654321
  INSTAGRAM_BUSINESS_ID=17841234567890
  ```
- [ ] Bu .env değerlerinin **DB site_settings**'e de yazılması gerekecek (admin panel UI için, ileride)

---

## ✅ AŞAMA 7 — Google Cloud + YouTube Data API (HAFTA 2-3, ~1 saat)

### 7.1 — Google Cloud Project
- [ ] `console.cloud.google.com` → giriş (info@vistaseeds.com.tr)
- [ ] **New Project**:
  - **Project name:** `haldefiyat-youtube`
  - **Organization:** vistaseeds.com.tr (Workspace varsa) veya **No organization**
- [ ] Project ID not et: `haldefiyat-youtube-XXXXX`

### 7.2 — YouTube Data API v3 enable
- [ ] **APIs & Services → Library**
- [ ] Search: "YouTube Data API v3" → **Enable**
- [ ] Quota görünür: 10,000 unit/day default

**Quota bilgisi:**
- `videos.insert` (upload) = **1,600 unit**
- `videos.update` = 50 unit
- `playlistItems.insert` = 50 unit
- `comments.insert` = 50 unit
- Default 10k quota → ~6 video upload/gün
- Daha fazlası için: **APIs & Services → Quotas → "Request quota increase"** — gerekçe + use case yaz, 1-2 hafta süre

### 7.3 — OAuth consent screen (KRİTİK)
- [ ] **APIs & Services → OAuth consent screen**
- [ ] **User type:**
  - **Internal** (sadece Workspace üyeleri) — eğer vistaseeds.com.tr Workspace ise
  - **External** (herkese açık) — değilse seç
- [ ] **App information:**
  - App name: `HalDeFiyat`
  - User support email: `info@vistaseeds.com.tr`
  - App logo: 120x120 PNG (Aşama 0.2 logo)
- [ ] **App domain:**
  - Application home page: `https://haldefiyat.com`
  - Privacy policy: `https://haldefiyat.com/gizlilik-politikasi`
  - Terms of service: `https://haldefiyat.com/kullanim-kosullari`
- [ ] **Authorized domains:** `haldefiyat.com`
- [ ] **Developer contact:** info@vistaseeds.com.tr

### 7.4 — Scopes ekle
- [ ] **Add or remove scopes**
- [ ] Seç:
  - `https://www.googleapis.com/auth/youtube.upload` (video upload)
  - `https://www.googleapis.com/auth/youtube` (channel manage)
  - `https://www.googleapis.com/auth/youtube.force-ssl` (sensitive — Google review ister)

### 7.5 — Test users (Production öncesi)
- [ ] Test users:
  - `info@vistaseeds.com.tr`
  - `orhanguzell@gmail.com`
- [ ] Save and continue

### 7.6 — App'i Production'a al (YouTube için ŞART)
- [ ] OAuth consent screen → **Publish App**
- [ ] **Sensitive scopes** kullanıyorsan → **Google verification başvurusu** otomatik açılır
  - Google sana **video kayıt** ister (kullanım gösterimi)
  - **Domain ownership** doğrulama (Search Console üzerinden — haldefiyat.com için Google Search Console'a doğrulanmış olmalı)
  - 4-6 hafta süre (Meta'dan uzun)
- [ ] Veya **Verification waived** seçeneği — sadece Test users çalışır, 100 user limit (başlangıç için yeter)

### 7.7 — OAuth Credentials oluştur
- [ ] **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
- [ ] **Application type:** **Web application**
- [ ] **Name:** HalDeFiyat YouTube OAuth
- [ ] **Authorized JavaScript origins:**
  - `https://haldefiyat.com`
  - `http://localhost:3033` (dev)
- [ ] **Authorized redirect URIs:**
  - `https://haldefiyat.com/api/v1/admin/youtube/oauth/callback`
  - `http://localhost:8091/api/v1/admin/youtube/oauth/callback`
- [ ] **Create**
- [ ] Görünür: **Client ID** ve **Client Secret** — KOPYALA, password manager'a kaydet

### 7.8 — İlk refresh token al (one-time auth flow)
Backend hazır olunca yapılır. Akış:
1. Admin paneli → "YouTube'a bağlan" butonu
2. OAuth URL'ye yönlendir (`accounts.google.com/o/oauth2/v2/auth?...`)
3. `offline access` parametresiyle authorize et → consent screen
4. Google → redirect_uri'ya `code` parametresiyle döner
5. Backend code'u token endpoint'e POST eder
6. Yanıt: `access_token` (1 saat) + `refresh_token` (kalıcı, sakla)
7. `refresh_token` .env'e: `YOUTUBE_REFRESH_TOKEN=1//04...`

---

## ✅ AŞAMA 8 — Backend entegrasyonu (HAFTA 3-4, kod)

### 8.1 — Modül mimarisi
```
packages/shared-backend/modules/social/
├── facebook/
│   ├── client.ts          (Graph API HTTP wrapper)
│   ├── publishPost.ts     (text + image to Page feed)
│   └── env.ts
├── instagram/
│   ├── client.ts
│   ├── publishPost.ts     (image + caption)
│   ├── publishCarousel.ts (2-10 medya)
│   ├── publishReel.ts     (video + caption)
│   └── env.ts
├── youtube/
│   ├── client.ts          (googleapis SDK)
│   ├── uploadVideo.ts     (mp4 + metadata)
│   ├── createPlaylist.ts
│   └── env.ts
├── chatbot/
│   ├── ig-dm-handler.ts   (webhook receiver)
│   ├── responses.ts       (kural tabanlı + GPT yanıt)
│   └── webhook-verify.ts  (Meta signature verify)
├── orchestrator.ts        (multi-platform broadcast)
├── audit.ts               (social_posts log table)
└── index.ts
```

### 8.2 — DB tablosu
- [ ] `hf_social_posts`:
  ```sql
  CREATE TABLE hf_social_posts (
    id CHAR(36) PRIMARY KEY,
    platform ENUM('facebook','instagram','youtube') NOT NULL,
    type ENUM('feed','reel','story','video') NOT NULL,
    caption TEXT,
    media_url VARCHAR(500),
    scheduled_at DATETIME(3),
    posted_at DATETIME(3),
    external_post_id VARCHAR(255),  -- FB/IG/YT'de döndürülen ID
    status ENUM('draft','scheduled','posted','failed') NOT NULL DEFAULT 'draft',
    error_message TEXT,
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    KEY hf_social_posts_status_scheduled_idx (status, scheduled_at)
  );
  ```
- [ ] Seed SQL: `backend/src/db/seed/sql/034_social_posts_schema.sql`
- [ ] ⚠️ ALTER TABLE yasak (lokalde) — yeni kolon olursa 034'e ekle, fresh seed et

### 8.3 — Admin panel
- [ ] `/admin/social/` modülü:
  - `compose/` — yeni post (caption + medya + multi-platform select + schedule)
  - `scheduled/` — bekleyen postlar (cron'la yayınlanacak)
  - `history/` — geçmiş postlar (external_post_id + analytics)
- [ ] RTK Query endpoints: createPost, schedulePost, cancelScheduled, listHistory

### 8.4 — Cron / scheduler
- [ ] `backend/src/cron.ts` → yeni job:
  ```ts
  { name: "social-publisher", schedule: "*/5 * * * *", handler: publishScheduledPosts }
  ```
- [ ] Her 5 dakikada bir `status='scheduled' AND scheduled_at <= NOW()` postları yayınla

### 8.5 — Webhook (DM chatbot için)
- [ ] Public endpoint: `POST /api/v1/social/webhook/instagram`
- [ ] Meta'ya verifyToken + signature ile doğrula
- [ ] Gelen mesaj → DB log + responses.ts ile auto-reply

---

## ⚠️ YAYGIN HATALAR VE TUZAKLAR (Meta App Review odaklı)

### Süreç tuzakları
1. **Business Verification atlamak** — App Review başvurusu otomatik red. Önce 4.5'i bitir.
2. **App'i Live mode'a almamak** — Development mode'da sadece test users görür. Live: Settings → App Status → toggle
3. **Privacy policy / Terms broken** — Meta reviewer URL'leri açar, 404/500 → red
4. **Test user verme** — Reviewer test edemezse red. Admin paneline test account ekle.
5. **Çakışan permission istemek** — Aynı use case için 5 permission isteme. Use case'leri ayır.

### Domain Verification tuzakları
1. **DNS TXT yanlış lokasyona ekleme** — `@` (root) olmalı, `send` veya `mail` değil
2. **TTL çok uzun** — propagation 24 saat alabilir; 3600 önerilir
3. **Birden çok TXT** — Resend SPF + Meta verification ayrı TXT olabilir (sorun yok, ayrı kayıt)

### YouTube quota tuzakları
1. **videos.insert** = 1,600 unit (en pahalı). Günde 6 upload max default
2. **search.list** = 100 unit. Aşırı kullanma, cache et
3. **Token refresh hatası** — refresh_token 6 ay kullanılmazsa expire eder. Otomatik cron ile haftada 1 refresh trigger et

### IG Business tuzakları
1. **Personal account API erişimi yok** — Business veya Creator'a çevir
2. **Page'siz Instagram** — IG Business olsa bile FB Page'e bağlı değilse Graph API yok
3. **Carousel max 10 medya** — daha fazla istersen bölme
4. **Story API instagram_content_publish'te yok** — sadece feed post, reel, carousel. Story manuel veya 3rd party tool (Buffer, Later)

### Genel güvenlik
1. **Access token'ı repo'ya commit etme** — .env gitignore'da olmalı
2. **Token rotation** — System User token kalıcı ama yine de 6 ayda bir yenile (security best practice)
3. **Webhook signature verify** — Meta'dan gelen webhook'ları **mutlaka** `x-hub-signature-256` ile doğrula

---

## 📋 Hazırlanması gereken DOSYALAR (özet)

| Dosya | Format | Kullanım |
|---|---|---|
| Vergi Levhası | PDF (4-8MB) | Business Verification |
| Ticaret Sicil Gazetesi | PDF | Business Verification |
| İmza Sirküleri | PDF | Business Verification |
| Adres belgesi (kira / fatura) | PDF | Business Verification |
| TC Kimlik (ön+arka) | JPG | Business Verification |
| Selfie + kimlik | JPG | Business Verification |
| Logo | 800x800 PNG transparent | FB/IG/YT profil |
| App Icon | 1024x1024 PNG solid bg | Meta App + Google Cloud |
| FB cover | 1640x856 PNG/JPG | FB Page kapak |
| IG square | 1080x1080 | İlk IG post |
| YT banner | 2560x1440 | YouTube channel |
| YT watermark | 150x150 transparent | YouTube video köşesi |
| Screencast (Meta) | MP4, 3-5dk, 1080p | App Review başvuru |
| Screencast (Google) | MP4, 2-4dk, 1080p | OAuth verification |

---

## 🎯 KONTROL NOKTALARI (her hafta sonu)

### Hafta 1 sonu
- [ ] 3 sosyal hesap açık ve dolu (bio, foto, 5+ post)
- [ ] Business Manager kurulu, Page+IG bağlı
- [ ] Domain verification ✅
- [ ] Business Verification başvurusu yapılmış (bekleyiş)

### Hafta 2 sonu
- [ ] Business Verification onayı geldi
- [ ] Meta Developer App oluşturuldu
- [ ] App Review başvurusu yapıldı (en az 2 permission için)
- [ ] Google Cloud project + YouTube API enabled
- [ ] OAuth credentials hazır

### Hafta 3 sonu
- [ ] Meta App Review onayı (en az pages_manage_posts + instagram_content_publish)
- [ ] System User token alındı, .env'e işlendi
- [ ] YouTube OAuth refresh token alındı
- [ ] Backend modülleri yazılmaya başlandı

### Hafta 4 sonu
- [ ] İlk otomatik post canlıda (FB veya IG)
- [ ] Admin panel /admin/social/compose çalışıyor
- [ ] Audit log (hf_social_posts) veri topluyor
- [ ] Cron scheduler aktif

---

## 🔗 Faydalı linkler

- Meta for Developers: https://developers.facebook.com
- Meta Business Suite: https://business.facebook.com
- Meta App Review Docs: https://developers.facebook.com/docs/app-review
- Instagram Graph API Docs: https://developers.facebook.com/docs/instagram-api
- YouTube Data API v3 Docs: https://developers.google.com/youtube/v3
- Google Cloud Console: https://console.cloud.google.com
- Google OAuth Playground: https://developers.google.com/oauthplayground (test için)
- Meta Graph API Explorer: https://developers.facebook.com/tools/explorer (test için)

---

## 📌 Notlar

- `info@vistaseeds.com.tr` **Workspace mi?** Eğer değilse YouTube + Google Cloud için yeni Google hesabı ya da Workspace açılması gerekecek (200 TL/ay) — ileride `info@haldefiyat.com` profesyonel adres.
- **Atakan'ı tüm hesaplara Admin/Manager olarak ekle** — tek noktadan bağımlılığı kır
- **Password manager kullan** — bu kadar token, secret, password'ün her birini hatırlaman imkansız. 1Password / Bitwarden öner.
- **2FA mutlaka aktif et** — FB, IG, YouTube, Google Cloud, Meta Business hepsi için. Telefon kaybedersen backup codes da sakla.
- **DM chatbot 24-saat penceresi kuralı** — Meta IG DM'lere "uninstructed" mesaj atmaya izin vermez. Kullanıcı önce mesaj atmalı, sen 24 saat içinde cevaplayabilirsin. Aksi halde sadece "message tags" ile (sınırlı kategoriler) atılır.
- **YouTube monetization (ileri vade)** — 1000+ abone + 4000 izlenme saati + telefon doğrulama. İlk amaç değil ama uzun vadede gelir kapısı.

---

## ⏰ Tahmini toplam süre

| Aşama | Süre | Cinsi |
|---|---|---|
| Hesap kurulumları (FB, IG, YT) | 3 saat | Manuel |
| Business Manager + Domain | 1 saat | Manuel |
| Business Verification başvuru | 30 dk + 7-14 gün | Bekleyiş |
| Meta App + App Review | 2 saat + 7-15 gün | Bekleyiş |
| Google Cloud + YouTube API | 1 saat | Manuel |
| Google OAuth verification (opsiyonel) | 1 saat + 4-6 hafta | Bekleyiş (gerekirse) |
| Backend modülleri | 20-40 saat | Geliştirme |
| Test + ilk canlı post | 4-8 saat | Manuel |

**Toplam pratik süre:** ~4 hafta (gerçek çalışma günü)
**Toplam takvim süresi:** ~6-8 hafta (bekleyişler dahil)

---

## ✅ Bu checklist'i kullanırken

1. Her aşamayı sırayla tamamla — atlama
2. Her checkbox'ı işaretleyerek ilerle (kaydını tut)
3. Red durumunda **sebep email'ini saklamayı unutma** — düzeltme için referans
4. Token + secret'ları **HEMEN** password manager'a kaydet, ekrandan kaybolmadan
5. Sorun çıkarsa: Meta Community, Stack Overflow, official docs — bu sırayla bak
