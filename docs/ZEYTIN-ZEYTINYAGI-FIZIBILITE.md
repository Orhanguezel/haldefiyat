# Fizibilite — Zeytin / Zeytinyağı Fiyatları (borsa dikeyi)

> Tarih: 2026-06-16 · Tür: kaynak araştırması (kod yok) · Karar: Orhan
> Tetik: `/urun/zeytin` 404→307 fix sonrası "zeytin fiyatlarını da ekleyebilir miyiz?"

## 1. Mevcut durum
- **Sıfır zeytin verisi:** `hf_products` + `hf_price_history`'de zeytin/zeytinyağı YOK.
- Borsa dikeyinde 5 emtia çalışıyor: buğday/arpa/mısır (TMO alım) + ayçiçeği + pamuk (İTB pamuk bülteni). Pattern olgun.
- Şu anki `/urun/zeytin` → `/fiyatlar?q=zeytin` (307) davranışı **doğru** (veri yokken ince içerik sayfası açmak SEO'ya zarar).

## 2. "Zeytin" = 3 ayrı ürün
| Ürün | Piyasa | Veri | Değerlendirme |
|---|---|---|---|
| **Zeytinyağı** (sızma/natürel/yemeklik/ham/riviera) | Ticaret borsaları | Günlük, yapılandırılmış | ✅ Asıl hedef |
| **Sofralık zeytin** (siyah salamura, yeşil özel) | Ticaret borsaları (Gemlik/Edremit) | Günlük, aynı tabloda | ✅ Bonus (aynı kaynak) |
| **Yağlık zeytin** (üretici) | Borsa/kooperatif | Mevsimsel | ⏸️ Aynı kaynaktan gelir |

## 3. Kaynak araştırması — bulgular

### 🎯 Ana bulgu: TOBB merkezi borsa portalı
`https://borsa.tobb.org.tr/fiyat_borsa.php?borsakod=XXX` — **tüm ticaret borsaları tek pattern**, sadece `borsakod` değişiyor. Tek parser → çok borsa.

**Doğrulandı (Edremit, borsakod=`5ED20`):** Temiz HTML tablo — kolonlar: *Ürün · Birim(KG) · Son İşlem Tarihi · Min · Max · Ortalama · Miktar · İşlem Adedi · İşlem Değeri*. 6 zeytin ürünü canlı:

| Ürün | Ort. TL/kg |
|---|---|
| Natürel sızma zeytinyağı | 274 (250–300) |
| Yemeklik zeytinyağı | 245 (245–250) |
| Ham zeytinyağı | 150 |
| Yağlık zeytin (tane) | 51 |
| Yeşil özel sofralık | 100 |
| Siyah salamura sofralık | 150 |

→ Zeytinyağı **ve** sofralık tek tabloda, kg bazlı, işlem-tarihli. Scrape'e birebir uygun.

### İkincil kaynaklar
- **Aydın Ticaret Borsası** (`/borsa-urun-fiyatlari`): HTML tablo, tarih-seçmeli (AJAX), min/max/ort/miktar + ayrı "İspanya sızma/rafine" referansı (11.06.2026: 3.900 / 3.150 TL). Yedek/çapraz-doğrulama.
- **İzmir TB Tescil Bülteni** (`/GunlukBultenler/1-tescil-bulteni`): müstakil zeytinyağı bülteni YOK; işlemler tescilde olabilir (PDF parse gerek) — düşük öncelik.
- **TMO piyasa bülteni** (zaten `tmo_piyasa_bulteni` olarak scrape ediliyor): zeytinyağı referansı içeriyorsa neredeyse bedava — **doğrulanmalı** (PDF büyük, otomatik fetch timeout oldu).
- **Gemlik TB**: sofralık zeytin uzmanı; yine TOBB portalında `borsakod` ile.

### Hedef borsalar (TOBB borsakod ile)
Edremit (5ED20 ✓), Ayvalık, Gemlik, Aydın, Akhisar, Mersin/Çukurova bölgesi — zeytin kuşağı. Her biri config'e 1 satır.

## 4. Mimari uyum
- **Yeni `responseShape`:** `tobb_borsa_html` (1 parser, tüm borsalar için ortak) — `parseResponse()` switch'ine + `parseTobbBorsaHtml()`.
- Mevcut `fetchDated` / `etl-sources.ts` RAW_SOURCES yapısına oturuyor (borsakod = endpoint param).
- Ürün modeli: zeytinyağı tipleri varyant → mevcut `canonicalSlug` pattern (master `zeytinyagi` + variant `zeytinyagi-natürel-sizma` vb.), tıpkı pamuk/ürün varyantları gibi.
- Pamuk şablonu (`020_*` ürün + `037_*` editöryel + `static-editorial-slugs` whitelist + middleware `BORSA_PRODUCT_SLUGS` + page borsa listesi) aynen tekrarlanır.

## 5. Efor tahmini
| İş | Tahmin |
|---|---|
| `parseTobbBorsaHtml` parser + responseShape | ~yarım gün |
| Kaynak config (Edremit + 2-3 borsa) | ~1-2 saat |
| Ürün seed (zeytinyağı + varyantlar + sofralık) | ~2 saat |
| Editöryel içerik (037, SEO için ZORUNLU) | ~yarım gün |
| Whitelist + middleware/page borsa listesi | ~1 saat |
| **Toplam** | **~1.5-2 gün** (bilinen pattern) |

## 6. Riskler
- TOBB portalı session/captcha isteyebilir → **Scrapling fallback hazır** (HF_SCRAPER_SOURCES).
- Zeytinyağı tip/asit-derecesi ayrımı (sızma/natürel/riviera) → varyant modeli şart, yoksa fiyatlar karışır.
- Borsalar arası fiyat farkı (bölge/kalite) → kaynak+tarih ayrımı zaten gösteriliyor (pamuk gibi).
- Sofralık zeytin tane/kalibre bazlı → ayrı ürün, zeytinyağı ile karıştırma.

## 7. Öneri
**Yapılabilir ve değerli — yüksek fizibilite.** "Hal'de zeytin" değil, **borsa dikeyinde zeytinyağı + sofralık zeytin**, TOBB merkezi portalı üzerinden.
- **SEO/trafik:** "zeytinyağı fiyatları" yüksek-niyetli, yüksek-hacimli sorgu → güçlü kazanç; içerik motoru + monetizasyon hedefiyle uyumlu.
- **Efor:** Bilinen pattern, tek parser çok borsa → düşük risk, ~1.5-2 gün.
- **Öncelik:** P2/P3 içerik genişleme — operasyonel acil işlerin (A1.4, Ads) önüne geçmez.

### Önerilen ilk adım (karar verilirse)
1. TMO bülteninde zeytinyağı var mı doğrula (bedava kazanç olabilir).
2. `parseTobbBorsaHtml` + Edremit kaynağı PoC → 1 borsadan canlı veri.
3. Çalışırsa ürün+editöryel+whitelist ile yayına al, sonra borsa ekle.

## Kaynaklar
- [İTB Günlük Bültenler](https://itb.org.tr/GunlukBultenler) (zeytinyağı müstakil bülten yok)
- [TOBB merkezi borsa portalı — Edremit](https://borsa.tobb.org.tr/fiyat_borsa.php?borsakod=5ED20) ✓ doğrulandı
- [Aydın Ticaret Borsası ürün fiyatları](https://www.aydinticaretborsasi.org.tr/borsa-urun-fiyatlari)
- [Edremit Ticaret Borsası](https://www.edremittb.org.tr/) (fiyatlar → TOBB portalı)
- [TMO piyasa bülteni](https://www.tmo.gov.tr/Upload/Document/piyasabulteni/piyasabulteni_tr.pdf)
