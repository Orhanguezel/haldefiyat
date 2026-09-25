-- Basın e-postalarının tek kaynak marka ve imza ayarı.
INSERT INTO site_settings (id, `key`, locale, value, created_at, updated_at)
VALUES (
  UUID(),
  'press_email_branding',
  '*',
  '{"logoUrl":"https://haldefiyat.com/logohaldefiyat_dark_theme.png","logoAlt":"HaldeFiyat","tagline":"Türkiye hal fiyatları ve tarım verileri","signatureName":"HaldeFiyat Veri Ekibi","signatureTitle":"Basın ve veri iletişimi","email":"info@gzlteknoloji.com","website":"https://haldefiyat.com","accentColor":"#166534"}',
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE updated_at = updated_at;
