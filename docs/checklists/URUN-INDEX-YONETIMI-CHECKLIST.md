# Ürün Index Yönetimi — Yol Haritası & Checklist

> **Sayfa:** `/admin/hf-products` — ürün envanterinin SEO/veri kalitesi komuta merkezi.
> **Analiz tarihi:** 2026-07-27 (canlı DB + GSC cache + kod incelemesi, Claude)
> **Hedef:** 1345 ürünün TAMAMI için doğru sınıf + doğru aksiyon; index seti temiz büyüsün.

---

## ⭐ GÜNCEL DURUM (2026-07-27 sonu) — maraton oturum bitti

**Bitenler (aşağıdaki eski `[ ]`'lerin çoğu artık DONE):**
- ✅ Faz 1: 8 editoryel → index (yulaf, buğday-ekmeklik, vişne, bamya, soğan-beyaz, börülce + merges)
- ✅ Faz 2: borsa-farkında index kriteri + `POST /hal/products/seo-maintenance` endpoint + 7 borsa editoryeli
- ✅ **Retail-as-primary:** pirinç (11K), kuru-fasulye (6.8K), bulgur, mercimek retail ile index (frontend headline + backend kriter)
- ✅ Faz 4: 69 junk pasif silindi; biber+4 canonical hijyen fix; fejoya 410→404
- ✅ Faz 5: **Aksiyon kolonu + SEO bakım butonu** canlı; distinct-market bug fix
- ✅ **Alias-merge + isim/birim normalizasyonu:** ~94 merge (kullanıcı kararlarıyla), 6 çiftlenmiş/NULL isim, 24 ot→demet birimi
- ✅ **Marul (5 tip) + Muz (2 tip) düğümleri** çözüldü (131 kasa-satırı temizlendi, muz-ithal 235→117.8)
- ✅ marketfiyati bakliyat dikeyi + RETAIL_EXTRA throttle bug fix
- **index master 171 → 194+**

**SIRADA (gerçek kalan, öncelik sırasıyla):**
1. **ETL genişletme — eksik büyük şehir halleri.** 2026-07-27 farklı-IP teşhisi:
   - 🔴 IP/WAF bloklu (Adana, Mersin, Samsun, Çanakkale): **residential proxy şart** →
     KARAR ORHAN'DA, 2026-07-27 "şimdilik proxy yok" dendi. Bekliyor.
   - ⚫ Kocaeli: sunucu gerçekten ölü (proxy çözmez).
   - 🟡 Proxy'siz erişilebilir ama JS-render/AJAX: **Uşak + Ordu** (200 dönüyor) →
     scraper dynamic-mode DOM extraction / endpoint reverse-engineering. Ayrı build oturumu.
     Detay: memory [[sehir-hal-etl-kapsam-haritasi]].
2. **Recrawl takibi** (~1 hafta sonra ≈ 2026-08-03): yeni indexlenen ~25 ürün için
   "Google: tümünü denetle" → excluded düşmeli + kategori hub iç link kontrolü.
3. ~~**Faz 5 cila**~~ ✅ 2026-07-27 TAMAM: fırsat-sıralı varsayılan görünüm eklendi
   (opportunity sort — aksiyon önceliği + searchVolume DESC, "🎯 Fırsat sırası" butonu).
   GSC bulk zaten `gsc-index-refresh` günlük cron'unda (incremental, kota-dostu) — ekstra iş yok.
4. **çeltik:** sonbahar hasadında self-heal (aksiyon yok).
5. **Donmuş batiakdeniz kaynakları** (Haziran'dan sabit): blackout/karantina (veri kalitesi).

---

## 0. Mevcut Durum Röntgeni (2026-07-27)

| Sınıf | Adet | Ort. Kalite | Toplam Arama | Durum |
|---|---|---|---|---|
| **Index master (aktif)** | 171 | 100 | 221.137 | ✅ Tertemiz — hepsi dq=100, ≥3 hal |
| **Noindex master (aktif)** | 528 | 57 | **56.581** | ⚠️ Fırsat havuzu burada |
| **Varyant 301 (aktif)** | 514 | 59 | 1.661 | ✅ Beklenen |
| Noindex pasif | 117 | 7 | ~0 | Temizlik adayı |
| Varyant pasif | 15 | 0 | 0 | Temizlik adayı |

**Noindex 528'in kırılımı (son 30 gün verisiyle):**
| Alt grup | Adet | Not |
|---|---|---|
| 1-2 hal veri | 365 | 146'sı **editoryelli** — sadece ≥3 hal şartına takılıyor |
| 0 fiyat/30g | 155 | Mevsimsel/ölü — self-healing sezonla halleder |
| ≥3 hal (hazır!) | 8 | Tek eksik: **editoryel** → yazılınca otomatik indexlenir |

**Mekanizma (zaten çalışıyor, `runSeoIndexMaintenance`):** haftalık cron dq'yu yeniden hesaplar;
`editoryel + dq≥70 + ≥3 hal + 30g veri` → index'e alır; verisi kuruyan indexliyi noindex'e çeker.
**Bu self-healing korunacak — elle seo_index oynamak yerine girdilerini (editoryel/veri) besle.**

---

## 1. TAMAMLANANLAR ✅ (2026-07-27, Claude — İKİ OTURUM)

### 1.a Teşhis & UX (birinci tur)
- [x] **biber çelişkisi düzeltildi** — DB master+index görünüyordu ama 301 → biber-carliston
      atıyordu (5916 hit). `canonical=biber-carliston, seoIndex=0` yapıldı.
- [x] **Google badge UX** — noindex/varyantta kırmızı "Sorun" yerine nötr **"Beklenen"**.
- [x] "26 gerçek sorun"un 24'ü = recrawl bekleyen (bug değil, gecikme).

### 1.b Faz 4-Hijyen: canonical↔redirect tutarlılığı (TAMAM)
- [x] Tam tarama: C (döngü), D (kırık zincir), E (zincir-zinciri), F (index'te varyant) → **hepsi temiz**.
- [x] 4 ek biber-tipi çelişki düzeltildi: **sarimsak** (1934 hit), **lahana** (1263), alabas, isirgan
      → canonical set edildi, DB canlı 301'lerle tutarlı. 514 varyantın frontend `permanentRedirect`
      ile doğru 301 attığı doğrulandı (redirect tablosu ikincil).

### 1.c Faz 1: Hazır adaylar editoryel → index (TAMAM)
- [x] 6 hal ürünü editoryel yazıldı+yayınlandı+**index'lendi**: yulaf, bugday-ekmeklik, visne,
      bamya, borulce, sogan-beyaz (6 alanlı, doğru Türkçe içerik, `source=ai_reviewed`).
- [x] 2 merge: **bamya-taze→bamya**, **reyhan-feslegen→reyhan** (aynı ürün, thin sayfa konsolidasyonu).

### 1.d Faz 2: Borsa-farkında index kriteri (TAMAM — en yüksek etki)
- [x] `runSeoIndexMaintenance`'a **borsa/resmi UP dalı** eklendi: hal_rows=0 + editoryel +
      veri sürekliliği (≥3 gün) + dq≥60 (hal ürünü ≥3 hal şartı AYNEN korundu). Demote borsa
      ürününü yalnız pr=0'da düşürür.
- [x] **Manuel tetik: `POST /hal/products/seo-maintenance`** (editoryel sonrası cron beklemeden).
- [x] Kriter + editoryel ile **~20 ürün index'lendi**: zeytin (9K), nohut (5.4K), yulaf (4.8K),
      buğday (4.2K), çavdar (2.6K) + **tüm canlı hayvan/et dikeyi** (dana/kuzu canlı+karkas,
      editoryelleri vardı ama hal-kuralına takılıydı). nohut/çavdar/mercimek/makarnalık-buğday
      editoryelleri yazıldı. mercimek days<3 → doğru şekilde bekliyor.
- [x] **Sonuç: index master 171 → 192** (+21 net).

### 1.e Faz 5: Panel aksiyon kolonu (TAMAM)
- [x] Liste endpoint'i her ürüne DISTINCT-market + editoryel sinyalinden **`action`** türetir;
      maintenance kriteriyle birebir hizalı (satır-vs-distinct bug'ı düzeltildi).
- [x] Panelde **"Aksiyon" kolonu + filtresi** (Editoryel yaz / Bakım bekliyor / Recrawl / Veri
      bekliyor / Sezon-yok / İndexli) + **"SEO bakımı" butonu**. Sayfa artık kendini belgeliyor.
- [x] Doğru dağılım: 145 indexli · 45 recrawl · **0 editoryel-bekliyor** · 352 veri-bekliyor ·
      265 sezon/veri-yok · 536 varyant.

---

## 2. FAZ 1 — Hızlı Kazanımlar (bu hafta)

### 2.1 Sekiz hazır aday: editoryel yaz → otomatik index
Tek eksikleri editoryel; cron sonraki çalıştırmada indexler. Arama hacmine göre öncelik:

- [ ] `yulaf` (**4.800 arama**, dq90, 4 hal)
- [ ] `bugday-ekmeklik` (**4.200 arama**, dq90, 6 hal)
- [ ] `visne` (13 hal — kapsamı en geniş)
- [ ] `bamya` (10 hal)
- [ ] `bamya-taze` (5 hal) → önce bamya ile aile/merge kararı: ikisi ayrı mı kalmalı?
- [ ] `sogan-beyaz` (3 hal)
- [ ] `borulce` (3 hal)
- [ ] `reyhan-feslegen` (3 hal) → `reyhan` zaten indexli — MERGE adayı olabilir, önce kontrol
- **Yöntem:** `/admin/hf-products/{id}` → Editoryel sekmesi; AI-assist ile taslak + insan onayı.
      Yayınla (published_at dolmalı). Sonra haftalık cron'u bekle veya elle tetikle.

### 2.2 Recrawl hızlandırma (24 bekleyen ürün)
- [ ] Sitemap `lastmod`'un bu ürünler için güncel olduğunu doğrula (index'e alınma tarihi olmalı)
- [ ] Kategori hub + ilgili-ürün iç linklerinde bu 24'ün linklendiğini doğrula (crawl teşviki)
- [ ] 1 hafta sonra "Google: tümünü denetle" çalıştır → "Excluded by noindex" sayısı düşmeli
- [ ] Düşmeyenler için GSC arayüzünden elle "Request Indexing" (günlük kota ~10, en yüksek
      aramalılar önce: bal-kabagi 247, reyhan 140, incir-siyah 106, turp 70)

### 2.3 Panel doğrulaması
- [ ] Deploy sonrası `/admin/hf-products`'ta noindex satırların Google kolonu "Beklenen" görünüyor
- [ ] "⚠ İndexlenebilir ama Google'da yok" filtresi ~25 ürün listeliyor (biber düştü)

---

## 2.5 FAZ 3-Başlangıç — Tahıl/Bakliyat veri kaynağı (2026-07-27, TAMAM)

**Teşhis:** pirinç (11K arama), kuru-fasulye (6.8K), çeltik (3.2K) "hiç veri almamış" değil —
DURMUŞLAR (pirinç/çeltik son veri 2023, kuru-fasulye 2026-04). Neden:
- **çeltik:** mevsimsel borsa emtiası (sonbahar hasadı) → self-healing sonbaharda halleder.
- **pirinç/kuru-fasulye/mercimek:** borsa emtiası değil (pirinç), asıl aranan = **perakende raf fiyatı**.
  Perakende ETL (marketfiyati) yalnız taze sebze-meyve kapsıyordu.

**Yapıldı — marketfiyati'ye paketli bakliyat dikeyi:**
- [x] `RETAIL_EXTRA`'ya 5 entry: pirinç, mercimek, kuru-fasulye, nohut, bulgur ("Temel Gıda",
      birim-kg fiyat, premium/organik/basmati exclude regex).
- [x] **Kritik bug bulundu+düzeltildi:** marketfiyati ~750 fresh-produce çağrısından sonra VPS IP'yi
      **throttle**'lıyordu; sonda çalışan RETAIL_EXTRA `found=0` alıyordu → **meat/dairy dikeyi de
      (dana-kıyma/süt/yoğurt) hiç veri almamış**tı. RETAIL_EXTRA fresh'ten ÖNCE çalışacak şekilde
      reorder edildi. Sonuç: pirinç 93, kuru-fasulye 144, mercimek 88, nohut 202, bulgur 66 TL/kg
      (6 zincir) + meat/dairy retail geri geldi. Cron günlük otomatik.

**Kalan — MİMARİ KARAR (Orhan):** Retail veri `hf_retail_prices`'ta (karşılaştırma), index'i süren
`hf_price_history`'de değil — bilinçli ayrım (raf ≠ hal). pirinç gibi **retail-only** ürünleri tam
index'lemek için "retail'i birincil fiyat say" kararı gerek. Bu ürünün kimliğiyle ilgili karar
(hal-odaklı site retail sayfası açmalı mı?) → önerilir ama Orhan onayı bekler.

---

## 3. FAZ 2 — Borsa Ürünleri Kilidi (yüksek etki, 1-2 hafta)

**Sorun:** En büyük arama fırsatları borsa/bakliyat ürünlerinde ama "≥3 hal" şartı hal-pazarı
varsayımıyla yazılmış → borsa ürünü yapısal olarak indexlenemiyor (27 borsa ürününden sadece 5 indexli).

| Ürün | Arama/ay | Engel |
|---|---|---|
| `pirinc` | **11.000** | 0 hal verisi (borsa ürünü) |
| `zeytin` | **9.000** | 1 kaynak |
| `kuru-fasulye` | **6.800** | 0 |
| `mercimek` | **6.200** | 2 kaynak |
| `nohut` | **5.400** | 2 kaynak |
| `celtik` | 3.200 | 0 |
| `cavdar` | 2.600 | 2 kaynak |

- [ ] **Karar kuralı tanımla (backend):** ürünün son 30g verisi ağırlıkla `market_type='borsa'`
      ise index şartı: `≥1 borsa kaynağı + ≥20 gün veri devamlılığı + editoryel + dq≥70`
      (hal ürünü şartı ≥3 hal AYNEN kalır — thin-page koruması)
- [ ] `runSeoIndexMaintenance` up/down sorgularına borsa dalını ekle (tek UPDATE'e CASE değil,
      ayrı ikinci UPDATE — okunabilirlik)
- [ ] pirinc/kuru-fasulye/celtik için TMO+borsa kaynak kapsamını genişlet
      (bkz. hafıza: borsa-resmi-fiyatlar-dikeyi, TOBB portal pattern — borsakod ile tüm borsalar)
- [ ] 7 ürünün editoryelini yaz (AI-assist + onay)
- [ ] Landing zenginleştirme: borsa ürün sayfasında "hal fiyatı" tablosu yerine borsa/TMO
      serisi + tarihçe grafiği öncelikli görünsün (frontend, ayrı iş)

**Beklenen etki:** ~44.000 aylık arama hacmine sayfa açılır — mevcut index setinin (221K)
%20'si kadar yeni potansiyel, üstelik rekabeti düşük sorgu ailesi.

---

## 3.6 Alias-merge + isim normalizasyonu (2026-07-27, kısmi TAMAM)

- [x] 136 cluster değerlendirildi; **161 riskli MERGE-DIŞI** bırakıldı (domates-salçalık 2062,
      kapya-biber 2658... değerli ayrı ürünler). Tuzaklar atlandı: manda≠dana, Maraş≠sivri, birim-uyumsuz.
- [x] **10 kesin merge** (301 doğrulandı): domates-bursa/tarla-diger→domates, kokty/salkito→
      domates-kokteyl, sogan-kuru-ii/taze→sogan-kuru, y-uzum-muhtelif→uzum, cilek-kg→cilek,
      kiraz-kg→kiraz, bezelye-taze-diger→bezelye.
- [x] **6 isim düzeltme** (çiftlenmiş/NULL display): Yaban Mersini, Limon Otu, Turşuluk Salatalık,
      Deniz Börülcesi, Muz 1.Kalite, Taze İncir. Tarama: 0 çiftlenmiş kaldı, indexli display'ler temiz.
      **name_tr'ye dokunulmadı** (ETL alias eşleşmesi ona bağlı; frontend getDisplayName ALLCAPS'i çözer).
- [x] 410 hijyen: 20 aktif 410'dan 1 yanlış-pozitif (fejoya, canlı veri) → kaldırıldı (410→404).
- [ ] **⏳ ERTELENDİ (Orhan ile aile-aile — EN SONA):** kalan ~95 belirsiz cluster (çeşit/tip
      soruları: erik-siyah distinct mi? soğan-mor? biber tipleri?). Noindex-thin, zararsız; otonom
      merge = kayıp riski. Kullanıcı kararı: "bunu sonda yapalım." Birlikte aile-aile geçilecek.

## 3.7 Retail-as-primary + pasif temizlik + ETL teşhis (2026-07-27, Orhan kararlarıyla)

- [x] **Retail-as-primary AÇILDI (#1):** `runSeoIndexMaintenance`'a RETAIL-STAPLE UP dalı
      (staple kategori + editoryel + ≥3 zincir retail, hal/borsa yok). Frontend headline
      retail'e düşüyor. **pirinç (11K), kuru-fasulye (6.8K), bulgur index'lendi** — market
      rafı ortalaması sayfada + meta'da. mercimek edge-case (borsa days<3 + s.pr>0), bekliyor.
- [x] **132 pasif → 69 SİLİNDİ (#2):** pasif+master+<10 geçmiş+0 arama (bozuk slug çöpü).
      **63 KORUNDU:** varyant (silmek 301→404) / 10+ geçmiş (FK CASCADE veri kaybı) / aramalı.
- [x] **Belirsiz cluster öneri listesi (#3):** 102 varyant önerimle gruplandı (44 birleştir /
      17 ayrı kalsın / 41 muhtemelen ayrı) → karar artifact'ı. Orhan ile birlikte uygulanacak.
- [ ] **ETL genişletme (#4) — TEŞHİS TAMAM, BUILD BEKLİYOR:** 50+ kaynak sağlıklı. Eksik BÜYÜK
      şehir halleri: **Adana (200, JS-rendered — AJAX reverse-eng gerek), Şanlıurfa (500),
      Samsun (403), Mersin (WAF hard-blok → residential proxy)**, Diyarbakır/Hatay/Malatya.
      Her biri kendi ters-mühendisliğini ister; odaklı build oturumu — Adana en umutlu aday.
      Donmuş batiakdeniz kaynakları (Haziran'dan sabit) ayrıca blackout gerektirir (veri kalitesi).

## 4. FAZ 3 — 365 "1-2 hal" Ürünü (sürekli süreç)

Bunlar için **doğru cevap indexe zorlamak DEĞİL** (thin page → Google zaten reddediyor, 1.230
indexsiz firma sayfası dersi). Doğru cevap iki koldan:

- [ ] **ETL kapsamı büyüt:** 146 editoryelli+1-2 hallik ürünün hangi hallerde eksik olduğunu çıkar;
      eksik haller çalışan kaynaklarda parser/alias sorunu mu yoksa gerçekten yayınlamıyor mu ayır
      (alias çakışması playbook'u: urun-eslestirme-alias-cakismasi hafızası)
- [ ] **Alias birleştirme taraması:** 365'in içinde mevcut indexli master'ların farklı yazımı
      olanlar var → "Birleştirme önerileri" paneliyle aile aile geç (auto-merge playbook kuralları:
      farklı-ürün tuzakları, qualifier bug pattern'ine dikkat)
- [ ] Aylık rapor: bu havuzdan kaç ürün ≥3 hal'e terfi etti (self-healing otomatik indexler)

---

## 5. FAZ 4 — Temizlik & Hijyen (ay içinde, düşük öncelik)

- [ ] **132 pasif ürün:** fiyat geçmişi hiç olmayan + arama 0 olanlar → sil ya da arşiv;
      geçmişi olanlar pasif kalsın (tarihsel veri korunur, sayfa zaten yok)
- [x] ~~**search_volume 408 üründe 0/boş**~~ → **ZATEN OTOMATİK**: cron `search-volume-sync`
      (`syncSearchVolumeFromGsc`) haftalık GSC gösterimlerinden doldurur. 0 kalanlar ya henüz
      gösterim almamış (noindex olduğu için) ya da gerçek 0. Index'lenen ürünler gösterim
      alınca otomatik dolar. Ek iş gerekmiyor.
- [ ] **Varyant hijyeni:** `hf_redirects` ↔ `hf_products.canonical_slug` tutarlılık taraması
      (biber vakasının taraması — başka çelişki var mı?):
      redirect var + DB master → biber tipi bug; DB varyant + redirect yok → 301 eksik
- [ ] 410 yanlış-pozitif kontrolü: aile-başı generic slug'lar 410 değil 301 olmalı
      (410-yanlis-pozitif-aile-basi hafızası — teşhis SQL'i orada)

---

## 6. FAZ 5 — Panel Geliştirmeleri (istek üzerine)

- [ ] **"Aksiyon" kolonu:** her satırda sınıf+sonraki adım rozeti
      (örn. "editoryel yaz → index", "hal kapsamı bekliyor", "recrawl bekliyor", "borsa kriteri")
      — backend'te sınıflandırma zaten SQL ile çıkıyor, liste endpoint'ine ekle
- [ ] **Fırsat sıralaması varsayılanı:** tablo varsayılan sıralaması `search_volume DESC`
      + noindex filtresiyle açılan "Fırsatlar" hazır görünümü
- [ ] Toplu editoryel akışı: seçili N ürün için AI taslak kuyruğu (insan onayı şart, otomatik yayın YOK)
- [ ] GSC bulk denetimini haftalık cron'a bağla (şu an elle buton; tek-indirici kuralına uygun,
      bkz. gsc-single-inspector-architecture)

---

## 7. Karar Kuralları — Tüm Ürünler İçin (kalıcı politika)

| Sınıf | Tanım | Doğru aksiyon |
|---|---|---|
| **A. Indexli** | seo_index=1, dq100 | Dokunma; self-healing verisi kuruyanı düşürür |
| **B. Hazır aday** | ≥3 hal + dq≥70 + editoryel YOK | Editoryel yaz → cron indexler |
| **C. Borsa ürünü** | Verisi borsa/TMO'dan | Faz 2 borsa kriteri; hal şartı uygulanmaz |
| **D. Dar kapsam** | 1-2 hal, editoryelli | Indexe ZORLAMA; ETL kapsamı büyüt veya bekle |
| **E. Mevsimsel/0 veri** | 30g fiyatsız | Bekle — sezon dönünce self-healing indexler; kalıcı ölüyse 301/410 playbook |
| **F. Varyant** | canonical_slug dolu | Dokunma; redirect↔DB tutarlılığını dönemsel tara |
| **G. Pasif** | is_active=0 | Geçmişsiz+aramasız → sil; diğerleri arşiv |

**Altın kural:** `seo_index` elle OYNANMAZ — girdileri (editoryel, veri kapsamı) beslenir,
self-healing karar verir. Elle müdahale yalnız çelişki düzeltmede (biber vakası).

---

*İlgili hafıza/dokümanlar: seo-index-expansion-plan, auto-merge-onerici, analiz-kalite-gsc-paneli,
gsc-single-inspector-architecture, borsa-resmi-fiyatlar-dikeyi, urun-eslestirme-birim-kimlik.*
