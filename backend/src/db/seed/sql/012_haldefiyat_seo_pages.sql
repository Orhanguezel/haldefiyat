SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- OG görselleri DİNAMİK route'tan gelir: /og/default (frontend/src/app/og/default).
--
-- 2026-08-31 düzeltmesi: burada per-page statik dosyalar yazılıydı
-- (/uploads/og/<key>.png). O dosyalarda KOYU zeminin üzerine AÇIK ZEMİN İÇİN olan
-- logo basılıydı — lacivert "halde" yazısı koyu fonda okunmuyordu; sosyal
-- paylaşımlarda ve arama sonuçlarında marka kayboluyordu.
-- /og/default aynı arka planı kullanır ama logoyu koyu-tema varyantıyla ve beyaz
-- kontrast kutusu içinde basar (lib/og-brand.tsx -> logohaldefiyat_dark_theme.png).
--
-- 2026-09-17 düzeltmesi: o karar contrast'ı çözdü ama 22 sayfayı TEK görsele
-- indirdi; Tanitio kataloğu (17 Eyl) bunu "paylaşım görseli N sayfada aynı"
-- bulgusu olarak yazdı — hangi sayfanın paylaşıldığı ayırt edilemiyor.
-- Ölçülen contrast: "halde" glifleri panel zeminine karşı 1.19:1 (görünmez).
-- 16 editoryal görselin AYNISI, yalnız logo koyu-tema varyantıyla değiştirilerek
-- yeniden üretildi -> 12.33:1. Artık hem okunur hem sayfa başına ayrı.
-- Dosyalar bu kez REPO'da: frontend/public/og-pages/<key>.jpg (uploads/ gitignore'lu,
-- sunucu yeniden kurulursa kaybolurdu). Statik firmalar/* anahtarları /og/default
-- kalır; onların editoryal görseli yok.
-- Yeniden üretim: logohaldefiyat_dark_theme.png görünür bbox'a kırpılır,
-- 426x139'a ölçeklenip (383,173) konumuna alpha_composite edilir.
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
      "description": "Türkiye geneli hal ve pazar fiyatları tek ekranda. Sebze, meyve ve bakliyat fiyatlarını şehir ve kategori bazında karşılaştırın.",
      "og_image": "/og-pages/home.jpg",
      "no_index": false
    },
    "fiyatlar": {
      "title": "Güncel Hal Fiyatları {{year}} — Bugünkü Toptan Sebze & Meyve Fiyatları",
      "description": "Türkiye geneli güncel hal fiyatları: sebze, meyve ve bakliyat toptan/piyasa fiyatlarını şehir, kategori ve tarihe göre filtreleyin. Fiyatlar her gün sabah otomatik güncellenir.",
      "og_image": "/og-pages/fiyatlar.jpg",
      "no_index": false
    },
    "hal": {
      "title": "Tüm Haller",
      "description": "Türkiye genelindeki hal ve pazarlar bölgelere göre gruplandırılmış liste. Fiyat sayfasına doğrudan erişin.",
      "og_image": "/og-pages/hal.jpg",
      "no_index": false
    },
    "urun": {
      "title": "{{name}} Hal Fiyatı {{year}} — Toptan & Piyasa Fiyatları",
      "description": "{{name}} güncel hal, toptan ve piyasa fiyatları. {{priceLine}}Türkiye geneli günlük ortalama, 5 yıllık trend grafiği ve şehir bazlı karşılaştırma.",
      "og_image": "/og-pages/urun.jpg",
      "no_index": false
    },
    "endeks": {
      "title": "HaldeFiyat Endeksi",
      "description": "Türkiye hal fiyatlarının haftalık sepet endeksi. Baz haftaya göre değişimi izleyin.",
      "og_image": "/og-pages/endeks.jpg",
      "no_index": false
    },
    "karsilastirma": {
      "title": "Fiyat Karşılaştırma | HaldeFiyat",
      "description": "Aynı grafikte birden fazla ürünün fiyat trendini karşılaştırın.",
      "og_image": "/og-pages/karsilastirma.jpg",
      "no_index": false
    },
    "uyarilar": {
      "title": "Fiyat Uyarıları | HaldeFiyat",
      "description": "Seçtiğiniz ürün ve hal için fiyat eşiği belirleyin. Hedef fiyata ulaşınca e-posta ile bildirim alın.",
      "og_image": "/og-pages/uyarilar.jpg",
      "no_index": false
    },
    "hakkimizda": {
      "title": "Hakkımızda | HaldeFiyat",
      "description": "HaldeFiyatın Türkiye hal fiyatları verisini nasıl topladığını ve sunduğunu keşfedin.",
      "og_image": "/og-pages/hakkimizda.jpg",
      "no_index": false
    },
    "iletisim": {
      "title": "İletişim | HaldeFiyat",
      "description": "HaldeFiyat ekibiyle iletişime geçin; soru, öneri ve destek taleplerinizi gönderin.",
      "og_image": "/og-pages/iletisim.jpg",
      "no_index": false
    },
    "firmalar": {
      "title": "Hal Firmaları ve Komisyoncu Rehberi",
      "description": "Türkiye genelindeki hal komisyoncuları, soğuk hava depoları, nakliyeciler ve zirai ilaç firmaları rehberi.",
      "og_image": "/og/default",
      "no_index": false
    },
    "firmalar_liste": {
      "title": "Hal Firmaları ve Komisyoncu Rehberi",
      "description": "Hal komisyoncuları, soğuk hava depoları, nakliyeciler ve zirai ilaç firmalarını şehir ve hizmet türüne göre filtreleyin.",
      "og_image": "/og/default",
      "no_index": false
    },
    "firmalar_sehir": {
      "title": "{{city}} Hal Komisyoncuları {{year}}",
      "description": "{{city}} hal firmaları, komisyoncuları, adres ve telefon bilgileri. Şehir bazlı firma rehberini güncel kayıtlarla inceleyin.",
      "og_image": "/og/default",
      "no_index": false
    },
    "firmalar_tip": {
      "title": "{{type}} Firmaları ve İletişim Rehberi",
      "description": "{{type}} kategorisindeki firmaları şehir, adres ve telefon bilgilerine göre karşılaştırın.",
      "og_image": "/og/default",
      "no_index": false
    },
    "firmalar_sehir_tip": {
      "title": "{{city}} {{type}} Firmaları {{year}}",
      "description": "{{city}} {{type}} firmaları: aktif kayıtlar, adres, telefon ve firma profilleri.",
      "og_image": "/og/default",
      "no_index": false
    },
    "firma_detay": {
      "title": "{{name}} Firma Profili",
      "description": "{{name}} adres, telefon ve firma bilgileri. Şehir ve kategori bazlı hal firma rehberi.",
      "og_image": "/og/default",
      "no_index": false
    },
    "giris": {
      "title": "Giriş Yap | HaldeFiyat",
      "description": "HaldeFiyat hesabınıza giriş yapın.",
      "og_image": "/og-pages/giris.jpg",
      "no_index": true
    },
    "kayit": {
      "title": "Kayıt Ol | HaldeFiyat",
      "description": "HaldeFiyata üye olun.",
      "og_image": "/og-pages/kayit.jpg",
      "no_index": true
    },
    "favoriler": {
      "title": "Favori Ürünlerim",
      "description": "Favori ürünleriniz için güncel hal fiyatlarını tek ekranda takip edin.",
      "og_image": "/og-pages/favoriler.jpg",
      "no_index": true
    },
    "api_docs": {
      "title": "API Dokümantasyonu",
      "description": "HaldeFiyat açık API — fiyat verileri, hal listesi, haftalık endeks ve daha fazlası.",
      "og_image": "/og-pages/api_docs.jpg",
      "no_index": true
    },
    "gizlilik_politikasi": {
      "title": "Gizlilik Politikası | HaldeFiyat",
      "description": "HaldeFiyat gizlilik politikası ve kişisel verilerin korunmasına ilişkin bilgilendirme.",
      "og_image": "/og-pages/gizlilik_politikasi.jpg",
      "no_index": false
    },
    "kullanim_kosullari": {
      "title": "Kullanım Koşulları | HaldeFiyat",
      "description": "HaldeFiyat kullanım koşulları ve platform kullanımına ilişkin kurallar.",
      "og_image": "/og-pages/kullanim_kosullari.jpg",
      "no_index": false
    },
    "kvkk": {
      "title": "KVKK Aydınlatma Metni | HaldeFiyat",
      "description": "HaldeFiyat KVKK aydınlatma metni ve kişisel veri işleme süreçleri.",
      "og_image": "/og-pages/kvkk.jpg",
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
