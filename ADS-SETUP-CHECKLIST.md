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

### 5. social.tarvista.com'da haldefiyat bağlantılarını güncelle
**Sorun:** Ekosistem sosyal medya yönetim panelinde haldefiyat'ın bağlantıları eski / yanlış olabilir.

**Yapılacak:**
- [ ] `social.tarvista.com` admin paneline gir
- [ ] Haldefiyat bölümünü aç, **mevcut bağlantıları listele**:
  - Website URL
  - Twitter/X
  - Instagram
  - Facebook
  - LinkedIn
  - YouTube
- [ ] Aşağıdaki **olması gereken** bağlantılarla karşılaştır (haldefiyat.com'daki footer ve siteSettings'ten doğrulanacak):

  **Olması gereken kanonik bağlantılar:**
  - Website: `https://haldefiyat.com`
  - (Sosyal medya hesapları varsa repo'daki `frontend/src/components/layout/Footer.tsx` veya `siteSettings`'ten al)

- [ ] Eksik / yanlış olanları güncelle
- [ ] Open Graph tag'lerinde de aynı bağlantıların geçerli olduğundan emin ol (`layout.tsx` metadata)

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
