# Google Ads Setup — Kalan İşler

**Oluşturulma:** 2026-05-26
**Bağlam:** Vista Seeds Ads hesabı altında "Haldefiyat - Arama - Trafik" kampanyası yayına çıktı (₺150/gün, etkin). Aşağıdaki işler kampanya kurulumu sırasında ortaya çıktı, sonradan tamamlanacak.

---

## Kampanya Bilgileri (kayıt için)

| Alan | Değer |
|------|-------|
| Ads hesabı | Vista Seeds (702-033-4476) |
| Hesap sahibi | orhanguzell@gmail.com |
| Ödeme | Atakan (atakan07sahin@gmail.com — yönetici kullanıcı) |
| Kampanya adı | Haldefiyat - Arama - Trafik |
| Tür | Arama (Search) + Maksimum Tıklama |
| Bütçe | ₺150/gün (~4500 TL/ay) |
| Hedef bölge | Türkiye |
| Final URL | https://haldefiyat.com |
| Conversion tag ID | **AW-18007572524** (Vista Seeds → haldefiyat için) |
| GA4 mülk | 538246354 — VistaSeeds (haldefiyat için ayrı yapılacak, aşağıda) |

---

## 🔴 KRITIK — Hemen Yapılacak

### 0. SMTP mail teslimi — Resend.com setup ✅ TAMAMLANDI 2026-05-26

Eski Gmail relay (info@vistaseeds.com.tr) DKIM/SPF uyumsuzluğu sebebiyle Gmail spam'e atıyordu — mail gönderilse bile alıcılar göremiyordu (newsletter, fiyat alarmı sessizce kaybolurdu).

**Çözüm:** Resend.com kuruldu, haldefiyat.com için DNS authentication tamam:
- [x] Resend hesabı + domain ekle (region: sa-east-1)
- [x] Turhost DNS zone editor: 4 kayıt eklendi
  - TXT `resend._domainkey` → DKIM
  - MX `send` → feedback-smtp.sa-east-1.amazonses.com (priority 10)
  - TXT `send` → SPF (v=spf1 include:amazonses.com ~all)
  - TXT `_dmarc` → DMARC (v=DMARC1; p=none;)
- [x] DNS propagation doğrulandı (dig 8.8.8.8 ile)
- [x] Resend domain "Verified" badge
- [x] API key alındı (`re_VB5SYZgW_...`)
- [x] VPS `backend/.env` güncellendi (SMTP_HOST=smtp.resend.com)
- [x] VPS DB `site_settings` SMTP kayıtları güncellendi (7 key)
- [x] `pm2 reload hal-backend --update-env`
- [x] Test mail gönderildi (admin endpoint + env-based), **ikisi de Gmail Inbox'a düştü** (Spam değil)

**Sender:** `HaldeFiyat <noreply@haldefiyat.com>`
**Borç:** Resend region sa-east-1 → eu-west-1 değiştirilebilir (latency); şu an mail için kritik değil.

### 1. Conversion Tag'i haldefiyat.com'a yükle ✅ TAMAMLANDI 2026-05-26
- [x] `frontend/src/components/seo/Analytics.tsx`'e `GoogleAdsConversion` component eklendi
- [x] `frontend/src/lib/site-settings.ts` `AnalyticsConfig`'e `adsConversionId` alanı eklendi
- [x] `frontend/src/app/layout.tsx` `<Analytics>` çağrısına prop geçildi
- [x] DB `site_settings.google_ads_conversion_id = "AW-18007572524"` eklendi
- [x] Build + VPS deploy + `pm2 reload hal-frontend`
- [x] Canlı doğrulama: `curl https://haldefiyat.com/ | grep AW-18007572524` → 2 match (Script src + config) ✅
- [ ] Google Ads → Araçlar → Etiketler → "Tekrar test et" → yeşil tik bekle (Google bot 24-48 saatte tarar)

### 2. Bereketfide tag kalıntılarını temizle ✅ TAMAMLANDI 2026-05-26
- [x] `frontend/src/lib/site-settings.ts:271` hardcoded `DEFAULT_GA4_ID = "G-YHLL9WK7ML"` fallback'ı kaldırıldı (null'a düşür)
- [x] DB `site_settings.ga4_measurement_id` boşaltıldı (G-YHLL9WK7ML silindi)
- [x] DB `site_settings.gtm_container_id` boşaltıldı (GTM-K3WDGHX5 silindi)
- [x] Canlı doğrulama: `curl https://haldefiyat.com/ | grep -E "G-YHLL9WK7ML|GTM-K3WDGHX5"` → 0 match ✅
- [ ] (Borç) `google_ads_id = "941-057-6390"` ve `ga4_property_id = "538279658"` orphan settings, kod okumuyor — temizlenebilir veya bırakılabilir

