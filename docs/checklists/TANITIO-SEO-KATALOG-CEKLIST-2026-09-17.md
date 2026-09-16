# Tanitio SEO kataloğu (17.09.2026) — çözüm checklist'i

**Kaynak:** `haldefiyat-seo-katalog.pdf` — Tanitio Site Sağlığı denetimi
`f60ecc04`, 10 sayfalık örneklem, 1.145 kontrol satırı (714 uygun · 74
iyileştirme · 3 sorun · 354 bilgi), 6 SEO bulgusu. Teknik SEO **78,9** ·
GEO hazırlığı **51,2**. CrUX (origin, 18 Ağu–14 Eyl): LCP 2.439 ms · INP 146 ms
· CLS 0 — üçü de "iyi".

**Nasıl okundu:** her bulgu canlı HTML, kod ve DNS ile çapraz doğrulandı. Aşağıda
her madde üç sınıftan birinde: **GERÇEK** (yapılacak), **ARTEFAKT** (analizörün
yanlış okuması — Tanitio tarafına not), **UYGULANMAZ** (bu site türü için
anlamsız, gerekçesi yazılı). Durum sütunu bu dosyada güncellenir.

Örneklem: `/`, `/canli-hal-fiyatlari`, `/urun/kuru-uzum`, `/piyasa/{erdemli-limon,
adana-mayer-limon, adana-limon, mersin-limon}`, `/fiyat/{adana,konya,kayseri}/limon`.

---

## A. Puanı düşüren 6 bulgu

| # | Bulgu | Kayıp | Sınıf | Aksiyon | Sahip | Durum |
|---|---|---|---|---|---|---|
| A1 | İçerik kalitesi ve özgünlük 51/100 | **−12,74** | karma | Bkz. §B (alt maddelere bölündü) | kod+içerik | ⬜ |
| A2 | Otorite ve güven (E-E-A-T) 72,6/100 | −5,48 | karma | Bkz. §C | kod+insan | ⬜ |
| A3 | İç linkler 72,2/100 | −1,67 | GERÇEK | `/piyasa/*` sayfaları yalnız **6** iç link veriyor (`/fiyat/*` 49). Piyasa sayfaları birbirine, ilgili `/fiyat/<şehir>/<ürün>`'e ve analize gövdeden link versin; hub'lar (A4/A5) açılınca her sayfa hub'a bağlansın | kod | 🟡 hub + kardeş şerit + köken linkleri eklendi (`951f6b84`, `cd931b05`, sonraki commit); yeniden tarama ile ölçülecek |
| A4 | `/fiyat/` kök sayfası yok | düşük | GERÇEK — canlıda **404**, sitemap'te **454** sayfa (katalog 50 URL'lik keşif örneğinde 42 saydı) | `/fiyat` hub: 16 şehir × ürün çiftlerini şehir gruplu listeleyen giriş sayfası; `city-products?eligible=1` zaten var. Sitemap'e ekle, `/rehber` hub deseni kopyalanır | kod | ✅ `/fiyat` canlı 200, sitemap'te, breadcrumb bağlı (`951f6b84`) |
| A5 | `/piyasa/` kök sayfası yok | düşük | GERÇEK — canlıda **404**, 5 sayfa | `/piyasa` hub: `PIYASA_PAGES` config'inden 5 kartlık giriş sayfası + kısa açıklama; sitemap'e ekle | kod | ✅ `/piyasa` canlı 200, sitemap'te, breadcrumb bağlı (`951f6b84`) |
| A6 | 6 sayfada aynı og:image (`/og/default`) | düşük | GERÇEK ama bilinçli | 16 Eyl'de 201 eksik kapak `og/default`'a bağlandı; bu 6 sayfa o "jenerik kapak" kalıntısı. `/og/piyasa/[slug]` rotası `og/urun` deseniyle yazılır; `/canli-hal-fiyatlari` ve `/urun/kuru-uzum` elle kapak | Codex ([OG-KAPAK-EKSIKLERI-CODEX-NOTU.md](../../OG-KAPAK-EKSIKLERI-CODEX-NOTU.md)) | ⬜ |

---

## B. İçerik kalitesi (A1'in açılımı)

Katalog her sayfada aynı beş "içerik eylemi"ni tekrarlıyor. Site türüne göre
ayrıştırıldı:

