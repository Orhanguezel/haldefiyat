# KALAN İŞLER — Kök Çeklistleri (Konsolide Backlog)

**Üretim:** 2026-05-30 · **Kaynak:** `docs/checklists/` (eski kök çeklistleri buraya taşındı)
**Amaç:** Tüm açık `[ ]` maddeler tek yerde. Detay/bağlam için ilgili `docs/checklists/<dosya>.md`.
> Tamamlanmış planlar (ETL-KAPSAM, FIRMA-FORM, FIRMA-UYE, hal-yeni-kaynaklar, INDEKSLEME-ANALIZ) açık madde içermez.

---

## 🔴 VERİ KALİTESİ — 2026-07-20 oturumu (ÖNCELİKLİ)

Detay: [`docs/checklists/DONMUS-HAL-VERISI-DUZELTME.md`](docs/checklists/DONMUS-HAL-VERISI-DUZELTME.md)

- [ ] **`avg_price` %79 oranında SENTETİK — en büyük açık.** Haller ortalama yayınlamıyor;
      ETL `avg`'ı min-max **orta noktası** olarak türetiyor. Makas darken makul, genişken çöp
      (Bursa domates min 10 / max 185 → "ortalama" 97,50 ₺). Kayıtların %14,6'sında makas >5 kat.
      Bültene `MAX_MINMAX_SPREAD=3` filtresi kondu ama **asıl çözüm ETL'de**: hallerin geniş
      min-max'ında ne yayınlayacağımıza karar vermek. *Bu sadece bülteni değil sitedeki tüm
      fiyatları ve raporları etkiliyor.*

- [ ] **Tarihsel aykırı değer taraması.** Akran sapması dedektörü 14 günlük pencereye bakıyor;
      eski bozuk kayıtlar yakalanmıyor. Örnek: Ilgın `inek-canli` **16,33 TL/kg** (2026-03-10),
      Edirne'de aynı ürün 210 TL. Landing sayfasından 90 günlük pencereyle düştü ama DB'de duruyor.
      Gereken: dedektörün pencere parametreli, tüm geçmişe uygulanan hâli.

- [ ] **TOBB Adana + Ordu parser'ı** — `borsakod=5AD10` / `5OR10` istekte satır gösteriyor,
      `tobb_borsa_html` parser'ı 0 çıkarıyor.

- [ ] **71 yakın-mükerrer master çifti** (elle karar): `kamkat`/`kumkat`/`kunkat`,
      `hinnap`/`hunnap`. **Birleştirilmemesi gerekenler var:** `dereotu`/`tereotu` mesafe-1
      ama farklı bitkiler (dill vs cress).

- [ ] **Yıllık (YoY) kıyas hâlâ kapalı.** 12 üründen 3'ü eşikte. Backfill çözmedi
      (kapsam ~%2). Gerçekçi tarih **Mayıs 2027** — 2026-05'ten itibaren kapsam iyi.
      `basket.ts` yoyPct alanları hazır bekliyor.

- [ ] **Faz 4 kalan:** admin panelde kaynak sağlık kartına "son değişim tarihi" ✅ yapıldı;
      telegram bildirimi ✅ yapıldı. Kalan yok — faz kapandı.

- [ ] **Diğer projelere `TELEGRAM_CHAT_ID` ekle** (operasyonel iş, kod hazır):
      bereketfide, tarim-ansiklopedisi, tarimda-bugun, tarimiklim → token var, chat id yok.
      hava-durumu-don-uyarisi → ikisi de yok, don uyarısı gönderemiyor olmalı.


## Özet

| Çeklist | Açık |
|---|---|
| [MOBIL-WEB-PWA-CHECKLIST](docs/checklists/MOBIL-WEB-PWA-CHECKLIST.md) | 53 |
| [INDEKSLEME-CHECKLIST](docs/checklists/INDEKSLEME-CHECKLIST.md) | 6 |
| [SEO-DENETIM-KARSILASTIRMA](docs/checklists/SEO-DENETIM-KARSILASTIRMA.md) | 9 |
| [VERI-TUKETICILERI-CHECKLIST](docs/checklists/VERI-TUKETICILERI-CHECKLIST.md) | 3 |
| [FIRMA-LOGO-UPLOAD-CEKLIST](docs/checklists/FIRMA-LOGO-UPLOAD-CEKLIST.md) | 11 |
| [KOMISYONCU-GUNLUK-FIYAT-CEKLIST](docs/checklists/KOMISYONCU-GUNLUK-FIYAT-CEKLIST.md) | 1 |
| [HAL-FIRMALARI-GENISLEME-PLANI](docs/checklists/HAL-FIRMALARI-GENISLEME-PLANI.md) | 6 |
| [ADS-SETUP-CHECKLIST](docs/checklists/ADS-SETUP-CHECKLIST.md) | 91 |
| [MONETIZASYON-CHECKLIST](docs/checklists/MONETIZASYON-CHECKLIST.md) | 52 |
| [SOCIAL-API-SETUP-CHECKLIST](docs/checklists/SOCIAL-API-SETUP-CHECKLIST.md) | 222 |
| **🔴 Trafik & Ölçüm Aksiyonları (2026-06-01)** — bu dosyada, aşağıda | 27 |

---

## 🔴 AKTİF ÖNCELİK — Trafik & Ölçüm Analizi Aksiyonları (2026-06-01)

