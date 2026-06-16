# Keşfedilmemiş Sayfa Analizi + Sayfa Kalitesi (2026-06-16)

> Tetik: GSC "İndexleme" sekmesinde indexsiz/keşfedilmemiş sayfalar. Metodoloji: wiribude
> `SEO_ICERIK_KALITE_STANDARDI` (4-boyut kalite skoru + GSC coverage_state triyajı) uyarlandı.

## 1. GSC durum dağılımı (134 denetlenen URL — cron 462'yi günlere yayıyor)
| Durum | n | Anlam |
|---|---|---|
| Submitted and indexed | 75 | ✅ indexli |
| **Discovered – currently not indexed** | **25** | Google buldu, değersiz görüp indexlemedi |
| Excluded by 'noindex' | 20 | Bizim kararımız (thin → noindex), **doğru** |
| URL is unknown to Google | 9 | Henüz keşfedilmedi |
| Crawled – currently not indexed | 3 | Tarandı, reddedildi (kalite) |
| Page with redirect | 2 | Slug fallback (308/307) |

**Keşfedilmemiş çekirdek = 25 + 9 + 3 = ~37 sayfa, 33'ü `/urun/`.**

## 2. KÖK NEDEN (kıyas kanıtı) — teknik bug değil, talep
| Sinyal | Keşfedilmemiş (26 ürün) | İndexlenen (62 ürün) |
|---|---|---|
| **search_volume (arama talebi)** | **0** | **350** |
| <3 market (seyrek fiyat) | %69 | %32 |
| dataQuality | 83 | 92 |
| editorial + seo_index | hepsi var | hepsi var |

**Belirleyici: arama talebi 0 + seyrek fiyat.** Keşfedilmemişler sıfır-talep niş ürünler
(alıç, asma yaprağı, bergamot, bakalyaro, brüksel lahanası). Sayfa teknik olarak sağlam
(editorial+index) ama **Google "bu sayfa kimseye lazım değil + ince" deyip crawl bütçesini
değerli sayfalara ayırıyor**. Bu normal long-tail/index-bloat davranışı.

## 3. Mevcut altyapı (zaten var — tekrar yazma)
- `data_quality` (0-100) formülü: fiyat + market + editorial bileşenleri.
- `runSeoIndexMaintenance` (haftalık cron): dq≥70 + fiyat>0 → index'e çevir; fiyat kaybı → noindex.
- `auditProducts`: triyaj (`lowquality_indexed`, `ready_not_indexed`, `no_price_data`, `few_markets`).
- **Eksik halka:** seoIndex kararı **arama talebini (search_volume) ve market sayısını dikkate almıyor** → sıfır-talep niş ürünler index'e açılıp Google tarafından reddediliyor.

## 4. Çözüm — KALİTE > NİCELİK (wiribude dersi)
Sıfır-talep sayfaları indexlemeye zorlamak düşük ROI (indexlense bile ~0 trafik). Doğru yol:

### Öneri A (önerilen): talep + kapsam kapısı
- **noindex et:** `search_volume = 0 AND market_count_30d < 3` olan ürünler → seoIndex=0.
  Crawl bütçesini ~344 değerli ürüne yoğunlaştırır, index kalite oranını yükseltir (Google
  thin-page oranı düşük siteleri ödüllendirir). `runSeoIndexMaintenance`'a tek kural eklenir.
- **Zenginleştir** (search_volume>0 ama indexsiz, borderline): iç link + daha fazla market.
- **İç linkleme:** indexlenecek niş ürünleri kategori/ilgili-ürün/anasayfa-hareket
  bölümlerinden linkle (crawl yolu + otorite sinyali).

### Öneri B (alternatif): hepsini indexlemeye zorla
İçerik derinleştir + güçlü iç link + fiyat kapsamı artır. Daha çok iş, sıfır-talep için düşük ROI.

## 5. Sayfa kalite skoru (wiribude + mevcut harman)
Mevcut `data_quality` + şu sinyaller birleştirilip admin "İçerik Denetimi" görünümü:
| Boyut | Sinyal | Kaynak |
|---|---|---|
| Veri bütünlüğü | fiyat satırı 30g, market sayısı | hf_price_history |
| Talep | search_volume | hf_products |
| İçerik | editorial 7 alan dolu mu, kelime sayısı | hf_product_editorial |
| Index sonucu | GSC coverage_state | gsc_url_index |
| Aksiyon | indexle / zenginleştir / noindex / birleştir | türetilir |

`auditProducts`'a `gsc_url_index` JOIN + `search_volume` ağırlığı eklenir → tek ekranda
"hangi sayfa neden indexsiz + ne yapmalı" görünür.

## 6. Önerilen sıra
1. **Karar:** Öneri A mı B mi (talep-kapısı = kalite>nicelik, önerilen).
2. A seçilirse: `runSeoIndexMaintenance`'a search_volume+market kapısı (tek SQL kuralı).
3. `auditProducts` + GSC join → admin denetim ekranı (kalite ölçümü görünür).
4. Cron 462'yi kapatınca (birkaç gün) tam indexsiz liste netleşir, borderline'lar zenginleştirilir.