| # | Katalog eylemi | Sınıf | Gerekçe / aksiyon | Sahip | Durum |
|---|---|---|---|---|---|
| B1 | **Citability**: 10 sayfanın 10'unda `optimal blocks = 0` (puan 18–31). GEO'da ağırlığı %25 — GEO 51,2'nin ana sebebi | GERÇEK | Her H2'nin hemen altına 40–60 kelimelik, **birimli rakam** içeren, tek başına alıntılanabilir bir cevap paragrafı. `/piyasa/*` ve `/fiyat/*` **şablon** olduğu için bir kez yazılır, 459 sayfaya yayılır. Canlı sayıdan üretilir (`product-price-summary`), sabit iddia yazılmaz | kod | ✅ canlı: köken bloğu DOM'da 1 kez, canlı sayıyla (`cd931b05`); citability puanı yeniden taramada ölçülür |
| B2 | "Başlık/açıklamadaki 10 kavram gövdede zayıf" — 10 sayfanın 10'unda | GERÇEK | `/piyasa/*` açıklaması "yerel kaydın durumu, Türkiye hal fiyatları, çeşit ve birim ayrımı" diyor, gövde bu kelimeleri kullanmıyor. Şablon intro'suna açıklamadaki kavramları taşı; `/canli-hal-fiyatlari` için "canlı / gerçek zamanlı / şehir bazında" gövdeye girsin | kod | ✅ canlı (`cd931b05`); yeniden tarama ile ölçülür |
| B3 | `/canli-hal-fiyatlari` **229 kelime, ana metin kapsamı %51 → "Sınırda"**; güven 7/11; citability 20 | GERÇEK | Ads kampanyasının #1 landing'i. 300+ kelime ve 3 H2: "Canlı ne demek" (ETL saati, T-1 yayın, kaynak sayısı), "Nasıl okunur" (min/ort/maks, birim), "Hangi hal ne zaman günceller". Rakamlar canlı veriden | kod+içerik | ✅ canlı: görünür kelime 229 → **605**, 3 yeni H2 (`cd931b05`) |
| B4 | "Birinci-el veri / özgün gözlem ekleyin" | GERÇEK ama zaten var — analizör görmüyor | Sitenin tamamı birinci-el ölçüm (58 hal, günlük ETL). Sinyal "kendi ölçümümüz" cümlesiyle **açıkça** yazılmalı: `/piyasa/*` ve `/fiyat/*`'a "Bu sayfadaki N kayıt HaldeFiyat'ın <hal> bülteninden <tarih> itibarıyla derlediği kendi verisidir" satırı (B1 ile aynı şablon işi) | kod | ✅ canlı: "Bu sayfadaki veri HaldeFiyat'ın kendi ölçümüdür" + kayıt sayısı + son tarih (`cd931b05`) |
| B5 | "Müşteri yorumu / sosyal kanıt" (10/10 eksik) | UYGULANMAZ | Veri yayıncısı, e-ticaret değil. Kataloğun kendisi uyarıyor: "sırf puan için Review/AggregateRating eklemeyin". Yapılmayacak | — | ✅ karar |
| B6 | "Güvence: iade, garanti, güvenli ödeme, sertifika" (7/10 eksik) | UYGULANMAZ | Satış yok. Yakın karşılığı olan şey **veri güvencesi** zaten var (`/metodoloji`, `/veri-kaynagi-politikasi`, CC BY 4.0). `/piyasa` ve `/fiyat` şablonuna metodoloji linki + "kaynak, tarih ve birim her satırda etiketli" cümlesi — B4 ile birleşir | kod | ✅ canlı (`cd931b05`) |
| B7 | Ana sayfada `null` %11 yoğunluk, tutarlılık **10/100** (Sorun) | **ARTEFAKT + gerçek yan etki** | Analizör `self.__next_f.push` RSC yükünü metin sandı: `null·slug·cityname·sourcekey…` 39'ar kez. Google script içeriğini saymaz. **Ama** yükün kendisi gerçek: `CitySelector` 58 halin 14 alanını (address, phone, founded, hours, sourceKey, updatedAt…) client'a gönderiyor, bileşen yalnız `cityName`+`regionSlug`+`slug` kullanıyor — 28 KB → ~4 KB | kod (yük) + Tanitio (ayrıştırıcı) | ✅ RSC yükü 28 KB → 0 (founded/sourceKey 58→0), HTML 328→314 KB (`951f6b84`) |
| B8 | `/canli-hal-fiyatlari` 34/100, `/urun/kuru-uzum` 33/100 tutarlılık (Sorun) | yarı GERÇEK | canli: "İlk 3 kelime title'da 0/3" — sayfa ince olduğu için en sık kelimeler (sebze, meyve) başlıkla örtüşmüyor; B3 çözer. kuru-uzum: gövde tablo ağırlıklı; "kuru üzüm" ve "İTB" başlıkta, gövdede seyrek — 2 cümle intro yeter | kod | ✅ kuru-uzum görünür kelime 473 → 731, "kuru üzüm"+"İTB" intro'da (`cd931b05`) |

---

## C. E-E-A-T (A2'nin açılımı)