### 3. Haldefiyat için ayrı GA4 property aç
**Yapılacak:**
- [ ] GA4 Admin → "Property oluştur" → Ad: "Haldefiyat"
- [ ] Veri akışı ekle: `haldefiyat.com`
- [ ] Yeni measurement ID alı not et: `G-XXXXXXXX` (buraya yaz: `______________`)
- [ ] haldefiyat.com'a sadece bu yeni tag'i yükle (önce eskileri sil)
- [ ] Vista Seeds Ads → Araçlar → Bağlantılı hesaplar → Haldefiyat GA4'ü de bağla

### 4. Conversion event'lerini tanımla
**Sorun:** Şu an "Maksimum Tıklama" optimizasyonu yapılıyor — conversion data yok. İlerde "Maksimum Dönüşüm" stratejisine geçmek için event'ler lazım.

**Yapılacak (GA4 + Google Ads):**
- [ ] `newsletter_signup` — `/uyarilar` form submit
- [ ] `pro_upgrade` — `/pro` checkout başarılı
- [ ] `embed_inquiry` — `/embed` form submit
- [ ] `price_alert_created` — fiyat alarmı kayıt
- [ ] Backend `success` response sonrası `window.gtag('event', 'newsletter_signup')` tetikle
- [ ] Google Ads → Araçlar → Dönüşümler → her event'i conversion action olarak ekle

---

## 🟡 ÖNEMLİ — 1 Hafta İçinde

### 5. social.tarvista.com (ekosistem-sosyal-medya) HalDeFiyat tenant kaydı 🟡 KISMEN TAMAMLANDI 2026-05-27

**Repo (`ekosistem-sosyal-medya`):**
- [x] `backend/src/db/seed/sql/205_social_projects.seed.sql` HalDeFiyat tenant kaydı temizlendi (commit `f7482e8`)
  - `gtm_container_id`: `GTM-K3WDGHX5` → `NULL` (Bereketfide kalıntısı silindi)
  - `ga4_measurement_id`: `G-YHLL9WK7ML` → `NULL` (yeni GA4 property açılınca eklenecek)
  - `ga4_property_id`: `538279658` → `NULL`
  - `google_ads_customer_id`: `941-057-6390` (yarım kurulu hesap) → `702-033-4476` (Vista Seeds Ads — kampanya gerçekte burada yayında)
- [x] GitHub push: `ec07987..f7482e8 main → main`
- [ ] **VPS sync** (sosial.tarvista.com): SSH key sorunu nedeniyle ertelendi. Yapılacak:
  ```bash
  ssh-add ~/.ssh/id_ed25519
  ssh guezelwebdesign
  cd /var/www/sosial.tarvista.com
  git pull origin main
  bun run db:seed        # ON DUPLICATE KEY UPDATE ile haldefiyat kaydını günceller
  pm2 reload ekosistem-backend
  ```

**Sosyal medya hesap bağlantıları (footer/siteSettings sync):**
- [ ] HalDeFiyat footer'da FB/IG bağlantılarını ekle (FB Page + IG hesabı açıldı, link'ler eklenmeli):
  - Facebook: `https://facebook.com/haldefiyat` (Page ID 61590611212775)
  - Instagram: `https://instagram.com/hal.de.fiyat`
  - YouTube: (henüz açılmadı)
- [ ] `frontend/src/components/layout/Footer.tsx` veya DB `site_settings.social_*` güncelle
- [ ] Open Graph tag'lerinde de bu bağlantıların doğru olduğundan emin ol (`layout.tsx` metadata)

### 5b. Sosyal medya hesap kurulumları + Meta API otomasyon

Bu konunun detaylı checklist'i: **[`SOCIAL-API-SETUP-CHECKLIST.md`](./SOCIAL-API-SETUP-CHECKLIST.md)**

