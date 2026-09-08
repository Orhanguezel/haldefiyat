# Analiz raporu ekranları — 8 Eylül 2026

## Uygulama
- Yönetim listesi: resimli satırlar, özet, durum, tarih, yazar, kayıt/kelime sayısı; klavyeyle kullanılabilen önizleme ve doğrudan düzenleme bağlantısı.
- Liste yükleme hatasında yeniden deneme; arama ve durum/kaynak filtreleri korunur.
- Detay çekmecesi: kapak, okunabilir özet, rapor/SEO bilgileri ve mevcut yayın işlemleri.
- Düzenleme: geniş içerik alanı, kapak/özet yan paneli, mobilde sarmalanan sekmeler; içerik, SEO, görsel ve kalite işlevleri korunur.
- Site: analiz listesi, ana sayfa Son Analiz Raporları ve ilgili analizler aynı resimli kartı kullanır. Grafik görselleri kırpılmaz.
- Özel kapakların göreli URL çözümlemesi düzeltildi. Yayındaki kapaksız raporlar mevcut OG görselini kullanır; yönetimde görsel yüklenemezse açıklayıcı yer tutucu vardır. Kaydedilmemiş taslak için yayımlanmış OG adresi uydurulmaz.

## Doğrulama
- Frontend ve admin TypeScript kontrolleri başarılı; `git diff --check` temiz.
- Playwright: gerçek rapor verisiyle liste ve detay çekmecesi; düzenleme/önizleme sekmesi; 390px genişlikte analiz listesi, detay, widget ve editörde yatay taşma yok.
- Ana sayfa widget'ında altı kapaklı kart doğrulandı.
- Yerel yönetim kontrolünde yalnızca GET/HEAD/OPTIONS isteklerine izin verildi; yerel CORS başlıkları tarayıcı testinde uyarlandı. Canlı API/izin politikası değiştirilmedi.
- İçerik kaydetme, rapor üretme, yayın durumu veya sosyal paylaşım işlemi yapılmadı.
- Görsel kanıtlar: `output/playwright/report-ui/`.

## Canlı kontrol
Canlı sürüm: cd3f50758210. Backend, frontend ve admin üretim derlemeleri tamamlandı. Dağıtım penceresinde nginx 5xx: 0. Sağlık: status=ok, db=ok. Canlı admin listesi ve 31 numaralı rapor editöründe özel kapak yüklendi; 1440px görünümde taşma yok. Canlı analiz listesinde 20 görselli kart, 390px genişlikte taşma yok; lazy yükleme tamamlandıktan sonra kapak doğrulandı (live-public-cover.txt). Mevcut admin favicon 404 hatası rapor kapaklarını etkilemiyor. Test boyunca yayın/telemetri POST istekleri engellendi.
