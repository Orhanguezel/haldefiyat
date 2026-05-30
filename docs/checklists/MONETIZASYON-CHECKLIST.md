# Monetizasyon & Mükemmelleştirme Checklist

> **Durum:** BEKLEMEDE — kod yazılmıyor, sadece referans planı.
> **Tarih:** 2026-05-28 (karar günü)
> **Aktivasyon:** Atakan ile "başlayalım" mutabakatı + Adım 0 tamamlanması sonrası.

---

## Rol & Gelir Paylaşım Çerçevesi

- **Atakan:** Proje sahibi — sektörel itibar, 250+ ziraat mühendisi ekibi, hal müdürü ağı, kurumsal güven sinyali.
- **Yazılımcı (Orhan):** Teknik yürütme — site, backend, ETL, admin paneli.
- **Gelir paylaşımı:** AdSense + bireysel premium + API abonelik geliri yazılımcıya. Kurumsal anlaşmalar ve sponsorluk modeli ayrı görüşülecek.
- **Şu anki faz:** Mükemmelleştirme. Monetizasyon kapalı.
- **Aktivasyon mantığı:** Tarih yerine **trafik/içerik milestone** tetikleyicileri (aşağıda).

---

## Adım 0 — Anlaşma (Kod Yazmadan Önce, Bir Sayfa Yeterli)

