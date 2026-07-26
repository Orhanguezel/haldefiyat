# Antalya Serik Hali Anahtar Kelime Canlı Denetimi — 2026-07-26

## Denetim kimliği

- Denetim URL’si: `https://haldefiyat.com/hal/antalya-hal-serik`
- Hedef ana sorgu: `Antalya Serik Hali fiyatları`
- Yakın niyetler: `Serik hali`, `güncel hal fiyatları`, `toptan fiyat`,
  `güncel fiyat listesi`
- İlk araç: Kullanıcı tarafından paylaşılan YourSeoBoard/SEOLOG ekran görüntüsü
- İlk görüntü tarihi: 2026-07-26 oturumu; araç ekranında ayrı crawl timestamp’i
  görünmediği için daha kesin bir tarih uydurulmadı.
- Canlı tekrar taraması: 2026-07-26

## Canlı SSR sonucu

```text
Title: Antalya Serik Hali Fiyatları 2026 — Güncel Toptan Liste
Description: Antalya Serik Hali güncel hal fiyatları. Son listede 10 ürün
             (26 Temmuz 2026) ... min/ort/maks toptan fiyat ...
H1: Antalya Serik Hali
H2: Antalya Serik Hali fiyatları bugün ne durumda?
Canonical: https://haldefiyat.com/hal/antalya-hal-serik
```

Script/style/SVG çıkarıldıktan sonra görünür metin 306 kelimedir. Ham görünür
metinde `Serik` 30, `Antalya` 16, `Serik hali` 5 ve `hal fiyatları` 2 kez
geçmektedir. Bu sayılar editoryal yoğunluk hedefi değildir; tablo ve navigasyon
bağlamları ayrıca değerlendirilmelidir.

## Karar

- Hedef sorgu title, description, H1/H2 ve görünür cevap bağlamında doğal olarak
  mevcuttur.
- İlk araçtaki “düşük yoğunluk” uyarısı için metin çoğaltılmadı.
- Önceki şablon düzeltmesiyle tablo satırlarında şehir/hal tekrarları azaltılmıştır.
- GSC sorgu/CTR etkisi 28 günlük veri oluşmadan tamamlanmış sayılmaz ve açık
  checklist’te ayrı madde olarak kalır.

## 27 Temmuz değişiklik sonrası tekrar taraması

Tekrar çalıştırılabilir denetim:

```bash
node scripts/seo/keyword-density-audit.mjs \
  https://haldefiyat.com/hal/antalya-hal-serik \
  artifacts/seo/keyword-density-2026-07-27
```

Canlı sonuç:

- HTTP 200, self-canonical, `index, follow`
- Title: `Antalya Serik Hali Fiyatları 2026 — Güncel Toptan Liste`
- Description hedef şehir/hal, güncellik, ürün sayısı, kesin veri tarihi ve
  toptan fiyat niyetini içeriyor.
- Tek H1: `Antalya Serik Hali`
- Açıklayıcı H2:
  `Antalya Serik Hali fiyatları bugün ne durumda?`
- Tüm görünür metin: 379 kelime.
- Tablo, navigasyon, footer, form, seçenekler, gizli içerik, script/style/SVG
  hariç ana içerik: 169 kelime.
- Tam hedef ifade ana içerikte 1 kez; `Antalya Serik Hali` 4 kez,
  `Serik Hali` 4 kez.
- Ham görünür metindeki `Serik` sayısı 30 iken boilerplate/tablo hariç ana
  içerikte 8'dir. Bu ayrım, araç ekranındaki tekrar sayısının editoryal yoğunluk
  olarak yorumlanmaması gerektiğini doğrular.

Karar değişmedi: title/meta/H1-H2 dağılımı ve görünür cevap doğal; keyword
stuffing veya yalnız araç puanı için yeni tekrar eklenmeyecek. Teknik yeniden
tarama tamamlandı. 28 günlük GSC sorgu/CTR karşılaştırması için en erken
değerlendirme tarihi **24 Ağustos 2026**; birleşik checklist maddesi bu nedenle
açık kalır.

Ham kanıt:
`artifacts/seo/keyword-density-2026-07-27/report.json` ve `report.md`.
