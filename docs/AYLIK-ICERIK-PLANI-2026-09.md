# HaldeFiyat — Aylık İçerik Planı (Eylül 2026'dan itibaren)

> **6 Eylül düzeltmesi:** Uygulama sırası ve canlı kanıt için [veri ve editoryal checklist](../HALDEFIYAT-VERI-VE-EDITORIAL-CHECKLIST-2026-09-06.md) esas alınır. Tarihsel sayaçlar yeniden doğrulanmadıkça güncel sonuç sayılmaz.

Hazırlık tarihi: 6 Eylül 2026 · Kaynak: Tanitio `/rakip-analiz`, `/strateji`, `/ai-hafiza` +
canlı veritabanı sayımları. Rakip verileri 6 Eylül 2026'da yeniden toplandı.

---

**6 Eylül canlı doğrulama:** Tanitio global ayarı otomatik yayındı; HaldeFiyat kartlarına özel zorunlu taslak kapısı eklendi. Bu tablodaki TR saatleri editoryal hedeftir. Mevcut günlük üretim 09:30 Europe/Berlin, Eylül'de 10:30 Europe/Istanbul; diğer tenantların cron saatine dokunulmadı. Orhan/18:00 TR editör görevlendirmesi öneridir. Teknik kapanış ve gerçek ölçüm bekleyen işler [ana checklist](../HALDEFIYAT-VERI-VE-EDITORIAL-CHECKLIST-2026-09-06.md) ile izlenir.

## 1. Elimizde ne var (sayımla)

| Varlık | Durum |
|---|---|
| Organik arama | 28 günde 14.415 tıklama, 485.024 gösterim, CTR %2,97, ortalama konum 6,38 |
| Yayınlanmış analiz yazısı | 22 (haftalık) + 1 aylık taslak (Ağustos 2026, yeni üretildi) |
| Ürün | 1.237 aktif · **Firma** 1.336 kayıt · **İlan** 5 onaylı, 5 süresi dolmuş |
| Günlük görsel | K1 "Günün Hareketleri", K2 "Mutfak Sepeti" — üç boyut, Telegram/WhatsApp canlı |
| Sosyal kanallar | Facebook + Instagram bağlı (taslak modunda), X kapalı (kredi kararı) |
| Ölçülmüş lead | `form_submit` — 28 günde 34 tetiklenme |

**Zayıf halka:** günlük veri güçlü, haftalık analiz düzenli, aylık ve sezonluk üretim mevcut; düzenli onay/yayın ve etkisi henüz ölçülmeli,
ilan havuzu neredeyse boş, sosyalde düzenli yayın yok.

---

## 2. Rakipler ne yapıyor (6 Eylül 2026 toplaması)

| Hesap | Kanal | Büyüklük | Ne yapıyor |
|---|---|---|---|
| elmalihal | Facebook | 28.353 beğeni | Günlük Elmalı hal listesi, **video ağırlıklı** |
| batiakdeniztv | Facebook | 25.585 beğeni | Antalya ilçe hallerinin günlük listesi (aynı zamanda bizim ETL kaynağımız) |
| ankarasebzemeyvedunyasi | Instagram | 17.933 takipçi / 251 gönderi | Toptan satış hesabı, ürün görselleri |
| tarim_tr | Instagram | 15.371 takipçi / 1.542 gönderi | Tarım mizahı; **gönderi aralığı 21,9 gün**, ritim yok |
| www.halfiyatlari.net | Facebook | 8.795 beğeni | Site trafiğine yönlendiren günlük liste |
| kumlucahal | Facebook | 8.788 beğeni | Kumluca hal listesi |
| antalyahalfiyatlari | Facebook | 4.109 beğeni | Antalya hal listesi |
| gidaveri / halfiyatlari.co / harmanapps | Web | — | Veri kapsamı yarışı; harmanapps ayrıca ilan + fiyat alarmı |

**İncelenen hesaplarda az görülen üç format — pazarın tamamı için tekel iddiası değil:**
1. **Hal ↔ market karşılaştırması.** Bizde `hf_retail_prices` var (A101, BİM, Migros, Carrefour, Tarım Kredi).
   Tüketicinin asıl sorusu "hal 14 TL, markette neden 39 TL?" — karşılaştırma için aynı gün/birim ve örneklem doğrulaması gerekir; farkın nedenini tek başına fiyatlar açıklamaz.