> **Kaynak analiz:** `reports/analiz-26-31-mayis-2026.pdf` + bulgular/durum değerlendirmesi `KALAN-ISLER-DOCS.md › TRAFIK-ANALIZ-BULGULAR-2026-06-01`.
> **Teşhis (tek cümle):** Ads trafiği ~6× büyüttü (3.220 → 19.248 insan/gün) ama bu **kiralık** trafik; funnel'ın ortası (ölçüm) ve dibi (e-posta yakalama) yeni kuruldu, uçtan uca **kanıtlanmadı**. Ölçeklemeden önce funnel'ın dönüştürdüğünü kanıtla.
> **▶ P0-A/B/C için çalıştırılabilir ortak oturum brief'i (Claude + Codex):** [`OTURUM-BRIEF-OLCUM-FUNNEL.md`](OTURUM-BRIEF-OLCUM-FUNNEL.md) — sonraki oturumda bununla başla.
> **Not — örtüşme:** Bazı maddeler mevcut `ADS-SETUP-CHECKLIST` (11.2/11.4/#3/#4) ve `SEO-DENETIM-KARSILASTIRMA` (B3) ile bağlantılı; burada **yeniden önceliklendirildi** + yeni işler eklendi. Tekrar değil, üst-öncelik.

### P0-A — Ölçüm gerçeği: ayrı GA4 + conversion doğrulama 🔴 BLOKE EDİCİ
> Bunsuz "Ads parası kitleye dönüyor mu" sorusu körlemesine. En yüksek kaldıraç. (Bağlantılı: ADS #3, #4, 11.2.)
- [ ] 👤 **Orhan:** hal-fiyatlari için **ayrı GA4 property** aç (şu an veri VistaSeeds property'sine akıyor — ADS #3'ü tamamla)
- [ ] 🤖 **Codex:** haldefiyat.com'a yalnızca yeni GA4 measurement ID'yi yükle, eski/yabancı tag'leri kaldır (tek kanonik tag)
- [ ] 🤖 **Codex:** `newsletter_signup` conversion event'i form submit'te gerçekten `gtag`'e düşüyor mu — DevTools Network'te doğrula (ADS 11.2 ile aynı, ama önce bu doğrulanmadan diğerleri başlamasın)
- [ ] 👤 **Orhan:** GA4 DebugView'de `newsletter_signup` + `gclid` + `utm_*` parametrelerinin geldiğini gör
- [ ] 👤 **Orhan:** Google Ads → Dönüşümler → AW-18007572524 ile eşleştir, "Doğrulandı" durumunu bekle (24-48h)
- [ ] **Kabul:** Admin/GA4'ten "dün Ads'ten kaç tıklama → kaç abone" sorusu sayıyla cevaplanabiliyor

### P0-B — Newsletter funnel'ı uçtan uca doğrula 🔴
> `POST /api/v1/newsletter/subscribe` artık **201 dönüyor** (28 May'deki 404 düzeldi) — ama "201" ≠ "çalışıyor". Uçtan uca kanıtla.
- [ ] 🧠 **Claude + 👤 Orhan:** Gerçek e-posta ile abone ol → **DB'ye kayıt düştü mü** (`hf_newsletter_*` veya local tablo) doğrula
- [ ] 👤 **Orhan:** Abonelik sonrası **doğrulama/hoşgeldin maili** geliyor mu (single opt-in kararı — Resend üzerinden, Inbox'a mı düşüyor spam'e mi)
- [ ] 👤 **Orhan:** **Unsubscribe** linki (stateless HMAC token) çalışıyor mu — bir tıkla çıkış
- [ ] 🤖 **Codex:** Haftalık digest cron'u gerçekten gönderiyor mu + sadece hal-fiyatlari abonelerine gidiyor mu (Bereketfide/VistaSeed izolasyonu korunuyor mu)
- [ ] 👤 **Orhan:** `/abonelik` sayfası + signup form'ları (anasayfa, /canli-hal-fiyatlari, footer) gerçekten POST atıyor mu (boşluğa değil)
- [ ] **Kabul:** Test e-postası → DB kaydı + hoşgeldin maili + unsubscribe = 3'ü de çalışıyor

### P0-C — Ads landing'i `/canli-hal-fiyatlari`'ya yönlendir 🔴
> gclid verisi sızıntıyı kanıtlıyor: reklam tıklamalarının çoğu `/` anasayfaya düşüyor (639), `/fiyatlar`a değil (25). Niyet boşa gidiyor. (Bağlantılı: ADS 11.4/11.6 — landing 200 dönüyor, kalan sadece yönlendirme + ölçüm.)
- [ ] 👤 **Orhan:** Google Ads → kampanya → final URL `/` → **`/canli-hal-fiyatlari`** (ADS 11.6 final URL maddesi)
- [ ] 🤖 **Codex / 👤 Orhan:** Landing'de newsletter signup'ın **#1 CTA** olduğunu doğrula (above-the-fold)
- [ ] **Kabul:** 1 hafta sonra gclid landing dağılımında `/canli-hal-fiyatlari` baskın + newsletter signup oranı ölçülebiliyor (≥%3 hedef, ADS 11.4)

### P1-A — İstanbul ETL kuru (7 gün, 0 satır) — var olan SEO talebini kaçırıyoruz 🟡
> GSC kanıtı: insanlar "istanbul toptancı hali", "ibb hal fiyatları" arıyor (gösterim var, sayfa indexli). Ama `istanbul_ibb` ETL'i 7 gündür 0 satır ("Kaynak veri yayinlamadi, HTTP 200"). Talep var, veri yok = kaçan trafik.
- [ ] 🧠 **Claude + 🤖 Codex:** `istanbul_ibb` neden boş döndüğünü teşhis et — `gunluk_fiyatlar.asp` AJAX endpoint hâlâ çalışıyor mu, tUsr/tPas/tVal auth değişmiş mi (CLAUDE.md Asama 4 referansı)
- [ ] 🤖 **Codex:** İstanbul IBB Avrupa Yakası kaynağını da değerlendir (ayrı hal müdürlüğü URL'i — CLAUDE.md'de "YENI EKLENECEK" notu)
- [ ] 👤 **Orhan:** Düzeltme sonrası `/hal/istanbul-hal-ibb` + `/fiyatlar?city=istanbul-hal` sayfalarında güncel veri görünüyor mu
- [ ] **Kabul:** İstanbul son 7 gün veri akışı var, etl-health'te "Veri Akışı Yok" listesinden çıktı

### P1-B — SEO: şehir-hal sayfalarını Google 2. sayfadan 1.'ye taşı 🟡
> Kazanan format belli: "balıkesir hal fiyatları" zaten poz **5,4** (1. sayfa!), gösterim Nisan 30 → Mayıs 350/gün tırmanıyor ama ort. pozisyon ~14 (çoğu 2. sayfa) → CTR düşük. Kazanana yığ. (Bağlantılı: SEO-DENETIM B3.)
- [ ] 🧠 **Claude içerik stratejisi:** En çok gösterim alan şehir-hal sorgularını (balıkesir, kahramanmaraş, çanakkale, kütahya, denizli, ibb) sayfa-içi metinle güçlendir ("X hal fiyatları nasıl belirlenir", güncelleme sıklığı, kapsam)
- [ ] 🤖 **Codex / 👤 editör:** Şehir/hal sayfalarına kısa özgün açıklama paragrafı (SEO-DENETIM B3 ile aynı — şehir bazlı önceliklendir)
- [ ] 👤 **Orhan:** GSC URL Inspection → bu şehir sayfalarının render edilmiş halinde fiyatların göründüğünü teyit, "Request indexing"
- [ ] **Kabul:** 14 gün sonra hedef şehir sorgularının ort. pozisyonu < 10 (1. sayfa), CTR artışı GSC'de görünür

### P1-C — Kuru/hatalı ETL kaynaklarını onar 🟡
> 31 May etl-health: çanakkale (timeout), kütahya (socket closed), manisa (socket closed), mersin (socket closed), tekirdağ (boş listing). Ulusal kaynak (hal_gov_tr 396 satır) açığı kapatıyor ama şehir kapsamı için bunlar lazım. (Bağlantılı: CLAUDE.md "Sorunlu Kaynaklar" tablosu.)
- [ ] 🧠 **Claude + 🤖 Codex:** çanakkale (daha önce Scrapling 85 satır veriyordu) timeout regresyonunu incele — Scrapling retry/timeout artışı
- [ ] 🤖 **Codex:** kütahya/manisa/mersin "socket closed" → HF_SCRAPER_SOURCES'a ekle (CLAUDE.md aksiyon kılavuzu: socket closed = Scrapling TLS impersonation çözer)
- [ ] 🤖 **Codex:** tekirdağ listing sayfası boş → URL pattern değişmiş mi kontrol (id:NNN backfill formatı hâlâ geçerli mi)
- [ ] 👤 **Orhan:** Onarım sonrası `etl-health.sh 24` ile "Sorunlu Kaynaklar" bölümünün boşaldığını doğrula
- [ ] **Kabul:** 5 kaynaktan en az 3'ü tekrar veri üretiyor

### P2 — Baseline & raporlama hijyeni (bir defalık) 🟢
> Bu oturumda kanıtlandı: baseline raporu doğru logdan üretilmiş, tek sapma 26 May'in yarım gün olması. Gelecekteki kıyaslar için hijyen kuralları. (Detay: memory `baseline-report-wrong-logsource`.)
- [ ] 🧠 **Claude:** Resmi "öncesi/sonrası" karşılaştırma tablosunu PDF'e işle (yapıldı — `reports/analiz-26-31-mayis-2026.pdf` sayfa 1) ✅ referans
- [ ] 👤 **Orhan / 🤖 Codex:** Trafik raporu üretirken **DEDİKE** `haldefiyat.access.log*` kullanılsın (plain `access.log` değil — o başka vhost, Cloudflare IP), ve **günü tam bitmeden çekme** (26 May partial-day tuzağı)
- [ ] 🤖 **Codex (opsiyonel):** Haftalık trafik rapor scriptini repo'ya al (`backend/scripts/` veya `scripts/`) — `/tmp` yerine kalıcı, dedike log + bot heuristic + gclid + öncesi/sonrası ile
- [ ] **Karar (👤 Orhan + Atakan):** GA4+conversion canlı olunca **abone başı maliyet** ölç → yakalama yoksa 150 TL/gün Ads bütçesini gözden geçir (ADS 11.7 brand-awareness uzatma kararıyla birlikte)

---

## Açık Maddeler

### MOBIL-WEB-PWA-CHECKLIST.md

**3.2 Implementation (🤖 Codex — Orhan karar verince)**
- [ ] Mevcut hamburger içeriğinden Anasayfa/Fiyatlar/Harita/Uyarılar çıkar (bottom nav'da)
- [ ] Sadece: Endeks, Analiz, Karşılaştırma, Embed, Hakkımızda, Hesap kalsın
- [ ] Dark/light tema toggle hamburger içinde kalır
- [ ] Login/"Ücretsiz Başla" CTA hamburger'da üstte

**3.3 Kabul kriteri**
- [ ] Hamburger sade — ana feature'lar bottom nav'da *(opsiyonel: header hamburger hâlâ tam menü; bottom nav ile redundant ama kırık değil — istenirse sadeleştirilir)*
- [ ] Dark/light tema değişiminde logo doğru *(Orhan manuel test)*

**4.2 İkonlar (👤 Orhan asset hazırlığı)**
- [ ] `icon-192.png` (192x192, normal padding)
- [ ] `icon-512.png` (512x512, normal padding)
- [ ] `maskable-192.png` (192x192, **safe area** padding — center'da %80 alanda logo)
- [ ] `maskable-512.png` (512x512, aynı kural)
- [ ] `apple-touch-icon.png` (180x180)
- [ ] `shortcut-prices.png` (96x96)
- [ ] `shortcut-alerts.png` (96x96)
- [ ] `favicon.ico` (32x32 multi-resolution)

**4.4 Kabul kriteri**
- [ ] Chrome DevTools → Application → Manifest → "Installability" yeşil
- [ ] iOS Safari "Ana Ekrana Ekle" doğru ad + ikon ile çalışıyor
- [ ] Lighthouse PWA skorunda "Installable" check geçiyor

**5.2 Implementation (🤖 Codex)**
- [ ] `bun add @serwist/next` (root'tan, workspace'e ekle)
- [ ] `frontend/next.config.ts` — Serwist plugin entegre et

**5.3 Kabul kriteri**
- [ ] Chrome DevTools → Application → Service Workers → "activated and running"
- [ ] Offline test (DevTools network → Offline) → daha önce ziyaret ettiğin sayfa cache'ten yüklenir
- [ ] `/api/v1/prices/today` offline'da son cache'lenmiş veri döner, üstüne "offline" banner
- [ ] Yeni deploy sonrası eski SW otomatik temizlenir (versiyon check)

**6.2 Implementation (🤖 Codex)**
- [ ] Hala eksik OG image'ler varsa M11.4 ile birlikte düzelt

**6.3 Kabul kriteri**
- [ ] Mobile Lighthouse SEO skoru 100
- [ ] Google Mobile-Friendly Test → "Page is mobile friendly"

**7.2 Implementation (🤖 Codex)**
- [ ] LCP element neyse onu öncele (anasayfa hero, ürün sayfası price chart)
- [ ] `next/image` ile responsive görsel — `sizes` prop'u doğru
- [ ] Recharts gibi heavy lib'ler `dynamic(() => import(...))` ile lazy
- [ ] Font preload + subset (sadece Latin)
- [ ] `next-intl` mesaj dosyalarını route bazlı bölme (i18n payload azaltma)
- [ ] Unused CSS purge — Tailwind v4 zaten yapıyor ama doğrula

**7.3 Kabul kriteri**
- [ ] Hedef metrikler karşılanıyor
- [ ] Lighthouse rapor PDF'i `docs/lighthouse-mobile-2026-XX-XX.pdf` olarak kayıtta

**8.1 Otomatik testler (🤖 Codex)**
- [ ] Playwright veya benzeri ile 5 ana sayfanın mobile viewport screenshot regresyon testi
- [ ] Lighthouse CI — PR'da otomatik mobile skoru raporu

**8.2 Manuel testler (👤 Orhan — 🚫 Codex'e verilmez)**
- [ ] **iPhone Safari** — 1 sayfa gez, herhangi bir element bozuk mu
- [ ] **Android Chrome** — aynı test
- [ ] **PWA install prompt** — Chrome mobile'da "Ana ekrana ekle" geliyor mu
- [ ] **PWA standalone mode** — yüklendikten sonra standalone açılıyor mu
- [ ] **Offline davranışı** — uçak modunda son ziyaret edilen sayfa açılıyor mu
- [ ] **Dark/light tema** — sistem teması değişince anında uyuyor mu
- [ ] **Touch targets** — parmakla denerken yanlış element'e basılıyor mu
- [ ] **Login mobile akışı** — registration + login form'lar mobile'da kullanışlı mı

**9.2 Canlı doğrulama (👤 Orhan)**
- [ ] `curl https://haldefiyat.com/manifest.json` → 200
- [ ] `curl https://haldefiyat.com/sw.js` → 200
- [ ] `curl -I https://haldefiyat.com/manifest.json | grep -i content-type` → `application/manifest+json` (önerilir, JSON da olur)
- [ ] Chrome incognito mobile'da `https://haldefiyat.com` aç → install prompt veya menüden "Ana ekrana ekle"
- [ ] Kurulu uygulamayı aç → standalone mode (URL bar yok)
- [ ] Eski cache temizleme — service worker versiyon güncel

**9.3 Cache sorunu varsa**
- [ ] Service worker'ı `skipWaiting()` + `clients.claim()` ile force update
- [ ] Cache name'ini versiyonla (`hf-cache-v2`)
- [ ] Geçici olarak SW'yi devre dışı bırakmak için boş SW deploy et

### INDEKSLEME-CHECKLIST.md

**0.6 GSC'de eski URL'leri "geçici kaldır" + yeni sitemap submit**
- [ ] 👤 **Orhan:** GSC > URL Removals → patterned removal: hiçbir şey kaldırma (Google zaten indekslememiş). Yeni sitemap submit yeterli.
- [ ] 👤 **Orhan:** Sitemap'i tekrar fetch ettir (GSC > Sitemaps > yeniden gönder).

**1.5 Editoryel içerik — variant uzunluğu artır**
- [ ] 👤 **Orhan:** Admin review queue (`/admin/editorial?status=draft`), haftada 20-30 ürün review hedefi.

**2.3 Blog / haberler — fiyat trendleri**
- [ ] 👤 **Orhan (Faz 2.3b):** Author profile sayfa (`/yazarlar/orhan-guzel`), her AI rapora min 1 kişisel yorum cümlesi.

**FAZ 3 — Ölçüm ve İyileştirme (sürekli)**
- [ ] 👤 **Orhan:** İlk snapshot 2026-06-01 — CSV export → `data/seo/snapshots/2026-06-01/` → `INDEKSLEME-ANALIZ-2026-06-01.md` doldur.
- [ ] 👤 **Orhan:** Faz 1 deploy +14g sonrası ikinci snapshot.

### SEO-DENETIM-KARSILASTIRMA.md

**B2. Veri tazeliği & gerçek sayılar `[Claude — DONE]`**
- [ ] *(Opsiyonel, sonra)* Sayfa-içi kapsam etiketleri (ör. "Bu halde izlenen: N") + >3 gün bayat veri rozeti

**B3. İçerik derinliği — organik trafik motoru `[Claude içerik stratejisi + Orhan/editör]`**
- [ ] Önemli ürün sayfalarına **özgün 1-2 paragraf** (mevsim etkisi, fiyat neden dalgalanır) — şablon
- [ ] Şehir/hal sayfalarına kısa açıklayıcı metin ("İstanbul hal fiyatları nasıl belirlenir").
- [ ] Rehber/blog bölümünü genişlet (mevcut mevsim rehberi üzerine) — uzun kuyruk aramalar için.
- [ ] "Aynı ürünün diğer şehirlerdeki fiyatı" iç linkini ürün sayfasında güçlendir (crawl derinliği + UX).

**B4. Operasyonel — GSC `[Orhan]`**
- [ ] GSC'de hem `haldefiyat.com` hem `www.haldefiyat.com` property → www'nin 301'lendiğini teyit.
- [ ] `sitemap.xml` + `news-sitemap.xml` GSC'ye gönderildi mi kontrol et.
- [ ] URL Inspection → "Test Live URL" → birkaç ürün/hal sayfasının **render edilmiş** halinde fiyatların
- [ ] (Not: indexleme genişletme ayrı planda — `seo-index-expansion-plan` / `KALAN-ISLER.md`.)

### VERI-TUKETICILERI-CHECKLIST.md

**2. "İstekler" Sekmesi — ham log (mevcut, cila) 🔧**
- [ ] `referer` ayrı sortable kolon + "sadece dış referer" filtresi (kendi domaini hariç). UI'da referer ayrı kolona alındı ve iç/dış badge eklendi; sortable/filter için shared audit backend kontratı genişletilmeli. (Codex notu, 2026-05-28)

**4. "Ads" Sekmesi — kampanya takibi 📣**
- [ ] Aktif kampanya özeti: bugün/dün/7g Ads IP, maliyet notu (Orhan manuel girer — Ads API Faz 2).

**7.3 Kanal C — anonim scraper / yoğun veri çeken**
- [ ] Eşik kararı (🧠 öner → 👤 Orhan onay): UI/endpoint şimdilik parametreli `min_hits=500` varsayılanıyla çalışıyor; nihai eşik operasyon kararı bekliyor.

### FIRMA-LOGO-UPLOAD-CEKLIST.md

**FAZ 1 — Ortak `ImageUpload` bileşeni (DRY — kod tekrarını önle) `[Codex]`**
- [ ] `frontend/src/components/ui/ImageUpload.tsx` oluştur — AvatarUpload'daki yükleme mantığını
- [ ] **AvatarUpload'ı bu ortak bileşeni kullanacak şekilde refactor et** (kod tekrarı kalmasın).

**FAZ 2 — Backend: `photoUrl` kabulü `[Codex]`**
- [ ] `backend/src/modules/firms/index.ts` → `firmWriteBodySchema`'ya:
- [ ] `repository.ts` create + update fonksiyonları `photoUrl`'i `photo_url`'e **persist** etsin
- [ ] **Bucket allowlist:** `uploadToBucket` bucket'ı kısıtlıyorsa `firms` (veya `firm-logos`) eklenmeli;

**FAZ 3 — Owner formuna entegre `[Codex]`**
- [ ] `FirmOwnerForm.tsx` firma alanları bölümüne **`<ImageUpload bucket="firms" value={form.photoUrl}
- [ ] `FirmPayload`'a `photoUrl?: string | null` ekle; `emptyFirm`, `fromFirm`, `normalizeFirmPayload`
- [ ] **manage** modunda mevcut logo önizlemesi (firma scraped logosu varsa görünsün, değiştirilebilsin).
- [ ] Logo opsiyonel — zorunlu değil (firma logosuz da kaydolabilir).

**FAZ 4 — Gösterim doğrulama `[Codex]`**
- [ ] Public profil zaten `photoUrl` render ediyor → sadece **yeni yüklenen logo görünüyor mu** doğrula.
- [ ] `FirmCard` (dizin kartı) logoyu gösteriyor mu kontrol et; göstermiyorsa ekle (mevcut alan, yeni veri yok).

### KOMISYONCU-GUNLUK-FIYAT-CEKLIST.md

**FAZ 6 — Opsiyonel / sonraki `[Claude+Codex, sonra]`**
- [ ] (İleride, K1 alternatifi) ürün sayfasında ayrı "Komisyoncu fiyatları" sekmesi + kaynak etiketi. **K1 kesin kararı nedeniyle bu turda uygulanmadı.**

### HAL-FIRMALARI-GENISLEME-PLANI.md

**FAZ 0 — Keşif & Doğrulama *(implementasyonla çözüldü — 2026-05-30 review)***
- [ ] **[Orhan]** ToS/hukuki: kamuya açık dizin ama 3. taraf içeriği — toplu çekim + ticari yayın + atıf kararı. Marka konumlandırma ("HalDeFiyat Firma Rehberi" başlığı)

**FAZ 3 — CRM / İş Geliştirme *(admin_panel)***
- [ ] **[Orhan]** İlk outreach listesi (görüşülen firmalar) + deal kayıtları

**FAZ 4 — Monetizasyon**
- [ ] **[Orhan]** Fiyatlandırma paketleri (reklam/sponsorluk/premium) + sözleşme şablonu

**FAZ 5 — Launch & Büyütme**
- [ ] **[Orhan]** GSC: firma sitemap'i gönder + ilk sayfalar request indexing
- [ ] **[Orhan]** Satış: sponsorluk outreach (Atakan sektör ağı ile)
- [ ] **[Claude/Codex]** İzleme: indexlenme + lead funnel + sponsorluk geliri

### ADS-SETUP-CHECKLIST.md

**1. Conversion Tag'i haldefiyat.com'a yükle ✅ TAMAMLANDI 2026-05-26**
- [ ] Google Ads → Araçlar → Etiketler → "Tekrar test et" → yeşil tik bekle (Google bot 24-48 saatte tarar)

**2. Bereketfide tag kalıntılarını temizle ✅ TAMAMLANDI 2026-05-26**
- [ ] (Borç) `google_ads_id = "941-057-6390"` ve `ga4_property_id = "538279658"` orphan settings, kod okumuyor — temizlenebilir veya bırakılabilir

**3. Haldefiyat için ayrı GA4 property aç**
- [ ] GA4 Admin → "Property oluştur" → Ad: "Haldefiyat"
- [ ] Veri akışı ekle: `haldefiyat.com`
- [ ] Yeni measurement ID alı not et: `G-XXXXXXXX` (buraya yaz: `______________`)
- [ ] haldefiyat.com'a sadece bu yeni tag'i yükle (önce eskileri sil)
- [ ] Vista Seeds Ads → Araçlar → Bağlantılı hesaplar → Haldefiyat GA4'ü de bağla

**4. Conversion event'lerini tanımla**
- [ ] `newsletter_signup` — `/uyarilar` form submit
- [ ] `pro_upgrade` — `/pro` checkout başarılı
- [ ] `embed_inquiry` — `/embed` form submit
- [ ] `price_alert_created` — fiyat alarmı kayıt
- [ ] Backend `success` response sonrası `window.gtag('event', 'newsletter_signup')` tetikle
- [ ] Google Ads → Araçlar → Dönüşümler → her event'i conversion action olarak ekle

**5. social.tarvista.com (ekosistem-sosyal-medya) HalDeFiyat tenant kaydı 🟡 KISMEN TAMAMLANDI 2026-05-27**
- [ ] **VPS sync** (sosial.tarvista.com): SSH key sorunu nedeniyle ertelendi. Yapılacak:
- [ ] HalDeFiyat footer'da FB/IG bağlantılarını ekle (FB Page + IG hesabı açıldı, link'ler eklenmeli):
- [ ] `frontend/src/components/layout/Footer.tsx` veya DB `site_settings.social_*` güncelle
- [ ] Open Graph tag'lerinde de bu bağlantıların doğru olduğundan emin ol (`layout.tsx` metadata)

**5b. Sosyal medya hesap kurulumları + Meta API otomasyon**
- [ ] IG ↔ FB Page bağlantısı — Meta rate limit ("hesap kısıtlandı") nedeniyle ertelendi, yarın taze IP/session ile
- [ ] Meta Business Manager — "Bereket Fide" BM mevcut ama Atakan kontrolünde; yeni BM ("Tarım Ekosistemi" veya HalDeFiyat'a özel) açılacak yarın
- [ ] Domain Verification (haldefiyat.com TXT, Turhost)
- [ ] Business Verification başvuru (vergi levhası + ticaret sicil + imza sirküleri)
- [ ] Meta Developer App ("Ekosistem Sosyal Otomasyon") + App Review
- [ ] System User Token üret → ekosistem-sosyal-medya `social_accounts` tablosuna yaz
- [ ] YouTube Brand Channel (Meta'dan ayrı, paralel açılabilir)
- [ ] Test post (sosial.tarvista.com'dan Haldefiyat FB Page'e otomatik)

**6. Kampanyayı izle ve optimize et (2026-06-02 civarı)**
- [ ] Gösterim sayısı (günde 500-2000 normal)
- [ ] Tıklama (günde 30-80 hedef)
- [ ] CTR (%3-5 iyi, %1-2 zayıf)
- [ ] Ort. TBM (1.5-3 TL beklenir)
- [ ] Tıklama başı maliyet ve günlük harcama trendi
- [ ] Düşük performanslı anahtar kelimeleri çıkar
- [ ] Yüksek performanslı sorgular için yeni anahtar kelime varyantları ekle
- [ ] En çok tıklanan sitelink / extension
- [ ] VPS nginx log: `/var/log/nginx/haldefiyat.access.log*` (rotation 7 gün, daha eski için audit/DB)
- [ ] Backend audit modülü verisi (HTTP istek, kullanıcı sessions)
- [ ] hf_etl_runs (ETL aktivitesi)
- [ ] Google Ads paneli verisi (campaign export CSV)
- [ ] Baseline (kampanya öncesi 18-26 May) vs Kampanya sonrası karşılaştırma

**7. Ek uzantılar — Structured Snippets**
- [ ] Account-level değil, **haldefiyat kampanyası özelinde** ekle (Bereketfide'in reklamlarında görünmesin)
- [ ] Başlık: "Kapsamı"
- [ ] Değerler: Antalya, İstanbul, İzmir, Ankara, Bursa, Adana, Mersin, Konya

**8. Bereketfide ve Haldefiyat için ayrı Ads hesapları**
- [ ] MCC (Manager Account) kur — yeni temiz Gmail ile (info@vistaseeds.com.tr ile değil, çünkü Google izin vermedi)
- [ ] hal de fiyat Ads hesabını (941-057-6390) tamamla ve MCC'ye bağla
- [ ] Bereketfide Ads hesabı aç, MCC'ye bağla
- [ ] Vista Seeds Ads hesabını da MCC'ye link et
- [ ] Consolidated billing — Atakan'ın kartı MCC seviyesinde

**11.2 Conversion event'leri kod tarafında tetikle 🔴 HEMEN**
- [ ] Yerel test: form submit → DevTools Network'te `gtag/...` çağrısı görmeli
- [ ] VPS deploy + her event için 1 manuel test gönderimi
- [ ] Google Ads → Araçlar → Dönüşümler → 4 conversion action ekle (her event için), AW-18007572524 etiketiyle eşleştir
- [ ] GA4 Admin → Custom events → 4 event'i "Mark as conversion" olarak işaretle
- [ ] DevTools Network'te 4 event'in `gtag` call'u görünür
- [ ] Google Ads dönüşüm ekranında "Hayır, henüz dönüşüm görmedik" → "Doğrulandı" olur (24-48h)

**11.3 Attribution kalıcılığı: gclid + UTM cookie capture 🟡 ÖNEMLİ**
- [ ] GA4 DebugView'de event'lerde gclid + utm_* parametreleri görünür
- [ ] Cookie 90 gün TTL ile set

**11.4 Brand-awareness landing sayfası `/canli-hal-fiyatlari` 🟡 ÖNEMLİ**
- [ ] Lighthouse 95+
- [ ] Google Ads → kampanya → final URL `/canli-hal-fiyatlari` olarak değiştir
- [ ] Firma logosu yüksek çözünürlüklü PNG iste (whatsapp veya mail). Logo gelene kadar placeholder kullan, deploy beklemez.
- [ ] Lighthouse Performance ≥ 95
- [ ] Newsletter signup oranı ≥ %3 (Ads tıklama → email yakalanma)
- [ ] Ortalama session duration ≥ 90 saniye (yapışkanlık)

**11.5 Admin analytics dashboard 🟢 ORTA ÖNCELİK**
- [ ] Test: dashboard ssh-grep ile aldığımız verilerle uyuşmalı (±%2 tolerans, bot heuristic farkı)
- [ ] Admin panelden 30 saniyede son 7 gün özetini görebilirim
- [ ] "Bugün Ads'ten kaç tıklama geldi" sorusu tek tıkla cevaplanır
- [ ] (Opsiyonel) Atakan'a salt-okunur izleme yetkisi açılabilir, ama operasyonel iş Orhan'da

**11.6 Google Ads dashboard ayarları (BRAND AWARENESS FAZI) 👤 ORHAN**
- [ ] **UTM template:** Kampanya → Kampanya URL şablonu →
- [ ] **Bot/click fraud önlemi:** "Geçersiz tıklamalardan koruma" otomatik aktif, ama "IP exclusions" listesine VPS scan'den çıkacak şüpheli IP block'ları eklenmeli (gece 04:00 TR 719 hit gibi anomaliler)
- [ ] **Remarketing tag yükle (Madde 11.8 ile bağlantılı):** Google Ads → Araçlar → Audience Manager → "Web sitesi etiketi" → Global site tag varsa zaten otomatik veri toplar. Doğrula. Yoksa AW-18007572524 ile birlikte yüklenmeli.
- [ ] **Remarketing audience listeleri oluştur:**
- [ ] **Final URL değişimi:** Kampanya final URL'i `/` yerine `/canli-hal-fiyatlari` (Madde 11.4 hazır olunca, brand-awareness landing)
- [ ] Yeni kampanya placeholder: "Haldefiyat - Arama - B2B" (henüz aktive etme)
- [ ] B2B-specific keyword araştırması başlat:
- [ ] Bu kampanya başladığında: mobil bid -%50, ad scheduling 08:00-18:00 TR, consumer negative keyword listesi aktive edilir
- [ ] Hedef tarih: Brand awareness fazı 60 gün sonra (≈ 2026-07-26) değerlendirilir, B2B fazı paralel açılır

**11.8 Remarketing tag + audience capture 🟡 ÖNEMLİ (Faz 2 ön hazırlık)**
- [ ] Google Ads → Araçlar → Audience Manager → 6 custom audience ekle
- [ ] Her audience için "Google Ads kampanyalarında kullanılabilir" işaretle
- [ ] 7 gün sonra audience size kontrol (≥1000 cookie hedef), 30 gün sonra tekrar bak (≥5000)
- [ ] Google Ads → Audience Manager'da "Tüm site ziyaretçileri" listesinin boyutu 7 gün içinde 1000+ olur
- [ ] B2B kampanyası açıldığında bu liste hedef alınabilir

**11.7 İzleme ve doğrulama (1 hafta sonra: 2026-06-04)**
- [ ] 11.8 remarketing audience boyutu ≥1000 cookie *(Orhan Ads panelinde audience oluşturup bekleyecek)*
- [ ] **Yapışkanlık testi:** 26 May'da ilk kez gelen IP'lerin ne kadarı 2-3 Haziran'da geri geldi? (Cohort retention D+7 ≥ %15 = "bir giren sürekli girer" hipotezi destekleniyor)
- [ ] **Newsletter signup oranı:** Ads tıklama → email yakalanma ≥ %3 hedef
- [ ] **Direct traffic gelişimi:** Bu hafta direct traffic'i geçen haftaya göre nasıl? (brand awareness etkisi)
- [ ] **Session duration trend:** Ortalama session ≥ 90 saniye (yapışkanlık ikinci sinyal)
- [ ] **Remarketing audience seed:** "Tüm ziyaretçiler" listesi ≥ 5000 cookie
- [ ] 11.6 UTM template + remarketing tag yüklemesi yapıldı
- [ ] 6 custom audience oluşturuldu, büyüme izleniyor (Ads → Audience Manager)
- [ ] Conversion'lar Google Ads'te görünüyor (24-48h gecikme normal)
- [ ] Faz 2 (B2B kampanya) keyword araştırması başlandı, ayrı kampanya iskelet hazır (henüz aktive değil)
- [ ] Brand awareness fazını 60 güne kadar uzatma onayı (2026-07-26'ya kadar) — bütçe akmaya devam edecek mi?
- [ ] Faz 2 (B2B kampanya) bütçe + zamanlama kararı — ayrı bütçe verilecek mi yoksa mevcut 150 TL'den mi bölünecek?
- [ ] Firma logosu + referans isimleri gönderildi mi (Landing sayfası için)?

### MONETIZASYON-CHECKLIST.md

**Adım 0 — Anlaşma (Kod Yazmadan Önce, Bir Sayfa Yeterli)**
- [ ] Atakan ile yazılı mutabakat (WhatsApp mesajı veya tek sayfa e-posta yeterli)
- [ ] Site/domain/sunucu sahipliği kimin adına? (büyük ihtimal Atakan firması)
- [ ] Hangi gelir kimin: AdSense + bireysel premium + API abonelik = yazılımcı
- [ ] Atakan firmasının kendi reklamı: bedava mı, intercompany fiyat mı?
- [ ] Kurumsal/enterprise anlaşmalar nasıl paylaşılır?
- [ ] Sponsorluk modeli (Atakan'ın hal müdürü ağı üzerinden satış) nasıl paylaşılır?
- [ ] Yazılımcı ayrılırsa: kaynak kodu lisansı, devir süreci, son bakım yükümlülüğü

**Adım 1 — İçerik Motoru (En Yüksek ROI)**
- [ ] Yazar profili sistemi (DB tablosu: ad, foto, ünvan, uzmanlık, sosyal medya, kısa bio)
- [ ] Yazar profil sayfası (`/yazar/{slug}`) — yazılar listesi, bio
- [ ] Makale CMS (admin panelinde editör akışı: taslak → onay → yayın)
- [ ] Makale şablonu (zengin metin + otomatik fiyat-grafik embed bileşeni)
- [ ] Kategori/etiket sistemi (ürün bazlı, sezonsal, bölgesel)
- [ ] Structured data — Article + Person (yazar) + speakable
- [ ] Atakan ile pilot 5 mühendis seçimi + onboarding
- [ ] İlk 4 hafta için içerik takvimi (sezonsal: don zararı, ekim/hasat trendleri, hal analizleri)

**Adım 2 — Veri Kapsama Tamamlama**
- [ ] Manuel veri yükleme paneli (admin)
- [ ] PDF / Excel / CSV upload + otomatik parse
- [ ] Yapıştır-parse-et arayüzü (WhatsApp'tan kopyala-yapıştır akışı)
- [ ] Doğrulama: anormal fiyat uyarıları, dün-bugün delta kontrolü
- [ ] Onay öncesi önizleme (kim yükledi, hangi kaynak)
- [ ] Eksik il/hal envanteri çıkar — Atakan'a "hangi hal müdürlerini tanıyorsun" listesi sun
- [ ] Resmi olmayan veri kaynakları için iletişim protokolü (kim, ne sıklıkla, hangi format)
- [ ] Veri kaynağı şeffaflığı: her ürün sayfasında "kaynak: X hali, Y yöntemi"

**Adım 3 — SEO & Teknik Temeller**
- [ ] Lighthouse 95+ (Performance, SEO, Accessibility, Best Practices) tüm public sayfalar
- [ ] Core Web Vitals (LCP, INP, CLS) yeşil
- [ ] Structured data audit: Article, Product, BreadcrumbList, FAQPage, Organization, Person
- [ ] Sitemap kapsayıcılık (tüm ürün × hal × tarih sayfaları)
- [ ] llms.txt eklenmesi (AI crawler'lar için)
- [ ] robots.txt + AI crawler izinleri (GPTBot, ClaudeBot, PerplexityBot vb.)
- [ ] Open Graph + Twitter Card audit (mevcut var, kapsam kontrol)
- [ ] Hız: image optimization, font subset, edge caching nginx

**Adım 4 — Newsletter Altyapısı**
- [ ] Abone formu — anasayfa hero altı + her makale altı + footer
- [ ] Çift onay (double opt-in)
- [ ] Segment: genel abone / premium bekleme listesi / sektörel (toptancı/manav/restoran)
- [ ] Haftalık şablon: 3 ürün fiyat özeti + 1 mühendis yazısı + 1 hal duyurusu/röportaj
- [ ] Otomatik gönderim cron (Pazartesi sabahı)
- [ ] Tracking: open rate, click rate, unsubscribe
- [ ] 12 aylık hedef: 5-10K abone

**Adım 5 — Otorite Sinyalleri**
- [ ] Anasayfada Atakan firma logosu + tagline ("X yıllık tarım otoritesi")
- [ ] "250+ ziraat mühendisi ekibimiz" rozeti + ekip sayfası
- [ ] Hakkımızda sayfası güçlendirme (firma kimliği, vizyon, ekip)
- [ ] Basın/medya görselleri (varsa Atakan'dan al)
- [ ] Hal müdürü röportajları/demeçleri (sosyal kanıt)
- [ ] Kullanıcı testimonialleri (toptancı/manav demeçleri)

**Adım 6 — Para Kazanma Altyapısı (Sessiz Hazır, Açık Değil)**
- [ ] Kullanıcı rolleri: `free` / `premium` / `api_user` / `admin`
- [ ] Premium feature gate sistemi (component + API level)
- [ ] Stripe veya Iyzico hesap kurulumu (entegre etme henüz)
- [ ] Fatura altyapısı (KDV, e-arşiv, abonelik faturası)
- [ ] API key yönetimi (kullanıcı kendi key'ini görür, regenerate edebilir)
- [ ] Rate-limit middleware (Redis sayaç, tier bazlı limit)
- [ ] Premium gate'lenecek özellikler (kapalı kod):

**Adım 7 — Milestone Dashboard**
- [ ] Admin'de "Monetizasyon Tetik" sayfası

### SOCIAL-API-SETUP-CHECKLIST.md

**0.1 — Firma belgeleri (PDF olarak hazır)**
- [ ] **Vergi Levhası** — Gelir İdaresi'nden indirilebilir (interaktif vergi dairesi)
- [ ] **Ticaret Sicil Gazetesi** — firma kuruluş ilanı (ticsicil.gov.tr)
- [ ] **İmza Sirküleri** veya **Yetki Belgesi** — noter onaylı
- [ ] **Firma adresi belgesi** — kira sözleşmesi VEYA elektrik/gas/su faturası (firma adına, son 3 ay)
- [ ] **Yetkili kişi TC kimlik fotoğrafı** (ön+arka, JPG/PNG)
- [ ] **Yetkili kişi selfie** (kimlikle birlikte, doğrulama için)
- [ ] **Firma telefon numarası** — Meta SMS doğrulama için aranabilir/SMS alabilir olmalı

**0.2 — Marka görselleri (Canva veya Figma ile hazırla)**
- [ ] **Logo** — 800x800 PNG transparent (her platform için profil resmi)
- [ ] **Favicon** — 64x64 PNG (zaten var, `/uploads/brand/favicon.png`)
- [ ] **Facebook kapak fotoğrafı** — 1640x856 PNG/JPG
- [ ] **Instagram square** — 1080x1080 PNG/JPG (ilk post için)
- [ ] **Instagram story** — 1080x1920 (template)
- [ ] **YouTube banner** — 2560x1440 PNG/JPG (TV/desktop/mobile uyumlu, "safe area" 1546x423 ortalı)
- [ ] **YouTube watermark** — 150x150 PNG transparent (video köşesi)
- [ ] **YouTube end screen template** — 1920x1080 (son 5 saniye, abone ol + sıradaki video)

**0.3 — Metin içerikleri (Notion/Google Doc'ta hazırla)**
- [ ] **Kısa bio** (50 karakter) — IG için
- [ ] **Orta bio** (160 karakter) — Twitter benzeri
- [ ] **Uzun açıklama** (5000 karakter) — YouTube channel description
- [ ] **Hakkımızda metni** — FB Page Hakkında bölümü
- [ ] **Kategori etiketleri** — her platform için 5-10 hashtag (#halfiyat #toptansebze #toptanmeyve vb.)
- [ ] **İlk post taslakları** — 5-10 hazır içerik (manuel posting için)

**0.4 — Web tarafı hazır olmalı (Meta App Review için ŞART)**
- [ ] **Privacy Policy** — `https://haldefiyat.com/gizlilik-politikasi` ✅ (var)
- [ ] **Terms of Service** — `https://haldefiyat.com/kullanim-kosullari` ✅ (var)
- [ ] **KVKK aydınlatma metni** — `https://haldefiyat.com/kvkk` ✅ (var)
- [ ] **İletişim sayfası** — `https://haldefiyat.com/iletisim` ✅ (var)
- [ ] **Hakkımızda sayfası** — `https://haldefiyat.com/hakkimizda` ✅ (var)
- [ ] **Sosyal medya bağlantıları footer'da** — şimdilik # placeholder OK, sonra güncellenecek

**0.5 — Sahiplik kararı (önceden net olmalı)**
- [ ] **Google Workspace açacak mısın?** — `info@haldefiyat.com` için (önerilir, 200 TL/ay)
- [ ] **Username sırası belirle:**
- [ ] **3 platformda da müsaitlik kontrolü yap** (5 dakika)

**1.1 — Page oluştur**
- [ ] `facebook.com` → giriş yap (info@vistaseeds.com.tr — Workspace üzerinden Google SSO da olabilir)
- [ ] Sağ üst **+ Oluştur → Sayfa**
- [ ] **Sayfa adı:** `HalDeFiyat`
- [ ] **Kategori:** "Haberler ve Medya Web Sitesi"
- [ ] **Bio (255 karakter max):**
- [ ] **Page Oluştur**

**1.2 — Görseller**
- [ ] **Profil resmi** yükle (logo, 360x360+)
- [ ] **Kapak fotoğrafı** yükle (1640x856)
- [ ] **Pinned post:** ilk tanıtım metni + ana sayfa görseli (sonradan)

**1.3 — Bilgiler sekmesi (eksiksiz doldur)**
- [ ] **Hakkında:**
- [ ] **İletişim:**
- [ ] **Mağaza saatleri:** "Her zaman açık" (online platform)

**1.4 — Username (vanity URL)**
- [ ] Profil → Sayfa adresini düzenle → `@haldefiyat`
- [ ] URL doğrula: `facebook.com/haldefiyat`

**1.5 — İlk içerik**
- [ ] 3-5 başlangıç post'u (otomasyon başlamadan önce hesabın "canlı" görünmesi için Meta'nın sevdiği bir şey — boş hesap red riski yüksek)

**2.1 — Hesap aç**
- [ ] `instagram.com/accounts/emailsignup`
- [ ] E-posta: `info@vistaseeds.com.tr`
- [ ] **Username:** `haldefiyat` (alındıysa Aşama 0.5'teki yedek)
- [ ] Şifre: güçlü, kaydet
- [ ] Telefon: firma numarası (SMS doğrulama)

**2.2 — Bio + foto**
- [ ] **Bio (150 karakter):**
- [ ] **Link:** `https://haldefiyat.com` (sadece 1 link, linktr.ee de olur)
- [ ] **Profil resmi:** Facebook ile aynı logo

**2.3 — Professional/Business'a çevir (🔴 KRİTİK)**
- [ ] Settings → **Account → Switch to Professional Account**
- [ ] Category: **News & Media Website** (FB ile aynı)
- [ ] **Business** seç — ❌ Creator değil (API erişimi yok)
- [ ] Mail + telefon doğrula

**2.4 — Facebook Page'e bağla (🔴 KRİTİK)**
- [ ] Profile → **Edit Profile** → **Page** alanında **Connect or Create a Facebook Page**
- [ ] **HalDeFiyat** Page'i seç → Connect
- [ ] Bağlantıyı doğrula: FB Page Settings → Instagram → IG hesabı listede olmalı

**2.5 — İlk içerik**
- [ ] Min 5-10 post (FB ile paralel)
- [ ] Min 3 story (highlight'a kaydedilebilir)
- [ ] 50+ organik takipçi hedef (App Review öncesi)

**3.1 — Google hesabı doğrula**
- [ ] `info@vistaseeds.com.tr` **Workspace** mi yoksa düz Gmail mi?
- [ ] Test: `youtube.com` → sağ üst profil ikonu → "Sign in" → info@vistaseeds.com.tr ile giriş çalışıyor mu

**3.2 — Brand Account ile channel aç**
- [ ] `youtube.com/account` → **Add or manage your channels**
- [ ] **Create a new channel** (alt link)
- [ ] **Use a brand account** seç — ⚠️ kişisel ad yerine MARKA adı
- [ ] Brand name: **HalDeFiyat**
- [ ] Create

**3.3 — Channel customization**
- [ ] **YouTube Studio** → sol menü **Customization**

**3.3.1 — Branding**
- [ ] **Profile picture:** 800x800+ (Facebook/IG ile aynı logo)
- [ ] **Banner image:** 2560x1440 (template'te "safe area" = ortadaki 1546x423 — mobilde de görünür)
- [ ] **Video watermark:** 150x150 transparent PNG (videoların sağ alt köşesinde abone ol butonu)

**3.3.2 — Basic info**
- [ ] **Name:** HalDeFiyat
- [ ] **Handle:** `@haldefiyat` (alındıysa yedek)
- [ ] **Description (5000 char):**
- [ ] **Links** (channel'a görünür ekle):
- [ ] **Contact info:** `info@vistaseeds.com.tr` (business inquiries için)
- [ ] **Country:** Türkiye
- [ ] **Keywords:** hal fiyatları, toptan sebze, toptan meyve, fiyat endeksi, tarım pazarı

**3.3.3 — Layout**
- [ ] **Featured video for non-subscribers:** en yeni rapor videon (1 tane)
- [ ] **Featured video for subscribers:** trailer veya öne çıkan
- [ ] **Featured sections:** Playlistlerinden 3-5 tane (Haftalık Raporlar, Şehir Analizleri, vs.)

**3.4 — Channel doğrulama**
- [ ] YouTube Studio → **Settings → Channel → Feature eligibility**
- [ ] Telefon ile doğrula (SMS) — 15 dk videodan uzun video upload + custom thumbnail için ŞART
- [ ] **Intermediate features** unlock olmalı

**3.5 — Yönetici ekle (Brand Account'un avantajı)**
- [ ] `youtube.com/account` → channel listesi → **HalDeFiyat → Manage permissions**
- [ ] Atakan ve Orhan'ı **Manager** olarak ekle (Owner sadece 1 kişi)

**4.1 — Business Manager oluştur**
- [ ] `business.facebook.com` → giriş (info@vistaseeds.com.tr)
- [ ] **Create Account**:

**4.2 — Asset ekle (Page + IG)**
- [ ] **Business Settings → Accounts → Pages → Add → Claim a Page**
- [ ] HalDeFiyat Page → claim et (admin olduğun için onaylanır)
- [ ] **Accounts → Instagram → Add → Connect**
- [ ] HalDeFiyat IG hesabı login bilgileri ver → connect

**4.3 — Kullanıcı yetkilendirme**
- [ ] **Users → People → Add**
- [ ] **Orhan** (orhanguzell@gmail.com):
- [ ] **Atakan** (atakan07sahin@gmail.com): aynı, Admin

**4.4 — Domain Verification (🔴 KRİTİK — ŞART)**
- [ ] **Brand Safety → Domain Verification → Add domains**
- [ ] `haldefiyat.com` ekle
- [ ] **DNS TXT verification** seç (kolay, kalıcı)
- [ ] Meta'nın verdiği kaydı kopyala (örn. `facebook-domain-verification=abc123xyz...`)
- [ ] **Turhost paneli aç** → DNS Yönetimi → haldefiyat.com
- [ ] Yeni TXT kaydı ekle:
- [ ] Kaydet → 5-30 dk bekle
- [ ] Meta paneline dön → **Verify** butonu → yeşil tik bekle

**4.5 — Business Verification (🔴 1-2 HAFTA SÜREN ADIM)**
- [ ] **Security Center → Business Verification → Start**

**4.5.1 — Adres + telefon doğrulaması**
- [ ] **Business address:** firma resmi adresi (vergi levhasındakiyle aynı)
- [ ] **Business phone:** firma numarası
- [ ] **Verification method:** SMS / Call / Letter (mail) — SMS en hızlı

**4.5.2 — Belgeleri yükle (PDF, her biri max 8MB)**
- [ ] Vergi Levhası → "Tax registration document"
- [ ] Ticaret Sicil Gazetesi → "Business registration document"
- [ ] İmza Sirküleri / Yetki Belgesi → "Articles of incorporation"
- [ ] Adres belgesi (elektrik faturası vs.) → "Utility bill" veya "Business license"

**4.5.3 — Bekleyiş ve sonuç**
- [ ] **1-7 iş günü** Meta inceler
- [ ] Onay → email gelir, yeşil rozet
- [ ] Red → email gelir, sebep belirtilir → düzelt + tekrar başvur (her başvuruda 7 gün)

**Önkoşul**
- [ ] **Business Verification ONAYLANDI** (Aşama 4.5 tamamlandı)

**5.1 — Developer hesabı**
- [ ] `developers.facebook.com` → giriş (info@vistaseeds.com.tr)
- [ ] **Get Started** (developer hesabı önceden yoksa) → telefon doğrula
- [ ] Profile complete

**5.2 — App oluştur**
- [ ] `developers.facebook.com/apps` → **Create App**
- [ ] **App type:** **Business** ← ⚠️ doğru seçim (Consumer değil)
- [ ] **App name:** `HalDeFiyat Otomasyon`
- [ ] **App contact email:** info@vistaseeds.com.tr
- [ ] **Business Account:** HalDeFiyat (Aşama 4'te oluşturduğun)

**5.3 — App settings → Basic**
- [ ] **App Icon:** 1024x1024 PNG (logo, transparent değil — solid background)
- [ ] **Privacy Policy URL:** `https://haldefiyat.com/gizlilik-politikasi`
- [ ] **Terms of Service URL:** `https://haldefiyat.com/kullanim-kosullari`
- [ ] **User Data Deletion URL:** `https://haldefiyat.com/kvkk` (veya yeni endpoint)
- [ ] **App Domain:** `haldefiyat.com`
- [ ] **Business Use:** Description (Meta okur — net yaz):

**5.4 — Products ekle**
- [ ] **Facebook Login for Business** — OAuth flow
- [ ] **Pages API** — Page post yetkisi
- [ ] **Instagram Graph API** — IG post + Reels
- [ ] **Messenger Platform** — DM chatbot (sonra, App Review öncesi başvuruyu basit tut)
- [ ] **Webhooks** — IG DM event listener (Messenger Platform ile gelir)

**5.5.1 — İzin listesi (Advanced Access için)**
- [ ] `pages_show_list` (Standard)
- [ ] `pages_read_engagement` (Standard)
- [ ] `pages_manage_posts` (Advanced — review gerekli) ← Page'e post atma
- [ ] `pages_manage_metadata` (Advanced) ← Page bilgisi güncelleme
- [ ] `instagram_basic` (Standard)
- [ ] `instagram_content_publish` (Advanced — review) ← IG post + Reels
- [ ] `pages_messaging` (Advanced — review, en zor) ← DM chatbot
- [ ] `instagram_manage_messages` (Advanced — review) ← IG DM cevaplama

**5.5.4 — Başvuru ve süre**
- [ ] App Review → **Permissions and Features** → her permission için "Request Advanced Access"
- [ ] Tüm 5 alanı doldur
- [ ] Submit
- [ ] **5-15 gün bekleyiş** (genelde 7-10 gün)
- [ ] Email gelir: onay veya red

**5.5.5 — Red durumunda**
- [ ] Red sebebini OKUDU → eksiği gidert
- [ ] **Tekrar başvur** (1-2 kez normal, 5+ kez ban riski)
- [ ] Meta Community Forum'da benzer red sebeplerine bak

**6.1 — System User oluştur**
- [ ] **Business Settings → Users → System Users → Add**
- [ ] **Name:** `HalDeFiyat Backend`
- [ ] **Role:** Admin (Employee da olur ama Admin daha esnek)

**6.2 — Asset assignment**
- [ ] System User'ı seç → **Add Assets**
- [ ] **Pages:** HalDeFiyat → Full control
- [ ] **Instagram Accounts:** HalDeFiyat IG → Full control
- [ ] **Apps:** HalDeFiyat Otomasyon → Full control

**6.3 — Token generate**
- [ ] System User → **Generate New Token**
- [ ] **App:** HalDeFiyat Otomasyon seç
- [ ] **Token expiration:** **Never** ← (60-day option seçme)
- [ ] **Permissions** (App Review'da onaylananları seç):
- [ ] **Generate**
- [ ] Token görünür → **HEMEN KOPYALA** (1 kez gösterir)

**6.4 — Token'ı sakla**
- [ ] **Password manager**'a kaydet (1Password, Bitwarden vs.)
- [ ] **VPS backend/.env'e ekle:** (sonra, kod hazır olunca)
- [ ] Bu .env değerlerinin **DB site_settings**'e de yazılması gerekecek (admin panel UI için, ileride)

**7.1 — Google Cloud Project**
- [ ] `console.cloud.google.com` → giriş (info@vistaseeds.com.tr)
- [ ] **New Project**:
- [ ] Project ID not et: `haldefiyat-youtube-XXXXX`

**7.2 — YouTube Data API v3 enable**
- [ ] **APIs & Services → Library**
- [ ] Search: "YouTube Data API v3" → **Enable**
- [ ] Quota görünür: 10,000 unit/day default

**7.3 — OAuth consent screen (KRİTİK)**
- [ ] **APIs & Services → OAuth consent screen**
- [ ] **User type:**
- [ ] **App information:**
- [ ] **App domain:**
- [ ] **Authorized domains:** `haldefiyat.com`
- [ ] **Developer contact:** info@vistaseeds.com.tr

**7.4 — Scopes ekle**
- [ ] **Add or remove scopes**
- [ ] Seç:

**7.5 — Test users (Production öncesi)**
- [ ] Test users:
- [ ] Save and continue

**7.6 — App'i Production'a al (YouTube için ŞART)**
- [ ] OAuth consent screen → **Publish App**
- [ ] **Sensitive scopes** kullanıyorsan → **Google verification başvurusu** otomatik açılır
- [ ] Veya **Verification waived** seçeneği — sadece Test users çalışır, 100 user limit (başlangıç için yeter)

**7.7 — OAuth Credentials oluştur**
- [ ] **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
- [ ] **Application type:** **Web application**
- [ ] **Name:** HalDeFiyat YouTube OAuth
- [ ] **Authorized JavaScript origins:**
- [ ] **Authorized redirect URIs:**
- [ ] **Create**
- [ ] Görünür: **Client ID** ve **Client Secret** — KOPYALA, password manager'a kaydet

**8.2 — DB tablosu**
- [ ] `hf_social_posts`:
- [ ] Seed SQL: `backend/src/db/seed/sql/034_social_posts_schema.sql`
- [ ] ⚠️ ALTER TABLE yasak (lokalde) — yeni kolon olursa 034'e ekle, fresh seed et

**8.3 — Admin panel**
- [ ] `/admin/social/` modülü:
- [ ] RTK Query endpoints: createPost, schedulePost, cancelScheduled, listHistory

**8.4 — Cron / scheduler**
- [ ] `backend/src/cron.ts` → yeni job:
- [ ] Her 5 dakikada bir `status='scheduled' AND scheduled_at <= NOW()` postları yayınla

**8.5 — Webhook (DM chatbot için)**
- [ ] Public endpoint: `POST /api/v1/social/webhook/instagram`
- [ ] Meta'ya verifyToken + signature ile doğrula
- [ ] Gelen mesaj → DB log + responses.ts ile auto-reply

**Hafta 1 sonu**
- [ ] 3 sosyal hesap açık ve dolu (bio, foto, 5+ post)
- [ ] Business Manager kurulu, Page+IG bağlı
- [ ] Domain verification ✅
- [ ] Business Verification başvurusu yapılmış (bekleyiş)

**Hafta 2 sonu**
- [ ] Business Verification onayı geldi
- [ ] Meta Developer App oluşturuldu
- [ ] App Review başvurusu yapıldı (en az 2 permission için)
- [ ] Google Cloud project + YouTube API enabled
- [ ] OAuth credentials hazır

**Hafta 3 sonu**
- [ ] Meta App Review onayı (en az pages_manage_posts + instagram_content_publish)
- [ ] System User token alındı, .env'e işlendi
- [ ] YouTube OAuth refresh token alındı
- [ ] Backend modülleri yazılmaya başlandı

**Hafta 4 sonu**
- [ ] İlk otomatik post canlıda (FB veya IG)
- [ ] Admin panel /admin/social/compose çalışıyor
- [ ] Audit log (hf_social_posts) veri topluyor
- [ ] Cron scheduler aktif
