# Codex Brief — Haftalık Rapor Üreticisi Şablon Düzeltmeleri

**Tarih:** 18 Ağustos 2026 · **Tasarım:** Claude (mimar) · **Dosya:** `backend/src/modules/analysis/weekly-report.ts`
**Bağlam:** Üretici her hafta taslak üretiyor ama çıktı, yayınlanan raporların editoryal
konseptiyle uyuşmuyor. Sonuç: taslak (1.926 karakter düz metin) her hafta elle sıfırdan
yeniden yazılıyor (yayınlanan hali ~9.200 karakter editoryal HTML). Aşağıdaki 6 iş, elle
emeği "sıfırdan yazma"dan "gözden geçirip onaylama"ya indirir.

**Değişmez kural:** Otomatik yayın YOK. Üretici yalnız `status:"draft"` üretir; yayın
insan onayıyla (`POST /analysis/reports/:id/publish`) olur. Bu brief o kuralı değiştirmez.

**Referans çıktı (hedef kalite):** rapor id 21 (`agustos-2-hafta-2026-hal-raporu`) ve
id 23 (`agustos-3-hafta-2026-hal-raporu`) — ikisi de DB'de, canlıda yayında.

---

## İş 1 — Başlık endeks-öncelikli olsun

**Şu an** (`generateWeeklyReport`): `titleProduct = topFallers[0]` → "Ağustos 3. Hafta Hal
Raporu: Fasulye fiyatlarında düşüş". Yüzde yok, endeks yok, haftanın asıl hikâyesi yok.

**Yayınlanan konsept:** "Ağustos 2. Hafta Hal Raporu: Endeks 74,5 ile Yeni Dipte; Sivri
Biber %26 Geriledi" — yani `<dönem> Hal Raporu: <endeks durumu>; <en güçlü hareket>`.

**Yapılacak:** Başlık iki parçalı üretilsin.
1. Endeks parçası, endeks serisinin son 5 haftasına bakarak durum etiketi seçsin:
   - yeni seri dibi → `Endeks {değer} ile Yeni Dipte`
   - |değişim| < %1 → `Endeks {değer} ile Yataylaştı`
   - düşüş → `Endeks {değer}'e Geriledi` · yükseliş → `Endeks {değer}'e Yükseldi`
2. Hareket parçası: mutlak değişimi en büyük mover → `{Ürün} %{değer} {Geriledi|Yükseldi}`.
3. Endeks yoksa yalnız hareket parçası kullanılsın (mevcut davranışa düş).

## İş 2 — Meta title 47 karakterde kesilmesin

**Şu an:** `buildMetaTitle` → `truncateAtWord(clean, 47)`. Çıktı: `"Ağustos 3. Hafta Hal
Raporu: Fasulye fiyatları…"` — kelime ortasında kesik, Google'da kötü görünüyor.

**Yapılacak:** Sınır **60 karakter** olsun (Google SERP pratiği) ve kesme yerine
**kompozisyon** yapılsın: `{Ay} {N}. Hafta Hal Raporu: {endeks parçası}` (İş 1'deki kısa
parça). 60'ı yine aşarsa `{Ay} {N}. Hafta Hal Raporu {yıl}` fallback'ine düşsün — üç nokta
ile kesik meta title üretme. `buildMetaDescription` 155'te kalabilir, ama kesilen değil
tam cümle bitmiş bir özet üretmeyi tercih et.

## İş 3 — Kategori ortalamaları bölümü düzeltilsin

**Şu an:** `avgByCategoryFromRows` TÜM satırları kullanıyor (birim filtresi yok), sonra
`buildContent` en yüksek 4 ortalamayı alıyor. Sonuç her hafta aynı: `et: 659,99 ·
balik-donuk: 471,67 · balik-deniz: 468,92 · balik-ithal: 330,00`. Sebze-meyve raporunun
içinde et-balık listesi çıkıyor; okuyucuya hiçbir şey anlatmıyor.

**Yapılacak (ikisinden biri, tercih A):**
- **A (tercih):** Bölümü kaldır. Yerine sebze/meyve ayrımında **haftalık değişim**
  ver: "Sebze tarafında medyan değişim −%2,4; meyve tarafında +%1,1" gibi. Fiyat düzeyi
  değil, yön bilgisi haftalık raporun işine yarayan veridir.
- **B:** Bölüm kalacaksa `MOVER_EXCLUDED_CATEGORIES` (balık/et/canlı-hayvan/hububat/
  bakliyat) dışlansın, yalnız `unit="kg"` satırları sayılsın ve sıralama "en pahalı" değil
  **en çok değişen** kategoriye göre yapılsın.

`modules/prices/weekly.ts` içindeki `avgByCategoryFromRows` şu an filtresiz; düzeltme
orada yapılacaksa `scoreMovements`'taki `usable` filtresinin aynısı uygulanmalı.

## İş 4 — Türkçe sayı ve tarih biçimi

**Şu an:** `"2026-08-10 - 2026-08-16 haftasında"`, `"%20.0"`, `"145.00 TL/kg"`, `"74.32"`.
**Olması gereken:** `"10 – 16 Ağustos 2026"`, `"%20,0"`, `"145,00 ₺"`, `"74,32"`.

