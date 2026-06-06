# SEO İndeksleme Raporu — haldefiyat.com (2026-06-06)

> Kaynak: GSC Sayfa İndeksleme export (`haldefiyat.com-Coverage-2026-06-06.zip`,
> veri ~29 May) + canlı DB/sitemap/robots analizi. Soru: "dizine eklenmeyen
> sayfalar var, ne yapalım?"
>
> **TL;DR:** Ürün/hal sayfaları **sağlıklı** (352 ürün + 29 hal indexli, 795 ince
> varyant doğru şekilde noindex). **Tek gerçek sorun: 1.322 firma sayfası** —
> yapısal verisi dolu ama benzersiz içeriği yok → Google "ince/doorway" görüp
> indekslemiyor (Keşfedildi-indekslenmedi 227 + bekleyen). Çözüm: ince firma
> sayfalarını geçici noindex + sitemap'ten çıkar, **zengin hub sayfaları** (`/firmalar/{sehir}`)
> kur, firma sayfalarını **canlı fiyat + açıklama** ile zenginleştirip kademeli geri-index.

---

## 1. Durum özeti

| GSC | Sayı |
|---|---|
| Dizine eklenen (indexed) | **409** |
| Dizine eklenmedi | **591** |
| Gösterim trendi | 178 → 319 → **359** (artıyor ✅) |

İndeksli 409 ≈ 352 ürün (seo_index=1) + 29 hal + ~28 statik/analiz. **İyi tarafların
hepsi indeksleniyor; indeksleme motoru çalışıyor.** Sorun indekssiz 591'in dağılımında.

---

## 2. İndekssiz 591 — bucket analizi

