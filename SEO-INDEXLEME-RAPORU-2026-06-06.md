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
- [ ] `hf_firms`'e `seo_index TINYINT DEFAULT 0` kolonu ekle (seed CREATE TABLE — ALTER yasak).
- [ ] Bireysel `/firma/{slug}` sayfalarını **şimdilik noindex** + **sitemap'ten çıkar**.
- [ ] Sitemap firma yerine **hub sayfalarını** içersin.
- **Etki:** 1.322 ince sayfa crawl bütçesini yemez, site kalite sinyali yükselir, ürün/hal indekslenmesi hızlanır. "Keşfedildi-indekslenmedi" eriyip düşer.

**🥈 Katman 2 — Zengin HUB sayfaları kur (en yüksek SEO ROI)**
Şehir yoğunluğu hub için ideal: Mersin 240, Antalya 161, Adana 89, Konya 56, İstanbul 55, Hatay 47, Samsun 37, Aydın 36.
- [ ] `/firmalar/{sehir}` — "Mersin Hal Komisyoncuları (240 firma)" — liste + giriş içeriği + ilgili hal fiyat linki. ~30-40 zengin sayfa.
- [ ] `/firmalar/{tip}` — komisyoncu / soğuk hava deposu / nakliye / zirai ilaç (4 sayfa).
- [ ] `/firmalar/{sehir}/{tip}` — "Antalya komisyoncuları" (yüksek aramalı kombinasyonlar).
- Bu hub'lar gerçek işletme listesi = içerik-zengin, kolay indexlenir, bireysel firmaya link equity taşır. **"mersin hal komisyoncu" gerçek bir arama.**

**🥉 Katman 3 — Firma sayfasını zenginleştir → kademeli geri-index**
- [ ] Her firma sayfasına **benzersiz değer** ekle:
  - Firmanın bağlı olduğu **hal'in canlı fiyatları** ("X komisyoncusu — Antalya Hali güncel sebze/meyve fiyatları") → sitenin ÇEKİRDEK varlığını (canlı fiyat) firmaya bağla.
  - Kategorilerine göre ilgili ürün fiyat linkleri.
  - Harita (adres → koordinat), ilçe, firma tipi açıklaması.
  - AI ile üretilmiş özgün `description` (ekosistem `ai` modülü) — şablon değil.
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

### 🧠 Claude (tasarım)
- [ ] **S1.** `hf_firms.seo_index` seed şeması + hub route mimarisi (`/firmalar/{sehir}`, `/firmalar/{tip}`).
- [ ] **S2.** Hub + zengin firma sayfası wireframe (canlı-fiyat bağlama mantığı, fiyat-tipi etiketleme).
- [ ] **S3.** Firma kalite barajı kuralı (hangi firma seo_index=1 olur) + AI description prompt'u.
- [ ] **S4.** Codex brief: `docs/codex-briefs/firma-seo.md`.

### 🛠️ Codex (implement)
- [ ] **F1.** `hf_firms.seo_index` kolonu (seed) + bireysel firma sayfası noindex + sitemap'ten çıkar.
- [ ] **F2.** Hub sayfaları `/firmalar/{sehir}` + `/firmalar/{tip}` (+ opsiyonel `{sehir}/{tip}`) — liste + içerik + iç link.
- [ ] **F3.** Hub'ları sitemap'e ekle; firma sitemap'ini hub-only yap.
- [ ] **F4.** Firma sayfası zenginleştirme: hal canlı fiyat bloğu + harita + ürün linkleri.
- [ ] **F5.** AI description üretimi (ai modülü) + kalite barajı geçen firmaları seo_index=1 batch.

### 👤 Orhan (operasyon)
- [ ] **O1.** Search Console: sitemap güncellenince yeniden gönder; hub URL'lerini "URL denetimi → index iste".
- [ ] **O2.** Karar: firma dizini SEO + B2B gelir önceliği (memory `firma-rehberi-genisleme`).

---

## 7. Özet karar
**Ürün/hal indekslemesi sağlıklı, dokunma.** Tek iş firma katmanı: **(1) ince firma
sayfalarını noindex + sitemap'ten çıkar, (2) zengin şehir/tip hub'ları kur, (3) firma
sayfalarını canlı fiyat + AI açıklama ile zenginleştirip kademeli geri-index.** Bu,
ürün tarafında zaten kanıtlanmış "zengin index / ince noindex" desenini firmaya uygular.
