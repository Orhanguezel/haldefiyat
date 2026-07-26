# HalDeFiyat AI Görünürlük Baseline'ı — 27.07.2026

## Kapsam

- 40 sabit Türkçe sorgu: 5 genel, 10 ürün, 10 hal, 5 yerel, 5 firma,
  3 metodoloji ve 2 veri/API niyeti.
- Platform: `Anthropic Messages API + web_search`
- Model: `claude-haiku-4-5`
- Hesap durumu: kimliği doğrulanmış canlı backend API projesi.
- Konum/kişiselleştirme: API yüzeyi; tüketici arayüzü oturumu ve kişiselleştirme
  uygulanmaz.
- Yanıt talimatı: tarafsız Türkçe cevap, gerektiğinde web araması, en fazla
  120 kelime ve bağlantılı kaynak atıfları.

Bu çalışma Claude.ai veya ChatGPT tüketici arayüzü sonucu değildir. Platform
alanı bu nedenle API yüzeyi olarak açıkça tutulmuştur.

## Sonuç

| Ölçüm | Sonuç |
|---|---:|
| Başarılı sorgu | 40/40 |
| Hatalı sorgu | 0 |
| HalDeFiyat marka geçişi | 10/40 (%25) |
| haldefiyat.com citation/link | 18/40 (%45) |

| Sorgu grubu | Sorgu | Marka geçişi | Citation |
|---|---:|---:|---:|
| Genel | 5 | 2 | 3 |
| Ürün | 10 | 1 | 7 |
| Hal | 10 | 4 | 4 |
| Yerel | 5 | 0 | 1 |
| Firma | 5 | 2 | 2 |
| Metodoloji | 3 | 0 | 0 |
| Veri/API | 2 | 1 | 1 |

HalDeFiyat citation alan 18 cevabın 10'unda kaynak ilk sıradaydı. Ürün
grubunda 10 sorgunun 7'si citation aldı; metodoloji grubunda marka/citation
görülmedi. Bu sonuçlar içerik önceliği için baseline'dır, olasılık veya
garantili görünürlük skoru değildir.

## Tekrar üretilebilir kanıt

- Sabit sorgular: `scripts/seo/ai-visibility-queries.json`
- Çalıştırıcı: `scripts/seo/ai-visibility-benchmark.mjs`
- Ham cevaplar, citation URL/sırası, tarih, model, platform, hesap/konum
  durumu ve request kimlikleri:
  `artifacts/seo/ai-visibility-2026-07-27/results.json`
- Özet: `artifacts/seo/ai-visibility-2026-07-27/summary.md`

Canlı backend ortamında aylık tekrar:

```bash
node --env-file=backend/.env scripts/seo/ai-visibility-benchmark.mjs \
  --provider=anthropic \
  --output=artifacts/seo/ai-visibility-YYYY-MM-DD \
  --date=YYYY-MM-DD
```

Sorgu dosyası ve sistem talimatı değiştirilmez. Model değişirse eski seriyle
doğrudan kıyaslanmaz; model ayrı kırılım olarak kaydedilir. Aylık sonuçta marka
geçiş oranı, citation oranı, ilk citation oranı ve grup dağılımı karşılaştırılır.

## Sınırlar ve açık platform bulgusu

- Sonuçlar stokastiktir; indeks, model, tarih ve sağlayıcıya göre değişebilir.
- API çağrısı giriş yapılmış veya kişiselleştirilmiş kullanıcı arayüzünü yeniden
  üretmez.
- OpenAI Responses API + `web_search` için iki sorguluk pilot, kimlik
  doğrulamadan sonra `429 insufficient_quota` verdi. OpenAI tarafı ölçülmüş
  kabul edilmedi; kota açıldığında aynı sorgu seti ayrı platform serisi olarak
  çalıştırılmalıdır.
- Değişiklik öncesi ölçüm geçmişte alınmadığı için 27 Temmuz sonucu başlangıç
  baseline'ıdır. İlk gerçek aylık değişim karşılaştırması 27 Ağustos 2026 veya
  sonrasında yapılabilir.
