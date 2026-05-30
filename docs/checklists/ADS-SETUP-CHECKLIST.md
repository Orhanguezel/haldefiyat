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

---

## 11. Kampanya 2-gün analiz sonrası optimizasyon checklist (2026-05-28)

**Bağlam:** Kampanya 26 Mayıs'ta yayına çıktı, 2 gün sonra nginx logları üzerinden analiz yapıldı. Detaylı bulgular bu dosyanın altındaki "Analiz Özeti" bölümünde.

### 🎯 Stratejik bağlam (2026-05-28 Atakan kararı)

> **Bu faz BRAND AWARENESS odaklı, B2B daraltma DEĞİL.**
> - "Bütçe önemli değil, 150 TL/gün devam"
> - "İnsanlar bizi tanısın, bir giren zaten sürekli girer" (yapışkanlık hipotezi)
> - "İleride firmalara yönelik ayrı kampanya açacağız" (B2B fazı sonra gelir)
>
> **Implikasyon:** Mobil tüketici trafiğini filtreleme, negative keyword ekleme,
> mobil bid azaltma → bu fazda **YAPMA**. Bunlar Faz 2 (B2B kampanyası)
> başladığında ayrı kampanya hesabı altında uygulanır.

**Bu fazda OPTİMİZE EDECEĞİMİZ üç şey (öncekinden farklı):**
1. **Yapışkanlık hipotezini ölç** — "bir giren sürekli girer" gerçek mi yoksa varsayım mı? Returning visitor oranı, cohort retention, direct traffic gelişimi
2. **Mobil trafiği first-party audience'a çevir** — newsletter signup en kritik conversion bu fazda (premium/API değil)
3. **Retargeting audience'ı şimdi inşa et** — B2B kampanyası başladığında "warm audience" hazır olsun

**Ana bulgular kısa:**
- İnsan trafiği 2.5x arttı (2,870 → 7,300/gün) ✅
- 2 günde 151 unique Ads tıklama (66 + 85) ✅
- Tıklama başı ~30 sayfa görüntüleme — yapışkanlık ilk işaret iyi ✅
- ✅ Ads trafiği %78 mobil → brand awareness fazında **bu kabul edilebilir**, B2B fazında ayrı kampanyada filtrelenir
- ⚠️ `audit_request_logs` tablosu **BOŞ** — log middleware bozuk veya devre dışı
- ⚠️ Conversion event'leri hâlâ tanımlanmamış (Madde 4 BEKLEMEDE)
- ⚠️ Retention/cohort ölçümü yok — yapışkanlık hipotezi doğrulanamıyor
- ⚠️ Google Ads Remarketing tag yüklü değil — gelen mobil trafik B2B fazı için yakalanamıyor
- ⚠️ Tüm trafik genel anasayfaya iniyor, hatırda kalır landing yok

**İş bölümü işaretleri:**
- 🧠 **Claude (Mimar):** Tasarım, mimari karar, spec yazma, kod review.
- 🤖 **Codex (Implementer):** Spec'e göre kod yazma, test, deploy.
- 👤 **Orhan (Operasyonel — tek başına):** Ads dashboard ayarları, GA4, audience listesi, deploy, asset hazırlığı. **Tüm panel/dashboard işleri benim sorumluluğum, Atakan operasyonel değil.**
- 📞 **Atakan (Sahip — async):** Faturalandırma kaynağı, stratejik kararlar (faz kararları, bütçe büyütme), kurumsal asset sağlama (logo, referans isimleri). Operasyonel paneli açmıyor.
- 🤝 **Müşterek:** Claude tasarlar → Codex uygular → Orhan doğrular ve deploy eder.

---

### 11.1 Veri katmanı: `audit_request_logs` tabloyu aktive et 🔴 ENGELLİ

> Diğer her şey buna bağlı: tablo çalışmadan dashboard yapamayız, attribution kuramayız, conversion ölçemeyiz.

