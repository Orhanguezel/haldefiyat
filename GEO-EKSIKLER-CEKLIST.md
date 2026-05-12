# HalDeFiyat — GEO & Ekosistem Eksikler Çeklistesi

**Kaynak:** GEO Raporu 08.05.2026 (22/100) + EKOSISTEM-PLAN.md incelemesi  
**Son güncelleme:** 2026-05-12 (oturum 2)  
**Hedef skor:** 55+/100

> Rapor tarihi (08.05) ile bugün (12.05) arasında bazı maddeler giderildi.
> Bunlar ✅ ile işaretlendi, hâlâ açık olanlar `[ ]` ile.

---

## 🔴 KRİTİK — Bu Hafta

### Yapılandırılmış Veri (Schema.org) — Mevcut Skor: 2/100

| # | Görev | Sayfa | Durum |
|---|-------|-------|-------|
| 1 | ~~JSON-LD sıfır~~ — Organization + WebSite + Dataset | Anasayfa | ✅ Giderildi |
| 2 | ~~JSON-LD~~ Dataset schema | /fiyatlar | ✅ Giderildi |
| 3 | ~~JSON-LD~~ Product schema | /urun/[slug] | ✅ Giderildi |
| 4 | ~~JSON-LD~~ Place schema | /tr/hal/[slug] | ✅ Giderildi |
| 5 | ~~PriceSpecification schema~~ — min/ort/maks + birim + para birimi | /urun/[slug] | ✅ Giderildi |
| 6 | ~~FAQPage schema~~ — SSS bölümü ile birlikte | Anasayfa + /urun/[slug] | ✅ Giderildi |
| 7 | ~~BreadcrumbList schema~~ — tüm iç sayfalara (hal, urun, fiyatlar) | Tüm sayfalar | ✅ Zaten vardı |
| 8 | ~~DataCatalog schema~~ — veri kataloğu tanımı | /fiyatlar veya anasayfa | ✅ Giderildi |
| 9 | ~~SiteLinksSearchBox schema~~ — WebSite schema'ya `potentialAction` ekle | Anasayfa | ✅ Zaten vardı |

### Sitemap

| # | Görev | Durum |
|---|-------|-------|
| 10 | ~~8 statik URL~~ → dinamik sitemap (hal + ürün sayfaları) | ✅ Giderildi |
| 11 | **Sitemap'te `<image:image>` eklentisi** — ürün görselleri Google Images'a | [ ] |
| 12 | **IndexNow** entegrasyonu — yeni fiyat verisi gelince arama motorlarına anlık bildir | [ ] |

### Güven / E-E-A-T

| # | Görev | Durum |
|---|-------|-------|
| 13 | ~~Placeholder telefon~~ — gerçek numara DB'ye eklendi: +90 530 048 41 83 | ✅ Giderildi |
| 14 | ~~İletişim sayfasına gerçek e-posta adresi~~ — atakan07sahin@gmail.com eklendi | ✅ Giderildi |

---

## 🟠 YÜKSEK — Bu Ay

### Meta / Open Graph

| # | Görev | Durum |
|---|-------|-------|
| 15 | **og:image dinamik üretim** — hal ve ürün sayfalarına sayfa özgü OG görseli | [ ] |
| 16 | **Twitter Card** `og:image` — tüm dynamic sayfalarda resim URL'i doldur | [ ] |
| 17 | **Meta description şablon** — hal sayfaları: `{şehir} Hal Müdürlüğü günlük {ürün} fiyatları. Min {X} TL, Ort {Y} TL, Maks {Z} TL.` | [ ] |

### İçerik & E-E-A-T — Mevcut Skor: 25/100