| # | Sinyal | Eksik olduğu sayfa | Sınıf | Aksiyon | Sahip | Durum |
|---|---|---|---|---|---|---|
| C1 | `experience` — deneyim anlatımı | canli, kuru-uzum, piyasa ×4 | GERÇEK | "N yıldır / N kaynaktan / günde N kayıt" gibi süreç cümlesi şablona (B4 ile aynı satır) | kod | ✅ canlı (`cd931b05`) |
| C2 | `reviews`, `trust` | 10/10 | UYGULANMAZ | Bkz. B5, B6 | — | ✅ karar |
| C3 | Schema / H1 uyumu "Farklı" | canli, kuru-uzum, piyasa ×4 | GERÇEK, mekanik | Analizör ilk adlı varlığı H1 ile kıyaslıyor: canli'de Dataset adı "Canlı Türkiye Hal Fiyatları" vs H1 "Türkiye canlı hal fiyatları"; piyasa'da adlı WebPage hiç yok. Her sayfaya `WebPage{name: <H1>}` ekle (`JsonLd` bileşeni var) | kod | ✅ canlı: `WebPage{name}` canli, kuru-uzum, piyasa×5 (`cd931b05`) |
| C4 | GEO **brand 0/100** (ağırlık %20) — "verified profiles: kayıt yok" | site geneli | GERÇEK, insan işi | Analizör doğrulanmış varlık arıyor (Wikidata / LinkedIn şirket / YouTube / Crunchbase). Bugün yalnız FB+IG+X sayılıyor (platform 60). Wikidata öğesi (HaldeFiyat, GZL Teknoloji, `sameAs` ile) + LinkedIn şirket sayfası + YouTube kanalı; sonra `Organization.sameAs`'e ekle | Orhan/Atakan | ⬜ |
| C5 | `Person` şeması var (Atakan Şahin), `author/date/about/contact` 10/10 | — | ✅ | Dokunma | — | ✅ |

---

## D. Teknik / on-page tekrarlayan kontroller

| # | Kontrol | Kanıt | Sınıf | Aksiyon | Sahip | Durum |
|---|---|---|---|---|---|---|
| D1 | **SPF yok**, DMARC `p=none`, e-posta güvenlik 40/100 | `dig TXT haldefiyat.com` → yalnız google-site-verification; `_dmarc` → `p=none`; DKIM yalnız `resend._domainkey`; MX → `haldefiyat.com.` (web sunucusu!) | GERÇEK — DNS, Turhost paneli | Kök SPF: kök alan adı e-posta **göndermiyorsa** `v=spf1 -all`; Resend kökten gönderiyorsa `v=spf1 include:_spf.resend.com -all` (Resend panelinde "Domain → DNS" ekranındaki değeri birebir al). DMARC: `v=DMARC1; p=quarantine; rua=mailto:dmarc@gzlteknoloji.com; pct=100`. MX kaydını gözden geçir — web IP'sine işaret eden MX posta kabul etmez, ya kaldır ya gerçek posta sunucusuna çevir. Kural: Resend'den **test e-postası** gönderip Gmail'de "Authentication-Results: spf=pass dmarc=pass" görmeden `p=reject`'e geçme | Orhan (DNS) | ⬜ |
| D2 | SSL kalan 51 gün | Let's Encrypt, bitiş 2026-11-07 | bilgi → doğrula | VPS'te `systemctl list-timers certbot*` / `certbot renew --dry-run` bir kez çalıştır; otomatik yenileme sağlamsa kapat | Claude (VPS, salt okunur) | ✅ certbot.timer günlük çalışıyor (son 18:26 UTC), haldefiyat.com 07 Kas'a kadar geçerli, 30 gün kala yeniler. Yan not: aynı kutuda 2 süresi dolmuş sertifika (example.guezelwebdesign.com, genomai.tarvista.com) — haldefiyat dışı |
| D3 | Alan adı kalan 204 gün | bitiş 2027-04-09 | bilgi | Takvim: Mart 2027 yenileme. "3+ yıl kayıt güven sinyali" — çok yıllık yenileme Orhan'ın kararı | Orhan | ⬜ |
| D4 | Görseller "ölçü bilgisi eksik" 8 | Canlı HTML: 8'i de `next/image` **`fill`** modu (`data-nimg="fill"`) — kap ölçülü, width/height tanım gereği yok, CLS 0 | ARTEFAKT | Yapılacak yok. (Reklam logolarındaki gerçek eksik 16 Eyl'de kapatıldı, `934aa3b1`) | Tanitio | ✅ |
| D5 | Dofollow dış link 12 / 8 / 22 | Sosyal profiller (`sameAs`), gzlteknoloji.com (işletmeci), itb.org.tr (kuru üzümde **birincil kaynak** atıfı, 14 satır) | UYGULANMAZ | Profil ve kaynak linklerinin dofollow olması doğru; nofollow yapmak `sameAs` varlık eşleştirmesini ve kaynak atfını zayıflatır | — | ✅ karar |
| D6 | Link hijyeni: sayfa içi boş hedef `#` ×1 | Şu anki canlı HTML'de `href="#"` **yok**; kodda da yok | doğrulanamadı | Tanitio'da yeniden tara; tekrar çıkarsa hangi öğe olduğunu L-listesinden al | Tanitio | ⬜ |
| D7 | Açık e-posta adresi 1 | Yalnız JSON-LD `Organization.email` içinde; sayfa gövdesinde yok, `/basin` zaten obfuscate ediyor | UYGULANMAZ | `Organization.email` meşru güven alanı; spam botu için değeri düşük. Kalacak | — | ✅ karar |
| D8 | JS dosyası 17/16, toplam kaynak 54, inline style 64 attr | Next chunk'ları + `next/image` `style="color:transparent"` | bilgi | Tek tek eyleme dönüşmez. Bugün yapılan bayt işi (sanitize-html tembel, 49 KB) ölçüldü: perf 66→74 | — | ✅ |
| D9 | Kod/yazı oranı %8,55 | 300 KB HTML, 25 KB metin | bilgi → B7 | RSC yükü kırpılınca oran kendiliğinden düzelir | kod | ⬜ (B7) |
| D10 | Twitter/OG/robots/canonical/HSTS/CSP/HTTP2/llms.txt/404/bot politikaları | Hepsi "Uygun" | ✅ | — | — | ✅ |
| D11 | AAAA sorgusu (gözlem, katalogda yok) | Turhost NS ve 1.1.1.1 AAAA'ya doğru cevap veriyor (NOERROR boş, 80 ms); **8.8.8.8 → 4 sn sonra SERVFAIL**; yerel hotspot resolver 15 sn takıldı | doğrulanmadı | Google DNS kullanan ziyaretçide ilk bağlantı gecikebilir. Turhost'ta EDNS/DNSSEC ayarı veya boş AAAA ile ilgili; `dig @8.8.8.8 haldefiyat.com AAAA` ile takip. Kendi ölçümlerinde `curl -4` kullan | Orhan (Turhost) | ⬜ |