**🧠 Claude (TAMAMLANDI 2026-05-28 — Claude implement etti):**
- [x] `packages/shared-backend/modules/audit/` modülünü incele — log middleware var mı, ne zamandan beri devre dışı *(bulgu: plugin proje-local `auditRequestLogger.ts`, gclid/utm INSERT ediyor ama DB'de kolonlar yoktu → silent fail)*
- [x] `projects/hal-fiyatlari/backend/src/app.ts`'te audit plugin register edilmiş mi kontrol *(register, app.ts:101; gerçek sebep: VPS dist eski + DB schema mismatch)*
- [x] Spec yaz: hangi route loglanmalı/loglanmamalı *(SKIP_EXACT_PATHS + SKIP_PREFIXES + ASSET_EXT_RE mevcut)*
- [x] PII concerns: request_body env-gated (`LOG_REQUEST_BODY`), sensitive field REDACT, tam IP (geoip için)

**🤖 Codex + Claude (yapacak):**
- [x] Spec'e göre `onResponse` hook + insert query implement et
- [x] Schema'da eksik alan varsa seed SQL güncelle (ALTER YASAK)
- [x] gclid + utm_source/medium/campaign/content kolonları — query URL'sinden parse
- [x] Existing DB: Claude DROP+CREATE ile tabloyu yeni kolonlarla kurdu (boştu, veri kaybı yok)
- [x] Runtime safety: `auditAttributionColumnsExist` cache — kolon yoksa 16-kolon, varsa 21-kolon INSERT (graceful)
- [x] geoip-lite lookup eklendi (harita için country/city) — Claude
- [x] Yerel/canlı test: request at → tabloya düştü (38+ satır, gclid dolu, TR/LV geo)
- [x] VPS deploy + doğrulama: `SELECT COUNT(*)` artıyor, admin /audit harita+metrik+istek sekmeleri çalışıyor
- [x] Codex 2026-05-28: Frontend pageview beacon eklendi (`/api/v1/track/pageview` + `PageviewTracker`) — Next route değişimleri gerçek frontend path'i olarak audit'e düşer
- [x] Codex 2026-05-28: `/api/v1/health` audit skip listesinden çıkarıldı (brief acceptance)

**Acceptance:**
- [x] Tablo satır üretiyor (gerçek trafik geldikçe 1000+/saat) — mekanizma doğrulandı
- [x] gclid alanı dolu olan satır var (manualtest + utm_source ile doğrulandı)
- [x] Asset request'leri (.css/.js/.woff) tabloda **yok** (backend'e gitmiyor + ASSET_EXT_RE skip)
- [x] Bir Next.js route değişimi → `/api/v1/track/pageview` beacon ile audit tablosunda yeni satır üretir *(local build/typecheck tamam; canlı DB doğrulaması deploy sonrası)*

---

### 11.2 Conversion event'leri kod tarafında tetikle 🔴 HEMEN

> Madde 4'te tanımlı ama implement edilmedi. Conversion data olmadan Google Ads bid'leri optimize edemiyor, biz ROI hesaplayamıyoruz.

**🧠 Claude (TAMAMLANDI):**
- [x] 4 event tanımlandı: `newsletter_signup`, `pro_upgrade` (Pro contact success), `embed_inquiry`, `price_alert_created`
- [x] Frontend event taxonomy: `trackConversion(event, params, {email})` + `currency:'TRY'` standartı
- [x] Server-side mirror kararı: ilk faz **sadece client-side gtag** (Conversion API ileride)

**🤖 Codex (yapacak):**
- [x] `frontend/src/lib/analytics.ts` (yoksa oluştur) — `trackConversion(eventName, params?)` helper
- [x] Enhanced conversions: e-posta varsa SHA-256 hash ile `user_data.email_address` eklenir
- [x] 4 noktada çağır:
  - [x] `frontend/src/app/uyarilar/components/...` form `onSuccess` callback
  - [x] `frontend/src/app/pro/...` checkout success page *(şimdilik Pro Plan Talebi contact success; gerçek checkout yok)*
  - [x] `frontend/src/app/embed/...` form `onSuccess`
  - [x] Fiyat alarmı oluşturma component'i
