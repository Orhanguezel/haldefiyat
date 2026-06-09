# GSC İndeksleme Düzeltme Planı & Checklist (2026-06-09)

> Kaynak: GSC Coverage export (`haldefiyat.com-Coverage-2026-06-09.zip`) + `/admin/redirects`
> (SEO audit: `GET /api/v1/admin/seo-audit`) + canlı sitemap/sayfa doğrulaması.
> Önceki analiz: [`SEO-INDEXLEME-RAPORU-2026-06-06.md`](SEO-INDEXLEME-RAPORU-2026-06-06.md).
> Rol: **Claude** teşhis/tasarım · **Codex** implement · **Orhan** GSC console + operasyon.

---

## 0. KRİTİK BAĞLAM — GSC export GECİKMELİ

GSC Coverage export'u **06-06 ile birebir aynı** (Grafik 29 May'de bitiyor — ~10 gün
gecikme). **Firma SEO fix'i (06-06 deploy) henüz GSC'ye yansımadı.** Yani export'taki
"227 Keşfedildi-indekslenmedi" eski (1.322 firma) durumu; gerçek durum **çok daha iyi.**

**GERÇEK CANLI DURUM (06-09 doğrulandı):**
- Sitemap **1.729 → 459 URL** (1.322 ince firma çıkarıldı). 340 ürün + **60 firma hub** + 35 hal + 9 analiz + statik.
- Firma hub'ları canlı: `/firmalar/mersin` ("Mersin Hal Komisyoncuları 2026 — 240 Firma"), `/firmalar/antalya`, `/firmalar/komisyoncu` ✅
- Tekil firma sayfaları noindex + sitemap dışı ✅
- Borsa ürünleri indexli: `/urun/bugday`, `/urun/arpa` ✅
- **SEO audit (ürün tarafı TEMİZ):** 1151 ürün, **340 indexli**, `ready_not_indexed: 0` (açılmayı bekleyen yok), `variant_indexed: 0`. Sadece **3 thin_indexed + 1 lowquality_indexed** temizlenecek.

> **Özet:** İndeksleme işinin %90'ı zaten yapıldı (firma noindex+hub, ürün doygun). Kalan iş:
> (1) GSC'yi re-crawl'a zorla, (2) 4 küçük ürün temizliği, (3) izle, (4) hub'ları indexlet.

---

## GSC indekssiz 591 — bucket durumu (güncel yorum)

| Bucket | Sayı | Gerçek durum (06-09) | Aksiyon |
|---|---|---|---|
| Keşfedildi–indekslenmedi | 227 | **Firma sayfaları** — artık noindex+sitemap dışı, **hub'lar geldi** | GSC re-crawl bekliyor → erir; hub'lar indexlenir |
| "noindex" etiketi | 210 | İnce varyant ürünler (tasarım gereği) | Dokunma ✅ |
| Yönlendirmeli | 87 | Varyant→master canonical (by-design) | Dokunma; orphan fix yapıldı |
| Alternatif + canonical | 41 | Varyant→master (doğru) | Dokunma ✅ |
| Tarandı–indekslenmedi | 18 | İnce ürün/firma kalite | F2 temizlik + hub'lar |
| Robots 5 / 404 3 | 8 | `?_rsc=` + kırık (çözüldü) | Minor |

---

## FAZ 1 — GSC'yi re-crawl'a zorla (P0, Orhan · GSC Console)

> Firma fix canlı ama GSC eski durumu gösteriyor. Re-crawl'ı hızlandır:

- [ ] **1.1** GSC → Site Haritaları → `sitemap.xml`'i **yeniden gönder** (459 URL, hub'lar dahil).
- [ ] **1.2** URL Denetimi → **firma hub'larını "İndekslemeyi iste"** (öncelikli ~10): `/firmalar/mersin`, `/firmalar/antalya`, `/firmalar/adana`, `/firmalar/konya`, `/firmalar/izmir`, `/firmalar/bursa`, `/firmalar/komisyoncu`, vb.
- [ ] **1.3** URL Denetimi → **borsa ürünleri**: `/urun/bugday`, `/urun/arpa`, `/urun/misir`, `/urun/aycicegi`, `/urun/pamuk` → indeksleme iste.
- [ ] **1.4** (opsiyonel) Eski firma URL'leri için ayrı işlem GEREKMEZ — sitemap'ten çıktı + noindex, Google zamanla düşürür.

## FAZ 2 — Ürün audit temizliği (P1, Codex/Claude · `/admin/seo-audit`)

> `/admin/redirects` (seo-audit) verisi: ürün tarafı temiz, 4 küçük iş.

- [ ] **2.1** `thin_indexed` (3 ürün): seoIndex=1 ama editorial yok → `POST /admin/seo-audit/actions {action:"set-noindex"}` ile noindex. (interlock zaten noindex tutuyor; kaydı netleştir.)
- [ ] **2.2** `lowquality_indexed` (1 ürün): seoIndex=1 ama dataQuality<70 → ya editorial+kalite ekle ya noindex.
- [ ] **2.3** Audit'i `filter=issues` ile periyodik kontrol et (haftalık) — yeni thin/variant çıkarsa temizle.

## FAZ 3 — İzleme (P1, Orhan · 1-2 hafta)

- [ ] **3.1** 1 hafta sonra GSC Coverage tekrar export → **"Keşfedildi-indekslenmedi 227" düşüyor mu** (firma fix yansıması).
- [ ] **3.2** **İndexli sayfa** 409'dan yukarı mı (60 hub + borsa ürünleri eklendikçe).
- [ ] **3.3** Firma hub'ları ("mersin hal komisyoncu" sorgusu) GSC Performans'ta görünüyor mu.
- [ ] **3.4** GSC export her zaman ~10 gün gecikmeli — anlık karar verme, trend izle.

## FAZ 4 — İndekslenebilir sayfa büyütme (P2, Codex)

> Mevcut indexli doygun (340 ürün, eligible'lar açık). Büyüme yeni içerikten:

- [ ] **4.1** Firma hub'ları indexlendikçe izle; `/firmalar/{sehir}/{tip}` kombinasyon hub'ları (Faz B, firma-seo.md) — büyük illerde ek uzun-kuyruk.
- [ ] **4.2** Firma zenginleştirme → tekil firma re-index (firma-seo.md F5): firma sayfasına canlı hal fiyatı + AI açıklama → kalite barajı geçenleri seo_index=1 (claim funnel ile rıza geldikçe).
- [ ] **4.3** Haftalık analiz raporları (/analiz) — düzenli yayınla (her hafta indexli içerik).
- [ ] **4.4** Borsa dikeyi genişlet (çeltik/zeytin/bakliyat — BORSA checklist Faz B) → yeni indexli ürün sayfaları.

---

## ⚠️ Bucket'lara DOKUNMA (yanlış müdahale riski)
- **210 noindex** = ince varyant ürünler, KASITLI. Index'letme (thin content domain otoritesi düşürür).
- **87 yönlendirme / 41 alternatif** = varyant→master canonical, by-design. Normal.
- Bunlar "hata" değil; GSC'nin doğru çalıştığının işareti.

## Roller
- **🧠 Claude:** bucket teşhis + audit yorumu (bu dosya); F2 hangi ürün temizlenecek kararı.
- **🛠️ Codex:** F2 audit aksiyonları (set-noindex) · F4 hub combo + firma zenginleştirme.
- **👤 Orhan:** F1 GSC console (sitemap resubmit + URL inspection) · F3 izleme.

## Sonraki somut adım
1. **F1.1-1.3** — Orhan GSC'de sitemap resubmit + hub/borsa URL indexleme iste (en hızlı etki).
2. **F2.1-2.2** — Codex 4 ürün audit temizliği.
3. **F3** — 1 hafta sonra GSC tekrar bak.
