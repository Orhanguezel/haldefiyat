# HalDeFiyat Trafik Analizi — 6–19 Temmuz 2026 (14 tam gün)

> Kaynak: VPS `/var/log/nginx/haldefiyat.access.log*` (dedike erişim logu). Üretim: traffic-report.sh.
> **Devam raporu:** `analiz-24-30-haziran-2026` raporunun devamı.
> ⚠️ **Kapsam boşluğu:** nginx log rotasyonu 14 gün tutuyor; **30 Haziran – 5 Temmuz arası loglar silinmiş** ve geriye dönük analiz edilemiyor. Rapor, kurtarılabilen en eski tam günden (6 Temmuz) başlar.
> **20 Temmuz** raporun çekildiği an kısmi gün olduğu için tablo dışıdır (ayrıca o gün yoğun deploy yapıldı; 83×500 + 25×502 kendi deploy'larımızdan).

## Özet Tablo

| Metrik | Değer |
|---|---|
| Toplam istek | **774,210** |
| İnsan trafik (istek*) | **741,709** (%95.8) |
| Bot/Crawler trafik | **32,501** (%4.2) |
| Günlük ort. insan trafik (14 tam gün) | **52,979/gün** |
| Mobil / Masaüstü (insan) | **%76 / %24** |
| Google Ads tıklama (gclid, request) | **27 istek** |
| → benzersiz IP (reklam tıklayan) | **21** |
| ★ Gerçek JS pageview | **12,633** (~**902/gün**) |

\* İstek sayısı, ziyaretçi değil. Gerçek engaged insan ≈ **902 pageview/gün** (track beacon).

## Öncesi / Sonrası — trend

| Metrik | 6–15 Haz | 16–23 Haz | 24–29 Haz | **6–19 Tem (bu)** | Trend |
|---|---|---|---|---|---|
| Günlük insan istek | 29,424 | 41,210 | 39,032 | **52,979** | **+%36** ↗ |
| Gerçek JS pageview/gün | ~490 | ~614 | ~581 | **~902** | **+%55** ↗ |
| Mobil oran | %74 | %64 | %70 | **%76** | **+6 puan** ↗ |
| google.com referrer/gün | ~274 | ~428 | ~503 | **~793** | **+%58** ↗ |
| Ads inişi (gclid)/gün | — | — | ~282 | **~2** | **−%99** ⏹️ |
| 5xx/gün | ~3.6 | ~40 | ~0.7 | **~4.1** | ↗ (aşağıda) |

**Dönemin tek cümlelik özeti: reklam kapatıldı, trafik %36 arttı.**

Google Ads kampanyası bilinçli olarak durduruldu (artık gerekli görülmedi). Reklam inişi günlük ~282'den ~2'ye indi — yani pratikte sıfır. Buna rağmen günlük insan trafiği **39 bin → 53 bin**, gerçek engaged pageview **~581 → ~902** çıktı. Büyüme tamamen organik: Google organik referansı günlük **~503 → ~793**.

Bu, sitenin artık ücretli trafiğe bağımlı olmadığını gösteriyor — ve reklamı durdurma kararını veriyle doğruluyor.

## Günlük Trafik

| Tarih | Gün | İnsan | Bot | Toplam | Uniq IP | Mobil% |
|---|---|---|---|---|---|---|
| 6 Tem | Pzt | 58,933 | 2,291 | 61,224 | 2,318 | %64 |
| 7 Tem | Sal | 41,000 | 3,321 | 44,321 | 1,729 | %69 |
| 8 Tem | Çar | 54,360 | 1,988 | 56,348 | 2,385 | %75 |
| 9 Tem | Per | 59,463 | 2,003 | 61,466 | 1,977 | %72 |
| 10 Tem | Cum | 44,106 | 1,777 | 45,883 | 1,283 | %79 |
| 11 Tem | Cmt | 47,560 | 2,141 | 49,701 | 2,062 | %80 |
| 12 Tem | Paz | 46,452 | 2,072 | 48,524 | 1,882 | %85 |
| 13 Tem | Pzt | 57,013 | 1,954 | 58,967 | 1,765 | %77 |
| 14 Tem | Sal | 56,336 | 2,708 | 59,044 | 2,624 | %71 |
| 15 Tem | Çar | 50,706 | 3,260 | 53,966 | 1,448 | %84 |
| 16 Tem | Per | 61,417 | 2,182 | 63,599 | 2,571 | %65 |
| 17 Tem | Cum | 57,718 | 1,999 | 59,717 | 1,464 | %77 |
| 18 Tem | Cmt | 47,857 | 2,397 | 50,254 | 1,512 | %82 |
| 19 Tem | Paz | 58,788 | 2,408 | 61,196 | 1,395 | %83 |
| **TOPLAM** | | **741,709** | **32,501** | **774,210** | — | **%76** |

- En yüksek gün: **16 Tem (61,417 insan)**; en düşük: **7 Tem (41,000)**.
- Taban belirgin şekilde yükseldi: haziran sonunda 29–52 bin bandındaki günlük insan trafiği, temmuzda **41–61 bin** bandına oturdu. Dönemin en düşük günü (41,000), önceki dönemin ortalamasına (39,032) yakın — yani eski ortalama artık yeni dip.
- Hafta içi/hafta sonu farkı kapandı: 12 Tem Pazar 46,452 ve 19 Tem Pazar 58,788 ile hafta içi günlerle yarışıyor. Fiyat takibi hafta sonu da sürüyor.
- Mobil oran hafta sonlarında zirve yapıyor (11–12 Tem %80–85, 18–19 Tem %82–83), hafta içi %64–77 bandında. Masaüstü kullanımı mesai saatlerine bağlı; hafta sonu tamamen mobile kayıyor.
- Uniq IP ile insan isteği arasında ters ilişki sürüyor (6 Tem 2,318 IP / 58,933 istek; 19 Tem 1,395 IP / 58,788 istek). Aynı trafik daha az IP'den geliyor: oturum başına daha derin gezinme ya da CGNAT yoğunlaşması.

## Saatlik Dağılım (insan, UTC — TR = +3)

- Tepe: **11:00 UTC (14:00 TR) = 49,543**.
- Önceki dönemde tepe 12:00 UTC (15:00 TR) idi; bir saat öne kaydı. TR öğle bandı (12:00–16:00) ana kullanım penceresi olmayı sürdürüyor — hal fiyatlarının gün içi güncellendiği saatlerle örtüşüyor.

## HTTP Sağlık (durum kodları, dönem)

| Kod | İstek | Açıklama |
|---|---|---|
| 200 | 708,903 | Başarılı |
| 301 | 36,964 | Kalıcı yönlendirme |
| 204 | 12,549 | İçerik yok (track beacon) |
| 304 | 8,457 | Cache |
| 308 | 3,289 | Kalıcı (POST) |
| 404 | 2,147 | Bulunamadı |
| 499 | 1,438 | İstemci kapattı |
| 410 | 145 | Gone (ölü ürün redirect) |
| 400 | 98 | Hatalı istek |
| 206 | 79 | Kısmi içerik |
| 401 | 43 | Yetkisiz |
| 500 | 36 | Sunucu hatası (admin analytics) |
| 302 | 30 | Geçici yönlendirme |
| 502 | 20 | Backend kapalı (geçici) |
| 201 | 4 | Oluşturuldu |
| 307 | 4 | Geçici (POST) |
| 429 | 3 |  |
| 504 | 1 |  |

**5xx toplam: 57** / 774,210 = **%0.01**. Oran ihmal edilebilir ama dağılımı anlamlı: **36×500 + 20×502 + 1×504**.

500'lerin tamamı **statik dosyalarda** (`.woff2`, `_next/static/chunks/*.css`, `manifest.json`, logo) ve iki güne kümelenmiş: **6 Temmuz 33 adet**, 14 Temmuz 3 adet. Bu, CLAUDE.md'de kayıtlı deploy tuzağının imzası: Next standalone'da `pm2 reload` yeni build'i almaz, eski process silinmiş chunk'lara işaret eden HTML servis eder. Çözüm zaten yazılı — frontend/admin için **`pm2 restart`**, reload değil.

502'ler günde 1–3 adetle dağınık; backend reload pencerelerine denk gelen kısa kesintiler. Kullanıcı etkisi yok denecek düzeyde.

## Bot / AI Crawler Dağılımı (UA, dönem)

- googlebot 7,204 · yandex 3,410 · bingbot 2,289 · ahrefsbot 788 · applebot 311 · petalbot 3
- **AI motor crawler:** oai-searchbot 1,247 · claudebot 1,031 · gptbot 975 → toplam **~3,253 hit**
- Günlük bazda AI crawler **154/gün → 233/gün (+%51)**. Kırılım çarpıcı: **GPTBot 9/gün → 70/gün (+%660)**, **ClaudeBot 33/gün → 74/gün (+%124)**, OAI-SearchBot 112/gün → 89/gün (hafif geri).
- Googlebot 363/gün → **515/gün (+%42)**: içerik üretimi (haftalık raporlar, ürün sayfaları) tarama bütçesini artırmış.
- AhrefsBot önceki dönemde 191/gün ile fırlamıştı, bu dönem **56/gün**'e indi — geçici bir tarama dalgasıymış, politika değişikliği gerekmedi.

## Google Ads (gclid) Landing

- `/` 9 · `/api/v1/track/pageview` 4 · `/hal/istanbul-hal-ibb` 3 · `/urun/domates` 2 · `/urun/bezelye` 2 · `/fiyatlar` 2 · `/urun/marul` 1 · `/urun/sogan-kuru` 1 · `/hal/mersin-hal` 1 · `/urun/sarimsak-taze` 1 · `/urun/marul-kivircik` 1

Toplam **27 iniş / 14 gün**. Kampanya kapatıldığı için bu sayı artık bir performans göstergesi değil; kalan tıklamalar muhtemelen önceden indekslenmiş reklam bağlantıları ve gecikmeli tıklamalar.

> **Ölçüm notu:** Araç `gclid`'i yalnızca **istek URL'sinde** sayar (27). Ham logda "gclid" geçen 332 satır var, ancak fazlası inişten sonraki iç gezinmede referrer'da taşınan aynı parametredir — iniş değildir. Kıyaslarda 27 doğru sayıdır.

## Dış Referrer (insan)

- www.google.com 11,105 · myactivity.google.com 266 · yandex.com.tr 163 · yandex.ru 86 · www.google.com.tr 84 · https: 59 · www.yandex.com.tr 20 · chatgpt.com 11 · android-app: 6 · gemini.google.com 5 · www.bing.com 4 · accounts.google.com 2 · tr.search.yahoo.com 2 · www.google.de 2 · duckduckgo.com 2

- **Google organik: ~793/gün** (önceki dönem ~503/gün, **+%58**). Reklam kapalıyken bu artış, büyümenin organik olduğunun en net kanıtı.
- **`googleads.g.doubleclick.net` ve `safeframe.googlesyndication.com` referrer'ları tamamen kayboldu** — kampanyanın gerçekten durduğunu bağımsız olarak doğruluyor.
- AI arayüzlerinden gelen **kullanıcı** trafiği hâlâ çok düşük: chatgpt.com 11, gemini 5. Crawler ilgisi (3,253 hit) ile kullanıcı yönlendirmesi (16) arasındaki uçurum sürüyor; AI motorları içeriği okuyor ama henüz kaynak olarak göstermiyor.

---

## ⚠️ HATALAR / BULGULAR

### 1. 🟢 Reklamsız büyüme — dönemin ana bulgusu
Ads bilinçli olarak durduruldu (gclid ~282/gün → ~2/gün). Buna rağmen günlük insan trafiği **+%36**, gerçek engaged pageview **+%55** arttı. Google organik referansı **+%58**. Site ücretli trafiğe bağımlı değil; durdurma kararı veriyle doğrulanıyor.

### 2. 🟢 Yeni taban oluştu
Önceki dönemin **ortalaması** (39,032), bu dönemin **en düşük günü** (41,000) ile aynı seviyede. Bu, dalgalanma değil seviye değişimi.

### 3. 🟡 Statik dosya 500'leri — bilinen deploy tuzağı
36 adet 500'ün tamamı `.woff2` / `_next/static` / `manifest.json` üzerinde ve **6 Temmuz'a (33 adet)** kümelenmiş. Next standalone'da `pm2 reload` yeni build'i almıyor; eski process silinmiş chunk'lara işaret ediyor. CLAUDE.md'de kural yazılı (**restart, reload değil**) ama uygulanmamış. Kullanıcı etkisi küçük fakat tekrarlanabilir.

### 4. 🟡 410'lanmış ürünlere hâlâ iç link var
410 sayısı 39 → **145**. En çok isabet alanlar `?_rsc=` ekli: `findik-taze` 29, `feslegem-reyhan` 24, `feslegem-70-100gr` 24, `feslegem-kirmizi` 23. `_rsc` Next.js prefetch'i demek — yani **site içindeki bir liste bu ölü ürünlere link vermeye devam ediyor**. 410 politikası doğru, ama kendi sayfalarımızdan link vermek crawl bütçesi israfı. (`feslegem` ayrıca `fesleğen` yazım hatası; mükerrer slug temizliğiyle ilgili.)

### 5. 🟢 AhrefsBot dalgası geçti, AI crawler'lar hızlandı
AhrefsBot 191/gün → 56/gün (geçici dalgaymış, önlem gerekmedi). Buna karşılık **GPTBot +%660**, **ClaudeBot +%124**. AI motorları içeriği giderek daha çok tarıyor.

### 6. 🔴 Log rotasyonu 14 gün — geriye dönük analiz imkânsız
**30 Haziran – 5 Temmuz arası loglar silinmiş.** Bu rapor 6 Temmuz'dan başlamak zorunda kaldı ve o 6 günlük veri kalıcı olarak kayıp. Aylık/çeyreklik analiz istenirse şu anki saklama süresi yetmiyor.

## Aksiyon Listesi (öncelik sırası)

1. **[P1]** **Nginx log saklama süresini uzat** (`/etc/logrotate.d/nginx` → `rotate 60` + `compress`). 14 gün, aylık analiz için yetersiz; bu raporda 6 günlük veri kalıcı olarak kayboldu. Disk maliyeti düşük (sıkıştırılmış günlük ~800 KB).
2. **[P1]** **Deploy prosedürünü zorunlu kıl:** frontend/admin için `pm2 restart` (reload değil). 6 Temmuz'daki 33 adet statik 500 bundan. Deploy script'ine sabitlenmeli ki insan hatasına açık kalmasın.
3. **[P2]** **410'lanmış ürünlere giden iç linkleri kaldır.** `findik-taze`, `feslegem-*` ürünleri hâlâ bir listeden prefetch ediliyor. Ölü ürün 410 dönerken site içinden link verilmemeli.
4. **[P2]** **Organik momentumu yakalamaya yatırım yap.** Reklam kapalı, organik +%58 — newsletter kaydı ve CTA'lar artık tek dönüşüm kanalı. `/` en büyük iniş sayfası olmayı sürdürüyor; anasayfa CTA'sı öncelikli.
5. **[P3]** **AI görünürlüğü (GEO):** crawler ilgisi 233/gün ama kullanıcı yönlendirmesi 16. İçeriğin alıntılanabilirliği (yapılandırılmış veri, net cevap blokları) üzerinde çalışılırsa bu makas kapanabilir.
6. **[izle]** Mobil oran %76 ve hafta sonu %85'e çıkıyor. Mobil deneyim çalışması (PWA çeklisti) getirisi yüksek olacak grupta.

## Genel Durum: 🟢 GÜÇLÜ ORGANİK BÜYÜME — REKLAMSIZ