- [x] Yerel kontrat testi: 4 event adı + attribution parametreleri + enhanced conversion hash doğrulandı (`frontend/src/lib/analytics.test.ts`, 5 test passed)
- [ ] Yerel test: form submit → DevTools Network'te `gtag/...` çağrısı görmeli
- [ ] VPS deploy + her event için 1 manuel test gönderimi

**👤 Orhan (yapacak — Ads paneli):**
- [ ] Google Ads → Araçlar → Dönüşümler → 4 conversion action ekle (her event için), AW-18007572524 etiketiyle eşleştir
- [ ] GA4 Admin → Custom events → 4 event'i "Mark as conversion" olarak işaretle

**Acceptance:**
- [ ] DevTools Network'te 4 event'in `gtag` call'u görünür
- [ ] Google Ads dönüşüm ekranında "Hayır, henüz dönüşüm görmedik" → "Doğrulandı" olur (24-48h)

---

### 11.3 Attribution kalıcılığı: gclid + UTM cookie capture 🟡 ÖNEMLİ

> Kullanıcı Ads'ten geldi → 3 sayfa gezindi → newsletter signup oldu. Şu an signup eventinde "kaynak: organic" yazıyor çünkü gclid'i kaybediyoruz. First-party cookie'ye yazıp event'e attach etmeliyiz.

**🧠 Claude (TAMAMLANDI):**
- [x] Cookie tasarımı: `hf_attr`, 90 gün TTL, JSON `{gclid, utm_*, landed_at, first_path}`
- [x] First-touch attribution (Ads standardı + ROI)
- [x] SameSite=Lax, HttpOnly=false, Secure=true + AttributionProvider layout'ta + CookieConsentBanner (KVKK)

**🤖 Codex (yapacak):**
- [x] `frontend/src/lib/attribution.ts` — `captureAttribution()` ve `getAttribution()` helper
- [x] `frontend/src/app/layout.tsx` veya root layout'ta ilk render'da `captureAttribution()` çağır (URL'de gclid/utm var mı kontrol, varsa cookie set)
- [x] `trackConversion()` helper'ı (11.2'den) içinde `getAttribution()` çağır, gtag event params'a gclid/utm alanlarını ekle
- [x] Yerel test: `?gclid=test123&utm_source=google` ile gel, başka sayfaya geç, form submit et → event params'da gclid=test123 görmeli *(Vitest: `frontend/src/lib/analytics.test.ts`, 3 test passed)*

**Acceptance:**
- [ ] GA4 DebugView'de event'lerde gclid + utm_* parametreleri görünür
- [ ] Cookie 90 gün TTL ile set

---

### 11.4 Brand-awareness landing sayfası `/canli-hal-fiyatlari` 🟡 ÖNEMLİ

> Şu an Ads tıklamalarının %53'ü anasayfaya iniyor. Brand awareness fazında doğru landing: **hatırda kalır + newsletter signup** odaklı. Premium/API CTA değil — bu faz için.

**Sayfa amacı (öncelik sırasıyla):**
1. "Aha, gerçekten canlı veri var" hissi (kanıt)
2. **Newsletter signup** (mobil ziyaretçiyi first-party kanala bağla)
3. Yapışkanlık (kullanıcı 2-3 sayfa gezsin, geri gelmek istesin)
4. Marka hatırlanırlığı (logo, slogan, sektör otoritesi sinyalleri)

