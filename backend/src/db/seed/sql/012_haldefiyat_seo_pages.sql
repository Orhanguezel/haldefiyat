SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- Per-page OG görselleri storage'da: backend/uploads/og/<key>.png
-- nginx /uploads/ -> backend/uploads/ alias ile serve edilir.
-- Antigravity üretimi 16 editoryal görsel (1200x630). Detay sayfaları
-- (urun/[slug], hal/[slug]) ayrı dinamik OG alır — buradaki "urun"/"hal"
-- LİSTE sayfası içindir.

INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`)
VALUES (
  UUID(),
  'hal-fiyatlari__seo_pages',
  'tr',
  '{
    "home": {
      "title": "Türkiye Hal Fiyatları — Günlük, Gerçek Zamanlı",
      "description": "81 ilin hal ve pazar fiyatları tek ekranda. Sebze, meyve ve bakliyat fiyatlarını şehir ve kategori bazında karşılaştırın.",
      "og_image": "/uploads/og/home.png",
      "no_index": false
    },
    "fiyatlar": {
      "title": "Güncel Hal Fiyatları",
      "description": "Tüm Türkiye hal fiyatlarını filtreleyin: şehir, kategori, tarih aralığı.",
      "og_image": "/uploads/og/fiyatlar.png",
      "no_index": false
    },
    "hal": {
      "title": "Tüm Haller",
      "description": "Türkiye genelindeki hal ve pazarlar bölgelere göre gruplandırılmış liste. Fiyat sayfasına doğrudan erişin.",
      "og_image": "/uploads/og/hal.png",
      "no_index": false
    },
    "urun": {
      "title": "{{name}} Hal Fiyatı",
      "description": "Türkiye genelinde {{name}} hal fiyatları, trend grafikleri ve güncel karşılaştırma.",
      "og_image": "/uploads/og/urun.png",
      "no_index": false
    },
    "endeks": {
      "title": "HaldeFiyat Endeksi",
      "description": "Türkiye hal fiyatlarının haftalık sepet endeksi. Baz haftaya göre değişimi izleyin.",
      "og_image": "/uploads/og/endeks.png",
      "no_index": false
    },
    "karsilastirma": {
      "title": "Fiyat Karşılaştırma | HaldeFiyat",
      "description": "Aynı grafikte birden fazla ürünün fiyat trendini karşılaştırın.",
      "og_image": "/uploads/og/karsilastirma.png",
      "no_index": false
    },
    "uyarilar": {
      "title": "Fiyat Uyarıları | HaldeFiyat",
      "description": "Seçtiğiniz ürün ve hal için fiyat eşiği belirleyin. Hedef fiyata ulaşınca e-posta ile bildirim alın.",
      "og_image": "/uploads/og/uyarilar.png",
      "no_index": false
    },
    "hakkimizda": {
      "title": "Hakkımızda | HaldeFiyat",
      "description": "HaldeFiyatın Türkiye hal fiyatları verisini nasıl topladığını ve sunduğunu keşfedin.",
      "og_image": "/uploads/og/hakkimizda.png",
      "no_index": false
    },
    "iletisim": {
      "title": "İletişim | HaldeFiyat",
      "description": "HaldeFiyat ekibiyle iletişime geçin; soru, öneri ve destek taleplerinizi gönderin.",
      "og_image": "/uploads/og/iletisim.png",
      "no_index": false
    },
    "giris": {
      "title": "Giriş Yap | HaldeFiyat",
      "description": "HaldeFiyat hesabınıza giriş yapın.",
      "og_image": "/uploads/og/giris.png",
      "no_index": true
    },
    "kayit": {
      "title": "Kayıt Ol | HaldeFiyat",
      "description": "HaldeFiyata üye olun.",
      "og_image": "/uploads/og/kayit.png",
      "no_index": true
    },
    "favoriler": {
      "title": "Favori Ürünlerim",
      "description": "Favori ürünleriniz için güncel hal fiyatlarını tek ekranda takip edin.",
      "og_image": "/uploads/og/favoriler.png",
      "no_index": true
    },
    "api_docs": {
      "title": "API Dokümantasyonu",
      "description": "HaldeFiyat açık API — fiyat verileri, hal listesi, haftalık endeks ve daha fazlası.",
      "og_image": "/uploads/og/api_docs.png",
      "no_index": true
    },
    "gizlilik_politikasi": {
      "title": "Gizlilik Politikası | HaldeFiyat",
      "description": "HaldeFiyat gizlilik politikası ve kişisel verilerin korunmasına ilişkin bilgilendirme.",
      "og_image": "/uploads/og/gizlilik_politikasi.png",
      "no_index": false
    },
    "kullanim_kosullari": {
      "title": "Kullanım Koşulları | HaldeFiyat",
      "description": "HaldeFiyat kullanım koşulları ve platform kullanımına ilişkin kurallar.",
      "og_image": "/uploads/og/kullanim_kosullari.png",
      "no_index": false
    },
    "kvkk": {
      "title": "KVKK Aydınlatma Metni | HaldeFiyat",
      "description": "HaldeFiyat KVKK aydınlatma metni ve kişisel veri işleme süreçleri.",
      "og_image": "/uploads/og/kvkk.png",
      "no_index": false
    }
  }'
)
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);

INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`)
SELECT UUID(), 'hal-fiyatlari__seo_pages', '*', `value`
FROM `site_settings`
WHERE `key` = 'hal-fiyatlari__seo_pages' AND `locale` = 'tr'
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);
