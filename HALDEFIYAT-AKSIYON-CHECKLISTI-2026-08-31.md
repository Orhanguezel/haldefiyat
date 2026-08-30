# HalDeFiyat — Aksiyon Checklist'i (2026-08-31 analiz turu)

> **Kaynak raporlar:** [`reports/analiz-19-30-agustos-2026.pdf`](./reports/analiz-19-30-agustos-2026.pdf) ·
> [`reports/yenileme-etki-analizi-2026-08-31.pdf`](./reports/yenileme-etki-analizi-2026-08-31.pdf)
>
> **Yürütme kaynağı:** Kök checklist [`HALDEFIYAT-KAPSAMLI-UYGULAMA-CHECKLISTI.md`](./HALDEFIYAT-KAPSAMLI-UYGULAMA-CHECKLISTI.md)
> **§16.6** tek satırlık kuyruk olarak durur; bu dosya o satırların **uygulama detayıdır**.
> Bir madde kapanınca **her iki dosyaya da** kanıt (commit + canlı URL + ölçüm) işlenir.
>
> **Eşleme:** A1→S16 · A2→S17 · A3→S6 · A5→S18 · A6→S19 · A7→S20 · A8→S21 · A10→S22 · A13→S23

---

## 0. Kurallar

1. **Ölçülmemiş iş kapanmaz.** Her maddenin "Kabul kriteri" satırı sayısaldır. Doğrulama
   komutu çalıştırılmadan `[X]` konmaz.
2. **Deploy tek yol:** local commit + push → VPS `bash deploy.sh`. Elle `pm2 restart` yok,
   rsync/scp yok. Build çıktısını `head`/`grep`'e pipe'lama (SIGPIPE → 502).
3. **ALTER TABLE yok.** Şema değişikliği `backend/src/db/seed/sql/0XX_*.sql` içindeki
   `CREATE TABLE`'a eklenir, `db:seed:*:fresh` ile kurulur.
4. **Canlı DB'ye elle yazma yok.** İçerik/veri düzeltmesi admin ucundan veya seed'den yapılır.
5. **Ardışık dağıtım yapma.** A3 kapanana kadar bir oturumda tek dağıtım; 19 batch'lik seri
   dağıtım 30 Ağustos'ta 106 adet 5xx üretti.

---

## A1 · Kopya `-2` slug'ları için 301 — **P0**

**Sahip:** Codex (implementasyon) · Claude (doğrulama)
**Etki:** 12 günde 1.765 kayıp Googlebot taraması → link değeri korunur

### Kanıt