| # | Görev | Detay | Durum |
|---|-------|-------|-------|
| 18 | ~~llms.txt format doğrulama~~ — plain-text, HTML tag yok, doğru content-type | ✅ Zaten doğruydu |
| 19 | ~~llms-full.txt~~ — dinamik ürün + hal listesi, makine okunabilir format | ✅ Giderildi |
| 20 | **Ürün sayfaları editoryal içerik** — her `/urun/[slug]` için 200–300 kelime: ne zaman çıkar, fiyatı neyi etkiler, beslenme değeri | [ ] |
| 21 | **Hal sayfaları editoryal içerik** — her `/tr/hal/[slug]` için 150–200 kelime: hal hakkında, kapsama alanı, hangi ilçelere hizmet eder | [ ] |
| 22 | **Hakkımızda sayfasını genişlet** — 550 kelime → min. 1.000 kelime; metodoloji, kaynak şeffaflığı, ekip | [ ] |
| 23 | ~~SSS bölümü~~ — anasayfa ✅ + ürün sayfaları ✅ FAQPage schema + görünür içerik eklendi | ✅ Giderildi |

### Canonical & Teknik

| # | Görev | Durum |
|---|-------|-------|
| 24 | **Canonical URL tutarlılığı** — tüm sayfalarda `/tr/` prefix standart; prefix'siz URL'ler canonical ile yönlendirmeli | [ ] |
| 25 | ~~CCBot (Common Crawl)~~ — robots.txt'e Allow eklendi, Bytespider'dan ayrıldı | ✅ Giderildi |

### Sosyal Medya & Marka — Mevcut Skor: 12/100

| # | Görev | Durum |
|---|-------|-------|
| 26 | **Twitter/X hesabı aç** — `@haldefiyat` — günlük "en çok değişen 5 ürün" paylaşımı | [ ] |
| 27 | **Instagram hesabı aç** — görsel fiyat kartları (infografik), sezonluk ürün tanıtımı | [ ] |
| 28 | **Footer ve İletişim sayfasına sosyal medya linkleri** ekle | [ ] |
| 29 | **Telegram kanalı aç** — sabah 09:30 otomatik günlük hal bülteni (backend cron ile) | [ ] |
| 30 | **sameAs** property — Organization schema'ya sosyal medya profil URL'leri ekle | [ ] |

---

## 🟡 ORTA — Bu Çeyrek

### Rakip Analiz (Agrimetre'den İlham) — EKOSISTEM-PLAN P1/P2

| # | Özellik | Öncelik | Durum |
|---|---------|---------|-------|
| 31 | **Geçen hafta / geçen yıl karşılaştırması** — fiyat kartlarında `+%18 geçen yıla göre` etiketi | P1 | [ ] |
| 32 | **Haftalık e-bülten** — "Bu hafta en çok değişen 10 ürün" otomatik e-posta | P1 | [ ] |
| 33 | **Sezonluk rehber bölümü** — anasayfada "Şu an mevsimi olan ürünler" kartları | P1 | [ ] |
| 34 | **Türkiye interaktif haritası** — il bazında fiyat haritası, SVG + renk skalası | P2 | [ ] |
| 35 | **ÜFE/TÜFE entegrasyonu** — fiyat artışını enflasyona karşı göster | P2 | [ ] |
| 36 | **İl bazında üretim notu** — `/urun/[slug]` → "Bu ürün en çok Antalya'da yetişir" | P2 | [ ] |

### Marka Otoritesi & GEO

| # | Görev | Durum |
|---|-------|-------|
| 37 | **Google News başvurusu** — tarım fiyatları haberlerini geniş kitlelere ulaştırır | [ ] |
| 38 | **Tarım sektörü yayınlarına basın bülteni** — Endeks verisi haberlestirilebilir (Dünya Gazetesi, Tarım TR vb.) | [ ] |
| 39 | **Yıllık fiyat raporu PDF** — "Türkiye Hal Fiyatları Yıllık Raporu 2025" — AI sistemlerinin alıntılayacağı orijinal araştırma | [ ] |
| 40 | **API dokümantasyon sayfası** — DataFeed schema ile belgelenmiş, kurum kullanıcıları çeker | [ ] |
| 41 | **Embed widget "Sitenize Ekleyin" özelliği** — schema ile zenginleştir, backlink kaynağı olarak kullan | [ ] |

### Ekosistem Entegrasyon

| # | Görev | Durum |
|---|-------|-------|
| 42 | **Ekosistem auth entegrasyonu (SSO)** — `hf_user_favorites` tablosunu seed'e ekle, `registerAuth` shared-backend'den aktif et | [ ] |
| 43 | **Haftalık e-bülten backend** — newsletter subscriber tablosu + e-posta şablonu + cron | [ ] |
| 44 | **Ziraat Haber Portali entegrasyonu** — `/api/v1/prices/weekly-summary` otomatik haber olarak yayınlanıyor mu? | [ ] kontrol et |