**Bugünkü durum (2026-05-27):**
- [x] Facebook Page açıldı — `Haldefiyat`, kategori "Haber ve medya sitesi", Hakkında bölümü dolu, kapak banner ve profil resmi yüklü
- [x] Instagram Business hesabı açıldı — `hal.de.fiyat`, Professional/Business modu, ilk post atıldı (Tarımda Doğru Karar banner)
- [ ] IG ↔ FB Page bağlantısı — Meta rate limit ("hesap kısıtlandı") nedeniyle ertelendi, yarın taze IP/session ile
- [ ] Meta Business Manager — "Bereket Fide" BM mevcut ama Atakan kontrolünde; yeni BM ("Tarım Ekosistemi" veya HalDeFiyat'a özel) açılacak yarın
- [ ] Domain Verification (haldefiyat.com TXT, Turhost)
- [ ] Business Verification başvuru (vergi levhası + ticaret sicil + imza sirküleri)
- [ ] Meta Developer App ("Ekosistem Sosyal Otomasyon") + App Review
- [ ] System User Token üret → ekosistem-sosyal-medya `social_accounts` tablosuna yaz
- [ ] YouTube Brand Channel (Meta'dan ayrı, paralel açılabilir)
- [ ] Test post (sosial.tarvista.com'dan Haldefiyat FB Page'e otomatik)

### 6. Kampanyayı izle ve optimize et (2026-06-02 civarı)

**⏰ Hatırlatma:** 1 hafta sonra (≈ 2026-06-02) PDF rapor hazırlanacak. Kullanıcı talebi 2026-05-26'da geldi, kampanya verisi henüz olmadığı için ertelendi.

**📄 Baseline raporu:** [`docs/reports/baseline-2026-05-26.pdf`](docs/reports/baseline-2026-05-26.pdf) — kampanya öncesi 9 günlük trafik referansı (18-26 May, 37,158 istek, 30,476 insan, 3,611 unique IP). Kampanya sonrası karşılaştırma bu PDF'e göre yapılacak. Üretici script: `/tmp/haldefiyat-baseline-report.py`.

**O zaman bakılacaklar (Google Ads paneli):**
- [ ] Gösterim sayısı (günde 500-2000 normal)
- [ ] Tıklama (günde 30-80 hedef)
- [ ] CTR (%3-5 iyi, %1-2 zayıf)
- [ ] Ort. TBM (1.5-3 TL beklenir)
- [ ] Tıklama başı maliyet ve günlük harcama trendi
- [ ] Düşük performanslı anahtar kelimeleri çıkar
- [ ] Yüksek performanslı sorgular için yeni anahtar kelime varyantları ekle
- [ ] En çok tıklanan sitelink / extension

**Site analitiği (PDF rapor için veri kaynakları):**
- [ ] VPS nginx log: `/var/log/nginx/haldefiyat.access.log*` (rotation 7 gün, daha eski için audit/DB)
- [ ] Backend audit modülü verisi (HTTP istek, kullanıcı sessions)
- [ ] hf_etl_runs (ETL aktivitesi)
- [ ] Google Ads paneli verisi (campaign export CSV)
- [ ] Baseline (kampanya öncesi 18-26 May) vs Kampanya sonrası karşılaştırma

**Rapor içeriği:**
- Toplam ziyaret, unique IP, bot vs insan
- Top sayfa, top referrer, mobile/desktop
- Google Ads kaynaklı trafik (`gclid` parametreli istekler)
- Conversion event (tag yüklendi mi? newsletter signup oluyor mu?)
- Maliyet/tıklama karşılaştırması

### 7. Ek uzantılar — Structured Snippets
- [ ] Account-level değil, **haldefiyat kampanyası özelinde** ekle (Bereketfide'in reklamlarında görünmesin)
- [ ] Başlık: "Kapsamı"
- [ ] Değerler: Antalya, İstanbul, İzmir, Ankara, Bursa, Adana, Mersin, Konya
- Detaylar bu dosyanın altında "Structured Snippet İçerikleri" bölümünde

---

## 🟢 İSTEĞE BAĞLI — İlerde Düşün

### 8. Bereketfide ve Haldefiyat için ayrı Ads hesapları
Şu an her ikisi de Vista Seeds Ads altında çalışıyor. İleride büyürse:
- [ ] MCC (Manager Account) kur — yeni temiz Gmail ile (info@vistaseeds.com.tr ile değil, çünkü Google izin vermedi)
- [ ] hal de fiyat Ads hesabını (941-057-6390) tamamla ve MCC'ye bağla
- [ ] Bereketfide Ads hesabı aç, MCC'ye bağla
- [ ] Vista Seeds Ads hesabını da MCC'ye link et
- [ ] Consolidated billing — Atakan'ın kartı MCC seviyesinde

### 9. PMax kampanyası (conversion datası olunca)
Şu an conversion yok, PMax çalışmaz. 2-3 ay düzenli conversion akışı sonrası dene.

---

## Structured Snippet İçerikleri (Adım 7 için hazır metin)

**Başlık türü:** Kapsamı (Coverage)

**Değerler (her biri max 25 karakter):**
```
1.  Antalya              (7)
2.  İstanbul             (8)
3.  İzmir                (5)
4.  Ankara               (6)
5.  Bursa                (5)
6.  Adana                (5)
7.  Mersin               (6)
8.  Konya                (5)
9.  Kocaeli              (7)
10. Trabzon              (7)
```

**Alternatif:** Başlık türü "Türler" — Veri tipleri:
```
1.  Toptan sebze fiyatı
2.  Toptan meyve fiyatı
3.  Hal fiyat arşivi
4.  Şehir karşılaştırma
5.  Fiyat alarmı
6.  Endeks analizi
7.  API erişimi
8.  Yıllık rapor
```

---

## Notlar

- Google Ads veriyle ilgili dökümantasyon: `docs/google-ads-setup.md` (gerekirse açılacak)
- Tag yükleme sonrası VPS deploy akışı her zaman: local fix → scp → `bun run build` → `pm2 reload hal-frontend --update-env`
- VPS path: `/var/www/tarim-dijital-ekosistem/projects/hal-fiyatlari/`
- Kampanya değişiklikleri Atakan'a yansır (faturalandırma).
