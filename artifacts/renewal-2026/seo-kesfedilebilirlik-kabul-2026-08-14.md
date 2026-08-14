# SEO ve Keşfedilebilirlik Kabulü — 14 Ağustos 2026

## Kapsam ve kararlar

- Public ailelerin title, description, canonical, index ve schema sözleşmesi
  `docs/SEO-PUBLIC-SAYFA-STANDARDI.md` içinde tekleştirildi.
- Ürün, hal, firma, analiz ve yıllık rapor sayfaları veri/içerik varlığına göre
  index kapısı kullanıyor; auth, hesap ve form yüzeyleri sitemap dışında ve noindex.
- Sitemap yalnız canonical ürün, özgün editoryalli aktif hal, SEO uygun firma/hub,
  yayınlanmış analiz ve gerçek rapor yıllarını içeriyor.
- Ürün/hal `lastmod` değeri teknik write zamanı yerine fiyat kaydı; analizde
  editoryal inceleme/yayın, firmada son görülme zamanı kullanılıyor.
- Detay metadata anahtarının liste anahtarıyla çakışmadığı regresyon testi eklendi.
- Görünür breadcrumb ve schema aynı öğe dizisini kullanıyor; ortak test geçti.
- Temiz Veri ilk ekranı dekoratif hero fotoğrafı yüklemiyor. Mevcut ürün resmi
  sabit ölçü/`sizes` ile; eksik veya hatalı resim hafif, erişilebilir ve kararlı
  fallback ile gösteriliyor.

## Otomatik ve canlı kanıt

- Dış schema validator: ana sayfa, fiyatlar, ürün, hal, analiz, yıllık rapor,
  metodoloji ve yazar olmak üzere 8 URL; toplam **0 hata, 0 uyarı**.
  Ham çıktılar: `artifacts/renewal-2026/schema-validator-2026-08-14/`.
- SEO/Breadcrumb/ProductImage hedefli testleri geçti; sitemap tarih fixture'ları
  geçersiz tarihi reddediyor ve hal tarihini doğru hal ile ilişkilendiriyor.
- Canlı sitemap 14 Ağustos'ta **407 canonical URL** üretti. Temmuzdaki son tam
  crawl 316/316 HTTP 200, canonical/title/description/H1/JSON-LD hatası 0,
  duplicate kümesi 0 ve orphan adayı 0'dı:
  `artifacts/seo/live-crawl-internal-links-final-2026-07-26/report.json`.
- 14 Ağustos temsili aile crawl'ı
  `artifacts/renewal-2026/seo-live-crawl-2026-08-14/` altında saklandı. İlk koşu
  pahalı hal fiyatı sorgusunu görünür kıldı; CTE filtresi kapsam içine itildi ve
  `idx_ph_market_date_product` indeksi canlıda LOCK=NONE ile eklendi.
- Düzeltme sonrası aynı tek eşzamanlı 20 URL aile örneklemi **20/20 HTTP 200**,
  timeout 0, canonical/title/description/H1/JSON-LD/duplicate hatası 0 verdi.
  Örneklem içindeki tek yazar orphan adayı, o yazara bağlanan analiz sayfası 20
  URL'lik örneğe seçilmediği için örneklem grafiği artefaktıdır; Temmuz tam crawl
  sonucu orphan 0'dır.
- Performans düzeltmesi öncesi İzmir 10 yıllık güncel-fiyat API çağrısı 4,42 sn,
  sonrası 1,24 sn; yeni Konya hal SSR kabulü 4,92 sn. Timeout bırakan crawler
  sorguları sonlandırıldı ve ana sayfa 200/0,48–0,63 sn aralığına döndü.
- GSC 2/4/8 hafta ölçüm penceresi, sahip ve rollback işaretleri
  `artifacts/renewal-2026/gsc-2-4-8-hafta-izleme-plani-2026-08-14.md` içinde.

## Açık lisans borcu

Fallback davranışı kabul edildi; fakat mevcut foto manifestinde her dosya için
kaynak URL, eser sahibi ve lisans sürümü bulunmuyor. Commit geçmişi bazı dosyaları
Wikimedia Commons, daha eski seti Trabzon Belediyesi diye topluca tarif ediyor;
bu, dosya bazlı atıf için yeterli değildir. Kaynağı kanıtlanamayan fotoğraf yeni
yüzeye taşınmayacak. E9 yalnız gerçek provenance envanteri üretildiğinde kapanır.

## Sonuç

F5.1–F5.10'un uygulanabilir teknik kısmı tamamlandı. F5.9 tam orphan bazı için
Temmuz tam crawl'ı ve 14 Ağustos regresyon örneklemi birlikte kullanıldı. GSC'nin
2/4/8 haftalık sonuçları zaman geçişine bağlı izleme işidir; teknik kurulum kapalıdır.
