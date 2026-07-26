# HalDeFiyat GEO/SEO Operasyonel KPI'ları — 27.07.2026

## İlke

Tek bir “GEO skoru” başarı metriği değildir. Teknik uygunluk, gerçek kullanıcı
deneyimi, organik talep ve AI kaynaklı trafik ayrı kaynaklardan izlenir.
Kapsamı veya verisi olmayan metrik sıfır kabul edilmez; “yetersiz veri” olarak
raporlanır.

## KPI sözlüğü ve başlangıç durumu

| KPI | Kesin tanım | 27.07.2026 baseline | Hedef | Kaynak | Owner | Sıklık |
|---|---|---:|---:|---|---|---|
| Schema-valid temsilî şablon | Resmî Schema.org Validator'da error=0 ve warning=0 çıkan test URL'si / aylık sabit test seti | 8/8 (%100) | %100; yeni indekslenebilir şablon aynı ay sete eklenir | `schema-validator-audit.mjs` + ham validator JSON | Teknik SEO | Her deploy + aylık |
| Indexable sitemap URL | HTTP 200, index/follow ve self-canonical URL / sitemap'teki tüm URL | 316/316 (%100), 26.07 canlı crawl | %100 | `live-crawl.mjs`, sitemap ve SSR HTML | Teknik SEO | Her deploy + haftalık |
| CWV-good origin | CrUX p75'te LCP ≤2,5 sn, INP ≤200 ms, CLS ≤0,1 metriklerinin üçünü de geçen origin | Geçmiyor: LCP 3.080 ms; INP 170 ms, CLS 0 | Üçü de good; öncelik LCP ≤2.500 ms | CrUX origin, PSI API; GA4 RUM tanılayıcı | Frontend/Performans | 28 günlük kayan pencere, aylık |
| CWV-good URL oranı | URL-level CrUX alan verisinde üç metriği good olan URL / üç metriği de bulunan bağımsız URL-level örnek | 0/1 (%0): `/urun/limon` LCP 2.652 ms; `/fiyatlar` INP yok, iki URL origin fallback | Yeterli örnek oluştuğunda ≥%90; veri yokluğu ve origin fallback başarı sayılmaz | CrUX URL-level / PSI API | Frontend/Performans | Aylık |
| AI-referrer landing | Dış referrer hostu `chatgpt.com`, `gemini.google.com`, `copilot.microsoft.com`, `claude.ai`, `perplexity.ai` veya onaylı yeni AI hostu olan insan landing isteği | 6–26 Temmuz Nginx: 28 istek (ChatGPT 18, Gemini 7, Copilot 2, Claude 1) | İlk 90 günde aylık ≥50 doğrulanmış landing; bot UA hariç | Nginx combined access log; GA4 özel kanal doğrulaması | Analytics/Growth | Haftalık, aylık kapanış |
| Markalı organik talep | GSC sorgusu normalize edildiğinde `haldefiyat`, `hal de fiyat` veya `halde fiyat` eşleşen toplam gösterim/tıklama | 27 Haz–24 Tem: 5 gösterim, 4 tıklama, %80 CTR, konum 3,2 | 90 günde ≥25 aylık gösterim; CTR ikincil | GSC Search Analytics, query dimension | SEO/Growth | Aylık, tam 28 veri günü |
| AI citation | Sabit 40 sorguda haldefiyat.com URL citation bulunan yanıt / başarılı yanıt | Anthropic API web-search 18/40 (%45) | Aynı model/platform serisinde ≥%50; düşüşte grup analizi | AI benchmark ham JSON | GEO/İçerik | Aylık |

## Ölçüm kuralları

1. Schema KPI'sı tüm URL'lerin doğrulandığı iddiası değildir; indekslenebilir
   şablonları temsil eden sabit test setidir. Yeni şablon sete eklenir.
2. Sitemap oranında redirect, noindex, canonical mismatch, 4xx/5xx paya girmez;
   herhangi biri hedefi bozar.
3. Lighthouse laboratuvar sonucu CWV alan metriği yerine kullanılmaz.
4. AI crawler istekleri referral değildir. `ChatGPT-User`, `OAI-SearchBot`,
   `ClaudeBot` gibi user-agent kayıtları AI-referrer landing sayacına alınmaz.
5. İç sayfadan gelen ve URL'sinde `utm_source=chatgpt.com` kalan self-referrer
   istekleri yeni landing sayılmaz. Baseline yalnız dış referrer hostuna dayanır.
6. Dönem, platform veya model değişirse seri ayrıca etiketlenir; oranlar
   bağlamsız tek puana çevrilmez.

## Operasyonel çıktı

- Haftalık kontrol: sitemap ve son deploy schema kabulü, dış AI referrer
  kırılımı.
- Aylık kapanış: CrUX, tam 28 günlük GSC, AI citation ve markalı sorgu trendi.
- Alarm: sitemap/schema <%100; origin CWV'de good→needs improvement/poor geçişi;
  AI referral veya citation'da önceki döneme göre ≥%30 düşüş.
- Kanıtlar tarihli `artifacts/seo/` ve `docs/geo-seo/` dizinlerinde saklanır.
