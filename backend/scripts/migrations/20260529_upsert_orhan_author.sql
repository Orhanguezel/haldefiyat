SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO hf_authors
  (slug, full_name, title, bio, expertise, credentials, avatar_url, social_links, email, is_active, display_order)
VALUES
  ('orhan-guzel', 'Orhan Güzel', 'Veri ve Piyasa Analisti',
   'Orhan Güzel, HaldeFiyat üzerinde Türkiye toptancı hal fiyatlarını, ürün bazlı fiyat hareketlerini ve piyasa trendlerini veri odaklı analiz eder.',
   JSON_ARRAY('hal fiyatları', 'veri analizi', 'piyasa analizi', 'tarım ekonomisi'),
   'HaldeFiyat kurucu ekibi; veri, SEO ve piyasa analiz operasyonu',
   'https://lh3.googleusercontent.com/a/ACg8ocJRYNVtjOyld6L1_zH6Y36Wfx2Jud4kOlMKJswEicA1fXU7KxMF8w=s96-c',
   JSON_OBJECT(), 'orhanguzell@gmail.com', 1, 5)
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  title = VALUES(title),
  bio = VALUES(bio),
  expertise = VALUES(expertise),
  credentials = VALUES(credentials),
  avatar_url = VALUES(avatar_url),
  email = VALUES(email),
  is_active = VALUES(is_active),
  display_order = VALUES(display_order);

UPDATE hf_analysis_reports
SET
  author_id = (SELECT id FROM hf_authors WHERE slug = 'orhan-guzel' LIMIT 1),
  author = 'Orhan Güzel'
WHERE status IN ('draft', 'published', 'archived');