---

## E. Tanitio tarafına notlar (analizör kusurları — ayrı repo)

1. **Metin çıkarıcı `<script>` içeriğini atmalı** (RSC `self.__next_f.push` dahil). Bugün ana sayfaya 10/100 "Sorun" veren şey bu; gerçek metin analizi hiç yapılamamış.
2. `next/image fill` (`data-nimg="fill"`) görselleri "ölçüsüz" sayılmamalı.
3. `sameAs`'te geçen profil linkleri ve `citation`/kaynak linkleri "dofollow dış link" iyileştirmesine girmemeli.
4. `reviews` / `trust (iade, garanti, ödeme)` sinyalleri **site türüne bağlı** olmalı; veri yayıncısında 10/10 eksik çıkıp 12+10 ağırlık yakması yanıltıcı.
5. Keşif 50 URL ile sınırlıyken "bölümde 42 sayfa var" yazmak eksik; gerçek 454. Sayı verilecekse sitemap toplamı okunmalı.
6. Sayfa listesinde `Sayfa 10` için bölüm numarası basılmamış (03.9'dan sonra 03.10 yok).

---

## F. Yürütme sırası (değer / maliyet)

1. **A4 + A5** — `/fiyat` ve `/piyasa` hub'ları (iki 404'ü kapatır, A3'ü büyük ölçüde çözer)
2. **B7** — CitySelector yük kırpma (28 KB → ~4 KB, D9 da düzelir)
3. **B1 + B2 + B4 + B6 + C1** — `/piyasa` ve `/fiyat` şablonlarına tek "veri güvencesi + cevap paragrafı" bloğu (459 sayfa tek işte)
4. **C3** — `WebPage{name}` (6 sayfa, mekanik)
5. **B3 + B8** — `/canli-hal-fiyatlari` içerik derinliği; `kuru-uzum` intro
6. **D2** — certbot kontrolü (5 dk)
7. **D1** — SPF/DMARC/MX (Orhan, Turhost)
8. **C4** — Wikidata / LinkedIn / YouTube (Orhan/Atakan)
9. **A6** — `/og/piyasa` kapağı (Codex)

**Ölçüm:** aynı 10 URL ile Tanitio yeniden denetim (20 puan). Hedef: teknik ≥ 85,
GEO ≥ 65 (citability 21,6 → 60+, brand 0 → C4 sonrası). E maddeleri
düzelmeden ana sayfa tutarlılık puanı anlamlı olmayacak.