- [ ] Atakan ile yazılı mutabakat (WhatsApp mesajı veya tek sayfa e-posta yeterli)
  - [ ] Site/domain/sunucu sahipliği kimin adına? (büyük ihtimal Atakan firması)
  - [ ] Hangi gelir kimin: AdSense + bireysel premium + API abonelik = yazılımcı
  - [ ] Atakan firmasının kendi reklamı: bedava mı, intercompany fiyat mı?
  - [ ] Kurumsal/enterprise anlaşmalar nasıl paylaşılır?
  - [ ] Sponsorluk modeli (Atakan'ın hal müdürü ağı üzerinden satış) nasıl paylaşılır?
  - [ ] Yazılımcı ayrılırsa: kaynak kodu lisansı, devir süreci, son bakım yükümlülüğü

> **Not:** Bu adım atlanmamalı. Gelir akmaya başladıktan sonra konuşmak 5x daha zor.

---

## Adım 1 — İçerik Motoru (En Yüksek ROI)

Atakan'ın 250+ ziraat mühendisi havuzunu içerik üretimine kanalize et. Aylık 5 mühendis × 4 yazı = 20 yazı hedefi.

- [ ] Yazar profili sistemi (DB tablosu: ad, foto, ünvan, uzmanlık, sosyal medya, kısa bio)
- [ ] Yazar profil sayfası (`/yazar/{slug}`) — yazılar listesi, bio
- [ ] Makale CMS (admin panelinde editör akışı: taslak → onay → yayın)
- [ ] Makale şablonu (zengin metin + otomatik fiyat-grafik embed bileşeni)
- [ ] Kategori/etiket sistemi (ürün bazlı, sezonsal, bölgesel)
- [ ] Structured data — Article + Person (yazar) + speakable
- [ ] Atakan ile pilot 5 mühendis seçimi + onboarding
- [ ] İlk 4 hafta için içerik takvimi (sezonsal: don zararı, ekim/hasat trendleri, hal analizleri)

---

## Adım 2 — Veri Kapsama Tamamlama

Şu an 22+ ETL kaynak var. Hedef: 40+ il, her ilde en az 1 hal. Resmi siteleri olmayan halleri Atakan'ın ağıyla kapsa.

- [ ] Manuel veri yükleme paneli (admin)
  - [ ] PDF / Excel / CSV upload + otomatik parse
  - [ ] Yapıştır-parse-et arayüzü (WhatsApp'tan kopyala-yapıştır akışı)
  - [ ] Doğrulama: anormal fiyat uyarıları, dün-bugün delta kontrolü
  - [ ] Onay öncesi önizleme (kim yükledi, hangi kaynak)
- [ ] Eksik il/hal envanteri çıkar — Atakan'a "hangi hal müdürlerini tanıyorsun" listesi sun
- [ ] Resmi olmayan veri kaynakları için iletişim protokolü (kim, ne sıklıkla, hangi format)
- [ ] Veri kaynağı şeffaflığı: her ürün sayfasında "kaynak: X hali, Y yöntemi"

---

## Adım 3 — SEO & Teknik Temeller

- [ ] Lighthouse 95+ (Performance, SEO, Accessibility, Best Practices) tüm public sayfalar
- [ ] Core Web Vitals (LCP, INP, CLS) yeşil
- [ ] Structured data audit: Article, Product, BreadcrumbList, FAQPage, Organization, Person
- [ ] Sitemap kapsayıcılık (tüm ürün × hal × tarih sayfaları)
- [ ] llms.txt eklenmesi (AI crawler'lar için)
- [ ] robots.txt + AI crawler izinleri (GPTBot, ClaudeBot, PerplexityBot vb.)
- [ ] Open Graph + Twitter Card audit (mevcut var, kapsam kontrol)
- [ ] Hız: image optimization, font subset, edge caching nginx

---

## Adım 4 — Newsletter Altyapısı

Düşük maliyetli, B2B kitle doğrulama kanalı. Resend (haldefiyat.com DKIM kurulu) zaten hazır.

- [ ] Abone formu — anasayfa hero altı + her makale altı + footer
- [ ] Çift onay (double opt-in)
- [ ] Segment: genel abone / premium bekleme listesi / sektörel (toptancı/manav/restoran)
- [ ] Haftalık şablon: 3 ürün fiyat özeti + 1 mühendis yazısı + 1 hal duyurusu/röportaj
- [ ] Otomatik gönderim cron (Pazartesi sabahı)
- [ ] Tracking: open rate, click rate, unsubscribe
- [ ] 12 aylık hedef: 5-10K abone

---

## Adım 5 — Otorite Sinyalleri

- [ ] Anasayfada Atakan firma logosu + tagline ("X yıllık tarım otoritesi")
- [ ] "250+ ziraat mühendisi ekibimiz" rozeti + ekip sayfası
- [ ] Hakkımızda sayfası güçlendirme (firma kimliği, vizyon, ekip)
- [ ] Basın/medya görselleri (varsa Atakan'dan al)
- [ ] Hal müdürü röportajları/demeçleri (sosyal kanıt)
- [ ] Kullanıcı testimonialleri (toptancı/manav demeçleri)

---

## Adım 6 — Para Kazanma Altyapısı (Sessiz Hazır, Açık Değil)

Feature flag arkasında kapalı geliştir. Tetikleyici eşiğine ulaşılınca 1 saatte açılır.

- [ ] Kullanıcı rolleri: `free` / `premium` / `api_user` / `admin`
- [ ] Premium feature gate sistemi (component + API level)
- [ ] Stripe veya Iyzico hesap kurulumu (entegre etme henüz)
- [ ] Fatura altyapısı (KDV, e-arşiv, abonelik faturası)
- [ ] API key yönetimi (kullanıcı kendi key'ini görür, regenerate edebilir)
- [ ] Rate-limit middleware (Redis sayaç, tier bazlı limit)
- [ ] Premium gate'lenecek özellikler (kapalı kod):
  - Geçmiş veri 90 gün üstü
  - Sınırsız fiyat uyarısı + Telegram
  - CSV/Excel export
  - Trend analizi makaleleri
  - Karşılaştırma raporları

---

## Adım 7 — Milestone Dashboard

Atakan + yazılımcı aynı sayıyı görmeli. Tartışma veri üstünden yürür.

- [ ] Admin'de "Monetizasyon Tetik" sayfası
  - DAU (gerçek insan, bot filtreli)
  - Aylık yayınlanan makale sayısı
  - Newsletter abone sayısı
  - Premium bekleme listesi
  - API çağrı hacmi (anonim toplam)
  - Tetik eşikleri renkli (kırmızı = uzak, sarı = yakın, yeşil = aktive et)

---

## Monetizasyon Tetik Tablosu

Hangi kanal ne zaman açılır:

| Milestone | Aktivasyon | Beklenen aylık gelir |
|---|---|---|
| 10K DAU + 50 kaliteli makale + 2K newsletter abone | Premium tier (149 TL) açılır | 50-150 abone × 149 = 7-22K TL |
| Premium 100 ödeyen + Atakan'dan 3 referans müşteri | API paid tier (Free/Pro/Business) | 3-10 müşteri × 599-2499 TL |
| 25K DAU + Google Ads kampanyası kapanmış | AdSense açılır (yan gelir) | RPM bazlı 3-8K TL |
| Premium 300 + 10K newsletter | Sponsorlu içerik açılır (mühendis yazısı sponsorluğu, hal duyurusu) | Atakan satar, paylaşım modeli |

---

## Yapmayacaklar (Bu Aşamada)

- AdSense yerleştirme — Google Ads kampanyası varken net zarar + otorite sinyalini kirletir
- Premium paywall'u şimdi açma — içerik motoru olgunlaşmadan dönüşüm yok
- Sponsorlu listeleme şimdi satma — Atakan'ın ağını ucuz yakmak olur, 6 ay sonra altın
- API'yi şimdi ücretlendirme — önce hacim verisi gerek
- Var olan ücretsiz özellikleri paywall arkasına alma — kullanıcı küstürme riski

---

## Bekleyen Karar Noktaları (Atakan ile Görüşülecek)

- Gelir paylaşım oranı (kurumsal + sponsorluk için)
- Sponsorluk satış süreci (kim satar, kim onaylar, fiyat tarifesi)
- Enterprise/custom anlaşmaların yetki + onay zinciri
- Atakan firmasının kendi reklam politikası (bedava banner mı, intercompany rate mi)
- İçerik onay zinciri (mühendis yazısı yayına çıkmadan kim okur, kim onaylar)

---

## Cross-References

- Aktif iş listesi: `KALAN-ISLER.md`
- Google Ads kurulum: `ADS-SETUP-CHECKLIST.md`
- Sosyal medya API: `SOCIAL-API-SETUP-CHECKLIST.md`
- Ekosistem geneli plan: `EKOSISTEM-PLAN.md`
- Workspace gelir önceliği: `/home/orhan/Documents/Projeler/BUSINESS-STRATEGY.md` (paspas pilot)