| Ölçüm | Değer |
|---|---|
| `-2` sonlu 404 (19–30 Ağu) | **1.765** |
| Bunlardan Googlebot | **1.756 (%99,5)** |
| /firma/* 404 | 1.116 (%99,6 bot) |
| /urun/* 404 | 640 (%92,8 bot) |
| Başlangıç günü | **25 Ağustos** (24 Ağu'ya kadar günde 0–2, 25 Ağu'da 406) |

Canlı doğrulama:

```
/firma/3208-haktan-komisyon-evi-2  → 404      /firma/3208-haktan-komisyon-evi  → 200
/urun/elma-2                       → 404      /urun/elma                       → 200
```

### Kök neden

Benzersiz-slug çakışma çözümü kopya kayıtlara `-2` eki verdi. Bu kayıtlar bir süre yayında
kaldı, Google indeksledi, sonra birleştirme turunda silindiler. Bugün DB'de sadece **2 firma +
1 ürün** `-2` slug'lu; sitemap tertemiz (394 URL, sıfır `-2`). Sorun **canlı değil, tarihsel**.

### Yapılacaklar

- [ ] **A1.1** `frontend/src/app/[locale]/(public)/urun/[slug]/page.tsx` — `notFound()`
      çağrısından **önce** (satır ~271) sayısal-sonek düşürme denemesi ekle:
      slug `/-\d+$/` ile eşleşiyorsa soneki at, taban slug ürün listesinde varsa
      `permanentRedirect(\`/urun/${taban}\`)`.
- [ ] **A1.2** `frontend/src/app/[locale]/(public)/firma/[slug]/page.tsx` — aynı mantık,
      `fetchFirm(slug)` null döndüğünde (satır ~104): taban slug için `fetchFirm` tekrar
      denenir, bulunursa 301.
- [ ] **A1.3** Ortak yardımcı yaz (`frontend/src/lib/slug-fallback.ts`) — iki sayfa aynı
      fonksiyonu çağırsın; kod tekrarı yasağı.
- [ ] **A1.4** `/analiz/elma-fiyat-analizi-mayis-2026` (219 istek) için `hf_redirects`'e
      tekil 301 kaydı gir (admin `POST /api/v1/admin/redirects`).
- [ ] **A1.5** **Yan bulgu — ayrı değerlendir:** `hf_redirects` tablosu sayfa yönlendirmesinde
      **kullanılmıyor**; frontend'de yalnız `frontend/src/app/sitemap.ts` okuyor. Tabloya
      girilen 301'ler sayfa isteğinde uygulanmıyor. Ya route katmanına bağlanmalı ya da
      tablonun kapsamı belgede netleştirilmeli. *(Bu madde A1'i bloke etmez — A1.1/A1.2
      route seviyesinde çalışır.)*

### Kabul kriteri

- `/urun/elma-2` ve `/firma/3208-haktan-komisyon-evi-2` → **301**, hedef kanonik URL.
- Yaşayan 3 istisna **200 dönmeye devam eder**: `2971-huzur-sebze-ve-meyve-komisyon-evi-2`,
  `591-yesil-silvan-2`, `domates-2`.
- Dağıtımdan 7 gün sonra `-2` sonlu 404 sayısı **< 200** (bugün 1.765).

### Doğrulama

```bash
# Dagitim sonrasi anlik
for u in /urun/elma-2 /firma/3208-haktan-komisyon-evi-2 /urun/elma \
         /firma/2971-huzur-sebze-ve-meyve-komisyon-evi-2 /urun/domates-2; do
  printf "%-55s %s\n" "$u" "$(curl -s -o /dev/null -w '%{http_code}' https://haldefiyat.com$u)"
done
# Beklenen: 301 301 200 200 200

# 7 gun sonra kuyruk erimesi
ssh vps-vistainsaat 'zcat -f /var/log/nginx/haldefiyat.access.log* | awk -F\" "
  \$3 ~ / 404 / { p=\$2; sub(/^[A-Z]+ /,\"\",p); sub(/ HTTP.*/,\"\",p); sub(/\?.*/,\"\",p);
  if (p ~ /-2\$/) n++ } END { print \"-2 sonlu 404:\", n }"'
```

### Tuzaklar

- **Yaşayan `-2` kayıtlarını kırma.** Yönlendirme yalnız `-2` kaydı **bulunamadığında**
  devreye girmeli; sıralama zaten bunu garantiliyor (fallback'e ancak arama başarısızsa gelinir).
- **410 verme.** Ölü ürün değil, birleştirilmiş kopya — hedefi olan bir 301. `410` kullanımı
  `deactivateGoneProducts()` tetikleyip ürünü pasife çeker (bkz. `repository.ts:116-123`).
- **Genel `-\d+` kuralı riskli olabilir:** meşru olarak rakamla biten slug varsa (ör. bir
  ürün adı) taban slug bulunamayacağı için zaten 404 kalır — zararsız, ama A1.1 sonrası
  `-2` dışı sonek sayısını bir kez ölçüp gör.

---

## A2 · Menü/altbilgi bağlantılarında prefetch'i kapat — **P0**

**Sahip:** Codex · **Etki:** günde ~39.600 karşılıksız istek → sunucu yükü bir mertebe düşer

### Kanıt

| Katman | 12 gün | Günlük |
|---|---|---|
| İnsan sayfa yolu isteği | 520.699 | 43.392 |
| → RSC prefetch | **475.582 (%91,3)** | 39.632 |
| → Gerçek tam sayfa yüklemesi | 45.117 (%8,7) | 3.760 |

| Sayfa | Prefetch | Gerçek | Oran |
|---|---|---|---|
| /harita | 15.810 | 43 | 368:1 |
| /uyarilar | 15.376 | 31 | 496:1 |
| /gizlilik-politikasi | 14.554 | 29 | 502:1 |
| /metodoloji | 8.087 | 73 | 111:1 |
| /hakkimizda | 3.753 | 36 | 104:1 |

`grep -rn "prefetch" frontend/src --include=*.tsx` **hiçbir sonuç vermiyor** — tüm `<Link>`
Next.js varsayılanıyla (prefetch açık) çalışıyor.

### Yapılacaklar

- [ ] **A2.1** `frontend/src/components/Footer.tsx` — altbilgi `<Link>`lerine `prefetch={false}`.
- [ ] **A2.2** `frontend/src/components/PolicyLinks.tsx` — aynı.
- [ ] **A2.3** `frontend/src/components/header/TopbarClient.tsx` — üst bar ikincil bağlantıları.
- [ ] **A2.4** Kapsam kararı yaz (bu dosyaya): **hangi bağlantılarda prefetch KALIR** —
      ürün kartları, fiyat listesi satırları, hal kartları, arama sonuçları. Bunlar kullanıcının
      gerçekten tıkladığı yollar; prefetch orada hız kazancı.

### Kabul kriteri

- Dağıtımdan 3 gün sonra prefetch payı **%91,3 → %70 altı**.
- Gerçek tam sayfa yüklemesi ve JS pageview **düşmemiş** olmalı (kullanıcı deneyimi bozulmadı).
- Mobil LCP alan verisi `FAST` bandında kalır.

### Doğrulama

```bash
# scratchpad/deep2.awk yeniden calistirilir (gun araligi guncellenerek)
# Beklenen cikti: PREFETCH rsc=... full=...  → rsc/(rsc+full) < 0.70
```

### Tuzaklar

- **Ana içerik bağlantılarını kapatma.** Prefetch'in tamamen kapatılması ürün/fiyat gezinmesini
  yavaşlatır ve LCP'yi geri bozar. Yalnız menü/altbilgi.
- Ölçüm karşılaştırmasını **aynı hafta günleriyle** yap; hafta sonu sayfa/oturum farklı.

---

## A3 · Dağıtım kesinti koruması — **P1** *(kök checklist S6)*

**Sahip:** Claude (tasarım) → Codex (uygulama) · **Etki:** kesintilerin %98'i ortadan kalkar

### Kanıt

| Gün | 5xx | 499 | Ne oldu |
|---|---|---|---|
| 19 Ağu | 237 | 278 | 30+ commit'lik dağıtım günü |
| 24 Ağu | 103 | 261 | Firma modülü + 28 GB bayat release temizliği |
| 27 Ağu | 10 | 182 | — |
| 30 Ağu | 106 | **810** | 19 ardışık fotoğraf batch dağıtımı |
| **Kalan 8 gün** | **7** | — | — |

Toplam 463 5xx'in **456'sı 4 dağıtım gününde**. Altyapı stabil; sorun prosedürde.

### Yapılacaklar

- [ ] **A3.1** `deploy.sh` admin build adımına bellek sınırı:
      `NODE_OPTIONS=--max-old-space-size=<N>` (Turbopack admin build'i 2,2 GB, kutu 7,9 GB).
- [ ] **A3.2** Alternatif/tamamlayıcı: build sırasında 1 frontend cluster worker'ını geçici
      durdur, build bitince geri aç.
- [ ] **A3.3** **Prosedür kuralı (kod değil):** ardışık içerik dağıtımlarını (fotoğraf batch'leri
      gibi) tek commit + tek dağıtımda topla. 30 Ağustos'taki 19 ayrı dağıtım tek seferde
      yapılabilirdi.
- [ ] **A3.4** `deploy.sh` sonunda 5xx sayacı: dağıtım penceresinde oluşan 5xx'i logdan sayıp
      çıktıya yaz — regresyon sessiz kalmasın.

### Kabul kriteri

Sonraki 3 dağıtım gününde toplam 5xx **< 20** (bugünkü ortalama dağıtım günü başına 114).

### Tuzaklar

- **Admin build'i art arda tekrar deneme** — ikinci OOM'da pm2 daemon'ı da düşürdü (~30 sn 502).
- Admin'de değişiklik yoksa düşen admin adımı zararsız, dağıtımı tekrarlama.
- Build çıktısını `head`/`grep`'e pipe'lama.

---

## A4 · İlk dış reklamvereni kazan — **P1**

**Sahip:** **Orhan + Atakan** (kod işi değil) · **Etki:** 0 TL → ilk gelir

### Kanıt

| Gösterge | 19–30 Ağu | 7–18 Ağu |
|---|---|---|
| Banner gösterimi | 35.447 | 24.404 |
| Tıklama (CTR) | 36 (%0,10) | 25 (%0,10) |
| **Gelir** | **0 TL** | 0 TL |
| Dış ücretli reklamveren | 0 | 0 |
| Dolu slot | 7/14 (hepsi kendi marka + affiliate) | 7/14 |
| Self-service talep / bekleme listesi | 0 / 0 | 0 / 0 |

Malzeme **19 Ağustos'tan beri hazır**: `reports/haldefiyat-medya-kiti-2026-08.pdf`,
canlı indirme `haldefiyat.com/files/haldefiyat-medya-kiti-2026-08.pdf`, `/reklam-ver`
sayfasında canlı rakam şeridi.

### Yapılacaklar

- [ ] **A4.1** Medya kitindeki boş fiyat alanlarını doldur (Orhan/Atakan kararı).
- [ ] **A4.2** İlk temas listesi çıkar (Atakan'ın 250+ kişilik sektör ağından 20 hedef).
- [ ] **A4.3** Medya kitini gönder — ilk tur.
- [ ] **A4.4** En yüksek CTR'li pozisyonları teklifte öne çıkar: `analiz_sidebar` %0,61 ·
      `prices_top` %0,58 · `home_mid` %0,32. *(Uyarı: bu üçü de 1.000 gösterimin altında —
      teklifte "erken dönem göstergesi" olarak sun, garanti olarak değil.)*

### Kabul kriteri

En az **1 ödeme durumu `paid`/`partial` banner** kaydı (`hf_ad_payments` boş olmaktan çıkar).

---

## A5 · /analiz başlık ve açıklamalarını yeniden yaz — **P1**

**Sahip:** Claude (metin) · **Etki:** en ucuz organik kazanç

### Kanıt

| Bölüm | Tıklama | Gösterim | CTR |
|---|---|---|---|
| Site ortalaması | 6.120 | 198.046 | **%3,09** |
| **/analiz/\*** | **91** | **8.022** | **%1,13** |
| /borsa + /et-fiyatlari + /canli-hayvan-fiyatlari | 10 | 1.855 | **%0,54** |

İçerik aranıyor, sonuçlarda görünüyor, tıklanmıyor. Sorun sıralama değil — başlık/açıklama.

### Mekanizma (doğrulandı)

`hf_analysis_reports` tablosunda `meta_title` ve `meta_description` kolonları var.
Sayfa `frontend/src/app/[locale]/(public)/analiz/[slug]/page.tsx:77-78` şunu kullanıyor:
`makale.metaTitle || makale.baslik`. Yani **kod değişikliği gerekmiyor** — veri işi.

### Yapılacaklar

- [ ] **A5.1** 21 yayınlanmış raporun `meta_title`/`meta_description` alanlarını doldur.
      Ölçüt: başlık 50–60 karakter, içinde **sayı veya tarih** (CTR'yi en çok bu yükseltiyor —
      bkz. "salcalik domates fiyati 2026" %8,37).
- [ ] **A5.2** Aynısını yeni dikeyler için: `/borsa`, `/et-fiyatlari`, `/canli-hayvan-fiyatlari`
      sayfa metadata'sı (bunlar DB'de değil, `seo_pages` katmanında — page-key çakışmasına dikkat).
- [ ] **A5.3** Haftalık otomatik rapor üreticisine `meta_title` üretimi ekle
      (`backend/scripts/seo/generate-weekly-report.ts`) — yeni raporlar boş gelmesin.
- [ ] **A5.4** **Ayrı bulgu:** 31 Ağustos haftalık raporu (`agustos-5-hafta`) üretilmemiş;
      son yayın 24 Ağustos. Cron'u kontrol et.

### Kabul kriteri

4 hafta sonra /analiz bölümü CTR **%1,13 → %2,00 üzeri**.

### Doğrulama

`scratchpad/gsc-query.py` benzeri sorgu ile bölüm bazlı CTR; ya da admin GSC panelinden.

### Tuzaklar

- **Page-key çakışması:** `getPageMetadata` DB `seo_pages` şablonu sayfa override'ını ezebiliyor
  (bkz. hafıza kaydı: detay sayfaları liste key'ine çarpmasın).
- Başlığa marka adı gömme — marka kuralı gereği görünen metin veriden gelir.

---

## A6 · Bülten teklifini yeniden yaz — **P1**

**Sahip:** Claude (metin) → Codex (uygulama) · **Etki:** funnel'ın son halkası

### Kanıt

| Ölçüm | 19–30 Ağu | 7–18 Ağu |
|---|---|---|
| CTA gösterimi | 636 | 757 |
| Forma odaklanma | **8** | 16 |
| Gönderim → başarılı kayıt | 2 | 6 |
| **Dönüşüm** | **%0,31** | %0,79 |
| Toplam abone | 24 | 22 |

Placement kırılımı (19–30 Ağu): `mobile_home_sticky` 324 gösterim → **0 kayıt** ·
`price_list_strip` 225 → 1 · `live_price` 24 → 1 · `home_mobile` 42 → 0 · `home_bottom` 21 → 0.

GA4 tarafı: forma **başlayanın %72,7'si tamamlıyor**. Yani form çalışıyor; sorun forma
gelen kişi sayısında — 636 gösterimde sadece 8 kişi ilgilendi.

### Yapılacaklar

- [ ] **A6.1** Vaadi somutlaştır. Bugünkü metin genel; kullanıcı ne alacağını bilmiyor.
      Öneri yön: "Her pazartesi sabahı: takip ettiğin ürünlerin haftalık fiyat değişimi."
      — sıklık + içerik + kişiselleştirme üçü de açık.
- [ ] **A6.2** `mobile_home_sticky` 324 gösterimde 0 kayıt veriyor — **en çok gösterilen,
      en az dönüştüren yüzey**. Ya metni değiştir ya yüzeyi kaldır; mevcut hâli gösterim
      sayısını şişirip dönüşüm oranını düşürüyor.
- [ ] **A6.3** Bileşenler: `frontend/src/components/sections/CtaNewsletter.tsx` ·
      `MobileHomeNewsletterCta.tsx` · fiyat listesi şeridi · `LivePriceNewsletter`.
- [ ] **A6.4** Tek değişken test et — aynı anda hem metin hem yerleşim değiştirme, hangisinin
      işe yaradığı ölçülemez.

### Kabul kriteri

2 hafta sonra dönüşüm **%0,31 → %0,79 üzeri** (önceki seviyeye dönüş), odaklanma sayısı 8 → 20+.

---

## A7 · Şehir–ürün kesişim sayfalarını çoğalt — **P2**

**Sahip:** Claude (içerik) → Codex (config) · **Etki:** en yüksek CTR'li sorgu ailesi

### Kanıt

| Sorgu | Tıklama | Gösterim | CTR | Pozisyon |
|---|---|---|---|---|
| **malatya hal komisyoncuları** | 22 | 46 | **%47,83** | 1,0 |
| **polatlı soğan fiyatları** | 16 | 59 | **%27,12** | 3,7 |
| bursa sebze meyve hali fiyatları | 18 | 169 | %10,65 | 5,0 |
| gaziantep sebze hali fiyatları | 16 | 148 | %10,81 | 5,2 |
| mersin halinde limon fiyatları | 18 | 236 | %7,63 | 5,4 |
| *(kıyas)* limon fiyatları | 30 | 1.824 | **%1,64** | 5,8 |
| *(kıyas)* ankara hal fiyatları | 20 | 1.072 | %1,87 | 4,7 |

Özgüllük arttıkça CTR 30 kata kadar çıkıyor.

### Mekanizma

`frontend/src/lib/piyasa.ts` içindeki `PIYASA_PAGES` config'i — yeni sayfa = yeni kayıt.
Şablon 19 Ağustos'ta `erdemli-limon` ile kuruldu ve çalışıyor (/piyasa dönemde 24 tıklama /
1.077 gösterim aldı, açıldığı ilk haftada).

### Yapılacaklar

- [ ] **A7.1** Aday listesi çıkar: GSC'de **pozisyon ≤ 10 + gösterim ≥ 100 + CTR < %3** olan
      şehir–ürün sorguları. Bunlar "görünüyor ama tıklanmıyor" — sayfa açmaya değer.
- [ ] **A7.2** İlk parti (öneri, mevsim penceresine göre): mersin/erdemli limon (var),
      **polatlı soğan**, **gaziantep sebze hali**, **bursa sebze meyve hali**, malatya komisyoncu.
- [ ] **A7.3** Her sayfa için sitemap + IndexNow bildirimi (mevcut akış).
- [ ] **A7.4** `/urun/[slug]` sayfalarından ilgili piyasa sayfasına iç link kartı.

### Kabul kriteri

6 hafta sonra `/piyasa/*` bölümü **250+ organik tıklama** (bugün 24).

---

## A8 · `/firmalar?…` parametreli URL'leri kanonikleştir — **P2**

**Sahip:** Codex · **Etki:** tarama bütçesi + indeks temizliği

### Kanıt

- Dönemde **439 farklı sayfa** arama sonuçlarında gösterim aldı; sitemap'te **394 URL** var.
- Fark: `/firmalar?city=mersin&type=komisyoncu&view=list&page=4` gibi **60'tan fazla**
  parametre kombinasyonu ayrı ayrı indeksleniyor.
- Aynı bölüm hem en yüksek CTR'li (%4,37) hem Googlebot 404'lerinin ana kaynağı.

### Yapılacaklar

- [ ] **A8.1** `/firmalar` ve `/firmalar/[slug]` sayfalarında `canonical` etiketi parametresiz
      temiz yola işaret etsin.
- [ ] **A8.2** `view=` ve `page=` gibi sunum parametreleri için `robots: noindex, follow`
      (içerik aynı, sıralama farklı).
- [ ] **A8.3** `city`/`type` gibi **gerçek içerik** üreten parametreler için karar ver:
      ya kalıcı yol segmentine taşı (`/firmalar/mersin/komisyoncu` — bu zaten var ve
      GSC'de görünüyor) ya da canonical ile o yola işaret et.

### Kabul kriteri

4 hafta sonra gösterim alan sayfa sayısı sitemap URL sayısına yaklaşır (439 → ~400) ve
parametreli URL'ler GSC sayfa listesinden düşer.

### Tuzaklar

- `/firmalar/{şehir}` sayfaları **en iyi çalışan SEO varlığı** (1.084 tıklama, %4,37 CTR) —
  yanlışlıkla noindex'leme. Yalnız sunum parametreleri hedeflenecek.

---

## A9 · Süresi dolmuş ilanları yenile veya bölümü gizle — **P2**

**Sahip:** Orhan (içerik kararı) → Codex (uygulama)

### Kanıt

| Ölçüm | Değer |
|---|---|
| Toplam ilan | 5 — **hepsi `expired`** |
| `approved` durumda ilan | **0** |
| Dönemde yeni ilan | 0 |
| İlan sorusu / arama talebi | **0 / 0** |
| /ilan* sayfa isteği | 4.517 |
| GSC | `/ilanlar` 1 tıklama / 3 gösterim |

Canlı sitede gösterilecek tek aktif ilan yok, ama bölüm menüde duruyor ve 4.517 istek alıyor.

### Yapılacaklar

- [ ] **A9.1** Karar: ilan modülü **yaşayacak mı**? (Kod işi değil — Orhan.)
- [ ] **A9.2** Yaşayacaksa: mevcut 5 ilanın `valid_until` süresini uzat veya yeni ilan gir;
      ilan girişini firma sahiplenme funnel'ına bağla.
- [ ] **A9.3** Yaşamayacaksa: menüden ve ana sayfadan kaldır, `/ilanlar` sayfasını
      "yakında" yerine tamamen gizle. Boş bölüm ziyaretçiye "burası ölü" mesajı veriyor.

### Kabul kriteri

Ya **≥ 3 aktif (`approved`, süresi dolmamış) ilan**, ya da bölüm gezinmeden tamamen kalkmış.

---

## A10 · Sessiz ETL başarısızlıklarını hata olarak işaretle — **P2**

**Sahip:** Codex · **Etki:** sağlık raporu gerçeği söylesin

### Kanıt

| Ölçüm | 19–30 Ağu | 7–18 Ağu |
|---|---|---|
| ETL çalışması | 708 | 659 |
| Raporlanan hata | 5 (%0,7) | 13 (%2,0) |
| **Kısmi (partial)** | **168 (%24)** | 59 (%11) |
| Veri üreten hal/market | 38 / 63 (**%60**) | 40 |

**`status=ok` dönüp 0 satır üreten 10 kaynak:** `antalya_merkez_antkomder`,
`antalya_serik_antkomder`, `antalya_kumluca_antkomder`, `corum_resmi`, `tobb_borsa_eskisehir`,
`tobb_borsa_nevsehir`, `tobb_borsa_ordu`, `tobb_borsa_sanliurfa`, `tobb_borsa_adana`,
`tobb_borsa_yozgat`.

Sağlık raporu bunları sorunlu göstermiyor — **"708 run / 5 hata" rakamı bu yüzden iyimser.**

### Yapılacaklar

- [ ] **A10.1** `backend/scripts/etl-health.sh` — yeni uyarı sınıfı: `status='ok'` **AND**
      `rows_inserted=0` → "Sessiz Başarısızlık" bölümünde listele.
- [ ] **A10.2** `partial` oranı sıçramasını incele (%11 → %24). Hangi kaynaklar kısmi dönüyor,
      neden — kısmi de veri kaybı demek.
- [ ] **A10.3** Bilinen "by-design 0 satır" kaynakları (`ETL_HEALTH_IGNORE_EMPTY_SOURCES`
      env'i zaten var) yeni uyarıdan da muaf tutulsun; muafiyet listesi rapor çıktısında
      **görünür** olsun (sessizce gizleme).

### Kabul kriteri

`etl-health.sh 24` çıktısında "Sessiz Başarısızlık" bölümü var ve 10 kaynağı listeliyor.

---

## A11 · Bayat ve arızalı kaynakları onar — **P2**

**Sahip:** Codex

### Kanıt

| Kaynak | Durum |
|---|---|
| `tekirdag_resmi` | Son veri **2026-08-01 — 29 gün** |
| `balikesir_resmi` | Son veri 2026-08-21 — 9 gün (2 adımlı CSRF, bilinen açık) |
| `bolu_resmi` | Son veri 2026-08-14 — 16 gün *(haftalık kaynak, normal olabilir)* |
| `polatli_borsa` | Dönemde **3× HTTP 500** (20, 24, 26 Ağu) |
| `tokat_resmi` | 26 Ağu timeout (tek olay) |

### Yapılacaklar

- [ ] **A11.1** `tekirdag_resmi` — ID-bazlı sayfa; `date: "id:NNN"` backfill formatı mevcut.
      Listeleme sayfası mı değişti, ID mi ilerlemiyor, tespit et.
- [ ] **A11.2** `polatli_borsa` — kaynak sunucu 500 veriyor (`bulten.polatliborsa.org.tr`).
      Geçici mi kalıcı mı; kalıcıysa yeni endpoint ara veya kaynağı devre dışı bırak.
- [ ] **A11.3** `bolu_resmi`'nin haftalık olduğunu doğrula; öyleyse bayat listesinden muaf tut.

### Kabul kriteri

`tekirdag_resmi` son 7 günde ≥ 1 gün veri üretmiş; `polatli_borsa` ardışık hata serisi kırılmış.

---

## A12 · Sunucu yanıt süresi (TTFB) — **P2**

**Sahip:** Codex · **Etki:** alan verisinde kalan tek zayıf metrik

### Kanıt

Alan verisi (CrUX p75, gerçek kullanıcılar):

| Metrik | Değer | Durum |
|---|---|---|
| LCP | 2.337 ms | `FAST` |
| INP | 160 ms | `FAST` |
| CLS | 0 | `FAST` |
| FCP | 2.276 ms | `AVERAGE` |
| **TTFB** | **1.288 ms** | **`AVERAGE`** |
| Genel | — | `AVERAGE` |

Laboratuvar: mobil performans 91, masaüstü 100, TBT 0 ms. Yani **istemci tarafı çözülmüş**,
kalan gecikme sunucuda. Lighthouse fırsatları: render-blocking (~730 ms),
image-delivery (~163 KiB), legacy-javascript (~13 KiB), server-response-time (87 ms lab).

### Yapılacaklar

- [ ] **A12.1** A2 (prefetch) **önce** yapılsın — günde 39,6 bin isteğin kalkması TTFB'yi
      kendiliğinden düşürebilir. A12'yi A2'den **sonra** yeniden ölç.
- [ ] **A12.2** Ölçüm hâlâ `AVERAGE` ise: en çok istenen yolların (`/`, `/fiyatlar`,
      `/urun/[slug]`) sunucu tarafı önbelleklemesi.
- [ ] **A12.3** Render-blocking kaynakları (~730 ms) — kritik CSS/JS ayrımı.

### Kabul kriteri

CrUX TTFB p75 **< 800 ms** (`FAST` eşiği) → genel CrUX kategorisi `FAST`.

### Tuzak

Alan verisi **28 günlük kayan pencere** — değişikliğin etkisi 3–4 hafta gecikmeli görünür.
Erken ölçüp "işe yaramadı" deme.

---

## A13 · Karantina sıçramasını açıkla — **P3**

**Sahip:** Claude (teşhis)

### Kanıt

`hf_price_quarantine` toplam **552 kayıt**, bunun **427'si (%77) 19–30 Ağustos'ta** düştü.
Aynı dönemde `avg_price` sentetik (midpoint) oranı %79'dan **%69,5'e** indi.

İki olasılık, hangisi olduğu belirlenmedi:
1. Yeni/sıkılaştırılmış bir kalite kuralı devreye girdi (iyi haber — sistem çalışıyor),
2. Bir kaynak bozuk veri üretmeye başladı (kötü haber — sessiz veri kaybı).

### Yapılacaklar

- [ ] **A13.1** `hf_price_quarantine` sebep (`reason`) ve `source_api` kırılımına bak.
- [ ] **A13.2** Tek kaynakta toplanıyorsa → o kaynağın parser'ı bozulmuş, A11 kapsamına al.
- [ ] **A13.3** Kurala göre dağılmışsa → beklenen davranış, belgeye not düş ve kapat.

### Kabul kriteri

Sebep tek cümleyle yazılmış ve ya A11'e devredilmiş ya da "beklenen" olarak kapatılmış.

---

## Doğrulama Takvimi

| Tarih | Ne ölçülecek | Hangi maddeler |
|---|---|---|
| Dağıtımdan hemen sonra | `-2` URL'leri 301 dönüyor mu; 3 istisna 200 mü | A1 |
| Dağıtım + 3 gün | Prefetch payı %70 altı mı; pageview düşmedi mi | A2 |
| **7 Eylül** | `-2` sonlu 404 < 200 mü | A1 |
| **14 Eylül** | Bülten dönüşümü %0,79'a döndü mü | A6 |
| **28 Eylül** | /analiz CTR %2 üzeri mi; parametreli URL'ler düştü mü | A5, A8 |
| **12 Ekim** | /piyasa 250+ tıklama; CrUX TTFB `FAST` mi | A7, A12 |
| **Kasım başı** | AI crawler kanalı tut/kıs kararı *(kök checklist S13/S24)* | — |

## Ölçüm Komutları

Bu turda kullanılan araçlar sonraki ölçümde tekrar kullanılabilir:

```bash
# Donem trafik raporu (md iskeleti + veri tablolari)
cd backend/scripts && ./traffic-report.sh --from 1 --to 15 --month Sep --year 2026 [--pdf]

# ETL sagligi
ssh vps-vistainsaat '/var/www/tarim-dijital-ekosistem/projects/hal-fiyatlari/backend/scripts/etl-health.sh 24'

# Prefetch / 404 kuyrugu / organik inis kirilimi
#   scratchpad'deki deep.awk + deep2.awk — gun araligini guncelleyip VPS'te calistir

# Search Console (site_settings OAuth ile) — gsc-query.py
#   NOT: 2026-08-31'de google_ads_refresh_token ile token yenileme HTTP 400 verdi.
#   Calisan yol: backend'in kendi google-oauth yardimcisi
#   (packages/shared-backend/modules/_shared/google-oauth.ts).

# PageSpeed (anahtar backend/.env icinde GOOGLE_PSI_API_KEY)
curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https%3A%2F%2Fhaldefiyat.com%2F&strategy=mobile&category=performance&key=$KEY"
```

## Kapsam Dışı — Bilinçli Bırakılanlar

| Konu | Neden şimdi değil |
|---|---|
| `avg_price` %69,5 sentetik | Bilinen büyük açık iş; ayrı checklist'te (`docs/checklists/DONMUS-HAL-VERISI-DUZELTME.md`). Bu turun kapsamı dışında ama **her fiyat ortalamasını etkilediği** unutulmamalı. |
| Audit rollup tablosu (S5) | Devam eden teknik borç, bu turun bulgularıyla ilgisiz. |
| Kayseri ETL (S7) | AngularJS AJAX reverse-engineering; tarayıcı oturumu gerektiriyor. |
| GEO skoru 46/100 | Kasım'daki AI-kanal kararının girdisi (S24); şimdi aksiyon değil, veri toplama dönemi. |
| Elde tutma / geri getirme mekanizması | A6 bunun ilk adımı. Bildirim/push stratejisi ayrı bir tasarım işi — bülten dönüşümü düzelmeden açılmamalı. |