2. **Endeks ve zaman serisi.** HaldeFiyat Endeksi haftalık sabit sepeti izliyor; örneklenen sosyal hesaplarda ağırlık günlük listededir; diğer veri sağlayıcılarında seri olmadığı doğrulanmadı.
3. **Düzen.** Günlük, haftalık, aylık ve sezonluk zincir birlikte denenebilir; üstünlük yayın ve kullanım sonuçlarıyla ölçülür.

**Format deneyi:** video. Elmalı hesabında video ve yüksek takipçi sayısı birlikte gözleniyor; nedensellik kanıtı yok. Bizim kartlarımız statik;
ayda 2 kısa video (kart animasyonu + seslendirmesiz altyazı) denenmeli.

---

## 3. İçerik omurgası — dört katman, iki dikey

```
GÜNLÜK      K1 fiyat kartı ....................... otomatik (üretim canlı)
HAFTALIK    Haftalık analiz + K2 sepet kartı ..... yarı otomatik (taslak → onay)
AYLIK       Aylık hal değerlendirmesi ............ otomatik taslak (YENİ, canlı)
SEZONLUK    Sezon rehberi ........................ 6 rehber mevcut; metin/onay ve güncelleme izlenecek
   dikey 1  İlan panosu .......................... K5 mevcut; gerçek ilan arzı ve yanıtlar izlenecek
   dikey 2  Firma rehberi ........................ 1.336 kayıt, içerik yok
```

Strateji belgesindeki seri adları korunuyor: *Bugünün Fiyat Sinyali, Şehir Şehir Hal,
7 Günde Ne Değişti?, Ürün Dosyası, Sezon Radarı, Halden Markete, Verinin Kaynağı,
Firma ve Piyasa Rehberi.*

---

## 4. Tekrarlanabilir ay takvimi

| Gün | İçerik | Kanal | Üretim |
|---|---|---|---|
| Her gün 09:30 TR | **K1 — Günün Hal Hareketleri** kartı | Telegram, WhatsApp, IG+FB | Otomatik (kart ucu) |
| Her Çarşamba 12:00 TR | **K2 — Mutfak Sepeti** kartı | IG+FB, Telegram | Otomatik |
| Her Pazartesi | **Haftalık analiz yazısı** taslağı → onay → yayın | Site, bülten, Telegram, WhatsApp | Yarı otomatik |
| Her Pazartesi | Haftalık e-posta bülteni | E-posta | Otomatik |
| Her Cuma 17:00 TR | **K3 — Şehir Şehir Hal** | IG+FB | Otomatik üretim → taslak/onay |
| Ayın 2'si | **Aylık hal değerlendirmesi** taslağı → onay → yayın | Site, Telegram, WhatsApp, IG+FB | Otomatik taslak (YENİ) |
| Ayın 1'i | **Sezon rehberi** (o ayın ürünleri) | Site + IG carousel | Manuel + veri desteği |
| Ayın 15'i | **İlan panosu** — açık ilanlar + aranan ürünler | Site, IG, FB, Telegram | Yarı otomatik |
| Ayın 25’i | **K4 — Halden Markete** | IG+FB | Doğrulanmış ortak veri varsa otomatik taslak; veri yoksa atla |
| Ayda 2 | Kısa video (kart animasyonu, 15-25 sn) | IG Reels, FB | Manuel |
| Sürekli | Ürün + şehir sayfaları (241 şehir×ürün canlı) | Site | Otomatik |

Eylülün tam ay şablonu: **30 K1 + 5 K2 + 4 K3 + 1 K4 + 1 K5 = 41 kart**;
4 haftalık analiz, 1 aylık yazı, 1 rehber ve 2 video ayrıca planlanır. K4/K5 toplamda
ikinci kez sayılmaz. Bu plan 6 Eylül’de hazırlandığı için geçmiş slotlar yayınlanmış sayılmaz.
Saatler Europe/Istanbul; gerçek cron saatleri ayrıca C1’de doğrulanacak.

