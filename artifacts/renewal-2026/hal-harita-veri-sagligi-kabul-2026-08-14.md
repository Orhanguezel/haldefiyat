# Hal, Harita ve Veri Sağlığı Kabulü — 14 Ağustos 2026

## Dağıtılan kapsam

- Temel sürüm: `8f75755a`
- Mobil tablo genişliği düzeltmesi: `c91f9796`
- Canlı sayfalar: `/hal`, `/hal/ankara-hal`, `/harita`, `/data-health`
- Mobil viewport: `390x844`

## Bilgi mimarisi

- “Haller”, “Fiyat haritası” ve “Veri sağlığı” ortak `Hal ve veri görünümü` navigasyonuna bağlandı.
- Her sayfa kendi bağlantısında `aria-current="page"` kullanıyor.
- Hal detayında güncel fiyat listesi, ilan/firma katmanı ve “Künye ve İletişim” ayrı semantik bölgeler olarak gösteriliyor.
- Ankara hal detayında tek H1, ayrı fiyat bölgesi başlığı, ayrı iletişim bölgesi ve yatay taşmasız mobil görünüm doğrulandı.

## Metrik ve harita sözleşmesi

- Sayaç adları ile zaman pencereleri `frontend/src/lib/public-metrics.ts` içindeki merkezi sözlükten geliyor.
- Harita 15 ürünlük sabit sepet endeksini kullanıyor; sayfa özeti ve harita içi sayaç farklı pencereleri açık adlarıyla ifade ediyor.
- SVG harita 81 ili klavye ile seçilebilir `role="button"` yollar olarak sunuyor.
- Mobil alternatif liste 19 endeksli ilin tamamını il, endeks, hal sayısı ve fiyat bağlantısıyla gösteriyor.
- Liste `340/340 px`, doküman `390/390 px`; yatay taşma yok.

## Gerçek veri olayları

- `/api/v1/sources/status` canlı yanıtı `56` kaynak ve en yeni `12` gerçek `hf_etl_runs` olayını döndürdü.
- Olaylar en yeni önce; kaynak, güvenli durum, işlenen satır sayısı ve gerçek çalışma zamanını taşıyor.
- Sorgu `error_msg` alanını hiç seçmiyor. Mapper testi iç hostname/dosya yolu içeren ham hata verisinin public çıktıya girmediğini doğruluyor.
- `/data-health` mobil kabulünde 12 olay, tek H1, yatay taşmasız görünüm ve iç detay sızıntısı olmaması doğrulandı.
- Canlı tarayıcı konsolu: `0` hata, `0` uyarı.

## Otomatik kapılar

- Backend TypeScript ve production build: geçti.
- Backend güvenli olay mapper testleri: 2/2 geçti.
- Frontend ESLint ve TypeScript: geçti.
- Frontend testleri: 26 dosya / 79 test geçti.
- Frontend production build ve standalone asset senkronu: geçti.

## Görsel kanıt

- `output/playwright/theme-clean-data/harita-liste-mobile-2026-08-14.png`
- `output/playwright/theme-clean-data/data-health-events-mobile-2026-08-14.png`

