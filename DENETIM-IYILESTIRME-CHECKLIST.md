# Denetim & İyileştirme Çeklisti — haldefiyat.com

**Tarih:** 2026-06-10
**Kaynaklar:** [REPO-DENETIM-RAPORU.md](./REPO-DENETIM-RAPORU.md) (4 fazlı teknik denetim) + site/log/gelir değerlendirmesi (2026-06-10 dış inceleme)
**Yürütme modeli:** Claude Opus tasarlar/review eder → Codex implement eder → Orhan operasyon (VPS/karar) yapar.

## Rol Etiketleri
- **[CLAUDE]** — mimari karar, tasarım, spec/brief yazımı, kod review, riskli refactor gözetimi
- **[CODEX]** — kod implementasyonu (brief'e göre), test yazımı
- **[ORHAN]** — VPS operasyonu, secret/credential, GitHub ayarları, iş kararları, Atakan ile mutabakat

## Çalışma Kuralları (her görevde geçerli)
- Deploy SADECE git ile: local commit+push → VPS `git fetch && git reset --hard origin/main` → build → backend `pm2 reload`, frontend/admin `pm2 RESTART` (rsync/scp YASAK)
- `ALTER TABLE` YASAK (local + VPS) — şema değişikliği seed SQL'de yapılır (`ALTER USER` bu yasağa girmez, izinli)
- Codex paralel çakışma riski: Codex bir fazda çalışırken Claude/insan aynı dosyalara dokunmaz; deploy sonrası VPS'te `grep` ile doğrula
- Her faz bitiminde: typecheck + (varsa) test + canlıda smoke test

---

## FAZ 0 — GÜVENLİK TEMİZLİĞİ (KRİTİK — her şeyden önce, sıra önemli)

> Sebep: Repo GitHub'da PUBLIC ve canlı JWT secret + MySQL şifresi 4 takip edilen dosyada + git geçmişinde. Önce rotasyon (asıl koruma), sonra dosya/geçmiş temizliği. Sıra ters olursa eski secret'lar temizlenmiş ama hâlâ geçerli olur.

### 0.1 Secret Rotasyonu **[ORHAN]** (Claude komutları hazırlar, Orhan VPS'te çalıştırır)
- [ ] Yeni JWT secret üret: `openssl rand -hex 32`
- [ ] Yeni MySQL şifresi üret ve uygula: `ALTER USER 'haldefiyat'@'localhost' IDENTIFIED BY '<yeni>'; FLUSH PRIVILEGES;`
- [ ] VPS `backend/.env` güncelle (JWT_SECRET + DB_PASS), `pm2 reload hal-backend`
- [ ] Doğrula: eski JWT ile üretilen token 401 dönüyor; site + admin panel + ETL health çalışıyor
- [ ] Not: aktif admin oturumları düşer — planlı saatte yap (gece ETL öncesi/sonrası değil)
- ⚠️ Şifrede `!` gibi shell-özel karakterlerden kaçın; shell escape sorunları yaşatabiliyor

### 0.2 Repo Görünürlük Kararı **[ORHAN — KARAR]**
- [ ] Karar: repo private mı olsun, public mi kalsın? (Portfolyo amacı yoksa → private yap: GitHub → Settings → Change visibility)
- [ ] Private yapılsa bile 0.1 ve 0.3 ZORUNLU (secret'lar ifşa olmuş sayılır)

### 0.3 Dosyalardan Secret Temizliği **[CODEX]** (Claude review)
- [ ] `CLAUDE.md:139` — mysql komutundaki şifreyi `"$DB_PASS"` placeholder yap (env'den okunacak şekilde örnek güncelle)
- [ ] `CLAUDE.md:256-270` — JWT üretim script'indeki secret'ı `os.environ["JWT_SECRET"]` ile değiştir
- [ ] `OTURUM-BRIEF-OLCUM-FUNNEL.md:63` — aynı şekilde placeholder
- [ ] `backend/scripts/firm-contact-vision.py:97` — `pymysql.connect(... password=os.environ["DB_PASS"])`
- [ ] `backend/scripts/firm-phone-ocr.py:63` — aynı düzeltme
- [ ] Doğrula: `git grep -i "3af77dee\|Hal2026"` → 0 sonuç
- [ ] Commit + push (geçmiş temizliğinden ÖNCE working tree temiz olmalı)

### 0.4 Git Geçmişi Temizliği **[ORHAN]** (Claude adımları hazırlar)
- [ ] `git filter-repo --replace-text` (veya BFG) ile iki secret'ı tüm geçmişten sil
- [ ] Force push → GitHub
- [ ] VPS'te: `git fetch origin && git reset --hard origin/main` (force push sonrası zorunlu)
- [ ] Diğer clone'lar (Codex sandbox vb.) yeniden klonlanır
- [ ] Doğrula: `git log --all -S "3af77dee" --oneline` → boş
- [ ] GitHub Settings → Security → Secret scanning + Push protection AÇ

---

## FAZ 1 — KRİTİK TEKNİK DÜZELTMELER (güvenlik)

### 1.1 Frontend xlsx Upgrade **[CODEX]**
- [ ] `frontend/package.json` → `xlsx` ^0.18.5'ten 0.20.3+ (backend ile aynı CDN tgz kaynağı tercih)
- [ ] xlsx import eden akışları bul ve manuel test et (export mu, kullanıcı dosyası parse mı? — parse varsa öncelik yükselir)
- [ ] Kabul: `bun why xlsx` ≥0.20.2, build yeşil

### 1.2 CMS/Makale HTML Sanitizasyonu **[CLAUDE spec → CODEX]**
- [ ] `sanitize-html` (isomorphic) katmanı: ortak `sanitizeCmsHtml()` util
- [ ] `frontend/src/components/LegalPageContent.tsx:36` — sanitize sonrası render
- [ ] `frontend/src/app/[locale]/(public)/analiz/[slug]/page.tsx` — makale HTML'i sanitize
- [ ] Whitelist geniş tutulur (tablo, başlık, link, img) — mevcut içerik bozulmamalı; mevcut 3-5 custom page görsel diff ile kontrol
- [ ] Kabul: `<script>` içeren test içeriği render'da etkisiz

### 1.3 Güvenlik Başlıkları **[ORHAN doğrular → CODEX/ORHAN uygular]**
- [ ] Önce VPS nginx config'inde (sites-enabled/haldefiyat) mevcut header'ları kontrol et
- [ ] Eksikler nginx'e: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN` (embed widget route'u MUAF — `/embed` frame'lenebilir kalmalı!), `Strict-Transport-Security`, temel CSP (report-only ile başla)
- [ ] Kabul: securityheaders.com A-; /embed widget'ı 3. parti sitede hâlâ çalışıyor

### 1.4 ETL Sources Endpoint'ine Auth **[CODEX]**
- [ ] `backend/src/modules/hal-admin/index.ts:570-572` — `GET /hal/etl/sources`'a requireAuth+requireAdmin (önce frontend'in bu endpoint'i kullanmadığını grep ile doğrula)
- [ ] Kabul: anonim istek 401

### 1.5 Sentry Düzeni **[CODEX]**
- [ ] Frontend: `@sentry/nextjs` ya init et (instrumentation.ts + DSN env) ya da paketi kaldır — yarım durum kalmasın
- [ ] Backend: VPS .env'e `SENTRY_DSN` ekle **[ORHAN]**, test hatasının Sentry'de göründüğünü doğrula
- [ ] Kabul: bilinçli test exception'ı dashboard'da görünüyor

### 1.6 JWT TTL Kontrolü **[CLAUDE]**
- [ ] `packages/shared-backend` auth config'inde token TTL + refresh akışını incele, ≤24h değilse Orhan'a raporla (Bereketfide/VistaSeeds'i de etkiler — ortak karar)

---

## FAZ 2 — GÜVENLİK AĞI (test + CI; FAZ 5 refactor'larının ön şartı)

### 2.1 Backend Test Runner + Parser Fixture Testleri **[CLAUDE spec → CODEX]**
- [ ] `backend/package.json` → `"test": "bun test"`
- [ ] `backend/test/etl/fixtures/` — 3-5 aktif kaynağın gerçek HTML yanıtı (bir defalık canlıdan kaydet)
- [ ] Parser'ları `fetcher.ts`'ten export et (SADECE export ekle, davranış değişikliği YOK — büyük bölme Faz 5'te)
- [ ] Her fixture için: satır sayısı + örnek satır name/min/max/avg assert
- [ ] Hedef kaynaklar (yüksek hacimli): hal_gov_tr_ulusal, istanbul_ibb, antalya_merkez_antkomder, manisa_resmi, yalova_resmi
- [ ] Kabul: `bun test` yeşil, ≥5 parser fixture'lı

### 2.2 GitHub Actions CI **[CODEX]**
- [ ] `.github/workflows/ci.yml`: backend typecheck + test, frontend typecheck + lint + test
- [ ] PR'da zorunlu kapı (branch protection) **[ORHAN]**
- [ ] Kabul: kırmızı pipeline'da merge engelli

### 2.3 Parser Test Kapsamı Genişletme **[CODEX]** (2.1 sonrası, düşük öncelik)
- [ ] Aktif kaynakların ≥%80'i fixture'lı

---

## FAZ 3 — UX & İÇERİK TEMİZLİĞİ (dış değerlendirme bulguları — hızlı, görünür kazanımlar)

### 3.1 "Sayfa hazırlanıyor..." Kalıntısı **[CODEX]**
- [ ] `frontend/src/app/loading.tsx` — SSR HTML'in ilk metni olarak sızıyor; görsel skeleton'a çevir (metinsiz) veya kaldır
- [ ] Kabul: `curl https://haldefiyat.com | head` çıktısında "Sayfa hazırlanıyor" yok

### 3.2 Header "Yükleniyor..." → "Giriş Yap" **[CODEX]**
- [ ] `frontend/src/components/header/HeaderNavClient.tsx` — auth durumu belirsizken varsayılan "Giriş Yap" render et, hydration'da kullanıcıya göre güncelle
- [ ] Kabul: SSR HTML'de "Yükleniyor" metni yok

### 3.3 Ana Sayfa Çift Hero Temizliği **[CLAUDE tasarım kararı → CODEX]**
- [ ] Sorun: `app/[locale]/(public)/page.tsx:129-152` — `MobileHomeHero` (yeni) + eski `HeroSection` ("Türkiye Hal Fiyatları Tek Ekranda", `HeroSectionClient.tsx`) + ikinci özellik bloğu art arda render ediliyor
- [ ] Claude: hangi bölümler kalacak/birleşecek kararı (tek hero + tek ticker + tek CTA akışı; mobil %77 öncelikli)
- [ ] Codex: eski `HeroSection` ve mükerrer blokları kaldır/birleştir
- [ ] Kabul: tek hero, tek mesaj akışı; sayfa uzunluğu belirgin kısaldı; LCP iyileşti

### 3.4 Yazım/Veri Hataları **[CODEX]**
- [ ] `frontend/src/components/sections/FeaturesGrid.tsx` — "hallde" → "halde", "toptancı halı" → "toptancı hali" (halı = carpet!)
- [ ] "AVAKADO" → ürün adı normalizasyon sözlüğü: `backend/src/modules/etl/normalizer.ts` (60 satır) içine yazım düzeltme katmanı (AVAKADO→Avokado vb.) + DB'deki mevcut kaydın canonical düzeltmesi
- [ ] SSS şablon sızıntısı: "DOMATES (...) fiyatı neden değişir?" — `product-content.ts` / SSS üretiminde değişken interpolasyonunu düzelt, büyük harf ürün adını Title Case'e çevir
- [ ] Kabul: canlıda örnek ürün sayfalarında (domates, avokado) hata yok

### 3.5 "Tamamen Ücretsiz" Vaadinin Yeniden Çerçevelenmesi **[ORHAN/ATAKAN KARARI → CODEX]**
- [ ] Karar: "Tamamen Ücretsiz" → "Tüketiciler için her zaman ücretsiz" (B2B ücretlendirme kapısını açık bırakır)
- [ ] Onay sonrası: `FeaturesGrid.tsx` metni güncelle
- ⚠️ Bu, MONETIZASYON-CHECKLIST'teki "monetizasyon kapalı" kararıyla çelişmez — sadece gelecekteki vaadi koruma altına alır; yine de Atakan'a danış

---

## FAZ 4 — FUNNEL & GELİR HAZIRLIĞI

> Bağlam: günde ~118 ziyaretçi Ads ile satın alınıyor (~tekil trafiğin 1/4'ü), newsletter ~0 abone, gelir modeli yok. Funnel'ın sonu kurulmadan paralı trafik buharlaşıyor.

### 4.0 Ads Bütçe Kararı **[ORHAN/ATAKAN — KARAR, kod değil]**
- [ ] Dış değerlendirme önerisi: funnel kurulana kadar Ads'i durdur/minimuma indir
- ⚠️ ÇELİŞKİ: Mevcut strateji "brand awareness fazı, mobil tüketici trafiği DAHİL" (2026-05-28 Atakan kararı, ADS-SETUP-CHECKLIST). Bu çeklist tek taraflı değiştirmez — Atakan ile yeniden değerlendirme toplantısı yapılmalı. Karar ne olursa olsun 4.1-4.3 yapılmalı (organik trafik için de geçerli).

### 4.1 Newsletter Aktivasyonu **[CODEX — brief HAZIR]**
- [ ] Mevcut brief'i uygula: `docs/codex-briefs/newsletter-activation.md` (KRİTİK BUG: `POST /api/v1/newsletter/subscribe` 404 — formlar boşluğa POST atıyor)
- [ ] Local newsletter modülü (shared'a DOKUNMA), single opt-in, stateless HMAC unsubscribe, /abonelik sayfası
- [ ] Kabul: subscribe 200 dönüyor, abone DB'ye düşüyor, unsubscribe çalışıyor

### 4.2 Alarm Kaydını E-posta Zorunlu Yap **[CLAUDE spec → CODEX]**
- [ ] Fiyat alarmı kurarken e-posta zorunlu + otomatik newsletter aboneliği (KVKK: açık onay kutusu ayrı — pazarlama izni checkbox'ı, bkz. firma-pazarlama-kvkk-consent memory)
- [ ] Kabul: alarm kuran kullanıcı abone listesine düşüyor (izinliyse)

### 4.3 gclid Landing İyileştirmesi **[CODEX — mevcut Madde 11.4 ile birleşik]**
- [ ] Ads tıklamaları ana sayfa yerine `/canli-hal-fiyatlari` landing'ine (newsletter signup #1 CTA) — ADS-SETUP-CHECKLIST madde 11.4 zaten planlı
- [ ] Kabul: kampanya final URL güncellendi **[ORHAN]**, landing'de tek CTA

### 4.4 Haftalık Otomatik Bülten ("al/bekle sinyali" formatı) **[CLAUDE mimari → CODEX]**
- [ ] Format: endeks + en çok düşen/yükselen + market-hal makası ("Domates bu hafta %20 düştü")
- [ ] Mevcut digest+cron+Resend altyapısı üstüne içerik üretimi (weekly-report.ts verisi reuse; changePct anomali korumaları — cap %80 — geçerli)
- [ ] Kabul: cron haftalık bülteni üretip abonelere gönderiyor; içerik content-guard'dan geçiyor

### 4.5 "Market Makası" Haftalık İçerik Motoru **[CLAUDE tasarım → CODEX implement → ORHAN yayın]**
- [ ] `hf_retail_prices` (A101/BİM/CarrefourSA/Migros/Tarım Kredi) vs hal fiyatı karşılaştırma raporu — haftalık otomatik sayfa + sosyal medya görseli
- [ ] Dağıtım: ekosistem-sosyal-medya tek-poster kuralına uygun (hal-fiyatlari kendi twitter cron'u KAPALI kalır)
- [ ] Kabul: ilk Market Makası raporu yayında + X/Telegram paylaşımı

### 4.6 B2B Gelir Hazırlığı (monetizasyon AÇILMADAN ön hazırlık) **[ORHAN/ATAKAN KARARI]**
- ⚠️ MONETIZASYON-CHECKLIST kararı: monetizasyon KAPALI, aktivasyon tetiği 10K DAU + 50 makale + 2K abone. Dış değerlendirme daha erken B2B (API aboneliği ₺990/ay, Pro ₺199-399/ay, firma rozeti) öneriyor. Bu bir İŞ KARARI — Adım 0 (Atakan ile yazılı mutabakat) tamamlanmadan kod yazılmaz.
- [ ] Karar toplantısı: B2B API/Pro erken mi açılır, tetik mi beklenir?
- [ ] Karar "erken aç" ise: Claude fiyatlandırma sayfası + API tier spec'i hazırlar (API key tier altyapısı backend'de zaten var), Codex implement eder

---

## FAZ 5 — PERFORMANS & ALTYAPI

### 5.1 ISR Stratejisi (force-dynamic temizliği) **[CLAUDE plan → CODEX, dikkatli]**
- [ ] Envanter: `cookies()`/`headers()` okuyan sayfalar (bunlar dynamic kalmalı) — grep
- [ ] `app/layout.tsx:2`, `[locale]/layout.tsx:1`, `(public)/layout.tsx:1` → `force-dynamic` kaldır
- [ ] Fiyat sayfaları `revalidate = 600`, statik sayfalar (metodoloji/hakkımızda) 3600-86400
- [ ] `sitemap.ts` → `revalidate = 3600` (per-request canlı üretim + boş sitemap riski kalkar)
- [ ] Opsiyonel: ETL bitiminde frontend'e revalidate webhook (cron → `revalidatePath`) — tazelik anında
- [ ] Kabul: layout'larda force-dynamic 0; ETL sonrası fiyat tazeliği ≤15 dk; TTFB düşüşü ölçüldü
- ⚠️ Deploy sonrası `pm2 restart hal-frontend` (reload DEĞİL) + canlıda chunk hatası kontrolü

### 5.2 hf_etl_runs Retention Cron'u **[CODEX]**
- [ ] `backend/src/modules/etl/maintenance.ts` + `cron.ts`'e aylık job: 90+ gün eski kayıtları sil/arşivle
- [ ] Kabul: job log'da görünüyor, satır sayısı sabitleniyor

### 5.3 latestRecordedDate() Memoization **[CODEX]**
- [ ] `backend/src/modules/prices/repository.ts:26` — istek-içi cache (kısa TTL'li modül-level memo yeterli)
- [ ] Kabul: tek overview isteğinde 1 sorgu

### 5.4 Composite Index (fresh seed penceresine iliştir) **[CLAUDE seed SQL → ORHAN uygular]**
- [ ] `hf_price_history`: `(recordedDate, productId, marketId)` index'i seed SQL'e ekle — bir sonraki zorunlu fresh seed'de devreye girer (ALTER YASAK)

---

## FAZ 6 — REFACTOR & KALİTE (Faz 2 testleri yeşilken)

### 6.1 fetcher.ts Bölme (2.305 satır → parser registry) **[CLAUDE plan + review → CODEX]**
- [ ] `backend/src/modules/etl/parsers/<kaynak>.ts` — 30+ parser ayrı dosyalara
- [ ] `parseResponse()` 40 case'lik switch → registry map
- [ ] ÖN ŞART: Faz 2.1 parser testleri yeşil (refactor güvencesi)
- [ ] Kabul: fetcher.ts <400 satır; tüm testler yeşil; VPS'te bir tam ETL cycle hatasız
- ⚠️ En riskli görev — canlı ETL. Küçük PR'lar halinde (5-6 parser/PR), her PR sonrası ETL health kontrolü

### 6.2 Kullanılmayan Bağımlılıklar **[CODEX]**
- [ ] Backend: `argon2`, `fast-jwt`, `mnemonist`, `steed` kaldır (import yok — doğrulandı)
- [ ] Frontend: `zod` ^4 gerçekten kullanılmıyorsa kaldır
- [ ] Kabul: root'tan `bun install` + build + typecheck yeşil

### 6.3 SEO Page-Key Ayrıştırma **[CLAUDE spec → CODEX]**
- [ ] "firmalar" key'i 4 sayfada çakışıyor → `firmalar__list` / `firmalar__detail` / `firmalar__type` (hal_detay collision dersinin devamı; backend seo_pages seed'ine yeni key'ler)
- [ ] Kabul: 4 sayfa farklı title/description üretiyor

### 6.4 Büyük Dosya Bölmeleri **[CODEX]**
- [ ] `prices/repository.ts` (1.324) → sorgu gruplarına böl
- [ ] `PriceTable.tsx` (631), `FirmOwnerForm.tsx` (550) → alt bileşenler
- [ ] Kabul: her dosya <500 (backend) / <300 (component) satır, davranış değişikliği yok

### 6.5 Frontend Lint (Biome) **[CODEX]**
- [ ] Admin'deki biome.json'u temel alıp frontend'e kur, CI'a ekle

### 6.6 Bun TLS @ts-expect-error Netleştirme **[CLAUDE]**
- [ ] `fetcher.ts:990+` — 8 adet Bun'a özgü TLS opsiyonu: üretim runtime'ı hangisi, Node'da davranış ne? Runtime guard veya belge

### 6.7 Kök Dizin Temizliği **[CODEX]**
- [ ] Rapor/checklist MD'leri `docs/checklists/` ve `docs/raporlar/` altına taşı (CLAUDE.md, README, AGENTS kökte kalır)
- [ ] `x.md`, `xotomasyonu.pdf`, Coverage zip'leri: sil veya docs/arsiv'e
- [ ] `git status` sıfırla (bekleyen modified/deleted dosyalar commit'lensin)

---

## ⚡ HIZLI KAZANIMLAR (ilk oturumda bitirilebilir)

| # | Görev | Rol | Faz |
|---|---|---|---|
| 1 | Secret rotasyonu | ORHAN | 0.1 |
| 2 | "Sayfa hazırlanıyor" + "Yükleniyor" temizliği | CODEX | 3.1-3.2 |
| 3 | Yazım hataları (hallde/halı/AVAKADO sözlük) | CODEX | 3.4 |
| 4 | ETL sources endpoint auth | CODEX | 1.4 |
| 5 | Ölü bağımlılık temizliği | CODEX | 6.2 |
| 6 | Newsletter 404 fix (brief hazır) | CODEX | 4.1 |
| 7 | xlsx upgrade | CODEX | 1.1 |

## Önerilen Yürütme Sırası

```
Hafta 1: FAZ 0 (tamamı) → Hızlı kazanımlar (3.1, 3.2, 3.4, 1.4, 6.2)
Hafta 2: FAZ 1 (1.1-1.5) + FAZ 3 kalanı (3.3 çift hero, 3.5 karar) + 4.1 newsletter
Hafta 3: FAZ 2 (test + CI) + 4.2-4.3 (alarm e-posta, gclid landing)
Hafta 4: FAZ 5 (ISR + retention) + 4.4 bülten otomasyonu
Ay 2:    FAZ 6 (fetcher refactor küçük PR'larla) + 4.5 Market Makası
Sürekli: 4.0 ve 4.6 karar maddeleri Atakan gündemine
```

## Karar Bekleyenler (kod yazılmadan önce ORHAN/ATAKAN)

1. **Repo private mı kalsın?** (0.2)
2. **Ads bütçesi:** brand-awareness devam mı, funnel hazır olana dek kısma mı? (4.0 — mevcut Atakan kararıyla çelişiyor, birlikte karar)
3. **"Tamamen Ücretsiz" → "Tüketiciler için ücretsiz"** yeniden çerçeveleme onayı (3.5)
4. **B2B monetizasyon zamanlaması:** tetik mi (10K DAU), erken açılış mı? (4.6 — yazılı mutabakat şart)
5. **JWT TTL politikası** (1.6 — shared-backend, diğer projeleri etkiler)

---

*Her görev tamamlandığında checkbox işaretlenir + kısa not (tarih, commit hash) düşülür. Bu dosya tek doğruluk kaynağıdır; Codex'e görev verirken ilgili faz bölümü + REPO-DENETIM-RAPORU.md'nin o bulgusu birlikte verilir, çeklistin tamamı verilmez.*
