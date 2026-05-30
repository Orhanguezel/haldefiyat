# Dış SEO Denetimi — Gerçeklik Karşılaştırması & Yapılacaklar

> **Tarih:** 2026-05-30. Dışarıdan gelen bir SEO denetimi canlı site + kod ile **empirik**
> doğrulandı. Sonuç: denetimin "kritik" dediği maddelerin **çoğu zaten çözülmüş**. Aşağıda
> her iddia kanıtla işaretlendi; gerçek (küçük/orta) işler ayrı çeklistte.

## A. Doğrulama Tablosu — İddia vs Gerçek

| # | Denetim iddiası | Gerçek (kanıt) | Durum |
|---|---|---|---|
| 1 | **CSR/SSR sorunu — içerik render edilmiyor, fiyatlar boş gelir** | Ürün sayfası ham HTML **95KB**, fiyatlar **HTML'de** (`2,48`, `20,00`, `₺…`). Hal sayfası 559KB SSR. Tüm public sayfalar `export const dynamic="force-dynamic"` = SSR. "Sayfa hazırlanıyor" yalnız **canlı ticker/grafik alt-widget'ının** skeleton'ı; ana içerik+schema sunucuda render. | ✅ **YANLIŞ ALARM** — zaten SSR |
| 2 | **Schema.org ekle (Product/Offer, FAQPage, Organization)** | JSON-LD'de **mevcut**: `Product`, `AggregateOffer`, `PriceSpecification`, `FAQPage`, `Organization`, `BreadcrumbList`, `WebSite`, `SearchAction` | ✅ **ZATEN VAR** |
| 3 | **Meta description hepsi aynı** | Ürün sayfası **özgün/dinamik**: "Türkiye genelinde Acı Çarli Biber hal fiyatları, trend grafikleri ve güncel karşılaştırma." | ✅ **YANLIŞ** (ürünler özgün) |
| 4 | **www vs non-www canonical karışıklığı** | `www→301→apex` (doğrulandı), canonical = `https://haldefiyat.com` (apex, www'siz), her sayfada doğru | ✅ **ZATEN DOĞRU** |
| 5 | **robots.txt / sitemap yok / kontrol et** | `robots.txt` 200 (AI-crawler kuralları dahil), `sitemap.xml` 200 + `<lastmod>` günlük, `news-sitemap.xml` var | ✅ **ZATEN VAR** |
| 6 | **`/tr/hal` vs `/hal` ikilemi** | Nav/içerik linkleri **`/hal`** (prefixsiz). Yalnız `/tr/giris` + `/tr/kayit` prefixli (noindex auth sayfaları) | ⚠️ **KÜÇÜK** (sadece auth linkleri) |
| 7 | **İç linkleme** | "Aynı bölgedeki firmalar", popüler ürünler, ilgili haller bağlı | ✅ **İYİ** (denetim de kabul etti) |
| 8 | **Veri tazeliği çelişkisi (2480 vs 237 / tarih)** | "İzlenen: 2.480" = global takip; ürün sayfasındaki "29 May" = o ürünün **son veri tarihi**; "Son güncelleme 02:01" = global ETL saati. Farklı **kapsamlar**, çelişki değil ama etiketleme net değil | ⚠️ **ETİKET NETLİĞİ** |
| 9 | **İçerik derinliği (özgün paragraf, rehber/blog)** | Sayfalar ağırlıkla tablo/sayı; özgün açıklayıcı metin az | 🟢 **GERÇEK FIRSAT** (uzun vade) |

**Özet:** 9 maddenin 5'i yanlış alarm (zaten çözülmüş), 2'si küçük tutarsızlık, 2'si gerçek
iyileştirme (1 etiketleme + 1 içerik fırsatı). Denetimin "önce SSR'ı çöz" alarmı geçersiz —
site teknik olarak sağlam.

---

## B. Gerçek Yapılacaklar (önceliklendirilmiş) — *B1+B2 Claude tarafından yapıldı 2026-05-30*

### B1. Küçük teknik tutarsızlıklar `[Claude — DONE]`
- [x] **`/tr/` prefix temizliği:** `localePath` artık as-needed — default locale (tr) prefix almıyor →
  `/giris` (eski `/tr/giris`). Canlı doğrulandı: HTML'de `/tr/` iç link kalmadı. (`locale-path.ts`)
- [x] **"Sayfa hazırlanıyor" skeleton:** denetlendi — yalnız canlı alt-widget skeleton'ı, ana içerik+fiyatlar
  SSR HTML'de mevcut (kanıtlı). SEO etkisi yok → dokunulmadı (kozmetik, gerek yok).

### B2. Veri tazeliği & gerçek sayılar `[Claude — DONE]`
- [x] **Topbar hard-code kaldırıldı:** "İzlenen: 2.480 ürün" UYDURMA idi → gerçek `GET /prices/overview`
  (trackedProducts=**1.144**). "Son güncelleme" kullanıcı **saati** idi → gerçek **son veri tarihi**
  ("Son veri: 29 Mayıs", `MAX(recorded_date)`'ten). Layout server-fetch → Header → TopbarClient props.
- [ ] *(Opsiyonel, sonra)* Sayfa-içi kapsam etiketleri (ör. "Bu halde izlenen: N") + >3 gün bayat veri rozeti
  — kozmetik iyileştirme, kritik değil.

### B3. İçerik derinliği — organik trafik motoru `[Claude içerik stratejisi + Orhan/editör]`
- [ ] Önemli ürün sayfalarına **özgün 1-2 paragraf** (mevsim etkisi, fiyat neden dalgalanır) — şablon
  değil, ürüne özel. SEO interlock zaten editorial içeriği indexe bağlıyor (bkz. mevcut sistem).
- [ ] Şehir/hal sayfalarına kısa açıklayıcı metin ("İstanbul hal fiyatları nasıl belirlenir").
- [ ] Rehber/blog bölümünü genişlet (mevcut mevsim rehberi üzerine) — uzun kuyruk aramalar için.
- [ ] "Aynı ürünün diğer şehirlerdeki fiyatı" iç linkini ürün sayfasında güçlendir (crawl derinliği + UX).

### B4. Operasyonel — GSC `[Orhan]`
- [ ] GSC'de hem `haldefiyat.com` hem `www.haldefiyat.com` property → www'nin 301'lendiğini teyit.
- [ ] `sitemap.xml` + `news-sitemap.xml` GSC'ye gönderildi mi kontrol et.
- [ ] URL Inspection → "Test Live URL" → birkaç ürün/hal sayfasının **render edilmiş** halinde fiyatların
  geldiğini gör (zaten SSR olduğu için gelmeli — denetimin korkusunu canlı kanıtla).
- [ ] (Not: indexleme genişletme ayrı planda — `seo-index-expansion-plan` / `KALAN-ISLER.md`.)

---

## Kanıt komutları (tekrar doğrulamak için)
```bash
# SSR + schema kanıtı
curl -s https://haldefiyat.com/urun/aci-carli-biber | grep -oE '"@type":"[A-Za-z]+"' | sort -u
curl -s https://haldefiyat.com/urun/aci-carli-biber | grep -oE '₺[0-9]|[0-9]+,[0-9]{2}' | head
# canonical + www 301
curl -sI https://www.haldefiyat.com/ | grep -i location
curl -s https://haldefiyat.com/urun/aci-carli-biber | grep canonical
# robots + sitemap
curl -s https://haldefiyat.com/robots.txt; curl -s https://haldefiyat.com/sitemap.xml | head
```

**Sonuç:** Teknik temel sağlam. **B1+B2 Claude tarafından yapıldı + canlı (2026-05-30).**
B3 = içerik üretimi (editöryel, süregelen — altyapı hazır), B4 = GSC erişimi gerektirir (Orhan).
Denetimin "kritik SSR" uyarısı yanlış alarmdı.

---

## Tamamlanma durumu (2026-05-30, Claude)
- ✅ **B1** — `/tr/` prefix temizliği (canlı, doğrulandı).
- ✅ **B2** — topbar gerçek veri: 1.144 ürün + "Son veri: 29 Mayıs" (hard-code/saat kaldırıldı, canlı).
- 🟡 **B3** — içerik derinliği: **kod altyapısı hazır** (editorial + SEO interlock); kalan iş **içerik
  yazımı** (editöryel, süregelen). Strateji/örnek paragraf istenirse Claude üretebilir.
  Not: ürün sayfası DB editorial yerine statik `product-content.ts` okuyor (ayrı plan:
  `seo-index-expansion-plan`) — B3'ün ön koşulu o bağlantının kurulması.
- ⛔ **B4** — GSC operasyonel: **Orhan** yapmalı (Search Console giriş gerektirir, Claude erişemez).