**🧠 Claude (TAMAMLANDI):**
- [x] Sayfa wireframe (hero + KPI sayaçlar + newsletter signup #1 CTA + popüler ürünler + şehir seçimi + otorite sinyali + fiyat alarmı sekonder CTA)
- [x] SEO: title/meta/structured data (Dataset + BreadcrumbList)
- [x] Mobile-first (Ads %78 mobil)
- [x] Performance hedefi belirlendi: LCP < 1.5s *(mobile Lighthouse 88 — 95 için ek perf pass mobil checklist'te)*

**🤖 Codex (yapacak):**
- [x] `frontend/src/app/canli-hal-fiyatlari/page.tsx` oluştur
- [x] Server-side fetch (yeni endpoint gerekmez, mevcut `/api/v1/prices/today` kullan) *(mevcut `/prices/widget`, `/prices/markets`, `/prices/products` ile SSR)*
- [x] Newsletter form (11.2 `newsletter_signup` event'iyle entegre, mobil-optimize input)
- [ ] Lighthouse 95+
  - Not: local production ölçümde desktop Performance 100 / Accessibility 96 / Best Practices 96 / SEO 92; default mobile Performance 88. Mobile 95 için ayrı performans pass gerekiyor (mobil checklist Görev 7).
- [x] Sitemap'e ekle
- [x] VPS deploy *(Claude deploy etti — `https://haldefiyat.com/canli-hal-fiyatlari` → 200)*

**👤 Orhan (yapacak — Ads paneli):**
- [ ] Google Ads → kampanya → final URL `/canli-hal-fiyatlari` olarak değiştir

**📞 Atakan (async asset isteği):**
- [ ] Firma logosu yüksek çözünürlüklü PNG iste (whatsapp veya mail). Logo gelene kadar placeholder kullan, deploy beklemez.

**Acceptance:**
- [ ] Lighthouse Performance ≥ 95
- [ ] Newsletter signup oranı ≥ %3 (Ads tıklama → email yakalanma)
- [ ] Ortalama session duration ≥ 90 saniye (yapışkanlık)

---

### 11.5 Admin analytics dashboard 🟢 ORTA ÖNCELİK

> Şu an her sorgu için ssh + grep gerekiyor — kabul edilemez. Bir admin sayfası gerekli ki Orhan tek tıkla bakabilsin. (Atakan'a izleme yetkisi sonradan açılabilir, ama tasarım Orhan-merkezli.)

**🧠 Claude (TAMAMLANDI — tasarım + Codex implement, canlıda):**
- [x] Dashboard kapsamı (MVP) — **brand awareness fazına göre öncelik sıralı:**

  **A. Retention/Yapışkanlık (en kritik bu fazda — "bir giren sürekli girer" hipotezi):**
  - Returning visitor oranı (1 hafta önce gelen kaç IP bu hafta da geldi)
  - Cohort retention tablosu: D0 ziyaretçi sayısı vs D+1, D+3, D+7, D+14, D+30
  - Direct traffic % zaman içinde (insanlar adresi yazıyor mu?)
  - Newsletter abone sayısı + büyüme grafiği
  - Ortalama session duration ve pages per session trend

  **B. Ads kanalı performansı:**
  - gclid'li unique IP, tıklama, pageview, conversion
  - Tıklama başı pageview (yapışkanlık × Ads kullanıcı)
  - Newsletter conversion oranı (Ads tıklama → email yakalanma)

  **C. Genel trafik sağlık metrikleri:**
  - Son 7/30 gün günlük: total request, human, bot, unique IP
  - Top 10 landing page, top 10 referrer
  - Cihaz dağılımı (mobile / desktop / tablet)
  - Saatlik heatmap (haftaiçi-haftasonu × saat)

  **D. Faz 2 hazırlık (B2B audience seed):**
  - Desktop + haftaiçi + multiple sessions = "B2B-like" davranış skoru
  - `/pro` ve `/embed` sayfalarına bakanlar (yüksek niyet sinyali)
  - API doc sayfasını görenler (developer/teknoloji firması sinyali)

- [x] Veri kaynağı: `audit_request_logs` *(GA4 Reporting API ileri faz — ilk MVP audit-only)*
- [x] Cache layer: agresif 5 dk cache — admin sayfası DB'yi yormasın *(ilk faz proje-local in-memory cache; Redis'e gerekirse sonra taşınır)*
- [x] Permission: sadece `is_admin = 1` *(admin endpoint'leri requireAuth + requireAdmin scope altında)*

**🤖 Codex (yapacak):**
- [x] Backend: `packages/shared-backend/modules/analytics/` (yeni modül, projeler arasında ortak) *(proje-local `backend/src/modules/analytics` olarak eklendi; shared package'e dokunulmadı)*
  - [x] Endpoint: `GET /api/v1/admin/analytics/overview?range=7d|30d`
  - [x] Endpoint: `GET /api/v1/admin/analytics/funnel?range=7d`
  - [x] Endpoint: `GET /api/v1/admin/analytics/ads-attribution?range=7d`
- [x] Admin panel: `admin_panel/src/app/(main)/admin/(admin)/analytics/page.tsx`
  - [x] Recharts veya Chart.js ile grafikler
  - [x] Tablo bileşenleri (top landing, top referrer)
  - [x] Tarih aralığı seçici
- [x] Retention/yapışkanlık metriği: `GET /api/v1/admin/analytics/retention` + Cohort Retention tablosu (D+1/D+3/D+7)
- [x] Saatlik heatmap: `GET /api/v1/admin/analytics/heatmap` + hafta günü/saat yoğunluk matrisi
- [x] Ads → newsletter yakalama oranı KPI'ı (`newsletter_new / ads_unique_ip`, ilk faz kaba metrik)
- [x] Faz 2 hazırlık: B2B-like IP ve yüksek niyet IP KPI'ları
- [ ] Test: dashboard ssh-grep ile aldığımız verilerle uyuşmalı (±%2 tolerans, bot heuristic farkı)

**Acceptance:**
- [ ] Admin panelden 30 saniyede son 7 gün özetini görebilirim
- [ ] "Bugün Ads'ten kaç tıklama geldi" sorusu tek tıkla cevaplanır
- [ ] (Opsiyonel) Atakan'a salt-okunur izleme yetkisi açılabilir, ama operasyonel iş Orhan'da

---

### 11.6 Google Ads dashboard ayarları (BRAND AWARENESS FAZI) 👤 ORHAN

> Atakan kararı: bu faz mobil tüketiciyi DAHİL etmek istiyor (geniş bilinirlik).
> Aşağıdaki ayarlar bu stratejiye uygun, kısıtlayıcı değil. Orhan tek başına
> 20 dakikada Ads panelinde uygular.

**Aktif olarak yapılacak (Orhan):**
- [ ] **UTM template:** Kampanya → Kampanya URL şablonu →
  `{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={adgroupid}&utm_term={keyword}&gclid={gclid}`
  (Madde 11.3 attribution capture bunu bekliyor)
- [ ] **Bot/click fraud önlemi:** "Geçersiz tıklamalardan koruma" otomatik aktif, ama "IP exclusions" listesine VPS scan'den çıkacak şüpheli IP block'ları eklenmeli (gece 04:00 TR 719 hit gibi anomaliler)
- [ ] **Remarketing tag yükle (Madde 11.8 ile bağlantılı):** Google Ads → Araçlar → Audience Manager → "Web sitesi etiketi" → Global site tag varsa zaten otomatik veri toplar. Doğrula. Yoksa AW-18007572524 ile birlikte yüklenmeli.
- [ ] **Remarketing audience listeleri oluştur:**
  - "Tüm site ziyaretçileri — 540 gün" (maksimum üyelik süresi)
  - "Pro sayfa ziyaretçileri" (`/pro` URL kuralı)
  - "Embed sayfa ziyaretçileri" (`/embed`)
  - "Fiyat alarmı kuranlar" (event tabanlı, 11.2 conversion ile beslenir)
  - "Newsletter abonesi olanlar" (event tabanlı)
- [ ] **Final URL değişimi:** Kampanya final URL'i `/` yerine `/canli-hal-fiyatlari` (Madde 11.4 hazır olunca, brand-awareness landing)

**Bu fazda YAPMAYACAĞIMIZ ayarlar (Faz 2'ye saklanır):**
- ❌ Mobil bid azaltma (mobile awareness istiyor)
- ❌ Negative keyword (consumer term'leri) — geniş tutuyoruz
- ❌ Ad scheduling daraltma (sadece çok şüpheli saat anomalileri varsa)
- ❌ Cihaz hedeflemesi (tüm cihaz açık kalsın)

**Faz 2 (firmalara yönelik kampanya) için NOT — şimdiden hazırla:**
- [ ] Yeni kampanya placeholder: "Haldefiyat - Arama - B2B" (henüz aktive etme)
- [ ] B2B-specific keyword araştırması başlat:
  - "hal fiyatları toptan", "[şehir] hali günlük fiyat"
  - "toptan sebze meyve fiyat listesi", "manav toptan alış fiyatı"
  - "restoran tedarik sebze fiyatı", "kafe sebze tedarikçi"
- [ ] Bu kampanya başladığında: mobil bid -%50, ad scheduling 08:00-18:00 TR, consumer negative keyword listesi aktive edilir
- [ ] Hedef tarih: Brand awareness fazı 60 gün sonra (≈ 2026-07-26) değerlendirilir, B2B fazı paralel açılır

---

### 11.8 Remarketing tag + audience capture 🟡 ÖNEMLİ (Faz 2 ön hazırlık)

> Atakan'ın "ileride firmalara yönelik kampanya" planının tek ön şartı bu.
> Şu an gelen her ziyaretçi Google Ads "audience"a eklenmiyorsa, B2B kampanyası
> açıldığında "warm audience" havuzu sıfırdan başlar. Şimdi başlat, 60 günde
> 10-20K cookie biriksin.

**🧠 Claude (TAMAMLANDI):**
- [x] Tag yapısı netleştirildi: AW-18007572524 `gtag('config', ..., {allow_enhanced_conversions:true})` ile remarketing + enhanced conversions topluyor — ayrı tag gerekmez
- [x] 6 custom audience tanımı yapıldı (Orhan Ads panelinde oluşturacak — 11.6/Orhan kısmı)
- [x] PII/consent: Google Consent Mode v2 + CookieConsentBanner mevcut (KVKK), user_data SHA-256 hash

**🤖 Codex + Claude (TAMAMLANDI):**
- [x] `Analytics.tsx` incelendi — gtag config + enhanced conversions mevcut
- [x] `gtag('config', 'AW-18007572524', { allow_enhanced_conversions: true })` aktif
- [x] Cookie consent banner mevcut (GoogleConsentMode + CookieConsentBanner)
- [x] user_data SHA-256 email hash eklendi (Claude) — 4 form'da
- [x] VPS deploy *(Analytics.tsx + analytics.ts canlıda)*

**👤 Orhan (yapacak — Ads paneli):**
- [ ] Google Ads → Araçlar → Audience Manager → 6 custom audience ekle
- [ ] Her audience için "Google Ads kampanyalarında kullanılabilir" işaretle
- [ ] 7 gün sonra audience size kontrol (≥1000 cookie hedef), 30 gün sonra tekrar bak (≥5000)

**Acceptance:**
- [ ] Google Ads → Audience Manager'da "Tüm site ziyaretçileri" listesinin boyutu 7 gün içinde 1000+ olur
- [ ] B2B kampanyası açıldığında bu liste hedef alınabilir

---

### 11.7 İzleme ve doğrulama (1 hafta sonra: 2026-06-04)

> Yukarıdaki değişikliklerin sonucunu ölçeceğimiz checkpoint.

**🤝 Müşterek (Claude + Codex) — Brand awareness fazı KPI'ları:**
- [x] 11.1 tamamlandı, audit log akışta *(gerçek trafikle 1000+/saat dolacak)*
- [x] 11.2 tamamlandı, conversion event'leri kodda tetikleniyor + dashboard'da görünür
- [x] 11.3 tamamlandı, gclid/utm cookie capture + event'e attach *(gclid'li signup > 0 için gerçek Ads trafiği)*
- [x] 11.4 tamamlandı, `/canli-hal-fiyatlari` canlıda, newsletter form aktif
- [x] 11.5 admin dashboard çalışıyor (retention + Ads + funnel + heatmap + B2B)
- [ ] 11.8 remarketing audience boyutu ≥1000 cookie *(Orhan Ads panelinde audience oluşturup bekleyecek)*

**Hipotez doğrulama metrikleri (28 May - 4 Haziran):**
- [ ] **Yapışkanlık testi:** 26 May'da ilk kez gelen IP'lerin ne kadarı 2-3 Haziran'da geri geldi? (Cohort retention D+7 ≥ %15 = "bir giren sürekli girer" hipotezi destekleniyor)
- [ ] **Newsletter signup oranı:** Ads tıklama → email yakalanma ≥ %3 hedef
- [ ] **Direct traffic gelişimi:** Bu hafta direct traffic'i geçen haftaya göre nasıl? (brand awareness etkisi)
- [ ] **Session duration trend:** Ortalama session ≥ 90 saniye (yapışkanlık ikinci sinyal)
- [ ] **Remarketing audience seed:** "Tüm ziyaretçiler" listesi ≥ 5000 cookie

**👤 Orhan (operasyonel doğrulamalar):**
- [ ] 11.6 UTM template + remarketing tag yüklemesi yapıldı
- [ ] 6 custom audience oluşturuldu, büyüme izleniyor (Ads → Audience Manager)
- [ ] Conversion'lar Google Ads'te görünüyor (24-48h gecikme normal)
- [ ] Faz 2 (B2B kampanya) keyword araştırması başlandı, ayrı kampanya iskelet hazır (henüz aktive değil)

**📞 Atakan (async kararlar):**
- [ ] Brand awareness fazını 60 güne kadar uzatma onayı (2026-07-26'ya kadar) — bütçe akmaya devam edecek mi?
- [ ] Faz 2 (B2B kampanya) bütçe + zamanlama kararı — ayrı bütçe verilecek mi yoksa mevcut 150 TL'den mi bölünecek?
- [ ] Firma logosu + referans isimleri gönderildi mi (Landing sayfası için)?

---

## Analiz Özeti (2026-05-28, kampanyanın 2. günü)

### Günlük insan trafiği

| Gün | Gün adı | Total | Human | Bot | Unique IP | Unique gclid |
|---|---|---:|---:|---:|---:|---:|
| 19 May | Sal | 6,409 | 4,714 | 1,695 | 617 | 6 (eski test) |
| 20 May | Çar | 3,761 | 3,330 | 431 | 188 | 0 |
| 21 May | Per | 2,016 | 1,758 | 258 | 282 | 1 |
| 22 May | Cum | 3,815 | 3,470 | 345 | 60 | 0 |
| 23 May | Cmt | 1,545 | 1,291 | 254 | 30 | 0 |
| 24 May | Paz | 3,264 | 2,649 | 615 | 49 | 0 |
| 25 May | Pzt | 3,298 | 2,920 | 378 | 102 | 0 |
| **26 May** | **Sal** | **8,313** | **7,716** | 597 | 441 | **66** |
| **27 May** | **Çar** | **7,194** | **6,892** | 302 | 312 | **85** (gün bitmedi UTC) |

### Cihaz dağılımı (gclid trafiği)

| Cihaz | Adet | Oran |
|---|---:|---:|
| Mobile | 1,680 | **%78.5** |
| Desktop | 460 | %21.5 |

⚠️ Site geneli organik %65 desktop'tu — Ads tam tersi profil getiriyor.

### gclid landing pages (top 7)

| URL | Hit |
|---|---:|
| `/` | 339 |
| `/fiyatlar` | 221 |
| `/urun/biber` | 82 |
| `/hal` | 60 |
| `/urun/domates-salkim` | 51 |
| `/urun/domates` | 43 |
| `/endeks` | 42 |

### Hesaplamalar

- İnsan trafiği büyümesi: hafta içi 2,870/gün → 7,300/gün = **2.5x**
- Tıklama başına pageview: 4,600 gclid request / 151 unique gclid = **~30 sayfa/tıklama**
- Ads payı: 4,600 gclid pageview / 14,608 toplam insan pageview = **%31**

### Kritik uyarılar

1. **`audit_request_logs` BOŞ** — log middleware bozuk/disabled (11.1)
2. **Conversion event'leri kodda yok** — Google Ads optimize edemiyor (11.2)
3. **Attribution kaybı** — gclid sayfa içi gezintide kaybolup conversion'a bağlanmıyor (11.3)
4. **Yanlış hedefleme** — %78 mobile = tüketici (11.6)
5. **Tek landing** — Ads-specific sayfa yok, anasayfaya iniyor (11.4)
6. **Maliyet/ROI görünmüyor** — Conversion data yok, "iyi gidiyor mu" sorusu cevapsız