Otomatik üretim otomatik yayın değildir. Her içerikte üretim, onay, yayın URL’si ve
ölçüm zamanı ayrı izlenir. IG/FB taslak modundadır. Onay sahibi editör, yayın/ölçüm
sahibi Tanitio; günlük kontrol saati 18:00 TR önerilir, operasyon sahibi C3’te kesinleştirilir.

---

## 5. Sezon rehberleri

Her ay bir rehber; verisi zaten hesaplanıyor (aylık raporun "Sezon Değişimi" bölümü, kayıt sayımına dayanır).

| Ay | Rehber | Veri kancası |
|---|---|---|
| Eylül | Sonbahar geçişinde incir, nar, ayva ve mandalina görünürlüğü | Sezona giren/çıkan ürünler |
| Ekim | Turşu ve kış hazırlığı: lahana, turşuluk biber, sirke sezonu | Turşuluk domates/biber hareketi |
| Kasım | Narenciye sezonu açılışı: limon, mandalina, portakal | Yerel veri varsa Mersin/Adana; ulusal seri yerel fiyat diye sunulmaz |
| Aralık | Kış sebzeleri ve fiyat zirvesi: pırasa, kereviz, lahana | Endeks zirve/dip analizi |
| Ocak 2027 | Yıllık karşılaştırma + ay sonunda Ramazan hazırlığı | Endeks ve aynı ürün sepeti |
| Şubat 2027 | Ramazan sepeti — 8 Şubat başlangıç; sera ürünleri | Ortak ürün/kaynak grubu |
| Mart 2027 | 9 Mart Ramazan Bayramı + ilkbahar görünürlüğü | Bayram öncesi/sonrası eşit pencere |
| Nisan 2027 | İlkbahar sebzeleri ve şehir dağılımı | Güncel hal kayıtları |
| Mayıs | Çilek ve kiraz: fiyat nasıl düşüyor | Günlük seri |
| Haziran | Yaz meyveleri zirvesi: karpuz, kayısı, şeftali | Bolluk/fiyat ilişkisi |
| Temmuz | Salçalık domates ve sanayi alımı | Salçalık serisi |
| Ağustos | Bağ bozumu: üzüm, incir, ceviz | Sezon kapanışı |