| Sebep (GSC) | Sayı | Sayfa tipi (teşhis) | Sorun mu? | Aksiyon |
|---|---|---|---|---|
| **Keşfedildi – indekslenmedi** | **227** | **Firma sayfaları (ince)** | 🔴 EVET | §3 — asıl iş |
| "noindex" etiketi | 210 | `/fiyatlar`'dan linklenen ince varyant ürünler | 🟢 Tasarım gereği | Dokunma |
| Yönlendirmeli sayfa | 87 | Varyant ürün → master canonical 301 | 🟢 Çoğu by-design | §5 audit |
| Alternatif + canonical | 41 | Varyant → master (doğru canonical) | 🟢 By-design | Dokunma |
| Tarandı – indekslenmedi | 18 | İnce firma/ürün (kalite) | 🟡 Kısmi | §3 ile çözülür |
| Robots.txt engelli | 5 | `?_rsc=` / `/api` (index'e sızmış) | 🟢 Önemsiz | §5 |
| Bulunamadı (404) | 3 | Kırık linkler | 🟢 Çözüldü (commit ea368d04) | Düşecek |

> **Önemli:** "noindex 210" bizim KASITLI etiketimiz (795 ince varyant ürünün
> Google'ın bulduğu kısmı). Bu **doğru** — ince ürünleri indexletmiyoruz, ürün
> tarafı tıpkı planlandığı gibi (352 zengin indexli / 795 ince noindex). Sorun değil.

---

## 3. ASIL SORUN — 1.322 firma sayfası

### Teşhis
- Sitemap'te **1.322 `/firma/` URL** var (toplam 1.729 URL'in %76'sı).
- Firma verisi aslında **dolu:** 1.262 telefonlu, 1.155 adresli, %100 şehirli, %100 fotolu, 1.317 kategorili.
- **AMA `description` = 0.** Yani her sayfa aynı şablon + sadece NAP (ad/telefon/adres) farkı.
- Google bunu **"doorway / ince directory"** olarak görüyor → 1.322 sayfayı indekslemeyi reddediyor (227 keşfedildi-indekslenmedi + geri kalanı sırada bekliyor).
- Sonuç: crawl bütçesi 1.322 değersiz sayfaya dağılıyor, site kalite sinyali zayıflıyor, **iyi sayfaların** (ürün/hal) indekslenme hızı da bundan etkileniyor.

> Bu, `seo-index-expansion-plan` memory'siyle birebir: "indexsiz ~1.230 = firma sayfaları, ince içerik, Google reddediyor." Artık veriyle doğrulandı.

### Çözüm stratejisi (3 katman)

**🥇 Katman 1 — Kanamayı durdur (HIZLI, yüksek etki)**
- [x] `hf_firms`'e `seo_index TINYINT DEFAULT 0` kolonu ekle (seed CREATE TABLE — ALTER yasak). **Codex 2026-06-06**
- [x] Bireysel `/firma/{slug}` sayfalarını **şimdilik noindex** + **sitemap'ten çıkar**. **Codex 2026-06-06**
- [x] Sitemap firma yerine **hub sayfalarını** içersin. **Codex 2026-06-06**
- **Etki:** 1.322 ince sayfa crawl bütçesini yemez, site kalite sinyali yükselir, ürün/hal indekslenmesi hızlanır. "Keşfedildi-indekslenmedi" eriyip düşer.

**🥈 Katman 2 — Zengin HUB sayfaları kur (en yüksek SEO ROI)**
Şehir yoğunluğu hub için ideal: Mersin 240, Antalya 161, Adana 89, Konya 56, İstanbul 55, Hatay 47, Samsun 37, Aydın 36.
- [x] `/firmalar/{sehir}` — "Mersin Hal Komisyoncuları (240 firma)" — liste + giriş içeriği + ilgili hal fiyat linki. ~30-40 zengin sayfa. **Codex 2026-06-06**
- [x] `/firmalar/{tip}` — komisyoncu / soğuk hava deposu / nakliye / zirai ilaç (4 sayfa). **Codex 2026-06-06**
- [ ] `/firmalar/{sehir}/{tip}` — "Antalya komisyoncuları" (yüksek aramalı kombinasyonlar).
- Bu hub'lar gerçek işletme listesi = içerik-zengin, kolay indexlenir, bireysel firmaya link equity taşır. **"mersin hal komisyoncu" gerçek bir arama.**

**🥉 Katman 3 — Firma sayfasını zenginleştir → kademeli geri-index**
- [x] Her firma sayfasına **benzersiz değer** ekle: **Codex 2026-06-06**
  - Firmanın bağlı olduğu **hal'in canlı fiyatları** ("X komisyoncusu — Antalya Hali güncel sebze/meyve fiyatları") → sitenin ÇEKİRDEK varlığını (canlı fiyat) firmaya bağla.
  - Kategorilerine göre ilgili ürün fiyat linkleri.
  - Harita (adres → koordinat), ilçe, firma tipi açıklaması.
  - AI ile üretilmiş özgün `description` (ekosistem `ai` modülü) — şablon değil. **Beklemede: gerçek ürün/claim/ek veri olmadan toplu üretim yapılmayacak.**
- [ ] Kalite barajını geçen firmaları (telefon+adres+canlı fiyat bağlamı) batch'ler halinde `seo_index=1` yap, sitemap'e ekle, IndexNow ping.

---

## 4. Beklenen sonuç
- Kısa vade: "Keşfedildi-indekslenmedi 227" düşer; indeksli/indekssiz oranı düzelir; crawl bütçesi iyi sayfalara gider.
- Orta vade: 30-40 hub + kademeli zengin firma sayfaları indekslenir → "şehir hal komisyoncu" uzun-kuyruk trafiği.
- Firma dizini hem SEO hem B2B CRM/sponsorluk geliri (memory `firma-rehberi-genisleme`, `uye-komisyoncu-firma-plani`) için temel olur.

---

## 5. Küçük bucket'lar (düşük öncelik)
- [ ] **Yönlendirme 87:** çoğu varyant→master canonical (by-design). Canonical orphan'lar düzeltildi (ea368d04 + DB). Redirect zinciri/loop olmadığını doğrula.
- [ ] **Robots 5:** `?_rsc=` veya `/api` URL'leri index'e sızmış. GSC'den kaldırma talebi veya yok say (robots zaten engelliyor).
- [ ] **404 (3):** kırık linkler — is_active + canonical fix ile çözüldü, GSC re-crawl'da 0'a düşmeli.
- [ ] **Tarandı-indekslenmedi 18:** kalite; §3 zenginleştirme + ince ürün editorial ile iyileşir.

---

## 6. Aksiyon planı & roller

### 🧠 Claude (tasarım) — ✅ TAMAMLANDI (2026-06-06)
- [x] **S1.** Seed: `hf_firms.seo_index TINYINT DEFAULT 0` (034 + schema.ts). Hub route: `/firmalar/{sehir}` (birincil, ~40 şehir), `/firmalar/{tip}` (komisyoncu vb.), `/firmalar/{sehir}/{tip}` (Faz B). Sitemap firma→hub.
- [x] **S2.** Hub + zengin firma wireframe yazıldı (canlı hal fiyat bağlama, schema CollectionPage/LocalBusiness) → brief'te.
- [x] **S3.** Kalite barajı: `seo_index=1 ⇔ aktif+onaylı+şehir VE (ürün≥3 VEYA açıklama≥120 VEYA claim=verified)`. **Şu an 0 firma geçer → hepsi noindex (doğru).** AI açıklama: yalnız gerçek-verili firmaya, toplu spun ÜRETME (doorway riski).
- [x] **S4.** Codex brief hazır: **`docs/codex-briefs/firma-seo.md`** (F1–F5, kabul kriterleri, wireframe).

> **Kritik veri (bu oturumda doğrulandı):** firma benzersiz içerik = **0** (0 ürün listesi, 0 açıklama,
> 0 claim). Mevcut `firma/[slug]/page.tsx` zaten koşullu robots veriyor ama bar çok düşük (NAP→index).
> Karar: seo_index DB-driven (ürün deseni gibi), default 0; hub'lar keşfi taşır.

### 🛠️ Codex (implement)
- [x] **F1.** `hf_firms.seo_index` kolonu (seed) + bireysel firma sayfası noindex + sitemap'ten çıkar. **Codex 2026-06-06**
- [x] **F2.** Hub sayfaları `/firmalar/{sehir}` + `/firmalar/{tip}` (+ opsiyonel `{sehir}/{tip}` Faz B) — liste + içerik + iç link. **Codex 2026-06-06**
- [x] **F3.** Hub'ları sitemap'e ekle; firma sitemap'ini hub-only yap. **Codex 2026-06-06**
- [x] **F4.** Firma sayfası zenginleştirme: hal canlı fiyat bloğu + harita + ürün linkleri. **Codex 2026-06-06**
- [ ] **F5.** AI description üretimi (ai modülü) + kalite barajı geçen firmaları seo_index=1 batch. **Codex notu 2026-06-06:** gerçek ürün/claim/ek veri olmayan 1.331 firmaya toplu AI açıklaması üretilmedi; kalite barajı kodda, batch indexleme gerçek zengin veri geldikten sonra.

### 👤 Orhan (operasyon)
- [ ] **O1.** Search Console: sitemap güncellenince yeniden gönder; hub URL'lerini "URL denetimi → index iste".
- [ ] **O2.** Karar: firma dizini SEO + B2B gelir önceliği (memory `firma-rehberi-genisleme`).

---

## EK A — Bucket denetimi & hub uygulama notları (Claude, 2026-06-06)

> Codex kod tarafını işlerken yapılan denetim. Gizli kayıp YOK; ama hub uygulaması için 2 kritik kısıt çıktı.

### A.1 Küçük bucket'lar temiz (gizli kayıp yok)
- **Yönlendirme 87 / Alternatif 41:** 280 üründe `canonical_slug` var (varyant→master, by-design). **Kırık hedef = 0** (orphan fix sağlam). **1 canonical zinciri** bulundu (`avakado-muhtelif→avakado→avokado`) → **düzleştirildi** (`avakado-muhtelif→avokado` direkt). Artık 0 zincir.
- **Robots 5 / Tarandı-indekslenmedi 18:** benign (`?_rsc=` prefetch + ince varyant). Aksiyon yok.
- **404 (3):** is_active + canonical fix ile çözüldü, re-crawl'da düşecek.

### A.2 ⚠️ Hub çapraz-link KISITI (Codex F4 için kritik)
İl hub'ının "canlı hal fiyatı" bloğu **her ilde çalışmaz.** 56 hub-ilden:
- **~16 il TAM** (hal + güncel fiyat): antalya, konya, istanbul, bursa, izmir, ankara, kayseri, eskisehir, denizli, gaziantep, kahramanmaras, trabzon, yalova, kutahya, canakkale, bolu.
- **~3 il hal VAR ama fiyat YOK** (link ver, fiyat bloğu boş): **mersin (240 firma!)**, manisa, kocaeli — ETL gap.
- **~36 il hal YOK** (fiyat bloğu GÖSTERME): **adana (89 firma, 3.)**, hatay, samsun, aydin, van, sanliurfa, diyarbakir, ordu, mardin, malatya, erzurum, kars, mugla, sakarya…

**Tasarım kararı (Codex'e):** Hub'ın asıl değeri **firma dizini** (56 ilde de çalışır, "{il} komisyoncu" niyeti). **Canlı-fiyat bloğu KOŞULLU bonus** — yalnız hal+fiyat olan ilde göster, yoksa atla (hub fiyatsız da zengin: gerçek işletme listesi + özgün giriş). **Hub'ı hal fiyatına bağımlı yapma.**

### A.3 ⚠️ Türkçe slug eşleme uyarısı (Codex F4)
Firma `city_slug` ASCII ("balikesir","canakkale") ↔ `hf_markets.city_name` Türkçe ("Balıkesir","Çanakkale"). Naive eşitlik ı/ş/ç/ğ/ö/ü'de patlar (örn. `balikesir` hal'i NULL göründü ama VAR). **Codex:** çapraz-linkte iki tarafı da Türkçe-normalize et (ı→i, ş→s, ç→c, ğ→g, ö→o, ü→u, İ→i) veya `hf_markets`'e ascii `city_slug` ekle.

### A.4 Yan bulgu — ETL gap (ayrı konu)
**mersin-hal, manisa-hal, kocaeli-hal'de 0 güncel fiyat** (hal kaydı var, son 7g veri yok). Mersin 240 firmayla en büyük il — hal fiyatı da olsa çok değerli. ETL kaynaklarını kontrol et (CLAUDE.md "Sorunlu Kaynaklar"). SEO işinden bağımsız, ama not edildi.

---

## 7. Özet karar
**Ürün/hal indekslemesi sağlıklı, dokunma.** Tek iş firma katmanı: **(1) ince firma
sayfalarını noindex + sitemap'ten çıkar, (2) zengin şehir/tip hub'ları kur, (3) firma
sayfalarını canlı fiyat + AI açıklama ile zenginleştirip kademeli geri-index.** Bu,
ürün tarafında zaten kanıtlanmış "zengin index / ince noindex" desenini firmaya uygular.