---

## 🟢 DÜŞÜK — Yıl İçi

### Özellikler (EKOSISTEM-PLAN P3)

| # | Özellik | Durum |
|---|---------|-------|
| 45 | **Ücretsiz Geliştirici API** — açık API dokümantasyonu (Agrimetre bunu ücretli tutuyor — güçlü farklılaşma) | [ ] |
| 46 | **Pro üyelik** — 99 TL/ay: daha fazla geçmiş veri, API key, öncelikli destek | [ ] |
| 47 | **Mobil uygulama** — Agri Wise benzeri, hal odaklı (PWA hazır, native adım) | [ ] |
| 48 | **Kurumsal raporlar** — zincir marketler / ihracatçılar için özel rapor | [ ] |

---

## 📊 Skor Durumu & Hedefler

| Kategori | Rapor (08.05) | Mevcut Tahmin | Hedef |
|---|---|---|---|
| AI Alıntılanabilirlik & Görünürlük | 28/100 | ~35 | 60/100 |
| Marka Otoritesi Sinyalleri | 12/100 | 12 | 40/100 |
| İçerik Kalitesi & E-E-A-T | 25/100 | ~30 | 55/100 |
| Teknik Altyapı | 38/100 | ~45 | 65/100 |
| Yapılandırılmış Veri | 2/100 | ~35 | 70/100 |
| Platform Optimizasyonu | 15/100 | 15 | 45/100 |
| **GENEL** | **22/100** | **~38** | **55/100** |

### Hızlı Kazanım Sıralaması (Efor / Etki)

| Sıra | Görev (Çeklistteki #) | Efor | GEO Etkisi |
|---|---|---|---|
| 1 | #5 — PriceSpecification schema | 1 saat | +8 puan |
| 2 | #9 — SiteLinksSearchBox schema | 30 dk | +3 puan |
| 3 | #6 — FAQPage schema + SSS bölümü | 2 saat | +5 puan |
| 4 | #7 — BreadcrumbList tüm sayfalara | 1 saat | +4 puan |
| 5 | #13 — Placeholder telefon düzelt | 5 dk | +3 puan (güven) |
| 6 | #17 — Meta description şablon (hal/urun) | 2 saat | +4 puan |
| 7 | #18 — llms.txt format doğrula | 30 dk | +3 puan |
| 8 | #20/#21 — Editoryal içerik (5 pilot sayfa) | 3 saat | +6 puan |
| 9 | #26/#27 — Sosyal medya hesabı aç | 1 saat | +5 puan (marka) |
| 10 | #25 — CCBot Allow (robots.txt) | 5 dk | +2 puan |

---

## Notlar

- **Yapılan (08.05 sonrası):** JSON-LD anasayfa/fiyatlar/hal/urun/endeks/metodoloji ✅ | Sitemap dinamik ✅ | Metodoloji sayfası ✅ | GA4 entegrasyonu ✅ | Hava widget `/hava/widget` ✅
- **Yapılan (12.05 oturum 2):** PriceSpecification (#5) ✅ | DataCatalog /fiyatlar (#8) ✅ | CCBot Allow (#25) ✅ | İletişim bilgileri DB (#13/#14) ✅ | FAQPage /urun/[slug] (#6/#23) ✅ | llms-full.txt dinamik (#19) ✅
- **CCBot kararı:** Common Crawl verisi AI modellerinin eğitiminde kullanılır. Allow edilirse gelecekte AI sistemlerinin haldefiyat.com verisini öğrenme ihtimali artar. Düşük risk, yüksek uzun vadeli etki.
- **Sosyal medya önceliği:** Marka otoritesi 12/100 — en düşük ikinci skor. Hesap açmak ücretsiz, etki yüksek.
- **PriceSpecification:** Schema.org'da fiyat veri platformları için en kritik schema. Google'ın özellikle önerdiği; eklenince "Yapılandırılmış Veri" skoru 2/100'den 25+/100'e çıkabilir.