2027 dini tarihler [Diyanet](https://vakithesaplama.diyanet.gov.tr/icerik.php?icerik=154) ile doğrulandı. Kayıt görünürlüğü tek başına sezon başlangıcı/bitişi değildir; kaynak kesintisi ve ürün eşleme değişimi kontrol edilir.

URL deseni önerisi: `/rehber/<ay>-<konu>` (örn. `/rehber/ekim-tursu-sezonu`).
Her rehber en az bir canlı fiyat tablosu ve 3 ürün sayfasına iç bağlantı taşır — SEO kancası budur.

---

## 6. İlan dikeyi (şu an 5 onaylı ilan)

Sorun içerik değil, arz: ilan yoksa pano da yok. Sıra:

1. **Talep tarafını göster:** "Bu hafta aranan ürünler" — arama hacmi yüksek ürünleri ilan çağrısına çevir.
2. **Firma rehberinden davet:** 1.336 firma kaydı var; sahiplenme akışı canlı. Aylık 100 firmaya
   davet (telefon/WhatsApp — e-posta dönüşümü ~%2, telefon %94 kapsama).
3. **İlan panosu içeriği:** ayın 15'inde açık ilanların kartı + "ürününü ilana çevir" CTA'sı.
4. **İlan → sosyal kart:** her yeni onaylı ilan için otomatik kart taslağı (K5).
5. **Karşılıklı kanca:** ürün sayfasında "bu üründe açık ilan var" rozeti; ilan sayfasında güncel hal fiyatı.

---

## 7. Sosyal medya planı

| Platform | Ritim | Format | Not |
|---|---|---|---|
| Instagram | Günde 1 + haftada 1 carousel + ayda 2 reels | K1 kartı (4:5), sepet, şehir karşılaştırma, sezon rehberi | Taslak modu ilk 2 hafta |
| Facebook | Günde 1 (IG ile aynı) + haftada 1 analiz linki | Kart + bağlantı | Rakiplerin ana sahası |
| Telegram | Günde 1 kart + haftalık/aylık rapor duyurusu | Kart + özet | Canlı |
| WhatsApp | Günde 1 kart | Kart (adres görselin içinde) | Canlı |
| X | Kapalı | — | Açılış ayrı karar; yayın sahipliği mevcut entegrasyonla doğrulanır |

**Kart aileleri (kodla eşleşir):** K1 günün hareketleri, K2 mutfak sepeti, K3 şehir karşılaştırması, K4 Halden Markete, K5 ilan panosu. Sezon rehberi ve haftalık analiz bu kodları yeniden kullanmaz.

**Altyazı kuralları (strateji belgesinden):** her gönderi en az bir gerçek ürün, şehir, tarih,
birim ve kaynak sinyali taşır; rakamsız "fiyatlar değişti" başlığı kullanılmaz; bağlantı ilk iki
satırda durur (Telegram/WhatsApp altyazıyı katlar); min–maks orta noktası ortalama gibi sunulmaz.

---

## 8. Ölçüm takvimi

| Tarih | Neye bakılacak | Eşik |
|---|---|---|
| 20 Eylül | IG/FB kart gönderilerinin erişimi ve profil ziyareti | En az 10 kontrollü kartta veri hatası 0; yayın başarı oranı + erişim; otomatik yayın ayrı karar |
| 3 Ekim | Şehir×ürün sayfa pilotu (241 URL) | Uygun URL listesinde indeks payı; sorgu/konum bazlı CTR; mevcut ürün sayfalarına etki |
| 6 Ekim | Aylık değerlendirme yazısının ilk ay performansı | İlk 28 günlük eşit pencereler, okuma ve takip/ilan dönüşümü |
| 15 Ekim | İlan sayısı | Prova hariç gerçek baz → 25 gerçek aktif ilan + yanıtlanan talep |
| 1 Kasım | Sezon rehberi trafiği | 300 oturum deney hedefi; arama talebi ve baz çizgisiyle yeniden değerlendir |

---

## 9. Ne hazır, ne insan işi

**Kod olarak hazır ve canlı:** K1/K2 kart üretimi ve uç, Telegram/WhatsApp yayını,
Tanitio kart bağlayıcısı (taslak modunda), haftalık analiz üreticisi, **aylık değerlendirme
üreticisi + cron (ayın 2'si)**, şehir×ürün sayfaları, firma sahiplenme akışı, ilan modülü.

**6 Eylül'de uygulandı (plan onayı sonrası):**
1. ✅ K3 şehir karşılaştırma kartı — Tanitio'da cuma 17:00 slotu
2. ✅ K4 "Halden Markete" makas kartı — ayın 25'i; 6 zincirin raf fiyatıyla karşılaştırma
3. ✅ Sezon rehberleri — `/rehber/sonbahar-meyveleri`, `/rehber/narenciye`, `/rehber/kislik-sebze` canlı
4. ✅ K5 ilan panosu kartı — ayın 15'i; bozuk birim verisi (`price_unit="kg45"`) düzeltildi, form artık listeden seçtiriyor
5. ✅ Kendi hesap sayaçlarımız — Meta kimliği bağlı hesaptan okunuyor, günlük snapshot yazıyor

6. ✅ "Bu hafta aranan ürünler" — `/api/v1/listings/wanted` ucu, `/ilanlar` sayfasında bölüm,
   K5 kartının altyazısında arz çağrısı. Kural: talebi ölçülen (alım ilanı / takip / arama hacmi)
   ama panoda satış ilanı **olmayan** ürünler; mevsim dışı kalanlar son haftada 3 gün + 3 hal
   eşiğiyle eleniyor.

**Kalan:** önce veri/hesaplama kabulü; sonra onay-yayın envanteri, ölçüm, gerçek ilan arzı ve video. Ayrıntı kök checklist’te.

**İnsan işi:** sezon rehberi metinleri, video çekim/kurgu, firma davet aramaları,
taslak onayları, ilan toplama.