**Yapılacak:** `fmtPct`/`fmtPrice` ve özet/başlık metinleri `tr-TR` locale ile biçimlensin
(`Intl.NumberFormat("tr-TR")`). Tarih aralığı için "10 – 16 Ağustos 2026" üreten tek bir
yardımcı yazılsın; ham ISO tarih kullanıcıya gösterilen hiçbir metinde kalmasın.
**Dikkat:** F1.32'de kurulan ortak tarih yardımcı katmanı var — yeni bir tarih biçimleyici
yazmadan önce onu kullan (Invalid Date regresyonu riski).

## İş 5 — Düz metin yerine editoryal HTML iskeleti

**Şu an:** `buildContent` `**Başlık**` sözde-markdown ile düz metin döndürüyor; yayınlanan
raporlar ise HTML (`p.kicker`, `p.dek`, `div.meta`, `h2`, `div.overflow-x > table`,
`p.note`). Editör her hafta bütün yapıyı elle kuruyor.

**Yapılacak:** `buildContent` doğrudan yayın konseptinde HTML üretsin:

```
<p class="kicker">Haftalık Hal Raporu · {dönem}</p>
<p class="dek">{endeks durumu + en güçlü iki hareket, 2-3 cümle}</p>
<div class="meta"><span><strong>Dönem:</strong> …</span><span><strong>Kayıt:</strong> …</span>
     <span><strong>Hal:</strong> …</span><span><strong>Kaynak:</strong> Belediye halleri + HKS (Ticaret Bakanlığı)</span></div>
<h2>{endeks başlığı}</h2>  → paragraf + son 5 hafta endeks tablosu (hafta/endeks/sepet/değişim)
<h2>Fiyatı Gerileyen Ürünler</h2> → paragraf + top-5 tablo (ürün/hafta başı/hafta sonu/değişim/hal)
<p class="note"><strong>Okuma notu:</strong> …</p>
<h2>Fiyatı Yükselen Ürünler</h2> → paragraf + top-5 tablo
<h2>Önümüzdeki Hafta Ne İzlenmeli?</h2>
<p class="note"><strong>Metodoloji:</strong> …</p>
```

- Tablolar **top-5** (şu an paragraf içinde top-3); `up`/`down` sınıfları kullanılsın.
- Metodoloji paragrafı `weekly.ts`'teki gerçek parametrelerden üretilsin (MIN_MARKETS,
  ilk/son 2 gün penceresi, haller arası medyan, endeks baz haftası) — elle yazılmasın.
- Editör yorumu gerektiren yerlerde (neden-sonuç) üretici **iddia etmesin**; nötr betim
  bıraksın. "Hal kayıtları fiyat hareketini gösterir, sebebini kanıtlamaz" notu korunsun.

## İş 6 — Geçen haftanın takip listesi (en yüksek editoryal değer)

Yayınlanan raporların en güçlü bölümü, geçen haftanın "ne izlenmeli" başlıklarının bu
hafta ne olduğunu göstermesi. Bu şu an tamamen elle yazılıyor.

**Yapılacak:** Üretici, "Önümüzdeki Hafta Ne İzlenmeli?" başlıklarını **yapısal olarak**
kaydetsin (rapor kaydına `watchlist` JSON alanı: ürün slug'ı + o anki değer + soru tipi).
Bir sonraki hafta üretilirken bu liste okunup her madde için güncel değer hesaplansın ve
"Geçen Haftanın Takip Listesi Ne Söyledi?" bölümü otomatik doldurulsun.

- Şema değişikliği gerekiyorsa **hem migration hem seed SQL** güncellenir
  (migration-only DDL YASAK — `hf_listing_call_requests` vakası, 2026-08-14).
- Watchlist ürünleri: haftanın en büyük 2 mover'ı + endeks + dar tabanlı (hal sayısı
  MIN_MARKETS'a yakın) ürünlerden 1 tanesi.

---

## Ek guardrail'ler (küçük ama her hafta lazım)

- **Dar taban uyarısı:** Bir mover `marketCount <= 7` ise metinde otomatik uyarı cümlesi
  ("… yalnızca N hallik dar gözlem tabanında fiyatlanıyor") üretilsin. Nar vakası: bir
  hafta −%21,9, ertesi hafta +%17,2 (6 hal).
- **Çeşit ayrışması tespiti:** Aynı ürün ailesinin (`family_slug`) iki varyantı zıt yönde
  ve ikisi de |%10|+ ise, bu ayrışma dek/metinde işaretlensin — "domates ucuzladı" gibi
  yanlış genellemeyi önler. 2026-33 vakası: kokteyl −%16,2 / salkım +%14,2.
- **Görünen ad denetimi:** `buildTags` ürün adını `toLocaleLowerCase("tr-TR")` ile
  etiketliyor; `display_name` bozuksa etiket de bozuk çıkıyor (2026-33'te "Incır" →
  "ıncır"; DB'de `İncir` olarak düzeltildi). Üretici, `display_name` içinde
  `^I[a-zğüşöçı]` gibi İ-casefold artığı görürse etiket üretmeyip admin'e uyarı düşsün.

## Kabul kriteri

Üretilen taslak, elle **yeniden yazılmadan** yalnız gözden geçirilerek yayınlanabilmeli:
başlık/meta hazır, tablolar dolu, metodoloji ve takip listesi yerinde, Türkçe biçim doğru,
kategori bölümü anlamlı. Editör yalnız yorum cümlelerini güçlendirsin.
