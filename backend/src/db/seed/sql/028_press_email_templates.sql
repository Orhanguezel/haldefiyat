SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO email_templates
  (id, template_key, template_name, subject, content_html, variables, is_active)
VALUES
  (
    UUID(),
    'press_release_launch',
    'Basın Bülteni — HaldeFiyat Lansmanı',
    'HaldeFiyat: Türkiye geneli ücretsiz hal fiyat platformu yayında',
    '<p>Merhaba,</p><p>Türkiye genelindeki resmi toptancı hal fiyatlarını günlük olarak derleyen bağımsız veri platformu <strong>HaldeFiyat</strong> yayında.</p><p>Platform; üretici, tüccar, araştırmacı, medya ve tüketiciler için şehir bazlı fiyat takibi, haftalık analizler, endeks görünümü ve API dokümantasyonu sunuyor.</p><p>Medya kiti: <a href="{{press_url}}">{{press_url}}</a><br>Haftalık analizler: <a href="{{analysis_url}}">{{analysis_url}}</a><br>API dokümantasyonu: <a href="{{api_docs_url}}">{{api_docs_url}}</a></p><p>Bilgi almak veya veri örneği istemek isterseniz memnuniyetle paylaşırız.</p><p>Saygılar,<br>HaldeFiyat Ekibi</p>',
    '["press_url","analysis_url","api_docs_url"]',
    1
  ),
  (
    UUID(),
    'annual_report_release',
    'Basın Bülteni — Yıllık Fiyat Raporu',
    'Türkiye Hal Fiyatları Yıllık Raporu yayımlandı',
    '<p>Merhaba,</p><p><strong>HaldeFiyat</strong>, Türkiye genelindeki hal fiyat verilerinden hazırlanan yıllık fiyat raporunu yayımladı.</p><p>Raporda yılın en çok artan/düşen ürünleri, şehir bazlı fiyat farkları, sezonluk hareketler ve haftalık endeks görünümü özetleniyor.</p><p>Rapor bağlantısı: <a href="{{report_url}}">{{report_url}}</a><br>Medya kiti: <a href="{{press_url}}">{{press_url}}</a></p><p>Haberleştirme için tablo/grafik veya ek veri gerekirse yardımcı olabiliriz.</p><p>Saygılar,<br>HaldeFiyat Ekibi</p>',
    '["report_url","press_url"]',
    1
  ),
  (
    UUID(),
    'weekly_index_story_pitch',
    'Haber Önerisi — Haftalık HaldeFiyat Endeksi',
    'Bu hafta hal fiyatlarında öne çıkan ürünler: {{week_title}}',
    '<p>Merhaba,</p><p>Bu haftaki HaldeFiyat analizinde resmi hal verilerine göre fiyatı en çok değişen ürünler ve HaldeFiyat Endeksi görünümü öne çıkıyor.</p><p><strong>Hafta başlığı:</strong> {{week_title}}</p><p>Analiz bağlantısı: <a href="{{analysis_url}}">{{analysis_url}}</a><br>Endeks bağlantısı: <a href="{{index_url}}">{{index_url}}</a></p><p>Kısa haber, grafik veya ürün bazlı veri kırılımı için ek bilgi paylaşabiliriz.</p><p>Saygılar,<br>HaldeFiyat Ekibi</p>',
    '["week_title","analysis_url","index_url"]',
    1
  )
ON DUPLICATE KEY UPDATE
  template_name = VALUES(template_name),
  subject = VALUES(subject),
  content_html = VALUES(content_html),
  variables = VALUES(variables),
  is_active = VALUES(is_active),
  updated_at = CURRENT_TIMESTAMP(3);
